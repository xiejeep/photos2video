// 视频生成工具
import { AudioUtils } from './audioUtils.js'
import { CodecDetector } from './codecDetector.js'
import { EffectsRenderer } from './effectsRenderer.js'

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
        // 匹配CSS: sepia(50%) contrast(1.2) brightness(1.1)
        for (let i = 0; i < data.length; i += 4) {
          // 先应用sepia效果 (50%)
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const sepiaR = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189) * 0.5 + r * 0.5)
          const sepiaG = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168) * 0.5 + g * 0.5)
          const sepiaB = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131) * 0.5 + b * 0.5)
          
          // 再应用对比度(1.2)和亮度(1.1)
          data[i] = Math.min(255, ((sepiaR - 128) * 1.2 + 128) * 1.1)
          data[i + 1] = Math.min(255, ((sepiaG - 128) * 1.2 + 128) * 1.1)
          data[i + 2] = Math.min(255, ((sepiaB - 128) * 1.2 + 128) * 1.1)
        }
        break
      case 'warm':
        // 匹配CSS: hue-rotate(30deg) saturate(1.3)
        for (let i = 0; i < data.length; i += 4) {
          // 简化的暖色调效果，增强红色和饱和度
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const avg = (r + g + b) / 3
          data[i] = Math.min(255, r * 1.15 + (r - avg) * 0.3)     // 增强红色
          data[i + 1] = Math.min(255, g * 1.05 + (g - avg) * 0.3) // 轻微增强绿色
          data[i + 2] = Math.min(255, b * 0.95 + (b - avg) * 0.3) // 轻微减少蓝色
        }
        break
      case 'cool':
        // 匹配CSS: hue-rotate(-30deg) saturate(1.2)
        for (let i = 0; i < data.length; i += 4) {
          // 简化的冷色调效果，增强蓝色和饱和度
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const avg = (r + g + b) / 3
          data[i] = Math.min(255, r * 0.95 + (r - avg) * 0.2)     // 轻微减少红色
          data[i + 1] = Math.min(255, g * 1.05 + (g - avg) * 0.2) // 轻微增强绿色
          data[i + 2] = Math.min(255, b * 1.2 + (b - avg) * 0.2)  // 增强蓝色
        }
        break
      case 'contrast':
        // 匹配CSS: contrast(1.5)
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * 1.5) + 128))
          data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * 1.5) + 128))
          data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * 1.5) + 128))
        }
        break
      case 'soft':
        // 匹配CSS: blur(0.5px) brightness(1.1) - 简化为亮度增强
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1)
          data[i + 1] = Math.min(255, data[i + 1] * 1.1)
          data[i + 2] = Math.min(255, data[i + 2] * 1.1)
        }
        break
      case 'vivid':
        // 匹配CSS: saturate(1.5) contrast(1.2)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const avg = (r + g + b) / 3
          
          // 增强饱和度
          let newR = r + (r - avg) * 0.5
          let newG = g + (g - avg) * 0.5
          let newB = b + (b - avg) * 0.5
          
          // 增强对比度
          newR = ((newR - 128) * 1.2) + 128
          newG = ((newG - 128) * 1.2) + 128
          newB = ((newB - 128) * 1.2) + 128
          
          data[i] = Math.min(255, Math.max(0, newR))
          data[i + 1] = Math.min(255, Math.max(0, newG))
          data[i + 2] = Math.min(255, Math.max(0, newB))
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
        
        // 重置canvas状态
        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.globalAlpha = 1
        this.ctx.filter = 'none'

        // 使用统一的图片缩放逻辑
        const displayInfo = EffectsRenderer.getContainDisplayInfo(
          img.width, 
          img.height, 
          this.canvas.width, 
          this.canvas.height
        )
        
        let drawWidth = displayInfo.width
        let drawHeight = displayInfo.height
        let drawX = displayInfo.x
        let drawY = displayInfo.y

        // 改进的Ken Burns效果，使用统一的渲染工具
        if (effects.kenBurns) {
          const scale = EffectsRenderer.getKenBurnsScale(true)
          
          const scaledWidth = drawWidth * scale
          const scaledHeight = drawHeight * scale
          drawX -= (scaledWidth - drawWidth) / 2
          drawY -= (scaledHeight - drawHeight) / 2
          drawWidth = scaledWidth
          drawHeight = scaledHeight
        }

        // 直接绘制图片 - 如果使用editedUrl，变换已经被imageProcessor预处理过了
        this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

        // 应用滤镜
        if (effects.filter && effects.filter !== 'none') {
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
          const filteredData = this.applyFilter(imageData, effects.filter)
          this.ctx.putImageData(filteredData, 0, 0)
        }

        // 应用亮度和对比度 - 使用像素级处理保证与CSS一致
        if (effects.brightness || effects.contrast) {
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
          const data = imageData.data
          const brightness = (effects.brightness || 0) / 100 // 转换为-1到1的范围
          const contrast = (effects.contrast || 0) / 100 + 1 // 转换为倍数
          
          for (let i = 0; i < data.length; i += 4) {
            // 应用对比度（以128为中心点）
            let r = ((data[i] - 128) * contrast) + 128
            let g = ((data[i + 1] - 128) * contrast) + 128
            let b = ((data[i + 2] - 128) * contrast) + 128
            
            // 应用亮度
            r += brightness * 255
            g += brightness * 255
            b += brightness * 255
            
            // 确保值在0-255范围内
            data[i] = Math.min(255, Math.max(0, r))
            data[i + 1] = Math.min(255, Math.max(0, g))
            data[i + 2] = Math.min(255, Math.max(0, b))
          }
          
          this.ctx.putImageData(imageData, 0, 0)
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

        // 绘制贴纸
        if (photo.stickers && photo.stickers.length > 0) {
          this.ctx.globalCompositeOperation = 'source-over'
          this.ctx.filter = 'none'
          
          // 计算图片在canvas中的实际显示区域，用于贴纸位置映射
          const imageDisplayInfo = { drawWidth, drawHeight, drawX, drawY }
          
          for (const sticker of photo.stickers) {
            this.drawSticker(sticker, imageDisplayInfo)
          }
        }

        resolve()
      }
      
      img.src = photo.editedUrl || photo.url
    })
  }

  // 统一的图片绘制方法 - 变换已经被imageProcessor预处理过了
  drawImageWithTransform(img, displayInfo, photo) {
    const { drawWidth, drawHeight, drawX, drawY } = displayInfo
    
    // 直接绘制图片 - editedUrl已经包含了用户的变换
    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
  }

  // 绘制单个贴纸
  drawSticker(sticker, imageDisplayInfo) {
    const { drawWidth, drawHeight, drawX, drawY } = imageDisplayInfo
    
    // 将贴纸相对位置转换为canvas绝对位置
    // 贴纸位置是相对于图片编辑器视口中心的像素偏移
    // 需要转换为相对于实际图片显示区域的位置
    
    // 编辑器视口尺寸（与ImageEditor中的固定尺寸保持一致）
    const editorWidth = 800  // ImageEditor的固定宽度
    const editorHeight = 500 // ImageEditor的固定高度
    
    // 将编辑器中的像素偏移转换为图片显示区域的绝对位置
    // 贴纸坐标系：编辑器中心为(0,0)，向右向下为正
    const stickerX = drawX + drawWidth / 2 + (sticker.x / editorWidth) * drawWidth
    const stickerY = drawY + drawHeight / 2 + (sticker.y / editorHeight) * drawHeight
    
    // 计算贴纸尺寸（基于画布尺寸，与编辑器中的计算逻辑一致）
    const baseStickerSize = Math.min(this.canvas.width, this.canvas.height) * 0.08 // 基础尺寸
    const stickerSize = baseStickerSize * (sticker.scale || 1)
    
    this.ctx.save()
    
    // 移动到贴纸中心点
    this.ctx.translate(stickerX, stickerY)
    
    // 应用旋转
    if (sticker.rotation) {
      this.ctx.rotate((sticker.rotation * Math.PI) / 180)
    }
    
    if (sticker.text) {
      // 绘制文字贴纸
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      
      // 设置字体
      // 从style中提取字体大小，如果没有则使用默认计算
      let fontSize = Math.max(12, stickerSize * 0.3)
      if (sticker.style && sticker.style.fontSize) {
        fontSize = parseInt(sticker.style.fontSize) * (sticker.scale || 1)
      }
      
      let fontStyle = ''
      
      // 从style中提取字体样式
      if (sticker.style && sticker.style.fontWeight === 'bold') fontStyle += 'bold '
      if (sticker.bold) fontStyle += 'bold '
      if (sticker.italic) fontStyle += 'italic '
      
      // 从style中提取字体系列
      const fontFamily = (sticker.style && sticker.style.fontFamily) || sticker.fontFamily || 'Arial'
      
      this.ctx.font = `${fontStyle}${fontSize}px ${fontFamily}`
      
      // 设置颜色
      const color = (sticker.style && sticker.style.color) || sticker.color || '#000000'
      this.ctx.fillStyle = color
      
      // 绘制文字效果
      if (sticker.shadow) {
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)'
        this.ctx.shadowBlur = 2
        this.ctx.shadowOffsetX = 1
        this.ctx.shadowOffsetY = 1
      }
      
      // 绘制文字
      this.ctx.fillText(sticker.content || sticker.text || sticker.emoji, 0, 0)
      
      // 绘制文字装饰
      if (sticker.underline || sticker.strikethrough) {
        const textWidth = this.ctx.measureText(sticker.content || sticker.text || sticker.emoji).width
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = Math.max(1, fontSize * 0.05)
        
        if (sticker.underline) {
          this.ctx.beginPath()
          this.ctx.moveTo(-textWidth / 2, fontSize * 0.3)
          this.ctx.lineTo(textWidth / 2, fontSize * 0.3)
          this.ctx.stroke()
        }
        
        if (sticker.strikethrough) {
          this.ctx.beginPath()
          this.ctx.moveTo(-textWidth / 2, -fontSize * 0.1)
          this.ctx.lineTo(textWidth / 2, -fontSize * 0.1)
          this.ctx.stroke()
        }
      }
      
      // 清除阴影
      this.ctx.shadowColor = 'transparent'
      this.ctx.shadowBlur = 0
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 0
      
    } else {
      // 绘制表情贴纸
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.font = `${stickerSize}px Arial`
      this.ctx.fillText(sticker.emoji, 0, 0)
    }
    
    this.ctx.restore()
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
          this.applyTransitionEffect(loadedImages.current, loadedImages.next, effects, progress, currentPhoto, nextPhoto)
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
  applyTransitionEffect(currentImg, nextImg, effects, progress, currentPhoto, nextPhoto) {
    // 清空画布
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // 计算图片尺寸和位置 - 使用统一的缩放逻辑
    const getImageDrawInfo = (img) => {
      const displayInfo = EffectsRenderer.getContainDisplayInfo(
        img.width, 
        img.height, 
        this.canvas.width, 
        this.canvas.height
      )
      
      return { 
        drawWidth: displayInfo.width, 
        drawHeight: displayInfo.height, 
        drawX: displayInfo.x, 
        drawY: displayInfo.y 
      }
    }

    const currentInfo = getImageDrawInfo(currentImg)
    const nextInfo = getImageDrawInfo(nextImg)

    switch (effects.transition) {
      case 'fade':
        // 淡入淡出效果
        this.ctx.globalAlpha = 1 - progress
        this.drawImageWithTransform(currentImg, currentInfo, currentPhoto)
        
        this.ctx.globalAlpha = progress
        this.drawImageWithTransform(nextImg, nextInfo, nextPhoto)
        
        this.ctx.globalAlpha = 1
        break

      case 'slide':
        // 滑动效果
        const slideOffset = this.canvas.width * progress
        
        // 为滑动效果临时调整位置
        const currentSlideInfo = { ...currentInfo, drawX: currentInfo.drawX - slideOffset }
        const nextSlideInfo = { ...nextInfo, drawX: nextInfo.drawX + this.canvas.width - slideOffset }
        
        this.drawImageWithTransform(currentImg, currentSlideInfo, currentPhoto)
        this.drawImageWithTransform(nextImg, nextSlideInfo, nextPhoto)
        break

      case 'zoom':
        // 缩放效果
        const currentTransitionScale = 1 + progress * 0.5
        const nextTransitionScale = 0.5 + progress * 0.5
        
        // 当前图片放大
        const currentScaledWidth = currentInfo.drawWidth * currentTransitionScale
        const currentScaledHeight = currentInfo.drawHeight * currentTransitionScale
        const currentScaledX = currentInfo.drawX - (currentScaledWidth - currentInfo.drawWidth) / 2
        const currentScaledY = currentInfo.drawY - (currentScaledHeight - currentInfo.drawHeight) / 2
        
        this.ctx.globalAlpha = 1 - progress
        const currentZoomInfo = { 
          drawWidth: currentScaledWidth, 
          drawHeight: currentScaledHeight, 
          drawX: currentScaledX, 
          drawY: currentScaledY 
        }
        this.drawImageWithTransform(currentImg, currentZoomInfo, currentPhoto)
        
        // 下一张图片缩小进入
        const nextScaledWidth = nextInfo.drawWidth * nextTransitionScale
        const nextScaledHeight = nextInfo.drawHeight * nextTransitionScale
        const nextScaledX = nextInfo.drawX - (nextScaledWidth - nextInfo.drawWidth) / 2
        const nextScaledY = nextInfo.drawY - (nextScaledHeight - nextInfo.drawHeight) / 2
        
        this.ctx.globalAlpha = progress
        const nextZoomInfo = { 
          drawWidth: nextScaledWidth, 
          drawHeight: nextScaledHeight, 
          drawX: nextScaledX, 
          drawY: nextScaledY 
        }
        this.drawImageWithTransform(nextImg, nextZoomInfo, nextPhoto)
        
        this.ctx.globalAlpha = 1
        break

      case 'rotate':
        // 旋转效果 - 转场旋转，用户变换已在editedUrl中预处理
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
        this.drawImageWithTransform(currentImg, currentInfo, currentPhoto)
        
        this.ctx.globalAlpha = progress
        this.drawImageWithTransform(nextImg, nextInfo, nextPhoto)
        
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

    // 绘制转场中的贴纸
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.filter = 'none'
    
    // 绘制当前照片的贴纸（透明度递减）
    if (currentPhoto && currentPhoto.stickers && currentPhoto.stickers.length > 0) {
      this.ctx.globalAlpha = 1 - progress
      for (const sticker of currentPhoto.stickers) {
        this.drawSticker(sticker, currentInfo)
      }
    }
    
    // 绘制下一张照片的贴纸（透明度递增）
    if (nextPhoto && nextPhoto.stickers && nextPhoto.stickers.length > 0) {
      this.ctx.globalAlpha = progress
      for (const sticker of nextPhoto.stickers) {
        this.drawSticker(sticker, nextInfo)
      }
    }
    
    // 恢复透明度
    this.ctx.globalAlpha = 1
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