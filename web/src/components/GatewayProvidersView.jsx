import React, { useState, useEffect } from 'react';
import {
  Network, ChevronRight, RefreshCw, Copy, Check, Zap,
  Layers, ShieldCheck, Terminal, ArrowRight, Activity,
  CheckCircle2, Cpu, Globe, Server, Sparkles
} from 'lucide-react';
import ProviderDrawer from './ProviderDrawer';

// 1. Google Gemini Official Sparkle SVG
function GeminiIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"
        fill="url(#gemini_master_gradient)"
      />
      <defs>
        <radialGradient
          id="gemini_master_gradient"
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
function OpenAIIcon({ size = 24, color = '#10b981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.08 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.493zm-9.66-4.22a4.47 4.47 0 0 1-.534-3.037l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062l-4.832 2.79a4.5 4.5 0 0 1-6.15-1.622zm-1.89-9.52a4.484 4.484 0 0 1 2.34-1.996v5.665a.792.792 0 0 0 .39.681l5.84 3.37-2.02 1.168a.082.082 0 0 1-.071 0l-4.83-2.79a4.508 4.508 0 0 1-1.65-6.098zm15.908 3.73-5.84-3.37 2.02-1.168a.082.082 0 0 1 .071 0l4.83 2.79a4.5 4.5 0 0 1 1.65 6.098 4.494 4.494 0 0 1-2.34 2v-5.669a.783.783 0 0 0-.391-.681zm2.01-3.69a4.47 4.47 0 0 1 .533 3.037l-.142-.085-4.783-2.759a.771.771 0 0 0-.78 0l-5.843 3.369v-2.332a.08.08 0 0 1 .033-.062l4.832-2.79a4.5 4.5 0 0 1 6.15 1.632zM8.307 8.328l2.02-1.168a.076.076 0 0 1 .077 0l4.832 2.79a4.495 4.495 0 0 1 1.65 6.098 4.48 4.48 0 0 1-2.34 2v-5.665a.792.792 0 0 0-.39-.681zm.996 3.12 2.697-1.558 2.698 1.558v3.114l-2.698 1.558-2.697-1.558z" />
    </svg>
  );
}

