import React, { useState, useMemo } from 'react'
import { Layout, Typography, Row, Col, Card, Steps, Button, message } from 'antd'
import { 
  PictureOutlined, 
  AudioOutlined, 
  ToolOutlined, 
  ExportOutlined 
} from '@ant-design/icons'

// 导入组件
import PhotoUploader from './components/PhotoUploader'
import PhotoGallery from './components/PhotoGallery'
import EffectsPanel from './components/EffectsPanel'
import AudioPanel from './components/AudioPanel'
import PreviewPanel from './components/PreviewPanel'
import ExportPanel from './components/ExportPanel'
import LoadingOverlay from './components/LoadingOverlay'
import ImageEditor from './components/ImageEditor'

// 导入视频生成器
import { VideoGenerator } from './utils/videoGenerator'
// 导入图片处理工具
import { processImage, releaseBlobUrl } from './utils/imageProcessor'

const { Header, Content } = Layout
const { Title, Text } = Typography

function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [photos, setPhotos] = useState([])
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [audioFile, setAudioFile] = useState(null)
  const [effects, setEffects] = useState({
    transition: 'fade',
    duration: 3,
    textOverlay: '',
    filter: 'none',
    brightness: 0,
    contrast: 0
  })
  const [previewAspectRatio, setPreviewAspectRatio] = useState('16:9')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const steps = [
    {
      title: '导入照片',
      description: '选择要制作相册的照片',
      icon: <PictureOutlined />,
    },
    {
      title: '图片编辑',
      description: '预览特效、编辑照片、添加贴纸',
      icon: <ToolOutlined />,
    },
    {
      title: '生成相册',
      description: '预览并导出视频',
      icon: <ExportOutlined />,
    },
  ]

  const handlePhotosUploaded = (newPhotos) => {
    // 额外的去重保护：基于文件名和大小去重
    const existingFiles = new Set(photos.map(p => `${p.name}_${p.size}`))
    const uniqueNewPhotos = newPhotos.filter(photo => 
      !existingFiles.has(`${photo.name}_${photo.size}`)
    )
    
    if (uniqueNewPhotos.length !== newPhotos.length) {
      message.warning(`检测到 ${newPhotos.length - uniqueNewPhotos.length} 个重复文件，已过滤`)
    }
    
    if (uniqueNewPhotos.length > 0) {
      setPhotos(prev => [...prev, ...uniqueNewPhotos])
      setSelectedPhotos(prev => [...prev, ...uniqueNewPhotos.map(photo => photo.id)])
      message.success(`成功导入 ${uniqueNewPhotos.length} 张照片`)
    }
  }

  const handleClearAllPhotos = () => {
    setPhotos([])
    setSelectedPhotos([])
    message.info('已清空所有照片')
  }

  const handlePhotoSelection = (photoIds) => {
    setSelectedPhotos(photoIds)
  }

  const handleEffectsChange = (newEffects, targetPhotoIds = null, applyScope = 'all') => {
    setEffects(prev => ({ ...prev, ...newEffects }))
    
    // 如果指定了目标照片，为这些照片应用特效
    if (targetPhotoIds && targetPhotoIds.length > 0) {
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => 
          targetPhotoIds.includes(photo.id) 
            ? { ...photo, effects: { ...photo.effects, ...newEffects } }
            : photo
        )
      )
    }
  }

  const handleAspectRatioChange = (aspectRatio) => {
    setPreviewAspectRatio(aspectRatio)
  }

  const handleAudioUpload = (file) => {
    setAudioFile(file)
    message.success('背景音乐添加成功')
  }

  // 处理图片编辑
  const handlePhotoEdit = async (photoId, transform, aspectRatio, editResult = null) => {
    // 处理图片切换操作
    if (editResult?.action === 'switchPhoto') {
      const selectedPhotoIndex = photos.filter(p => selectedPhotos.includes(p.id))
        .findIndex(p => p.id === editResult.photoId)
      if (selectedPhotoIndex !== -1) {
        setCurrentPhotoIndex(selectedPhotoIndex)
      }
      return
    }

    const photo = photos.find(p => p.id === photoId)
    if (!photo) return

    try {
      setIsLoading(true)
      setLoadingText('正在处理图片...')

      // 如果是贴纸应用操作
      if (editResult?.type === 'sticker' && editResult.stickers) {
        setPhotos(prev => prev.map(p => {
          if (p.id === photoId) {
            return {
              ...p,
              stickers: editResult.stickers,
              hasStickers: true
            }
          }
          return p
        }))
        return
      }

      // 如果有变换操作，生成编辑后的图片
      if (transform) {
        const editedUrl = await processImage(
          photo.url, 
          transform, 
          aspectRatio, 
          1920  // 输出宽度
        )

        // 更新photos数组
        setPhotos(prev => prev.map(p => {
          if (p.id === photoId) {
            // 释放之前的编辑图片
            if (p.editedUrl) {
              releaseBlobUrl(p.editedUrl)
            }
            return {
              ...p,
              editedUrl,
              isEdited: true,
              transform, // 保存变换信息
              // 保留贴纸数据和添加新的编辑结果
              stickers: editResult?.stickers || p.stickers,
              hasStickers: !!(editResult?.stickers || p.stickers)
            }
          }
          return p
        }))
      } else if (editResult?.stickers) {
        // 只有贴纸操作，不需要重新生成图片
        setPhotos(prev => prev.map(p => {
          if (p.id === photoId) {
            return {
              ...p,
              stickers: editResult.stickers,
              hasStickers: true
            }
          }
          return p
        }))
      }

      message.success('图片编辑成功')
    } catch (error) {
      console.error('图片编辑失败:', error)
      message.error(`图片编辑失败: ${error.message}`)
    } finally {
      setIsLoading(false)
      setLoadingText('')
    }
  }

  const handleStepChange = (step) => {
    if (step >= 1 && selectedPhotos.length === 0) {
      message.warning('请先选择要制作相册的照片')
      return
    }
    setCurrentStep(step)
  }

  const handleExport = async (format, quality, options = {}) => {
    if (selectedPhotos.length === 0) {
      message.error('请先选择照片')
      return
    }

    setIsLoading(true)
    setLoadingText('正在初始化视频生成器...')
    
    try {
      const videoGenerator = new VideoGenerator()
      const selectedPhotoObjects = photos.filter(photo => selectedPhotos.includes(photo.id))
      
      setLoadingText('正在渲染视频帧...')
      
      // 生成视频
      const videoResult = await videoGenerator.generateVideo(
        selectedPhotoObjects,
        effects,
        audioFile,
        {
          width: options.width || 1920,
          height: options.height || 1080,
          frameRate: options.frameRate || 30,
          quality: quality,
          format: format,  // 传递用户选择的格式
          aspectRatio: options.aspectRatio || '16:9'  // 传递比例参数
        }
      )
      
      setLoadingText('正在准备下载...')
      
      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const baseFilename = `电子相册_${timestamp}`
      
      // 下载视频
      const downloadResult = videoGenerator.downloadVideo(videoResult, baseFilename)
      
      // 显示实际生成的格式
      if (format !== videoResult.actualFormat.toLowerCase()) {
        message.warning(`请求格式 ${format.toUpperCase()}，但浏览器只支持 ${videoResult.actualFormat}，已生成 ${downloadResult.filename}`)
      } else {
        message.success(`电子相册生成成功！文件已下载: ${downloadResult.filename}`)
      }
      
    } catch (error) {
      console.error('Export error:', error)
      message.error(`生成失败: ${error.message || '未知错误'}`)
    } finally {
      setIsLoading(false)
      setLoadingText('')
    }
  }

  // 使用useMemo缓存ImageEditor相关的计算，避免不必要的重新渲染
  const editorData = useMemo(() => {
    if (selectedPhotos.length === 0) return null
    
    const selectedPhotoObjects = photos.filter(photo => selectedPhotos.includes(photo.id))
    const currentPhoto = selectedPhotoObjects[currentPhotoIndex]
    
    return {
      imageUrl: currentPhoto?.editedUrl || currentPhoto?.url,
      initialTransform: currentPhoto?.transform || { scale: 1, rotation: 0, x: 0, y: 0 },
      currentPhotoId: currentPhoto?.id,
      photos: selectedPhotoObjects
    }
  }, [photos, selectedPhotos, currentPhotoIndex])

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <PhotoUploader onPhotosUploaded={handlePhotosUploaded} />
            </Col>
            <Col xs={24} lg={12}>
              <PhotoGallery 
                photos={photos}
                selectedPhotos={selectedPhotos}
                onSelectionChange={handlePhotoSelection}
                onClearAll={handleClearAllPhotos}
              />
            </Col>
          </Row>
        )
      case 1:
        return (
          <div>
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <Card 
                  title="🎨 图片编辑器 - 预览特效、编辑照片、添加贴纸"
                  style={{ minHeight: '600px' }}
                >
                  {editorData ? (
                    <ImageEditor
                      visible={true}
                      onCancel={() => {}}
                      onConfirm={handlePhotoEdit}
                      imageUrl={editorData.imageUrl}
                      initialTransform={editorData.initialTransform}
                      aspectRatio={16/9}
                      photos={editorData.photos}
                      currentPhotoId={editorData.currentPhotoId}
                      onStickerApply={(stickers, targetPhotoIds) => {
                        targetPhotoIds.forEach(photoId => {
                          handlePhotoEdit(photoId, null, null, { stickers, type: 'sticker' })
                        })
                      }}
                      effects={effects}
                      onEffectsChange={handleEffectsChange}
                    />
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '400px',
                      color: '#999'
                    }}>
                      <PictureOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
                      <Text type="secondary">请先在第一步选择要编辑的照片</Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
            
            {/* 音频设置面板 */}
            <Row style={{ marginTop: '24px' }}>
              <Col xs={24}>
                <AudioPanel 
                  audioFile={audioFile}
                  onAudioUpload={handleAudioUpload}
                />
              </Col>
            </Row>
          </div>
        )
      case 2:
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <ExportPanel 
                onExport={handleExport}
                selectedCount={selectedPhotos.length}
                hasAudio={!!audioFile}
                initialAspectRatio={previewAspectRatio}
              />
            </Col>
            <Col xs={24} lg={12}>
              <PreviewPanel 
                photos={photos.filter(photo => selectedPhotos.includes(photo.id))}
                effects={effects}
                audioFile={audioFile}
                showFinalPreview={true}
                currentAspectRatio={previewAspectRatio}
                onPhotoEdit={handlePhotoEdit}
              />
            </Col>
          </Row>
        )
      default:
        return null
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <PictureOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            电子相册制作工具
          </Title>
          <Text type="secondary" style={{ marginLeft: '16px' }}>
            简单易用 · 一键生成精美相册视频
          </Text>
        </div>
      </Header>

      <Content style={{ padding: '24px', background: 'transparent' }}>
        <Card 
          style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* 紧凑的步骤导航 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px',
            padding: '12px 16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            {/* 左侧：上一步按钮 */}
            {currentStep === 0 ? (
              <div style={{ 
                minWidth: '100px',
                padding: '6px 12px',
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#1890ff'
              }}>
                👋 开始制作
              </div>
            ) : (
              <Button
                size="small"
                onClick={() => handleStepChange(currentStep - 1)}
                style={{ minWidth: '100px' }}
              >
                ← 上一步
              </Button>
            )}

            {/* 中间：步骤指示器 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* 步骤圆点 */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {steps.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => handleStepChange(index)}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: index === currentStep ? '#1890ff' : 
                                 index < currentStep ? '#52c41a' : '#d9d9d9',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: index === currentStep ? '2px solid #fff' : 'none',
                      boxShadow: index === currentStep ? '0 0 0 2px #1890ff' : 'none'
                    }}
                    title={`步骤 ${index + 1}: ${steps[index].title}`}
                  />
                ))}
              </div>
              
              {/* 当前步骤信息 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '6px',
                color: '#666',
                fontSize: '13px'
              }}>
                <span style={{ 
                  background: '#1890ff',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: '500'
                }}>
                  {currentStep + 1}/{steps.length}
                </span>
                <span style={{ color: '#1890ff', fontWeight: '600', fontSize: '14px' }}>
                  {steps[currentStep]?.title}
                </span>
              </div>
            </div>

            {/* 右侧：下一步按钮 */}
            <Button
              type="primary"
              size="small"
              onClick={() => {
                if (currentStep === steps.length - 1) {
                  message.success('相册制作完成！您可以在左侧设置导出参数并生成视频')
                } else {
                  handleStepChange(currentStep + 1)
                }
              }}
              disabled={
                currentStep === steps.length - 1 ? false : 
                (currentStep >= 1 && selectedPhotos.length === 0)
              }
              title={
                (currentStep >= 1 && selectedPhotos.length === 0) ? 
                '请先选择要制作相册的照片' : ''
              }
              style={{ minWidth: '100px' }}
            >
              {currentStep === steps.length - 1 ? '完成制作' : '下一步 →'}
            </Button>
          </div>

          {renderStepContent()}
        </Card>
      </Content>

      {isLoading && (
        <LoadingOverlay 
          text={loadingText}
          description="请稍候，正在处理您的照片..."
        />
      )}
    </Layout>
  )
}

export default App 