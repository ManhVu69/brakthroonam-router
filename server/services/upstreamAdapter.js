const https = require('https');
const http = require('http');
const fs = require('fs');
const dns = require('dns').promises;
const googleAuthService = require('./googleAuthService');
const { getDb } = require('../db');

// DNS Resolver with fallback to public DNS to bypass localhost hosts entries
const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['8.8.8.8', '1.1.1.1']);
const resolvedGoogleIps = {};

async function resolveDirectHost(hostname) {
  if (hostname === 'cloudcode-pa.googleapis.com' || hostname === 'daily-cloudcode-pa.googleapis.com') {
    if (resolvedGoogleIps[hostname] && (Date.now() - resolvedGoogleIps[hostname].ts < 300000)) {
      return resolvedGoogleIps[hostname].ip;
    }
    try {
      const ips = await dnsResolver.resolve4(hostname);
      if (ips && ips.length > 0) {
        resolvedGoogleIps[hostname] = { ip: ips[0], ts: Date.now() };
        return ips[0];
      }
    } catch (_) {}
  }
  return hostname;
}

/**
 * Perform an HTTP request with streaming support
 */
async function makeRequest(urlStr, options, bodyData) {
  const url = new URL(urlStr);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;
  const targetIp = await resolveDirectHost(url.hostname);

  return new Promise((resolve, reject) => {
    const reqHeaders = { ...(options.headers || {}) };
    if (targetIp !== url.hostname) {
      reqHeaders['Host'] = url.hostname;
    }

    const reqOptions = {
      method: options.method || 'POST',
      hostname: targetIp,
      servername: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: reqHeaders,
      rejectUnauthorized: false
    };

    const req = client.request(reqOptions, (res) => {
      resolve(res);
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

/**
 * Convert OpenAI Chat Completion messages to Gemini contents format
 */
function openAiToGemini(body) {
  const contents = [];
  let systemInstruction = null;

  const messages = body.messages || (Array.isArray(body.input) ? body.input : (body.input ? [{ role: 'user', content: body.input }] : []));

  for (const msg of messages) {
    const rawContent = msg.content !== undefined ? msg.content : (msg.text || '');
    const textContent = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    if (msg.role === 'system' || msg.role === 'developer') {
      systemInstruction = { parts: [{ text: textContent }] };
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: textContent }]
      });
    }
  }

  // Fallback if still empty
  if (contents.length === 0) {
    const fallbackText = body.prompt || (typeof body.input === 'string' ? body.input : 'hello');
    contents.push({ role: 'user', parts: [{ text: fallbackText }] });
  }

  const geminiPayload = {
    contents,
    generationConfig: {
      temperature: body.temperature !== undefined ? body.temperature : 0.7,
      maxOutputTokens: body.max_tokens || body.max_completion_tokens || 8192
    }
  };

  if (systemInstruction) {
    geminiPayload.systemInstruction = systemInstruction;
  }

  return geminiPayload;
}

/**
 * Refresh OpenAI / Codex OAuth Access Token
 */
async function refreshOpenAIAccessToken(refreshToken) {
  if (!refreshToken) return null;
  try {
    const res = await fetch('https://auth.openai.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'app_EMoamEEZ73f0CkXaXp7hrann',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
  } catch (err) {
    console.error('[TokenRefresh] Failed to refresh OpenAI token:', err.message);
    return null;
  }
}

/**
 * Ensure account OAuth token is valid, refreshing if needed
 */
async function resolveAccountToken(account) {
  if (account.auth_type === 'oauth') {
    let creds = {};
    try {
      creds = typeof account.credentials === 'string' ? JSON.parse(account.credentials) : (account.credentials || {});
    } catch (e) {}

    const isExpired = creds.expiresAt && Date.now() > (creds.expiresAt - 60000);
    if (isExpired && creds.refreshToken) {
      try {
        if (account.provider === 'codex') {
          const renewed = await refreshOpenAIAccessToken(creds.refreshToken);
          if (renewed) {
            creds.accessToken = renewed.accessToken;
            creds.expiresAt = renewed.expiresAt;
            const db = getDb();
            db.prepare("UPDATE provider_accounts SET credentials = ? WHERE id = ?").run(JSON.stringify(creds), account.id);
          }
        } else {
          const renewed = await googleAuthService.refreshAccessToken(creds.refreshToken);
          creds.accessToken = renewed.access_token;
          creds.expiresAt = Date.now() + (renewed.expires_in || 3600) * 1000;
          const db = getDb();
          db.prepare("UPDATE provider_accounts SET credentials = ? WHERE id = ?").run(JSON.stringify(creds), account.id);
        }
      } catch (rfErr) {
        console.error('[TokenRefresh] Error refreshing OAuth token:', rfErr.message);
      }
    }
    return { token: creds.accessToken, isOAuth: true, projectId: creds.projectId };
  }
  return { token: account.api_key, isOAuth: false };
}

/**
 * Forward request to Google Gemini API (supports both API Key & Google OAuth)
 */
async function callGemini(account, model, body, clientRes, isResponses = false) {
  const isStream = !!body.stream;
  const cleanModel = model.replace(/^ag\//, '').replace(/^gemini\//, '');

  // 1. Chuyển tiếp tới Google API bằng Token OAuth đã lưu (hoặc API Key nếu có)
  const { token, isOAuth, projectId } = await resolveAccountToken(account);
  let mappedModel = cleanModel;
  let thinkingBudget = 0;
  if (cleanModel.endsWith('-high')) {
    mappedModel = cleanModel.replace(/-high$/, '');
    thinkingBudget = 64000;
  } else if (cleanModel.endsWith('-medium')) {
    mappedModel = cleanModel.replace(/-medium$/, '');
    thinkingBudget = 32000;
  } else if (cleanModel.endsWith('-low')) {
    mappedModel = cleanModel.replace(/-low$/, '');
    thinkingBudget = 8000;
  }

  // Universal mapping to supported Gemini models if foreign model name was passed
  const { mapModelToProviderModel } = require('./providerService');
  mappedModel = mapModelToProviderModel(mappedModel, 'gemini');

  const GOOGLE_ALIASES = {
    'gemini-3.8-flash': 'gemini-3.8-flash-medium',
    'gemini-3.8-flash-medium': 'gemini-3.8-flash-medium',
    'gemini-3.8-flash-high': 'gemini-3.8-flash-high',
    'gemini-3.8-flash-low': 'gemini-3.8-flash-low',
    'claude-sonnet-4.6': 'claude-sonnet-4-6',
    'claude-opus-4.6': 'claude-opus-4-6-thinking',
    'gpt-oss-120b': 'gpt-oss-120b-medium'
  };
  const effectiveGoogleModel = GOOGLE_ALIASES[mappedModel] || mappedModel;

  let url;
  const headers = { 'Content-Type': 'application/json' };
  const geminiBody = openAiToGemini(body);
  if (thinkingBudget > 0) {
    geminiBody.generationConfig = geminiBody.generationConfig || {};
    geminiBody.generationConfig.thinkingConfig = { thinkingBudget };
  }

  let requestPayload;
  if (isOAuth) {
    const method = isStream ? 'streamGenerateContent?alt=sse' : 'generateContent';
    url = `https://daily-cloudcode-pa.googleapis.com/v1internal:${method}`;
    headers['Authorization'] = `Bearer ${token}`;
    headers['User-Agent'] = 'antigravity/hub/2.24.0 win32/x64';
    headers['X-Client-Name'] = 'antigravity';
    headers['X-Client-Version'] = '2.24.0';

    requestPayload = {
      project: projectId || 'aicode-consumers',
      model: effectiveGoogleModel,
      request: geminiBody
    };
  } else {
    const method = isStream ? 'streamGenerateContent?alt=sse&key=' : 'generateContent?key=';
    url = `https://generativelanguage.googleapis.com/v1beta/models/${mappedModel}:${method}${token}`;
    requestPayload = geminiBody;
  }

  const upstreamRes = await makeRequest(url, {
    method: 'POST',
    headers
  }, requestPayload);

  let promptTokens = Math.ceil(JSON.stringify(body.messages || []).length / 4);
  let completionTokens = 0;

  if (upstreamRes.statusCode >= 400) {
    let errText = '';
    for await (const chunk of upstreamRes) errText += chunk.toString();
    const err = new Error(`Gemini upstream error ${upstreamRes.statusCode}: ${errText}`);
    err.status = upstreamRes.statusCode;
    throw err;
  }

  if (isStream) {
    clientRes.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const respId = 'resp_' + Math.random().toString(36).substring(2, 12);
    const msgItemId = 'msg_' + Math.random().toString(36).substring(2, 12);
    let accumulatedText = '';

    if (isResponses) {
      // 1. Initial response.created event
      clientRes.write(`data: ${JSON.stringify({
        type: 'response.created',
        response: {
          id: respId,
          object: 'response',
          status: 'in_progress',
          output: []
        }
      })}\n\n`);

      // 2. output_item.added event
      clientRes.write(`data: ${JSON.stringify({
        type: 'response.output_item.added',
        response_id: respId,
        output_index: 0,
        item: {
          id: msgItemId,
          type: 'message',
          status: 'in_progress',
          role: 'assistant',
          content: []
        }
      })}\n\n`);

      // 3. content_part.added event
      clientRes.write(`data: ${JSON.stringify({
        type: 'response.content_part.added',
        response_id: respId,
        item_id: msgItemId,
        output_index: 0,
        content_index: 0,
        part: {
          type: 'output_text',
          text: ''
        }
      })}\n\n`);
    }

    for await (const chunk of upstreamRes) {
      const text = chunk.toString();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const rawData = JSON.parse(line.substring(6));
            const data = rawData.response || rawData;
            if (data.usageMetadata) {
              promptTokens = data.usageMetadata.promptTokenCount || promptTokens;
              completionTokens = data.usageMetadata.candidatesTokenCount || completionTokens;
            }
            const parts = data.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              const chunkText = part.text || '';
              if (chunkText) {
                accumulatedText += chunkText;
                if (isResponses) {
                  const respChunk = {
                    type: 'response.output_text.delta',
                    response_id: respId,
                    item_id: msgItemId,
                    output_index: 0,
                    content_index: 0,
                    delta: chunkText
                  };
                  clientRes.write(`data: ${JSON.stringify(respChunk)}\n\n`);
                } else {
                  const isThought = !!part.thought;
                  const openAiChunk = {
                    id: 'chatcmpl-' + Date.now(),
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model,
                    account: account.email || account.name,
                    choices: [{
                      index: 0,
                      delta: isThought ? { reasoning_content: chunkText } : { content: chunkText },
                      finish_reason: null
                    }]
                  };
                  clientRes.write(`data: ${JSON.stringify(openAiChunk)}\n\n`);
                }
              }
            }
          } catch (e) {}
        }
      }
    }

    if (isResponses) {
      // 4. output_text.done
      clientRes.write(`data: ${JSON.stringify({
        type: 'response.output_text.done',
        response_id: respId,
        item_id: msgItemId,
        output_index: 0,
        content_index: 0,
        text: accumulatedText
      })}\n\n`);

      // 5. content_part.done
      clientRes.write(`data: ${JSON.stringify({
        type: 'response.content_part.done',
        response_id: respId,
        item_id: msgItemId,
        output_index: 0,
        content_index: 0,
        part: {
          type: 'output_text',
          text: accumulatedText
        }
      })}\n\n`);

      // 6. output_item.done
      clientRes.write(`data: ${JSON.stringify({
        type: 'response.output_item.done',
        response_id: respId,
        output_index: 0,
        item: {
          id: msgItemId,
          type: 'message',
          status: 'completed',
          role: 'assistant',
          content: [{
            type: 'output_text',
            text: accumulatedText
          }]
        }
      })}\n\n`);

      // 7. response.completed & response.done
      const doneEvent = {
        type: 'response.completed',
        response: {
          id: respId,
          object: 'response',
          status: 'completed',
          output: [{
            id: msgItemId,
            type: 'message',
            status: 'completed',
            role: 'assistant',
            content: [{
              type: 'output_text',
              text: accumulatedText
            }]
          }],
          usage: {
            input_tokens: promptTokens,
            output_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens
          }
        }
      };
      clientRes.write(`data: ${JSON.stringify(doneEvent)}\n\n`);
      clientRes.write(`data: ${JSON.stringify({
        type: 'response.done',
        response: doneEvent.response
      })}\n\n`);
    } else {
      const finalChunk = {
        id: 'chatcmpl-' + Date.now(),
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens
        }
      };
      clientRes.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
    }
    clientRes.write('data: [DONE]\n\n');
    clientRes.end();
  } else {
    let fullResponse = '';
    for await (const chunk of upstreamRes) fullResponse += chunk.toString();
    const rawData = JSON.parse(fullResponse);
    const data = rawData.response || rawData;

    if (data.usageMetadata) {
      promptTokens = data.usageMetadata.promptTokenCount || promptTokens;
      completionTokens = data.usageMetadata.candidatesTokenCount || 0;
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (isResponses) {
      const respId = 'resp_' + Math.random().toString(36).substring(2, 12);
      const msgItemId = 'msg_' + Math.random().toString(36).substring(2, 12);
      clientRes.status(200).json({
        id: respId,
        object: 'response',
        status: 'completed',
        output: [
          {
            id: msgItemId,
            type: 'message',
            status: 'completed',
            role: 'assistant',
            content: [{ type: 'output_text', text: replyText }]
          }
        ],
        usage: {
          input_tokens: promptTokens,
          output_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens
        }
      });
    } else {
      const openAiResponse = {
        id: 'chatcmpl-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: replyText },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens
        }
      };

      clientRes.status(200).json(openAiResponse);
    }
  }

  return { promptTokens, completionTokens };
}

