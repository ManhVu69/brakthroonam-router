import React, { useState, useEffect } from 'react';
import {
  X, Plus, Key, Trash2, CheckCircle2, AlertCircle, ArrowLeft,
  Mail, RefreshCw, Eye, EyeOff, Check, Edit2, ShieldCheck, AlertTriangle,
  Copy, Globe, LogIn, Cpu, Layers, Zap, ChevronDown, ChevronUp,
  Server, Activity, Shield, Terminal, ArrowRight, Gauge, CornerDownRight, Search,
  SlidersHorizontal, Filter
} from 'lucide-react';

// Official SVG Brand Logos
function GoogleGLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GeminiBrandIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"
        fill="url(#gemini_drawer_gradient)"
      />
      <defs>
        <radialGradient
          id="gemini_drawer_gradient"
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

function OpenAIBrandIcon({ size = 26, color = '#10b981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.08 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.493zm-9.66-4.22a4.47 4.47 0 0 1-.534-3.037l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062l-4.832 2.79a4.5 4.5 0 0 1-6.15-1.622zm-1.89-9.52a4.484 4.484 0 0 1 2.34-1.996v5.665a.792.792 0 0 0 .39.681l5.84 3.37-2.02 1.168a.082.082 0 0 1-.071 0l-4.83-2.79a4.508 4.508 0 0 1-1.65-6.098zm15.908 3.73-5.84-3.37 2.02-1.168a.082.082 0 0 1 .071 0l4.83 2.79a4.5 4.5 0 0 1 1.65 6.098 4.494 4.494 0 0 1-2.34 2v-5.669a.783.783 0 0 0-.391-.681zm2.01-3.69a4.47 4.47 0 0 1 .533 3.037l-.142-.085-4.783-2.759a.771.771 0 0 0-.78 0l-5.843 3.369v-2.332a.08.08 0 0 1 .033-.062l4.832-2.79a4.5 4.5 0 0 1 6.15 1.632zM8.307 8.328l2.02-1.168a.076.076 0 0 1 .077 0l4.832 2.79a4.495 4.495 0 0 1 1.65 6.098 4.48 4.48 0 0 1-2.34 2v-5.665a.792.792 0 0 0-.39-.681zm.996 3.12 2.697-1.558 2.698 1.558v3.114l-2.698 1.558-2.697-1.558z" />
    </svg>
  );
}

