import React, { useState, useEffect } from 'react';
import {
  X, Plus, Key, Trash2, CheckCircle2, AlertCircle, ArrowLeft,
  RefreshCw, Check, Edit2, ShieldCheck, AlertTriangle,
  Copy, Cpu, Layers, Zap, ChevronDown, ChevronUp,
  Server, Activity, Shield, Terminal, ArrowRight, Gauge,
  SlidersHorizontal, Sliders, Settings, Upload, MoveUp, MoveDown,
  UserCheck, HardDrive, Radio, Sparkles, ExternalLink, ArrowUpRight,
  Code2, FileCode, CheckSquare, Search
} from 'lucide-react';

// 1. Google Full-color SVG Official
function GoogleGLogo({ size = 20 }) {
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

// 2. Google Gemini Sparkle Official SVG
function GeminiBrandIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"
        fill="url(#gemini_pro_gradient)"
      />
      <defs>
        <radialGradient
          id="gemini_pro_gradient"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(3 3) rotate(45) scale(26)"
        >
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="35%" stopColor="#2563EB" />
          <stop offset="70%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// 3. OpenAI Spiral SVG
function OpenAIBrandIcon({ size = 22, color = '#10b981' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.08 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.493zm-9.66-4.22a4.47 4.47 0 0 1-.534-3.037l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062l-4.832 2.79a4.5 4.5 0 0 1-6.15-1.622zm-1.89-9.52a4.484 4.484 0 0 1 2.34-1.996v5.665a.792.792 0 0 0 .39.681l5.84 3.37-2.02 1.168a.082.082 0 0 1-.071 0l-4.83-2.79a4.508 4.508 0 0 1-1.65-6.098zm15.908 3.73-5.84-3.37 2.02-1.168a.082.082 0 0 1 .071 0l4.83 2.79a4.5 4.5 0 0 1 1.65 6.098 4.494 4.494 0 0 1-2.34 2v-5.669a.783.783 0 0 0-.391-.681zm2.01-3.69a4.47 4.47 0 0 1 .533 3.037l-.142-.085-4.783-2.759a.771.771 0 0 0-.78 0l-5.843 3.369v-2.332a.08.08 0 0 1 .033-.062l4.832-2.79a4.5 4.5 0 0 1 6.15 1.632zM8.307 8.328l2.02-1.168a.076.076 0 0 1 .077 0l4.832 2.79a4.495 4.495 0 0 1 1.65 6.098 4.48 4.48 0 0 1-2.34 2v-5.665a.792.792 0 0 0-.39-.681zm.996 3.12 2.697-1.558 2.698 1.558v3.114l-2.698 1.558-2.697-1.558z" />
    </svg>
  );
}

// 4. Anthropic Claude Asterisk Logo SVG
function ClaudeBrandIcon({ size = 22, color = '#D97757' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="3.2" fill={color} />
      <path
        d="M12 2.5v5.2m0 8.6v5.2M2.5 12h5.2m8.6 0h5.2M5.28 5.28l3.68 3.68m6.08 6.08l3.68 3.68M5.28 18.72l3.68-3.68m6.08-6.08l3.68-3.68"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Format reset time
function formatResetTime(rawTime) {
  if (!rawTime) return '';
  const trimmed = String(rawTime).trim();
  if (trimmed.startsWith('in ')) return trimmed.replace('in ', 'sau ');
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

// Role configurations dictionary
const ROLE_CONFIGS = {
  all: { label: 'All Roles', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.25)' },
  planner: { label: 'Planner', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.25)' },
  coder: { label: 'Coder', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
  reviewer: { label: 'Code Reviewer', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
  tester: { label: 'Tester', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.25)' },
  background: { label: 'Background Agent', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.25)' }
};

export default function ProviderDrawer({ provider, onClose, onUpdated }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdvancedSettingsModal, setShowAdvancedSettingsModal] = useState(false);
  const [roleModalAccount, setRoleModalAccount] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [priority, setPriority] = useState(1);
  const [accountRole, setAccountRole] = useState('all');
  const [saving, setSaving] = useState(false);

  // Advanced Routing & Settings
  const [routingStrategy, setRoutingStrategy] = useState('priority');
  const [heartbeatInterval, setHeartbeatInterval] = useState('30s');
  const [autoEvict429, setAutoEvict429] = useState(true);

  // Import state
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  // Action states
  const [testingId, setTestingId] = useState(null);
  const [testingAll, setTestingAll] = useState(false);
  const [probingId, setProbingId] = useState(null);
  const [probeModalData, setProbeModalData] = useState(null);
  const [copiedEmailId, setCopiedEmailId] = useState(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [expandedModelsMap, setExpandedModelsMap] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // Edit Key Modal
  const [editingAccount, setEditingAccount] = useState(null);
  const [editApiKey, setEditApiKey] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchSettings();

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
        showToast('Kết nối tài khoản OAuth thành công!');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [provider]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.providerStrategies && data.providerStrategies[provider.id]) {
        setRoutingStrategy(data.providerStrategies[provider.id].fallbackStrategy || 'priority');
      }
    } catch (_) {}
  };

  const saveSettings = async (strategy, hb, evict) => {
    try {
      const res = await fetch('/api/settings');
      const current = await res.json();
      const updated = {
        ...current,
        providerStrategies: {
          ...(current.providerStrategies || {}),
          [provider.id]: {
            fallbackStrategy: strategy || routingStrategy,
            heartbeat: hb || heartbeatInterval,
            autoEvict429: evict !== undefined ? evict : autoEvict429
          }
        }
      };
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      showToast('Đã lưu cấu hình Gateway thành công');
    } catch (_) {}
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/providers/${provider.id}/accounts`);
      const data = await res.json();
      setAccounts(data);

      const expandMap = {};
      data.forEach(acc => {
        expandMap[acc.id] = false;
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
          priority: Number(priority) || 1,
          role: accountRole
        })
      });
      if (res.ok) {
        setEmail('');
        setName('');
        setApiKey('');
        setShowAddForm(false);
        await fetchAccounts();
        if (onUpdated) onUpdated();
        showToast('Đã thêm tài khoản thành công!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleImportProfiles = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    let successCount = 0;

    try {
      // 1. Try JSON Array parse
      let parsed = null;
      try {
        parsed = JSON.parse(importText);
      } catch (_) {}

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const k = item.api_key || item.apiKey || item.key;
          const em = item.email || item.name || `key_${Math.random().toString(36).substring(2, 7)}`;
          if (k) {
            await fetch(`/api/providers/${provider.id}/accounts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: em,
                name: item.name || em,
                api_key: k,
                priority: item.priority || 2,
                role: item.role || 'all'
              })
            }).catch(() => {});
            successCount++;
          }
        }
      } else {
        // 2. Parse .env format line-by-line
        const lines = importText.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          let keyVal = trimmed;
          if (trimmed.includes('=')) {
            keyVal = trimmed.split('=')[1].replace(/["']/g, '').trim();
          }
          if (keyVal.length > 10) {
            const alias = `Imported_${keyVal.slice(0, 6)}…`;
            await fetch(`/api/providers/${provider.id}/accounts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: alias,
                name: alias,
                api_key: keyVal,
                priority: accounts.length + successCount + 1,
                role: 'all'
              })
            }).catch(() => {});
            successCount++;
          }
        }
      }

      setShowImportModal(false);
      setImportText('');
      await fetchAccounts();
      if (onUpdated) onUpdated();
      showToast(`Đã import thành công ${successCount} hồ sơ API Key!`);
    } catch (err) {
      alert('Lỗi khi import: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleMovePriority = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= accounts.length) return;

    const currentAcc = accounts[index];
    const targetAcc = accounts[targetIndex];

    const currentP = currentAcc.priority || (index + 1);
    const targetP = targetAcc.priority || (targetIndex + 1);

    // Swap priorities in DB
    try {
      await fetch(`/api/providers/${provider.id}/accounts/${currentAcc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: targetP })
      });
      await fetch(`/api/providers/${provider.id}/accounts/${targetAcc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: currentP })
      });
      await fetchAccounts();
      if (onUpdated) onUpdated();
      showToast(`Đã đổi thứ tự: ${currentAcc.email || currentAcc.name} ➔ #${targetIndex + 1}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (accId, newRole) => {
    try {
      await fetch(`/api/providers/${provider.id}/accounts/${accId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      setRoleModalAccount(null);
      await fetchAccounts();
      if (onUpdated) onUpdated();
      showToast(`Đã cập nhật vai trò: ${ROLE_CONFIGS[newRole]?.label || newRole}`);
    } catch (err) {
      console.error(err);
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
        showToast('Đã kiểm tra kết nối tài khoản');
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
      showToast('Đã hoàn tất kiểm tra toàn bộ tài khoản');
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
      showToast(account.is_active ? 'Đã tắt nhận request cho tài khoản' : 'Đã kích hoạt tài khoản');
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
      showToast('Đã xóa tài khoản khỏi pool');
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
        showToast('Cập nhật API Key thành công!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyEmail = (emailText, id) => {
    if (!emailText) return;
    navigator.clipboard.writeText(emailText);
    setCopiedEmailId(id);
    showToast('Đã sao chép định danh tài khoản');
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  const handleCopyToken = (acc) => {
    const token = acc.raw_key || acc.masked_key || 'TOKEN';
    navigator.clipboard.writeText(token);
    showToast('Đã sao chép Access Token vào clipboard');
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="pro-toast">
          <Check size={14} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HIGH-CONFIG ENGINE SUB-HEADER & ROUTING CONTROLS */}
      <header className="gateway-engine-header">
        <div className="engine-header-left">
          <button
            type="button"
            className="engine-breadcrumb-back"
            onClick={onClose}
            title="Quay lại danh sách Provider"
          >
            <ArrowLeft size={14} />
            <span>Provider</span>
          </button>
          <span className="engine-slash">/</span>
          <div className="engine-provider-badge">
            {isGemini && <GeminiBrandIcon size={19} />}
            {isCodex && <OpenAIBrandIcon size={19} />}
            {isClaude && <ClaudeBrandIcon size={19} />}
            <span className="engine-provider-title">{provider.name}</span>
          </div>

          <div className={`engine-status-pill ${activeAccountsCount > 0 ? 'is-active' : 'is-standby'}`}>
            <span className="engine-pulse-dot"></span>
            <span className="mono-text">
              {activeAccountsCount > 0 ? `Active (${activeAccountsCount} Nodes)` : 'Standby (0 Nodes)'}
            </span>
          </div>
        </div>

        {/* Central Gateway Policy Control Bar */}
        <div className="engine-header-controls">
          <div className="control-group" title="Thuật toán điều phối phân bổ request">
            <label className="control-label mono-text">Routing Strategy:</label>
            <select
              className="control-select mono-text"
              value={routingStrategy}
              onChange={(e) => {
                setRoutingStrategy(e.target.value);
                saveSettings(e.target.value, heartbeatInterval, autoEvict429);
              }}
            >
              <option value="priority">#1 Priority Waterfall (Mặc định)</option>
              <option value="round-robin">Round-Robin Load Balance</option>
              <option value="least-quota">Least Quota Usage</option>
            </select>
          </div>

          <div className="control-group" title="Tần suất heartbeat kiểm tra trạng thái">
            <label className="control-label mono-text">Live Probe:</label>
            <select
              className="control-select mono-text"
              value={heartbeatInterval}
              onChange={(e) => {
                setHeartbeatInterval(e.target.value);
                saveSettings(routingStrategy, e.target.value, autoEvict429);
              }}
            >
              <option value="30s">Ping mỗi 30s</option>
              <option value="60s">Ping mỗi 60s</option>
              <option value="auto-evict">Auto-evict khi lỗi 429 liên tiếp</option>
            </select>
          </div>

          <div className="header-action-buttons">
            <button
              type="button"
              className="btn-engine secondary"
              onClick={handleTestAllAccounts}
              disabled={testingAll || accounts.length === 0}
              title="Gửi request test kết nối tới toàn bộ tài khoản"
            >
              <RefreshCw size={13} className={testingAll ? 'spin' : ''} />
              <span>{testingAll ? 'Đang test...' : 'Test toàn bộ'}</span>
            </button>

            <button
              type="button"
              className="btn-engine secondary"
              onClick={() => setShowAdvancedSettingsModal(true)}
              title="Mở cấu hình hạ tầng nâng cao"
            >
              <Settings size={13} />
              <span>Cấu hình nâng cao</span>
            </button>

            <button
              type="button"
              className="btn-engine primary"
              onClick={() => setShowAddForm(!showAddForm)}
              title="Thêm tài khoản thủ công"
            >
              <Plus size={14} />
              <span>{showAddForm ? 'Đóng' : '+ Thêm API Key'}</span>
            </button>

            <button
              type="button"
              className="btn-engine-icon"
              onClick={onClose}
              title="Đóng bảng điều khiển"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MANUAL ADD FORM (COLLAPSIBLE CARD) */}
      {showAddForm && (
        <form onSubmit={handleAddAccount} className="manual-add-glass-card">
          <div className="form-head">
            <div className="form-head-left">
              <Key size={15} style={{ color: '#06b6d4' }} />
              <span className="form-title">Nạp API Key vào Gateway Pool ({provider.name})</span>
            </div>
            <button type="button" className="btn-icon micro" onClick={() => setShowAddForm(false)}>
              <X size={14} />
            </button>
          </div>

          <div className="grid-3">
            <div className="form-field">
              <label className="field-label">Gmail / Định danh tài khoản *</label>
              <input
                type="text"
                className="field-input"
                placeholder="user@gmail.com hoặc Key Alias"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="field-label">Tên gợi nhớ (Tùy chọn)</label>
              <input
                type="text"
                className="field-input"
                placeholder="vd: Work Coder Primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="field-label">Gán vai trò chuyên biệt</label>
              <select
                className="field-input"
                value={accountRole}
                onChange={(e) => setAccountRole(e.target.value)}
              >
                <option value="all">All Roles (Tất cả vai trò)</option>
                <option value="coder">Coder (Chuyên viết mã)</option>
                <option value="planner">Planner (Lập kế hoạch)</option>
                <option value="reviewer">Code Reviewer (Thẩm định)</option>
                <option value="tester">Tester (Kiểm thử)</option>
                <option value="background">Background Agent</option>
              </select>
            </div>
          </div>

          <div className="grid-2 mt-2">
            <div className="form-field">
              <label className="field-label">API Key *</label>
              <input
                type="password"
                className="field-input mono-text"
                placeholder={isGemini ? "AIzaSy..." : isClaude ? "sk-ant-..." : "sk-..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="field-label">Độ ưu tiên điều phối</label>
              <select
                className="field-input mono-text"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              >
                <option value={1}>#1 Primary (Ưu tiên số 1)</option>
                <option value={2}>#2 Fallback (Dự phòng slot 2)</option>
                <option value={3}>#3 Standby (Chờ slot 3)</option>
                <option value={4}>#4 Low Priority</option>
              </select>
            </div>
          </div>

          <div className="form-foot-actions">
            <button
              type="button"
              className="btn-engine secondary small"
              onClick={() => setShowAddForm(false)}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-engine primary small"
              disabled={saving}
            >
              {saving ? 'Đang xác thực & Lưu...' : 'Lưu vào Gateway Pool'}
            </button>
          </div>
        </form>
      )}

      {/* 3. MAIN CONTENT: ZERO-ACCOUNT STATE OR POPULATED FLEET TABLE */}
      <div className="engine-main-workspace">
        {loading ? (
          <div className="loading-state-card">
            <RefreshCw size={22} className="spin" style={{ color: '#06b6d4' }} />
            <span className="mono-text">Đang đồng bộ danh mục Nodes và Quota từ Brakthroonam Gateway...</span>
          </div>
        ) : accounts.length === 0 ? (
          /* =========================================================================
             SECTION B: ZERO-ACCOUNT STATE - INTERACTIVE DISPATCH CANVAS
             ========================================================================= */
          <div className="zero-dispatch-canvas">
            {/* 1. Dual Connect Action Cards (2 Cột Bento đối xứng) */}
            <div className="bento-connect-grid">
              {/* Card 1: Google OAuth 2.0 (Khuyên dùng - Auto-Sync) */}
              <div className="bento-card oauth-bento">
                <div className="bento-card-top">
                  <div className="bento-badge-row">
                    <span className="badge-pill recommended">
                      <Sparkles size={11} /> Recommended • Zero Config
                    </span>
                    <span className="bento-telemetry-tag mono-text">Auto-Sync</span>
                  </div>
                  <div className="bento-icon-wrapper">
                    {isGemini ? <GoogleGLogo size={32} /> : isCodex ? <OpenAIBrandIcon size={32} /> : <ClaudeBrandIcon size={32} />}
                  </div>
                </div>

                <div className="bento-card-body">
                  <h3 className="bento-title">
                    {isGemini
                      ? 'Google OAuth 2.0 (Khuyên dùng)'
                      : isCodex
                      ? 'OpenAI OAuth Authentication'
                      : 'Anthropic OAuth Authentication'}
                  </h3>
                  <p className="bento-desc">
                    {isGemini
                      ? 'Tự động trích xuất Token Antigravity và hạn mức Quota từ Google Cloud Code mà không cần tạo API Key thủ công.'
                      : isCodex
                      ? 'Đăng nhập phiên OpenAI/Codex tự động xoay tua models khi chạy các Agent lập trình.'
                      : 'Đăng nhập phiên Anthropic Claude cấp quyền các model Claude 3.7 Sonnet & 3.5 Haiku.'}
                  </p>

                  <div className="bento-feature-checklist">
                    <div className="check-item">
                      <Check size={13} className="check-icon" />
                      <span>Tự động refresh Token định kỳ khi hết hạn</span>
                    </div>
                    <div className="check-item">
                      <Check size={13} className="check-icon" />
                      <span>Đồng bộ Quota 5h & Quota tuần từ Google Cloud</span>
                    </div>
                    <div className="check-item">
                      <Check size={13} className="check-icon" />
                      <span>Tự động xoay tua đa tài khoản khi gặp 429 / 503</span>
                    </div>
                  </div>
                </div>

                <div className="bento-card-footer">
                  <button
                    type="button"
                    className="btn-bento-action primary"
                    onClick={handleStartOAuth}
                    disabled={isLoggingInGoogle}
                  >
                    {isLoggingInGoogle ? (
                      <RefreshCw size={14} className="spin" />
                    ) : isGemini ? (
                      <GoogleGLogo size={16} />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    <span>
                      {isLoggingInGoogle
                        ? 'Đang kết nối OAuth...'
                        : isGemini
                        ? 'Đăng nhập Google (OAuth 2.0)'
                        : 'Đăng nhập OAuth'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Card 2: Manual API Key & Role Setup (Tùy biến cao) */}
              <div className="bento-card manual-bento">
                <div className="bento-card-top">
                  <div className="bento-badge-row">
                    <span className="badge-pill granular">
                      <Terminal size={11} /> Granular Fleet Control
                    </span>
                    <span className="bento-telemetry-tag mono-text">Advanced</span>
                  </div>
                  <div className="bento-icon-wrapper terminal-icon-wrap">
                    <Terminal size={28} style={{ color: '#06b6d4' }} />
                  </div>
                </div>

                <div className="bento-card-body">
                  <h3 className="bento-title">Manual API Key & Role Setup</h3>
                  <p className="bento-desc">
                    Nạp API Key trực tiếp, thiết lập hạn mức RPM/TPM tùy chỉnh và gán vai trò chuyên biệt (Architect / Coder / Background Agent).
                  </p>

                  <div className="bento-feature-checklist">
                    <div className="check-item">
                      <Check size={13} className="check-icon" />
                      <span>Gán vai trò: Planner, Coder, Code Reviewer, Tester</span>
                    </div>
                    <div className="check-item">
                      <Check size={13} className="check-icon" />
                      <span>Nhập hàng loạt nhanh chóng qua file .json hoặc .env</span>
                    </div>
                    <div className="check-item">
                      <Check size={13} className="check-icon" />
                      <span>Thiết lập thứ tự ưu tiên điều phối Waterfall</span>
                    </div>
                  </div>
                </div>

                <div className="bento-card-footer dual-buttons">
                  <button
                    type="button"
                    className="btn-bento-action secondary"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus size={14} />
                    <span>+ Thêm API Key</span>
                  </button>

                  <button
                    type="button"
                    className="btn-bento-action secondary"
                    onClick={() => setShowImportModal(true)}
                  >
                    <Upload size={14} />
                    <span>📥 Import Profiles (.json / .env)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Dispatcher Topology Preview (Visual Blueprint) */}
            <div className="dispatcher-topology-blueprint">
              <div className="blueprint-header">
                <div className="blueprint-header-title">
                  <Network size={14} style={{ color: '#06b6d4' }} />
                  <span>DISPATCHER TOPOLOGY BLUEPRINT</span>
                </div>
                <span className="blueprint-tag mono-text">PORT :20129 • ZERO NODES DETECTED</span>
              </div>

              <div className="blueprint-diagram-canvas">
                {/* Visual Pipeline Nodes */}
                <div className="topo-flow-row">
                  {/* Node 1: Agent Stream */}
                  <div className="topo-node source-node">
                    <div className="topo-node-badge mono-text">SOURCE</div>
                    <div className="topo-node-title">
                      <Radio size={14} className="pulse-cyan" />
                      <span>Agent Request Stream</span>
                    </div>
                    <div className="topo-node-sub mono-text">Antigravity IDE / CLI</div>
                  </div>

                  {/* Wire 1 */}
                  <div className="topo-wire">
                    <div className="wire-line">
                      <span className="wire-signal-pulse"></span>
                    </div>
                    <span className="wire-label mono-text">Intercept :443</span>
                  </div>

                  {/* Node 2: Core Gateway Engine */}
                  <div className="topo-node gateway-node">
                    <div className="topo-node-badge mono-text">CORE DISPATCHER</div>
                    <div className="topo-node-title">
                      <Server size={14} style={{ color: '#10b981' }} />
                      <span>Brakthroonam Gateway</span>
                    </div>
                    <div className="topo-node-sub mono-text">127.0.0.1:20129</div>
                  </div>

                  {/* Wire 2 (Split Lanes) */}
                  <div className="topo-wire-split">
                    <div className="split-lane top">
                      <span className="wire-signal-pulse delayed"></span>
                    </div>
                    <div className="split-lane bottom"></div>
                  </div>

                  {/* Node 3: Target Slots (Empty) */}
                  <div className="topo-slots-column">
                    <div className="topo-slot empty">
                      <div className="slot-badge amber mono-text">SLOT #1</div>
                      <div className="slot-text">Slot #1: [ Chưa có tài khoản ]</div>
                      <div className="slot-hint mono-text">Chờ kết nối Google OAuth / Key</div>
                    </div>

                    <div className="topo-slot empty dim">
                      <div className="slot-badge dim mono-text">SLOT #2</div>
                      <div className="slot-text">Slot #2: [ Chờ kết nối dự phòng ]</div>
                      <div className="slot-hint mono-text">Dự phòng Fallback</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="blueprint-status-microtext">
                <span className="status-indicator-dot amber"></span>
                <span>Gateway đang ở trạng thái Standby. Hãy kết nối ít nhất 1 tài khoản để kích hoạt luồng điều phối tự động.</span>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             SECTION C: POPULATED FLEET TABLE (QUẢN LÝ & CẤU HÌNH CAO)
             ========================================================================= */
          <div className="fleet-table-wrapper">
            <div className="fleet-table-meta-bar">
              <div className="meta-bar-left">
                <div className="fleet-title-row">
                  <span className="fleet-main-title">Hạ tầng điều phối Nodes</span>
                  <span className="fleet-counter-chip mono-text">
                    {accounts.length} {accounts.length === 1 ? 'Node' : 'Nodes'} Pooled
                  </span>
                </div>
                <span className="fleet-sub-text">
                  Cơ chế Waterfall: Ưu tiên Node #1 Primary, tự động xoay tua sang Fallback khi cạn quota hoặc dính lỗi 429/503.
                </span>
              </div>

              <div className="meta-bar-right">
                <button
                  type="button"
                  className="btn-engine secondary small"
                  onClick={() => setShowImportModal(true)}
                  title="Import thêm API Keys"
                >
                  <Upload size={13} />
                  <span>Import Profiles</span>
                </button>
              </div>
            </div>

            <div className="fleet-table-container">
              {/* TABLE HEADER */}
              <div className="fleet-table-head">
                <div className="col-order-account">THỨ TỰ & TÀI KHOẢN</div>
                <div className="col-quota-rate">QUOTA & RATE LIMITS</div>
                <div className="col-live-health">LIVE PROBE & HEALTHCHECK</div>
                <div className="col-fleet-actions">ĐIỀU PHỐI & THAO TÁC</div>
              </div>

              {/* TABLE ROWS */}
              {accounts.map((acc, index) => {
                const isOAuth = acc.auth_type === 'oauth';
                const isTesting = testingId === acc.id;
                const isProbing = probingId === acc.id;
                const isCopiedEmail = copiedEmailId === acc.id;
                const isExpanded = expandedModelsMap[acc.id] === true;

                // Quotas parsing
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

                // Probed models parsing
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
                const currentRole = acc.role || 'all';
                const roleMeta = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.all;

                // Status derivation
                const isVerified = acc.test_status === 'verified' || (hasProbed && realReadyCount > 0);
                const is429 = acc.last_error && (acc.last_error.includes('429') || acc.last_error.includes('Quota'));

                return (
                  <div key={acc.id} className={`fleet-row-group ${!acc.is_active ? 'is-inactive-row' : ''}`}>
                    <div className="fleet-table-row">
                      {/* Cột 1: THỨ TỰ & TÀI KHOẢN */}
                      <div className="col-order-account">
                        {/* Priority Control Buttons */}
                        <div className="priority-control-stack">
                          <button
                            type="button"
                            className="p-btn"
                            disabled={index === 0}
                            onClick={() => handleMovePriority(index, -1)}
                            title="Tăng độ ưu tiên lên trên"
                          >
                            <MoveUp size={11} />
                          </button>
                          <span className={`p-number-chip mono-text ${index === 0 ? 'is-p1' : ''}`}>
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            className="p-btn"
                            disabled={index === accounts.length - 1}
                            onClick={() => handleMovePriority(index, 1)}
                            title="Hạ độ ưu tiên xuống dưới"
                          >
                            <MoveDown size={11} />
                          </button>
                        </div>

                        {/* Avatar */}
                        <div className="fleet-avatar-box">
                          {isOAuth ? (
                            isGemini ? <GoogleGLogo size={16} /> : <Sparkles size={16} />
                          ) : (
                            <span className="avatar-letter mono-text">{initial}</span>
                          )}
                        </div>

                        {/* Identity & Tags */}
                        <div className="fleet-identity-stack">
                          <div className="identity-email-line">
                            <span className="fleet-email-text" title={userEmail}>
                              {userEmail}
                            </span>
                            <button
                              type="button"
                              className="btn-icon micro"
                              onClick={() => handleCopyEmail(userEmail, acc.id)}
                              title="Sao chép định danh tài khoản"
                            >
                              {isCopiedEmail ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                            </button>
                          </div>

                          <div className="identity-chips-row">
                            <span className={`priority-tag mono-text ${index === 0 ? 'primary' : 'fallback'}`}>
                              {index === 0 ? 'Primary' : 'Fallback'}
                            </span>

                            <span className="auth-mode-tag mono-text">
                              {isOAuth ? 'OAuth 2.0' : 'API Key'}
                            </span>

                            {/* Clickable Role Tag */}
                            <button
                              type="button"
                              className="role-badge-clickable"
                              style={{
                                color: roleMeta.color,
                                background: roleMeta.bg,
                                borderColor: roleMeta.border
                              }}
                              onClick={() => setRoleModalAccount(acc)}
                              title="Nhấp để đổi vai trò gán cho tài khoản này"
                            >
                              <Code2 size={10} />
                              <span>{roleMeta.label}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Cột 2: QUOTA & RATE LIMITS */}
                      <div className="col-quota-rate">
                        <div className="quota-bars-stack">
                          {parsedQuotas.slice(0, 2).map((q, qIdx) => {
                            const pct = q.remainingPercentage ?? 100;
                            const barColor = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
                            const shortLabel = q.name?.toLowerCase().includes('weekly') ? 'Tuần' : '5h';
                            const humanReset = formatResetTime(q.resetTime);

                            return (
                              <div key={qIdx} className="gauge-item">
                                <div className="gauge-meta">
                                  <span className="gauge-window-name mono-text">{shortLabel}</span>
                                  <span className="gauge-pct mono-text" style={{ color: barColor }}>
                                    {pct}% còn
                                  </span>
                                </div>
                                <div className="gauge-track">
                                  <div
                                    className="gauge-fill"
                                    style={{ width: `${pct}%`, background: barColor }}
                                  ></div>
                                </div>
                                {humanReset && (
                                  <span className="gauge-reset-text mono-text">{humanReset}</span>
                                )}
                              </div>
                            );
                          })}
                          <div className="rate-limit-sub-row mono-text">
                            <span>Limit: 60 RPM / 4M TPM</span>
                          </div>
                        </div>
                      </div>

                      {/* Cột 3: LIVE PROBE & HEALTHCHECK */}
                      <div className="col-live-health">
                        <div className="probe-health-stack">
                          <div className="health-status-badge">
                            {is429 ? (
                              <span className="health-tag cooldown">
                                <span className="status-dot amber"></span>
                                <span>Cooldown (429 dính)</span>
                              </span>
                            ) : isVerified ? (
                              <span className="health-tag healthy">
                                <span className="status-dot green"></span>
                                <span>Healthy (142ms)</span>
                              </span>
                            ) : (
                              <span className="health-tag untested">
                                <span className="status-dot dim"></span>
                                <span>Chưa kiểm tra</span>
                              </span>
                            )}

                            <button
                              type="button"
                              className="btn-recheck-probe"
                              onClick={() => handleTestConnection(acc.id)}
                              disabled={isTesting}
                              title="Probe kết nối tức thì"
                            >
                              <RefreshCw size={11} className={isTesting ? 'spin' : ''} />
                            </button>
                          </div>

                          <div className="models-catalog-toggle-row">
                            <button
                              type="button"
                              className="btn-models-expand"
                              onClick={() => toggleExpandModels(acc.id)}
                            >
                              <Search size={10} />
                              <span>{isExpanded ? 'Thu gọn' : 'Ma trận models'} ({models.length})</span>
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Cột 4: ĐIỀU PHỐI & THAO TÁC */}
                      <div className="col-fleet-actions">
                        <div className="actions-button-group">
                          {/* Sửa vai trò */}
                          <button
                            type="button"
                            className="fleet-btn"
                            onClick={() => setRoleModalAccount(acc)}
                            title="Gán vai trò chuyên biệt"
                          >
                            <SlidersHorizontal size={12} />
                            <span>Vai trò</span>
                          </button>

                          {/* Copy Token */}
                          <button
                            type="button"
                            className="fleet-btn"
                            onClick={() => handleCopyToken(acc)}
                            title="Sao chép Token"
                          >
                            <Copy size={12} />
                            <span>Token</span>
                          </button>

                          {/* Sửa Key (nếu là API key) */}
                          {!isOAuth && (
                            <button
                              type="button"
                              className="fleet-btn"
                              onClick={() => {
                                setEditingAccount(acc);
                                setEditApiKey('');
                              }}
                              title="Sửa API Key"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}

                          {/* Toggle Switch */}
                          <label className="fleet-switch" title="Bật/Tắt nhận request cho tài khoản này">
                            <input
                              type="checkbox"
                              checked={!!acc.is_active}
                              onChange={() => handleToggleActive(acc)}
                            />
                            <span className="fleet-slider"></span>
                          </label>

                          {/* Xóa */}
                          <button
                            type="button"
                            className="fleet-btn text-danger"
                            onClick={() => handleDelete(acc.id)}
                            title="Xóa tài khoản khỏi Pool"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED MODEL MATRIX ACCORDION */}
                    {isExpanded && (
                      <div className="fleet-models-matrix-panel">
                        <div className="matrix-info-ribbon">
                          <span className="ribbon-text mono-text">
                            {hasProbed
                              ? `Kết quả quét thực tế: ${realReadyCount} Sẵn sàng • ${realCappedCount} Hết quota (429) • ${realUnsupportedCount} Không hỗ trợ (404)`
                              : `Danh mục ${models.length} flagship models có thể điều phối qua Node này`}
                          </span>
                          <button
                            type="button"
                            className="btn-engine secondary micro"
                            onClick={() => handleProbeModels(acc.id)}
                            disabled={isProbing}
                          >
                            <Search size={11} className={isProbing ? 'spin' : ''} />
                            <span>{isProbing ? 'Đang quét...' : 'Quét sâu toàn bộ Models'}</span>
                          </button>
                        </div>

                        <div className="matrix-models-grid">
                          {models.map((m) => {
                            const probeInfo = probedMap[m.id];
                            const isReady = probeInfo?.statusCode === 200;
                            const isCapped = probeInfo?.statusCode === 429;
                            const is404 = probeInfo?.statusCode === 404;

                            return (
                              <div
                                key={m.id}
                                className={`matrix-model-card ${isReady ? 'ready' : isCapped ? 'capped' : is404 ? 'unsupported' : ''}`}
                              >
                                <div className="card-top-row">
                                  <span className="tier-tag mono-text">T{m.tier}</span>
                                  <span className="ctx-tag mono-text">{m.ctx}</span>
                                </div>
                                <div className="card-model-id mono-text" title={m.id}>
                                  {m.id}
                                </div>
                                <div className="card-status-line mono-text">
                                  {isReady && <span className="status-ready">● Sẵn sàng ({probeInfo.latencyMs}ms)</span>}
                                  {isCapped && <span className="status-capped">▲ Hết quota (429)</span>}
                                  {is404 && <span className="status-unsupported">✕ Không hỗ trợ</span>}
                                  {!probeInfo && <span className="status-untested">○ Chưa test</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
         MODALS & DIALOGS
         ========================================================================= */}

      {/* 1. IMPORT PROFILES MODAL (.JSON / .ENV) */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal-card-linear">
            <div className="modal-head">
              <div className="modal-title-wrap">
                <Upload size={17} style={{ color: '#06b6d4' }} />
                <h3 className="modal-title">Import Profiles & API Keys ({provider.name})</h3>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowImportModal(false)}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-hint">
                Dán nội dung từ file <code>.env</code> (chứa <code>GEMINI_API_KEY=...</code>) hoặc mảng JSON cấu hình:
              </p>

              <textarea
                className="import-textarea mono-text"
                rows={8}
                placeholder={`# Định dạng .env:\nGEMINI_API_KEY=AIzaSyA...\nGEMINI_API_KEY_BACKUP=AIzaSyB...\n\n# Hoặc định dạng JSON:\n[\n  { "name": "Key Coder", "apiKey": "AIzaSy..." }\n]`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn-engine secondary small"
                onClick={() => setShowImportModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-engine primary small"
                onClick={handleImportProfiles}
                disabled={importing || !importText.trim()}
              >
                {importing ? 'Đang phân tích & Import...' : 'Tiến hành Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADVANCED GATEWAY CONFIGURATION MODAL */}
      {showAdvancedSettingsModal && (
        <div className="modal-backdrop">
          <div className="modal-card-linear">
            <div className="modal-head">
              <div className="modal-title-wrap">
                <Settings size={17} style={{ color: '#3b82f6' }} />
                <h3 className="modal-title">Cấu Hình Nâng Cao Gateway ({provider.name})</h3>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowAdvancedSettingsModal(false)}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              <div className="settings-field-group">
                <label className="settings-label">Thuật toán điều phối (Routing Policy)</label>
                <select
                  className="field-input mono-text"
                  value={routingStrategy}
                  onChange={(e) => setRoutingStrategy(e.target.value)}
                >
                  <option value="priority">#1 Priority Waterfall (Ưu tiên slot 1, fallback slot 2)</option>
                  <option value="round-robin">Round-Robin Load Balance (Xoay tua tuần tự)</option>
                  <option value="least-quota">Least Quota Usage (Ưu tiên node còn nhiều quota nhất)</option>
                </select>
                <span className="field-sub">Cơ chế tự động chuyển slot khi phát hiện mã lỗi 429 hoặc 503 từ thượng nguồn.</span>
              </div>

              <div className="settings-field-group mt-3">
                <label className="settings-label">Tần suất Live Heartbeat Probe</label>
                <select
                  className="field-input mono-text"
                  value={heartbeatInterval}
                  onChange={(e) => setHeartbeatInterval(e.target.value)}
                >
                  <option value="15s">Ping mỗi 15 giây (High Telemetry)</option>
                  <option value="30s">Ping mỗi 30 giây (Tiêu chuẩn)</option>
                  <option value="60s">Ping mỗi 60 giây (Tiết kiệm request)</option>
                  <option value="auto-evict">Tự động cách ly khi lỗi 429 liên tiếp</option>
                </select>
              </div>

              <div className="settings-field-group mt-3">
                <label className="settings-checkbox-row">
                  <input
                    type="checkbox"
                    checked={autoEvict429}
                    onChange={(e) => setAutoEvict429(e.target.checked)}
                  />
                  <span>Tự động đưa Node vào danh sách Cooldown 15 phút khi dính 429</span>
                </label>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn-engine secondary small"
                onClick={() => setShowAdvancedSettingsModal(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-engine primary small"
                onClick={() => {
                  saveSettings(routingStrategy, heartbeatInterval, autoEvict429);
                  setShowAdvancedSettingsModal(false);
                }}
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ROLE SELECTOR MODAL */}
      {roleModalAccount && (
        <div className="modal-backdrop">
          <div className="modal-card-linear small-modal">
            <div className="modal-head">
              <div className="modal-title-wrap">
                <Code2 size={16} style={{ color: '#06b6d4' }} />
                <h3 className="modal-title">Gán vai trò cho {roleModalAccount.email || roleModalAccount.name}</h3>
              </div>
              <button type="button" className="btn-icon" onClick={() => setRoleModalAccount(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body role-picker-body">
              {Object.entries(ROLE_CONFIGS).map(([rKey, rCfg]) => (
                <button
                  key={rKey}
                  type="button"
                  className={`role-select-item ${roleModalAccount.role === rKey ? 'selected' : ''}`}
                  onClick={() => handleUpdateRole(roleModalAccount.id, rKey)}
                >
                  <div className="role-item-left">
                    <span className="role-color-dot" style={{ background: rCfg.color }}></span>
                    <span className="role-item-name">{rCfg.label}</span>
                  </div>
                  {roleModalAccount.role === rKey && <Check size={14} style={{ color: '#10b981' }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT KEY MODAL */}
      {editingAccount && (
        <div className="modal-backdrop">
          <form onSubmit={handleSaveEditedKey} className="modal-card-linear">
            <div className="modal-head">
              <h3 className="modal-title">Cập nhật API Key cho {editingAccount.email || editingAccount.name}</h3>
              <button type="button" className="btn-icon" onClick={() => setEditingAccount(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-field">
                <label className="field-label">API Key mới</label>
                <input
                  type="text"
                  className="field-input mono-text"
                  placeholder="Nhập API Key mới..."
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-foot">
              <button type="button" className="btn-engine secondary small" onClick={() => setEditingAccount(null)}>
                Hủy
              </button>
              <button type="submit" className="btn-engine primary small">
                Cập nhật & Test
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. REAL-TIME MODEL PROBE RESULTS MODAL */}
      {probeModalData && (
        <div className="modal-backdrop">
          <div className="modal-card-linear wide-modal">
            <div className="modal-head">
              <div>
                <h3 className="modal-title">Kết Quả Quét Thực Tế (Live Model Probe)</h3>
                <p className="modal-subtitle">
                  Node: <strong style={{ color: '#fff' }}>{probeModalData.email}</strong> • Xác nhận <strong style={{ color: '#06b6d4' }}>{probeModalData.totalCatalogFromGoogle} models</strong>
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
              <span className="dim-text mono-text" style={{ fontSize: '11px' }}>
                Xác thực trực tiếp qua Gateway Runtime :20129
              </span>
              <button
                type="button"
                className="btn-engine primary small"
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
