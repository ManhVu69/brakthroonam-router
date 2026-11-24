import React, { useState, useEffect } from 'react';
import {
  Settings, Save, Check, RefreshCw, Sun, Moon, Zap, Shield,
  HardDrive, Trash2, Database, Wifi, Sliders, CheckCircle2,
  Terminal, Sparkles, AlertCircle, RotateCcw, Globe, ShieldCheck, Power, Radio
} from 'lucide-react';

export default function SettingsView({ status, onStatusChange }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [syncingSkills, setSyncingSkills] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('ai_router_theme') || 'dark';
  });
  const [mitmStatus, setMitmStatus] = useState(null);
  const [mitmLoading, setMitmLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchMitmStatus();
  }, []);

  const fetchMitmStatus = async () => {
    try {
      const res = await fetch('/api/antigravity/mitm/status');
      if (res.ok) {
        const data = await res.json();
        setMitmStatus(data);
      }
    } catch (e) {
      console.warn('Error fetching mitm status:', e);
    }
  };

  const handleToggleMitm = async (enable) => {
    try {
      setMitmLoading(true);
      window.location.href = enable ? 'brakthroonam://setup-antigravity' : 'brakthroonam://uninstall-antigravity';
      const url = enable ? '/api/antigravity/mitm/enable' : '/api/antigravity/mitm/disable';
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('👉 Hãy bấm "Mở Brakthroonam Router" trên trình duyệt và chọn "Yes" trên hộp thoại UAC!');
        let attempts = 0;
        const intervalId = setInterval(async () => {
          attempts++;
          const st = await fetch('/api/antigravity/mitm/status').then(r => r.json()).catch(() => null);
          if (st) {
            setMitmStatus(st);
            if ((enable && st.hostsConfigured) || (!enable && !st.hostsConfigured) || attempts >= 20) {
              clearInterval(intervalId);
            }
          }
        }, 1500);
      } else {
        throw new Error(data.error || 'Thao tác thất bại');
      }
    } catch (e) {
      showToast('Lỗi cấu hình MITM: ' + e.message);
    } finally {
      setMitmLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      setConfig(data);
      if (data.theme) {
        setCurrentTheme(data.theme);
        document.documentElement.setAttribute('data-theme', data.theme);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ai_router_theme', newTheme);
    setConfig(prev => ({
      ...prev,
      theme: newTheme
    }));
    showToast(`Đã chuyển sang giao diện: ${newTheme === 'light' ? 'Clean Light' : newTheme === 'cyberpunk' ? 'Cyberpunk Neon' : 'Midnight Obsidian'}`);
  };

  const handleStrategyChange = (provider, field, value) => {
    setConfig(prev => ({
      ...prev,
      providerStrategies: {
        ...prev.providerStrategies,
        [provider]: {
          ...prev.providerStrategies?.[provider],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      const payload = {
        ...config,
        theme: currentTheme
      };
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setSaved(true);
      showToast('Đã lưu cài đặt thành công!');
      setTimeout(() => setSaved(false), 2500);
      if (onStatusChange) onStatusChange();
    } catch (e) {
      showToast('Lỗi lưu cài đặt: ' + e.message);
    }
  };

  const handleSyncSkills = async (target = 'all') => {
    try {
      setSyncingSkills(true);
      const res = await fetch('/api/skills/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err) {
      showToast('Lỗi đồng bộ skills: ' + err.message);
    } finally {
      setSyncingSkills(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử Request Logs trong Database không?')) return;
    try {
      setClearingLogs(true);
      const res = await fetch('/api/usage/clear-logs', { method: 'POST' });
      if (res.ok) {
        showToast('Đã dọn dẹp sạch toàn bộ lịch sử Request Logs!');
      }
    } catch (err) {
      showToast('Lỗi dọn dẹp logs: ' + err.message);
    } finally {
      setClearingLogs(false);
    }
  };

  if (loading || !config) {
    return <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '60px' }}>Đang tải cài đặt hệ thống...</div>;
  }

  const providers = ['gemini', 'codex', 'antigravity'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
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

      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={26} style={{ color: 'var(--accent)' }} />
            Cài Đặt Hệ Thống & Gateway (Settings)
          </h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Tùy biến chủ đề hiển thị (Theme), cổng mạng LAN, chiến lược xoay tua tài khoản và bảo trì dữ liệu tập trung.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontSize: '13.5px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Đã Lưu Thành Công!' : 'Lưu Thay Đổi (Save)'}
        </button>
      </div>

      {/* 1. THEME & APPEARANCE CARD */}
      <div className="card" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Giao Diện & Chủ Đề (Appearance & Theme)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lựa chọn giao diện trực quan phù hợp với môi trường làm việc của bạn.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '18px' }}>
          {/* Theme 1: Dark Obsidian */}
          <div
            onClick={() => handleThemeChange('dark')}
            style={{
              background: currentTheme === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-input)',
              border: currentTheme === 'dark' ? '2px solid #6366f1' : '1px solid var(--border)',
              borderRadius: '14px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: currentTheme === 'dark' ? '0 8px 30px rgba(99, 102, 241, 0.22)' : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Miniature Mockup UI Preview */}
            <div style={{
              height: '92px',
              borderRadius: '8px',
              background: '#090d16',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              position: 'relative'
            }}>
              {/* Window Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '8px', color: '#64748b', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>ai-router: dark</span>
              </div>
              {/* Mock body */}
              <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                <div style={{ width: '40px', background: '#0b101c', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ height: '22px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '4px', border: '1px solid #6366f1' }} />
                  <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                    <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.7)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }} />
                    <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.7)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Moon size={17} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>Midnight Obsidian</span>
              </div>
              {currentTheme === 'dark' ? (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#6366f1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Check size={11} strokeWidth={3} /> ĐANG DÙNG
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', padding: '2px 6px' }}>MẶC ĐỊNH</span>
              )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Tone đen huyền ảo. Tối ưu bảo vệ mắt khi lập trình ban đêm, độ tương phản cao chuẩn Linear & Vercel.
            </p>

            {/* Palette swatch strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginRight: '2px' }}>Màu sắc:</span>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#090d16', border: '1px solid #334155' }} title="Nền chính #090d16" />
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0f172a', border: '1px solid #334155' }} title="Thẻ card #0f172a" />
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#6366f1' }} title="Màu nhấn #6366f1" />
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#f8fafc' }} title="Văn bản #f8fafc" />
            </div>
          </div>

          {/* Theme 2: Clean Light */}
          <div
            onClick={() => handleThemeChange('light')}
            style={{
              background: currentTheme === 'light' ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-input)',
              border: currentTheme === 'light' ? '2px solid #2563eb' : '1px solid var(--border)',
              borderRadius: '14px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: currentTheme === 'light' ? '0 8px 30px rgba(37, 99, 235, 0.2)' : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Miniature Mockup UI Preview */}
            <div style={{
              height: '92px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              position: 'relative'
            }}>
              {/* Window Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '8px', color: '#64748b', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>ai-router: light</span>
              </div>
              {/* Mock body */}
              <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                <div style={{ width: '40px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ height: '22px', background: 'rgba(37, 99, 235, 0.15)', borderRadius: '4px', border: '1px solid #2563eb' }} />
                  <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                    <div style={{ flex: 1, background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    <div style={{ flex: 1, background: '#ffffff', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sun size={17} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>Clean Light</span>
              </div>
              {currentTheme === 'light' ? (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Check size={11} strokeWidth={3} /> ĐANG DÙNG
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', padding: '2px 6px' }}>VĂN PHÒNG</span>
              )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Tone sáng tinh gọn, sang trọng. Phù hợp cho môi trường văn phòng ban ngày hoặc phòng họp nhiều ánh sáng.
            </p>

            {/* Palette swatch strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginRight: '2px' }}>Màu sắc:</span>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #cbd5e1' }} title="Nền #f8fafc" />
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ffffff', border: '1px solid #cbd5e1' }} title="Thẻ #ffffff" />
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#2563eb' }} title="Màu nhấn #2563eb" />
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0f172a' }} title="Văn bản #0f172a" />
            </div>
          </div>

          {/* Theme 3: Cyberpunk Neon */}
          <div
            onClick={() => handleThemeChange('cyberpunk')}
            style={{
              background: currentTheme === 'cyberpunk' ? 'rgba(168, 85, 247, 0.12)' : 'var(--bg-input)',
              border: currentTheme === 'cyberpunk' ? '2px solid #a855f7' : '1px solid var(--border)',
              borderRadius: '14px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: currentTheme === 'cyberpunk' ? '0 8px 30px rgba(168, 85, 247, 0.35)' : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Miniature Mockup UI Preview */}
            <div style={{
              height: '92px',
              borderRadius: '8px',
              background: '#060714',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              position: 'relative'
            }}>
              {/* Window Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ec4899', boxShadow: '0 0 6px #ec4899' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7' }} />
                <span style={{ fontSize: '8px', color: '#c084fc', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>ai-router: sci-fi</span>
              </div>
              {/* Mock body */}
              <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                <div style={{ width: '40px', background: '#090a1f', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ height: '22px', background: 'rgba(168, 85, 247, 0.25)', borderRadius: '4px', border: '1px solid #a855f7' }} />
                  <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                    <div style={{ flex: 1, background: 'rgba(18, 16, 44, 0.85)', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }} />
                    <div style={{ flex: 1, background: 'rgba(18, 16, 44, 0.85)', borderRadius: '4px', border: '1px solid rgba(236, 72, 153, 0.2)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={17} style={{ color: '#a855f7' }} />
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-main)' }}>Cyberpunk Neon</span>
              </div>
              {currentTheme === 'cyberpunk' ? (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#a855f7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                }}>
                  <Check size={11} strokeWidth={3} /> ĐANG DÙNG
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: '#c084fc', padding: '2px 6px' }}>RETRO SCI-FI</span>
              )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Tone Neon Tím & Hồng Cyberpunk rực rỡ phong cách Sci-Fi, viền phát sáng tràn đầy năng lượng sáng tạo.
            </p>

            {/* Palette swatch strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginRight: '2px' }}>Màu sắc:</span>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#060714', border: '1px solid #a855f7' }} title="Nền #060714" />
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#151138', border: '1px solid #a855f7' }} title="Thẻ #151138" />
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#a855f7' }} title="Màu nhấn #a855f7" />
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ec4899' }} title="Màu ấm #ec4899" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. NETWORKING & GATEWAY PORT */}
      <div className="card" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <Wifi size={18} style={{ color: '#38bdf8' }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Cấu Hình Cổng Mạng & Gateway (Network)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cổng lắng nghe OpenAI Proxy và chính sách bảo mật xác thực.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--bg-input)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Cổng Lắng Nghe (Gateway Port)
            </label>
            <input
              type="number"
              className="form-input"
              value={config.port || 20129}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 20129 })}
              style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: '13px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Mặc định: 20129 (Cần khởi động lại server nếu đổi cổng)
            </span>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Phạm Vi Kết Nối (Host Binding)
            </label>
            <select
              className="form-input"
              value={config.host || '0.0.0.0'}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              style={{ width: '100%', fontSize: '13px' }}
            >
              <option value="0.0.0.0">0.0.0.0 — Mở cho toàn mạng LAN (cho điện thoại, máy phụ gọi API)</option>
              <option value="127.0.0.1">127.0.0.1 — Chỉ giới hạn trên máy tính này (Localhost Only)</option>
            </select>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Yêu Cầu Xác Thực API Key</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Bắt buộc client gửi Bearer Token khi gọi /v1/chat/completions
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={!!config.requireApiKey}
                onChange={(e) => setConfig({ ...config, requireApiKey: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. PROVIDER ROTATION STRATEGIES */}
      <div className="card" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <Sliders size={18} style={{ color: '#10b981' }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Chiến Lược Xoay Vòng Tài Khoản (Rotation & Prompt Caching)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quy định cách Brakthroonam Router luân chuyển giữa các Gmail kết nối để không bị chạm hạn mức 429.</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {providers.map((p) => {
            const strat = config.providerStrategies?.[p]?.fallbackStrategy || 'round-robin';
            const sticky = config.providerStrategies?.[p]?.stickyLimit || 3;

            return (
              <div
                key={p}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  padding: '16px 20px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)'
                }}
              >
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: '700', textTransform: 'capitalize', color: 'var(--text-main)' }}>
                    {p === 'antigravity' ? 'Google Antigravity Accounts' : p === 'gemini' ? 'Google Gemini OAuth Accounts' : 'OpenAI Codex Accounts'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {strat === 'round-robin' ? 'Xoay tua tuần tự giữa các Gmail' : 'Dùng cạn tài khoản chính rồi mới chuyển tiếp'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>Chiến Lược:</label>
                    <select
                      className="form-input"
                      style={{ padding: '6px 12px', fontSize: '12.5px' }}
                      value={strat}
                      onChange={(e) => handleStrategyChange(p, 'fallbackStrategy', e.target.value)}
                    >
                      <option value="round-robin">Round-Robin (Xoay tua đều)</option>
                      <option value="fill-first">Fill-First (Dùng cạn từng tài khoản)</option>
                    </select>
                  </div>

                  {strat === 'round-robin' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>Sticky Cache:</label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: '65px', padding: '6px 8px', fontSize: '12.5px', textAlign: 'center' }}
                        min="1"
                        max="20"
                        value={sticky}
                        onChange={(e) => handleStrategyChange(p, 'stickyLimit', Number(e.target.value))}
                        title="Số request liên tiếp trên cùng 1 account để giữ prompt cache"
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>reqs</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAINTENANCE & GLOBAL SKILLS ACTIONS */}
      <div className="card" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <HardDrive size={18} style={{ color: '#f59e0b' }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>Bảo Trì Dữ Liệu & Đồng Bộ Toàn Cục</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Các tác vụ dọn dẹp bộ nhớ đệm và cập nhật lại file kỹ năng SKILL.md.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} color="#38bdf8" /> Cài Đặt Skills Cho AI Agent
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Đồng bộ 4 Slash Commands (/todo, /fix, /planning, /ask) vào ứng dụng AI tương ứng:
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleSyncSkills('antigravity')}
                disabled={syncingSkills}
                style={{ fontSize: '11px', padding: '7px 8px', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
                title="Cài vào ~/.gemini/config/skills/"
              >
                🌐 Antigravity
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleSyncSkills('codex')}
                disabled={syncingSkills}
                style={{ fontSize: '11px', padding: '7px 8px', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' }}
                title="Cài vào ~/.codex/skills/ & ~/.codex/AGENTS_RULES.md"
              >
                🟢 Codex / GPT
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleSyncSkills('claude')}
                disabled={syncingSkills}
                style={{ fontSize: '11px', padding: '7px 8px', borderColor: 'rgba(217, 119, 87, 0.3)', color: '#D97757' }}
                title="Cài vào ~/.claude/skills/"
              >
                🟠 Claude Code
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSyncSkills('all')}
                disabled={syncingSkills}
                style={{ fontSize: '11px', padding: '7px 8px' }}
                title="Cài đặt cho tất cả nền tảng"
              >
                ⚡ Tất Cả
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-main)' }}>Xóa Lịch Sử Request Logs</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Dọn sạch các bản ghi request cũ trong SQLite để giảm kích thước tệp dữ liệu gateway.db.
              </div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={handleClearLogs}
              disabled={clearingLogs}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '12.5px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171'
              }}
            >
              <Trash2 size={14} />
              {clearingLogs ? 'Đang dọn dẹp...' : 'Dọn Dẹp Logs'}
            </button>
          </div>
        </div>
      </div>

      {/* 4.5. ANTIGRAVITY AUTO-SWITCH (MITM PROXY 1-CLICK) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(249, 115, 22, 0.03) 100%)',
        border: mitmStatus?.hostsConfigured ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow corner accent */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: mitmStatus?.hostsConfigured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.1)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: mitmStatus?.hostsConfigured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: mitmStatus?.hostsConfigured ? '#10b981' : '#6366f1'
            }}>
              <Globe size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                  Antigravity Native Auto-Switch (MITM Proxy)
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: mitmStatus?.hostsConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  color: mitmStatus?.hostsConfigured ? '#34d399' : '#94a3b8',
                  border: mitmStatus?.hostsConfigured ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(100, 116, 139, 0.3)'
                }}>
                  {mitmStatus?.hostsConfigured ? '● ĐANG BẬT & ĐÁNH CHẶN NGẦM' : '○ CHƯA KÍCH HOẠT'}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Tự động bắt lỗi 429 Quota trong App Antigravity và thay token của tài khoản dự phòng trong Pool tức thì. Bạn không bao giờ phải đăng xuất / đăng nhập thủ công!
              </p>
            </div>
          </div>

          <div>
            {mitmStatus?.hostsConfigured ? (
              <button
                type="button"
                onClick={() => handleToggleMitm(false)}
                disabled={mitmLoading}
                className="btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Power size={14} />
                {mitmLoading ? 'Đang xử lý...' : 'Tắt Proxy & Trả Mạng Gốc'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleMitm(true)}
                disabled={mitmLoading}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Zap size={15} />
                {mitmLoading ? 'Đang cấu hình 1-Click...' : '⚡ Bấm 1-Click Kích Hoạt Ngay'}
              </button>
            )}
          </div>
        </div>

        {/* Telemetry info row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          background: 'var(--bg-input)',
          padding: '14px 18px',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trạng Thái Cổng 443</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: mitmStatus?.isRunning ? '#34d399' : '#f87171', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Radio size={13} className={mitmStatus?.isRunning ? 'animate-pulse' : ''} />
              {mitmStatus?.isRunning ? 'Đang lắng nghe 127.0.0.1:443' : 'Đã dừng'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DNS Chuyển Hướng Hosts</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: mitmStatus?.hostsConfigured ? '#38bdf8' : '#94a3b8', marginTop: '2px' }}>
              {mitmStatus?.hostsConfigured ? '✅ cloudcode-pa -> 127.0.0.1' : 'Chưa định tuyến'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chứng Chỉ Root CA</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: mitmStatus?.caInstalled ? '#a855f7' : '#f59e0b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={13} />
              {mitmStatus?.caInstalled ? 'Brakthroonam Root CA (Trusted)' : 'Tự động tạo & cài khi bật'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pool Tài Khoản Xoay Tua</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', marginTop: '2px' }}>
              {mitmStatus?.totalActiveAccounts || 0} tài khoản Gemini sẵn sàng
            </div>
          </div>
        </div>
      </div>

      {/* 5. SYSTEM DIAGNOSTICS & PATHS */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '12.5px',
        color: 'var(--text-dim)'
      }}>
        <div>
          <span>Gateway URL: </span>
          <code style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>http://localhost:{config.port || 20129}/v1</code>
        </div>
        <div>
          <span>Phiên bản: </span>
          <strong style={{ color: '#cbd5e1' }}>Brakthroonam Router PRO v{status?.version || '1.0.0'}</strong>
        </div>
        <div>
          <span>Thư mục Skills Toàn Cục: </span>
          <code style={{ color: '#a855f7', fontFamily: 'JetBrains Mono' }}>~/.gemini/config/skills</code>
        </div>
      </div>
    </div>
  );
}
