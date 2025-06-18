import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Space, Typography, Progress, Tag, Select, Divider } from 'antd'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StepForwardOutlined,
  StepBackwardOutlined,
  EyeOutlined,
  ExpandOutlined,
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
  
  // 图片编辑相关状态
  const [imageEditorVisible, setImageEditorVisible] = useState(false)

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
    const baseTransforms = []
    
    // Ken Burns 效果
    if (effects.kenBurns) {
      baseTransforms.push('scale(1.05)')
    }

    if (!isTransitioning) {
      return { 
        opacity: 1, 
        zIndex: 2,
        transform: baseTransforms.join(' ') || 'none'
      }
    }

    const isReverse = transitionDirection === 'prev'
    const additionalTransforms = [...baseTransforms]

    switch (effects.transition) {
      case 'fade':
        return {
          opacity: 1 - transitionProgress,
          zIndex: 2,
          transform: additionalTransforms.join(' ') || 'none'
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
          transform: additionalTransforms.join(' ') || 'none'
        }
    }
  }

  const getNextPhotoStyle = () => {
    const isReverse = transitionDirection === 'prev'
    
    switch (effects.transition) {
      case 'fade':
        return {
          opacity: transitionProgress,
          zIndex: 1
        }
      case 'slide':
        const slideFrom = isReverse ? -100 : 100
        return {
          transform: `translateX(${slideFrom - transitionProgress * slideFrom}%)`,
          zIndex: 1
        }
      case 'zoom':
        return {
          opacity: transitionProgress,
          transform: `scale(${1.2 - transitionProgress * 0.2})`,
          zIndex: 1
        }
      case 'rotate':
        const rotateFrom = isReverse ? 90 : -90
        return {
          opacity: transitionProgress,
          transform: `rotate(${rotateFrom + transitionProgress * -rotateFrom}deg) scale(${0.8 + transitionProgress * 0.2})`,
          zIndex: 1
        }
      default:
        return {
          opacity: transitionProgress,
          zIndex: 1
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
      style={{ height: showFinalPreview ? '500px' : '400px' }}
      bodyStyle={{ height: 'calc(100% - 57px)', padding: '16px' }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* 比例选择器/显示器 */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BorderOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: '14px', fontWeight: '500' }}>
            {showFinalPreview ? '视频比例:' : '预览比例:'}
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
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
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
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: getFilterStyle(),
                        transform: effects.kenBurns ? 'scale(1.05)' : 'scale(1)',
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

        {/* 进度条 */}
        {photos.length > 0 && (
          <div style={{ margin: '12px 0' }}>
            <Progress 
              percent={progress} 
              showInfo={false}
              strokeColor="#1890ff"
              size="small"
            />
          </div>
        )}

        {/* 编辑工具栏 */}
        {photos.length > 0 && !showFinalPreview && (
          <div style={{ margin: '12px 0', textAlign: 'center' }}>
            <Button
              icon={<ExpandOutlined />}
              onClick={() => setImageEditorVisible(true)}
              size="small"
              disabled={isTransitioning}
              type="primary"
            >
              编辑图片
            </Button>
            
            {photos.filter(p => p.isEdited).length > 0 && (
              <div style={{ marginTop: '8px' }}>
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

        {/* 控制按钮 */}
        <Space style={{ justifyContent: 'center', width: '100%' }}>
          <Button
            icon={<StepBackwardOutlined />}
            onClick={handlePrev}
            disabled={photos.length === 0 || isTransitioning}
            size="small"
          />
          <Button
            type="primary"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={togglePlay}
            disabled={photos.length === 0 || isTransitioning}
          >
            {isPlaying ? '暂停' : '播放'}
          </Button>
          <Button
            icon={<StepForwardOutlined />}
            onClick={handleNext}
            disabled={photos.length === 0 || isTransitioning}
            size="small"
          />
          <Button
            onClick={handleReset}
            disabled={photos.length === 0 || isTransitioning}
            size="small"
          >
            重置
          </Button>
        </Space>

        {/* 预览信息 */}
        {photos.length > 0 && (
          <div style={{ 
            marginTop: '12px', 
            textAlign: 'center',
            fontSize: '12px',
            color: '#666'
          }}>
            <Space split={<span>•</span>}>
              <span>转场: {effects.transition}</span>
              <span>时长: {effects.duration}s/张</span>
              {effects.filter !== 'none' && <span>滤镜: {effects.filter}</span>}
              {audioFile && <span>背景音乐: ✓</span>}
              {photos.filter(p => p.isEdited).length > 0 && (
                <span style={{ color: '#1890ff' }}>
                  已编辑 {photos.filter(p => p.isEdited).length} 张图片
                </span>
              )}
            </Space>
          </div>
        )}
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
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(0.5deg); }
          100% { transform: scale(1.05) rotate(-0.5deg); }
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

      {/* 图片编辑器弹窗 */}
      {photos.length > 0 && (
        <ImageEditor
          visible={imageEditorVisible}
          onCancel={() => setImageEditorVisible(false)}
          onConfirm={(newTransform) => {
            const currentPhoto = photos[currentIndex]
            if (!currentPhoto || !onPhotoEdit) return

            // 获取当前的宽高比
            const aspectRatio = showFinalPreview ? 
              aspectRatioOptions.find(opt => opt.value === currentAspectRatio)?.ratio || 16/9 :
              aspectRatioOptions.find(opt => opt.value === previewAspectRatio)?.ratio || 16/9

            // 调用图片编辑回调
            onPhotoEdit(currentPhoto.id, newTransform, aspectRatio)
            setImageEditorVisible(false)
          }}
          imageUrl={getCurrentPhotoUrl()}
          initialTransform={{
            scale: 1,
            rotation: 0,
            x: 0,
            y: 0
          }}
          aspectRatio={showFinalPreview ? 
            aspectRatioOptions.find(opt => opt.value === currentAspectRatio)?.ratio || 16/9 :
            aspectRatioOptions.find(opt => opt.value === previewAspectRatio)?.ratio || 16/9
          }
        />
      )}
    </Card>
  )
}

export default PreviewPanel 