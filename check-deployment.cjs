#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 检查 Railway 部署准备情况...\n');

const checks = [
  {
    name: 'package.json',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return {
        valid: pkg.scripts && pkg.scripts.start && pkg.scripts.build,
        details: `start: ${pkg.scripts.start}, build: ${pkg.scripts.build}`
      };
    }
  },
  {
    name: 'production-server.cjs',
    check: () => ({
      valid: fs.existsSync('production-server.cjs'),
      details: '生产服务器文件'
    })
  },
  {
    name: 'Dockerfile',
    check: () => ({
      valid: fs.existsSync('Dockerfile'),
      details: 'Docker 配置文件'
    })
  },
  {
    name: '.dockerignore',
    check: () => ({
      valid: fs.existsSync('.dockerignore'),
      details: 'Docker 忽略文件'
    })
  },
  {
    name: 'dist 目录',
    check: () => {
      const distExists = fs.existsSync('dist');
      const indexExists = distExists && fs.existsSync('dist/index.html');
      return {
        valid: distExists && indexExists,
        details: distExists ? (indexExists ? '包含 index.html' : '缺少 index.html') : '目录不存在'
      };
    }
  },
  {
    name: 'vite.config.js',
    check: () => {
      try {
        const content = fs.readFileSync('vite.config.js', 'utf8');
        const hasBase = content.includes("base: './'");
        return {
          valid: hasBase,
          details: hasBase ? '已配置相对路径' : '需要添加 base: "./"'
        };
      } catch (error) {
        return {
          valid: false,
          details: '文件不存在或读取失败'
        };
      }
    }
  },
  {
    name: 'Express 依赖',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return {
        valid: pkg.dependencies && pkg.dependencies.express,
        details: pkg.dependencies?.express || '未安装'
      };
    }
  }
];

let allPassed = true;

checks.forEach(({ name, check }) => {
  try {
    const result = check();
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${name}: ${result.details}`);
    if (!result.valid) allPassed = false;
  } catch (error) {
    console.log(`❌ ${name}: 检查失败 - ${error.message}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 Railway 部署准备就绪！');
  console.log('\n📋 下一步：');
  console.log('1. 推送代码到 GitHub');
  console.log('2. 在 Railway 中连接仓库');
  console.log('3. 等待自动部署完成');
  console.log('\n🌐 部署后你将获得：');
  console.log('   https://你的项目名.railway.app');
} else {
  console.log('⚠️  部署准备尚未完成');
  console.log('\n🔧 请解决上述标记为 ❌ 的问题');
}

console.log('\n💡 提示：');
console.log('   - 确保先运行 npm run build');
console.log('   - 检查所有依赖是否已安装');
console.log('   - 测试本地服务器：npm start');

// 检查端口是否可用
const net = require('net');
const testPort = 3000;

const server = net.createServer();
server.listen(testPort, (err) => {
  if (err) {
    console.log(`\n⚠️  端口 ${testPort} 被占用，Railway 会自动分配端口`);
  } else {
    console.log(`\n✅ 端口 ${testPort} 可用`);
  }
  server.close();
});

server.on('error', () => {
  console.log(`\n⚠️  端口 ${testPort} 被占用，Railway 会自动分配端口`);
}); 