#!/usr/bin/env node

const { exec } = require('child_process');
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
  exec(cmd, { windowsHide: true }, (err) => {
    if (err) {
      console.log(`Open browser manually: ${url}`);
    }
  });
}

async function main() {
  try {
    const server = await startServer(port, host);
    const dashboardUrl = `http://localhost:${port}`;

    if (!noBrowser) {
      // Open browser after 400ms to allow TCP listener ready
      setTimeout(() => {
        openBrowser(dashboardUrl);
      }, 400);
    }

    const shutdown = () => {
      console.log('\nShutting down Brakthroonam Router...');
      server.close(() => {
        console.log('Brakthroonam Router stopped.');
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
      console.error(`\n❌ Error: Port ${port} is already in use.`);
      console.error(`Try running with another port: ai-router --port ${port + 1}\n`);
    } else {
      console.error('Failed to start Brakthroonam Router:', err.message);
    }
    process.exit(1);
  }
}

main();
