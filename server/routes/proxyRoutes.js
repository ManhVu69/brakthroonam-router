const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { getComboByName, listCombos } = require('../services/comboService');
const { detectProviderForModel, getAllCatalogModels, buildCandidateRouteChain } = require('../services/providerService');
const { getActiveAccountsForProvider, recordAccountSuccess, recordAccountError } = require('../services/accountService');
const { handleQuotaExhausted } = require('../services/antigravitySyncService');
const { callGemini, callOpenAiCompatible, callClaude } = require('../services/upstreamAdapter');
const { logUsage, addActiveRequest, removeActiveRequest } = require('../services/usageService');

// Auth middleware for /v1 routes
function checkApiKey(req, res, next) {
  const db = getDb();
  const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get();
  const config = settingsRow ? JSON.parse(settingsRow.value) : { requireApiKey: false };

  if (!config.requireApiKey) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!apiKey) {
    return res.status(401).json({
      error: { message: 'Missing API Key in Authorization header', type: 'authentication_error' }
    });
  }

  const validKey = db.prepare("SELECT * FROM api_keys WHERE key = ? AND is_active = 1").get(apiKey);
  if (!validKey) {
    return res.status(401).json({
      error: { message: 'Invalid API Key', type: 'authentication_error' }
    });
  }

  next();
}

/**
 * GET /v1/models: List available models including all combos and catalog models
 */
router.get('/models', checkApiKey, (req, res) => {
  const models = [];
  const catalogModels = getAllCatalogModels();

  // Add catalog models sorted by Tier
  for (const m of catalogModels) {
    models.push({
      id: m.id,
      object: 'model',
      created: 1700000000,
      owned_by: m.provider,
      name: m.name,
      tier: m.tier,
      context_window: m.ctx
    });
  }

  // Add combos
  const combos = listCombos();
  for (const c of combos) {
    models.push({
      id: c.name,
      object: 'model',
      created: 1700000000,
      owned_by: 'ai-router-combo',
      description: `Virtual Combo with ${c.models.length} fallback models: ${c.models.join(' → ')}`,
      models: c.models
    });
  }

  res.json({ object: 'list', data: models });
});

/**
 * POST /v1/chat/completions: OpenAI compatible chat completion with 2-Tier Fallback Loop
 * 
 * 2-Tier Fallback Algorithm:
 * - Outer Loop: Iterate through Combo models in priority order (Model 1 -> Model 2 -> Model 3...).
 * - Inner Loop: For each model, attempt with Account 1. If Account 1 hits rate-limit (429) or fails,
 *   rotate to Account 2 on the SAME model.
 * - Only when all accounts for Model 1 are exhausted does it cascade down to Model 2.
 */
/**
 * Unified Chat Completion and OpenAI Responses Handler with 2-Tier Fallback Loop
 */
