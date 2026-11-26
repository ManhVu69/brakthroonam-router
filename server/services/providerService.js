// Definition of 3 primary supported AI providers with Model Tiers
const PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Antigravity & AI Studio',
    description: 'Hỗ trợ toàn bộ dải Gemini 3.8, 3.5, 2.5, 2.0, 1.5 Pro & Flash via Google OAuth hoặc API Key',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    authTypes: ['oauth', 'api_key'],
    models: [
      // Tier 1: Antigravity Flagship & Deep Thinking Suite
      { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6 (Thinking)', tier: 1, ctx: '200K' },
      { id: 'claude-opus-4.6', name: 'Claude Opus 4.6 (Thinking)', tier: 1, ctx: '200K' },
      { id: 'gemini-4-argon', name: 'Gemini 4 Argon (Next-Gen)', tier: 1, ctx: '2.0M' },
      { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash High (Deep Thinking)', tier: 1, ctx: '1.0M' },
      { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash Medium (Fast Reasoning)', tier: 1, ctx: '1.0M' },
      { id: 'gemini-3.8-pro', name: 'Gemini 3.8 Pro (Heavy Code Reasoning)', tier: 1, ctx: '2.0M' },
      { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking Exp', tier: 1, ctx: '1.0M' },

      // Tier 2: Standard, Balanced & Open-Source Heavyweights
      { id: 'gpt-oss-120b', name: 'GPT-OSS 120B (Medium)', tier: 2, ctx: '128K' },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Balanced Standard)', tier: 2, ctx: '1.0M' },
      { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash Low (Rapid Response)', tier: 2, ctx: '500K' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tier: 2, ctx: '1.0M' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (2.0M Long Context)', tier: 2, ctx: '2.0M' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Google Vertex)', tier: 2, ctx: '200K' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (2.0M Long Context)', tier: 2, ctx: '2.0M' },

      // Tier 3: High Speed, Economy & Safety Fallback
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Sub-second)', tier: 3, ctx: '1.0M' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Standard Speed)', tier: 3, ctx: '1.0M' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-gen Fast)', tier: 3, ctx: '1.0M' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Safety Net)', tier: 3, ctx: '1.0M' },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B (Ultra Lightweight)', tier: 3, ctx: '1.0M' },
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (Auto Alias)', tier: 3, ctx: '1.0M' }
    ]
  },
  codex: {
    id: 'codex',
    name: 'OpenAI Codex',
    badge: 'GPT & Reasoning',
    description: 'GPT-6.2 Sol, GPT-6.2 Astra, GPT-4o, o1, o3-mini via OpenAI API hoặc Codex Session',
    defaultBaseUrl: 'https://api.openai.com/v1',
    authTypes: ['api_key', 'oauth'],
    models: [
      { id: 'gpt-6.2-sol-wm', name: 'GPT-6.2 Sol (Deep Thinking & Speed)', tier: 1, ctx: '262K' },
      { id: 'gpt-6.2-astra-wm', name: 'GPT-6.2 Astra (Heavy Research & Reasoning)', tier: 1, ctx: '262K' },
      { id: 'gpt-6-2', name: 'GPT-6.2 (Next-Gen Multimodal)', tier: 1, ctx: '262K' },
      { id: 'gpt-6-sol-wm', name: 'GPT-6 Sol (High-speed Reasoning)', tier: 1, ctx: '262K' },
      { id: 'gpt-5.6-sol-wm', name: 'GPT-5.6 Sol (Balanced Coding)', tier: 2, ctx: '262K' },
      { id: 'o1', name: 'o1 (Deep STEM & coding reasoning)', tier: 1, ctx: '200K' },
      { id: 'o3-mini', name: 'o3-mini (High-speed reasoning)', tier: 1, ctx: '200K' },
      { id: 'gpt-4o', name: 'GPT-4o (High intelligence multimodal)', tier: 1, ctx: '128K' },
      { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview (Large capacity)', tier: 1, ctx: '128K' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & economical)', tier: 2, ctx: '128K' },
      { id: 'o1-mini', name: 'o1 Mini (Fast STEM reasoning)', tier: 2, ctx: '128K' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', tier: 3, ctx: '128K' }
    ]
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    badge: 'Anthropic Official',
    description: 'Claude 3.7 Sonnet (Hybrid), Claude 3.5 Sonnet, 3.5 Haiku & Opus',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    authTypes: ['oauth', 'api_key'],
    models: [
      { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid reasoning)', tier: 1, ctx: '200K' },
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (Coding champion)', tier: 1, ctx: '200K' },
      { id: 'claude-3-opus-latest', name: 'Claude 3 Opus (Complex reasoning)', tier: 1, ctx: '200K' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Sub-second response)', tier: 2, ctx: '200K' }
    ]
  }
};

