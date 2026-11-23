import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Activity, Zap, CheckCircle2, AlertCircle, Brain, Code2,
  TestTube, ShieldCheck, Play, Send, X, ChevronDown, ChevronUp,
  Terminal, Copy, Check, RefreshCw, Layers, Cpu
} from 'lucide-react';

const COMBO_PALETTE = ['#c084fc', '#38bdf8', '#facc15', '#f87171', '#34d399', '#a78bfa', '#fb923c', '#ec4899'];

// 1. Google Gemini Official Sparkle SVG
function GeminiIconSvg({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"
        fill="url(#topo_gemini_grad)"
      />
      <defs>
        <radialGradient
          id="topo_gemini_grad"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(3 3) rotate(45) scale(26)"
        >
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="40%" stopColor="#9B72CB" />
          <stop offset="70%" stopColor="#D96570" />
          <stop offset="100%" stopColor="#F4B400" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// 2. OpenAI Official Rosette Spiral SVG
function OpenAIIconSvg({ size = 18, color = '#10b981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.08 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.493zm-9.66-4.22a4.47 4.47 0 0 1-.534-3.037l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062l-4.832 2.79a4.5 4.5 0 0 1-6.15-1.622zm-1.89-9.52a4.484 4.484 0 0 1 2.34-1.996v5.665a.792.792 0 0 0 .39.681l5.84 3.37-2.02 1.168a.082.082 0 0 1-.071 0l-4.83-2.79a4.508 4.508 0 0 1-1.65-6.098zm15.908 3.73-5.84-3.37 2.02-1.168a.082.082 0 0 1 .071 0l4.83 2.79a4.5 4.5 0 0 1 1.65 6.098 4.494 4.494 0 0 1-2.34 2v-5.669a.783.783 0 0 0-.391-.681zm2.01-3.69a4.47 4.47 0 0 1 .533 3.037l-.142-.085-4.783-2.759a.771.771 0 0 0-.78 0l-5.843 3.369v-2.332a.08.08 0 0 1 .033-.062l4.832-2.79a4.5 4.5 0 0 1 6.15 1.632zM8.307 8.328l2.02-1.168a.076.076 0 0 1 .077 0l4.832 2.79a4.495 4.495 0 0 1 1.65 6.098 4.48 4.48 0 0 1-2.34 2v-5.665a.792.792 0 0 0-.39-.681zm.996 3.12 2.697-1.558 2.698 1.558v3.114l-2.698 1.558-2.697-1.558z" />
    </svg>
  );
}

// 3. Anthropic Official Asterisk Logo SVG
function ClaudeIconSvg({ size = 18, color = '#D97757' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 2.5v5.2m0 8.6v5.2M2.5 12h5.2m8.6 0h5.2M5.28 5.28l3.68 3.68m6.08 6.08l3.68 3.68M5.28 18.72l3.68-3.68m6.08-6.08l3.68-3.68"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.2" fill={color} />
    </svg>
  );
}

export default function TopologyGraph({ activeRequests = [], recentLogs = [], detectedAgents = [], onRefresh }) {
  const [combosList, setCombosList] = useState([]);
  const [testingRole, setTestingRole] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedRole, setSelectedRole] = useState('combo-code');
  const [liveStream, setLiveStream] = useState(null);
  const [showReasoning, setShowReasoning] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalBoxRef = useRef(null);

  // Fetch all active combos dynamically from server
  const fetchCombos = async () => {
    try {
      const res = await fetch('/api/combos');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCombosList(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch combos for topology:', e);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const displayCombos = (combosList && combosList.length > 0)
    ? combosList
    : [
        { name: 'combo-plan', models: ['gemini-3.8-flash-high'] },
        { name: 'combo-code', models: ['gemini-3.8-flash-high'] },
        { name: 'combo-test', models: ['gemini-3.8-flash'] },
        { name: 'combo-review', models: ['gemini-3.8-flash-high'] },
        { name: 'combo-ask', models: ['gemini-3.8-flash-high'] }
      ];

  const getComboMeta = (name = '', idx = 0) => {
    const n = (name || '').toLowerCase();
    if (n.includes('plan')) return { name: 'Planner Agent', role: 'planner', color: '#c084fc', icon: Brain };
    if (n.includes('code')) return { name: 'Lead Coder', role: 'coder', color: '#38bdf8', icon: Code2 };
    if (n.includes('test')) return { name: 'Automated Tester', role: 'tester', color: '#facc15', icon: TestTube };
    if (n.includes('review')) return { name: 'Parallel Reviewer', role: 'reviewer', color: '#f87171', icon: ShieldCheck };
    if (n.includes('ask')) return { name: 'Principal Advisor', role: 'ask', color: '#34d399', icon: Sparkles };
    return {
      name: name,
      role: name,
      color: COMBO_PALETTE[idx % COMBO_PALETTE.length],
      icon: Layers
    };
  };

  useEffect(() => {
    if (liveStream?.status === 'streaming' && terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [liveStream?.content, liveStream?.reasoning]);

  const primaryAgent = (detectedAgents && detectedAgents.length > 0)
    ? (detectedAgents.find((a) => a.id === 'antigravity') || detectedAgents[0])
    : null;
  const hasRunningAgent = !!primaryAgent;

  const now = Date.now();
  const latestLog = recentLogs.length > 0 ? recentLogs[0] : null;
  const latestLogAge = latestLog ? (now - new Date(latestLog.timestamp).getTime()) : Infinity;

  const formatAge = (ms) => {
    if (!Number.isFinite(ms) || ms < 0) return '';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s trước`;
    const minutes = Math.floor(seconds / 1000 / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const activeReq = activeRequests.length > 0 ? activeRequests[0] : null;
  const isStreaming = liveStream?.status === 'streaming' || !!activeReq;
  const isRecent = !isStreaming && (latestLogAge < 15000 || liveStream?.status === 'completed');

  const isComboActive = (comboName = '') => {
    const cName = comboName.toLowerCase();
    const cleanCombo = cName.replace('combo-', '');

    if (liveStream?.model?.toLowerCase() === cName || (liveStream?.role && cleanCombo.includes(liveStream.role.toLowerCase()))) {
      return true;
    }

    const checkMatch = (role = '', reqModel = '') => {
      const r = (role || '').toLowerCase();
      const m = (reqModel || '').toLowerCase();
      if (m === cName || r === cName) return true;
      if (m.includes(cleanCombo) || cleanCombo.includes(m)) return true;
      if (r.includes(cleanCombo) || cleanCombo.includes(r)) return true;
      // Match aliases: reviewer <-> review, coder <-> code, tester <-> test, planner <-> plan
      if (cleanCombo === 'review' && r.includes('review')) return true;
      if (cleanCombo === 'code' && r.includes('code')) return true;
      if (cleanCombo === 'test' && r.includes('test')) return true;
      if (cleanCombo === 'plan' && r.includes('plan')) return true;
      if (cleanCombo === 'ask' && r.includes('ask')) return true;
      return false;
    };

    if (activeReq) {
      if (checkMatch(activeReq.agentRole, activeReq.requestedModel || activeReq.requested_model)) {
        return true;
      }
    }
    if (isRecent && latestLog) {
      if (checkMatch(latestLog.agent_role, latestLog.requested_model)) {
        return true;
      }
    }
    return false;
  };

  const isGeminiActive = (liveStream && liveStream.provider === 'gemini') ||
    (activeReq && (activeReq.provider === 'antigravity' || activeReq.provider === 'gemini')) ||
    (isRecent && latestLog && (latestLog.provider === 'antigravity' || latestLog.provider === 'gemini'));

  const isClaudeActive = (liveStream && liveStream.provider === 'claude') ||
    (activeReq && activeReq.provider === 'claude') ||
    (isRecent && latestLog && latestLog.provider === 'claude');

  const isCodexActive = (liveStream && liveStream.provider === 'codex') ||
    (activeReq && activeReq.provider === 'codex') ||
    (isRecent && latestLog && latestLog.provider === 'codex');

  const handleTestAgentStream = async (roleName, comboTarget) => {
    const promptToSend = customPrompt.trim() || 'Chào bạn! Hãy trả lời ngắn gọn: Bạn là ai và sẵn sàng hỗ trợ gì?';
    setTestingRole(roleName);

    const startTime = Date.now();
    setLiveStream({
      role: roleName,
      model: comboTarget,
      resolvedModel: 'Đang giải quyết...',
      account: 'Đang xoay tua...',
      prompt: promptToSend,
      status: 'streaming',
      reasoning: '',
      content: '',
      tokens: 0,
      latencyMs: 0
    });

    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: comboTarget,
          messages: [{ role: 'user', content: promptToSend }],
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let accumulatedReasoning = '';
      let resolvedModel = comboTarget;
      let resolvedAccount = 'Active Account';
      let totalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;

            if (delta?.reasoning_content) {
              accumulatedReasoning += delta.reasoning_content;
            } else if (delta?.content) {
              accumulatedText += delta.content;
            }

            if (parsed.model) resolvedModel = parsed.model;
            if (parsed.account) resolvedAccount = parsed.account;
            if (parsed.usage?.total_tokens) {
              totalTokens = parsed.usage.total_tokens;
            } else {
              totalTokens = Math.max(1, Math.round((accumulatedText.length + accumulatedReasoning.length) / 3.8));
            }

            setLiveStream(prev => ({
              ...prev,
              content: accumulatedText,
              reasoning: accumulatedReasoning,
              resolvedModel,
              account: resolvedAccount,
              tokens: totalTokens,
              latencyMs: Date.now() - startTime
            }));
          } catch (e) {}
        }
      }

      setLiveStream(prev => ({
        ...prev,
        status: 'completed',
        latencyMs: Date.now() - startTime
      }));

      if (onRefresh) onRefresh();
    } catch (err) {
      setLiveStream(prev => ({
        ...prev,
        status: 'error',
        error: err.message,
        latencyMs: Date.now() - startTime
      }));
    } finally {
      setTestingRole(null);
    }
  };

  const copyToClipboard = () => {
    if (!liveStream?.content) return;
    navigator.clipboard.writeText(liveStream.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCombos = displayCombos.length;
  const svgHeight = Math.max(400, totalCombos * 82 + 40);
  const centerY = Math.round(svgHeight / 2);

  const resolveActiveInfo = () => {
    if (liveStream?.status === 'streaming') {
      const meta = getComboMeta(liveStream.role || liveStream.model);
      const comboName = liveStream.model?.startsWith('combo-') ? liveStream.model : `combo-${meta.role}`;
      return {
        agentName: meta.name,
        comboName: comboName,
        actualModel: liveStream.resolvedModel || liveStream.model,
        accountName: liveStream.account,
        color: meta.color,
        provider: 'gemini',
        status: 'streaming'
      };
    }
    if (liveStream?.status === 'completed') {
      const meta = getComboMeta(liveStream.role || liveStream.model);
      const comboName = liveStream.model?.startsWith('combo-') ? liveStream.model : `combo-${meta.role}`;
      return {
        agentName: meta.name,
        comboName: comboName,
        actualModel: liveStream.resolvedModel || liveStream.model,
        accountName: liveStream.account,
        color: meta.color,
        provider: 'gemini',
        status: 'completed'
      };
    }
    if (activeReq) {
      const roleKey = activeReq.agentRole || activeReq.requestedModel || activeReq.requested_model || '';
      const matchedCombo = displayCombos.find(c => isComboActive(c.name));
      const meta = matchedCombo ? getComboMeta(matchedCombo.name) : getComboMeta(roleKey || activeReq.model);
      const comboName = matchedCombo ? matchedCombo.name : (meta.role?.startsWith('combo-') ? meta.role : `combo-${meta.role}`);
      const actualModel = activeReq.model || activeReq.requestedModel || 'gemini-3.8-flash-high';
      const provider = activeReq.provider === 'antigravity' ? 'gemini' : (activeReq.provider || 'gemini');

      return {
        agentName: meta.name,
        comboName: comboName,
        actualModel: actualModel,
        accountName: activeReq.accountName || 'Active Account',
        color: meta.color,
        provider: provider,
        task: activeReq.task,
        status: 'streaming'
      };
    }
    if (isRecent && latestLog) {
      const roleKey = latestLog.agent_role || latestLog.requested_model || '';
      const matchedCombo = displayCombos.find(c => isComboActive(c.name));
      const meta = matchedCombo ? getComboMeta(matchedCombo.name) : getComboMeta(roleKey || latestLog.model);
      const comboName = matchedCombo ? matchedCombo.name : (meta.role?.startsWith('combo-') ? meta.role : `combo-${meta.role}`);
      const actualModel = latestLog.model;
      const provider = latestLog.provider === 'antigravity' ? 'gemini' : (latestLog.provider || 'gemini');

      return {
        agentName: meta.name,
        comboName: comboName,
        actualModel: actualModel,
        accountName: latestLog.account_name || 'Gemini OAuth',
        color: meta.color,
        provider: provider,
        tokens: latestLog.total_tokens,
        status: 'recent'
      };
    }
    return null;
  };

  const activeInfo = resolveActiveInfo();

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
      marginBottom: '24px',
      boxShadow: 'var(--shadow-card)'
    }}>
      {/* 1. TOP STATUS & QUICK TEST TOOLBAR */}
      <div style={{
        padding: '14px 22px',
        background: isStreaming
          ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.12))'
          : isRecent
          ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.06))'
          : 'var(--bg-card-hover)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Live Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: isStreaming
              ? 'rgba(16, 185, 129, 0.18)'
              : isRecent
              ? 'rgba(56, 189, 248, 0.15)'
              : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isStreaming ? '#10b981' : isRecent ? '#38bdf8' : 'var(--border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={14} style={{ color: isStreaming ? '#10b981' : isRecent ? '#38bdf8' : 'var(--text-dim)' }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
              <span style={{
                color: isStreaming ? '#10b981' : isRecent ? '#38bdf8' : 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isStreaming ? '#10b981' : isRecent ? '#38bdf8' : 'var(--text-dim)'
                }} className={isStreaming ? 'spin' : ''} />
                {isStreaming ? 'ĐANG TRUYỀN DỮ LIỆU:' : isRecent ? 'VỪA HOÀN THÀNH:' : 'SẴN SÀNG (CHỜ LỆNH):'}
              </span>

              {activeInfo ? (
                <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                  Agent <strong style={{ color: activeInfo.color }}>{activeInfo.agentName}</strong> ({activeInfo.comboName}) ➔ {activeInfo.actualModel}
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  Hệ thống Brakthroonam Router sẵn sàng nhận call từ Cursor, Cline, Claude Code
                </span>
              )}
            </div>

            {activeInfo?.accountName && (
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Tài khoản xử lý: {activeInfo.accountName} {activeInfo.tokens ? `• ${activeInfo.tokens} tokens` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Test Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginRight: '4px' }}>Bắn test luồng:</span>
          {displayCombos.slice(0, 5).map((combo, idx) => {
            const meta = getComboMeta(combo.name, idx);
            const Icon = meta.icon;
            const isThisTesting = testingRole === meta.role;
            const shortName = combo.name.replace('combo-', '').toUpperCase();

            return (
              <button
                key={combo.name}
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  gap: '5px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)'
                }}
                disabled={!!testingRole}
                onClick={() => handleTestAgentStream(meta.role, combo.name)}
                title={`Bắn test model combo: ${combo.name}`}
              >
                <Icon size={12} style={{ color: meta.color }} />
                <span>{isThisTesting ? 'Đang gọi...' : shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DYNAMIC SVG TOPOLOGY CANVAS (COMBOS ➔ ROUTER ➔ PROVIDER) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: `${svgHeight}px` }}>
        <div className="topo-canvas-container">
          <svg
            width="100%"
            height={svgHeight}
            viewBox={`0 0 760 ${svgHeight}`}
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* Modern Blueprint Dot Grid Pattern */}
              <pattern id="canvas-grid-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.1" className="topo-grid-dot" />
              </pattern>

              {/* Glow Filter for Active Beams */}
              <filter id="glow-beam" filterUnits="userSpaceOnUse" x="0" y="0" width="760" height={svgHeight}>
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Grid Pattern Rectangle */}
            <rect x="0" y="0" width="760" height={svgHeight} fill="url(#canvas-grid-dots)" />

            {/* ========================================================== */}
            {/* INCOMING LINES: COMBOS (LEFT) ➔ AI ROUTER (CENTER)        */}
            {/* ========================================================== */}
            {displayCombos.map((combo, idx) => {
              const meta = getComboMeta(combo.name, idx);
              const nodeY = Math.round(50 + idx * ((svgHeight - 100) / Math.max(1, totalCombos - 1)));
              const active = isComboActive(combo.name);
              const dyOffset = (nodeY === centerY) ? 3 : 0;
              return (
                <g key={`incoming-beam-${combo.name}`}>
                  {/* Subtle ambient bloom behind active incoming path */}
                  {active && (
                    <path
                      d={`M 195 ${nodeY} C 275 ${nodeY - dyOffset}, 305 ${centerY + dyOffset}, 380 ${centerY}`}
                      fill="none"
                      stroke={meta.color}
                      strokeWidth={isStreaming ? '6' : '4'}
                      opacity="0.35"
                      filter="url(#glow-beam)"
                    />
                  )}
                  <path
                    d={`M 195 ${nodeY} C 275 ${nodeY - dyOffset}, 305 ${centerY + dyOffset}, 380 ${centerY}`}
                    fill="none"
                    stroke={active ? meta.color : 'rgba(255, 255, 255, 0.08)'}
                    strokeWidth={active && isStreaming ? '3.5' : active ? '2.5' : '1.5'}
                    strokeDasharray={active && isStreaming ? '6, 6' : 'none'}
                    className={active && isStreaming ? 'glowing-beam' : 'topo-beam-idle'}
                  />
                </g>
              );
            })}

            {/* ========================================================== */}
            {/* OUTGOING LINES: AI ROUTER (CENTER) ➔ PROVIDERS            */}
            {/* ========================================================== */}
            {/* Router -> Google Gemini */}
            <path
              d={`M 380 ${centerY} C 465 ${centerY}, 505 ${Math.round(svgHeight * 0.22)}, 565 ${Math.round(svgHeight * 0.22)}`}
              fill="none"
              stroke={isGeminiActive ? '#f97316' : 'rgba(255, 255, 255, 0.08)'}
              strokeWidth={isGeminiActive && isStreaming ? '3.5' : isGeminiActive ? '2.5' : '1.5'}
              strokeDasharray={isGeminiActive && isStreaming ? '6, 6' : 'none'}
              filter={isGeminiActive ? 'url(#glow-beam)' : 'none'}
              className={isGeminiActive && isStreaming ? 'glowing-beam' : 'topo-beam-idle'}
            />

            {/* Router -> Anthropic Claude */}
            <path
              d={`M 380 ${centerY} C 470 ${centerY - 2}, 510 ${centerY + 2}, 565 ${centerY}`}
              fill="none"
              stroke={isClaudeActive ? '#D97757' : 'rgba(255, 255, 255, 0.08)'}
              strokeWidth={isClaudeActive && isStreaming ? '3.5' : isClaudeActive ? '2.5' : '1.5'}
              strokeDasharray={isClaudeActive && isStreaming ? '6, 6' : 'none'}
              filter={isClaudeActive ? 'url(#glow-beam)' : 'none'}
              className={isClaudeActive && isStreaming ? 'glowing-beam' : 'topo-beam-idle'}
            />

            {/* Router -> OpenAI Codex */}
            <path
              d={`M 380 ${centerY} C 465 ${centerY}, 505 ${Math.round(svgHeight * 0.78)}, 565 ${Math.round(svgHeight * 0.78)}`}
              fill="none"
              stroke={isCodexActive ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}
              strokeWidth={isCodexActive && isStreaming ? '3.5' : isCodexActive ? '2.5' : '1.5'}
              strokeDasharray={isCodexActive && isStreaming ? '6, 6' : 'none'}
              filter={isCodexActive ? 'url(#glow-beam)' : 'none'}
              className={isCodexActive && isStreaming ? 'glowing-beam' : 'topo-beam-idle'}
            />

            {/* Dynamic Model Badges along Active Upstream Beam */}
            {isGeminiActive && (isStreaming || isRecent) && activeInfo?.actualModel && (
              <g transform={`translate(472, ${Math.round((centerY + svgHeight * 0.22) / 2) - 10})`}>
                <rect x="-130" y="-15" width="260" height="30" rx="15" fill="#f97316" opacity="0.16" filter="url(#glow-beam)" />
                <rect x="-130" y="-15" width="260" height="30" rx="15" fill="rgba(15, 23, 42, 0.95)" stroke="#f97316" strokeWidth="1.5" />
                <circle cx="-110" cy="0" r="3.5" fill="#f97316" />
                <text textAnchor="middle" y="4" fontSize="11" fontFamily="var(--font-mono)">
                  <tspan fill="#fdba74" fontWeight="700">{activeInfo.comboName}</tspan>
                  <tspan fill="#64748b" fontWeight="600"> ➔ </tspan>
                  <tspan fill="#38bdf8" fontWeight="600">{activeInfo.actualModel}</tspan>
                </text>
              </g>
            )}

            {isClaudeActive && (isStreaming || isRecent) && activeInfo?.actualModel && (
              <g transform={`translate(472, ${centerY - 10})`}>
                <rect x="-130" y="-15" width="260" height="30" rx="15" fill="#D97757" opacity="0.16" filter="url(#glow-beam)" />
                <rect x="-130" y="-15" width="260" height="30" rx="15" fill="rgba(15, 23, 42, 0.95)" stroke="#D97757" strokeWidth="1.5" />
                <circle cx="-110" cy="0" r="3.5" fill="#D97757" />
                <text textAnchor="middle" y="4" fontSize="11" fontFamily="var(--font-mono)">
                  <tspan fill="#fca5a5" fontWeight="700">{activeInfo.comboName}</tspan>
                  <tspan fill="#64748b" fontWeight="600"> ➔ </tspan>
                  <tspan fill="#38bdf8" fontWeight="600">{activeInfo.actualModel}</tspan>
                </text>
              </g>
            )}

            {isCodexActive && (isStreaming || isRecent) && activeInfo?.actualModel && (
              <g transform={`translate(472, ${Math.round((centerY + svgHeight * 0.78) / 2) - 10})`}>
                <rect x="-130" y="-15" width="260" height="30" rx="15" fill="#10b981" opacity="0.16" filter="url(#glow-beam)" />
                <rect x="-130" y="-15" width="260" height="30" rx="15" fill="rgba(15, 23, 42, 0.95)" stroke="#10b981" strokeWidth="1.5" />
                <circle cx="-110" cy="0" r="3.5" fill="#10b981" />
                <text textAnchor="middle" y="4" fontSize="11" fontFamily="var(--font-mono)">
                  <tspan fill="#6ee7b7" fontWeight="700">{activeInfo.comboName}</tspan>
                  <tspan fill="#64748b" fontWeight="600"> ➔ </tspan>
                  <tspan fill="#38bdf8" fontWeight="600">{activeInfo.actualModel}</tspan>
                </text>
              </g>
            )}

            {/* ========================================================== */}
            {/* NODES: LEFT COLUMN (DYNAMIC COMBOS)                        */}
            {/* ========================================================== */}
            {hasRunningAgent && (
              <g transform="translate(100, 18)">
                <rect x="-75" y="-12" width="150" height="24" rx="12" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
                <circle cx="-60" cy="0" r="4" fill="#10b981" />
                <text x="-48" y="4" fill="#10b981" fontSize="10" fontWeight="600">{primaryAgent.name} (Online)</text>
              </g>
            )}

            {displayCombos.map((combo, idx) => {
              const meta = getComboMeta(combo.name, idx);
              const nodeY = Math.round(50 + idx * ((svgHeight - 100) / Math.max(1, totalCombos - 1)));
              const active = isComboActive(combo.name);
              const rawModel = (active && (isStreaming || isRecent) && activeInfo?.actualModel)
                ? activeInfo.actualModel
                : null;
              const displayModel = rawModel
                ? (rawModel.length > 25 ? rawModel.slice(0, 23) + '...' : rawModel)
                : null;
              const shortTag = combo.name.replace('combo-', '');

              return (
                <g key={`node-combo-${combo.name}`} transform={`translate(100, ${nodeY})`}>
                  {/* Subtle active glow */}
                  {active && (
                    <rect
                      x="-95" y="-25" width="190" height="50" rx="10"
                      fill={meta.color} opacity="0.14" filter="url(#glow-beam)"
                    />
                  )}
                  {/* Card Background */}
                  <rect
                    x="-95" y="-25" width="190" height="50" rx="10"
                    className={`topo-node-card ${active ? 'active' : ''}`}
                    stroke={active ? meta.color : undefined}
                    strokeWidth={active && isStreaming ? 2 : active ? 1.5 : 1}
                  />

                  {/* Node Status Dot */}
                  <circle
                    cx="-78" cy="-3" r="4"
                    fill={active ? meta.color : 'var(--text-dim)'}
                  />

                  {/* Title (Agent Name) */}
                  <text
                    x="-66" y="2"
                    className="topo-node-title"
                    fontSize="13.5"
                    fontWeight="600"
                  >
                    {meta.name}
                  </text>

                  {/* Pill Tag */}
                  <rect
                    x="50" y="-12" width="34" height="18" rx="4"
                    fill={`${meta.color}18`} stroke={`${meta.color}35`} strokeWidth="1"
                  />
                  <text
                    x="67" y="1"
                    textAnchor="middle"
                    fill={meta.color}
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                  >
                    {shortTag}
                  </text>

                  {/* Subtitle / Model Info */}
                  <text
                    x="-66" y="16"
                    className="topo-node-subtitle"
                    fontSize="10.5"
                    fontFamily="var(--font-mono)"
                    fill={active ? meta.color : undefined}
                  >
                    {displayModel ? `● ${displayModel}` : `● ${combo.name}`}
                  </text>
                </g>
              );
            })}

            {/* ========================================================== */}
            {/* CENTER HUB: AI ROUTER GATEWAY                              */}
            {/* ========================================================== */}
            <g transform={`translate(380, ${centerY})`}>
              {/* Outer pulsing ring when active */}
              {(isStreaming || isRecent) && (
                <circle cx="0" cy="0" r="46" fill="rgba(37, 99, 235, 0.12)" filter="url(#glow-beam)" />
              )}
              {/* Main Hub Circle */}
              <circle
                cx="0" cy="0" r="36"
                className="topo-hub-card"
                strokeWidth={isStreaming ? '2.5' : '1.8'}
              />
              <circle
                cx="0" cy="0" r="30"
                fill="none"
                stroke="rgba(37, 99, 235, 0.2)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              <text x="0" y="-7" textAnchor="middle" className="topo-node-title" fontSize="9.5" fontWeight="700">
                Brakthroonam
              </text>
              <text x="0" y="4" textAnchor="middle" className="topo-node-title" fontSize="9.5" fontWeight="700">
                Router
              </text>
              <text x="0" y="17" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="600" fontFamily="var(--font-mono)">
                Port :20129
              </text>
              <text x="0" y="26" textAnchor="middle" className="topo-node-subtitle" fontSize="7.5">
                OpenAI Gateway
              </text>
            </g>

            {/* ========================================================== */}
            {/* NODES: RIGHT COLUMN (UPSTREAM PROVIDERS)                   */}
            {/* ========================================================== */}
            {/* PROVIDER 1: GOOGLE GEMINI */}
            <g transform={`translate(660, ${Math.round(svgHeight * 0.22)})`}>
              {isGeminiActive && (
                <rect x="-95" y="-26" width="190" height="52" rx="10" fill="#f97316" opacity="0.14" filter="url(#glow-beam)" />
              )}
              <rect
                x="-95" y="-26" width="190" height="52" rx="10"
                className={`topo-node-card ${isGeminiActive ? 'active' : ''}`}
                stroke={isGeminiActive ? '#f97316' : undefined}
                strokeWidth={isGeminiActive && isStreaming ? 2 : isGeminiActive ? 1.5 : 1}
              />
              {/* Brand Logo inside foreignObject or SVG */}
              <circle cx="-76" cy="-4" r="4" fill={isGeminiActive ? '#f97316' : '#64748b'} />
              <text x="-64" y="0" className="topo-node-title" fontSize="13.5" fontWeight="600">Google Gemini</text>
              <text x="-64" y="15" className="topo-node-subtitle" fontSize="10.5" fontFamily="var(--font-mono)" fill={isGeminiActive ? '#f97316' : undefined}>
                {isGeminiActive && (isStreaming || isRecent) && activeInfo?.actualModel
                  ? `● ${activeInfo.actualModel.length > 25 ? activeInfo.actualModel.slice(0, 23) + '...' : activeInfo.actualModel}`
                  : '● Gemini 3.8 / 2.5 Pro'}
              </text>
            </g>

            {/* PROVIDER 2: ANTHROPIC CLAUDE */}
            <g transform={`translate(660, ${centerY})`}>
              {isClaudeActive && (
                <rect x="-95" y="-26" width="190" height="52" rx="10" fill="#D97757" opacity="0.14" filter="url(#glow-beam)" />
              )}
              <rect
                x="-95" y="-26" width="190" height="52" rx="10"
                className={`topo-node-card ${isClaudeActive ? 'active' : ''}`}
                stroke={isClaudeActive ? '#D97757' : undefined}
                strokeWidth={isClaudeActive && isStreaming ? 2 : isClaudeActive ? 1.5 : 1}
              />
              <circle cx="-76" cy="-4" r="4" fill={isClaudeActive ? '#D97757' : '#64748b'} />
              <text x="-64" y="0" className="topo-node-title" fontSize="13.5" fontWeight="600">Anthropic Claude</text>
              <text x="-64" y="15" className="topo-node-subtitle" fontSize="10.5" fontFamily="var(--font-mono)" fill={isClaudeActive ? '#D97757' : undefined}>
                {isClaudeActive && (isStreaming || isRecent) && activeInfo?.actualModel
                  ? `● ${activeInfo.actualModel.length > 25 ? activeInfo.actualModel.slice(0, 23) + '...' : activeInfo.actualModel}`
                  : '● Sonnet 3.7 / 3.5'}
              </text>
            </g>

            {/* PROVIDER 3: OPENAI CODEX */}
            <g transform={`translate(660, ${Math.round(svgHeight * 0.78)})`}>
              {isCodexActive && (
                <rect x="-95" y="-26" width="190" height="52" rx="10" fill="#10b981" opacity="0.14" filter="url(#glow-beam)" />
              )}
              <rect
                x="-95" y="-26" width="190" height="52" rx="10"
                className={`topo-node-card ${isCodexActive ? 'active' : ''}`}
                stroke={isCodexActive ? '#10b981' : undefined}
                strokeWidth={isCodexActive && isStreaming ? 2 : isCodexActive ? 1.5 : 1}
              />
              <circle cx="-76" cy="-4" r="4" fill={isCodexActive ? '#10b981' : '#64748b'} />
              <text x="-64" y="0" className="topo-node-title" fontSize="13.5" fontWeight="600">OpenAI Codex</text>
              <text x="-64" y="15" className="topo-node-subtitle" fontSize="10.5" fontFamily="var(--font-mono)" fill={isCodexActive ? '#10b981' : undefined}>
                {isCodexActive && (isStreaming || isRecent) && activeInfo?.actualModel
                  ? `● ${activeInfo.actualModel.length > 25 ? activeInfo.actualModel.slice(0, 23) + '...' : activeInfo.actualModel}`
                  : '● o1 / o3 / GPT-4o'}
              </text>
            </g>
          </svg>
        </div>

        {/* 3. RIGHT COLUMN: LIVE ACTIVITY FEED */}
        <div className="topo-stream-container">
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={15} style={{ color: 'var(--accent)' }} />
              <span>Live Activity Stream</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {recentLogs.length} events
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: `${svgHeight - 55}px` }}>
            {recentLogs.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', padding: '32px 0' }}>
                Chưa có request nào phát sinh.
              </div>
            ) : (
              recentLogs.slice(0, 10).map((log) => {
                const comboInfo = getComboMeta(log.requested_model || log.model);
                const roleBadgeColor = comboInfo.color;

                return (
                  <div key={log.id} className="topo-stream-item">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          color: roleBadgeColor,
                          background: `${roleBadgeColor}15`,
                          border: `1px solid ${roleBadgeColor}30`,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {log.requested_model && log.requested_model.startsWith('combo-')
                            ? log.requested_model
                            : `combo-${(log.agent_role || comboInfo.role || 'code').replace('planner', 'plan').replace('coder', 'code').replace('tester', 'test').replace('reviewer', 'review')}`}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                          ➔ {log.model}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
                        {log.total_tokens?.toLocaleString()} tok
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      <span>{log.account_name}</span>
                      <span>{log.duration_ms}ms</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. REAL-TIME STREAM INSPECTOR TERMINAL */}
      {liveStream && (
        <div
          className="live-stream-inspector"
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card-elevated)',
            padding: '16px 22px',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          {/* Header of Inspector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: liveStream.status === 'streaming'
                  ? '#10b981'
                  : liveStream.status === 'completed'
                  ? '#38bdf8'
                  : '#f87171'
              }} className={liveStream.status === 'streaming' ? 'spin' : ''} />

              <span style={{
                fontSize: '11.5px',
                fontWeight: '600',
                color: getComboMeta(liveStream.model).color,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '2px 8px'
              }}>
                Combo: {getComboMeta(liveStream.model).name} ({liveStream.model})
              </span>

              <span style={{
                fontSize: '11.5px',
                color: 'var(--text-main)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontFamily: 'var(--font-mono)'
              }}>
                {liveStream.account}
              </span>

              <span style={{
                fontSize: '11.5px',
                color: '#38bdf8',
                fontWeight: '600',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontFamily: 'var(--font-mono)'
              }}>
                {liveStream.resolvedModel}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {liveStream.tokens} tokens • {liveStream.latencyMs}ms
              </span>

              {liveStream.content && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11.5px', gap: '4px' }}
                  onClick={copyToClipboard}
                >
                  {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11.5px', color: 'var(--text-dim)' }}
                onClick={() => setLiveStream(null)}
              >
                <X size={12} />
                <span>Đóng</span>
              </button>
            </div>
          </div>

          {/* Prompt banner */}
          <div style={{
            fontSize: '12.5px',
            color: 'var(--text-dim)',
            marginBottom: '10px',
            background: 'var(--bg-input)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <strong style={{ color: 'var(--accent)' }}>User Prompt:</strong>
            <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>"{liveStream.prompt}"</span>
          </div>

          {/* Reasoning / Thinking Drawer */}
          {liveStream.reasoning && (
            <div style={{
              marginBottom: '10px',
              background: 'rgba(192, 132, 252, 0.05)',
              border: '1px solid rgba(192, 132, 252, 0.2)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div
                onClick={() => setShowReasoning(!showReasoning)}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(192, 132, 252, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#c084fc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={14} />
                  <span>Suy nghĩ nội tâm của Model (Reasoning & Chain-of-Thought)</span>
                </div>
                {showReasoning ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>

              {showReasoning && (
                <div style={{
                  padding: '12px 16px',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {liveStream.reasoning}
                  {liveStream.status === 'streaming' && !liveStream.content && (
                    <span className="cursor-blink" style={{ color: '#c084fc', marginLeft: '2px' }}>█</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Output Terminal Box */}
          <div
            ref={terminalBoxRef}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px 18px',
              minHeight: '120px',
              maxHeight: '340px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--text-main)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {liveStream.status === 'error' ? (
              <div style={{ color: 'var(--error)' }}>
                <strong style={{ display: 'block', marginBottom: '6px' }}>Lỗi thực thi:</strong>
                {liveStream.error}
              </div>
            ) : liveStream.content ? (
              <>
                {liveStream.content}
                {liveStream.status === 'streaming' && (
                  <span className="cursor-blink" style={{ color: '#10b981', marginLeft: '3px', fontWeight: '900' }}>█</span>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} className="spin" />
                Đang kết nối tới Provider ({liveStream.account}) và chờ token đầu tiên...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE LIVE PROMPT COMMAND CONSOLE (REDESIGNED HIGH-CRAFT) */}
      <div style={{
        padding: '16px 22px',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(10, 15, 28, 0.95) 100%)',
        borderTop: '1px solid var(--border)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Top Header of the Console */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Trạm Bắn Thử Nghiệm Luồng (Live Streaming Console)
            </span>
            <span style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              padding: '1.5px 7px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8'
            }}>
              OpenAI Gateway :20129
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Nhấn <kbd style={{ padding: '2px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}>Enter ↵</kbd> để kích hoạt
          </div>
        </div>

        {/* Unified Command Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(8, 12, 20, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '10px',
          padding: '4px',
          gap: '8px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Custom Combo Selector Pill */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={!!testingRole}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f1f5f9',
                padding: '8px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                outline: 'none',
                maxWidth: '240px'
              }}
            >
              {displayCombos.map((combo, idx) => {
                const meta = getComboMeta(combo.name, idx);
                return (
                  <option key={combo.name} value={combo.name} style={{ background: '#0f172a', color: '#f1f5f9' }}>
                    {meta.name} ({combo.name})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Prompt Text Input */}
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !testingRole) {
                const meta = getComboMeta(selectedRole);
                handleTestAgentStream(meta.role, selectedRole);
              }
            }}
            placeholder="Nhập prompt bất kỳ để test streaming trực tiếp (Ví dụ: Chào tôi bằng 5 từ)..."
            disabled={!!testingRole}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '8px 10px',
              fontSize: '13px',
              color: '#f8fafc',
              minWidth: '200px'
            }}
          />

          {/* Action Button */}
          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              gap: '7px',
              borderRadius: '7px',
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)'
            }}
            disabled={!!testingRole}
            onClick={() => {
              const meta = getComboMeta(selectedRole);
              handleTestAgentStream(meta.role, selectedRole);
            }}
          >
            {testingRole ? (
              <>
                <RefreshCw size={13} className="spin" />
                <span>Đang truyền...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Bắn Request Test</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>GỢI Ý NHANH:</span>
          {[
            { label: '⚡ Test 5 từ', prompt: 'Hãy chào tôi và tóm tắt vai trò của bạn đúng 5 từ.', accent: '#f59e0b' },
            { label: '🐍 Python Giai thừa', prompt: 'Viết hàm đệ quy tính giai thừa n! bằng Python kèm docstring ngắn.', accent: '#10b981' },
            { label: '💡 Plan Bảo mật', prompt: 'Lập dàn ý 3 bước phòng thủ chống SQL Injection và XSS trong Node.js.', accent: '#c084fc' },
            { label: '🛡️ Review SQL Injection', prompt: 'Review đoạn code sau xem có an toàn không: db.query("SELECT * FROM users WHERE id = " + req.query.id)', accent: '#f87171' },
            { label: '✨ Tư Vấn Ask (4-Persona)', prompt: 'Đánh giá ưu nhược điểm giữa SQLite và PostgreSQL cho ứng dụng AI local gateway.', accent: '#34d399' }
          ].map((s, idx) => (
            <button
              key={idx}
              type="button"
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = s.accent;
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#cbd5e1';
                e.currentTarget.style.transform = 'none';
              }}
              onClick={() => {
                setCustomPrompt(s.prompt);
                const meta = getComboMeta(selectedRole);
                handleTestAgentStream(meta.role, selectedRole);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
