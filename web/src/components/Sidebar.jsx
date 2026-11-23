import React, { useState } from 'react';
import { Network, Cpu, BarChart3, Settings, Check, Copy, Gauge, Heart, ListTodo } from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, status }) {
  const [copied, setCopied] = useState(false);

  const navItems = [
    { id: 'gateway', label: 'Gateway & Providers', icon: Network },
    { id: 'quotas', label: 'Quota Tracker', icon: Gauge },
    { id: 'combos', label: 'Combos & Roles', icon: Cpu },
    { id: 'tasks', label: 'Task Execution', icon: ListTodo },
    { id: 'usage', label: 'Usage & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'donate', label: 'Donate & Support', icon: Heart },
  ];

  const handleCopyPort = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`http://localhost:${status?.port || 20129}/v1`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="sidebar">
      {/* Brand & App Info */}
      <div className="sidebar-header">
        <div className="logo-badge" title="Brakthroonam Router Local Gateway Engine">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25"/>
            <path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>
            <circle cx="12" cy="3" r="1.5"/>
            <circle cx="12" cy="21" r="1.5"/>
            <circle cx="3" cy="12" r="1.5"/>
            <circle cx="21" cy="12" r="1.5"/>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span className="sidebar-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            Brakthroonam Router
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span className="sidebar-version">Local Gateway Engine</span>
            <span className="badge-tag" style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px' }}>
              v{status?.version || '1.0.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="nav-list">
        <div className="nav-section-title">CORE NAVIGATION</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <Icon size={16} className="nav-item-icon" />
                <span className="nav-item-label">{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Server Status & Gateway Quick-Connect */}
      <div className="sidebar-footer">
        <div className="server-status-card" onClick={handleCopyPort} title="Click để sao chép Endpoint URL">
          <div className="server-status-header">
            <div className="pulse-indicator">
              <span className="pulse-dot"></span>
              <span className="pulse-ping"></span>
            </div>
            <span className="server-status-text">Gateway Online</span>
            <span className="server-status-copy-hint">
              {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
            </span>
          </div>
          <div className="server-status-port">
            Port {status?.port || 20129} • /v1
          </div>
        </div>
      </div>
    </aside>
  );
}