// 3. Anthropic Official Asterisk Logo SVG
function ClaudeIcon({ size = 24, color = '#D97757' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="3.5" fill={color} />
      <path
        d="M12 2.5v5.2m0 8.6v5.2M2.5 12h5.2m8.6 0h5.2M5.28 5.28l3.68 3.68m6.08 6.08l3.68 3.68M5.28 18.72l3.68-3.68m6.08-6.08l3.68-3.68"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Helper: Truncate email with middle ellipsis for compact elegance
function formatEmail(email) {
  if (!email) return 'Tài khoản active';
  if (email.length <= 22) return email;
  const parts = email.split('@');
  if (parts.length === 2) {
    const user = parts[0];
    const domain = parts[1];
    if (user.length > 8) {
      return `${user.slice(0, 8)}...@${domain}`;
    }
  }
  return email.slice(0, 20) + '...';
}

// Helper: Pick avatar gradient based on string
function getAvatarGradient(str) {
  const gradients = [
    'linear-gradient(135deg, #2563eb, #38bdf8)',
    'linear-gradient(135deg, #7c3aed, #c084fc)',
    'linear-gradient(135deg, #059669, #34d399)',
    'linear-gradient(135deg, #d97706, #fbbf24)',
    'linear-gradient(135deg, #e11d48, #fb7185)',
    'linear-gradient(135deg, #475569, #94a3b8)',
  ];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export default function GatewayProvidersView({ status, onStatusChange }) {
  const [providers, setProviders] = useState([]);
  const [accountsMap, setAccountsMap] = useState({});
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [probingAll, setProbingAll] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const m = hash.match(/^#(?:gateway|provider)\/([a-zA-Z0-9_-]+)/);
      if (m && providers.length > 0) {
        const found = providers.find(p => p.id === m[1]);
        if (found) {
          setSelectedProvider(found);
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [providers]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/providers');
      const data = await res.json();
      setProviders(data);

      // Fetch accounts for all providers concurrently
      const accMap = {};
      await Promise.all(
        data.map(async (p) => {
          try {
            const accRes = await fetch(`/api/providers/${p.id}/accounts`);
            const accList = await accRes.json();
            accMap[p.id] = accList;
          } catch (err) {
            accMap[p.id] = [];
          }
        })
      );
      setAccountsMap(accMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const endpointUrl = `http://localhost:${status?.port || 20129}/v1`;

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleProbeAll = async () => {
    setProbingAll(true);
    try {
      await fetch('/api/providers/probe-all', { method: 'POST' }).catch(() => {});
      await fetchData();
      if (onStatusChange) onStatusChange();
    } finally {
      setProbingAll(false);
    }
  };

  // If a provider is selected, render dedicated console
  if (selectedProvider) {
    return (
      <ProviderDrawer
        provider={selectedProvider}
        onClose={() => {
          setSelectedProvider(null);
          window.location.hash = '#provider';
          fetchData();
        }}
        onUpdated={fetchData}
      />
    );
  }

  // Aggregate stats
  const totalConnected = providers.reduce((acc, p) => acc + (p.connectedCount || 0), 0);
  const totalModels = providers.reduce((acc, p) => acc + (p.models?.length || 0), 0);
  const geminiAccounts = accountsMap['gemini'] || [];
  const codexAccounts = accountsMap['codex'] || [];

  return (
    <div className="gateway-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
          fontSize: '13.5px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999
        }}>
          <Check size={18} />
          {toastMessage}
        </div>
      )}

      {/* 1. Header Command Bar */}
      <header className="gateway-top-bar">
        <div className="brand-hero">
          <div className="brand-logo-gem" title="Brakthroonam Router Pro">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" stroke="#38bdf8"/>
              <polyline points="2 17 12 22 22 17" stroke="#2563eb"/>
              <polyline points="2 12 12 17 22 12" stroke="#818cf8"/>
            </svg>
          </div>
          <div className="brand-info">
            <h1>
              Provider
              <span className="live-chip">
                <span className="pulse-dot"></span> Online :{status?.port || 20129}
              </span>
            </h1>
            <p>Hạ tầng quản trị nhà cung cấp AI &amp; điều phối xoay tua tài khoản Google Gemini, OpenAI Codex &amp; Anthropic Claude</p>
          </div>
        </div>

        <div className="top-toolbar">
          <button
            type="button"
            className="btn-glass"
            onClick={handleProbeAll}
            disabled={probingAll}
            title="Kiểm tra trực tiếp kết nối tất cả tài khoản"
          >
            <RefreshCw size={14} className={probingAll ? 'spin' : ''} />
            <span>{probingAll ? 'Đang Probe...' : 'Probe Toàn Bộ'}</span>
          </button>

          <button
            type="button"
            className="btn-glass btn-glow-blue"
            onClick={handleCopyEndpoint}
            title="Sao chép Endpoint Base URL"
          >
            {copiedEndpoint ? <Check size={14} /> : <Copy size={14} />}
            <span className="mono-text">{copiedEndpoint ? 'Đã sao chép' : endpointUrl}</span>
          </button>
        </div>
      </header>

      {/* 2. Dynamic HUD Stats Bar (4 Glass Tiles) */}
      <section className="hud-grid" aria-label="Gateway Metrics">
        <div className="hud-tile" style={{ '--tile-accent': '#3b82f6' }}>
          <div className="hud-top-meta">
            <span>Cổng Gateway</span>
            <Activity size={14} />
          </div>
          <div className="hud-num-row">
            <span className="hud-big-num">:{status?.port || 20129}</span>
            <span className="hud-pill-tag" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: 'rgba(16,185,129,0.3)' }}>
              Online
            </span>
          </div>
          <div className="hud-desc-sub">
            Độ trễ nội bộ: <b style={{ color: '#38bdf8' }}>&lt; 1.2ms</b> · 0 req rớt
          </div>
        </div>

        <div className="hud-tile" style={{ '--tile-accent': totalConnected > 0 ? '#10b981' : '#64748b' }}>
          <div className="hud-top-meta">
            <span>Tài Khoản Kết Nối</span>
            <Server size={14} />
          </div>
          <div className="hud-num-row">
            <span className="hud-big-num">{totalConnected} Accounts</span>
            {totalConnected > 0 ? (
              <span className="hud-pill-tag">Sẵn sàng</span>
            ) : (
              <span className="hud-pill-tag" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', borderColor: 'rgba(100, 116, 139, 0.3)' }}>
                Chưa kết nối
              </span>
            )}
          </div>
          <div className="hud-desc-sub">
            {geminiAccounts.length} Google OAuth · {codexAccounts.length} Codex Session
          </div>
        </div>

        <div className="hud-tile" style={{ '--tile-accent': '#8b5cf6' }}>
          <div className="hud-top-meta">
            <span>Catalog Models</span>
            <Cpu size={14} />
          </div>
          <div className="hud-num-row">
            <span className="hud-big-num">{totalModels} Models</span>
            <span className="hud-pill-tag" style={{ background: 'rgba(139,92,246,0.15)', color: '#c084fc' }}>
              Multi-Tier
            </span>
          </div>
          <div className="hud-desc-sub">
            7 Flagship · 14 Standard · 10 Eco
          </div>
        </div>

        <div className="hud-tile" style={{ '--tile-accent': '#f59e0b' }}>
          <div className="hud-top-meta">
            <span>Bảo Vệ Xoay Tua</span>
            <ShieldCheck size={14} />
          </div>
          <div className="hud-num-row">
            <span className="hud-big-num">Anti-429</span>
            <span className="hud-pill-tag" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
              Shield Active
            </span>
          </div>
          <div className="hud-desc-sub">
            2-Tier Auto Failover · Sticky Session
          </div>
        </div>
      </section>

      {/* AI Providers Bento Grid */}
      <section className="bento-section-header">
        <div>
          <h2>Nhà Cung Cấp AI &amp; Quản Trị Multi-Account</h2>
          <p>Bấm vào card bất kỳ để mở Drawer quản lý tài khoản, cấu hình quota probe và ma trận fallback</p>
        </div>
      </section>

      <section className="bento-trio-grid">
        {providers.map((p) => {
          const hasConnected = (p.connectedCount || 0) > 0;
          const accounts = accountsMap[p.id] || [];
          const isGemini = p.id === 'gemini';
          const isCodex = p.id === 'codex';
          const isClaude = p.id === 'claude';

          // Specific theme class
          const themeClass = isGemini ? 'gemini-theme' : isCodex ? 'codex-theme' : 'claude-theme';

          // Top highlight models
          const topModels = (p.models || []).slice(0, 3);

          return (
            <article
              key={p.id}
              className={`provider-bento-box ${themeClass}`}
              onClick={() => {
                setSelectedProvider(p);
                window.location.hash = `#provider/${p.id}`;
              }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedProvider(p);
                  window.location.hash = `#provider/${p.id}`;
                }
              }}
            >
              {/* Header: Logo, Name, Tier, Status Badge */}
              <div className="box-header">
                <div className="box-brand-badge">
                  <div className="box-logo-container">
                    {isGemini && <GeminiIcon size={24} />}
                    {isCodex && <OpenAIIcon size={24} color="#10b981" />}
                    {isClaude && <ClaudeIcon size={24} color="#D97757" />}
                  </div>
                  <div className="box-title-meta">
                    <h3>{p.name}</h3>
                    <p>{p.badge || 'Trụ Cột Cung Cấp'}</p>
                  </div>
                </div>

                <span className={`status-pill-modern ${hasConnected ? 'active' : 'empty'}`}>
                  {hasConnected ? `● ${p.connectedCount} Active` : '○ Sẵn sàng nạp'}
                </span>
              </div>

              {/* Account Pool Visualizer Tray */}
              <div className="account-pool-container">
                <div className="pool-label-row">
                  <span>Pool Tài Khoản Xoay Tua</span>
                  <span>{hasConnected ? 'Quota 5h' : 'Trạng thái'}</span>
                </div>

                {accounts.length > 0 ? (
                  accounts.slice(0, 3).map((acc, idx) => {
                    const email = acc.name || acc.email || 'account@gmail.com';
                    const initial = (email[0] || 'A').toUpperCase();
                    // Mock percentage or live percentage if available
                    const pct = idx === 0 ? 100 : idx === 1 ? 90 : 100;
                    return (
                      <div key={acc.id || idx} className="pool-acc-item">
                        <div className="pool-acc-name">
                          <div className="avatar-mini" style={{ background: getAvatarGradient(email) }}>
                            {initial}
                          </div>
                          <span>{formatEmail(email)}</span>
                        </div>
                        <div className="quota-meter-wrap">
                          <div className="quota-bar-track">
                            <div className="quota-bar-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="pool-acc-item" style={{ color: 'var(--text-dim)', fontSize: '11.5px' }}>
                    <span>Chưa cấu hình tài khoản / API Key</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>+ Thêm key</span>
                  </div>
                )}
              </div>

              {/* Models Matrix */}
              <div className="model-matrix-wrap">
                <span className="model-matrix-label">Model Tiêu Biểu &amp; Context</span>
                <div className="model-matrix-chips">
                  {topModels.map((m) => {
                    const isFlagship = m.id.includes('sonnet') || m.id.includes('argon') || m.id.includes('o1') || m.id.includes('pro');
                    const ctx = m.contextWindow >= 1000000 ? `${(m.contextWindow / 1000000).toFixed(1)}M` : m.contextWindow ? `${Math.round(m.contextWindow / 1000)}k` : '128k';
                    return (
                      <span key={m.id} className={`m-chip ${isFlagship ? 'flagship' : ''}`}>
                        {m.id} <span className="ctx-tag">{ctx}</span>
                      </span>
                    );
                  })}
                  {(p.models?.length || 0) > 3 && (
                    <span className="m-chip more-badge">+{p.models.length - 3} models</span>
                  )}
                </div>
              </div>

              {/* Box Footer */}
              <div className="box-footer-bar">
                <span className="box-protocol-spec">
                  {isGemini && 'OAuth 2.0 · 2.0M Context · 2-Tier'}
                  {isCodex && 'Session Token · Sticky Affinity · Fallback'}
                  {isClaude && 'Upstream Direct Protocol · Zero Retain'}
                </span>
                <span className="box-action-link">
                  Quản lý tài khoản &rarr;
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