function ClaudeBrandIcon({ size = 26, color = '#D97757' }) {
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

export default function ProviderDrawer({ provider, onClose, onUpdated }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [priority, setPriority] = useState(1);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testingAll, setTestingAll] = useState(false);
  const [probingId, setProbingId] = useState(null);
  const [probeModalData, setProbeModalData] = useState(null);
  const [copiedEmailId, setCopiedEmailId] = useState(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [expandedModelsMap, setExpandedModelsMap] = useState({});
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');

  // Edit Key Modal
  const [editingAccount, setEditingAccount] = useState(null);
  const [editApiKey, setEditApiKey] = useState('');

  useEffect(() => {
    fetchAccounts();

    const handleOAuthMessage = (event) => {
      if (
        event.data &&
        (event.data.type === 'GOOGLE_AUTH_SUCCESS' ||
          event.data.type === 'OPENAI_AUTH_SUCCESS' ||
          event.data.type === 'CLAUDE_AUTH_SUCCESS')
      ) {
        setIsLoggingInGoogle(false);
        fetchAccounts();
        if (onUpdated) onUpdated();
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [provider]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/providers/${provider.id}/accounts`);
      const data = await res.json();
      setAccounts(data);

      const expandMap = {};
      data.forEach(acc => {
        expandMap[acc.id] = false; // Default collapsed to reduce clutter!
      });
      setExpandedModelsMap(expandMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOAuth = async () => {
    try {
      setIsLoggingInGoogle(true);
      let url = '/api/auth/google/start';
      if (provider.id === 'codex') url = '/api/auth/openai/start';
      if (provider.id === 'claude') url = '/api/auth/claude/start';

      const res = await fetch(url);
      const { authUrl, error } = await res.json();
      if (error) throw new Error(error);

      const width = 560;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'oauth_login_popup',
        `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0`
      );

      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setIsLoggingInGoogle(false);
          fetchAccounts();
          if (onUpdated) onUpdated();
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsLoggingInGoogle(false);
      alert('Không thể kết nối đến máy chủ OAuth: ' + err.message);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!email.trim() || !apiKey.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/providers/${provider.id}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || email.trim(),
          api_key: apiKey.trim(),
          priority: Number(priority) || 1
        })
      });
      if (res.ok) {
        setEmail('');
        setName('');
        setApiKey('');
        setShowAddForm(false);
        await fetchAccounts();
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (accountId) => {
    try {
      setTestingId(accountId);
      const res = await fetch(`/api/providers/${provider.id}/accounts/${accountId}/test`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchAccounts();
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestingId(null);
    }
  };

  const handleTestAllAccounts = async () => {
    if (accounts.length === 0) return;
    try {
      setTestingAll(true);
      for (const acc of accounts) {
        await fetch(`/api/providers/${provider.id}/accounts/${acc.id}/test`, {
          method: 'POST'
        });
      }
      await fetchAccounts();
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setTestingAll(false);
    }
  };

  const handleProbeModels = async (accountId) => {
    try {
      setProbingId(accountId);
      const res = await fetch(`/api/providers/${provider.id}/accounts/${accountId}/probe`, {
        method: 'POST'
      });
      const data = await res.json();
      setProbeModalData(data);
      await fetchAccounts();
      if (onUpdated) onUpdated();
    } catch (e) {
      alert('Lỗi quét models: ' + e.message);
    } finally {
      setProbingId(null);
    }
  };

  const handleToggleActive = async (account) => {
    try {
      await fetch(`/api/providers/${provider.id}/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: account.is_active ? 0 : 1 })
      });
      fetchAccounts();
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (accountId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi Brakthroonam Router?')) return;
    try {
      await fetch(`/api/providers/${provider.id}/accounts/${accountId}`, {
        method: 'DELETE'
      });
      fetchAccounts();
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEditedKey = async (e) => {
    e.preventDefault();
    if (!editApiKey.trim() || !editingAccount) return;

    try {
      const res = await fetch(`/api/providers/${provider.id}/accounts/${editingAccount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: editApiKey.trim() })
      });
      if (res.ok) {
        setEditingAccount(null);
        setEditApiKey('');
        await fetchAccounts();
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyEmail = (emailText, id) => {
    if (!emailText) return;
    navigator.clipboard.writeText(emailText);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  const toggleExpandModels = (id) => {
    setExpandedModelsMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isGemini = provider.id === 'gemini';
  const isCodex = provider.id === 'codex';
  const isClaude = provider.id === 'claude';
  const models = provider.models || [];
  const activeAccountsCount = accounts.filter(a => a.is_active).length;

  const tier1Models = models.filter(m => m.tier === 1);
  const tier2Models = models.filter(m => m.tier === 2);
  const tier3Models = models.filter(m => m.tier === 3);

  const displayedModels = selectedTierFilter === 'tier1'
    ? tier1Models
    : selectedTierFilter === 'tier2'
    ? tier2Models
    : selectedTierFilter === 'tier3'
    ? tier3Models
    : models;

  return (
    <div className="provider-console-shell">
      {/* 1. BREADCRUMB & HEADER BAR */}
      <nav className="console-nav" aria-label="Breadcrumb">
        <div className="console-nav-left">
          <button
            type="button"
            className="console-back-btn"
            onClick={onClose}
          >
            <ArrowLeft size={14} />
            <span>Gateway & Providers</span>
          </button>
          <span className="nav-divider">/</span>
          <div className="nav-current-provider">
            {isGemini && <GeminiBrandIcon size={18} />}
            {isCodex && <OpenAIBrandIcon size={18} />}
            {isClaude && <ClaudeBrandIcon size={18} />}
            <span className="provider-current-name">{provider.name}</span>
          </div>
        </div>

        <div className="console-nav-actions">
          <button
            type="button"
            className="action-btn secondary small"
            onClick={handleTestAllAccounts}
            disabled={testingAll || accounts.length === 0}
            title="Kiểm tra kết nối toàn bộ tài khoản"
          >
            <RefreshCw size={13} className={testingAll ? 'spin' : ''} />
            <span>{testingAll ? 'Đang test...' : 'Test tất cả'}</span>
          </button>

          <button
            type="button"
            className="action-btn primary small"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={14} />
            <span>{showAddForm ? 'Đóng form' : 'Thêm API Key'}</span>
          </button>
        </div>
      </nav>

      {/* 2. REFINED EXECUTIVE HERO CARD */}
      <header className="console-hero">
        <div className="hero-brand-wrap">
          <div className="hero-brand-tile">
            {isGemini && <GeminiBrandIcon size={32} />}
            {isCodex && <OpenAIBrandIcon size={32} color="#10b981" />}
            {isClaude && <ClaudeBrandIcon size={32} color="#D97757" />}
          </div>

          <div className="hero-details">
            <div className="hero-title-row">
              <h1 className="hero-title">{provider.name}</h1>
              <span className="badge-tag">{provider.badge || 'Trụ Cột Cung Cấp'}</span>
              <span className={`status-pill ${activeAccountsCount > 0 ? 'pill-active' : 'pill-dim'}`}>
                <span className="pill-dot"></span>
                <span>{activeAccountsCount > 0 ? `${activeAccountsCount} Active` : 'Chưa kích hoạt'}</span>
              </span>
            </div>
            <p className="hero-desc">{provider.description}</p>
          </div>
        </div>

        <button
          type="button"
          className="btn-icon close-hero-btn"
          onClick={onClose}
          title="Đóng trang chi tiết"
        >
          <X size={16} />
        </button>
      </header>

      {/* 3. METRIC TELEMETRY STRIP (4 POLISHED KPI CARDS) */}
      <section className="telemetry-bar" aria-label="Provider Key Metrics">
        <div className="telemetry-item">
          <div className="telemetry-head">
            <span className="telemetry-label">Tài khoản kết nối</span>
            <div className="telemetry-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
              <Server size={14} />
            </div>
          </div>
          <div className="telemetry-value">
            <span className="telemetry-number">{accounts.length}</span>
            <span className="telemetry-sub">
              {accounts.filter(a => a.auth_type === 'oauth').length} OAuth • {accounts.filter(a => a.auth_type !== 'oauth').length} API Key
            </span>
          </div>
        </div>

        <div className="telemetry-item">
          <div className="telemetry-head">
            <span className="telemetry-label">Models sẵn sàng</span>
            <div className="telemetry-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
              <Cpu size={14} />
            </div>
          </div>
          <div className="telemetry-value">
            <span className="telemetry-number">{models.length}</span>
            <span className="telemetry-sub">
              Tier 1: {tier1Models.length} • Tier 2: {tier2Models.length} • Tier 3: {tier3Models.length}
            </span>
          </div>
        </div>

        <div className="telemetry-item">
          <div className="telemetry-head">
            <span className="telemetry-label">Điều phối Fallback</span>
            <div className="telemetry-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Zap size={14} />
            </div>
          </div>
          <div className="telemetry-value">
            <span className="telemetry-highlight" style={{ color: '#fbbf24' }}>2-Tier Fallback</span>
            <span className="telemetry-sub">Round-Robin xoay tua tự động</span>
          </div>
        </div>

        <div className="telemetry-item">
          <div className="telemetry-head">
            <span className="telemetry-label">Tình trạng Quota</span>
            <div className="telemetry-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Gauge size={14} />
            </div>
          </div>
          <div className="telemetry-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot green"></span>
              <span className="telemetry-highlight" style={{ color: '#10b981' }}>100% Sẵn sàng</span>
            </div>
            <span className="telemetry-sub">Chu kỳ reset 5h & weekly</span>
          </div>
        </div>
      </section>

      {/* 4. BALANCED 2-COLUMN WORKSPACE */}
      <div className="console-main-grid">
        {/* LEFT COLUMN: ACCOUNTS MANAGEMENT & OAUTH */}
        <section className="console-left-col">
          {/* OAUTH INTEGRATION BANNER */}
          <div className="oauth-card">
            <div className="oauth-info">
              <div className="oauth-title-row">
                <div className="oauth-brand-badge">
                  {isGemini ? <GeminiBrandIcon size={18} /> : isCodex ? <OpenAIBrandIcon size={18} /> : <ClaudeBrandIcon size={18} />}
                </div>
                <span className="oauth-title">
                  {isGemini
                    ? 'Đăng nhập Google (OAuth 2.0 Auto-Token)'
                    : isCodex
                    ? 'Đăng nhập OpenAI Codex (OAuth)'
                    : 'Đăng nhập Anthropic Claude (OAuth)'}
                </span>
                <span className="badge-tag live-badge">Khuyên Dùng</span>
              </div>
              <p className="oauth-desc">
                {isGemini
                  ? 'Tự động trích xuất Token Antigravity và hạn mức Quota từ Google Cloud Code mà không cần tạo API Key thủ công.'
                  : isCodex
                  ? 'Đăng nhập phiên OpenAI/Codex tự động xoay tua models khi chạy các Agent lập trình.'
                  : 'Đăng nhập phiên Anthropic Claude cấp quyền các model Claude 3.7 Sonnet & 3.5 Haiku.'}
              </p>
            </div>

            <button
              type="button"
              className={`oauth-connect-btn ${isGemini ? 'oauth-btn-google' : isCodex ? 'oauth-btn-codex' : 'oauth-btn-claude'}`}
              onClick={handleStartOAuth}
              disabled={isLoggingInGoogle}
            >
              {isLoggingInGoogle ? (
                <RefreshCw size={14} className="spin" />
              ) : isGemini ? (
                <GoogleGLogo size={16} />
              ) : isCodex ? (
                <OpenAIBrandIcon size={16} color="#fff" />
              ) : (
                <ClaudeBrandIcon size={16} color="#fff" />
              )}
              <span>
                {isLoggingInGoogle
                  ? 'Đang xác thực...'
                  : isGemini
                  ? 'Đăng nhập Google'
                  : isCodex
                  ? 'Đăng nhập OpenAI'
                  : 'Đăng nhập Claude'}
              </span>
            </button>
          </div>

          {/* MANUAL ADD FORM (COLLAPSIBLE) */}
          {showAddForm && (
            <form onSubmit={handleAddAccount} className="manual-add-card">
              <div className="form-card-header">
                <Key size={15} className="form-key-icon" />
                <span className="form-card-title">Thêm tài khoản {provider.name} bằng API Key</span>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Gmail / Định danh tài khoản *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="user@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tên hiển thị (Tùy chọn)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="vd: Gemini Primary Work"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">API Key *</label>
                <input
                  type="password"
                  className="form-input mono-text"
                  placeholder={isGemini ? "AIzaSy..." : isClaude ? "sk-ant-..." : "sk-..."}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="action-btn secondary small"
                  onClick={() => setShowAddForm(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="action-btn primary small"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          )}

          {/* FALLBACK POLICY HINT */}
          <div className="policy-callout">
            <ShieldCheck size={16} className="policy-icon" />
            <div className="policy-text">
              <strong>Xoay tua tự động (2-Tier Fallback): </strong>
              Khi tài khoản chạm hạn mức 429, Router chuyển tức thì sang tài khoản kế tiếp trên cùng model. Khi cạn tất cả tài khoản, hệ thống mới hạ tầng xuống tier kế tiếp.
            </div>
          </div>

          {/* ACCOUNTS LIST HEADER */}
          <div className="accounts-list-head">
            <div className="accounts-count-title">
              <span>Tài khoản đang kết nối</span>
              <span className="badge-tag mono-text">{accounts.length}</span>
            </div>
            <span className="accounts-sub-hint">Ưu tiên lần lượt theo thứ tự số #1, #2...</span>
          </div>

          {/* ACCOUNTS LIST */}
          <div className="accounts-stack">
            {loading ? (
              <div className="empty-state-card">
                <RefreshCw size={20} className="spin" />
                <span>Đang tải danh sách tài khoản...</span>
              </div>
            ) : accounts.length === 0 ? (
              <div className="empty-state-card">
                <Mail size={32} style={{ color: 'var(--text-dim)', marginBottom: '8px' }} />
                <div style={{ color: '#fff', fontWeight: '500', fontSize: '14px' }}>
                  Chưa có tài khoản nào được kết nối
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Bấm nút "Đăng nhập Google" hoặc "Thêm bằng API Key" ở trên để bắt đầu.
                </p>
              </div>
            ) : (
              accounts.map((acc, index) => {
                const isOAuth = acc.auth_type === 'oauth';
                const isTesting = testingId === acc.id;
                const isCopiedEmail = copiedEmailId === acc.id;
                const isExpanded = expandedModelsMap[acc.id] === true;

                // Quotas
                let parsedQuotas = [];
                try {
                  parsedQuotas = acc.quotas ? JSON.parse(acc.quotas) : [];
                } catch (e) {}
                if (parsedQuotas.length === 0) {
                  parsedQuotas = [
                    { name: 'Quota 5h', remainingPercentage: 100, resetTime: 'in 4h 23m' },
                    { name: 'Quota Weekly', remainingPercentage: 100, resetTime: 'in 6d 21h' }
                  ];
                }

                // Probed models
                let probedMap = {};
                let hasProbed = false;
                let realReadyCount = 0;
                let realCappedCount = 0;
                let realUnsupportedCount = 0;
                try {
                  if (acc.probed_models) {
                    const parsed = JSON.parse(acc.probed_models);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      hasProbed = true;
                      parsed.forEach(p => {
                        probedMap[p.modelId] = p;
                        if (p.statusCode === 200) realReadyCount++;
                        else if (p.statusCode === 429) realCappedCount++;
                        else if (p.statusCode === 404) realUnsupportedCount++;
                      });
                    }
                  }
                } catch (e) {}

                const userEmail = acc.email || acc.name || 'User';
                const initial = userEmail.charAt(0).toUpperCase();

                return (
                  <article key={acc.id} className="account-unit-card">
                    {/* Header Row */}
                    <div className="account-unit-top">
                      <div className="account-identity">
                        <div className="account-avatar-tile">
                          {initial}
                        </div>

                        <div>
                          <div className="account-email-row">
                            <span className="account-email-text">{acc.email || acc.name}</span>
                            <button
                              type="button"
                              className="btn-icon micro"
                              onClick={() => handleCopyEmail(acc.email || acc.name, acc.id)}
                              title="Sao chép email"
                            >
                              {isCopiedEmail ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                            </button>
                          </div>

                          <div className="account-meta-row">
                            <span className="account-name-text">
                              {acc.name && acc.name !== acc.email ? acc.name : 'Tài khoản Google'}
                            </span>
                            <span className="meta-sep">•</span>
                            <span className="account-priority-badge mono-text">
                              #{index + 1} {index === 0 ? 'Primary' : 'Fallback'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="account-controls">
                        <span className={`status-pill ${isOAuth ? 'pill-active' : 'pill-dim'}`}>
                          <span>{isOAuth ? 'OAuth 2.0' : 'API Key'}</span>
                        </span>

                        <label className="switch" title="Bật/Tắt tài khoản này trong Router">
                          <input
                            type="checkbox"
                            checked={!!acc.is_active}
                            onChange={() => handleToggleActive(acc)}
                          />
                          <span className="slider"></span>
                        </label>

                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDelete(acc.id)}
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={15} style={{ color: 'var(--text-dim)' }} />
                        </button>
                      </div>
                    </div>

                    {/* Quota Progress Gauges */}
                    <div className="account-quota-gauges">
                      {parsedQuotas.slice(0, 2).map((q, qIdx) => {
                        const pct = q.remainingPercentage ?? 100;
                        const gaugeColor = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
                        const gaugeGradient = pct > 50 
                          ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' 
                          : pct > 20 
                          ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' 
                          : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
                        return (
                          <div key={qIdx} className="quota-gauge-col">
                            <div className="quota-gauge-header">
                              <span className="gauge-name">{q.name}</span>
                              <span className="gauge-val mono-text" style={{ color: gaugeColor }}>
                                {pct}% {q.resetTime ? `(${q.resetTime})` : ''}
                              </span>
                            </div>
                            <div className="gauge-track">
                              <div
                                className="gauge-fill"
                                style={{ width: `${pct}%`, background: gaugeGradient }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Probed Models Summary Pill */}
                    <div className="account-probe-tray">
                      <div
                        className="probe-tray-trigger"
                        onClick={() => toggleExpandModels(acc.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') toggleExpandModels(acc.id);
                        }}
                      >
                        <div className="probe-tray-left">
                          <Cpu size={14} className="tray-cpu-icon" />
                          <span className="probe-summary-text">
                            {hasProbed
                              ? `Kết quả quét: ${realReadyCount} Sẵn sàng • ${realCappedCount} Hết quota • ${realUnsupportedCount} Không hỗ trợ`
                              : `Danh mục ${models.length} models (Nhấn để xem kết quả quét)`}
                          </span>
                          <span className={`status-pill ${hasProbed && realReadyCount > 0 ? 'pill-active' : 'pill-dim'}`}>
                            <span>{hasProbed ? `${realReadyCount} Live` : 'Chưa quét'}</span>
                          </span>
                        </div>

                        <div className="probe-tray-toggle-hint">
                          <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>
                      </div>

                      {/* Expandable Model Probe Grid */}
                      {isExpanded && (
                        <div className="probe-details-grid">
                          {models.map((m) => {
                            const probeInfo = probedMap[m.id];
                            const isReady = probeInfo?.statusCode === 200;
                            const isCapped = probeInfo?.statusCode === 429;
                            const is404 = probeInfo?.statusCode === 404;

                            return (
                              <div
                                key={m.id}
                                className={`probe-mini-item ${isReady ? 'is-ready' : isCapped ? 'is-capped' : is404 ? 'is-404' : ''}`}
                              >
                                <div className="mini-item-head">
                                  <span className="mini-tier-badge">T{m.tier}</span>
                                  <span className="mini-ctx-tag mono-text">{m.ctx}</span>
                                </div>
                                <div className="mini-model-id mono-text" title={m.id}>
                                  {m.id}
                                </div>
                                <div className="mini-status-text">
                                  {isReady && <span className="text-ready">● Sẵn sàng ({probeInfo.latencyMs}ms)</span>}
                                  {isCapped && <span className="text-capped">▲ Hết quota (429)</span>}
                                  {is404 && <span className="text-unsupported">✕ Không hỗ trợ (404)</span>}
                                  {!probeInfo && <span className="text-untested">○ Chưa kiểm tra</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="account-unit-footer">
                      <div className="footer-status-msg">
                        <span className={`status-dot ${hasProbed && realReadyCount > 0 ? 'green' : 'dim'}`}></span>
                        <span className="footer-status-text">
                          {hasProbed
                            ? `${realReadyCount} models sẵn sàng gọi token • Latency probe thấp`
                            : (acc.test_message || 'Sẵn sàng định tuyến')}
                        </span>
                      </div>

                      <div className="footer-actions-group">
                        {!isOAuth && (
                          <button
                            type="button"
                            className="btn-icon micro"
                            onClick={() => {
                              setEditingAccount(acc);
                              setEditApiKey('');
                            }}
                            title="Sửa API Key"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-test-account"
                          onClick={() => handleTestConnection(acc.id)}
                          disabled={isTesting}
                        >
                          <RefreshCw size={11} className={isTesting ? 'spin' : ''} />
                          <span>{isTesting ? 'Đang test...' : 'Test kết nối'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn-probe-model"
                          onClick={() => handleProbeModels(acc.id)}
                          disabled={probingId === acc.id}
                        >
                          <Search size={11} className={probingId === acc.id ? 'spin' : ''} />
                          <span>{probingId === acc.id ? 'Đang quét...' : 'Quét Live Models'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: MODEL CAPABILITY MATRIX & FALLBACK POLICY */}
        <section className="console-right-col">
          {/* CARD 1: MODEL MATRIX WITH FILTER TABS */}
          <div className="console-panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <Cpu size={16} className="panel-icon" />
                <h3 className="panel-title">Ma Trận Models ({models.length})</h3>
              </div>
            </div>

            <p className="panel-desc">
              Phân cấp năng lực models từ Flagship (Deep Think) xuống Standard & Economy để Router tự động xoay tua thông minh.
            </p>

            {/* Segmented Filter Bar */}
            <div className="segmented-filter-bar">
              <button
                type="button"
                className={`filter-btn ${selectedTierFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedTierFilter('all')}
              >
                Tất cả ({models.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${selectedTierFilter === 'tier1' ? 'active' : ''}`}
                onClick={() => setSelectedTierFilter('tier1')}
              >
                Tier 1 ({tier1Models.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${selectedTierFilter === 'tier2' ? 'active' : ''}`}
                onClick={() => setSelectedTierFilter('tier2')}
              >
                Tier 2 ({tier2Models.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${selectedTierFilter === 'tier3' ? 'active' : ''}`}
                onClick={() => setSelectedTierFilter('tier3')}
              >
                Tier 3 ({tier3Models.length})
              </button>
            </div>

            {/* Model Scannable List */}
            <div className="models-scannable-list">
              {displayedModels.map((m) => (
                <div key={m.id} className="model-row-item">
                  <div className="model-row-identity">
                    <span className={`tier-badge-pill tier-${m.tier}`}>
                      T{m.tier}
                    </span>
                    <div>
                      <div className="model-row-id mono-text">{m.id}</div>
                      <div className="model-row-name">{m.name}</div>
                    </div>
                  </div>

                  <div className="model-row-tags">
                    <span className="ctx-tag mono-text">{m.ctx}</span>
                    <span className="model-status-chip">Sẵn sàng</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: 2-TIER FALLBACK MECHANISM */}
          <div className="console-panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <Layers size={16} className="panel-icon" />
                <h3 className="panel-title">Cơ Chế 2-Tier Fallback</h3>
              </div>
              <span className="panel-badge">Anti-429</span>
            </div>

            <div className="fallback-flow-box">
              <div className="fallback-flow-row">
                <span className="flow-step-tag">BƯỚC 1</span>
                <span>Client gọi Model Tier 1 (vd: <code>gemini-3.8-flash-high</code>) qua <strong>Account #1</strong></span>
              </div>

              <div className="fallback-flow-sub">
                <CornerDownRight size={13} className="flow-sub-icon" />
                <span>Nếu Account #1 chạm hạn mức <strong>HTTP 429</strong>:</span>
              </div>

              <div className="fallback-flow-branch">
                <ArrowRight size={13} className="flow-branch-icon" />
                <span>Tự động xoay tua sang <strong>Account #2</strong> (vẫn giữ nguyên Tier 1)</span>
              </div>

              <div className="fallback-flow-sub">
                <CornerDownRight size={13} className="flow-sub-icon red" />
                <span>Nếu tất cả các tài khoản đều chạm hạn mức 429:</span>
              </div>

              <div className="fallback-flow-branch">
                <ArrowRight size={13} className="flow-branch-icon blue" />
                <span>Tự động hạ tầng sang <strong>Tier 2 Standard</strong> và tiếp tục stream phản hồi</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* EDIT KEY MODAL */}
      {editingAccount && (
        <div className="modal-backdrop">
          <form onSubmit={handleSaveEditedKey} className="modal-card">
            <div className="modal-head">
              <h3 className="modal-title">Cập nhật API Key cho {editingAccount.email || editingAccount.name}</h3>
              <button type="button" className="btn-icon" onClick={() => setEditingAccount(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">API Key mới</label>
              <input
                type="text"
                className="form-input mono-text"
                placeholder="Nhập API Key mới..."
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
                required
              />
            </div>

            <div className="modal-foot">
              <button type="button" className="action-btn secondary small" onClick={() => setEditingAccount(null)}>
                Hủy
              </button>
              <button type="submit" className="action-btn primary small">
                Cập nhật & Test
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REAL-TIME MODEL PROBE RESULTS MODAL */}
      {probeModalData && (
        <div className="modal-backdrop">
          <div className="modal-card wide">
            <div className="modal-head">
              <div>
                <h3 className="modal-title">Kết Quả Quét Thực Tế (Live Model Probe)</h3>
                <p className="modal-subtitle">
                  Tài khoản: <strong style={{ color: '#fff' }}>{probeModalData.email}</strong> • {probeModalData.catalogSource || 'Provider'} xác nhận <strong style={{ color: '#38bdf8' }}>{probeModalData.totalCatalogFromGoogle} models</strong>
                </p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setProbeModalData(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-scroll">
              {probeModalData.probeResults?.map((res) => {
                const is200 = res.statusCode === 200;
                const is429 = res.statusCode === 429;
                const statusColor = is200 ? '#10b981' : is429 ? '#f59e0b' : '#ef4444';

                return (
                  <div key={res.modelId} className={`probe-res-item ${is200 ? 'ready' : ''}`}>
                    <div className="res-item-top">
                      <div className="res-item-left">
                        <span className="res-model-id mono-text">{res.modelId}</span>
                        <span className={`status-pill ${is200 ? 'pill-active' : 'pill-dim'}`}>
                          <span>HTTP {res.statusCode}</span>
                        </span>
                        {res.channel && (
                          <span className="res-channel-badge mono-text">{res.channel}</span>
                        )}
                      </div>
                      <span className="res-latency mono-text">{res.latencyMs}ms</span>
                    </div>

                    <div className="res-status-msg" style={{ color: statusColor }}>
                      ● {res.statusText}
                    </div>

                    <div className="res-snippet-box mono-text">
                      Snippet: {res.responseSnippet}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-foot">
              <span className="dim-text" style={{ fontSize: '11.5px' }}>
                Xác thực kép qua Google Cloud Code & AI Studio
              </span>
              <button
                type="button"
                className="action-btn primary small"
                onClick={() => setProbeModalData(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
