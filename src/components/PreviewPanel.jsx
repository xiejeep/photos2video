import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Space, Typography, Progress, Tag, Select, Divider } from 'antd'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StepForwardOutlined,
  StepBackwardOutlined,
  EyeOutlined,
  BorderOutlined,
  EditOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  UndoOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons'
import ImageEditor from './ImageEditor'

const { Text } = Typography

const PreviewPanel = ({ 
  photos = [], 
  effects, 
  audioFile, 
  showFinalPreview = false, 
  onAspectRatioChange, 
  currentAspectRatio = '16:9',
  onPhotoEdit  // 新增图片编辑回调
}) => {

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)
  const [transitionDirection, setTransitionDirection] = useState('next')
  const [previewAspectRatio, setPreviewAspectRatio] = useState('16:9')
  
  // 图片编辑相关状态 - 始终显示
  const imageEditorVisible = true

  const intervalRef = useRef(null)
  const transitionIntervalRef = useRef(null)
  const canvasRef = useRef(null)

  const totalDuration = photos.length * effects.duration * 1000 // 毫秒

  // 比例选项
  const aspectRatioOptions = [
    { label: '16:9 宽屏', value: '16:9', ratio: 16/9 },
    { label: '4:3 传统', value: '4:3', ratio: 4/3 },
    { label: '1:1 正方形', value: '1:1', ratio: 1 },
    { label: '9:16 竖屏', value: '9:16', ratio: 9/16 },
    { label: '21:9 超宽', value: '21:9', ratio: 21/9 },
    { label: '3:2 摄影', value: '3:2', ratio: 3/2 }
  ]

  // 获取当前比例的样式
  const getAspectRatioStyle = () => {
    // 在最终预览时使用传入的比例，否则使用本地状态的比例
    const activeRatio = showFinalPreview ? currentAspectRatio : previewAspectRatio
    const option = aspectRatioOptions.find(opt => opt.value === activeRatio)
    const ratio = option?.ratio || 16/9
    
    // 计算预览区域的最大尺寸
    const maxWidth = 400
    const maxHeight = 250
    
    let width, height
    if (ratio > maxWidth / maxHeight) {
      // 宽度受限
      width = maxWidth
      height = maxWidth / ratio
    } else {
      // 高度受限
      height = maxHeight
      width = maxHeight * ratio
    }
    
    return {
      width: `${width}px`,
      height: `${height}px`,
      aspectRatio: `${ratio}`,
      border: '2px solid #1890ff',
      borderRadius: '4px'
    }
  }

  // 处理比例变化
  const handleAspectRatioChange = (value) => {
    setPreviewAspectRatio(value)
    // 如果有回调函数，通知父组件
    if (onAspectRatioChange) {
      onAspectRatioChange(value)
    }
  }

  useEffect(() => {
    if (isPlaying && photos.length > 0) {
      const photoDuration = effects.duration * 1000 // 每张照片的显示时长
      const transitionDuration = 500 // 转场时长
      const displayDuration = Math.max(photoDuration - transitionDuration, 1000) // 确保至少1秒显示时间

      let playTimeout
      
      const startNextCycle = () => {
        playTimeout = setTimeout(() => {
          if (photos.length > 1 && effects.transition !== 'none') {
            // 开始转场
            setTransitionDirection('next')
            setIsTransitioning(true)
            startTransition()
          } else {
            // 没有转场，直接切换到下一张
            moveToNext()
            startNextCycle() // 继续下一个循环
          }
        }, displayDuration)
      }

      const startTransition = () => {
        const transitionFrameRate = 30 // 转场帧率
        const transitionFrameInterval = 1000 / transitionFrameRate
        const totalTransitionFrames = Math.floor(transitionDuration / transitionFrameInterval)
        let currentFrame = 0

        transitionIntervalRef.current = setInterval(() => {
          currentFrame++
          const progress = Math.min(currentFrame / totalTransitionFrames, 1)
          setTransitionProgress(progress)

          if (progress >= 1) {
            // 转场完成
            clearInterval(transitionIntervalRef.current)
            setIsTransitioning(false)
            setTransitionProgress(0)
            moveToNext()
            startNextCycle() // 继续下一个循环
          }
        }, transitionFrameInterval)
      }

      const moveToNext = () => {
        setCurrentIndex(prev => {
          const next = (prev + 1) % photos.length
          return next
        })
        
        setProgress(prev => {
          const newProgress = prev + (100 / photos.length)
          if (newProgress >= 100) {
            setIsPlaying(false)
            return 0
          }
          return newProgress
        })
      }

      // 开始第一个循环
      startNextCycle()

      return () => {
        if (playTimeout) {
          clearTimeout(playTimeout)
        }
        if (transitionIntervalRef.current) {
          clearInterval(transitionIntervalRef.current)
        }
      }
    } else {
      // 停止播放时清理转场状态
      setIsTransitioning(false)
      setTransitionProgress(0)
      if (transitionIntervalRef.current) {
        clearInterval(transitionIntervalRef.current)
      }
    }
  }, [isPlaying, photos.length, effects.duration, effects.transition])



  const togglePlay = () => {
    if (photos.length === 0) return
    
    if (!isPlaying && progress >= 100) {
      setProgress(0)
      setCurrentIndex(0)
    }
    
    setIsPlaying(!isPlaying)
  }

  const handleNext = () => {
    if (photos.length === 0 || isTransitioning) return
    
    // 停止自动播放
    setIsPlaying(false)
    
    if (photos.length > 1 && effects.transition !== 'none') {
      // 开始手动转场到下一张
      startManualTransition('next')
    } else {
      // 直接切换
      setCurrentIndex((currentIndex + 1) % photos.length)
    }
  }

  const handlePrev = () => {
    if (photos.length === 0 || isTransitioning) return
    
    // 停止自动播放
    setIsPlaying(false)
    
    if (photos.length > 1 && effects.transition !== 'none') {
      // 开始手动转场到上一张
      startManualTransition('prev')
    } else {
      // 直接切换
      setCurrentIndex((currentIndex - 1 + photos.length) % photos.length)
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setProgress(0)
    setIsPlaying(false)
    setIsTransitioning(false)
    setTransitionProgress(0)
    setTransitionDirection('next')
  }

  const startManualTransition = (direction) => {
    setTransitionDirection(direction)
    setIsTransitioning(true)
    
    const transitionDuration = 500
    const transitionFrameRate = 30
    const transitionFrameInterval = 1000 / transitionFrameRate
    const totalTransitionFrames = Math.floor(transitionDuration / transitionFrameInterval)
    let currentFrame = 0

    transitionIntervalRef.current = setInterval(() => {
      currentFrame++
      const progress = Math.min(currentFrame / totalTransitionFrames, 1)
      setTransitionProgress(progress)

      if (progress >= 1) {
        // 转场完成
        clearInterval(transitionIntervalRef.current)
        setIsTransitioning(false)
        setTransitionProgress(0)
        
        // 切换到目标照片
        if (direction === 'next') {
          setCurrentIndex((currentIndex + 1) % photos.length)
        } else {
          setCurrentIndex((currentIndex - 1 + photos.length) % photos.length)
        }
      }
    }, transitionFrameInterval)
  }

  const getCurrentPhotoStyle = () => {
    // 如果启用了Ken Burns效果，不设置transform（由CSS动画控制）
    if (effects.kenBurns && !isTransitioning) {
      return { 
        opacity: 1, 
        zIndex: 2
        // transform 由kenBurns动画控制
      }
    }

    const baseTransforms = ['translate(-50%, -50%)'] // 始终保持居中

    if (!isTransitioning) {
      return { 
        opacity: 1, 
        zIndex: 2,
        transform: baseTransforms.join(' ')
      }
    }

    // 如果启用了Ken Burns效果，转场期间也交给CSS动画处理
    if (effects.kenBurns) {
      switch (effects.transition) {
        case 'fade':
          return {
            opacity: 1 - transitionProgress,
            zIndex: 2
            // transform 由kenBurns动画控制
          }
        default:
          return {
            opacity: 1 - transitionProgress,
            zIndex: 2
            // transform 由kenBurns动画控制
          }
      }
    }

    const isReverse = transitionDirection === 'prev'
    const additionalTransforms = [...baseTransforms]

    switch (effects.transition) {
      case 'fade':
        return {
          opacity: 1 - transitionProgress,
          zIndex: 2,
          transform: additionalTransforms.join(' ')
        }
      case 'slide':
        const slideTo = isReverse ? 100 : -100
        additionalTransforms.push(`translateX(${transitionProgress * slideTo}%)`)
        return {
          transform: additionalTransforms.join(' '),
          zIndex: 2
        }
      case 'zoom':
        additionalTransforms.push(`scale(${1 + transitionProgress * 0.2})`)
        return {
          opacity: 1 - transitionProgress,
          transform: additionalTransforms.join(' '),
          zIndex: 2
        }
      case 'rotate':
        const rotateTo = isReverse ? -90 : 90
        additionalTransforms.push(`rotate(${transitionProgress * rotateTo}deg)`)
        additionalTransforms.push(`scale(${1 - transitionProgress * 0.2})`)
        return {
          opacity: 1 - transitionProgress,
          transform: additionalTransforms.join(' '),
          zIndex: 2
        }
      default:
        return {
          opacity: 1 - transitionProgress,
          zIndex: 2,
          transform: additionalTransforms.join(' ')
        }
    }
  }

  const getNextPhotoStyle = () => {
    // 如果启用了Ken Burns效果，交给CSS动画处理
    if (effects.kenBurns) {
      switch (effects.transition) {
        case 'fade':
          return {
            opacity: transitionProgress,
            zIndex: 1
            // transform 由kenBurns动画控制
          }
        default:
          return {
            opacity: transitionProgress,
            zIndex: 1
            // transform 由kenBurns动画控制
          }
      }
    }

    const isReverse = transitionDirection === 'prev'
    const baseTransforms = ['translate(-50%, -50%)'] // 始终保持居中
    
    switch (effects.transition) {
      case 'fade':
        return {
          opacity: transitionProgress,
          zIndex: 1,
          transform: baseTransforms.join(' ')
        }
      case 'slide':
        const slideFrom = isReverse ? -100 : 100
        baseTransforms.push(`translateX(${slideFrom - transitionProgress * slideFrom}%)`)
        return {
          transform: baseTransforms.join(' '),
          zIndex: 1
        }
      case 'zoom':
        baseTransforms.push(`scale(${1.2 - transitionProgress * 0.2})`)
        return {
          opacity: transitionProgress,
          transform: baseTransforms.join(' '),
          zIndex: 1
        }
      case 'rotate':
        const rotateFrom = isReverse ? 90 : -90
        baseTransforms.push(`rotate(${rotateFrom + transitionProgress * -rotateFrom}deg)`)
        baseTransforms.push(`scale(${0.8 + transitionProgress * 0.2})`)
        return {
          opacity: transitionProgress,
          transform: baseTransforms.join(' '),
          zIndex: 1
        }
      default:
        return {
          opacity: transitionProgress,
          zIndex: 1,
          transform: baseTransforms.join(' ')
        }
    }
  }

  const getFilterStyle = () => {
    const filters = []
    
    if (effects.brightness) {
      filters.push(`brightness(${1 + effects.brightness / 100})`)
    }
    
    if (effects.contrast) {
      filters.push(`contrast(${1 + effects.contrast / 100})`)
    }

    switch (effects.filter) {
      case 'grayscale':
        filters.push('grayscale(100%)')
        break
      case 'vintage':
        filters.push('sepia(50%) contrast(1.2) brightness(1.1)')
        break
      case 'warm':
        filters.push('hue-rotate(30deg) saturate(1.3)')
        break
      case 'cool':
        filters.push('hue-rotate(-30deg) saturate(1.2)')
        break
      case 'contrast':
        filters.push('contrast(1.5)')
        break
      case 'soft':
        filters.push('blur(0.5px) brightness(1.1)')
        break
      case 'vivid':
        filters.push('saturate(1.5) contrast(1.2)')
        break
    }

    return filters.length > 0 ? filters.join(' ') : 'none'
  }

  // 获取当前照片的显示URL（优先使用编辑后的图片）
  const getCurrentPhotoUrl = () => {
    const currentPhoto = photos[currentIndex]
    if (!currentPhoto) return null
    return currentPhoto.editedUrl || currentPhoto.url
  }

  // 获取当前照片的原始URL（用于编辑器）
  const getCurrentPhotoOriginalUrl = () => {
    const currentPhoto = photos[currentIndex]
    if (!currentPhoto) return null
    return currentPhoto.url // 始终返回原始图片
  }

  // 获取目标照片的显示URL
  const getTargetPhotoUrl = (targetIndex) => {
    const targetPhoto = photos[targetIndex]
    if (!targetPhoto) return null
    return targetPhoto.editedUrl || targetPhoto.url
  }

  const currentPhoto = photos[currentIndex]

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EyeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>{showFinalPreview ? '最终预览' : '实时预览'}</span>
          </div>
          {photos.length > 0 && (
            <Space>
              <Tag color="blue">
                {currentIndex + 1} / {photos.length}
              </Tag>
              <Tag color="green">
                {(photos.length * effects.duration).toFixed(1)}s
              </Tag>
            </Space>
          )}
        </div>
      }
      style={{ height: 'auto', border: 'none' }}
      bodyStyle={{ padding: '0' }}
    >
      <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
        
        {/* 左侧：预览区域 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
          
          {/* 比例选择器/显示器 */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BorderOutlined style={{ color: '#1890ff' }} />
            <Text style={{ fontSize: '14px', fontWeight: '500' }}>
              { '视频比例:'}
            </Text>
            {!showFinalPreview ? (
              <>
                <Select
                  value={previewAspectRatio}
                  onChange={handleAspectRatioChange}
                  size="small"
                  style={{ width: '120px' }}
                >
                  {aspectRatioOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
                <Tag color="blue" style={{ fontSize: '11px' }}>
                  {aspectRatioOptions.find(opt => opt.value === previewAspectRatio)?.value}
                </Tag>
              </>
            ) : (
              <>
                <Text strong style={{ fontSize: '14px' }}>
                  {aspectRatioOptions.find(opt => opt.value === currentAspectRatio)?.label || currentAspectRatio}
                </Text>
                <Tag color="green" style={{ fontSize: '11px' }}>
                  {currentAspectRatio}
                </Tag>
              </>
            )}
          </div>

          {/* 预览区域 */}
          <div 
            className="preview-area"
            style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              minHeight: '250px',
              background: '#f5f5f5',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {photos.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666' }}>
                <EyeOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <Text type="secondary">选择照片后可在此预览效果</Text>
              </div>
            ) : (
              <>
                {/* 比例预览容器 */}
                <div
                  style={{
                    ...getAspectRatioStyle(),
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'none'
                  }}
                >

                  {/* 当前照片 */}
                  {photos[currentIndex] ? (
                    <img
                      key={`current-${currentIndex}`}
                      src={getCurrentPhotoUrl()}
                      alt={`照片 ${currentIndex + 1}`}
                                            style={{
                        position: 'absolute',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        left: '50%',
                        top: '50%',
                        objectFit: 'contain',
                        filter: getFilterStyle(),
                        animation: effects.kenBurns ? 'kenBurns 4s ease-in-out infinite alternate' : 'none',
                        userSelect: 'none',

                        ...getCurrentPhotoStyle()
                      }}

                      draggable={false}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f0f0f0',
                        color: '#999',
                        fontSize: '14px'
                      }}
                    >
                      暂无图片
                    </div>
                  )}

                  {/* 目标照片（转场时显示） */}
                  {isTransitioning && photos.length > 1 && (() => {
                    const targetIndex = transitionDirection === 'next' 
                      ? (currentIndex + 1) % photos.length 
                      : (currentIndex - 1 + photos.length) % photos.length
                    
                    return (
                      <img
                        key={`target-${targetIndex}`}
                        src={getTargetPhotoUrl(targetIndex)}
                        alt={`照片 ${targetIndex + 1}`}
                                                style={{
                          position: 'absolute',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          left: '50%',
                          top: '50%',
                          objectFit: 'contain',
                          filter: getFilterStyle(),
                          // 转场图片也需要考虑Ken Burns效果
                          animation: effects.kenBurns ? 'kenBurns 4s ease-in-out infinite alternate' : 'none',
                          ...getNextPhotoStyle()
                        }}
                        draggable={false}
                      />
                    )
                  })()}

                  {/* 文字叠加 */}
                  {effects.textOverlay && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: effects.textPosition === 'top' ? '10%' : 
                             effects.textPosition === 'center' ? '50%' : '90%',
                        transform: 'translate(-50%, -50%)',
                        color: effects.textColor || '#ffffff',
                        fontSize: `${effects.textSize || 24}px`,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        whiteSpace: 'pre-line',
                        maxWidth: '80%',
                        zIndex: 10
                      }}
                    >
                      {effects.textOverlay}
                    </div>
                  )}

                  {/* 播放状态指示 */}
                  {isPlaying && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {isTransitioning ? `转场中 ${transitionDirection === 'next' ? '→' : '←'} (${Math.round(transitionProgress * 100)}%)` : '播放中...'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 右侧：控制面板 */}
        <div style={{ 
          width: '200px', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '0 8px 8px 0'
        }}>
          
          {/* 进度条 */}
          {photos.length > 0 && (
            <div>
              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>播放进度</Text>
              <Progress 
                percent={progress} 
                showInfo={false}
                strokeColor="#1890ff"
                size="small"
              />
            </div>
          )}

          {/* 控制按钮 */}
          {photos.length > 0 && (
            <div>
              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>播放控制</Text>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Button
                  type="primary"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlay}
                  disabled={photos.length === 0 || isTransitioning}
                  style={{ width: '100%' }}
                >
                  {isPlaying ? '暂停' : '播放'}
                </Button>
                
                <Space style={{ width: '100%' }}>
                  <Button
                    icon={<StepBackwardOutlined />}
                    onClick={handlePrev}
                    disabled={photos.length === 0 || isTransitioning}
                    size="small"
                    style={{ flex: 1 }}
                  />
                  <Button
                    icon={<StepForwardOutlined />}
                    onClick={handleNext}
                    disabled={photos.length === 0 || isTransitioning}
                    size="small"
                    style={{ flex: 1 }}
                  />
                </Space>
                
                <Button
                  onClick={handleReset}
                  disabled={photos.length === 0 || isTransitioning}
                  size="small"
                  style={{ width: '100%' }}
                >
                  重置
                </Button>
              </Space>
            </div>
          )}

          {/* 编辑状态 */}
          {photos.length > 0 && !showFinalPreview && (
            <div>
              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>图片编辑</Text>
              
              {photos.filter(p => p.isEdited).length > 0 && (
                <div style={{ textAlign: 'center', padding: '8px', background: '#f0f8ff', borderRadius: '4px' }}>
                  <Text 
                    type="secondary" 
                    style={{ fontSize: '11px' }}
                  >
                    已编辑 {photos.filter(p => p.isEdited).length} 张图片
                  </Text>
                </div>
              )}
            </div>
          )}

          {/* 预览信息 */}
          {photos.length > 0 && (
            <div>
              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>当前设置</Text>
              <div style={{ 
                fontSize: '11px',
                color: '#666',
                lineHeight: '1.4'
              }}>
                <div>转场: {effects.transition}</div>
                <div>时长: {effects.duration}s/张</div>
                {effects.filter !== 'none' && <div>滤镜: {effects.filter}</div>}
                {audioFile && <div style={{ color: '#52c41a' }}>背景音乐: ✓</div>}
                {effects.textOverlay && <div>文字叠加: ✓</div>}
                {effects.kenBurns && <div>Ken Burns: ✓</div>}
                {effects.flip3D && <div>3D翻转: ✓</div>}
                {photos.filter(p => p.hasStickers).length > 0 && (
                  <div style={{ color: '#fa8c16' }}>
                    贴纸装饰: {photos.filter(p => p.hasStickers).length} 张
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS 动画 */}
      <style jsx>{`
        .photo-transition {
          transition: all 0.5s ease-in-out;
        }
        
        .fade-transition {
          transition: opacity 0.5s ease-in-out;
        }
        
        .slide-transition {
          transition: transform 0.5s ease-in-out;
        }
        
        .zoom-transition {
          transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
        }
        
        @keyframes kenBurns {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          50% { transform: translate(-50%, -50%) scale(1.1) rotate(0.5deg); }
          100% { transform: translate(-50%, -50%) scale(1.05) rotate(-0.5deg); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes zoomIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes rotateIn {
          from { transform: rotate(45deg) scale(0.5); opacity: 0; }
          to { transform: rotate(0deg) scale(1); opacity: 1; }
        }
      `}</style>

      {/* 图片编辑器 - 直接集成在下方 */}
      {photos.length > 0 && !showFinalPreview && (
        <ImageEditor
          visible={imageEditorVisible}
          onCancel={() => {}} // 不需要关闭功能
          onConfirm={(result) => {
            const currentPhoto = photos[currentIndex]
            if (!currentPhoto || !onPhotoEdit) return

            // 获取当前的宽高比
            const aspectRatio = aspectRatioOptions.find(opt => opt.value === previewAspectRatio)?.ratio || 16/9

            // 调用图片编辑回调，传递完整的编辑结果
            onPhotoEdit(currentPhoto.id, result.transform, aspectRatio, result)
            // 不关闭编辑器，让用户可以继续编辑其他图片
          }}
          imageUrl={getCurrentPhotoOriginalUrl()}
          initialTransform={photos[currentIndex]?.transform || {
            scale: 1,
            rotation: 0,
            x: 0,
            y: 0
          }}
          aspectRatio={aspectRatioOptions.find(opt => opt.value === previewAspectRatio)?.ratio || 16/9}
          photos={photos}
          currentPhotoId={photos[currentIndex]?.id}
          onStickerApply={(stickers, targetPhotoIds) => {
            // 处理贴纸应用到多张图片
            if (onPhotoEdit) {
              targetPhotoIds.forEach(photoId => {
                onPhotoEdit(photoId, null, null, { stickers, type: 'sticker' })
              })
            }
          }}
        />
      )}
    </Card>
  )
}

export default PreviewPanel 