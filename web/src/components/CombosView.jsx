import React, { useState, useEffect } from 'react';
import {
  Cpu, Plus, Trash2, Edit2, Copy, Check, ArrowRight, Layers,
  Sparkles, ShieldCheck, ChevronUp, ChevronDown, Flame, Bot, CheckCircle2,
  Brain, Code2, TestTube, Save, Terminal, ShieldAlert, CheckCircle, X, Zap,
  RefreshCw
} from 'lucide-react';

const PRESET_COMBOS = [
  {
    name: 'combo-plan',
    description: 'Dành cho Planning & Architecture (Mô hình suy luận sâu nhất cho /planning)',
    models: ['gemini-3.8-flash-high', 'o3-mini', 'gemini-3.8-flash', 'gemini-2.5-pro']
  },
  {
    name: 'combo-code',
    description: 'Dành cho Coding & Implementation (Mạnh về code, throughput cao cho /todo, /fix)',
    models: ['gemini-3.8-flash-high', 'gpt-4o', 'gemini-3.8-flash', 'gemini-3.8-flash-medium']
  },
  {
    name: 'combo-test',
    description: 'Dành cho Unit Test & Validation (Tốc độ phản hồi tức thì, tiết kiệm quota cho /todo, /fix)',
    models: ['gemini-3.8-flash', 'gpt-4o-mini', 'gemini-3.8-flash-medium', 'gemini-3.8-flash-low']
  },
  {
    name: 'combo-review',
    description: 'Dành cho Security & Architecture Review (Phân tích lỗi đa góc nhìn cho /todo, /fix)',
    models: ['gemini-3.8-flash-high', 'gemini-3.8-flash-medium', 'o1', 'gemini-3.8-flash']
  },
  {
    name: 'combo-ask',
    description: 'Dành cho Technical Consultation & 4-Persona Analysis (Tranh luận kiến trúc đa chiều cho /ask)',
    models: ['gemini-3.8-flash-high', 'o3-mini', 'gpt-4o', 'gemini-3.8-flash', 'gemini-2.5-pro']
  }
];

const getInitialSubTab = () => {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('combos/custom') || hash.includes('combos/list') || hash.includes('custom') || hash.includes('list')) {
    return 'combos';
  }
  return 'roles';
};

