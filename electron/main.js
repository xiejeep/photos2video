const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 开发模式检测
const isDev = process.env.NODE_ENV === 'development';

// 保持窗口对象的全局引用
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false // 允许加载本地资源
    },
    icon: path.join(__dirname, '../public/icon.png')
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // 开发模式下打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，应用和菜单栏通常保持活跃状态
  // 直到用户用Cmd + Q明确退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在macOS上，当单击dock图标且没有其他窗口打开时
  // 通常会重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 处理器 - 获取资源路径
ipcMain.handle('get-resource-path', () => {
  if (isDev) {
    return path.join(__dirname, '../public');
  } else {
    return path.join(process.resourcesPath);
  }
});

// IPC 处理器 - 检查文件是否存在
ipcMain.handle('file-exists', (event, filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('检查文件存在性失败:', error);
    return false;
  }
});

// IPC 处理器 - 获取音频文件路径
ipcMain.handle('get-audio-path', (event, audioId) => {
  const resourcePath = isDev 
    ? path.join(__dirname, '../public') 
    : process.resourcesPath;
    
  const possiblePaths = [
    path.join(resourcePath, 'audio', `${audioId}.mp3`),
    path.join(resourcePath, 'app', 'public', 'audio', `${audioId}.mp3`),
    path.join(resourcePath, 'public', 'audio', `${audioId}.mp3`)
  ];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  return null;
});

// IPC 处理器 - 保存视频文件
ipcMain.handle('save-video', async (event, videoBlob, defaultName) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存视频',
      defaultPath: defaultName,
      filters: [
        { name: '视频文件', extensions: ['mp4', 'webm', 'mov'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      const buffer = Buffer.from(videoBlob);
      fs.writeFileSync(result.filePath, buffer);
      return { success: true, filePath: result.filePath };
    }
    
    return { success: false, cancelled: true };
  } catch (error) {
    console.error('保存视频失败:', error);
    return { success: false, error: error.message };
  }
}); 