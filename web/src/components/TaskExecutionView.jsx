import React, { useState, useEffect, useRef } from 'react';
import {
  ListTodo,
  Workflow,
  Cpu,
  Layers,
  Terminal,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  RefreshCw,
  Search,
  FileCode,
  ShieldCheck,
  Eye,
  ArrowRight,
  Activity,
  Check,
  Copy,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  ChevronDown,
  ChevronUp,
  GitBranch,
  CornerDownRight,
  Maximize2,
  Minimize2,
  HelpCircle,
  FolderGit2,
  Minus
} from 'lucide-react';

export default function TaskExecutionView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedSubagentId, setSelectedSubagentId] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [autoFollowLatest, setAutoFollowLatest] = useState(true);
  const [copiedText, setCopiedText] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTaskQuery, setSearchTaskQuery] = useState('');

  const refreshTimerRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchData = async (overrideConvId = null) => {
    try {
      const activeId = overrideConvId !== null ? overrideConvId : (autoFollowLatest ? '' : selectedConversationId || '');
      const url = `/api/tasks/live?t=${Date.now()}${activeId ? `&conversationId=${encodeURIComponent(activeId)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);

        // If in autoFollowLatest mode or if no conversation selected yet, sync selectedConversationId
        if (!selectedConversationId || autoFollowLatest) {
          if (json.conversationId) {
            setSelectedConversationId(json.conversationId);
          }
        }

        // Auto select the running subagent or first subagent
        if (!selectedSubagentId && json.subagents && json.subagents.length > 0) {
          const running = json.subagents.find(s => s.status === 'running');
          setSelectedSubagentId(running ? running.id : json.subagents[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch live task execution:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        fetchData();
      }, 2500);
    }

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [autoRefresh, autoFollowLatest, selectedConversationId]);

  // Click outside to close task dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleSelectSession = (convId) => {
    setSelectedConversationId(convId);
    setAutoFollowLatest(false);
    setIsDropdownOpen(false);
    fetchData(convId);
  };

  const handleToggleAutoFollow = () => {
    const next = !autoFollowLatest;
    setAutoFollowLatest(next);
    if (next) {
      fetchData('');
    }
  };

  const handleCopy = (text, e) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const activeSessions = data?.activeSessions || [];
  const totalRunningCount = data?.totalActiveSessions || activeSessions.filter(s => s.status === 'running').length;
  const currentSelectedSession = activeSessions.find(
    s => s.conversationId === (data?.conversationId || selectedConversationId)
  ) || activeSessions[0] || null;

  const filteredSessions = activeSessions.filter(s => {
    if (!searchTaskQuery.trim()) return true;
    const q = searchTaskQuery.toLowerCase();
    return (s.id && s.id.toLowerCase().includes(q)) ||
           (s.title && s.title.toLowerCase().includes(q)) ||
           (s.command && s.command.toLowerCase().includes(q));
  });
  const project = data?.project || { name: 'ai-router', path: 'D:\\startup\\ai-router' };
  const task = data?.task || { id: 'task-active', command: '/todo', title: 'Quy trình phát triển tính năng / sửa lỗi tuần hoàn khép kín', status: 'running' };
  const pipelineStages = data?.pipelineStages || [];
  const parentCombo = data?.parentCombo || {};
  const subagents = data?.subagents || [];
  const selectedSubagent = subagents.find(s => s.id === selectedSubagentId) || subagents[0] || null;

  // Selected stage defaults to running/waiting stage, or latest completed/auto-approved stage, or first non-bypassed stage
  const activeOrLatestStage = pipelineStages.find(s => s.status === 'running' || s.status === 'waiting_approval' || s.status === 'revising_plan') ||
                              [...pipelineStages].reverse().find(s => (s.status === 'completed' || s.status === 'auto_approved') && s.status !== 'bypassed') ||
                              pipelineStages.find(s => s.status !== 'bypassed') ||
                              pipelineStages[0] || null;

  const selectedStage = pipelineStages.find(s => s.id === selectedStageId) || activeOrLatestStage;

  const getComboStyle = (comboId = '') => {
    const id = (comboId || '').toLowerCase();
    if (id.includes('test')) {
      return {
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        badgeColor: '#10b981',
        borderColor: 'rgba(16, 185, 129, 0.4)',
        glow: 'rgba(16, 185, 129, 0.18)',
        icon: Terminal,
        label: 'Kiểm Thử & Test'
      };
    }
    if (id.includes('plan') || id.includes('gate') || id.includes('approval')) {
      return {
        badgeBg: 'rgba(168, 85, 247, 0.15)',
        badgeColor: '#c084fc',
        borderColor: 'rgba(168, 85, 247, 0.4)',
        glow: 'rgba(168, 85, 247, 0.18)',
        icon: Workflow,
        label: 'Lên Kế Hoạch'
      };
    }
    if (id.includes('review')) {
      return {
        badgeBg: 'rgba(244, 63, 94, 0.15)',
        badgeColor: '#fb7185',
        borderColor: 'rgba(244, 63, 94, 0.4)',
        glow: 'rgba(244, 63, 94, 0.18)',
        icon: ShieldCheck,
        label: 'Thẩm Định Đa Chiều'
      };
    }
    if (id.includes('ask')) {
      return {
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeColor: '#fbbf24',
        borderColor: 'rgba(245, 158, 11, 0.4)',
        glow: 'rgba(245, 158, 11, 0.18)',
        icon: Sparkles,
        label: 'Cố Vấn Kỹ Thuật'
      };
    }
    if (id.includes('todo')) {
      return {
        badgeBg: 'rgba(6, 182, 212, 0.15)',
        badgeColor: '#22d3ee',
        borderColor: 'rgba(6, 182, 212, 0.4)',
        glow: 'rgba(6, 182, 212, 0.18)',
        icon: ListTodo,
        label: 'Chu Trình /todo'
      };
    }
    return {
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      badgeColor: '#60a5fa',
      borderColor: 'rgba(59, 130, 246, 0.4)',
      glow: 'rgba(59, 130, 246, 0.18)',
      icon: Cpu,
      label: 'Lập Trình & Code'
    };
  };

  const getActionIcon = (type = '', isRunning = false) => {
    const t = (type || '').toLowerCase();
    if (t === 'read_file') return <FileText size={16} style={{ color: '#38bdf8' }} />;
    if (t === 'run_command') return <Terminal size={16} style={{ color: '#fbbf24' }} />;
    if (t === 'edit_file' || t === 'write_file') return <FileCode size={16} style={{ color: '#a78bfa' }} />;
    if (t.includes('browser') || t.includes('webview')) return <Globe size={16} style={{ color: '#34d399' }} />;
    if (t.includes('review') || t.includes('shield')) return <ShieldCheck size={16} style={{ color: '#f43f5e' }} />;
    return <Activity size={16} style={{ color: '#60a5fa' }} />;
  };

  const comboTheme = getComboStyle(parentCombo.id);
  const ParentIcon = comboTheme.icon;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '4px 0 32px 0' }}>
      {/* 1. TOP TOOLBAR: TIÊU ĐỀ & ĐỒNG BỘ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)'
            }}>
              <Workflow size={18} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
              Sơ Đồ Tiến Trình & Điều Phối Subagents
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 42px' }}>
            Bức tranh toàn cảnh: Chu trình 5 bước /todo, bối cảnh Dự Án & Tác Vụ và mạng lưới Subagents thời gian thực
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Runtime Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 600
          }}>
            <Zap size={14} style={{ color: '#38bdf8' }} />
            <span>Dữ Liệu Thời Gian Thực (Antigravity Runtime)</span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${autoRefresh ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
              background: autoRefresh ? 'rgba(16,185,129,0.12)' : 'rgba(15,23,42,0.6)',
              color: autoRefresh ? '#10b981' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: autoRefresh ? '#10b981' : '#64748b',
              boxShadow: autoRefresh ? '0 0 8px #10b981' : 'none'
            }} />
            {autoRefresh ? 'Live Sync' : 'Dừng'}
          </button>

          {/* Refresh Icon */}
          <button
            type="button"
            onClick={() => fetchData()}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(15,23,42,0.6)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Làm mới"
          >
            <RefreshCw size={14} className={loading ? 'spinning-icon' : ''} />
          </button>
        </div>
      </div>

      {/* 2. BẢNG ĐIỀU PHỐI ĐA NHIỆM & BỐI CẢNH DỰ ÁN (UNIFIED MULTI-TASK & WORKSPACE CONSOLE) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 16, 28, 0.98) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.22)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '18px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Top Header: Workspace Info + Auto-Follow Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          paddingBottom: '12px'
        }}>
          {/* Left: Project & Workspace */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0
            }}>
              <GitBranch size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                {project.name || 'ai-router'}
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                {project.path || 'D:\\startup\\ai-router'}
              </span>
            </div>
          </div>

          {/* Right: Multi-Task Status & Mode Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: totalRunningCount > 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              color: totalRunningCount > 0 ? '#38bdf8' : 'var(--text-dim)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: totalRunningCount > 0 ? '#38bdf8' : '#10b981',
                boxShadow: totalRunningCount > 0 ? '0 0 6px #38bdf8' : 'none'
              }} />
              {totalRunningCount > 0 ? `${totalRunningCount} Task Đang Chạy` : 'Đã Hoàn Tất'} • {activeSessions.length} Phiên
            </span>

            {/* Auto-Follow Toggle */}
            <button
              onClick={handleToggleAutoFollow}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${autoFollowLatest ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                background: autoFollowLatest ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: autoFollowLatest ? '#38bdf8' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={autoFollowLatest ? 'Tự động nhảy sang task mới nhất' : 'Đang ghim xem task đã chọn'}
            >
              <Zap size={12} color={autoFollowLatest ? '#38bdf8' : 'currentColor'} />
              <span>{autoFollowLatest ? 'Auto-Follow: BẬT' : 'Ghim Task Này'}</span>
            </button>
          </div>
        </div>

        {/* Middle Stream: Sleek Modern Dropdown Task Selector */}
        {activeSessions && activeSessions.length > 0 && (
          <div ref={dropdownRef} style={{ position: 'relative', width: '100%', zIndex: 40 }}>
            {/* Dropdown Trigger Button */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
                background: isDropdownOpen
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)'
                  : 'rgba(2, 6, 23, 0.55)',
                border: `1.5px solid ${isDropdownOpen ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)'}`,
                boxShadow: isDropdownOpen
                  ? '0 0 20px rgba(56, 189, 248, 0.25)'
                  : '0 2px 8px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                userSelect: 'none'
              }}
              title="Click để chọn tác vụ khác"
            >
              {/* Left Side: Clean & Responsive Task Identifier */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <Layers size={14} color="#38bdf8" style={{ flexShrink: 0 }} />

                {/* Status Dot */}
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: currentSelectedSession?.status === 'running' ? '#38bdf8' : '#10b981',
                  boxShadow: currentSelectedSession?.status === 'running' ? '0 0 8px #38bdf8' : 'none',
                  flexShrink: 0
                }} />

                {/* ID Tag */}
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  flexShrink: 0
                }}>
                  {currentSelectedSession?.id || task.id}
                </span>

                {/* Command badge */}
                {(currentSelectedSession?.command || task.command) && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    flexShrink: 0
                  }}>
                    {currentSelectedSession?.command || task.command}
                  </span>
                )}

                {/* Title (Truncated cleanly) */}
                <span style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#f8fafc',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0
                }}>
                  {currentSelectedSession?.shortTitle || currentSelectedSession?.title || task.title}
                </span>
              </div>

              {/* Right Side: Total Count & Dropdown Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap'
                }}>
                  {activeSessions.length} tác vụ
                </span>
                <ChevronDown
                  size={15}
                  color={isDropdownOpen ? '#38bdf8' : 'var(--text-muted)'}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none'
                  }}
                />
              </div>
            </div>

            {/* Floating Dropdown Menu Popover */}
            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 30, 0.99) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.12)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'fadeIn 0.15s ease-out'
              }}>
                {/* Search & Filter Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  background: 'rgba(2, 6, 23, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <Search size={14} color="var(--text-dim)" />
                  <input
                    type="text"
                    value={searchTaskQuery}
                    onChange={(e) => setSearchTaskQuery(e.target.value)}
                    placeholder="Tìm tác vụ theo nội dung, ID hoặc lệnh (/todo, /fix)..."
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f8fafc',
                      fontSize: '12px',
                      width: '100%'
                    }}
                    autoFocus
                  />
                  {searchTaskQuery && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSearchTaskQuery(''); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '2px 4px'
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Session List */}
                <div style={{
                  maxHeight: '320px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  paddingRight: '2px'
                }}>
                  {filteredSessions.length === 0 ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: 'var(--text-dim)',
                      fontSize: '12px'
                    }}>
                      Không tìm thấy tác vụ nào khớp với "{searchTaskQuery}"
                    </div>
                  ) : (
                    filteredSessions.map((sess) => {
                      const isSelected = sess.conversationId === (data?.conversationId || selectedConversationId);
                      const isRunning = sess.status === 'running';

                      return (
                        <div
                          key={sess.conversationId}
                          onClick={() => handleSelectSession(sess.conversationId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: isSelected
                              ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.22) 0%, rgba(56, 189, 248, 0.08) 100%)'
                              : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.07)';
                              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                            }
                          }}
                        >
                          {/* Item Left: Status, ID, Title */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            {/* Status Dot */}
                            <span style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: isRunning ? '#38bdf8' : '#10b981',
                              boxShadow: isRunning ? '0 0 6px #38bdf8' : 'none',
                              flexShrink: 0
                            }} />

                            {/* ID */}
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: isSelected ? '#38bdf8' : '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.04)',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              flexShrink: 0
                            }}>
                              {sess.id}
                            </span>

                            {/* Command */}
                            {sess.command && (
                              <span style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                flexShrink: 0
                              }}>
                                {sess.command}
                              </span>
                            )}

                            {/* Title */}
                            <span style={{
                              fontSize: '12px',
                              fontWeight: isSelected ? 600 : 400,
                              color: isSelected ? '#ffffff' : '#cbd5e1',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0
                            }}>
                              {sess.title}
                            </span>
                          </div>

                          {/* Item Right: Time & Selected Check */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                            <span style={{
                              fontSize: '10.5px',
                              color: 'var(--text-dim)',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {sess.timeAgo}
                            </span>
                            {isSelected && (
                              <Check size={14} color="#38bdf8" strokeWidth={2.5} />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer quick actions */}
                <div style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: 'var(--text-dim)'
                }}>
                  <span>Nhấn <b>Esc</b> để đóng</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAutoFollow();
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: autoFollowLatest ? '#38bdf8' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Zap size={11} color={autoFollowLatest ? '#38bdf8' : 'currentColor'} />
                    <span>{autoFollowLatest ? 'Đang Auto-Follow (Bật)' : 'Chuyển sang Auto-Follow'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Panel: Focused Active Task Execution Card */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {/* Top Line: Workflow Badge, ID, and Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              fontSize: '10.5px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase'
            }}>
              {task.command || '/todo'} WORKFLOW
            </span>

            <span
              onClick={(e) => handleCopy(task.id, e)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.06)',
                padding: '1px 6px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Click để sao chép Task ID"
            >
              <span>ID: {task.id || 'task-active'}</span>
              <Copy size={10} />
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              color: task.status === 'running' ? '#38bdf8' : '#10b981'
            }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'currentColor',
                boxShadow: '0 0 5px currentColor'
              }} />
              {task.status === 'running' ? 'Đang điều phối' : 'Đã nghiệm thu'}
            </span>

            {data?.conversationId && (
              <span style={{
                fontSize: '10px',
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)'
              }}>
                • Phiên: {data.conversationId.slice(0, 8)}
              </span>
            )}

            {/* Active Combo Indicator (Hiển thị rõ ràng Combo cầm trịch) */}
            {activeOrLatestStage?.combo && (() => {
              const activeTheme = getComboStyle(activeOrLatestStage.combo);
              const ActiveIcon = activeTheme.icon;
              return (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: activeTheme.badgeBg,
                  border: `1px solid ${activeTheme.borderColor}`,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: activeTheme.badgeColor,
                  fontFamily: 'var(--font-mono)',
                  boxShadow: `0 0 10px ${activeTheme.glow}`
                }}>
                  <ActiveIcon size={12} />
                  <span>Combo Cầm Trịch: <strong>{activeOrLatestStage.combo}</strong></span>
                </span>
              );
            })()}
          </div>

          {/* Prompt text */}
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#e2e8f0',
            lineHeight: '1.45'
          }}>
            {task.title || 'Quy trình phát triển tính năng / sửa lỗi tuần hoàn khép kín'}
          </div>
        </div>
      </div>

      {/* 3. THANH TIẾN TRÌNH CHU TRÌNH 5 GIAI ĐOẠN (/TODO PIPELINE STAGES) */}
      <div style={{
        background: 'rgba(11, 16, 28, 0.85)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '18px 22px',
        marginBottom: '18px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={17} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Chu Trình {task.command === '/fix' ? 'Sửa Lỗi /fix (Code -> Test -> Review)' : task.command === '/ask' ? 'Cố Vấn Kiến Trúc /ask' : task.command === '/planning' ? 'Lập Kế Hoạch /planning' : '5 Giai Đoạn /todo'} (Click Node Để Mở Quy Trình Con)
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Đang xem chi tiết: <strong style={{ color: '#38bdf8' }}>{selectedStage?.name || '1. Plan (Lập Kế Hoạch)'}</strong>
          </div>
        </div>

        {/* Pipeline Stepper Track (Dấu Chấm ----------- Dấu Chấm --------) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${pipelineStages.length || 5}, 1fr)`,
          position: 'relative',
          padding: '6px 0 2px 0'
        }}>
          {/* Pulsing Ring Keyframe Animation & Hide Scrollbar */}
          <style>{`
            @keyframes pulseRing {
              0% { transform: scale(1); opacity: 0.85; }
              50% { transform: scale(1.4); opacity: 0; }
              100% { transform: scale(1.4); opacity: 0; }
            }
            .hide-scrollbar {
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            .hide-scrollbar::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
          `}</style>

          {pipelineStages.map((stage, idx) => {
            const isSelected = selectedStage?.id === stage.id;
            const isAutoApproved = stage.status === 'auto_approved';
            const isCompleted = stage.status === 'completed' || isAutoApproved;
            const isRunning = stage.status === 'running';
            const isWaiting = stage.status === 'waiting_approval' || stage.status === 'revising_plan';
            const isBypassed = stage.status === 'bypassed';
            const isFirst = idx === 0;
            const isLast = idx === pipelineStages.length - 1;

            // Connection line statuses
            const prevStage = idx > 0 ? pipelineStages[idx - 1] : null;
            const isLeftLineActive = prevStage && (prevStage.status === 'completed' || prevStage.status === 'auto_approved');
            const isLeftLineBypassed = prevStage && (prevStage.status === 'bypassed');

            const isRightLineActive = isCompleted;
            const isRightLineBypassed = isBypassed;

            let stageTheme = {
              border: 'rgba(255, 255, 255, 0.08)',
              bg: 'rgba(15, 23, 42, 0.6)',
              color: 'var(--text-muted)',
              badgeBg: 'rgba(255,255,255,0.06)',
              badgeColor: 'var(--text-dim)'
            };

            if (isAutoApproved) {
              stageTheme = {
                border: 'rgba(16, 185, 129, 0.55)',
                bg: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                badgeBg: 'rgba(16, 185, 129, 0.25)',
                badgeColor: '#34d399'
              };
            } else if (isBypassed) {
              stageTheme = {
                border: 'rgba(148, 163, 184, 0.25)',
                bg: isSelected ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.04)',
                color: '#94a3b8',
                badgeBg: 'rgba(148, 163, 184, 0.12)',
                badgeColor: '#94a3b8'
              };
            } else if (isCompleted) {
              stageTheme = {
                border: 'rgba(16, 185, 129, 0.45)',
                bg: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                badgeBg: 'rgba(16, 185, 129, 0.2)',
                badgeColor: '#10b981'
              };
            } else if (isRunning) {
              stageTheme = {
                border: 'rgba(56, 189, 248, 0.65)',
                bg: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                badgeBg: 'rgba(56, 189, 248, 0.25)',
                badgeColor: '#38bdf8'
              };
            } else if (isWaiting) {
              stageTheme = {
                border: 'rgba(245, 158, 11, 0.65)',
                bg: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                color: '#fbbf24',
                badgeBg: 'rgba(245, 158, 11, 0.25)',
                badgeColor: '#fbbf24'
              };
            }

            const activeAccentColor = isRunning ? '#38bdf8' : (isCompleted ? '#10b981' : (isWaiting ? '#fbbf24' : (isBypassed ? '#94a3b8' : '#60a5fa')));

            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: '0 6px'
                }}
              >
                {/* 1. TOP PIPELINE TRACK ROW: CONNECTING LINE & CENTER DOT */}
                <div style={{
                  width: '100%',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {/* Left Connection Line */}
                  {!isFirst && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      right: '50%',
                      top: '50%',
                      height: isLeftLineBypassed ? '0px' : '3px',
                      transform: 'translateY(-50%)',
                      background: isLeftLineActive ? '#10b981' : 'rgba(255, 255, 255, 0.12)',
                      borderTop: isLeftLineBypassed ? '2px dashed rgba(148, 163, 184, 0.35)' : 'none',
                      boxShadow: isLeftLineActive ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                      zIndex: 1,
                      transition: 'all 0.3s ease'
                    }} />
                  )}

                  {/* Right Connection Line */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      right: 0,
                      top: '50%',
                      height: isRightLineBypassed ? '0px' : '3px',
                      transform: 'translateY(-50%)',
                      background: isRightLineActive ? '#10b981' : 'rgba(255, 255, 255, 0.12)',
                      borderTop: isRightLineBypassed ? '2px dashed rgba(148, 163, 184, 0.35)' : 'none',
                      boxShadow: isRightLineActive ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
                      zIndex: 1,
                      transition: 'all 0.3s ease'
                    }} />
                  )}

                  {/* DẤU CHẤM TRÒN PIPELINE (STATUS DOT) */}
                  <div style={{
                    width: isRunning ? '38px' : '34px',
                    height: isRunning ? '38px' : '34px',
                    borderRadius: '50%',
                    background: isCompleted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                isRunning ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' :
                                isWaiting ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' :
                                isBypassed ? 'rgba(30, 41, 59, 0.9)' :
                                'rgba(15, 23, 42, 0.95)',
                    border: isCompleted ? '2.5px solid #34d399' :
                            isRunning ? '2.5px solid #38bdf8' :
                            isWaiting ? '2.5px solid #fbbf24' :
                            isBypassed ? '1.5px dashed rgba(148, 163, 184, 0.5)' :
                            '2px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: isCompleted ? '0 0 16px rgba(16, 185, 129, 0.5)' :
                               isRunning ? '0 0 22px rgba(56, 189, 248, 0.8), inset 0 0 8px rgba(255,255,255,0.4)' :
                               isWaiting ? '0 0 16px rgba(245, 158, 11, 0.6)' :
                               isSelected ? `0 0 14px ${activeAccentColor}55` :
                               'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 2,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isSelected ? 'scale(1.12)' : 'scale(1)'
                  }}>
                    {isAutoApproved ? (
                      <Zap size={15} color="#ffffff" />
                    ) : isCompleted ? (
                      <Check size={16} strokeWidth={3} color="#ffffff" />
                    ) : isRunning ? (
                      <Play size={13} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
                    ) : isWaiting ? (
                      <Clock size={15} strokeWidth={2.5} color="#ffffff" />
                    ) : isBypassed ? (
                      <Minus size={14} strokeWidth={2.5} color="#94a3b8" />
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>
                        {stage.stageIndex}
                      </span>
                    )}

                    {/* Outer Pulsing Ring for Active Running Node */}
                    {isRunning && (
                      <div style={{
                        position: 'absolute',
                        top: '-5px',
                        left: '-5px',
                        right: '-5px',
                        bottom: '-5px',
                        borderRadius: '50%',
                        border: '1.5px solid #38bdf8',
                        animation: 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        pointerEvents: 'none'
                      }} />
                    )}
                  </div>
                </div>

                {/* 2. STAGE CARD / LABEL CAPSULE BELOW THE DOT */}
                <div style={{
                  width: '100%',
                  marginTop: '10px',
                  background: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.55)',
                  border: `1.5px solid ${isSelected ? activeAccentColor : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '10px 12px',
                  transition: 'all 0.25s ease',
                  boxShadow: isSelected ? `0 6px 20px ${stageTheme.color}25` : 'none',
                  position: 'relative'
                }}>
                  {/* Top Row: Stage Short Name + Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '6px' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isSelected ? 'var(--text-main)' : stageTheme.color,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {stage.shortName || stage.name}
                    </div>

                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: '4px',
                      background: stageTheme.badgeBg,
                      color: stageTheme.badgeColor,
                      textTransform: 'uppercase',
                      flexShrink: 0
                    }}>
                      {isBypassed ? 'Bỏ qua' : (isAutoApproved ? 'Tự duyệt' : (isCompleted ? 'Đã xong' : (isRunning ? 'Đang chạy' : (isWaiting ? 'Chờ duyệt' : 'Chờ'))))}
                    </span>
                  </div>

                  {/* Role text */}
                  <div style={{
                    fontSize: '10.5px',
                    color: 'var(--text-dim)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '4px'
                  }}>
                    {stage.role}
                  </div>

                  {/* Combo Badge (Hiển thị rõ ràng Combo nào đang làm) */}
                  {stage.combo && (() => {
                    const cTheme = getComboStyle(stage.combo);
                    const CIcon = cTheme.icon;
                    return (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: cTheme.badgeBg,
                        border: `1px solid ${cTheme.borderColor}`,
                        fontSize: '9.5px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: cTheme.badgeColor,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        <CIcon size={10} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.combo}</span>
                      </div>
                    );
                  })()}

                  {/* Selection indicator arrow pointing down to Sub-Pipeline details */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: `6px solid ${activeAccentColor}`,
                      zIndex: 3
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BẢNG CHI TIẾT ĐIỀU PHỐI CON CỦA GIAI ĐOẠN ĐANG CHỌN (SUB-ORCHESTRATION PANE) */}
      {selectedStage && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 16, 28, 0.95) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          {/* Header of Stage */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: '14px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '5px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>
                  GIAI ĐOẠN {selectedStage.stageIndex} / {pipelineStages.length || 5}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {selectedStage.name}
                </h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Model: {selectedStage.model}
                </span>

                {/* Combo Badge */}
                {selectedStage.combo && (() => {
                  const sComboTheme = getComboStyle(selectedStage.combo);
                  const SComboIcon = sComboTheme.icon;
                  return (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 9px',
                      borderRadius: '5px',
                      background: sComboTheme.badgeBg,
                      border: `1px solid ${sComboTheme.borderColor}`,
                      fontSize: '11px',
                      fontWeight: 700,
                      color: sComboTheme.badgeColor,
                      fontFamily: 'var(--font-mono)',
                      boxShadow: `0 0 12px ${sComboTheme.glow}`
                    }}>
                      <SComboIcon size={12} />
                      Combo Điều Phối: <strong>{selectedStage.combo}</strong>
                    </span>
                  );
                })()}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0 0', maxWidth: '850px' }}>
                {selectedStage.description}
              </p>
            </div>

            {/* Right Badge */}
            <div style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: selectedStage.risk?.badgeBg || (selectedStage.status === 'running' ? 'rgba(56, 189, 248, 0.15)' : (selectedStage.status === 'waiting_approval' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)')),
              border: `1px solid ${selectedStage.risk?.badgeColor || (selectedStage.status === 'running' ? 'rgba(56, 189, 248, 0.3)' : (selectedStage.status === 'waiting_approval' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'))}`,
              color: selectedStage.risk?.badgeColor || (selectedStage.status === 'running' ? '#38bdf8' : (selectedStage.status === 'waiting_approval' ? '#fbbf24' : '#10b981')),
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {selectedStage.status === 'auto_approved' ? <Zap size={14} /> : <Sparkles size={14} />}
              <span>{selectedStage.badge || 'ĐIỀU PHỐI CHUẨN'}</span>
            </div>
          </div>

          {/* 2 Columns: Sub-Pipeline Steps vs Real-time Details/Logs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* Left: Sub-Pipeline Steps */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Workflow size={15} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Quy Trình Các Bước Điều Phối Con (Sub-Pipeline)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedStage.subSteps?.map((st, sIdx) => {
                  const isDone = st.status === 'completed';
                  const isRun = st.status === 'running';

                  return (
                    <div key={sIdx} style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isRun ? 'rgba(56, 189, 248, 0.12)' : (isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)'),
                      border: isRun ? '1px solid rgba(56, 189, 248, 0.3)' : (isDone ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.04)'),
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isDone ? '#10b981' : (isRun ? '#38bdf8' : 'rgba(255,255,255,0.1)'),
                        color: '#090d16',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: '1px'
                      }}>
                        {isDone ? <Check size={12} /> : st.index}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: isRun || isDone ? 600 : 400,
                          color: isDone ? 'var(--text-main)' : (isRun ? '#38bdf8' : 'var(--text-muted)')
                        }}>
                          {st.name}
                        </div>
                        {st.note && (
                          <div style={{ fontSize: '11.5px', color: '#fbbf24', marginTop: '3px', lineHeight: '1.3' }}>
                            💡 {st.note}
                          </div>
                        )}
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isDone ? '#10b981' : (isRun ? '#38bdf8' : 'var(--text-dim)'),
                        flexShrink: 0
                      }}>
                        {isDone ? 'Đã xong' : (isRun ? 'Đang thực hiện' : 'Chờ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Stage Details & Logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Box 1: Đặc trưng & Quy tắc điều phối */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Đặc Trưng & Ràng Buộc Kiến Trúc
                </div>

                {selectedStage.id === 'approval' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Adaptive Gate Risk Assessment Card */}
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: selectedStage.risk?.level === 'low'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : (selectedStage.risk?.level === 'high' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)'),
                      border: `1px solid ${
                        selectedStage.risk?.level === 'low'
                          ? 'rgba(16, 185, 129, 0.35)'
                          : (selectedStage.risk?.level === 'high' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)')
                      }`
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        color: selectedStage.risk?.badgeColor || (selectedStage.risk?.level === 'low' ? '#10b981' : '#f59e0b'),
                        marginBottom: '4px'
                      }}>
                        {selectedStage.risk?.level === 'low' ? <Zap size={14} /> : <ShieldCheck size={14} />}
                        <span>{selectedStage.risk?.label || 'CỔNG DUYỆT THÍCH ỨNG (ADAPTIVE APPROVAL GATE)'}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.45' }}>
                        {selectedStage.risk?.reason || selectedStage.details?.riskReason || 'Cơ chế tự thích ứng: Đánh giá mức độ rủi ro của tác vụ để quyết định tự động thông qua hoặc yêu cầu xác nhận thủ công an toàn.'}
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
                      <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '4px' }}>
                        ⚡ Cơ chế sửa đổi phương án qua /planning:
                      </div>
                      <div>
                        Tại bước chờ duyệt, nếu người dùng muốn tinh chỉnh kế hoạch, Brakthroonam Router sẽ tự động điều phối gọi <strong>/planning</strong> để tái thiết kế phương án mà <strong>tuyệt đối không nhảy cóc vào code</strong>.
                      </div>
                    </div>
                  </div>
                )}

                {selectedStage.id === 'plan' && (
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
                    <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>
                      🧠 Góc phản biện Devil's Advocate:
                    </div>
                    <div>
                      Phân tích 3 câu hỏi bắt buộc: Giả định sai, Kịch bản sập production, và Giải pháp tối giản KISS/YAGNI trước khi trình người dùng.
                    </div>
                  </div>
                )}

                {selectedStage.id === 'code' && (
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
                    <div style={{ color: '#a78bfa', fontWeight: 700, marginBottom: '4px' }}>
                      💻 Triển khai phân tầng Clean Architecture:
                    </div>
                    <div>
                      Chỉ sửa đổi các file trong phạm vi In-scope đã duyệt: {selectedStage.details?.editedFiles?.join(', ') || 'Các tệp tin theo kế hoạch'}.
                    </div>
                  </div>
                )}

                {selectedStage.id === 'test' && (
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
                    <div style={{ color: '#10b981', fontWeight: 700, marginBottom: '4px' }}>
                      🛡️ Circuit Breaker (Lặp tối đa 3 lần):
                    </div>
                    <div>
                      Tự động chạy kiểm thử build & syntax. Nếu phát hiện bug lặp đến lần thứ 4, lập tức ngắt mạch và báo cáo RCA kèm ma trận giải pháp.
                    </div>
                  </div>
                )}

                {selectedStage.id === 'review' && (
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
                    <div style={{ color: '#f43f5e', fontWeight: 700, marginBottom: '4px' }}>
                      🔍 Thẩm định 3 chiều & Bằng chứng thực tế:
                    </div>
                    <div>
                      Thẩm định Functional/UX qua ảnh chụp màn hình Chrome Headless, Architecture và Security trước khi đóng gói task.
                    </div>
                  </div>
                )}

                {/* Plan Matrix: Bản Kế Hoạch Kiến Trúc Chi Tiết */}
                {selectedStage.details?.planMatrix && selectedStage.details.planMatrix.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      📋 Bản Kế Hoạch Kiến Trúc Chi Tiết (Full Architecture Plan)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                      {selectedStage.details.planMatrix.map((item, pIdx) => (
                        <div key={pIdx} style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                              {item.title}
                            </span>
                            <span style={{
                              fontSize: '9.5px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: item.color || '#38bdf8',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '1px 5px',
                              borderRadius: '4px'
                            }}>
                              {item.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.45' }}>
                            {item.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Box 2: Logs / Nhật ký của giai đoạn */}
              <div style={{
                background: '#040711',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '12px 14px',
                flex: 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Terminal size={13} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Nhật Ký Điều Phối (Stage Logs)
                  </span>
                </div>

                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  color: '#94a3b8',
                  lineHeight: '1.6'
                }}>
                  {selectedStage.logs && selectedStage.logs.length > 0 ? (
                    selectedStage.logs.map((l, lIdx) => (
                      <div key={lIdx} style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ color: '#38bdf8' }}>&gt;</span>
                        <span style={{ color: '#e2e8f0' }}>{l}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                      [Chưa phát sinh nhật ký mới cho giai đoạn này]
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SƠ ĐỒ CÂY TẬP TRUNG (VISUAL FLOW TREE CONTAINER) */}
      <div style={{
        background: 'rgba(11, 16, 28, 0.75)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        position: 'relative'
      }}>
        {/* TẦNG 1: NODE GỐC - COMBO CHA ĐIỀU PHỐI (COMPACT ORCHESTRATOR) */}
        <div style={{
          maxWidth: '820px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
          border: `1.5px solid ${comboTheme.borderColor}`,
          borderRadius: '12px',
          padding: '14px 20px',
          boxShadow: `0 4px 24px ${comboTheme.glow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Combo Cha Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: comboTheme.badgeBg,
              border: `1px solid ${comboTheme.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: comboTheme.badgeColor,
              flexShrink: 0
            }}>
              <ParentIcon size={22} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: comboTheme.badgeBg,
                  color: comboTheme.badgeColor,
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  COMBO CHA CHỈ HUY
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  {parentCombo.id || 'combo-todo'}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: parentCombo.status === 'running' ? '#10b981' : '#60a5fa'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'currentColor',
                    boxShadow: '0 0 6px currentColor'
                  }} />
                  {parentCombo.status === 'running' ? 'Đang điều phối' : 'Hoàn thành'}
                </span>
              </div>

              <div style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {parentCombo.name || 'Todo Full-Lifecycle Pipeline'}
              </div>
            </div>
          </div>

          {/* Right Meta in Parent Combo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Model Chỉ Định</div>
              <div style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8',
                fontWeight: 600
              }}>
                {parentCombo.model || 'gemini-3.8-flash-high'}
              </div>
            </div>

            <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '14px' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cấu Trúc Thực Thi</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: subagents.length > 1 ? '#10b981' : '#38bdf8' }}>
                {subagents.length > 1 ? `${subagents.length} Subagents` : '1 Agent (Đơn nhiệm)'}
              </div>
            </div>
          </div>
        </div>

        {/* ĐƯỜNG DÂY NỐI CÂY TRỰC QUAN (BRANCHING TREE LINES) */}
        <div style={{
          position: 'relative',
          height: '42px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Vertical Stem from Parent */}
          <div style={{
            position: 'absolute',
            top: 0,
            width: '2px',
            height: '22px',
            background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.6), rgba(16, 185, 129, 0.6))'
          }} />

          {/* Horizontal Splitter Line (Only visible if > 1 subagents) */}
          {subagents.length > 1 && (
            <div style={{
              position: 'absolute',
              top: '22px',
              left: '16%',
              right: '16%',
              height: '2px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '1px'
            }} />
          )}

          {/* Badge Chỉ Dẫn Ở Giữa */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            background: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '2px 12px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {subagents.length > 1 ? (
              <>
                <GitBranch size={11} style={{ color: '#10b981' }} />
                <span>Phân rã luồng {subagents.length} Subagents song song</span>
              </>
            ) : (
              <>
                <Activity size={11} style={{ color: '#38bdf8' }} />
                <span>Thực thi trực tiếp qua Agent chính (Chưa rẽ nhánh Subagents)</span>
              </>
            )}
          </div>
        </div>

        {/* TẦNG 2: LƯỚI THẺ SUBAGENTS NGANG (HORIZONTAL COMPACT GRID) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: subagents.length === 1 ? '1fr' : `repeat(${Math.min(3, subagents.length)}, 1fr)`,
          maxWidth: subagents.length === 1 ? '820px' : '100%',
          margin: subagents.length === 1 ? '0 auto' : '0',
          gap: '16px'
        }}>
          {subagents.map((sub, idx) => {
            const isSelected = selectedSubagentId === sub.id;
            const isRunning = sub.status === 'running';
            const isCompleted = sub.status === 'completed';
            const act = sub.currentAction || {};

            return (
              <div
                key={sub.id || idx}
                onClick={() => setSelectedSubagentId(sub.id)}
                style={{
                  background: isSelected
                    ? 'rgba(15, 23, 42, 0.95)'
                    : 'rgba(15, 23, 42, 0.6)',
                  border: isSelected
                    ? '2px solid #38bdf8'
                    : (isRunning ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)'),
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected
                    ? '0 6px 20px rgba(56, 189, 248, 0.2)'
                    : (isRunning ? '0 4px 16px rgba(16, 185, 129, 0.15)' : 'none')
                }}
              >
                {/* Connector point at top of card */}
                <div style={{
                  position: 'absolute',
                  top: '-7px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isRunning ? '#10b981' : (isCompleted ? '#3b82f6' : '#64748b'),
                  border: '2px solid #090d16',
                  boxShadow: isRunning ? '0 0 8px #10b981' : 'none'
                }} />

                {/* Card Top: Subagent Name & Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: isRunning ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getActionIcon(act.type, isRunning)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        lineHeight: '1.25'
                      }}>
                        {sub.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {sub.role} • <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{sub.model || 'flash'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Tag */}
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: isRunning
                      ? 'rgba(16, 185, 129, 0.2)'
                      : (isCompleted ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.06)'),
                    color: isRunning ? '#10b981' : (isCompleted ? '#60a5fa' : 'var(--text-dim)'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}>
                    {isRunning && (
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#10b981',
                        animation: 'pulse 1.2s infinite'
                      }} />
                    )}
                    {isRunning ? 'Đang chạy' : (isCompleted ? 'Đã xong' : 'Chờ lượt')}
                  </span>
                </div>

                {/* Real-time Action Box */}
                <div style={{
                  background: isRunning
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(8, 12, 20, 0.8) 100%)'
                    : 'rgba(8, 12, 20, 0.7)',
                  border: isRunning
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '9px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  {/* Action Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: isRunning ? '#10b981' : (isCompleted ? '#60a5fa' : 'var(--text-muted)'),
                      letterSpacing: '0.04em'
                    }}>
                      {act.badge || 'HÀNH ĐỘNG'}
                    </span>

                    {act.target && (
                      <button
                        type="button"
                        onClick={(e) => handleCopy(act.target, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: 0
                        }}
                        title="Chép Target"
                      >
                        {copiedText === act.target ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                        <span style={{ fontSize: '10px' }}>{copiedText === act.target ? 'Đã chép' : 'Chép'}</span>
                      </button>
                    )}
                  </div>

                  {/* Target File or Command */}
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: act.type === 'run_command' ? '#fbbf24' : '#38bdf8',
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    wordBreak: 'break-all',
                    marginBottom: '6px',
                    lineHeight: '1.35'
                  }}>
                    {act.target || act.title || 'Sẵn sàng nhận tác vụ'}
                  </div>

                  {/* Summary line */}
                  <div style={{
                    fontSize: '11.5px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {act.title || act.detail || 'Chờ tín hiệu từ Combo cha...'}
                  </div>
                </div>

                {/* Progress Bar & Current Step */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>
                      {sub.steps && sub.steps.length > 0 ? `Bước ${sub.steps.filter(s => s.status === 'completed').length}/${sub.steps.length}` : 'Tiến trình'}
                    </span>
                    <span style={{ fontWeight: 700, color: isRunning ? '#10b981' : (isCompleted ? '#60a5fa' : 'var(--text-muted)') }}>
                      {sub.progress || 0}%
                    </span>
                  </div>

                  {/* Mini Progress Line */}
                  <div style={{
                    height: '5px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${sub.progress || 0}%`,
                      background: isRunning
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : (isCompleted ? '#3b82f6' : '#64748b'),
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. TẦNG 4: LIVE INSPECTOR - CHI TIẾT CỦA SUBAGENT ĐƯỢC CHỌN */}
      {selectedSubagent && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Inspector Header */}
          <div style={{
            padding: '12px 18px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <Eye size={15} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                Chi Tiết Hoạt Động: <span style={{ color: '#38bdf8' }}>{selectedSubagent.name}</span>
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}>
                Model: {selectedSubagent.model}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowDetailPanel(!showDetailPanel)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
            >
              {showDetailPanel ? (
                <>Thu gọn <ChevronUp size={16} /></>
              ) : (
                <>Xem chi tiết <ChevronDown size={16} /></>
              )}
            </button>
          </div>

          {/* Inspector Body */}
          {showDetailPanel && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px'
            }}>
              {/* Cột Trái: Execution Pipeline Steps */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Layers size={13} style={{ color: '#38bdf8' }} />
                  <span>Các Bước Đã Đi Qua (Pipeline Steps)</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedSubagent.steps && selectedSubagent.steps.length > 0 ? (
                    selectedSubagent.steps.map((st, sIdx) => {
                      const isDone = st.status === 'completed';
                      const isRunning = st.status === 'running';

                      return (
                        <div
                          key={sIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: isRunning
                              ? 'rgba(16, 185, 129, 0.1)'
                              : (isDone ? 'rgba(255, 255, 255, 0.02)' : 'transparent'),
                            border: isRunning
                              ? '1px solid rgba(16, 185, 129, 0.25)'
                              : '1px solid transparent'
                          }}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDone ? 'rgba(16, 185, 129, 0.2)' : (isRunning ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)'),
                            color: isDone ? '#10b981' : (isRunning ? '#38bdf8' : 'var(--text-dim)'),
                            fontSize: '10px',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {isDone ? <Check size={11} /> : (isRunning ? <Activity size={11} className="spinning-icon" /> : sIdx + 1)}
                          </div>

                          <div style={{
                            fontSize: '12px',
                            color: isDone ? 'var(--text-main)' : (isRunning ? '#38bdf8' : 'var(--text-muted)'),
                            fontWeight: isRunning ? 600 : 400,
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {st.name}
                          </div>

                          <span style={{
                            fontSize: '10.5px',
                            color: isDone ? '#10b981' : (isRunning ? '#38bdf8' : 'var(--text-dim)'),
                            fontWeight: 600
                          }}>
                            {isDone ? 'Đã xong' : (isRunning ? 'Đang chạy' : 'Chờ')}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic', padding: '8px' }}>
                      Chưa có bước thực thi chi tiết
                    </div>
                  )}
                </div>
              </div>

              {/* Cột Phải: Live Terminal Logs */}
              <div style={{
                background: '#040711',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Terminal size={13} style={{ color: '#fbbf24' }} />
                  <span>Cửa Sổ Dòng Lệnh & Nhật Ký (Live Output)</span>
                </div>

                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  color: '#94a3b8',
                  lineHeight: '1.6',
                  flex: 1,
                  maxHeight: '130px',
                  overflowY: 'auto'
                }}>
                  {selectedSubagent.logs && selectedSubagent.logs.length > 0 ? (
                    selectedSubagent.logs.map((line, lIdx) => (
                      <div key={lIdx} style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#475569', userSelect: 'none' }}>&gt;</span>
                        <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{line}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                      [Chưa phát sinh nhật ký mới]
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
