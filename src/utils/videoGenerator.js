// 视频生成工具
import { AudioUtils } from './audioUtils.js'
import { CodecDetector } from './codecDetector.js'

export class VideoGenerator {
  constructor() {
    this.canvas = null
    this.ctx = null
    this.mediaRecorder = null
    this.recordedChunks = []
    this.audioStream = null // 添加音频流引用
  }

  // 初始化Canvas
  initCanvas(width = 1920, height = 1080) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')
    return this.canvas
  }

  // 应用滤镜效果
  applyFilter(imageData, filter) {
    const data = imageData.data
    
    switch (filter) {
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
          data[i] = data[i + 1] = data[i + 2] = gray
        }
        break
      case 'vintage':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.2)     // 增强红色
          data[i + 1] = Math.min(255, data[i + 1] * 1.1) // 稍微增强绿色
          data[i + 2] = Math.min(255, data[i + 2] * 0.8) // 减少蓝色
        }
        break
      case 'warm':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1)     // 增强红色
          data[i + 1] = Math.min(255, data[i + 1] * 1.05) // 稍微增强绿色
        }
        break
      case 'cool':
        for (let i = 0; i < data.length; i += 4) {
          data[i + 2] = Math.min(255, data[i + 2] * 1.2) // 增强蓝色
          data[i + 1] = Math.min(255, data[i + 1] * 1.1) // 稍微增强绿色
        }
        break
    }
    
    return imageData
  }

  // 绘制单张照片到Canvas
  async drawPhoto(photo, effects, progress = 0) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // 清空画布
        this.ctx.fillStyle = '#000000'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        // 计算图片缩放和居中
        const canvasRatio = this.canvas.width / this.canvas.height
        const imgRatio = img.width / img.height
        
        let drawWidth, drawHeight, drawX, drawY
        
        if (imgRatio > canvasRatio) {
          // 图片更宽，以高度为准
          drawHeight = this.canvas.height
          drawWidth = drawHeight * imgRatio
          drawX = (this.canvas.width - drawWidth) / 2
          drawY = 0
        } else {
          // 图片更高，以宽度为准
          drawWidth = this.canvas.width
          drawHeight = drawWidth / imgRatio
          drawX = 0
          drawY = (this.canvas.height - drawHeight) / 2
        }

        // Ken Burns效果
        if (effects.kenBurns) {
          const scale = 1 + (progress * 0.1) // 逐渐放大
          const scaledWidth = drawWidth * scale
          const scaledHeight = drawHeight * scale
          drawX -= (scaledWidth - drawWidth) / 2
          drawY -= (scaledHeight - drawHeight) / 2
          drawWidth = scaledWidth
          drawHeight = scaledHeight
        }

        // 绘制图片
        this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

        // 应用滤镜
        if (effects.filter && effects.filter !== 'none') {
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
          const filteredData = this.applyFilter(imageData, effects.filter)
          this.ctx.putImageData(filteredData, 0, 0)
        }

        // 应用亮度和对比度
        if (effects.brightness || effects.contrast) {
          this.ctx.globalCompositeOperation = 'multiply'
          const brightness = 1 + (effects.brightness || 0) / 100
          const contrast = 1 + (effects.contrast || 0) / 100
          this.ctx.filter = `brightness(${brightness}) contrast(${contrast})`
        }

        // 绘制文字叠加
        if (effects.textOverlay) {
          this.ctx.globalCompositeOperation = 'source-over'
          this.ctx.filter = 'none'
          this.ctx.fillStyle = effects.textColor || '#ffffff'
          this.ctx.font = `${effects.textSize || 48}px Arial`
          this.ctx.textAlign = 'center'
          this.ctx.strokeStyle = 'rgba(0,0,0,0.5)'
          this.ctx.lineWidth = 2
          
          const x = this.canvas.width / 2
          const y = this.canvas.height - 100
          
          this.ctx.strokeText(effects.textOverlay, x, y)
          this.ctx.fillText(effects.textOverlay, x, y)
        }

        resolve()
      }
      
      img.src = photo.editedUrl || photo.url
    })
  }

  // 生成视频
  async generateVideo(photos, effects, audioFile, options = {}) {
    const {
      width = 1920,
      height = 1080,
      frameRate = 30,
      quality = 1080,
      format = 'webm',  // 新增格式参数
      aspectRatio = '16:9'  // 新增比例参数
    } = options

    this.initCanvas(width, height)
    this.recordedChunks = []

    // 获取Canvas流
    const stream = this.canvas.captureStream(frameRate)
    
    // 使用新的音频工具处理音频
    if (audioFile) {
      try {
        console.log('开始添加音频，文件信息:', audioFile);
        
        // 使用AudioUtils创建音频流
        this.audioStream = await AudioUtils.createAudioStream(
          audioFile, 
          (audioFile.volume || 50) / 100
        );
        
        // 将音频轨道添加到视频流
        this.audioStream.mediaStream.getAudioTracks().forEach(track => {
          console.log('添加音频轨道:', track);
          stream.addTrack(track);
        });
        
        console.log('音频流创建成功');
      } catch (error) {
        console.error('音频处理失败:', error);
        // 即使音频失败，也继续录制视频
      }
    }

    // 检测支持的视频格式
    const mimeType = this.getSupportedMimeType(format)
    console.log('使用视频格式:', mimeType);
    
    // 创建MediaRecorder，增加错误处理
    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: this.getBitrate(quality),
        audioBitsPerSecond: 128000 // 添加音频比特率
      })
    } catch (error) {
      console.warn('MediaRecorder创建失败，尝试不指定音频比特率:', error);
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: this.getBitrate(quality)
      })
    }

    // 处理录制数据
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data)
        console.log('录制数据块大小:', event.data.size);
      }
    }

    // 返回Promise，包含格式信息
    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        console.log('录制停止，开始清理资源');
        
        // 清理音频资源
        if (this.audioStream) {
          this.audioStream.cleanup();
          this.audioStream = null;
        }
        
        const blob = new Blob(this.recordedChunks, { type: mimeType })
        console.log('生成视频Blob，大小:', blob.size, '类型:', blob.type);
        
        // 返回包含格式信息的对象
        resolve({
          blob,
          mimeType,
          extension: this.getFileExtension(mimeType),
          actualFormat: this.getActualFormat(mimeType)
        })
      }

      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder错误:', error);
        
        // 清理音频资源
        if (this.audioStream) {
          this.audioStream.cleanup();
          this.audioStream = null;
        }
        
        reject(error)
      }

      // 开始录制
      console.log('开始录制视频');
      this.mediaRecorder.start(100) // 每100ms一个数据块

      // 生成帧序列
      this.generateFrames(photos, effects, frameRate)
        .then(() => {
          console.log('帧生成完成，准备停止录制');
          setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              this.mediaRecorder.stop()
            }
          }, 500) // 额外等待确保录制完整
        })
        .catch((error) => {
          console.error('帧生成失败:', error);
          
          // 清理音频资源
          if (this.audioStream) {
            this.audioStream.cleanup();
            this.audioStream = null;
          }
          
          reject(error)
        })
    })
  }

  // 生成帧序列
  async generateFrames(photos, effects, frameRate) {
    const duration = effects.duration * 1000 // 每张照片持续时间(毫秒)
    const frameInterval = 1000 / frameRate   // 帧间隔
    const transitionDuration = 500 // 转场时间(毫秒)
    const transitionFrames = Math.floor(transitionDuration / frameInterval)
    const photoDisplayTime = duration - transitionDuration
    const framesPerPhoto = Math.floor(photoDisplayTime / frameInterval)

    for (let photoIndex = 0; photoIndex < photos.length; photoIndex++) {
      const currentPhoto = photos[photoIndex]
      const nextPhoto = photos[photoIndex + 1]
      
      // 绘制当前照片的主要显示时间
      for (let frame = 0; frame < framesPerPhoto; frame++) {
        const progress = frame / framesPerPhoto
        await this.drawPhoto(currentPhoto, effects, progress)
        await new Promise(resolve => setTimeout(resolve, frameInterval))
      }
      
      // 如果有下一张照片，添加转场效果
      if (nextPhoto && effects.transition !== 'none') {
        for (let frame = 0; frame < transitionFrames; frame++) {
          const transitionProgress = frame / transitionFrames
          await this.drawTransition(currentPhoto, nextPhoto, effects, transitionProgress)
          await new Promise(resolve => setTimeout(resolve, frameInterval))
        }
      }
    }
  }

  // 绘制转场效果
  async drawTransition(currentPhoto, nextPhoto, effects, progress) {
    return new Promise((resolve) => {
      const loadedImages = { current: null, next: null }
      let loadCount = 0

      const checkComplete = () => {
        loadCount++
        if (loadCount === 2) {
          this.applyTransitionEffect(loadedImages.current, loadedImages.next, effects, progress)
          resolve()
        }
      }

      // 加载当前照片
      const currentImg = new Image()
      currentImg.crossOrigin = 'anonymous'
      currentImg.onload = () => {
        loadedImages.current = currentImg
        checkComplete()
      }
      currentImg.src = currentPhoto.editedUrl || currentPhoto.url

      // 加载下一张照片
      const nextImg = new Image()
      nextImg.crossOrigin = 'anonymous'
      nextImg.onload = () => {
        loadedImages.next = nextImg
        checkComplete()
      }
      nextImg.src = nextPhoto.editedUrl || nextPhoto.url
    })
  }

  // 应用转场效果
  applyTransitionEffect(currentImg, nextImg, effects, progress) {
    // 清空画布
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 计算图片尺寸和位置
    const getImageDrawInfo = (img) => {
      const canvasRatio = this.canvas.width / this.canvas.height
      const imgRatio = img.width / img.height
      
      let drawWidth, drawHeight, drawX, drawY
      
      if (imgRatio > canvasRatio) {
        drawHeight = this.canvas.height
        drawWidth = drawHeight * imgRatio
        drawX = (this.canvas.width - drawWidth) / 2
        drawY = 0
      } else {
        drawWidth = this.canvas.width
        drawHeight = drawWidth / imgRatio
        drawX = 0
        drawY = (this.canvas.height - drawHeight) / 2
      }
      
      return { drawWidth, drawHeight, drawX, drawY }
    }

    const currentInfo = getImageDrawInfo(currentImg)
    const nextInfo = getImageDrawInfo(nextImg)

    switch (effects.transition) {
      case 'fade':
        // 淡入淡出效果
        this.ctx.globalAlpha = 1 - progress
        this.ctx.drawImage(currentImg, currentInfo.drawX, currentInfo.drawY, currentInfo.drawWidth, currentInfo.drawHeight)
        
        this.ctx.globalAlpha = progress
        this.ctx.drawImage(nextImg, nextInfo.drawX, nextInfo.drawY, nextInfo.drawWidth, nextInfo.drawHeight)
        
        this.ctx.globalAlpha = 1
        break

      case 'slide':
        // 滑动效果
        const slideOffset = this.canvas.width * progress
        
        this.ctx.drawImage(currentImg, currentInfo.drawX - slideOffset, currentInfo.drawY, currentInfo.drawWidth, currentInfo.drawHeight)
        this.ctx.drawImage(nextImg, nextInfo.drawX + this.canvas.width - slideOffset, nextInfo.drawY, nextInfo.drawWidth, nextInfo.drawHeight)
        break

      case 'zoom':
        // 缩放效果
        const currentScale = 1 + progress * 0.5
        const nextScale = 0.5 + progress * 0.5
        
        // 当前图片放大
        const currentScaledWidth = currentInfo.drawWidth * currentScale
        const currentScaledHeight = currentInfo.drawHeight * currentScale
        const currentScaledX = currentInfo.drawX - (currentScaledWidth - currentInfo.drawWidth) / 2
        const currentScaledY = currentInfo.drawY - (currentScaledHeight - currentInfo.drawHeight) / 2
        
        this.ctx.globalAlpha = 1 - progress
        this.ctx.drawImage(currentImg, currentScaledX, currentScaledY, currentScaledWidth, currentScaledHeight)
        
        // 下一张图片缩小进入
        const nextScaledWidth = nextInfo.drawWidth * nextScale
        const nextScaledHeight = nextInfo.drawHeight * nextScale
        const nextScaledX = nextInfo.drawX - (nextScaledWidth - nextInfo.drawWidth) / 2
        const nextScaledY = nextInfo.drawY - (nextScaledHeight - nextInfo.drawHeight) / 2
        
        this.ctx.globalAlpha = progress
        this.ctx.drawImage(nextImg, nextScaledX, nextScaledY, nextScaledWidth, nextScaledHeight)
        
        this.ctx.globalAlpha = 1
        break

      case 'rotate':
        // 旋转效果
        this.ctx.save()
        
        // 当前图片旋转消失
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2)
        this.ctx.rotate(progress * Math.PI / 4)
        this.ctx.globalAlpha = 1 - progress
        this.ctx.drawImage(currentImg, 
          currentInfo.drawX - this.canvas.width / 2, 
          currentInfo.drawY - this.canvas.height / 2, 
          currentInfo.drawWidth, 
          currentInfo.drawHeight)
        
        this.ctx.restore()
        this.ctx.save()
        
        // 下一张图片旋转进入
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2)
        this.ctx.rotate((1 - progress) * Math.PI / 4)
        this.ctx.globalAlpha = progress
        this.ctx.drawImage(nextImg, 
          nextInfo.drawX - this.canvas.width / 2, 
          nextInfo.drawY - this.canvas.height / 2, 
          nextInfo.drawWidth, 
          nextInfo.drawHeight)
        
        this.ctx.restore()
        break

      default:
        // 默认淡入淡出
        this.ctx.globalAlpha = 1 - progress
        this.ctx.drawImage(currentImg, currentInfo.drawX, currentInfo.drawY, currentInfo.drawWidth, currentInfo.drawHeight)
        
        this.ctx.globalAlpha = progress
        this.ctx.drawImage(nextImg, nextInfo.drawX, nextInfo.drawY, nextInfo.drawWidth, nextInfo.drawHeight)
        
        this.ctx.globalAlpha = 1
        break
    }

    // 应用滤镜效果到整个画布
    if (effects.filter && effects.filter !== 'none') {
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      const filteredData = this.applyFilter(imageData, effects.filter)
      this.ctx.putImageData(filteredData, 0, 0)
    }

    // 添加文字叠加
    if (effects.textOverlay) {
      this.ctx.globalCompositeOperation = 'source-over'
      this.ctx.fillStyle = effects.textColor || '#ffffff'
      this.ctx.font = `${effects.textSize || 48}px Arial`
      this.ctx.textAlign = 'center'
      this.ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      this.ctx.lineWidth = 2
      
      const x = this.canvas.width / 2
      const y = this.canvas.height - 100
      
      this.ctx.strokeText(effects.textOverlay, x, y)
      this.ctx.fillText(effects.textOverlay, x, y)
    }
  }

  // 获取支持的MIME类型（增强版）
  getSupportedMimeType(preferredFormat = 'webm') {
    // 输出诊断信息（仅在开发模式或首次运行时）
    if (!window.codecDiagnosticLogged) {
      console.log('🔍 开始编解码器诊断...')
      CodecDetector.logDiagnostics()
      window.codecDiagnosticLogged = true
    }
    
    // 根据用户选择的格式定义优先级
    let formatPriority = []
    
    switch (preferredFormat) {
      case 'mp4':
        formatPriority = [
          // 尝试多种MP4编解码器组合
          'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
          'video/mp4;codecs="avc1.42E01E"',
          'video/mp4;codecs="avc1.420028"',
          'video/mp4;codecs="avc1.42001E"',
          'video/mp4;codecs="h264,aac"',
          'video/mp4;codecs="h264"',
          'video/mp4',
          // 如果MP4不行，降级到WebM
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,vorbis',
          'video/webm'
        ]
        break
      case 'mov':
        formatPriority = [
          // MOV通常使用MP4容器
          'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
          'video/mp4;codecs="avc1.42E01E"',
          'video/mp4',
          'video/webm;codecs=vp9,opus',
          'video/webm'
        ]
        break
      case 'webm':
      default:
        formatPriority = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,vorbis',
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          // 作为备用的MP4
          'video/mp4'
        ]
        break
    }
    
    // 找到第一个支持的格式，并记录结果
    for (const type of formatPriority) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`✅ 选择了支持的格式: ${type}`)
        
        // 如果用户要求MP4但得到WebM，发出警告
        if (preferredFormat === 'mp4' && type.includes('webm')) {
          console.warn(`⚠️ 用户请求MP4格式，但降级为: ${type}`)
          console.warn('💡 这可能是因为Electron版本不支持H.264编解码器')
        }
        
        return type
      }
    }
    
    // 最后的备用方案
    console.warn('⚠️ 使用最后的备用方案: video/webm')
    return 'video/webm'
  }

  // 根据MIME类型获取文件扩展名
  getFileExtension(mimeType) {
    if (mimeType.includes('mp4')) return 'mp4'
    if (mimeType.includes('webm')) return 'webm'
    if (mimeType.includes('ogg')) return 'ogv'
    return 'webm' // 默认
  }

  // 获取实际格式名称
  getActualFormat(mimeType) {
    if (mimeType.includes('mp4')) return 'MP4'
    if (mimeType.includes('webm')) return 'WebM'
    if (mimeType.includes('ogg')) return 'OGV'
    return 'WebM'
  }

  // 获取比特率
  getBitrate(quality) {
    const bitrates = {
      '720p': 2000000,   // 2Mbps
      '1080p': 4000000,  // 4Mbps
      '1440p': 8000000,  // 8Mbps
      '2160p': 16000000  // 16Mbps
    }
    
    return bitrates[quality] || bitrates['1080p']
  }

  // 下载生成的视频
  downloadVideo(videoResult, baseFilename = 'album') {
    const { blob, extension, actualFormat } = videoResult
    const filename = `${baseFilename}.${extension}`
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    return { filename, actualFormat }
  }
} 