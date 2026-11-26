#!/usr/bin/env node

const { exec, execSync } = require('child_process');
const { startServer } = require('../server');

const args = process.argv.slice(2);

let port = 20129;
let host = '0.0.0.0';
let noBrowser = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    port = parseInt(args[i + 1], 10) || 20129;
    i++;
  } else if (args[i] === '--host' || args[i] === '-H') {
    host = args[i + 1] || '0.0.0.0';
    i++;
  } else if (args[i] === '--no-browser' || args[i] === '-n') {
    noBrowser = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Usage: ai-router [options]

Options:
  -p, --port <port>   Port to run the server (default: 20129)
  -H, --host <host>   Host to bind (default: 0.0.0.0)
  -n, --no-browser    Don't open browser automatically
  -h, --help          Show this help message
`);
    process.exit(0);
  }
}

function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  // Trên Windows, thử thực thi đồng bộ với Windows Shell để tránh Node process thoát trước khi lệnh mở URL kịp chạy
  try {
    if (platform === 'win32') {
      execSync(cmd, { windowsHide: true, stdio: 'ignore', timeout: 3000 });
      return Promise.resolve();
    }
  } catch (_) {}

  return new Promise((resolve) => {
    exec(cmd, { windowsHide: true }, (err) => {
      if (err) {
        console.log(`Vui lòng mở trình duyệt thủ công: ${url}`);
      }
      resolve();
    });
  });
}

async function main() {
  try {
    const server = await startServer(port, host);
    const dashboardUrl = `http://localhost:${port}`;

    if (!noBrowser) {
      // Đợi 500ms để TCP listener hoàn tất rồi mở trình duyệt
      setTimeout(() => {
        openBrowser(dashboardUrl);
      }, 500);
    }

    const shutdown = () => {
      console.log('\n🛑 Đang tắt Brakthroonam Router...');
      server.close(() => {
        console.log('✅ Brakthroonam Router đã dừng.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    process.on('uncaughtException', (err) => {
      console.error('[Brakthroonam-Router] Uncaught exception:', err.message || err);
    });
    process.on('unhandledRejection', (reason) => {
      console.error('[Brakthroonam-Router] Unhandled rejection:', reason?.message || reason);
    });
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`\n=======================================================================`);
      console.log(`ℹ️  Brakthroonam Router đang chạy trên cổng ${port}.`);
      console.log(`🌐 Đang mở Dashboard: http://localhost:${port}`);
      console.log(`=======================================================================\n`);
      if (!noBrowser) {
        await openBrowser(`http://localhost:${port}`);
      }
      // Cho một khoảng đệm 400ms để đảm bảo Windows shell đã nhận lệnh mở trình duyệt
      setTimeout(() => {
        process.exit(0);
      }, 400);
    } else {
      console.error('\n❌ Không thể khởi động Brakthroonam Router:', err.message);
      process.exit(1);
    }
  }
}

main();
