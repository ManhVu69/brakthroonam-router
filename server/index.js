const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');
const { initGlobalSkillsOnStartup } = require('./services/skillSyncService');
const { startAntigravityWatcher } = require('./services/antigravitySyncService');
const antigravityMitmService = require('./services/antigravityMitmService');
const apiRoutes = require('./routes/apiRoutes');
const proxyRoutes = require('./routes/proxyRoutes');

function createApp() {
  const app = express();

  // Khởi tạo và đồng bộ 4 Global Skills (/todo, /fix, /planning, /ask) cho máy tính này
  initGlobalSkillsOnStartup();

  // Khởi động Daemon theo dõi live chuyển đổi tài khoản Antigravity IDE (2s polling)
  startAntigravityWatcher();

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Request logger (optional debug)
  app.use((req, res, next) => {
    if (req.path.startsWith('/v1')) {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    }
    next();
  });

  // REST API routes
  app.use('/api', apiRoutes);

  // OpenAI / Claude Proxy routes
  app.use('/v1', proxyRoutes);

  // Serve Frontend UI static build if exists
  const publicDir = path.join(__dirname, '..', 'web', 'dist');
  app.use(express.static(publicDir));

  // SPA fallback
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/v1')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    const indexPath = path.join(publicDir, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Brakthroonam Router</title>
              <style>
                body { background: #0f0f11; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { background: #1c1c21; padding: 32px; border-radius: 12px; border: 1px solid #2d2d38; max-width: 500px; text-align: center; }
                h1 { color: #f97316; margin-top: 0; }
                code { background: #272730; padding: 4px 8px; border-radius: 4px; color: #38bdf8; }
              </style>
            </head>
            <body>
              <div class="box">
                <h1>Brakthroonam Router Server Online 🚀</h1>
                <p>Proxy Endpoint: <code>http://localhost:20129/v1</code></p>
                <p>Web Dashboard is currently building...</p>
              </div>
            </body>
          </html>
        `);
      }
    });
  });

  return app;
}

function startServer(port = 20129, host = '0.0.0.0') {
  const app = createApp();
  return new Promise((resolve, reject) => {
    const listenArgs = host === '0.0.0.0' ? [port] : [port, host];
    const server = app.listen(...listenArgs, () => {
      console.log(`\n🚀 Brakthroonam Router is running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
      console.log(`📡 OpenAI-Compatible API: http://localhost:${port}/v1`);
      console.log(`🌐 Dashboard: http://localhost:${port}\n`);

      // Khoi dong MITM Proxy cong 443 neu da duoc nguoi dung cau hinh hosts truoc do
      try {
        if (antigravityMitmService.isHostsConfigured()) {
          antigravityMitmService.startMitmServer();
        }
      } catch (err) {
        console.warn('[Brakthroonam Router] Warning starting MITM background:', err.message);
      }

      resolve(server);
    });
    server.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  createApp,
  startServer
};