export default function CombosView() {
  const [activeSubTab, setActiveSubTab] = useState(getInitialSubTab);
  const [combos, setCombos] = useState([]);
  const [catalogModels, setCatalogModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [comboName, setComboName] = useState('');
  const [strategy, setStrategy] = useState('fallback');
  const [selectedModels, setSelectedModels] = useState([]);
  const [customModelInput, setCustomModelInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Agent Roles State
  const [agentRoles, setAgentRoles] = useState(null);
  const [savingRoles, setSavingRoles] = useState(false);
  const [rolesSavedToast, setRolesSavedToast] = useState(false);
  const [skillsStatus, setSkillsStatus] = useState(null);
  const [syncingSkills, setSyncingSkills] = useState(false);
  const [syncToast, setSyncToast] = useState(null);

  // Providers & 1-Click Preset States
  const [providers, setProviders] = useState([]);
  const [filterConnectedOnly, setFilterConnectedOnly] = useState(false);
  const [presetToast, setPresetToast] = useState(null);

  useEffect(() => {
    fetchCombos();
    fetchCatalog();
    fetchAgentRoles();
    fetchSkillsStatus();
  }, []);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/combos');
      const data = await res.json();
      setCombos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const [catRes, provRes] = await Promise.all([
        fetch('/api/models/catalog'),
        fetch('/api/providers')
      ]);
      const data = await catRes.json();
      setCatalogModels(data);
      if (provRes.ok) {
        const provData = await provRes.json();
        setProviders(provData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyPreset1Click = async (preset) => {
    try {
      const res = await fetch('/api/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preset.name,
          strategy: 'fallback',
          models: preset.models
        })
      });
      if (res.ok) {
        setPresetToast(`Đã tạo / cập nhật thành công combo "${preset.name}"!`);
        setTimeout(() => setPresetToast(null), 3500);
        await fetchCombos();
      } else {
        const err = await res.json();
        alert('Lỗi tạo combo: ' + (err.error || 'Unknown'));
      }
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const isModelConnected = (m) => {
    if (!providers || providers.length === 0) return true;
    const p = providers.find(prov => prov.id === m.provider);
    return p ? (p.connectedCount > 0) : false;
  };

  const fetchAgentRoles = async () => {
    try {
      const res = await fetch('/api/agent-roles');
      const data = await res.json();
      setAgentRoles(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSkillsStatus = async () => {
    try {
      const res = await fetch('/api/skills/status');
      if (res.ok) {
        const data = await res.json();
        setSkillsStatus(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncGlobalSkills = async () => {
    try {
      setSyncingSkills(true);
      const res = await fetch('/api/skills/sync', { method: 'POST' });
      if (res.ok) {
        setSyncToast('Đã đồng bộ 4 Global Skills (/todo, /fix, /planning, /ask) sang ~/.gemini/config/skills/ thành công!');
        setTimeout(() => setSyncToast(null), 4000);
        await fetchSkillsStatus();
      }
    } catch (e) {
      alert('Lỗi đồng bộ skills: ' + e.message);
    } finally {
      setSyncingSkills(false);
    }
  };

  const handleSaveAgentRoles = async () => {
    if (!agentRoles) return;
    try {
      setSavingRoles(true);
      const res = await fetch('/api/agent-roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentRoles)
      });
      if (res.ok) {
        setRolesSavedToast(true);
        setTimeout(() => setRolesSavedToast(false), 3500);
        await fetchCombos();
        await fetchSkillsStatus();
      }
    } catch (e) {
      alert('Lỗi lưu cấu hình vai trò: ' + e.message);
    } finally {
      setSavingRoles(false);
    }
  };

  const updatePipelinePolicy = (field, value) => {
    if (!agentRoles) return;
    const currentPolicy = agentRoles.pipelinePolicy || {
      requirePlanApproval: true,
      autoFixLoop: true,
      maxLoopRetries: 3,
      circuitBreakerOn4th: true,
      circuitBreakerAction: 'stop_and_report_rca',
      reviewersCount: 3
    };
    setAgentRoles({
      ...agentRoles,
      pipelinePolicy: {
        ...currentPolicy,
        [field]: value
      }
    });
  };

  const updateRolePrimary = (roleKey, modelId) => {
    if (!agentRoles) return;
    if (roleKey === 'review') {
      setAgentRoles({
        ...agentRoles,
        review_functional: { ...(agentRoles.review_functional || {}), primaryModel: modelId },
        review_architecture: { ...(agentRoles.review_architecture || {}), primaryModel: modelId },
        review_security: { ...(agentRoles.review_security || {}), primaryModel: modelId }
      });
      return;
    }
    if (!agentRoles[roleKey]) return;
    setAgentRoles({
      ...agentRoles,
      [roleKey]: {
        ...agentRoles[roleKey],
        primaryModel: modelId
      }
    });
  };

  const addRoleFallback = (roleKey, modelId) => {
    if (!agentRoles || !modelId) return;
    if (roleKey === 'review') {
      const keys = ['review_functional', 'review_architecture', 'review_security'];
      const updated = { ...agentRoles };
      keys.forEach(k => {
        const chain = updated[k]?.fallbackChain || [];
        if (!chain.includes(modelId)) {
          updated[k] = { ...updated[k], fallbackChain: [...chain, modelId] };
        }
      });
      setAgentRoles(updated);
      return;
    }
    const currentChain = agentRoles[roleKey]?.fallbackChain || [];
    if (!currentChain.includes(modelId)) {
      setAgentRoles({
        ...agentRoles,
        [roleKey]: {
          ...agentRoles[roleKey],
          fallbackChain: [...currentChain, modelId]
        }
      });
    }
  };

  const removeRoleFallback = (roleKey, modelIdx) => {
    if (!agentRoles) return;
    if (roleKey === 'review') {
      const keys = ['review_functional', 'review_architecture', 'review_security'];
      const updated = { ...agentRoles };
      keys.forEach(k => {
        const chain = updated[k]?.fallbackChain || [];
        updated[k] = { ...updated[k], fallbackChain: chain.filter((_, idx) => idx !== modelIdx) };
      });
      setAgentRoles(updated);
      return;
    }
    const currentChain = agentRoles[roleKey]?.fallbackChain || [];
    setAgentRoles({
      ...agentRoles,
      [roleKey]: {
        ...agentRoles[roleKey],
        fallbackChain: currentChain.filter((_, idx) => idx !== modelIdx)
      }
    });
  };

  const handleOpenCreate = (preset = null) => {
    setEditingId(null);
    if (preset) {
      setComboName(preset.name);
      setSelectedModels([...preset.models]);
    } else {
      setComboName('');
      setSelectedModels(['gemini-3.8-flash-high', 'gpt-4o', 'gemini-2.5-flash']);
    }
    setStrategy('fallback');
    setShowModal(true);
  };

  const handleOpenEdit = (combo) => {
    setEditingId(combo.id);
    setComboName(combo.name);
    setStrategy(combo.strategy || 'fallback');
    setSelectedModels(combo.models || []);
    setShowModal(true);
  };

  const handleAddModel = (mId) => {
    if (!mId) return;
    if (!selectedModels.includes(mId)) {
      setSelectedModels([...selectedModels, mId]);
    }
    setCustomModelInput('');
  };

  const handleRemoveModel = (index) => {
    setSelectedModels(selectedModels.filter((_, i) => i !== index));
  };

  const handleMoveModel = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= selectedModels.length) return;
    const updated = [...selectedModels];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setSelectedModels(updated);
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!comboName.trim() || selectedModels.length === 0) return;

    try {
      if (editingId) {
        await fetch(`/api/combos/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: comboName.trim(),
            strategy,
            models: selectedModels
          })
        });
      } else {
        await fetch('/api/combos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: comboName.trim(),
            strategy,
            models: selectedModels
          })
        });
      }
      setShowModal(false);
      fetchCombos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCombo = async (id) => {
    if (!confirm('Xác nhận xóa combo này?')) return;
    try {
      await fetch(`/api/combos/${id}`, { method: 'DELETE' });
      fetchCombos();
    } catch (e) {
      console.error(e);
    }
  };

  const copyComboName = (name, id) => {
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayedCatalogModels = filterConnectedOnly
    ? catalogModels.filter(isModelConnected)
    : catalogModels;

  const tier1Models = displayedCatalogModels.filter(m => m.tier === 1);
  const tier2Models = displayedCatalogModels.filter(m => m.tier === 2);
  const tier3Models = displayedCatalogModels.filter(m => m.tier === 3);

  const connectedCount = catalogModels.filter(isModelConnected).length;

  return (
    <>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <h1 className="page-title">
          <Cpu size={26} style={{ color: 'var(--accent)' }} />
          Điều Phối Agent & Combos Ảo
        </h1>
        <p className="page-subtitle">
          Cấu hình trực tiếp mô hình AI cho từng vai trò (Plan, Code, Test, Review, Ask) & Cơ chế xoay tua 2 tầng (2-Tier Fallback).
        </p>
      </div>

      {/* TOAST NOTIFICATION CHO 1-CLICK PRESET */}
      {presetToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          zIndex: 9999,
          fontWeight: '700',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle2 size={18} />
          {presetToast}
        </div>
      )}

      {/* MODERN SEGMENTED TAB NAVIGATION BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '14px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Tab 1 Button */}
          <button
            type="button"
            style={{
              padding: '7px 16px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '7px',
              fontWeight: activeSubTab === 'roles' ? '500' : '450',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: activeSubTab === 'roles' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
              background: activeSubTab === 'roles' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeSubTab === 'roles' ? '#fff' : 'var(--text-muted)',
              boxShadow: activeSubTab === 'roles' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
            }}
            onClick={() => {
              setActiveSubTab('roles');
              window.location.hash = '#combos';
            }}
          >
            <Bot size={15} style={{ color: activeSubTab === 'roles' ? 'var(--accent-light)' : 'var(--text-dim)' }} />
            <span>Điều Phối Vai Trò & 4 Global Skills</span>
            <span style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 6px',
              borderRadius: '4px',
              background: activeSubTab === 'roles' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: activeSubTab === 'roles' ? '#60a5fa' : 'var(--text-dim)',
              fontWeight: '500'
            }}>
              Active
            </span>
          </button>

          {/* Tab 2 Button */}
          <button
            type="button"
            style={{
              padding: '7px 16px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '7px',
              fontWeight: activeSubTab === 'combos' ? '500' : '450',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: activeSubTab === 'combos' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
              background: activeSubTab === 'combos' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeSubTab === 'combos' ? '#fff' : 'var(--text-muted)',
              boxShadow: activeSubTab === 'combos' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
            }}
            onClick={() => {
              setActiveSubTab('combos');
              window.location.hash = '#combos/custom';
            }}
          >
            <Layers size={15} style={{ color: activeSubTab === 'combos' ? 'var(--accent-light)' : 'var(--text-dim)' }} />
            <span>Quản Lý Combos & Virtual Models</span>
            <span style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 6px',
              borderRadius: '4px',
              background: activeSubTab === 'combos' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
              color: activeSubTab === 'combos' ? '#fff' : 'var(--text-dim)',
              fontWeight: '500'
            }}>
              {combos.length} Combos
            </span>
          </button>
        </div>

        {/* Tab mode indicator guide */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <span>Chế độ xem:</span>
          <strong style={{ color: '#fff' }}>
            {activeSubTab === 'roles' ? 'Phân Công Vai Trò Multi-Agent' : 'Danh Sách Combos & Tra Cứu Model'}
          </strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AGENT ROLES & TASK ROUTING                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Banner & Save Action */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(18, 19, 26, 0.8))',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontWeight: '800', fontSize: '15px' }}>
                <Sparkles size={18} /> Trung Tâm Điều Phối Tác Vụ Cho AI Agent (Agent Task Routing Hub)
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.5 }}>
                Tất cả thay đổi tại đây được <strong>đồng bộ tự động 100%</strong> với Antigravity Multi-Agent Pipeline và tự động tạo Virtual Combos tương ứng cho Cursor, Cline, Claude Code qua endpoint OpenAI.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {syncToast && (
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={15} /> {syncToast}
                </span>
              )}
              {rolesSavedToast && (
                <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={15} /> Đã kích hoạt thành công!
                </span>
              )}
              <button
                className="btn btn-secondary"
                onClick={handleSyncGlobalSkills}
                disabled={syncingSkills}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  fontSize: '13px'
                }}
                title="Đồng bộ ngay 4 Global Skills (/todo, /fix, /planning, /ask) vào ~/.gemini/config/skills/"
              >
                <RefreshCw size={15} className={syncingSkills ? 'animate-spin' : ''} />
                {syncingSkills ? 'Đang đồng bộ...' : 'Đồng Bộ Global Skills'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveAgentRoles}
                disabled={savingRoles}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                <Save size={15} />
                {savingRoles ? 'Đang lưu & đồng bộ...' : 'Lưu & Kích Hoạt Ngay'}
              </button>
            </div>
          </div>

          {/* VISUAL PIPELINE WORKFLOW */}
          {agentRoles && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              overflowX: 'auto',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pha 1: Lên Plan</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Architect Planner</div>
                  <div style={{ fontSize: '11px', color: '#c084fc', fontFamily: 'JetBrains Mono', marginTop: '1px' }}>{agentRoles.planner?.primaryModel}</div>
                </div>
              </div>

              <ArrowRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Code2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pha 2: Viết Code</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Lead Coder</div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'JetBrains Mono', marginTop: '1px' }}>{agentRoles.coder?.primaryModel}</div>
                </div>
              </div>

              <ArrowRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TestTube size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pha 3: Viết Test</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Automated Tester</div>
                  <div style={{ fontSize: '11px', color: '#34d399', fontFamily: 'JetBrains Mono', marginTop: '1px' }}>{agentRoles.tester?.primaryModel}</div>
                </div>
              </div>

              <ArrowRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '160px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pha 4: Thẩm định</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Parallel Review</div>
                  <div style={{ fontSize: '11px', color: '#f87171', fontFamily: 'JetBrains Mono', marginTop: '1px' }}>3 Reviewers song song</div>
                </div>
              </div>

              <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.1)', margin: '0 4px', flexShrink: 0 }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '170px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cố Vấn (/ask)</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Principal Advisor</div>
                  <div style={{ fontSize: '11px', color: '#34d399', fontFamily: 'JetBrains Mono', marginTop: '1px' }}>{agentRoles.ask?.primaryModel || 'gemini-3.8-flash-high'}</div>
                </div>
              </div>
            </div>
          )}

          {/* 4 GLOBAL SKILLS DIRECTORY & STATUS */}
          {agentRoles && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(20, 24, 38, 0.95), rgba(15, 17, 26, 0.95))',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)'
                  }}>
                    <Terminal size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '-0.2px' }}>
                      Bảng Điều Khiển 4 Kỹ Năng Toàn Cục (Global Skills: /todo, /fix, /planning, /ask)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Tự động đồng bộ sang <code style={{ color: '#38bdf8' }}>~/.gemini/config/skills/</code>. Mọi dự án mở trong Antigravity hoặc Claude Code đều kích hoạt được ngay.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-success" style={{ fontSize: '11.5px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} /> 4/4 Skills Toàn Cục Sẵn Sàng
                  </span>
                </div>
              </div>

              {/* 4 Skills Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {/* Skill /todo */}
                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#a855f7', fontFamily: 'JetBrains Mono', background: 'rgba(168, 85, 247, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                      /todo
                    </span>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Global Active
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Chu Trình Toàn Diện (Full Pipeline)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.45 }}>
                      Lập kế hoạch ➔ Cổng duyệt người dùng ➔ Vòng lặp [Code ➔ Test ➔ Review] tối đa {agentRoles.pipelinePolicy?.maxLoopRetries || 3} lần ➔ Ngắt mạch giải trình RCA lần {(agentRoles.pipelinePolicy?.maxLoopRetries || 3) + 1}.
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', fontSize: '11px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>• <strong>Plan:</strong> <span style={{ color: '#c084fc', fontFamily: 'JetBrains Mono' }}>{agentRoles.planner?.primaryModel}</span></div>
                    <div>• <strong>Code:</strong> <span style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{agentRoles.coder?.primaryModel}</span></div>
                    <div>• <strong>Test:</strong> <span style={{ color: '#34d399', fontFamily: 'JetBrains Mono' }}>{agentRoles.tester?.primaryModel}</span></div>
                    <div>• <strong>Review:</strong> <span style={{ color: '#f87171', fontFamily: 'JetBrains Mono' }}>3 Reviewers song song</span></div>
                  </div>
                </div>

                {/* Skill /fix */}
                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', fontFamily: 'JetBrains Mono', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                      /fix
                    </span>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Global Active
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Sửa Lỗi Nhanh Theo Vết (Targeted Fix)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.45 }}>
                      Bỏ qua lập plan mới, đi thẳng vào vòng lặp [Code ➔ Test ➔ Review] tối đa {agentRoles.pipelinePolicy?.maxLoopRetries || 3} lần ➔ Ngắt mạch RCA lần {(agentRoles.pipelinePolicy?.maxLoopRetries || 3) + 1}.
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', fontSize: '11px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>• <strong>Tiền đề:</strong> Cần cung cấp bug log, stack trace hoặc plan trước đó</div>
                    <div>• <strong>Code:</strong> <span style={{ color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>{agentRoles.coder?.primaryModel}</span></div>
                    <div>• <strong>Test & Review:</strong> <span style={{ color: '#34d399', fontFamily: 'JetBrains Mono' }}>{agentRoles.tester?.primaryModel}</span> & Reviewers</div>
                  </div>
                </div>

                {/* Skill /planning */}
                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#eab308', fontFamily: 'JetBrains Mono', background: 'rgba(234, 179, 8, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                      /planning
                    </span>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Global Active
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Kiến Trúc & Phân Rã Task (Design Only)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.45 }}>
                      Phân tích bóc tách luồng dữ liệu, lập task list kiến trúc, bắt buộc phản biện ngược (Devil's Advocate). Dừng lại lưu Plan, <strong>KHÔNG viết code</strong>.
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                    <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Model Điều Phối Planning:</label>
                    <select
                      className="form-input"
                      value={agentRoles.pipelinePolicy?.planningModel || agentRoles.planner?.primaryModel || 'gemini-3.8-flash-high'}
                      onChange={(e) => updatePipelinePolicy('planningModel', e.target.value)}
                      style={{ width: '100%', fontSize: '12px', fontFamily: 'JetBrains Mono', background: '#12131a', padding: '4px 8px', height: '32px' }}
                    >
                      {catalogModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id} ({m.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Skill /ask */}
                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981', fontFamily: 'JetBrains Mono', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                      /ask
                    </span>
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Global Active
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Tham Vấn Kỹ Thuật Đa Chiều (4-Persona)</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.45 }}>
                      Tham vấn qua 4 chuyên gia (Systems Designer, Tech Strategist, Scalability, Risk). Kỹ thuật Internal Multi-Persona, phản hồi thẳng thắn, <strong>Read-only (không sửa file)</strong>.
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                    <label style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Model Điều Phối Ask:</label>
                    <select
                      className="form-input"
                      value={agentRoles.pipelinePolicy?.askModel || agentRoles.planner?.primaryModel || 'gemini-3.8-flash-high'}
                      onChange={(e) => updatePipelinePolicy('askModel', e.target.value)}
                      style={{ width: '100%', fontSize: '12px', fontFamily: 'JetBrains Mono', background: '#12131a', padding: '4px 8px', height: '32px' }}
                    >
                      {catalogModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id} ({m.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PIPELINE EXECUTION & LOOP POLICY CARD */}
          {agentRoles && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 32, 48, 0.95), rgba(18, 19, 28, 0.95))',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                  }}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '-0.2px' }}>
                      Cấu Hình Chu Trình Pipeline (/todo) & Chốt Ngắt Mạch Tuần Hoàn
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Điều phối tập trung chu trình thực hiện: Lên Plan, Chờ xác nhận, Vòng lặp Code - Test - Review tối đa 3 lần và Ngắt mạch giải trình RCA ở lần 4.
                    </div>
                  </div>
                </div>

                <span className="badge badge-primary" style={{ fontSize: '11.5px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} /> Áp dụng toàn cục cho mọi Agent AI
                </span>
              </div>

              {/* 4 Steps Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {/* 1. Planning Gate */}
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Pha 1: Lên Kế Hoạch
                    </span>
                    <span style={{ fontSize: '10.5px', background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      {agentRoles.planner?.primaryModel || 'gemini-3.8-flash-high'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#fff' }}>
                    Architect Planner
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    Phân tích bóc tách luồng dữ liệu, lập task list kiến trúc và phân tích bắt buộc <strong>Tư Duy Ngược (Devil's Advocate & Pre-Mortem)</strong>.
                  </p>
                </div>

                {/* 2. Approval Gate */}
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Pha 2: Cổng Duyệt
                    </span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={agentRoles.pipelinePolicy?.requirePlanApproval !== false}
                        onChange={(e) => updatePipelinePolicy('requirePlanApproval', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#fff' }}>
                    Human Approval Gate
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    {agentRoles.pipelinePolicy?.requirePlanApproval !== false ? (
                      <span style={{ color: '#38bdf8' }}>
                        ● <strong>Bắt buộc dừng lại</strong> chờ người dùng bấm xác nhận kế hoạch trước khi code (Tuyệt đối không tự ý nhảy cóc).
                      </span>
                    ) : (
                      <span>Tự động duyệt và viết code ngay lập tức (Fast-track).</span>
                    )}
                  </p>
                </div>

                {/* 3. Loop Code -> Test -> Review */}
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Pha 3: Vòng Tuần Hoàn Khép Kín
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600' }}>Tối đa:</span>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={agentRoles.pipelinePolicy?.maxLoopRetries || 3}
                        onChange={(e) => updatePipelinePolicy('maxLoopRetries', parseInt(e.target.value) || 3)}
                        style={{
                          width: '46px',
                          padding: '2px 6px',
                          background: '#12131a',
                          border: '1px solid var(--border-hover)',
                          borderRadius: '6px',
                          color: '#34d399',
                          fontWeight: '800',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#cbd5e1' }}>lần</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#fff' }}>
                    Code ➔ Test ➔ Review
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    Tự động quay lại khâu <strong>Code</strong> để sửa khi khâu Test hoặc Review phát hiện bug. Chu trình lặp tối đa <strong>{agentRoles.pipelinePolicy?.maxLoopRetries || 3} lần</strong> liên tiếp.
                  </p>
                </div>

                {/* 4. Circuit Breaker at 4th */}
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Pha 4: Ngắt Mạch Lần {(agentRoles.pipelinePolicy?.maxLoopRetries || 3) + 1}
                    </span>
                    <span style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                      CIRCUIT BREAKER
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#fff' }}>
                    Dừng Hẳn & Báo Cáo Giải Pháp
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#fca5a5', margin: 0, lineHeight: 1.45 }}>
                    Đến lần thứ <strong>{(agentRoles.pipelinePolicy?.maxLoopRetries || 3) + 1}</strong> nếu vẫn còn bug: <strong>BẮT BUỘC DỪNG TOÀN BỘ PIPELINE</strong>. Agent lập báo cáo Root Cause Analysis (RCA) giải trình lý do không thể sửa và đưa ra 2–3 phương án giải quyết để người dùng lựa chọn.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5 AGENT ROLES & WORKFORCE CONFIGURATION */}
          {agentRoles && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Section Header with Contextual Guidance */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(20, 24, 38, 0.95), rgba(15, 17, 26, 0.95))',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                  }}>
                    <Bot size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15.5px', fontWeight: '800', color: '#fff' }}>
                      Bảng Phân Công 5 Vai Trò Nhân Sự AI & Cơ Chế Chịu Lỗi (AI Workforce)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.5 }}>
                      Mỗi vị trí là một <strong>nhân sự AI chuyên trách</strong> cho từng khâu trong quy trình. Khi Model chính cạn Quota hoặc rate-limit, Router tự động chuyển tiếp sang <strong>danh sách bảo hiểm Quota</strong> để công việc không bị dừng.
                    </div>
                  </div>
                </div>

                <span className="badge badge-success" style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} /> 5/5 Vai Trò Sẵn Sàng
                </span>
              </div>

              {/* GROUP 1: PIPELINE 4-STEP WORKFORCE (/todo, /fix) */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '12px', fontWeight: '800', color: '#a5b4fc',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  marginBottom: '12px', paddingLeft: '4px'
                }}>
                  <Zap size={14} style={{ color: '#6366f1' }} />
                  Dây Chuyền Thực Thi 4 Bước Chính (Pipeline: Lập Plan ➔ Viết Code ➔ Kiểm Thử ➔ Thẩm Định)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
                  {/* 1. PLANNER */}
                  <div className="account-card-v2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '12px',
                          background: 'rgba(168, 85, 247, 0.14)', color: '#c084fc',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(168, 85, 247, 0.25)'
                        }}>
                          <Brain size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '1px 6px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase' }}>
                              Trạm 1: Lên Plan
                            </span>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                            Architect Planner (Lên Kế Hoạch)
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.05)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }} title="Lệnh kích hoạt vai trò này">
                          /todo, /planning
                        </span>
                        <span className="badge badge-primary" style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', cursor: 'pointer' }} onClick={() => copyComboName('combo-plan', 'role_planner')} title="Click để copy ID combo ảo">
                          combo-plan
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45, padding: '0 2px' }}>
                      <strong>Nhiệm vụ:</strong> Phân tích yêu cầu, bóc tách luồng dữ liệu, lập task list kiến trúc 5 tầng & phản biện ngược (Devil's Advocate).
                    </div>

                    <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Model Đảm Nhiệm Chính (Primary Model)
                        </label>
                        <span style={{ fontSize: '10px', color: '#c084fc', fontWeight: '600' }}>Ưu tiên số 1</span>
                      </div>
                      <select
                        className="form-input"
                        value={agentRoles.planner?.primaryModel || 'gemini-3.8-flash-high'}
                        onChange={(e) => updateRolePrimary('planner', e.target.value)}
                        style={{ width: '100%', fontSize: '13px', fontFamily: 'JetBrains Mono', background: '#12131a', border: '1px solid var(--border-hover)' }}
                      >
                        {catalogModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.id} ({m.name}) - Tier {m.tier}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🛡️ Bảo Hiểm Quota (Tự động chuyển tiếp khi cạn Quota)
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--accent-light)', fontWeight: '600' }}>
                          {(agentRoles.planner?.fallbackChain || []).length} models dự phòng
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', minHeight: '44px' }}>
                        {(agentRoles.planner?.fallbackChain || []).map((m, idx) => (
                          <span key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#13141a', border: '1px solid var(--border)',
                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontFamily: 'JetBrains Mono'
                          }}>
                            <span style={{ color: 'var(--accent-light)', fontWeight: '700' }}>#{idx + 1}</span>
                            {m}
                            <button
                              type="button"
                              onClick={() => removeRoleFallback('planner', idx)}
                              style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                              title="Xóa model khỏi chuỗi"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <select
                          className="form-input"
                          style={{ fontSize: '12px', padding: '5px 10px', height: '34px', width: '100%', background: 'transparent' }}
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addRoleFallback('planner', e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="" disabled>+ Thêm model vào danh sách bảo hiểm Quota...</option>
                          {catalogModels.map(m => (
                            <option key={m.id} value={m.id}>{m.id} ({m.name})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. CODER */}
                  <div className="account-card-v2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '12px',
                          background: 'rgba(56, 189, 248, 0.14)', color: '#38bdf8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(56, 189, 248, 0.25)'
                        }}>
                          <Code2 size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase' }}>
                              Trạm 2: Viết Code
                            </span>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                            Lead Coder (Lập Trình & Sinh Mã)
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.05)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }} title="Lệnh kích hoạt vai trò này">
                          /todo, /fix
                        </span>
                        <span className="badge badge-primary" style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', cursor: 'pointer' }} onClick={() => copyComboName('combo-code', 'role_coder')} title="Click để copy ID combo ảo">
                          combo-code
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45, padding: '0 2px' }}>
                      <strong>Nhiệm vụ:</strong> Viết mã nguồn nghiệp vụ, service, controller, repository, component theo chuẩn Clean Code.
                    </div>

                    <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Model Đảm Nhiệm Chính (Primary Model)
                        </label>
                        <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '600' }}>Ưu tiên số 1</span>
                      </div>
                      <select
                        className="form-input"
                        value={agentRoles.coder?.primaryModel || 'gemini-3.8-flash-high'}
                        onChange={(e) => updateRolePrimary('coder', e.target.value)}
                        style={{ width: '100%', fontSize: '13px', fontFamily: 'JetBrains Mono', background: '#12131a', border: '1px solid var(--border-hover)' }}
                      >
                        {catalogModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.id} ({m.name}) - Tier {m.tier}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🛡️ Bảo Hiểm Quota (Tự động chuyển tiếp khi cạn Quota)
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--accent-light)', fontWeight: '600' }}>
                          {(agentRoles.coder?.fallbackChain || []).length} models dự phòng
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', minHeight: '44px' }}>
                        {(agentRoles.coder?.fallbackChain || []).map((m, idx) => (
                          <span key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#13141a', border: '1px solid var(--border)',
                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontFamily: 'JetBrains Mono'
                          }}>
                            <span style={{ color: 'var(--accent-light)', fontWeight: '700' }}>#{idx + 1}</span>
                            {m}
                            <button
                              type="button"
                              onClick={() => removeRoleFallback('coder', idx)}
                              style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <select
                          className="form-input"
                          style={{ fontSize: '12px', padding: '5px 10px', height: '34px', width: '100%', background: 'transparent' }}
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addRoleFallback('coder', e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="" disabled>+ Thêm model vào danh sách bảo hiểm Quota...</option>
                          {catalogModels.map(m => (
                            <option key={m.id} value={m.id}>{m.id} ({m.name})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

              {/* 3. TESTER */}
              <div className="account-card-v2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.14)', color: '#34d399',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      <TestTube size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase' }}>
                          Trạm 3: Kiểm Thử & Test
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                        Automated Tester (Kiểm Thử & Test)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.05)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }} title="Lệnh kích hoạt vai trò này">
                      /todo, /fix
                    </span>
                    <span className="badge badge-primary" style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', cursor: 'pointer' }} onClick={() => copyComboName('combo-test', 'role_tester')} title="Click để copy ID combo ảo">
                      combo-test
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45, padding: '0 2px' }}>
                  <strong>Nhiệm vụ:</strong> Viết unit/integration test, chạy linter, kiểm tra coverage, tự động phát hiện và vá lỗi biên dịch.
                </div>

                <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Model Đảm Nhiệm Chính (Primary Model)
                    </label>
                    <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '600' }}>Ưu tiên số 1</span>
                  </div>
                  <select
                    className="form-input"
                    value={agentRoles.tester?.primaryModel || 'gemini-3.8-flash'}
                    onChange={(e) => updateRolePrimary('tester', e.target.value)}
                    style={{ width: '100%', fontSize: '13px', fontFamily: 'JetBrains Mono', background: '#12131a', border: '1px solid var(--border-hover)' }}
                  >
                    {catalogModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} ({m.name}) - Tier {m.tier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🛡️ Bảo Hiểm Quota (Tự động chuyển tiếp khi cạn Quota)
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--accent-light)', fontWeight: '600' }}>
                      {(agentRoles.tester?.fallbackChain || []).length} models dự phòng
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', minHeight: '44px' }}>
                    {(agentRoles.tester?.fallbackChain || []).map((m, idx) => (
                      <span key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#13141a', border: '1px solid var(--border)',
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontFamily: 'JetBrains Mono'
                      }}>
                        <span style={{ color: 'var(--accent-light)', fontWeight: '700' }}>#{idx + 1}</span>
                        {m}
                        <button
                          type="button"
                          onClick={() => removeRoleFallback('tester', idx)}
                          style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                          title="Xóa model khỏi chuỗi"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <select
                      className="form-input"
                      style={{ fontSize: '12px', padding: '5px 10px', height: '34px', width: '100%', background: 'transparent' }}
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addRoleFallback('tester', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="" disabled>+ Thêm model vào danh sách bảo hiểm Quota...</option>
                      {catalogModels.map(m => (
                        <option key={m.id} value={m.id}>{m.id} ({m.name})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. REVIEWERS */}
              <div className="account-card-v2" style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: 'rgba(244, 63, 94, 0.14)', color: '#f87171',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(244, 63, 94, 0.25)'
                    }}>
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', padding: '1px 6px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase' }}>
                          Trạm 4: Thẩm Định Đa Chiều
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                        Parallel Reviewer (Thẩm Định Mã Nguồn)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.05)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }} title="Lệnh kích hoạt vai trò này">
                      /todo, /fix
                    </span>
                    <span className="badge badge-primary" style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', cursor: 'pointer' }} onClick={() => copyComboName('combo-review', 'role_review')} title="Click để copy ID combo ảo">
                      combo-review
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45, padding: '0 2px' }}>
                  <strong>Nhiệm vụ:</strong> Thẩm định song song 3 góc nhìn: Chức năng & Nghiệp vụ, Kiến trúc Clean Code và Bảo mật OWASP.
                </div>

                <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Model Đảm Nhiệm Chính (Primary Model)
                    </label>
                    <span style={{ fontSize: '10px', color: '#f87171', fontWeight: '600' }}>Ưu tiên số 1</span>
                  </div>
                  <select
                    className="form-input"
                    value={agentRoles.review_functional?.primaryModel || 'gemini-3.8-flash-high'}
                    onChange={(e) => updateRolePrimary('review', e.target.value)}
                    style={{ width: '100%', fontSize: '13px', fontFamily: 'JetBrains Mono', background: '#12131a', border: '1px solid var(--border-hover)' }}
                  >
                    {catalogModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} ({m.name}) - Tier {m.tier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🛡️ Bảo Hiểm Quota (Tự động chuyển tiếp khi cạn Quota)
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--accent-light)', fontWeight: '600' }}>
                      {(agentRoles.review_functional?.fallbackChain || []).length} models dự phòng
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', minHeight: '44px' }}>
                    {(agentRoles.review_functional?.fallbackChain || []).map((m, idx) => (
                      <span key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: '#13141a', border: '1px solid var(--border)',
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontFamily: 'JetBrains Mono'
                      }}>
                        <span style={{ color: 'var(--accent-light)', fontWeight: '700' }}>#{idx + 1}</span>
                        {m}
                        <button
                          type="button"
                          onClick={() => removeRoleFallback('review', idx)}
                          style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                          title="Xóa model khỏi chuỗi"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <select
                      className="form-input"
                      style={{ fontSize: '12px', padding: '5px 10px', height: '34px', width: '100%', background: 'transparent' }}
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addRoleFallback('review', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="" disabled>+ Thêm model vào danh sách bảo hiểm Quota...</option>
                      {catalogModels.map(m => (
                        <option key={m.id} value={m.id}>{m.id} ({m.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <ShieldCheck size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                  <span>Áp dụng đồng bộ cho cả 3 chuyên gia thẩm định song song (Chức năng, Kiến trúc & Bảo mật).</span>
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 2: STRATEGIC ADVISORY WORKFORCE (/ask) */}
          <div style={{ marginTop: '8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '8px',
              marginBottom: '12px', paddingLeft: '4px'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '12px', fontWeight: '800', color: '#fbbf24',
                textTransform: 'uppercase', letterSpacing: '0.6px'
              }}>
                <Sparkles size={14} style={{ color: '#f59e0b' }} />
                Nhóm 2: Ban Cố Vấn Kỹ Thuật Độc Lập (Strategic Advisory & 4-Persona Analysis)
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                Tách biệt độc lập khỏi luồng sửa code • Phục vụ /ask ở chế độ Read-Only
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {/* 5. PRINCIPAL ADVISOR */}
              <div className="account-card-v2" style={{
                display: 'flex', flexDirection: 'column', gap: '14px',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, rgba(20, 21, 29, 0.6) 100%)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: 'rgba(245, 158, 11, 0.14)', color: '#fbbf24',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '1px 6px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase' }}>
                          Ban Cố Vấn Chiến Lược • Read-Only
                        </span>
                      </div>
                      <div style={{ fontSize: '15.5px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                        Principal Advisor (Cố Vấn Kỹ Thuật Trưởng)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10.5px', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', border: '1px solid rgba(245, 158, 11, 0.25)' }} title="Lệnh kích hoạt vai trò này">
                      /ask
                    </span>
                    <span className="badge badge-primary" style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', cursor: 'pointer' }} onClick={() => copyComboName('combo-ask', 'role_ask')} title="Click để copy ID combo ảo">
                      combo-ask
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, padding: '0 2px' }}>
                  <strong>Nhiệm vụ:</strong> Tư vấn kiến trúc chuyên sâu, đánh giá trade-off giải pháp, điều phối tranh luận 4 góc nhìn chuyên gia (Systems Designer, Tech Strategist, Scalability Consultant, Risk Analyst) phản hồi thẳng thắn, không sửa code.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
                  <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Model Đảm Nhiệm Chính (Primary Model)
                      </label>
                      <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: '600' }}>Ưu tiên số 1</span>
                    </div>
                    <select
                      className="form-input"
                      value={agentRoles.ask?.primaryModel || 'gemini-3.8-flash-high'}
                      onChange={(e) => updateRolePrimary('ask', e.target.value)}
                      style={{ width: '100%', fontSize: '13px', fontFamily: 'JetBrains Mono', background: '#12131a', border: '1px solid var(--border-hover)' }}
                    >
                      {catalogModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id} ({m.name}) - Tier {m.tier}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🛡️ Bảo Hiểm Quota (Tự động chuyển tiếp khi cạn Quota)
                      </label>
                      <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '600' }}>
                        {(agentRoles.ask?.fallbackChain || []).length} models dự phòng
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', minHeight: '44px' }}>
                      {(agentRoles.ask?.fallbackChain || []).map((m, idx) => (
                        <span key={idx} style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          background: '#13141a', border: '1px solid var(--border)',
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontFamily: 'JetBrains Mono'
                        }}>
                          <span style={{ color: '#fbbf24', fontWeight: '700' }}>#{idx + 1}</span>
                          {m}
                          <button
                            type="button"
                            onClick={() => removeRoleFallback('ask', idx)}
                            style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                            title="Xóa model khỏi chuỗi"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <select
                        className="form-input"
                        style={{ fontSize: '12px', padding: '5px 10px', height: '34px', width: '100%', background: 'transparent' }}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addRoleFallback('ask', e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="" disabled>+ Thêm model vào danh sách bảo hiểm Quota...</option>
                        {catalogModels.map(m => (
                          <option key={m.id} value={m.id}>{m.id} ({m.name})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  padding: '8px 12px',
                  background: 'rgba(245, 158, 11, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Sparkles size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />
                  <span>Tích hợp sẵn kỹ thuật Internal Multi-Persona Debate 4 chiều (Systems, Strategy, Scalability, Risk) phản biện triệt để trước khi chốt giải pháp.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
          )}

          {/* INTEGRATION GUIDE BOX */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: '800', fontSize: '14px' }}>
              <Terminal size={17} style={{ color: 'var(--accent-light)' }} />
              Hướng Dẫn Tích Hợp Vào Bất Kỳ Client / AI Agent Nào (Cursor, Cline, Claude Code, Antigravity)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '12px' }}>
              <div style={{ background: 'var(--bg-input)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ color: '#a5b4fc', fontWeight: '700', marginBottom: '6px' }}>1. Cấu hình Endpoint OpenAI</div>
                <div style={{ color: 'var(--text-muted)' }}>URL: <code style={{ color: '#fff', background: '#12131a', padding: '2px 6px', borderRadius: '4px' }}>http://localhost:20129/v1</code></div>
                <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>API Key: Để trống hoặc bất kỳ (<code style={{ color: '#fff' }}>sk-ai-router</code>)</div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ color: '#38bdf8', fontWeight: '700', marginBottom: '6px' }}>2. Gọi Theo Tên Virtual Combo</div>
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  • Khi Lên Plan: <code style={{ color: 'var(--accent-light)', fontWeight: '700' }}>model: "combo-plan"</code><br/>
                  • Khi Viết Code: <code style={{ color: 'var(--accent-light)', fontWeight: '700' }}>model: "combo-code"</code><br/>
                  • Khi Chạy Test: <code style={{ color: 'var(--accent-light)', fontWeight: '700' }}>model: "combo-test"</code><br/>
                  • Khi Review: <code style={{ color: 'var(--accent-light)', fontWeight: '700' }}>model: "combo-review"</code>
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ color: '#34d399', fontWeight: '700', marginBottom: '6px' }}>3. Antigravity Orchestrator</div>
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Tự động đồng bộ 100% với tệp <code style={{ color: '#fff', background: '#12131a', padding: '2px 6px', borderRadius: '4px' }}>combos.json</code>. Các agent planner / coder / tester trong Antigravity nhận ngay tức thì mà không cần gõ lệnh cấu hình!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VIRTUAL COMBOS & CUSTOM MODEL CHAINS                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'combos' && (
        <div>
      {/* 2-TIER FALLBACK VISUAL ARCHITECTURE BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(13, 13, 16, 0.8))',
        border: '1px solid rgba(249, 115, 22, 0.3)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: '700', fontSize: '14px' }}>
          <Zap size={18} /> Cơ chế Fallback Đa Tầng (Multi-Account & Multi-Tier Failover)
        </div>
        <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
          Khi Agent AI gửi yêu cầu đến Combo (ví dụ <code style={{ color: '#6366f1' }}>combo-code</code>), Brakthroonam Router sẽ thử gọi <strong>Model #1</strong> qua các tài khoản kết nối lần lượt (Account 1, Account 2...). Nếu tất cả tài khoản chạm giới hạn 429 hoặc cạn quota, hệ thống tự động failover an toàn xuống <strong>Model #2</strong> và tiếp tục vòng xoay tua tài khoản.
        </div>
      </div>

      {/* ACTIVE COMBOS LIST SECTION */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>
              Danh Sách Combo Đang Hoạt Động ({combos.length})
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Có thể gọi combo như một model name OpenAI chuẩn (ví dụ: <code style={{ color: 'var(--accent)' }}>model: "combo-code"</code>)
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => handleOpenCreate()}>
            <Plus size={16} /> Tạo Combo Mới
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Đang tải danh sách combo...
          </div>
        ) : combos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px dashed var(--border)'
          }}>
            <Cpu size={36} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
            <div style={{ color: '#fff', fontWeight: '600', marginBottom: '6px' }}>
              Chưa có combo nào được tạo
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Bấm nút "Tạo Combo Mới" hoặc chọn một preset bên dưới.
            </p>
            <button className="btn btn-primary" onClick={() => handleOpenCreate()}>
              <Plus size={15} /> Tạo Combo Ngay
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {combos.map((combo) => {
              const isCopied = copiedId === combo.id;
              return (
                <div
                  key={combo.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(249, 115, 22, 0.15)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Cpu size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                            {combo.name}
                          </span>
                          <span className="badge badge-primary">2-Tier Fallback</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {combo.models.length} model(s) trong chuỗi xoay tua
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => copyComboName(combo.name, combo.id)}
                        title="Copy combo model ID"
                      >
                        {isCopied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                        {isCopied ? 'Copied' : 'Copy ID'}
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenEdit(combo)}
                        title="Chỉnh sửa combo"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDeleteCombo(combo.id)}
                        title="Xóa combo"
                      >
                        <Trash2 size={15} style={{ color: 'var(--error)' }} />
                      </button>
                    </div>
                  </div>

                  {/* Fallback chain visual chips */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    borderRadius: '8px'
                  }}>
                    {combo.models.map((m, idx) => (
                      <React.Fragment key={idx}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#fff',
                          border: '1px solid var(--border)'
                        }}>
                          <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '11px' }}>
                            #{idx + 1}
                          </span>
                          <span>{m}</span>
                        </div>
                        {idx < combo.models.length - 1 && (
                          <ArrowRight size={13} style={{ color: 'var(--text-dim)' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: QUICK PRESETS FOR AGENT TEAMS */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} style={{ color: 'var(--accent)' }} />
              Thư Viện Preset Combo Mẫu (Multi-Agent Fast Presets)
              <span className="badge badge-primary" style={{ fontSize: '10px' }}>1-Click Tạo Nhanh</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Các tổ hợp mô hình chuẩn cho từng vai trò. Bấm <strong>"Áp Dụng Nhanh"</strong> để khởi tạo ngay vào danh sách, hoặc bấm "Tùy Biến" để điều chỉnh thứ tự model.
            </p>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '14px' }}>
          {PRESET_COMBOS.map((preset) => (
            <div
              key={preset.name}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>
                    {preset.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    fontWeight: '700'
                  }}>
                    {preset.models.length} models
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                  {preset.description}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {preset.models.map((m) => {
                    const connected = isModelConnected({ provider: m.startsWith('claude') ? 'claude' : (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3')) ? 'codex' : 'gemini' });
                    return (
                      <span
                        key={m}
                        style={{
                          fontSize: '10px',
                          background: connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          border: connected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: connected ? '#a7f3d0' : '#94a3b8'
                        }}
                      >
                        {connected ? '● ' : '○ '}{m}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '11px', padding: '6px 12px', whiteSpace: 'nowrap', gap: '4px' }}
                  onClick={() => handleApplyPreset1Click(preset)}
                  title="Tạo / Áp dụng ngay combo này vào database mà không cần mở modal"
                >
                  <Zap size={12} />
                  Áp Dụng Nhanh
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '5px 10px', whiteSpace: 'nowrap' }}
                  onClick={() => handleOpenCreate(preset)}
                  title="Tùy biến các model trước khi lưu"
                >
                  Tùy biến
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: MODEL HIERARCHY / CATALOG SECTION */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--accent)' }} />
              Bảng Phân Hạng Năng Lực Model & Trạng Thái Kết Nối
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Xếp hạng theo sức mạnh suy luận logic (Tier 1 Flagship ➔ Tier 2 Coding ➔ Tier 3 Tốc độ cao).
            </p>
          </div>

          {/* Connected Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: filterConnectedOnly ? '#34d399' : 'var(--text-secondary)',
              cursor: 'pointer',
              background: 'var(--bg-input)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: filterConnectedOnly ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid var(--border)'
            }}>
              <input
                type="checkbox"
                checked={filterConnectedOnly}
                onChange={(e) => setFilterConnectedOnly(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Chỉ hiện model của tài khoản đã kết nối ({connectedCount})</span>
            </label>

            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Đã kết nối: 3 Google Gemini, 1 OpenAI Codex
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Tier 1 */}
          <div style={{ background: 'var(--bg-input)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-primary">Tier 1: Flagship & Deep Reasoning</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Tác vụ nặng: Plan (/planning), Architecture, Technical Consult (/ask), Security Audit</span>
              </div>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>
                {tier1Models.length} models
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tier1Models.map(m => {
                const connected = isModelConnected(m);
                return (
                  <div
                    key={m.id}
                    style={{
                      background: connected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: connected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: connected ? 1 : 0.55
                    }}
                    title={connected ? `Khả dụng từ ${m.providerName}` : `Chưa kết nối tài khoản ${m.providerName}`}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? '#10b981' : '#64748b' }} />
                    <span style={{ fontWeight: '600', color: connected ? '#fff' : 'var(--text-muted)' }}>{m.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{m.ctx}</span>
                    {connected ? (
                      <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                        Sẵn sàng
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-dim)', padding: '1px 5px', borderRadius: '4px' }}>
                        Chưa nối acc
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier 2 */}
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-success">Tier 2: Standard Production & Coding</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Coding hằng ngày (/todo, /fix), multi-file refactoring, subagents</span>
              </div>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
                {tier2Models.length} models
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tier2Models.map(m => {
                const connected = isModelConnected(m);
                return (
                  <div
                    key={m.id}
                    style={{
                      background: connected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: connected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: connected ? 1 : 0.55
                    }}
                    title={connected ? `Khả dụng từ ${m.providerName}` : `Chưa kết nối tài khoản ${m.providerName}`}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? '#10b981' : '#64748b' }} />
                    <span style={{ fontWeight: '600', color: connected ? '#fff' : 'var(--text-muted)' }}>{m.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{m.ctx}</span>
                    {connected ? (
                      <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                        Sẵn sàng
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-dim)', padding: '1px 5px', borderRadius: '4px' }}>
                        Chưa nối acc
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier 3 */}
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-dim">Tier 3: Economy & High Throughput</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Unit test, linter, validation nhanh, high-volume batch</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                {tier3Models.length} models
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tier3Models.map(m => {
                const connected = isModelConnected(m);
                return (
                  <div
                    key={m.id}
                    style={{
                      background: connected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: connected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: connected ? 1 : 0.55
                    }}
                    title={connected ? `Khả dụng từ ${m.providerName}` : `Chưa kết nối tài khoản ${m.providerName}`}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? '#10b981' : '#64748b' }} />
                    <span style={{ fontWeight: '600', color: connected ? '#fff' : 'var(--text-muted)' }}>{m.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{m.ctx}</span>
                    {connected ? (
                      <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                        Sẵn sàng
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-dim)', padding: '1px 5px', borderRadius: '4px' }}>
                        Chưa nối acc
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* CREATE / EDIT COMBO MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <form
            onSubmit={handleSaveCombo}
            style={{
              width: '100%',
              maxWidth: '600px',
              background: '#18181e',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#fff' }}>
                {editingId ? 'Chỉnh sửa Combo' : 'Tạo Combo Mới'}
              </h3>
              <button type="button" className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="form-label">Tên Combo *</label>
              <input
                type="text"
                className="form-input"
                placeholder="ví dụ: combo-plan, combo-code, combo-review"
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">
                Danh sách Model theo thứ tự Fallback (Kéo/Chuyển mũi tên lên xuống)
              </label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
                background: 'var(--bg-input)',
                borderRadius: '8px',
                minHeight: '80px',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                {selectedModels.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: '12px', textAlign: 'center', padding: '12px' }}>
                    Chưa chọn model nào. Chọn từ danh sách bên dưới hoặc nhập model tùy chỉnh.
                  </div>
                ) : (
                  selectedModels.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#22222b',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '12px' }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontSize: '13px', color: '#fff' }}>{m}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleMoveModel(idx, -1)}
                          disabled={idx === 0}
                          title="Lên trên"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleMoveModel(idx, 1)}
                          disabled={idx === selectedModels.length - 1}
                          title="Xuống dưới"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleRemoveModel(idx)}
                          title="Xóa khỏi combo"
                        >
                          <Trash2 size={14} style={{ color: 'var(--error)' }} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Add From Catalog */}
            <div>
              <label className="form-label">Chọn thêm nhanh từ Catalog</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                {catalogModels.map((m) => {
                  const isSelected = selectedModels.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isSelected}
                      onClick={() => handleAddModel(m.id)}
                      style={{
                        background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'var(--bg-input)',
                        color: isSelected ? 'var(--text-dim)' : '#fff',
                        border: '1px solid var(--border)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        cursor: isSelected ? 'default' : 'pointer'
                      }}
                    >
                      + {m.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Model Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Nhập ID model bất kỳ..."
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAddModel(customModelInput.trim())}
              >
                + Thêm
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Lưu Combo
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
