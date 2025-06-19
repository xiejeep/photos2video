#!/usr/bin/env node

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'dist')));

// 设置CORS头和缓存策略
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  // 设置正确的MIME类型
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.path.endsWith('.css')) {
    res.type('text/css');
  } else if (req.path.endsWith('.wasm')) {
    res.type('application/wasm');
  }
  
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '照片转视频工具'
  });
});

// SPA路由支持 - 所有其他路由都返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 照片转视频工具已启动');
  console.log(`📱 本地地址: http://localhost:${PORT}`);
  
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    console.log(`🌐 Railway地址: https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  } else if (process.env.RENDER_EXTERNAL_URL) {
    console.log(`🌐 Render地址: ${process.env.RENDER_EXTERNAL_URL}`);
  } else if (process.env.VERCEL_URL) {
    console.log(`🌐 Vercel地址: https://${process.env.VERCEL_URL}`);
  }
  
  console.log('✅ 服务器已就绪！');
}); 