/**
 * Forward request to OpenAI / Codex
 */
async function callOpenAiCompatible(account, model, body, clientRes, isResponses = false) {
  const baseUrl = account.base_url || 'https://api.openai.com/v1';
  const endpoint = isResponses ? '/responses' : '/chat/completions';
  const url = `${baseUrl.replace(/\/+$/, '')}${endpoint}`;

  let apiKey = account.api_key;
  if (account.auth_type === 'oauth') {
    const resolved = await resolveAccountToken(account);
    apiKey = resolved.token;
  }

  const isStream = !!body.stream;
  const cleanModel = model.replace(/^cx\//, '').replace(/^oc\//, '');
  const forwardBody = { ...body, model: cleanModel };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  if (account.provider === 'codex') {
    headers['originator'] = 'codex_cli_rs';
    headers['User-Agent'] = 'codex_cli_rs/0.1.0';
  }

  const upstreamRes = await makeRequest(url, { method: 'POST', headers }, forwardBody);

  let promptTokens = Math.ceil(JSON.stringify(body.messages || body.input || []).length / 4);
  let completionTokens = 0;

  if (upstreamRes.statusCode >= 400) {
    let errText = '';
    for await (const chunk of upstreamRes) errText += chunk.toString();
    const err = new Error(`OpenAI upstream error ${upstreamRes.statusCode}: ${errText}`);
    err.status = upstreamRes.statusCode;
    throw err;
  }

  if (isStream) {
    clientRes.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    for await (const chunk of upstreamRes) {
      const text = chunk.toString();
      clientRes.write(text);

      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.substring(6));
            if (parsed.usage) {
              promptTokens = parsed.usage.prompt_tokens || parsed.usage.input_tokens || promptTokens;
              completionTokens = parsed.usage.completion_tokens || parsed.usage.output_tokens || completionTokens;
            }
          } catch (e) {}
        }
      }
    }
    clientRes.end();
  } else {
    let fullResponse = '';
    for await (const chunk of upstreamRes) fullResponse += chunk.toString();
    const data = JSON.parse(fullResponse);

    if (data.usage) {
      promptTokens = data.usage.prompt_tokens || data.usage.input_tokens || promptTokens;
      completionTokens = data.usage.completion_tokens || data.usage.output_tokens || 0;
    }

    clientRes.status(200).json(data);
  }

  return { promptTokens, completionTokens };
}