async function handleChatOrResponse(req, res, isResponses = false) {
  const startTime = Date.now();
  const requestId = 'req_' + Math.random().toString(36).substring(2, 10);
  const requestedModel = req.body.model || (isResponses ? 'gpt-5.6-sol' : 'gemini-3.8-flash-high');

  // Normalize Responses API input to standard messages if needed
  if (isResponses && req.body.input && !req.body.messages) {
    if (Array.isArray(req.body.input)) {
      req.body.messages = req.body.input.map(item => ({
        role: item.role || 'user',
        content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content)
      }));
    } else if (typeof req.body.input === 'string') {
      req.body.messages = [{ role: 'user', content: req.body.input }];
    }
  }

  // 1. Resolve Combos or build universal dynamic candidate chain
  const combo = getComboByName(requestedModel);
  let candidateChain = [];
  if (combo && combo.models.length > 0) {
    candidateChain = combo.models.map(m => ({
      providerId: detectProviderForModel(m),
      model: m
    }));
  } else {
    candidateChain = buildCandidateRouteChain(requestedModel);
  }

  let lastError = null;
  let requestHandled = false;

  // Outer Loop: Cross-Provider Candidate Fallback Chain
  for (let cIdx = 0; cIdx < candidateChain.length; cIdx++) {
    const candidate = candidateChain[cIdx];
    const currentModel = candidate.model;
    const providerId = candidate.providerId;
    const activeAccounts = getActiveAccountsForProvider(providerId);

    if (!activeAccounts || activeAccounts.length === 0) {
      lastError = new Error(`No active accounts configured for provider '${providerId}' (model: ${currentModel})`);
      continue;
    }

    // Inner Loop: Account Rotation for the current model
    for (let aIdx = 0; aIdx < activeAccounts.length; aIdx++) {
      const account = activeAccounts[aIdx];
      const accountIdentifier = account.email || account.name;
      const agentRole = requestedModel.includes('plan') ? 'planner'
        : requestedModel.includes('code') ? 'coder'
        : requestedModel.includes('test') ? 'tester'
        : requestedModel.includes('review') ? 'reviewer'
        : 'general';

      // Track active request for Glowing Topology Graph
      addActiveRequest(requestId, {
        provider: providerId,
        accountName: accountIdentifier,
        model: currentModel,
        requestedModel,
        agentRole
      });

      // Set routing diagnostic headers for UI inspector
      try {
        res.setHeader('X-AI-Router-Account', accountIdentifier);
        res.setHeader('X-AI-Router-Model', currentModel);
        res.setHeader('X-AI-Router-Provider', providerId);
        res.setHeader('X-AI-Router-Role', agentRole);
        res.setHeader('Access-Control-Expose-Headers', 'X-AI-Router-Account, X-AI-Router-Model, X-AI-Router-Provider, X-AI-Router-Role');
      } catch (_) {}

      try {
        let tokenStats = { promptTokens: 0, completionTokens: 0 };

        // Dispatch to provider adapter
        if (providerId === 'gemini') {
          tokenStats = await callGemini(account, currentModel, req.body, res, isResponses);
        } else if (providerId === 'claude') {
          tokenStats = await callClaude(account, currentModel, req.body, res);
        } else {
          // codex or custom
          tokenStats = await callOpenAiCompatible(account, currentModel, req.body, res, isResponses);
        }

        // Request succeeded! Record usage and success
        removeActiveRequest(requestId);
        recordAccountSuccess(account.id);

        const durationMs = Date.now() - startTime;
        logUsage({
          provider: providerId,
          account_id: account.id,
          account_name: accountIdentifier,
          model: currentModel,
          requested_model: requestedModel,
          agent_role: agentRole,
          prompt_tokens: tokenStats.promptTokens,
          completion_tokens: tokenStats.completionTokens,
          duration_ms: durationMs,
          status: 'ok'
        });

        requestHandled = true;
        return; // Complete!
      } catch (err) {
        removeActiveRequest(requestId);
        console.warn(`[Universal Router] Candidate '${providerId}/${currentModel}' failed on account '${accountIdentifier}': ${err.message}`);
        recordAccountError(account.id, err.message);

        const isQuotaErr = err.status === 429 || 
          String(err.message).includes('429') || 
          String(err.message).includes('RESOURCE_EXHAUSTED') || 
          String(err.message).toLowerCase().includes('quota');

        if (isQuotaErr) {
          console.warn(`[Universal Router] Quota limit triggered on ${accountIdentifier}. Executing automated failover...`);
          handleQuotaExhausted(account.id, currentModel);
        }

        lastError = err;

        // If streaming headers were already sent to client, cannot fallback mid-stream
        if (res.headersSent) {
          return;
        }

        // Rotate to next account in inner loop!
        continue;
      }
    }

    // All accounts exhausted for current candidate, outer loop cascades to next provider in candidate chain
    console.warn(`[Universal Router] All accounts failed for '${providerId}' (${currentModel}), auto-bridging to next provider in fallback chain...`);
  }

  // If all models and accounts in the combo failed
  if (!res.headersSent && !requestHandled) {
    res.status(502).json({
      error: {
        message: `All models and accounts in combo failed. Last error: ${lastError ? lastError.message : 'No accounts available'}`,
        type: 'router_exhaustion_error'
      }
    });
  }
}

/**
 * POST /v1/chat/completions: OpenAI compatible chat completion with 2-Tier Fallback Loop
 */
router.post('/chat/completions', checkApiKey, (req, res) => {
  return handleChatOrResponse(req, res, false);
});

/**
 * POST /v1/responses: OpenAI Responses API (native protocol for OpenAI Codex CLI/Desktop)
 */
router.post('/responses', checkApiKey, (req, res) => {
  return handleChatOrResponse(req, res, true);
});

module.exports = router;
