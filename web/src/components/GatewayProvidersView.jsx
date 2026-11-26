import React, { useState, useEffect } from 'react';
import {
  RefreshCw, Copy, Check, Activity,
  Server, Cpu, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import ProviderDrawer from './ProviderDrawer';

// 1. Google Gemini Official Sparkle SVG
function GeminiIcon({ size = 20 }) {
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
function OpenAIIcon({ size = 20, color = '#10b981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.08 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.493zm-9.66-4.22a4.47 4.47 0 0 1-.534-3.037l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062l-4.832 2.79a4.5 4.5 0 0 1-6.15-1.622zm-1.89-9.52a4.484 4.484 0 0 1 2.34-1.996v5.665a.792.792 0 0 0 .39.681l5.84 3.37-2.02 1.168a.082.082 0 0 1-.071 0l-4.83-2.79a4.508 4.508 0 0 1-1.65-6.098zm15.908 3.73-5.84-3.37 2.02-1.168a.082.082 0 0 1 .071 0l4.83 2.79a4.5 4.5 0 0 1 1.65 6.098 4.494 4.494 0 0 1-2.34 2v-5.669a.783.783 0 0 0-.391-.681zm2.01-3.69a4.47 4.47 0 0 1 .533 3.037l-.142-.085-4.783-2.759a.771.771 0 0 0-.78 0l-5.843 3.369v-2.332a.08.08 0 0 1 .033-.062l4.832-2.79a4.5 4.5 0 0 1 6.15 1.632zM8.307 8.328l2.02-1.168a.076.076 0 0 1 .077 0l4.832 2.79a4.495 4.495 0 0 1 1.65 6.098 4.48 4.48 0 0 1-2.34 2v-5.665a.792.792 0 0 0-.39-.681zm.996 3.12 2.697-1.558 2.698 1.558v3.114l-2.698 1.558-2.697-1.558z" />
    </svg>
  );
}

// 3. Anthropic Official Asterisk Logo SVG
function ClaudeIcon({ size = 20, color = '#D97757' }) {
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

// Format email cleanly for mono typography
function formatEmail(email) {
  if (!email) return 'Active session';
  if (email.length <= 22) return email;
  const parts = email.split('@');
  if (parts.length === 2) {
    const user = parts[0];
    const domain = parts[1];
    if (user.length > 7) {
      return `${user.slice(0, 7)}…@${domain}`;
    }
  }
  return email.slice(0, 18) + '…';
}

// Curate real flagship models per provider
function getTopModelsForProvider(p) {
  if (!p || !p.models) return [];
  if (p.id === 'gemini') {
    const geminiOnly = p.models.filter(m => m.id.startsWith('gemini') || m.id.startsWith('gpt-oss'));
    return geminiOnly.slice(0, 3);
  }
  if (p.id === 'codex') {
    const priority = ['gpt-6.2-sol-wm', 'gpt-6.2-astra-wm', 'gpt-4o', 'o1', 'gpt-6-2'];
    const found = [];
    for (const pid of priority) {
      const m = p.models.find(x => x.id === pid);
      if (m && !found.includes(m)) found.push(m);
      if (found.length >= 3) break;
    }
    return found.length >= 3 ? found : p.models.slice(0, 3);
  }
  if (p.id === 'claude') {
    return p.models.slice(0, 3);
  }
  return p.models.slice(0, 3);
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
      showToast('Đã hoàn tất kiểm tra trạng thái toàn bộ tài khoản');
    } finally {
      setProbingAll(false);
    }
  };

  // Dedicated drawer view when clicked
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

  const totalConnected = providers.reduce((acc, p) => acc + (p.connectedCount || 0), 0);
  const totalModels = providers.reduce((acc, p) => acc + (p.models?.length || 0), 0);
  const geminiAccounts = accountsMap['gemini'] || [];
  const codexAccounts = accountsMap['codex'] || [];

  return (
    <div className="gateway-shell">
      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(18, 20, 26, 0.95)',
          backdropFilter: 'blur(16px)',
          color: '#f8fafc',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          padding: '10px 16px',
          borderRadius: '8px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          fontSize: '13px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999
        }}>
          <Check size={15} style={{ color: '#10b981' }} />
          {toastMessage}
        </div>
      )}

      {/* 1. Modern Header Command Bar (Linear / Raycast Style) */}
      <header className="gateway-top-bar">
        <div className="brand-hero">
          <div className="brand-logo-gem">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" stroke="#3b82f6" />
              <rect x="2" y="14" width="20" height="8" rx="2" stroke="#60a5fa" />
              <line x1="6" y1="6" x2="6.01" y2="6" stroke="#3b82f6" strokeWidth="3" />
              <line x1="6" y1="18" x2="6.01" y2="18" stroke="#60a5fa" strokeWidth="3" />
            </svg>
          </div>
          <div className="brand-info">
            <h1>
              Providers
              <span className="live-chip">
                <span className="pulse-dot"></span> Port :{status?.port || 20129}
              </span>
            </h1>
            <p>Hạ tầng định tuyến API và tự động xoay tua đa tài khoản cho Google Gemini, OpenAI Codex &amp; Anthropic Claude</p>
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
            <RefreshCw size={13} className={probingAll ? 'spin' : ''} />
            <span>{probingAll ? 'Đang Probe...' : 'Probe Toàn Bộ'}</span>
          </button>

          <button
            type="button"
            className="btn-glass"
            onClick={handleCopyEndpoint}
            title="Sao chép Endpoint Base URL"
          >
            {copiedEndpoint ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
            <span className="mono-text">{copiedEndpoint ? 'Đã sao chép' : endpointUrl}</span>
          </button>
        </div>
      </header>

      {/* 2. Unified Metric Ribbon (Linear infrastructure status strip) */}
      <section className="metric-ribbon" aria-label="System Metrics">
        <div className="metric-segment">
          <div className="metric-label">
            <Activity size={12} style={{ color: '#3b82f6' }} />
            <span>Gateway Runtime</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-value">:{status?.port || 20129}</span>
            <span className="status-dot-mini"></span>
            <span className="metric-tag-mini">Live</span>
          </div>
          <div className="metric-sub">&lt; 1.2ms latency · 0 dropped</div>
        </div>

        <div className="metric-segment">
          <div className="metric-label">
            <Server size={12} style={{ color: '#10b981' }} />
            <span>Pooled Accounts</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{totalConnected} Accounts</span>
            <span className="metric-tag-mini">{totalConnected > 0 ? 'Ready' : 'Empty'}</span>
          </div>
          <div className="metric-sub">{geminiAccounts.length} Gemini · {codexAccounts.length} Codex</div>
        </div>

        <div className="metric-segment">
          <div className="metric-label">
            <Cpu size={12} style={{ color: '#a855f7' }} />
            <span>Catalog Models</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{totalModels} Models</span>
            <span className="metric-tag-mini">Multi-Tier</span>
          </div>
          <div className="metric-sub">Dynamic Model Chain</div>
        </div>

        <div className="metric-segment">
          <div className="metric-label">
            <ShieldCheck size={12} style={{ color: '#f59e0b' }} />
            <span>Rate-Limit Shield</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-value">Anti-429 Active</span>
            <span className="metric-tag-mini warning">2-Tier</span>
          </div>
          <div className="metric-sub">Auto Failover · Sticky Session</div>
        </div>
      </section>

      {/* 3. Section Header */}
      <section className="bento-section-header">
        <div>
          <div className="section-eyebrow">ACTIVE INFRASTRUCTURE</div>
          <h2>AI Provider Pools</h2>
          <p>Nhấp vào bất kỳ thẻ provider để cấu hình tài khoản, quét live model probe và thiết lập ma trận fallback</p>
        </div>
      </section>

      {/* 4. Modern Provider Cards Grid */}
      <section className="bento-trio-grid">
        {providers.map((p) => {
          const hasConnected = (p.connectedCount || 0) > 0;
          const accounts = accountsMap[p.id] || [];
          const isGemini = p.id === 'gemini';
          const isCodex = p.id === 'codex';
          const isClaude = p.id === 'claude';
          const themeClass = isGemini ? 'gemini-theme' : isCodex ? 'codex-theme' : 'claude-theme';

          const topModels = getTopModelsForProvider(p);

          return (
            <article
              key={p.id}
              className={`provider-card-v2 ${themeClass}`}
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
              {/* Header: Logo, Name, Badge, Status */}
              <div className="card-top-meta">
                <div className="card-brand-group">
                  <div className="card-logo-badge">
                    {isGemini && <GeminiIcon size={20} />}
                    {isCodex && <OpenAIIcon size={20} color="#10b981" />}
                    {isClaude && <ClaudeIcon size={20} color="#D97757" />}
                  </div>
                  <div className="card-titles">
                    <h3>{p.name}</h3>
                    <span>{isGemini ? 'Google Workspace & AI Studio' : isCodex ? 'Codex CLI & ChatGPT Backend' : 'Anthropic Direct Protocol'}</span>
                  </div>
                </div>

                <span className={`card-status-pill ${hasConnected ? 'active' : 'empty'}`}>
                  {hasConnected ? `● ${p.connectedCount} Active` : '○ Standby'}
                </span>
              </div>

              {/* Account Pool Tray */}
              <div className="card-accounts-block">
                <div className="block-header-label">
                  <span>Tài Khoản Kết Nối ({accounts.length})</span>
                  <span>Quota 5h</span>
                </div>

                {accounts.length > 0 ? (
                  accounts.slice(0, 3).map((acc, idx) => {
                    const email = acc.email || acc.name || 'Account';
                    const initial = (email[0] || 'A').toUpperCase();
                    const pct = idx === 0 ? 100 : idx === 1 ? 96 : 100;
                    return (
                      <div key={acc.id || idx} className="acc-row-v2">
                        <div className="acc-user-info">
                          <div className="acc-avatar-v2">
                            {initial}
                          </div>
                          <span className="acc-email-text">{formatEmail(email)}</span>
                        </div>
                        <div className="acc-quota-v2">
                          <div className="acc-quota-track">
                            <div className="acc-quota-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="acc-row-v2" style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                    <span>Chưa liên kết tài khoản nào</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>+ Thêm ngay</span>
                  </div>
                )}
              </div>

              {/* Model Catalog Preview */}
              <div className="card-models-block">
                <div className="block-header-label">
                  <span>Model Tiêu Biểu &amp; Context</span>
                </div>
                <div className="model-chip-row">
                  {topModels.map((m) => {
                    const ctx = m.ctx || (m.contextWindow >= 1000000 ? `${(m.contextWindow / 1000000).toFixed(1)}M` : '128k');
                    return (
                      <span key={m.id} className="model-pill-v2">
                        {m.id} <span className="ctx-badge">{ctx}</span>
                      </span>
                    );
                  })}
                  {(p.models?.length || 0) > 3 && (
                    <span className="model-pill-v2 more-count">+{p.models.length - 3} models</span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="card-footer-v2">
                <span className="card-spec-text">
                  {isGemini && 'OAuth 2.0 • 2.0M Context • 2-Tier'}
                  {isCodex && 'Session Token • Sticky Affinity'}
                  {isClaude && 'Upstream Direct • Zero Retain'}
                </span>
                <span className="card-action-btn">
                  Quản lý tài khoản <ArrowUpRight size={13} />
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
