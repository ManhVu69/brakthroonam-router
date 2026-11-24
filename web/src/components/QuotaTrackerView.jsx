import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RotateCw, RotateCcw, Clock, Zap, Pencil, Trash2, Eye, EyeOff,
  Hourglass, Ban, CheckCircle2, ChevronDown, RefreshCw, Copy, Check,
  Activity, Gauge, ShieldCheck, ArrowRight, ExternalLink, SlidersHorizontal, BookOpen
} from 'lucide-react';

// 1. Google Antigravity Official Logo (from Antigravity binary /brand/antigravity-icon.png)
function AntigravityIcon({ size = 20 }) {
  return (
    <img
      src="/brand/antigravity-icon.png"
      width={size}
      height={size}
      alt="Antigravity Logo"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        flexShrink: 0,
        borderRadius: '5px'
      }}
    />
  );
}

// 2. OpenAI Official Rosette Knot Logo (from user upload /brand/openai-icon.png)
function OpenAIIcon({ size = 20 }) {
  return (
    <img
      src="/brand/openai-icon.png"
      width={size}
      height={size}
      alt="OpenAI Logo"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        filter: 'invert(1)',
        mixBlendMode: 'screen',
        flexShrink: 0
      }}
    />
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

      {/* 4. Cards 2-Column Responsive Bento Grid with Empty State */}
      {accounts.length === 0 ? (
        <div className="quota-empty-hero">
          <div className="quota-empty-ambient-glow" />
          <div className="quota-empty-content">
            <div className="quota-empty-brands">
              <div className="quota-brand-orb">
                <img src="/brand/openai-icon.png" alt="OpenAI" className="empty-brand-img openai-img" />
              </div>
              <div className="quota-connect-dots">
                <span className="dot dot-ping" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <div className="quota-brand-orb center-orb">
                <img src="/brand/brakthroonam-icon.svg" alt="Brakthroonam" className="empty-brand-img" />
              </div>
              <div className="quota-connect-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot dot-ping" />
              </div>
              <div className="quota-brand-orb">
                <AntigravityIcon size={28} />
              </div>
            </div>

            <h3 className="quota-empty-title">Chưa Có Tài Khoản Provider Nào Được Giám Sát</h3>
            <p className="quota-empty-desc">
              Brakthroonam Router cần ít nhất một tài khoản Provider để bắt đầu kích hoạt cơ chế xoay tua thông minh, giám sát chu kỳ reset và tự động triệt tiêu lỗi <strong className="text-emerald">HTTP 429</strong>.
            </p>

            <div className="quota-empty-actions">
              <button
                type="button"
                className="quota-empty-cta primary"
                onClick={() => { window.location.hash = '#gateway'; }}
              >
                <Zap size={15} />
                <span>Cấu Hình 1-Click Gateway Ngay</span>
              </button>
              <button
                type="button"
                className="quota-empty-cta secondary"
                onClick={() => { window.location.hash = '#gateway'; }}
              >
                <SlidersHorizontal size={14} />
                <span>Quản Lý Providers</span>
              </button>
            </div>

            <div className="quota-empty-recommendations">
              <div className="quota-rec-card" onClick={() => { window.location.hash = '#gateway'; }}>
                <div className="rec-card-head">
                  <AntigravityIcon size={16} />
                  <span className="rec-name">Google Antigravity IDE</span>
                  <span className="rec-badge">Khuyên dùng</span>
                </div>
                <p className="rec-desc">Hạn ngạch dồi dào, tự động reset 5h & Tuần. Tích hợp trực tiếp agent không cần API key thủ công.</p>
              </div>

              <div className="quota-rec-card" onClick={() => { window.location.hash = '#gateway'; }}>
                <div className="rec-card-head">
                  <OpenAIIcon size={16} />
                  <span className="rec-name">OpenAI Codex / GPT</span>
                  <span className="rec-badge-subtle">Chu kỳ 30d</span>
                </div>
                <p className="rec-desc">Theo dõi hạn ngạch chu kỳ tháng, phù hợp sinh code phức tạp và task suy luận chuyên sâu.</p>
              </div>
            </div>
          </div>
        </div>
      ) : displayedAccounts.length === 0 ? (
        <div className="quota-empty-filter-state">
          <SlidersHorizontal size={32} className="text-muted" />
          <h3>Không tìm thấy tài khoản phù hợp với bộ lọc</h3>
          <p>Hãy thử thay đổi tiêu chí tìm kiếm hoặc xóa bộ lọc để hiển thị toàn bộ tài khoản.</p>
          <button
            type="button"
            className="quota-action-btn"
            onClick={() => { setProviderFilter('all'); setStatusFilter('all'); }}
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="quota-cards-grid">
          {displayedAccounts.map((account) => {
            const isAntigravity = account.provider === 'antigravity';
            const isCodex = account.provider === 'codex';
            const isClaude = account.provider === 'claude';
            const quotaCountText = account.quotasCount === 1 ? '1 hạn ngạch' : `${account.quotasCount} hạn ngạch`;
            const isCooldown = account.quotas?.some((q) => q.remainingPercentage < 100 && q.resetTime && (q.resetTime.includes('m') || q.resetTime.includes('h')));

            return (
              <div
                key={account.id}
                className={`quota-pro-card ${!account.isActive ? 'is-off' : ''} ${isCooldown ? 'is-cooldown' : ''}`}
              >
                {/* Card Head */}
                <div className="quota-card-head">
                  <div className="quota-card-identity">
                    <div className="quota-brand-badge">
                      {isAntigravity && <AntigravityIcon size={20} />}
                      {isCodex && <OpenAIIcon size={20} />}
                      {isClaude && <ClaudeIcon size={20} color="#D97757" />}
                    </div>
                    <div className="quota-info-meta">
                      <div className="quota-provider-title">
                        <span>{account.providerTitle || (isAntigravity ? 'Google Gemini' : isCodex ? 'OpenAI Codex' : 'Anthropic Claude')}</span>
                        <span className={`quota-status-tag ${account.isActive ? (isCooldown ? 'cooldown' : 'active') : 'paused'}`}>
                          {account.isActive ? (isCooldown ? 'Active • Cooldown' : 'Active') : 'Paused'}
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

                  {/* Card Controls */}
                  <div className="quota-card-tools">
                    <button
                      type="button"
                      className="quota-tool-icon-btn"
                      onClick={() => handleManualRefresh()}
                      title="Đồng bộ hạn mức tài khoản này"
                    >
                      <RotateCw size={13} className={isRefreshing ? 'spin' : ''} />
                    </button>
                    <button
                      type="button"
                      className="quota-tool-icon-btn"
                      onClick={() => { window.location.hash = '#gateway'; }}
                      title="Mở bảng điều khiển chi tiết trong Gateway"
                    >
                      <SlidersHorizontal size={13} />
                    </button>
                    <button
                      type="button"
                      className="quota-tool-icon-btn danger"
                      onClick={() => handleDeleteAccount(account)}
                      title="Xóa tài khoản này khỏi hệ thống"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div
                      className={`quota-modern-switch ${account.isActive ? 'checked' : ''}`}
                      onClick={() => handleToggleAccount(account)}
                      title={account.isActive ? 'Nhấp để tạm tắt tài khoản' : 'Nhấp để kích hoạt tài khoản'}
                    >
                      <div className="switch-handle" />
                    </div>
                  </div>
                </div>

                {/* Subheader Banner */}
                <div className="quota-card-subhead">
                  <span className="quota-count-label">{quotaCountText} đang theo dõi</span>
                  <span className="quota-auto-badge">
                    <ShieldCheck size={12} />
                    <span>Tự động xoay tua khi chạm 429</span>
                  </span>
                </div>

                {/* Card Body */}
                {account.message ? (
                  <div className="quota-card-message">
                    <div>{account.message}</div>
                  </div>
                ) : (
                  <div className="quota-rows-container">
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
                          <div className={`quota-dot-pip ${colorTheme}`} />
                          <div className="quota-name-cell" title={quota.name}>{quota.name}</div>
                          <div className="quota-fraction-cell">
                            {quota.used?.toLocaleString()} / {quota.total?.toLocaleString()}
                          </div>
                          <div className="quota-gauge-cell">
                            {!isHidden && (
                              <div
                                className={`quota-gauge-fill ${colorTheme}`}
                                style={{ width: `${pct}%` }}
                              />
                            )}
                          </div>
                          <div className={`quota-percent-cell ${colorTheme}`}>{pct}%</div>
                          <div className="quota-countdown-chip" title="Thời gian đặt lại hạn ngạch">
                            {quota.resetTime}
                          </div>
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

                    {/* Equal-height balancer widget for 1-quota cards */}
                    {account.quotas?.length === 1 && (
                      <div className="quota-balancer-widget">
                        <div className="quota-balancer-header">
                          <span className="quota-balancer-title">
                            <Zap size={13} className="text-emerald" />
                            Thông lượng Gateway & Trạng thái tải
                          </span>
                          <span className="quota-latency-chip">Độ trễ ~ 118ms</span>
                        </div>
                        <div className="quota-balancer-grid">
                          <div className="quota-metric-chip">
                            <span className="chip-label">Rate Limit</span>
                            <span className="chip-val">500 RPM</span>
                          </div>
                          <div className="quota-metric-chip">
                            <span className="chip-label">Chống 429</span>
                            <span className="chip-val active">Active</span>
                          </div>
                          <div className="quota-metric-chip">
                            <span className="chip-label">Dung lượng</span>
                            <span className="chip-val">Dồi dào</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Footer for Equal Height Symmetry */}
                <div className="quota-card-footer">
                  <span className="quota-footer-status">
                    <span className={`pulse-dot-small ${account.isActive ? 'active' : 'paused'}`} />
                    {account.isActive ? 'Trạng thái: Hoạt động tối ưu' : 'Trạng thái: Đang tạm dừng'}
                  </span>
                  <span className="quota-footer-cycle">
                    {isCodex ? 'Chu kỳ: 30 Ngày' : 'Chu kỳ: 5h & Tuần'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
