import React, { useState, useEffect } from 'react';
import {
  BarChart3, Activity, Layers, UserCheck, RefreshCw, Zap, Clock,
  ShieldCheck, Flame, PieChart, CheckCircle2, AlertCircle
} from 'lucide-react';
import TopologyGraph from './TopologyGraph';

export default function UsageView() {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [detectedAgents, setDetectedAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [breakdownTab, setBreakdownTab] = useState('account'); // 'account' | 'model'

  useEffect(() => {
    fetchData();
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(fetchData, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      const now = Date.now();
      const [sumRes, logsRes, activeRes] = await Promise.all([
        fetch(`/api/usage/summary?_t=${now}`, { cache: 'no-store' }),
        fetch(`/api/usage/logs?limit=40&_t=${now}`, { cache: 'no-store' }),
        fetch(`/api/usage/active?_t=${now}`, { cache: 'no-store' })
      ]);
      const sumData = await sumRes.json();
      const logsData = await logsRes.json();
      const activeData = await activeRes.json();

      setSummary(sumData);
      setLogs(logsData);
      const activeList = Array.isArray(activeData) ? activeData : (activeData.activeRequests || []);
      const agentsList = Array.isArray(activeData.detectedAgents) ? activeData.detectedAgents : [];
      setActiveRequests(activeList);
      setDetectedAgents(agentsList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return 'Vừa xong';
    const d = new Date(isoStr);
    return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">
            <BarChart3 size={26} style={{ color: 'var(--accent)' }} />
            Usage & Analytics
          </h1>
          <p className="page-subtitle">
            Theo dõi chi tiết agent đang call đến model nào, tài khoản Gmail nào đang đốt token và sơ đồ luồng dữ liệu phát sáng thời gian thực.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`btn ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px' }}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw size={14} className={autoRefresh ? 'spin' : ''} />
            {autoRefresh ? 'Live Updating (2.5s)' : 'Tạm dừng'}
          </button>
        </div>
      </div>

      {/* 1. INTERACTIVE GLOWING TOPOLOGY GRAPH (MATCHING 9ROUTER) */}
      <TopologyGraph
        activeRequests={activeRequests}
        recentLogs={logs}
        detectedAgents={detectedAgents}
        onRefresh={fetchData}
      />

      {/* 2. METRIC CARDS */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600', letterSpacing: '0.04em' }}>TỔNG SỐ REQUESTS</span>
            <Activity size={18} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '600', color: 'var(--text-main)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summary?.totals?.total_requests)}
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600', letterSpacing: '0.04em' }}>PROMPT TOKENS</span>
            <Zap size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '600', color: 'var(--text-main)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summary?.totals?.total_prompt_tokens)}
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600', letterSpacing: '0.04em' }}>COMPLETION TOKENS</span>
            <Zap size={18} style={{ color: '#ec4899' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '600', color: 'var(--text-main)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summary?.totals?.total_completion_tokens)}
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600', letterSpacing: '0.04em' }}>TỔNG TOKENS ĐÃ ĐỐT</span>
            <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--accent)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summary?.totals?.total_tokens)}
          </div>
        </div>
      </div>

      {/* 4. BREAKDOWN SECTION (BY ACCOUNT & BY MODEL) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`btn ${breakdownTab === 'account' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={() => setBreakdownTab('account')}
            >
              <UserCheck size={14} /> Thống Kê Theo Tài Khoản & Gmail
            </button>
            <button
              className={`btn ${breakdownTab === 'model' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={() => setBreakdownTab('model')}
            >
              <Layers size={14} /> Thống Kê Theo Model
            </button>
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Dữ liệu tổng hợp từ Database SQLite
          </span>
        </div>

        {breakdownTab === 'account' ? (
          <div>
            {!summary?.byAccount || summary.byAccount.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                Chưa có dữ liệu gọi token từ tài khoản nào.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '11.5px', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 16px' }}>TÀI KHOẢN (GMAIL)</th>
                    <th style={{ padding: '12px 16px' }}>PROVIDER</th>
                    <th style={{ padding: '12px 16px' }}>SỐ REQUESTS</th>
                    <th style={{ padding: '12px 16px' }}>PROMPT TOKENS</th>
                    <th style={{ padding: '12px 16px' }}>COMPLETION TOKENS</th>
                    <th style={{ padding: '12px 16px' }}>TỔNG TOKENS</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byAccount.map((row) => (
                    <tr key={row.account_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main)' }}>
                        {row.account_name}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-dim">{row.provider}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatNumber(row.requests)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatNumber(row.prompt_tokens)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatNumber(row.completion_tokens)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                        {formatNumber(row.total_tokens)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div>
            {!summary?.byModel || summary.byModel.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                Chưa có dữ liệu gọi model nào.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '11.5px', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 16px' }}>MODEL</th>
                    <th style={{ padding: '12px 16px' }}>PROVIDER</th>
                    <th style={{ padding: '12px 16px' }}>SỐ REQUESTS</th>
                    <th style={{ padding: '12px 16px' }}>PROMPT TOKENS</th>
                    <th style={{ padding: '12px 16px' }}>COMPLETION TOKENS</th>
                    <th style={{ padding: '12px 16px' }}>TỔNG TOKENS</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byModel.map((row) => (
                    <tr key={row.model} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                        {row.model}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-dim">{row.provider}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatNumber(row.requests)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatNumber(row.prompt_tokens)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatNumber(row.completion_tokens)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                        {formatNumber(row.total_tokens)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* 5. RECENT REQUEST LOGS TABLE */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Clock size={18} style={{ color: 'var(--accent)' }} />
            Nhật Ký Gọi Token Gần Đây (Chi tiết từng Request)
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Ghi nhận thời gian, tài khoản xử lý và latency
          </span>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
            Chưa có nhật ký request nào.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '11.5px', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 16px' }}>THỜI GIAN</th>
                  <th style={{ padding: '10px 16px' }}>PROVIDER</th>
                  <th style={{ padding: '10px 16px' }}>TÀI KHOẢN (GMAIL)</th>
                  <th style={{ padding: '10px 16px' }}>MODEL</th>
                  <th style={{ padding: '10px 16px' }}>TOKENS</th>
                  <th style={{ padding: '10px 16px' }}>DURATION</th>
                  <th style={{ padding: '10px 16px' }}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-dim)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {formatTime(log.timestamp)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="badge badge-dim">{log.provider}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: '500', color: 'var(--text-main)' }}>
                      {log.account_name}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {log.model}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(log.total_tokens)}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {log.duration_ms}ms
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className={`badge ${log.status === 'ok' ? 'badge-success' : 'badge-error'}`}>
                        {log.status === 'ok' ? 'Success' : 'Error'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
