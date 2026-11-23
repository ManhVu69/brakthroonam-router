import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleBack = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onNavigateHome) {
      this.props.onNavigateHome();
    } else {
      window.location.hash = '#gateway';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 32px',
          margin: '30px auto',
          maxWidth: '600px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          textAlign: 'center',
          color: '#fff',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(244, 63, 94, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(244, 63, 94, 0.25)'
          }}>
            <AlertTriangle size={28} style={{ color: 'var(--error)' }} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>Đã xảy ra sự cố hiển thị</h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '12.5px',
            margin: '10px 0 24px',
            fontFamily: 'JetBrains Mono',
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'left',
            overflowX: 'auto'
          }}>
            {this.state.error?.message || 'Lỗi không xác định.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              onClick={this.handleBack}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13px' }}
            >
              <ArrowLeft size={15} /> Quay lại Gateway
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13px' }}
            >
              <RefreshCw size={15} /> Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
