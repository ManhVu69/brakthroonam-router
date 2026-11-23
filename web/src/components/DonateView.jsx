import React, { useState } from 'react';
import {
  Heart, Copy, Check, Download, ExternalLink, Sparkles, Coffee,
  ShieldCheck, ArrowRight, Wallet, Building2, Gift, QrCode
} from 'lucide-react';
import qrMb from '../assets/donate/qr_mb.jpg';
import qrMomo from '../assets/donate/qr_momo.jpg';

export default function DonateView() {
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedMomo, setCopiedMomo] = useState(false);
  const [copiedContentMb, setCopiedContentMb] = useState(false);
  const [copiedContentMomo, setCopiedContentMomo] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
      showToast('Đã sao chép số tài khoản MB Bank: ' + text);
    } else if (type === 'momo') {
      setCopiedMomo(true);
      setTimeout(() => setCopiedMomo(false), 2000);
      showToast('Đã sao chép số tài khoản MoMo: ' + text);
    } else if (type === 'content_mb') {
      setCopiedContentMb(true);
      setTimeout(() => setCopiedContentMb(false), 2000);
      showToast('Đã sao chép nội dung chuyển khoản: ' + text);
    } else if (type === 'content_momo') {
      setCopiedContentMomo(true);
      setTimeout(() => setCopiedContentMomo(false), 2000);
      showToast('Đã sao chép nội dung chuyển khoản: ' + text);
    }
  };

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

      {/* Hero Header */}
      <div style={{
        background: 'rgba(18, 20, 28, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
      }}>
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            <Heart size={14} fill="#fb7185" /> Ủng Hộ & Đồng Hành Cùng Dự Án Brakthroonam Router
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.25, fontFamily: 'var(--font-display)' }}>
            Đồng Hành Cùng Dự Án Brakthroonam Router
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.55 }}>
            Brakthroonam Router là dự án mã nguồn mở phát triển phi lợi nhuận nhằm hỗ trợ các kỹ sư AI và lập trình viên Việt Nam quản trị đa tài khoản, tối ưu xoay tua quota và vận hành hệ thống Agent AI tự động. Sự ủng hộ dù là nhỏ nhất (một ly cà phê ☕) cũng là nguồn động viên vô giá giúp dự án duy trì và hoàn thiện!
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 20px',
          background: 'rgba(244, 63, 94, 0.06)',
          border: '1px solid rgba(244, 63, 94, 0.18)',
          borderRadius: '10px',
          gap: '6px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f43f5e, #fb7185)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)'
          }}>
            <Coffee size={20} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#fda4af' }}>
            Mời tác giả 1 ly cà phê
          </span>
        </div>
      </div>

      {/* 2 Payment Methods Grid - Balanced & Symmetrical */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Card 1: MB Bank */}
        <div style={{
          background: '#11131a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '3px',
            background: 'linear-gradient(90deg, #0284c7, #38bdf8)'
          }}></div>

          {/* Header 44px height */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            minHeight: '44px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>Ngân Hàng MB Bank</div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600', marginTop: '2px' }}>VietQR Chuyển Nhanh 24/7</div>
              </div>
            </div>
            <span className="badge badge-primary" style={{ fontSize: '11px', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
              MB Quân Đội
            </span>
          </div>

          {/* Symmetrical QR Container (Fixed 260px x 270px) */}
          <div style={{
            width: '260px',
            height: '270px',
            background: '#ffffff',
            padding: '12px',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={qrMb}
              alt="Mã QR MB Bank - Vũ Văn Mạnh"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block'
              }}
            />
          </div>

          {/* Details Table - 4 Exact Identical Rows */}
          <div style={{
            width: '100%',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Row 1: Chủ tài khoản */}
            <div style={{ height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chủ tài khoản:</span>
              <strong style={{ color: '#fff', fontSize: '13.5px', letterSpacing: '0.3px' }}>VŨ VĂN MẠNH</strong>
            </div>

            {/* Row 2: Số tài khoản */}
            <div style={{ height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Số tài khoản:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#38bdf8', fontWeight: '800', fontSize: '14px' }}>
                  251626666869
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('251626666869', 'bank')}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    padding: '0 8px',
                    height: '26px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '700'
                  }}
                  title="Sao chép số tài khoản"
                >
                  {copiedBank ? <Check size={12} /> : <Copy size={12} />}
                  {copiedBank ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            {/* Row 3: Ngân hàng / Kênh */}
            <div style={{ height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Ngân hàng:</span>
              <span style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '13px' }}>MBBank (Quân Đội)</span>
            </div>

            {/* Row 4: Nội dung CK */}
            <div style={{ height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nội dung CK:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#cbd5e1', fontFamily: 'JetBrains Mono', fontSize: '12.5px' }}>Ung ho Brakthroonam Router</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('Ung ho Brakthroonam Router', 'content_mb')}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                  title="Sao chép nội dung"
                >
                  {copiedContentMb ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          <a
            href={qrMb}
            download="vietqr_mbbank_vumanh.jpg"
            className="btn btn-secondary"
            style={{
              marginTop: '16px',
              width: '100%',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '12.5px',
              textDecoration: 'none'
            }}
          >
            <Download size={14} /> Tải Ảnh QR MB Bank
          </a>
        </div>

        {/* Card 2: MoMo */}
        <div style={{
          background: '#11131a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '3px',
            background: 'linear-gradient(90deg, #ec4899, #f43f5e)'
          }}></div>

          {/* Header 44px height */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            minHeight: '44px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#f472b6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wallet size={18} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>Ví Điện Tử MoMo</div>
                <div style={{ fontSize: '11px', color: '#f472b6', fontWeight: '600', marginTop: '2px' }}>Quét Mã Chuyển Tiền Tức Thì</div>
              </div>
            </div>
            <span className="badge badge-primary" style={{ fontSize: '11px', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
              MoMo QR
            </span>
          </div>

          {/* Symmetrical QR Container (Fixed 260px x 270px) */}
          <div style={{
            width: '260px',
            height: '270px',
            background: '#ffffff',
            padding: '12px',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={qrMomo}
              alt="Mã QR MoMo - Vũ Văn Mạnh"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block'
              }}
            />
          </div>

          {/* Details Table - 4 Exact Identical Rows */}
          <div style={{
            width: '100%',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Row 1: Chủ tài khoản */}
            <div style={{ height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chủ tài khoản:</span>
              <strong style={{ color: '#fff', fontSize: '13.5px', letterSpacing: '0.3px' }}>VŨ VĂN MẠNH</strong>
            </div>

            {/* Row 2: Số tài khoản */}
            <div style={{ height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Số tài khoản:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#f472b6', fontWeight: '800', fontSize: '14px' }}>
                  *******870
                </span>
                <span
                  style={{
                    background: 'rgba(236, 72, 153, 0.15)',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    color: '#f472b6',
                    padding: '0 8px',
                    height: '26px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '700'
                  }}
                  title="Quét mã QR trên ứng dụng MoMo"
                >
                  <QrCode size={12} /> Quét mã QR
                </span>
              </div>
            </div>

            {/* Row 3: Ngân hàng / Kênh */}
            <div style={{ height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Kênh thanh toán:</span>
              <span style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '13px' }}>Ví MoMo (Napas 247)</span>
            </div>

            {/* Row 4: Nội dung CK */}
            <div style={{ height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nội dung CK:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#cbd5e1', fontFamily: 'JetBrains Mono', fontSize: '12.5px' }}>Ung ho Brakthroonam Router</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('Ung ho Brakthroonam Router', 'content_momo')}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                  title="Sao chép nội dung"
                >
                  {copiedContentMomo ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          <a
            href={qrMomo}
            download="momo_qr_vumanh.jpg"
            className="btn btn-secondary"
            style={{
              marginTop: '16px',
              width: '100%',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '12.5px',
              textDecoration: 'none'
            }}
          >
            <Download size={14} /> Tải Ảnh QR MoMo
          </a>
        </div>
      </div>

      {/* Thank you note & Value summary */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: '700', fontSize: '15px' }}>
          <Gift size={18} style={{ color: '#f43f5e' }} /> Lời Cảm Ơn Từ Đội Ngũ Phát Triển
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Dự án <strong>Brakthroonam Router Pro</strong> được sinh ra với mục tiêu giải phóng lập trình viên khỏi gánh nặng quản lý API key, xoay tua tài khoản thủ công và thiết lập môi trường phức tạp cho AI Coding Agents. Toàn bộ tiền donate sẽ được dùng trực tiếp để:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#cbd5e1' }}>
            <span style={{ color: '#10b981', fontWeight: '800' }}>✓</span> Mua account & API key test độ trễ các mô hình mới
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#cbd5e1' }}>
            <span style={{ color: '#10b981', fontWeight: '800' }}>✓</span> Duy trì hạ tầng phát triển và tài liệu mã nguồn mở
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#cbd5e1' }}>
            <span style={{ color: '#10b981', fontWeight: '800' }}>✓</span> Nâng cấp tính năng Auto-Healing & Smart Load Balancing
          </div>
        </div>
      </div>
    </div>
  );
}
