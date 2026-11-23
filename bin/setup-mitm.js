const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=======================================================================');
console.log('     BRAKTHROONAM ROUTER - CAU HINH TU DONG ANTIGRAVITY MITM PROXY');
console.log('=======================================================================');
console.log('');

let hasError = false;

// 1. Generate certificates
console.log('[*] Buoc 1/3: Khoi tao chung chi noi bo Brakthroonam Root CA...');
try {
  const antigravityMitmService = require('../server/services/antigravityMitmService');
  antigravityMitmService.generateCertificates();
  console.log('    [OK] Chung chi Brakthroonam Root CA & Domain SSL san sang.');
} catch (e) {
  console.warn('    [WARN] Khoi tao cert:', e.message);
  hasError = true;
}

// 2. Add to Windows Trusted Root Store
console.log('[*] Buoc 2/3: Cai dat chung chi vao Windows Trusted Store (certutil)...');
const caCertPath = path.join(__dirname, '..', 'data', 'certs', 'brakthroonam-ca.crt');
try {
  if (fs.existsSync(caCertPath)) {
    execSync(`certutil -addstore -f "ROOT" "${caCertPath}"`, { stdio: 'pipe' });
    console.log('    [OK] Chung chi Brakthroonam Root CA da duoc them vao Trusted Store.');
  } else {
    console.warn('    [WARN] Chua tim thay file CA tai:', caCertPath);
    hasError = true;
  }
} catch (e) {
  console.error('    [LOI] Khong the cai chung chi (Can quyen Administrator):', e.message);
  hasError = true;
}

// 3. Configure hosts file
console.log('[*] Buoc 3/3: Cau hinh chuyen huong ten mien trong hosts...');
const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
try {
  const hostsContent = fs.readFileSync(hostsPath, 'utf8');
  const lines = hostsContent.split(/\r?\n/).filter(line => {
    return !line.includes('cloudcode-pa.googleapis.com') && !line.includes('BRAKTHROONAM');
  });
  lines.push('# --- BRAKTHROONAM ROUTER ANTIGRAVITY MITM ---');
  lines.push('127.0.0.1 cloudcode-pa.googleapis.com');
  lines.push('127.0.0.1 daily-cloudcode-pa.googleapis.com');
  lines.push('# --- END BRAKTHROONAM ROUTER ---');
  fs.writeFileSync(hostsPath, lines.join('\r\n'), 'utf8');
  console.log('    [OK] Da chuyen huong cloudcode-pa.googleapis.com -> 127.0.0.1.');
  console.log('    [OK] Da chuyen huong daily-cloudcode-pa.googleapis.com -> 127.0.0.1.');
} catch (e) {
  console.error('    [LOI] Khong the ghi file hosts (Can quyen Administrator):', e.message);
  hasError = true;
}

// 4. Flush DNS
try {
  execSync('ipconfig /flushdns', { stdio: 'ignore' });
  console.log('    [OK] Da lam moi DNS cache (ipconfig /flushdns).');
} catch (e) {
  console.warn('    [WARN] Flush DNS:', e.message);
}

console.log('');
console.log('=======================================================================');
if (hasError) {
  console.log(' [X] CAU HINH CHUA HOAN TAT!');
  console.log(' Ly do: Can quyen Administrator de ghi file hosts va cai chung chi.');
  console.log(' Huong dan: Vui long nhap chuot phai vao setup-antigravity.bat');
  console.log('           roi chon "Run as administrator".');
  process.exit(1);
} else {
  console.log(' [V] CAU HINH THANH CONG!');
  console.log(' - Brakthroonam Router se tu dong chan loi 429 va trao tai khoan ngam.');
  console.log(' - Ban chi can mo App Antigravity va su dung binh thuong.');
  console.log(' - Dashboard quan tri: http://localhost:20129');
}
console.log('=======================================================================');
console.log('');
