// 音频工具类 - 解决 Electron 打包后的兼容性问题
export class AudioUtils {
  // 获取音频文件的正确路径
  static async getAudioPath(audioFile) {
    // 检查是否在 Electron 环境中
    const isElectron = typeof window !== 'undefined' && window.process && window.process.type;
    
    if (audioFile.type === 'preset') {
      // 预设音频文件路径处理
      if (isElectron) {
        try {
          // 使用 IPC 通信获取正确的音频路径
          const { ipcRenderer } = require('electron');
          const audioPath = await ipcRenderer.invoke('get-audio-path', audioFile.id);
          
          if (audioPath) {
            return `file://${audioPath}`;
          } else {
            console.warn('未找到音频文件，使用原始URL');
            return audioFile.url;
          }
        } catch (error) {
          console.warn('IPC通信失败，使用原始URL:', error);
          return audioFile.url;
        }
      } else {
        // 浏览器环境，使用相对路径
        return audioFile.url;
      }
    } else {
      // 用户上传的文件，直接返回 URL
      return audioFile.url;
    }
  }

  // 创建音频元素，优化 Electron 兼容性
  static async createAudioElement(audioFile) {
    const audioPath = await this.getAudioPath(audioFile);
    const audio = new Audio();
    
    // 设置跨域属性
    audio.crossOrigin = 'anonymous';
    
    // 在 Electron 中，可能需要特殊处理文件协议
    if (typeof window !== 'undefined' && window.process && window.process.type) {
      // Electron 环境
      if (audioFile.type === 'preset') {
        try {
          // 尝试使用 file:// 协议
          const fs = require('fs');
          const path = require('path');
          
          if (fs.existsSync(audioPath)) {
            audio.src = `file://${audioPath}`;
          } else {
            // 回退到原始路径
            audio.src = audioFile.url;
          }
        } catch (error) {
          console.warn('无法访问文件系统，使用原始路径:', error);
          audio.src = audioFile.url;
        }
      } else {
        audio.src = audioPath;
      }
    } else {
      // 浏览器环境
      audio.src = audioPath;
    }

    // 预加载音频
    audio.preload = 'auto';
    
    return new Promise((resolve, reject) => {
      const onLoad = () => {
        cleanup();
        resolve(audio);
      };
      
      const onError = (error) => {
        cleanup();
        console.warn('音频加载失败，尝试使用原始路径:', error);
        // 尝试使用原始路径作为备用方案
        const fallbackAudio = new Audio(audioFile.url);
        fallbackAudio.crossOrigin = 'anonymous';
        fallbackAudio.preload = 'auto';
        
        fallbackAudio.onloadeddata = () => resolve(fallbackAudio);
        fallbackAudio.onerror = () => reject(new Error('音频文件加载失败'));
      };
      
      const cleanup = () => {
        audio.removeEventListener('loadeddata', onLoad);
        audio.removeEventListener('error', onError);
      };
      
      audio.addEventListener('loadeddata', onLoad);
      audio.addEventListener('error', onError);
    });
  }

  // 创建音频上下文和媒体流
  static async createAudioStream(audioFile, volume = 0.7) {
    try {
      const audioElement = await this.createAudioElement(audioFile);
      
      // 设置音频属性
      audioElement.loop = true;
      audioElement.volume = volume;
      
      // 创建音频上下文
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 等待音频上下文激活
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // 创建媒体源
      const source = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();
      
      // 连接音频节点
      source.connect(destination);
      source.connect(audioContext.destination);
      
      // 开始播放音频
      await audioElement.play();
      
      return {
        audioElement,
        audioContext,
        mediaStream: destination.stream,
        cleanup: () => {
          audioElement.pause();
          audioElement.currentTime = 0;
          audioContext.close();
        }
      };
    } catch (error) {
      console.error('创建音频流失败:', error);
      throw error;
    }
  }

  // 检查音频编解码器支持
  static getSupportedAudioCodecs() {
    const audio = document.createElement('audio');
    const codecs = {
      mp3: audio.canPlayType('audio/mpeg'),
      wav: audio.canPlayType('audio/wav'),
      ogg: audio.canPlayType('audio/ogg'),
      aac: audio.canPlayType('audio/aac'),
      m4a: audio.canPlayType('audio/mp4')
    };
    
    return Object.entries(codecs)
      .filter(([_, support]) => support !== '')
      .map(([codec]) => codec);
  }

  // 检测 Electron 环境
  static isElectronEnvironment() {
    return typeof window !== 'undefined' && 
           window.process && 
           window.process.type;
  }
} 