/**
 * Forward request to Anthropic Claude Messages API
 */
async function callClaude(account, model, body, clientRes) {
  const apiKey = account.api_key;
  const isStream = !!body.stream;
  const cleanModel = model.replace(/^claude\//, '');

  let systemPrompt = '';
  const messages = [];

  for (const m of (body.messages || [])) {
    if (m.role === 'system') {
      systemPrompt = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
    } else {
      messages.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      });
    }
  }

  const claudePayload = {
    model: cleanModel,
    messages,
    max_tokens: body.max_tokens || body.max_completion_tokens || 4096,
    temperature: body.temperature !== undefined ? body.temperature : 0.7,
    stream: isStream
  };
  if (systemPrompt) claudePayload.system = systemPrompt;

  const url = 'https://api.anthropic.com/v1/messages';
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  };

  const upstreamRes = await makeRequest(url, { method: 'POST', headers }, claudePayload);

  let promptTokens = Math.ceil(JSON.stringify(body.messages || []).length / 4);
  let completionTokens = 0;

  if (upstreamRes.statusCode >= 400) {
    let errText = '';
    for await (const chunk of upstreamRes) errText += chunk.toString();
    const err = new Error(`Claude upstream error ${upstreamRes.statusCode}: ${errText}`);
    err.status = upstreamRes.statusCode;
    throw err;
  }

  if (isStream) {
    clientRes.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    for await (const chunk of upstreamRes) {
      const text = chunk.toString();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              const openAiChunk = {
                id: 'chatcmpl-' + Date.now(),
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model,
                choices: [{ index: 0, delta: { content: data.delta.text }, finish_reason: null }]
              };
              clientRes.write(`data: ${JSON.stringify(openAiChunk)}\n\n`);
            }
            if (data.type === 'message_delta' && data.usage) {
              completionTokens = data.usage.output_tokens || completionTokens;
            }
            if (data.type === 'message_start' && data.message?.usage) {
              promptTokens = data.message.usage.input_tokens || promptTokens;
            }
          } catch (e) {}
        }
      }
    }

    const finalChunk = {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
      }
    };
    clientRes.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
    clientRes.write('data: [DONE]\n\n');
    clientRes.end();
  } else {
    let fullResponse = '';
    for await (const chunk of upstreamRes) fullResponse += chunk.toString();
    const data = JSON.parse(fullResponse);

    if (data.usage) {
      promptTokens = data.usage.input_tokens || promptTokens;
      completionTokens = data.usage.output_tokens || 0;
    }

    const replyText = data.content?.[0]?.text || '';
    const openAiResponse = {
      id: 'chatcmpl-' + Date.now(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: replyText },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
      }
    };

    clientRes.status(200).json(openAiResponse);
  }

  return { promptTokens, completionTokens };
}

module.exports = {
  callGemini,
  callOpenAiCompatible,
  callClaude
};
