#!/usr/bin/env node

/**
 * Windows 构建脚本
 * 
 * 由于在 macOS 上交叉编译 Windows 应用需要额外配置，
 * 这个脚本提供在 Windows 机器上执行构建的完整流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建 Windows 应用...');

// 检查是否在 Windows 环境
const isWindows = process.platform === 'win32';

if (!isWindows) {
  console.log('⚠️  当前不在 Windows 环境中');
  console.log('📋 请在 Windows 机器上执行以下步骤：');
  console.log('');
  console.log('1. 安装 Node.js (推荐 v18 或更高版本)');
  console.log('2. 安装 Python (用于原生模块编译)');
  console.log('3. 安装 Visual Studio Build Tools');
  console.log('4. 克隆项目到 Windows 机器');
  console.log('5. 运行以下命令：');
  console.log('');
  console.log('   npm install');
  console.log('   npm run electron:build:win');
  console.log('');
  console.log('如果遇到 canvas 编译问题，可以尝试：');
  console.log('   npm install --ignore-scripts');
  console.log('   npm run build');
  console.log('   npx electron-builder --win --publish=never');
  console.log('');
  
  // 创建 Windows 构建说明文件
  const instructions = `# Windows 构建说明

## 前置要求

1. **Node.js**: 安装 v18 或更高版本
   - 下载地址: https://nodejs.org/
   
2. **Python**: 安装 Python 3.x (用于原生模块编译)
   - 下载地址: https://www.python.org/downloads/
   
3. **Visual Studio Build Tools**: 安装 C++ 构建工具
   - 下载地址: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - 或者安装完整的 Visual Studio

## 构建步骤

### 方法一：标准构建
\`\`\`bash
# 1. 安装依赖
npm install

# 2. 构建应用
npm run electron:build:win
\`\`\`

### 方法二：跳过原生模块 (推荐)
如果遇到 canvas 编译问题：

\`\`\`bash
# 1. 跳过原生模块脚本安装
npm install --ignore-scripts

# 2. 构建前端代码
npm run build

# 3. 直接使用 electron-builder
npx electron-builder --win --publish=never
\`\`\`

### 方法三：仅打包目录 (测试用)
\`\`\`bash
# 构建未打包的应用目录
npx electron-builder --win --dir
\`\`\`

## 输出文件

构建完成后，Windows 应用将位于：
- \`dist-electron/\` 目录中
- 安装包通常为 \`.exe\` 文件

## 故障排除

### 如果 canvas 编译失败：
1. 确保已安装 Python 和 Visual Studio Build Tools
2. 尝试使用 \`--ignore-scripts\` 参数
3. 或者暂时移除 fabric.js 依赖

### 如果内存不足：
1. 关闭其他应用程序
2. 增加系统虚拟内存
3. 使用 \`--dir\` 参数生成未打包版本

### 如果权限问题：
1. 以管理员身份运行命令提示符
2. 或使用 PowerShell

## 验证应用

构建完成后：
1. 导入一些照片
2. 选择背景音乐
3. 生成视频并检查是否有声音
4. 确认音频修复方案是否生效
`;

  fs.writeFileSync('WINDOWS_BUILD_INSTRUCTIONS.md', instructions);
  console.log('✅ 已创建 WINDOWS_BUILD_INSTRUCTIONS.md 文件');
  console.log('');
  
  process.exit(0);
}

// Windows 环境下的构建流程
try {
  console.log('📦 安装依赖...');
  execSync('npm install --ignore-scripts', { stdio: 'inherit' });
  
  console.log('🔨 构建前端代码...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('📱 打包 Electron 应用...');
  execSync('npx electron-builder --win --publish=never', { stdio: 'inherit' });
  
  console.log('');
  console.log('🎉 Windows 应用构建完成！');
  console.log('📁 输出文件位于 dist-electron/ 目录');
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  console.log('');
  console.log('🔧 尝试故障排除方案：');
  console.log('1. 确保已安装 Python 和 Visual Studio Build Tools');
  console.log('2. 尝试运行: npm install --ignore-scripts');
  console.log('3. 或使用: npx electron-builder --win --dir (仅打包目录)');
  process.exit(1);
} 