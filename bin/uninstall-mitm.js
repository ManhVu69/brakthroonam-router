const fs = require('fs');
const { execSync } = require('child_process');

console.log('=======================================================================');
console.log('     BRAKTHROONAM ROUTER - KHÔI PHỤC MẠNG GỐC CHO ANTIGRAVITY');
console.log('=======================================================================');
console.log('');

// 1. Remove from hosts
console.log('[*] Khôi phục file hosts gốc (bỏ chuyển hướng cloudcode-pa)...');
const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
try {
  const hostsContent = fs.readFileSync(hostsPath, 'utf8');
  const lines = hostsContent.split(/\r?\n/).filter(line => {
    return !line.includes('cloudcode-pa.googleapis.com') && !line.includes('BRAKTHROONAM');
  });
  fs.writeFileSync(hostsPath, lines.join('\r\n'), 'utf8');
  execSync('ipconfig /flushdns', { stdio: 'ignore' });
  console.log('    [OK] Đã hoàn nguyên file hosts về trực tiếp.');
} catch (e) {
  console.error('    [LỖI] Không thể ghi hosts file:', e.message);
}

console.log('');
console.log('=======================================================================');
console.log(' ✅ ĐÃ KHÔI PHỤC MẠNG GỐC THÀNH CÔNG! Antigravity kết nối trực tiếp.');
console.log('=======================================================================');
console.log('');