function getAllProviders() {
  return Object.values(PROVIDERS);
}

function getProviderById(id) {
  // Map 'antigravity' alias to 'gemini'
  if (id === 'antigravity') return PROVIDERS.gemini;
  return PROVIDERS[id] || null;
}

function getAllCatalogModels() {
  const models = [];
  for (const p of Object.values(PROVIDERS)) {
    for (const m of p.models) {
      models.push({
        ...m,
        provider: p.id,
        providerName: p.name
      });
    }
  }
  // Sort models by tier ASC (Tier 1 first, then Tier 2, then Tier 3)
  return models.sort((a, b) => a.tier - b.tier);
}

function detectProviderForModel(modelName) {
  const m = modelName.toLowerCase();

  // Check provider catalog first
  if (PROVIDERS.gemini.models.some(x => x.id.toLowerCase() === m)) {
    return 'gemini';
  }
  if (PROVIDERS.codex.models.some(x => x.id.toLowerCase() === m)) {
    return 'codex';
  }
  if (PROVIDERS.claude.models.some(x => x.id.toLowerCase() === m)) {
    return 'claude';
  }

  if (m.includes('4.6') || m.includes('argon') || m.includes('gpt-oss') || m.startsWith('ag/') || m.includes('gemini') || m.includes('antigravity') || m.includes('vertex')) {
    return 'gemini';
  }
  if (m.startsWith('cx/') || m.includes('gpt-') || m.includes('o1') || m.includes('o3') || m.includes('codex') || m.includes('sol') || m.includes('astra') || m.includes('terra') || m.includes('luna') || m.includes('6.2') || m.includes('5.6')) {
    return 'codex';
  }
  if (m.includes('claude')) {
    return 'claude';
  }
  return 'gemini'; // fallback
}

/**
 * Universal Model Mapping: Map any model from any client app to the target provider's best equivalent
 */
function mapModelToProviderModel(sourceModel, targetProvider) {
  const m = (sourceModel || '').toLowerCase();

  if (targetProvider === 'gemini') {
    // If it's already a valid Gemini catalog model, keep it
    if (PROVIDERS.gemini.models.some(x => x.id.toLowerCase() === m)) {
      return sourceModel;
    }
    // High reasoning / Deep thinking coding models
    if (m.includes('sol') || m.includes('reason') || m.includes('opus') || m.includes('o1') || m.includes('o3') || m.includes('pro')) {
      return 'gemini-3.8-flash-high';
    }
    // High-speed / Economy default
    return 'gemini-3.8-flash';
  }

  if (targetProvider === 'codex') {
    if (PROVIDERS.codex.models.some(x => x.id.toLowerCase() === m)) {
      return sourceModel;
    }
    if (m.includes('mini') || m.includes('flash') || m.includes('lite') || m.includes('low') || m.includes('haiku')) {
      return 'gpt-4o-mini';
    }
    return 'gpt-4o';
  }

  if (targetProvider === 'claude') {
    if (PROVIDERS.claude.models.some(x => x.id.toLowerCase() === m)) {
      return sourceModel;
    }
    if (m.includes('haiku') || m.includes('mini') || m.includes('flash') || m.includes('lite') || m.includes('low')) {
      return 'claude-3-5-haiku-latest';
    }
    return 'claude-3-7-sonnet';
  }

  return sourceModel;
}

/**
 * Build dynamic multi-tier fallback candidate chain across providers
 * Strictly filters out providers without any active accounts to prevent false 502 exhaustion errors.
 */
function buildCandidateRouteChain(requestedModel) {
  const { getActiveAccountsForProvider } = require('./accountService');
  const primaryProvider = detectProviderForModel(requestedModel);
  const chain = [];

  // Tier 1: Primary detected provider with original model
  chain.push({
    providerId: primaryProvider,
    model: requestedModel
  });

  // Providers order for auto-fallback
  const fallbackProviders = ['gemini', 'claude', 'codex'].filter(p => p !== primaryProvider);

  for (const p of fallbackProviders) {
    const accounts = getActiveAccountsForProvider(p);
    // ONLY include providers that actually have configured active accounts!
    if (accounts && accounts.length > 0) {
      const targetModel = mapModelToProviderModel(requestedModel, p);
      chain.push({
        providerId: p,
        model: targetModel
      });

      // For Gemini, also append standard gemini-3.8-flash as secondary safety net
      if (p === 'gemini' && targetModel !== 'gemini-3.8-flash') {
        chain.push({
          providerId: 'gemini',
          model: 'gemini-3.8-flash'
        });
      }
    }
  }

  return chain;
}

module.exports = {
  PROVIDERS,
  getAllProviders,
  getProviderById,
  getAllCatalogModels,
  detectProviderForModel,
  mapModelToProviderModel,
  buildCandidateRouteChain
};
