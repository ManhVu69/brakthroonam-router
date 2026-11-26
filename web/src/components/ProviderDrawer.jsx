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

function formatResetTime(rawTime) {
  if (!rawTime) return '';
  const trimmed = String(rawTime).trim();
  if (trimmed.startsWith('in ')) {
    return trimmed.replace('in ', 'sau ');
  }
  if (trimmed.includes('T') && (trimmed.endsWith('Z') || trimmed.includes('+'))) {
    try {
      const target = new Date(trimmed);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      if (isNaN(diffMs) || diffMs <= 0) return 'đã reset';
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHours >= 24) {
        const days = Math.floor(diffHours / 24);
        const remH = diffHours % 24;
        return `sau ${days}d ${remH}h`;
      }
      if (diffHours > 0) return `sau ${diffHours}h ${diffMins}m`;
      return `sau ${diffMins}m`;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
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

  const models = provider.models || [];
  const isGemini = provider.id === 'gemini';
  const isCodex = provider.id === 'codex';
  const isClaude = provider.id === 'claude';
  const activeAccountsCount = accounts.filter(a => a.is_active).length;

  return (
    <div className="provider-console-shell">
      {/* 1. UNIFIED SINGLE-ROW NAVIGATION & STATUS BAR */}
      <header className="console-nav-v2">
        <div className="nav-left-v2">
          <button
            type="button"
            className="nav-back-link"
            onClick={onClose}
          >
            <ArrowLeft size={14} />
            <span>Provider</span>
          </button>
          <span className="nav-slash">/</span>
          <div className="nav-provider-pill">
            {isGemini && <GeminiBrandIcon size={18} />}
            {isCodex && <OpenAIBrandIcon size={18} />}
            {isClaude && <ClaudeBrandIcon size={18} />}
            <span className="nav-provider-name">{provider.name}</span>
          </div>
          <span className={`status-pill ${activeAccountsCount > 0 ? 'pill-active' : 'pill-dim'}`}>
            <span className="pill-dot"></span>
            <span>{activeAccountsCount > 0 ? `${activeAccountsCount} Active` : 'Chưa kích hoạt'}</span>
          </span>
        </div>

        <div className="nav-actions-v2">
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

          <button
            type="button"
            className="btn-icon close-header-btn"
            onClick={onClose}
            title="Đóng trang chi tiết"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="console-main-grid">
        <section className="console-left-col">
          {/* OAUTH INTEGRATION FAST CONNECT BANNER */}
          <div className="oauth-card-v2">
            <div className="oauth-info-v2">
              <div className="oauth-title-row-v2">
                <div className="oauth-brand-badge-v2">
                  {isGemini ? <GoogleGLogo size={17} /> : isCodex ? <OpenAIBrandIcon size={17} /> : <ClaudeBrandIcon size={17} />}
                </div>
                <span className="oauth-title-text">
                  {isGemini
                    ? 'Đăng nhập Google (OAuth 2.0)'
                    : isCodex
                    ? 'Đăng nhập OpenAI Codex (OAuth)'
                    : 'Đăng nhập Anthropic Claude (OAuth)'}
                </span>
                <span className="pill-tag-subtle">Khuyên dùng</span>
              </div>
              <p className="oauth-desc-text">
                {isGemini
                  ? 'Tự động trích xuất Token Antigravity và hạn mức Quota từ Google Cloud Code mà không cần tạo API Key thủ công.'
                  : isCodex
                  ? 'Đăng nhập phiên OpenAI/Codex tự động xoay tua models khi chạy các Agent lập trình.'
                  : 'Đăng nhập phiên Anthropic Claude cấp quyền các model Claude 3.7 Sonnet & 3.5 Haiku.'}
              </p>
            </div>

            <button
              type="button"
              className="btn-oauth-v2"
              onClick={handleStartOAuth}
              disabled={isLoggingInGoogle}
            >
              {isLoggingInGoogle ? (
                <RefreshCw size={13} className="spin" />
              ) : isGemini ? (
                <GoogleGLogo size={15} />
              ) : isCodex ? (
                <OpenAIBrandIcon size={15} color="#fff" />
              ) : (
                <ClaudeBrandIcon size={15} color="#fff" />
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

          {/* ACCOUNTS DATA TABLE (OPTION A - LINEAR / VERCEL STYLE) */}
          <div className="account-table-wrapper">
            <div className="accounts-list-head">
              <div className="accounts-count-title">
                <span>Tài khoản đang kết nối</span>
                <span className="badge-tag mono-text">{accounts.length}</span>
              </div>
              <span className="accounts-sub-hint">Ưu tiên điều phối: #1 Primary → #2 Fallback</span>
            </div>

            <div className="account-table-container">
              {/* TABLE HEADER */}
              <div className="account-table-head">
                <div className="col-identity">TÀI KHOẢN & VAI TRÒ</div>
                <div className="col-quota">HẠN MỨC QUOTA</div>
                <div className="col-probe">TÌNH TRẠNG LIVE PROBE</div>
                <div className="col-actions">THAO TÁC</div>
              </div>

              {loading ? (
                <div className="empty-state-card">
                  <RefreshCw size={18} className="spin" />
                  <span>Đang tải danh sách tài khoản...</span>
                </div>
              ) : accounts.length === 0 ? (
                <div className="empty-state-card">
                  <Mail size={28} style={{ color: 'var(--text-dim)', marginBottom: '8px' }} />
                  <div style={{ color: '#fff', fontWeight: '500', fontSize: '13.5px' }}>
                    Chưa có tài khoản nào được kết nối
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Bấm nút "Đăng nhập Google" hoặc "Thêm bằng API Key" ở trên để bắt đầu.
                  </p>
                </div>
              ) : (
                accounts.map((acc, index) => {
                  const isOAuth = acc.auth_type === 'oauth';
                  const isTesting = testingId === acc.id;
                  const isProbing = probingId === acc.id;
                  const isCopiedEmail = copiedEmailId === acc.id;
                  const isExpanded = expandedModelsMap[acc.id] === true;

                  // Quotas
                  let parsedQuotas = [];
                  try {
                    parsedQuotas = acc.quotas ? JSON.parse(acc.quotas) : [];
                  } catch (e) {}
                  if (parsedQuotas.length === 0) {
                    parsedQuotas = [
                      { name: '5h', remainingPercentage: 100, resetTime: 'in 4h 23m' },
                      { name: 'Weekly', remainingPercentage: 100, resetTime: 'in 6d 21h' }
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
                    <div key={acc.id} className={`account-row-group ${!acc.is_active ? 'is-inactive' : ''}`}>
                      <div className="account-table-row">
                        {/* 1. IDENTITY & ROLE */}
                        <div className="col-identity">
                          <div className="row-avatar-tile">{initial}</div>
                          <div className="row-identity-meta">
                            <div className="row-email-wrap">
                              <span className="row-email-text" title={userEmail}>{userEmail}</span>
                              <button
                                type="button"
                                className="btn-icon micro"
                                onClick={() => handleCopyEmail(userEmail, acc.id)}
                                title="Sao chép email"
                              >
                                {isCopiedEmail ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                              </button>
                            </div>
                            <div className="row-sub-tags">
                              <span className={`priority-chip ${index === 0 ? 'is-primary' : 'is-fallback'}`}>
                                #{index + 1} {index === 0 ? 'Primary' : 'Fallback'}
                              </span>
                              <span className="auth-chip">
                                {isOAuth ? 'OAuth 2.0' : 'API Key'}
                              </span>
                              {acc.name && acc.name !== acc.email && (
                                <span className="row-name-text">{acc.name}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. COMPACT QUOTA STACK */}
                        <div className="col-quota">
                          <div className="quota-mini-stack">
                            {parsedQuotas.slice(0, 2).map((q, qIdx) => {
                              const pct = q.remainingPercentage ?? 100;
                              const barColor = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
                              const shortName = q.name.toLowerCase().includes('weekly') ? 'Tuần' : '5h';
                              const humanReset = formatResetTime(q.resetTime);
                              return (
                                <div key={qIdx} className="quota-mini-item">
                                  <span className="quota-mini-name">{shortName}</span>
                                  <div className="quota-mini-track">
                                    <div
                                      className="quota-mini-fill"
                                      style={{ width: `${pct}%`, background: barColor }}
                                    ></div>
                                  </div>
                                  <span className="quota-mini-pct mono-text" style={{ color: barColor }}>
                                    {pct}%
                                  </span>
                                  {humanReset && (
                                    <span className="quota-mini-reset mono-text">
                                      {humanReset}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. PROBE & HEALTH */}
                        <div className="col-probe">
                          <div className="probe-status-wrap">
                            <div className="probe-status-main">
                              <span className={`status-dot ${hasProbed && realReadyCount > 0 ? 'green' : 'dim'}`}></span>
                              <span className="probe-status-label">
                                {hasProbed
                                  ? `${realReadyCount} models sẵn sàng`
                                  : 'Chưa quét models'}
                              </span>
                            </div>
                            <div className="probe-status-sub">
                              <button
                                type="button"
                                className="btn-link-expand"
                                onClick={() => toggleExpandModels(acc.id)}
                              >
                                <span>{isExpanded ? 'Thu gọn' : 'Ma trận models'} ({models.length})</span>
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 4. FAST ACTIONS */}
                        <div className="col-actions">
                          <button
                            type="button"
                            className="row-action-btn"
                            onClick={() => handleTestConnection(acc.id)}
                            disabled={isTesting}
                            title="Test kết nối"
                          >
                            <RefreshCw size={11} className={isTesting ? 'spin' : ''} />
                            <span>{isTesting ? 'Đang test...' : 'Test'}</span>
                          </button>

                          <button
                            type="button"
                            className="row-action-btn probe-btn"
                            onClick={() => handleProbeModels(acc.id)}
                            disabled={isProbing}
                            title="Quét toàn bộ models của tài khoản này"
                          >
                            <Search size={11} className={isProbing ? 'spin' : ''} />
                            <span>{isProbing ? 'Quét...' : 'Quét'}</span>
                          </button>

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
                              <Edit2 size={12} />
                            </button>
                          )}

                          <label className="switch micro-switch" title="Bật/Tắt tài khoản này trong Router">
                            <input
                              type="checkbox"
                              checked={!!acc.is_active}
                              onChange={() => handleToggleActive(acc)}
                            />
                            <span className="slider"></span>
                          </label>

                          <button
                            type="button"
                            className="btn-icon micro text-danger"
                            onClick={() => handleDelete(acc.id)}
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* EXPANDED MODEL MATRIX ACCORDION */}
                      {isExpanded && (
                        <div className="account-expanded-panel">
                          <div className="probe-tray-info-bar">
                            <span className="tray-info-text">
                              {hasProbed
                                ? `Kết quả quét: ${realReadyCount} Sẵn sàng • ${realCappedCount} Hết quota • ${realUnsupportedCount} Không hỗ trợ`
                                : `Danh mục ${models.length} models có thể gọi qua tài khoản này`}
                            </span>
                          </div>
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
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
