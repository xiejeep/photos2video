import React, { useState, useEffect } from 'react'
import { Card, Button, Space, Typography, Select, Radio, Statistic, Alert, Divider, Tag, Modal, Row, Col } from 'antd'
import { 
  ExportOutlined, 
  DownloadOutlined, 
  VideoCameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BugOutlined
} from '@ant-design/icons'
import { CodecDetector } from '../utils/codecDetector.js'

const { Title, Text } = Typography

const ExportPanel = ({ onExport, selectedCount, hasAudio, initialAspectRatio = '16:9' }) => {
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('1080p')
  const [frameRate, setFrameRate] = useState(30)
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [diagnosticReport, setDiagnosticReport] = useState(null)

  // 监听初始比例变化
  useEffect(() => {
    setAspectRatio(initialAspectRatio)
  }, [initialAspectRatio])

  const formatOptions = [
    { label: 'MP4 (推荐)', value: 'mp4', size: '中等', compatibility: '最佳' },
    { label: 'WebM', value: 'webm', size: '较小', compatibility: '良好' },
    { label: 'MOV', value: 'mov', size: '较大', compatibility: '良好' },
    { label: 'GIF', value: 'gif', size: '最小', compatibility: '最佳' }
  ]

  // 比例选项
  const aspectRatioOptions = [
    { label: '16:9 (宽屏)', value: '16:9', desc: '最常用的视频比例' },
    { label: '4:3 (传统)', value: '4:3', desc: '传统电视比例' },
    { label: '1:1 (正方形)', value: '1:1', desc: '社交媒体常用' },
    { label: '9:16 (竖屏)', value: '9:16', desc: '手机短视频' },
    { label: '21:9 (超宽)', value: '21:9', desc: '电影院线比例' },
    { label: '3:2 (摄影)', value: '3:2', desc: '相机常用比例' }
  ]

  // 根据比例和质量计算尺寸
  const getResolutionByAspectRatio = (quality, aspectRatio) => {
    const baseResolutions = {
      '720p': 720,
      '1080p': 1080,
      '1440p': 1440,
      '2160p': 2160
    }

    const height = baseResolutions[quality] || 1080
    let width

    switch (aspectRatio) {
      case '16:9':
        width = Math.round(height * 16 / 9)
        break
      case '4:3':
        width = Math.round(height * 4 / 3)
        break
      case '1:1':
        width = height
        break
      case '9:16':
        width = Math.round(height * 9 / 16)
        break
      case '21:9':
        width = Math.round(height * 21 / 9)
        break
      case '3:2':
        width = Math.round(height * 3 / 2)
        break
      default:
        width = Math.round(height * 16 / 9)
    }

    return { width, height }
  }

  const qualityOptions = [
    { label: '720p (HD)', value: '720p', bitrate: '2Mbps' },
    { label: '1080p (Full HD)', value: '1080p', bitrate: '4Mbps' },
    { label: '1440p (2K)', value: '1440p', bitrate: '8Mbps' },
    { label: '2160p (4K)', value: '2160p', bitrate: '16Mbps' }
  ]

  const frameRateOptions = [
    { label: '24 FPS (电影)', value: 24 },
    { label: '30 FPS (标准)', value: 30 },
    { label: '60 FPS (流畅)', value: 60 }
  ]

  const getCurrentQuality = () => {
    const qualityOption = qualityOptions.find(q => q.value === quality)
    const resolution = getResolutionByAspectRatio(quality, aspectRatio)
    return {
      ...qualityOption,
      ...resolution
    }
  }

  const getEstimatedFileSize = () => {
    const duration = selectedCount * 3 // 假设每张照片3秒
    const bitrateNum = parseInt(getCurrentQuality()?.bitrate) || 4
    const estimatedMB = (duration * bitrateNum * 0.125).toFixed(1) // 转换为MB
    return estimatedMB
  }

  const getEstimatedTime = () => {
    // 根据选择的质量和照片数量估算处理时间
    const baseTime = selectedCount * 2 // 基础时间：每张照片2秒
    const qualityMultiplier = quality === '2160p' ? 3 : quality === '1440p' ? 2 : 1
    const totalSeconds = baseTime * qualityMultiplier
    
    if (totalSeconds < 60) {
      return `约 ${totalSeconds} 秒`
    } else {
      return `约 ${Math.ceil(totalSeconds / 60)} 分钟`
    }
  }

  const handleExport = () => {
    const currentQuality = getCurrentQuality()
    onExport(format, quality, {
      frameRate,
      width: currentQuality?.width,
      height: currentQuality?.height,
      bitrate: currentQuality?.bitrate,
      aspectRatio
    })
  }

  const handleShowDiagnostic = () => {
    const report = CodecDetector.generateDiagnosticReport()
    setDiagnosticReport(report)
    setShowDiagnostic(true)
    
    // 同时在控制台输出
    CodecDetector.logDiagnostics()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* 顶部导出按钮 - 置顶显示 */}
      <div>
        <Button
          type="primary"
          size="large"
          icon={<VideoCameraOutlined />}
          onClick={handleExport}
          disabled={selectedCount === 0}
          block
          style={{ 
            height: '56px', 
            fontSize: '16px',
            background: '#1890ff',
            border: 'none',
            outline: 'none',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
          }}
        >
          {selectedCount === 0 ? '请先选择照片' : `🎬 开始生成电子相册 (${selectedCount}张照片)`}
        </Button>
      </div>

      {/* 主要设置区域 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ExportOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>导出设置</span>
          </div>
        }
        size="small"
        style={{ flex: 1 }}
        bodyStyle={{ padding: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">

          {/* 项目信息 - 更紧凑的展示 */}
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="选中照片"
                value={selectedCount}
                suffix="张"
                valueStyle={{ color: '#1890ff', fontSize: '18px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="预计时长"
                value={(selectedCount * 3).toFixed(1)}
                suffix="秒"
                valueStyle={{ color: '#52c41a', fontSize: '18px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="背景音乐"
                value={hasAudio ? '已添加' : '未添加'}
                valueStyle={{ color: hasAudio ? '#52c41a' : '#8c8c8c', fontSize: '14px' }}
                prefix={hasAudio ? <CheckCircleOutlined /> : null}
              />
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />

          {/* 主要设置 - 使用更紧凑的布局 */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div>
                <Title level={5} style={{ marginBottom: '8px' }}>输出格式</Title>
                <Select
                  value={format}
                  onChange={setFormat}
                  style={{ width: '100%' }}
                  size="large"
                >
                  {formatOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{option.label}</span>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {option.compatibility}
                        </Text>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Title level={5} style={{ marginBottom: '8px' }}>视频质量</Title>
                <Select
                  value={quality}
                  onChange={setQuality}
                  style={{ width: '100%' }}
                  size="large"
                >
                  {qualityOptions.map(option => {
                    const resolution = getResolutionByAspectRatio(option.value, aspectRatio)
                    return (
                      <Select.Option key={option.value} value={option.value}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{option.label}</span>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {resolution.width}×{resolution.height}
                          </Text>
                        </div>
                      </Select.Option>
                    )
                  })}
                </Select>
              </div>
            </Col>
          </Row>

          {/* 比例和帧率 */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div>
                <Title level={5} style={{ marginBottom: '8px' }}>视频比例</Title>
                <div style={{ 
                  background: '#f0f8ff', 
                  border: '1px solid #d4edda',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {aspectRatioOptions.find(opt => opt.value === aspectRatio)?.label || aspectRatio}
                    </span>
                    <Tag color="blue" size="small">
                      {aspectRatio}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    在预览步骤中设置
                  </Text>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Title level={5} style={{ marginBottom: '8px' }}>帧率</Title>
                <Radio.Group
                  value={frameRate}
                  onChange={(e) => setFrameRate(e.target.value)}
                  style={{ width: '100%' }}
                  size="small"
                >
                  {frameRateOptions.map(option => (
                    <Radio.Button key={option.value} value={option.value} style={{ fontSize: '12px' }}>
                      {option.value} FPS
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </div>
            </Col>
          </Row>

          {/* 预计信息 - 紧凑显示 */}
          <div style={{ 
            background: '#fafafa', 
            border: '1px solid #e8e8e8',
            borderRadius: '6px',
            padding: '12px'
          }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>文件大小</Text>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>{getEstimatedFileSize()} MB</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>处理时间</Text>
                  <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>{getEstimatedTime()}</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>输出分辨率</Text>
                  <Text strong style={{ fontSize: '16px', color: '#722ed1' }}>
                    {getCurrentQuality()?.width}×{getCurrentQuality()?.height}
                  </Text>
                </div>
              </Col>
            </Row>
          </div>

          {/* 快速预设 */}
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
              快速预设: 
            </Text>
            <Space wrap>
              <Button 
                size="small"
                onClick={() => {setQuality('1080p'); setFormat('mp4'); setFrameRate(30)}}
              >
                标准质量
              </Button>
              <Button 
                size="small"
                onClick={() => {setQuality('720p'); setFormat('mp4'); setFrameRate(24)}}
              >
                快速导出
              </Button>
              <Button 
                size="small"
                onClick={() => {setQuality('2160p'); setFormat('mp4'); setFrameRate(30)}}
              >
                最佳质量
              </Button>
            </Space>
          </div>

          {/* 提示和诊断工具 */}
          <Alert
            message="💡 导出提示"
            description="处理过程中请不要关闭浏览器 • 高质量需要更长时间 • 可返回上一步添加背景音乐"
            type="info"
            showIcon
            style={{ fontSize: '12px' }}
          />

          <Button
            type="default"
            size="small"
            icon={<BugOutlined />}
            onClick={handleShowDiagnostic}
            block
          >
            检查编解码器支持
          </Button>

        </Space>
      </Card>

      {/* 诊断模态框 */}
      <Modal
        title="🔍 编解码器诊断报告"
        open={showDiagnostic}
        onCancel={() => setShowDiagnostic(false)}
        footer={[
          <Button key="close" onClick={() => setShowDiagnostic(false)}>
            关闭
          </Button>
        ]}
        width={800}
        style={{ maxHeight: '80vh' }}
        bodyStyle={{ maxHeight: '60vh', overflow: 'auto' }}
      >
        {diagnosticReport && (
          <div>
            {/* 环境信息 */}
            <div style={{ marginBottom: '20px' }}>
              <Title level={5}>🖥️ 环境信息</Title>
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
                <p><strong>是否为Electron:</strong> {diagnosticReport.environment.isElectron ? '是' : '否'}</p>
                <p><strong>Chrome版本:</strong> {diagnosticReport.environment.chromeVersion}</p>
                <p><strong>Electron版本:</strong> {diagnosticReport.environment.electronVersion}</p>
                <p><strong>平台:</strong> {diagnosticReport.environment.platform}</p>
              </div>
            </div>

            {/* MP4支持详情 */}
            <div style={{ marginBottom: '20px' }}>
              <Title level={5}>🎬 MP4编解码器支持</Title>
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
                {diagnosticReport.mp4DetailedTest.map((test, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <span style={{ color: test.supported ? '#52c41a' : '#f5222d' }}>
                      {test.supported ? '✅' : '❌'}
                    </span>
                    <span style={{ marginLeft: '8px' }}>{test.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 支持的格式 */}
            <div style={{ marginBottom: '20px' }}>
              <Title level={5}>✅ 支持的格式</Title>
              <div style={{ background: '#f6ffed', padding: '12px', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                {diagnosticReport.allSupportedFormats.map((format, index) => (
                  <div key={index} style={{ marginBottom: '4px', color: '#389e0d' }}>
                    ✅ {format}
                  </div>
                ))}
              </div>
            </div>

            {/* 建议 */}
            <div style={{ marginBottom: '20px' }}>
              <Title level={5}>💡 建议</Title>
              <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '6px', border: '1px solid #91d5ff' }}>
                {diagnosticReport.recommendations.map((rec, index) => (
                  <div key={index} style={{ marginBottom: '8px', color: '#1890ff' }}>
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* 解决方案 */}
            <Alert
              message="解决MP4支持问题的方法"
              description={
                <div>
                  <p><strong>1. 升级Electron版本：</strong></p>
                  <p>• 当前使用Electron 22，建议升级到Electron 28+</p>
                  <p>• 新版本包含更新的Chromium和更好的编解码器支持</p>
                  
                  <p><strong>2. 临时解决方案：</strong></p>
                  <p>• 使用WebM格式（质量相当，兼容性更好）</p>
                  <p>• 或者先导出WebM，再使用FFmpeg转换为MP4</p>
                  
                  <p><strong>3. 长期解决方案：</strong></p>
                  <p>• 升级依赖包版本</p>
                  <p>• 考虑使用FFmpeg.wasm进行后处理</p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ExportPanel 