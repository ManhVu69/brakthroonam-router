import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RotateCw, RotateCcw, Clock, Zap, Pencil, Trash2, Eye, EyeOff,
  Hourglass, Ban, CheckCircle2, ChevronDown, RefreshCw, Copy, Check,
  Activity, Gauge, ShieldCheck, ArrowRight, ExternalLink, SlidersHorizontal
} from 'lucide-react';

// 1. Google Gemini Official Sparkle SVG
function GeminiIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"
        fill="url(#quota_gemini_grad)"
      />
      <defs>
        <radialGradient
          id="quota_gemini_grad"
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

export default function QuotaTrackerView() {
  const REFRESH_INTERVAL = 15;
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [providerFilter, setProviderFilter] = useState('all'); // 'all' | 'antigravity' | 'codex'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'turned-off'
  const [isExpiringFirst, setIsExpiringFirst] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [hiddenQuotas, setHiddenQuotas] = useState({}); // { `${accountId}-${quotaIdx}`: true }
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1800);
    showToast(`Đã sao chép email: ${email}`);
  };

  const fetchAccounts = useCallback(async (silent = false, forceRefresh = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/quota-tracker?_t=${Date.now()}${forceRefresh ? '&refresh=true' : ''}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      if (data && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      }
    } catch (e) {
      console.error('Failed to fetch quota accounts', e);
    } finally {
      setLoading(false);
      if (!silent) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, []);

  useEffect(() => {
    fetchAccounts(false);
  }, [fetchAccounts]);

  // Auto-refresh countdown loop
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchAccounts(true);
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [autoRefresh, fetchAccounts]);

  const handleManualRefresh = () => {
    setCountdown(REFRESH_INTERVAL);
    fetchAccounts(false, true);
    showToast('Quotas đã được làm mới trực tiếp từ Provider API');
  };

  // Toggle single account active status
  const handleToggleAccount = async (account) => {
    const nextActive = !account.isActive;
    // Optimistic update
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === account.id ? { ...acc, isActive: nextActive } : acc))
    );

    try {
      const res = await fetch('/api/quota-tracker/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id, isActive: nextActive })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã ${nextActive ? 'BẬT' : 'TẮT'} tài khoản ${account.email}`);
      }
    } catch (e) {
      console.error(e);
      fetchAccounts(); // rollback
    }
  };

  // Batch toggle: Turn off empty
  const handleTurnOffEmpty = async () => {
    try {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.minRemaining === 0) {
            return { ...acc, isActive: false };
          }
          return acc;
        })
      );

      await fetch('/api/quota-tracker/batch-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'turn-off-empty' })
      });
      showToast('Đã tự động tắt toàn bộ tài khoản cạn hạn mức (0%)');
    } catch (e) {
      console.error(e);
      fetchAccounts();
    }
  };

  // Batch toggle: Turn on available
  const handleTurnOnAvailable = async () => {
    try {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.minRemaining > 0) {
            return { ...acc, isActive: true };
          }
          return acc;
        })
      );

      await fetch('/api/quota-tracker/batch-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'turn-on-available' })
      });
      showToast('Đã kích hoạt lại toàn bộ tài khoản còn hạn ngạch');
    } catch (e) {
      console.error(e);
      fetchAccounts();
    }
  };

  // Delete account from database
  const handleDeleteAccount = async (account) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản ${account.email} (${account.providerTitle}) khỏi hệ thống?`)) {
      return;
    }
    try {
      const provParam = account.provider === 'codex' ? 'codex' : (account.provider === 'claude' ? 'claude' : 'gemini');
      const res = await fetch(`/api/providers/${provParam}/accounts/${account.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`Đã xóa tài khoản ${account.email}`);
        fetchAccounts();
      } else {
        showToast('Lỗi khi xóa tài khoản');
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi kết nối khi xóa tài khoản');
    }
  };

  const toggleHideQuota = (accId, idx) => {
    const key = `${accId}-${idx}`;
    setHiddenQuotas((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter and sort accounts
  const displayedAccounts = useMemo(() => {
    let list = [...accounts];

    if (providerFilter !== 'all') {
      list = list.filter((a) => a.provider === providerFilter);
    }

    if (statusFilter === 'active') {
      list = list.filter((a) => a.isActive);
    } else if (statusFilter === 'turned-off') {
      list = list.filter((a) => !a.isActive);
    }

    if (isExpiringFirst) {
      list.sort((a, b) => a.minRemaining - b.minRemaining);
    }

    return list;
  }, [accounts, providerFilter, statusFilter, isExpiringFirst]);

  // Executive Telemetry Analytics
  const telemetry = useMemo(() => {
    const totalAccs = accounts.length;
    const activeAccs = accounts.filter(a => a.isActive).length;
    
    let totalQuotasCount = 0;
    let sumPercentages = 0;
    let soonestReset = null;

    accounts.forEach(acc => {
      (acc.quotas || []).forEach(q => {
        totalQuotasCount++;
        sumPercentages += (q.remainingPercentage || 0);
        if (q.resetTime && q.remainingPercentage < 100) {
          if (!soonestReset || q.resetTime < soonestReset) {
            soonestReset = q.resetTime;
          }
        }
      });
    });

    const avgHealth = totalQuotasCount > 0 ? Math.round(sumPercentages / totalQuotasCount) : 100;

    return {
      totalAccs,
      activeAccs,
      totalQuotasCount,
      avgHealth,
      soonestReset: soonestReset || 'Đầy hạn ngạch'
    };
  }, [accounts]);

  return (
    <div className="quota-tracker-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#161922',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '10px 18px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'var(--font-text)',
          animation: 'fadeIn 0.15s ease'
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Row */}
      <div className="quota-header-row">
        <div className="quota-title-lockup">
          <div className="quota-title-icon-box">
            <Gauge size={22} />
          </div>
          <div className="quota-title-text">
            <h1>
              Quota Tracker
              <span className="quota-status-pill">
                <span className="pulse-dot"></span>
                Live Monitor
              </span>
            </h1>
            <p>
              Theo dõi hạn mức API, chu kỳ reset 5h & Weekly, tự động điều phối tài khoản chống lỗi HTTP 429.
            </p>
          </div>
        </div>

        {/* Right quick stats / direct link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="quota-action-btn primary-subtle"
            onClick={() => { window.location.hash = '#gateway'; }}
            title="Thêm tài khoản hoặc cấu hình token"
          >
            <span>+ Cấu hình Gateway</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* 2. Executive Telemetry Ribbon (4 Cards) */}
      <div className="quota-telemetry-strip">
        <div className="quota-telemetry-card">
          <span className="kpi-label">Tài khoản giám sát</span>
          <div className="kpi-val">
            <span>{telemetry.activeAccs}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '400' }}>/ {telemetry.totalAccs}</span>
          </div>
          <span className="kpi-sub">
            {telemetry.totalQuotasCount} hạn ngạch API đang đo
          </span>
        </div>

        <div className="quota-telemetry-card">
          <span className="kpi-label">Sức khỏe Quota trung bình</span>
          <div className="kpi-val" style={{ color: telemetry.avgHealth > 50 ? '#34d399' : '#fbbf24' }}>
            <span>{telemetry.avgHealth}%</span>
          </div>
          <span className="kpi-sub">
            {telemetry.avgHealth >= 90 ? 'Hạn mức rất dồi dào' : 'Cần chú ý xoay tua'}
          </span>
        </div>

        <div className="quota-telemetry-card">
          <span className="kpi-label">Reset gần nhất</span>
          <div className="kpi-val" style={{ fontSize: '16px', color: '#60a5fa' }}>
            <span>{telemetry.soonestReset}</span>
          </div>
          <span className="kpi-sub">
            Tự động hồi phục token
          </span>
        </div>

        <div className="quota-telemetry-card">
          <span className="kpi-label">Auto-Sync Engine</span>
          <div className="kpi-val" style={{ fontSize: '16px' }}>
            <span style={{ color: autoRefresh ? '#34d399' : 'var(--text-dim)' }}>
              {autoRefresh ? `Đang bật (${countdown}s)` : 'Tạm dừng'}
            </span>
          </div>
          <span className="kpi-sub">
            Đồng bộ nền ngầm không reload trang
          </span>
        </div>
      </div>

      {/* 3. Toolbar / Filters Bar */}
      <div className="quota-toolbar">
        <div className="quota-toolbar-group">
          {/* Provider Filter */}
          <div className="quota-select-box">
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">Tất cả Provider</option>
              <option value="antigravity">Google Gemini / Antigravity</option>
              <option value="codex">OpenAI Codex</option>
            </select>
            <ChevronDown size={12} className="select-arrow" />
          </div>

          {/* Status Filter */}
          <div className="quota-select-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động (Active)</option>
              <option value="turned-off">Tạm tắt (Paused)</option>
            </select>
            <ChevronDown size={12} className="select-arrow" />
          </div>

          {/* Expiring First Button */}
          <button
            type="button"
            className={`quota-filter-pill-btn ${isExpiringFirst ? 'active' : ''}`}
            onClick={() => setIsExpiringFirst(!isExpiringFirst)}
          >
            <Hourglass size={13} />
            <span>Hết hạn ngạch trước</span>
          </button>
        </div>

        <div className="quota-toolbar-group">
          {/* Batch Actions */}
          <button
            type="button"
            className="quota-action-btn danger-subtle"
            onClick={handleTurnOffEmpty}
            title="Tắt các tài khoản đã hết hạn mức để router không chuyển request vào"
          >
            <Ban size={13} />
            <span>Tắt tài khoản hết Quota</span>
          </button>

          <button
            type="button"
            className="quota-action-btn success-subtle"
            onClick={handleTurnOnAvailable}
            title="Kích hoạt lại tất cả các tài khoản còn hạn mức"
          >
            <CheckCircle2 size={13} />
            <span>Bật tài khoản khả dụng</span>
          </button>

          {/* Auto-refresh indicator toggle */}
          <button
            type="button"
            className={`quota-autorefresh-toggle ${autoRefresh ? 'is-active' : ''}`}
            onClick={() => {
              const next = !autoRefresh;
              setAutoRefresh(next);
              if (next) {
                setCountdown(REFRESH_INTERVAL);
                fetchAccounts(true);
              }
            }}
            title="Bật/Tắt tự động đồng bộ hạn mức"
          >
            <RefreshCw size={12} className={autoRefresh ? 'spin-slow' : ''} />
            <span>Auto ({autoRefresh ? `${countdown}s` : 'Tắt'})</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            className="quota-refresh-icon-btn"
            onClick={handleManualRefresh}
            title="Làm mới trực tiếp từ API"
          >
            <RotateCw size={14} className={isRefreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4. Cards 2-Column Responsive Bento Grid */}
      <div className="quota-cards-grid">
        {displayedAccounts.map((account) => {
          const isAntigravity = account.provider === 'antigravity';
          const isCodex = account.provider === 'codex';
          const isClaude = account.provider === 'claude';
          const quotaCountText = account.quotasCount === 1 ? '1 hạn ngạch' : `${account.quotasCount} hạn ngạch`;

          return (
            <div
              key={account.id}
              className={`quota-pro-card ${!account.isActive ? 'is-off' : ''}`}
            >
              {/* Card Head */}
              <div className="quota-card-head">
                <div className="quota-card-identity">
                  <div className="quota-brand-badge">
                    {isAntigravity && <GeminiIcon size={20} />}
                    {isCodex && <OpenAIIcon size={20} color="#10b981" />}
                    {isClaude && <ClaudeIcon size={20} color="#D97757" />}
                  </div>
                  <div className="quota-info-meta">
                    <div className="quota-provider-title">
                      <span>{account.providerTitle || (isAntigravity ? 'Google Gemini' : isCodex ? 'OpenAI Codex' : 'Anthropic Claude')}</span>
                      <span style={{
                        fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)',
                        color: account.isActive ? '#34d399' : 'var(--text-dim)',
                        background: account.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {account.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="quota-email-row">
                      <span className="quota-email-text" title={account.email}>{account.email}</span>
                      <button
                        type="button"
                        className="quota-copy-btn"
                        onClick={() => handleCopyEmail(account.email)}
                        title="Sao chép email"
                      >
                        {copiedEmail === account.email ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Right Actions */}
                <div className="quota-card-ops">
                  {/* Refresh Quota */}
                  <button
                    type="button"
                    className="quota-tool-icon-btn"
                    onClick={handleManualRefresh}
                    title="Đồng bộ hạn ngạch tài khoản này"
                  >
                    <RotateCw size={13} className={isRefreshing ? 'spin' : ''} />
                  </button>

                  {/* Configure in Gateway */}
                  <button
                    type="button"
                    className="quota-tool-icon-btn"
                    onClick={() => {
                      const provKey = isCodex ? 'codex' : (isClaude ? 'claude' : 'gemini');
                      window.location.hash = `#gateway/${provKey}`;
                    }}
                    title="Mở bảng điều khiển chi tiết trong Gateway"
                  >
                    <SlidersHorizontal size={13} />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    className="quota-tool-icon-btn danger"
                    onClick={() => handleDeleteAccount(account)}
                    title="Xóa tài khoản này khỏi hệ thống"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Modern Linear-style ON/OFF Switch */}
                  <div
                    className={`quota-modern-switch ${account.isActive ? 'checked' : ''}`}
                    onClick={() => handleToggleAccount(account)}
                    title={account.isActive ? 'Nhấp để tạm tắt tài khoản' : 'Nhấp để kích hoạt tài khoản'}
                  >
                    <div className="switch-handle" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              {account.message ? (
                <div style={{
                  padding: '24px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {account.message}
                  </div>
                </div>
              ) : (
                <div className="quota-rows-container">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    padding: '0 2px 2px'
                  }}>
                    <span>{quotaCountText} đang theo dõi</span>
                    <span>Tự động xoay tua khi chạm 429</span>
                  </div>

                  {account.quotas.map((quota, idx) => {
                    const isHidden = hiddenQuotas[`${account.id}-${idx}`];
                    const pct = quota.remainingPercentage;

                    let colorTheme = 'green';
                    if (pct === 0) {
                      colorTheme = 'red';
                    } else if (pct <= 50) {
                      colorTheme = 'amber';
                    }

                    return (
                      <div key={idx} className="quota-metric-line">
                        {/* Status Pip */}
                        <div className={`quota-dot-pip ${colorTheme}`} />

                        {/* Quota Label */}
                        <div className="quota-name-cell" title={quota.name}>
                          {quota.name}
                        </div>

                        {/* Used / Total Ratio in Geist Mono */}
                        <div className="quota-fraction-cell">
                          {quota.used?.toLocaleString()} / {quota.total?.toLocaleString()}
                        </div>

                        {/* Linear Progress Meter */}
                        <div className="quota-gauge-cell">
                          {!isHidden && (
                            <div
                              className={`quota-gauge-fill ${colorTheme}`}
                              style={{ width: `${pct}%` }}
                            />
                          )}
                        </div>

                        {/* Remaining Percent */}
                        <div className={`quota-percent-cell ${colorTheme}`}>
                          {pct}%
                        </div>

                        {/* Reset Time Chip */}
                        <div className="quota-countdown-chip" title="Thời gian đặt lại hạn ngạch">
                          {quota.resetTime}
                        </div>

                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          className="quota-eye-btn"
                          onClick={() => toggleHideQuota(account.id, idx)}
                          title={isHidden ? 'Hiển thị thanh đo' : 'Ẩn thanh đo'}
                        >
                          {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Smart Clean Footer */}
      <div className="quota-footer-bar">
        <div>
          Đang hiển thị <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{displayedAccounts.length}</strong> / {accounts.length} tài khoản
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
            Dữ liệu cache thời gian thực · Cập nhật trực tiếp từ Gateway
          </span>
        </div>
      </div>
    </div>
  );
}
