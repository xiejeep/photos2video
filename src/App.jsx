import React, { useState } from 'react'
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
    filter: 'none'
  })
  const [previewAspectRatio, setPreviewAspectRatio] = useState('16:9')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')

  const steps = [
    {
      title: '导入照片',
      description: '选择要制作相册的照片',
      icon: <PictureOutlined />,
    },
    {
      title: '创意制作',
      description: '设置特效、比例、背景音乐',
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

  const handleEffectsChange = (newEffects) => {
    setEffects(prev => ({ ...prev, ...newEffects }))
  }

  const handleAspectRatioChange = (aspectRatio) => {
    setPreviewAspectRatio(aspectRatio)
  }

  const handleAudioUpload = (file) => {
    setAudioFile(file)
    message.success('背景音乐添加成功')
  }

  // 处理图片编辑
  const handlePhotoEdit = async (photoId, transform, aspectRatio) => {
    const photo = photos.find(p => p.id === photoId)
    if (!photo) return

    try {
      setIsLoading(true)
      setLoadingText('正在处理图片...')

      // 生成编辑后的图片
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
            isEdited: true
          }
        }
        return p
      }))

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
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
              <Col xs={24} lg={12}>
                <EffectsPanel 
                  effects={effects}
                  onChange={handleEffectsChange}
                />
              </Col>
              <Col xs={24} lg={12}>
                <AudioPanel 
                  audioFile={audioFile}
                  onAudioUpload={handleAudioUpload}
                />
              </Col>
            </Row>
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <PreviewPanel 
                  photos={photos.filter(photo => selectedPhotos.includes(photo.id))}
                  effects={effects}
                  audioFile={audioFile}
                  onAspectRatioChange={handleAspectRatioChange}
                  onPhotoEdit={handlePhotoEdit}
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
          <div style={{ position: 'relative' }}>
            <Steps
              current={currentStep}
              onChange={handleStepChange}
              items={steps}
              style={{ marginBottom: '24px' }}
            />
            {/* 点击提示 */}
            <div style={{ 
              position: 'absolute',
              top: '-8px',
              right: '0',
              background: '#fff2e8',
              border: '1px solid #ffb84d',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              color: '#d4380d'
            }}>
              💡 点击步骤圆点可快速跳转
            </div>
          </div>

          {/* 步骤导航按钮 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            {currentStep === 0 ? (
              <div style={{ 
                minWidth: '120px',
                padding: '8px 16px',
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#1890ff'
              }}>
                👋 开始制作相册
              </div>
            ) : (
              <Button
                size="large"
                onClick={() => handleStepChange(currentStep - 1)}
                style={{ minWidth: '120px' }}
              >
                ← 上一步
              </Button>
            )}

            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '8px',
              color: '#666',
              fontSize: '14px'
            }}>
              <span style={{ 
                background: '#1890ff',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {currentStep + 1}/{steps.length}
              </span>
              <span style={{ color: '#1890ff', fontWeight: '600', fontSize: '16px' }}>
                {steps[currentStep]?.title}
              </span>
              <span style={{ color: '#8c8c8c', fontSize: '13px' }}>
                {steps[currentStep]?.description}
              </span>
            </div>

            <Button
              type="primary"
              size="large"
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
              style={{ minWidth: '120px' }}
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