import React, { useState, useEffect } from 'react'
import { Card, Button, Space, Typography, Select, Radio, Statistic, Alert, Divider, Tag, Modal } from 'antd'
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
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ExportOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          <span>导出设置</span>
        </div>
      }
      style={{ height: '600px' }}
      bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">

        {/* 项目信息 */}
        <div style={{ 
          background: '#f0f8ff', 
          border: '1px solid #d4edda',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <Space size="large">
            <Statistic
              title="选中照片"
              value={selectedCount}
              suffix="张"
              valueStyle={{ color: '#1890ff' }}
            />
            <Statistic
              title="预计时长"
              value={(selectedCount * 3).toFixed(1)}
              suffix="秒"
              valueStyle={{ color: '#52c41a' }}
            />
            <Statistic
              title="背景音乐"
              value={hasAudio ? '已添加' : '未添加'}
              valueStyle={{ color: hasAudio ? '#52c41a' : '#8c8c8c' }}
              prefix={hasAudio ? <CheckCircleOutlined /> : null}
            />
          </Space>
        </div>

        <Divider />

        {/* 格式选择 */}
        <div>
          <Title level={5}>输出格式</Title>
          <Radio.Group
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {formatOptions.map(option => (
                <Radio 
                  key={option.value} 
                  value={option.value}
                  style={{ width: '100%' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{option.label}</span>
                    <Space>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        文件大小: {option.size}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        兼容性: {option.compatibility}
                      </Text>
                    </Space>
                  </div>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        {/* 比例信息显示 */}
        <div>
          <Title level={5}>视频比例</Title>
          <div style={{ 
            background: '#f0f8ff', 
            border: '1px solid #d4edda',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>
                  {aspectRatioOptions.find(opt => opt.value === aspectRatio)?.label || aspectRatio}
                </span>
                <Tag color="blue" style={{ fontSize: '12px' }}>
                  {aspectRatio}
                </Tag>
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {aspectRatioOptions.find(opt => opt.value === aspectRatio)?.desc || '自定义比例'}
              </Text>
              <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                * 比例已在预览步骤中设置，如需修改请返回上一步
              </Text>
            </Space>
          </div>
        </div>

        {/* 质量设置 */}
        <div>
          <Title level={5}>视频质量</Title>
          <Select
            value={quality}
            onChange={setQuality}
            style={{ width: '100%' }}
          >
            {qualityOptions.map(option => {
              const resolution = getResolutionByAspectRatio(option.value, aspectRatio)
              return (
                <Select.Option key={option.value} value={option.value}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{option.label}</span>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {resolution.width}×{resolution.height} | {option.bitrate}
                    </Text>
                  </div>
                </Select.Option>
              )
            })}
          </Select>
        </div>

        {/* 帧率设置 */}
        <div>
          <Title level={5}>帧率</Title>
          <Radio.Group
            value={frameRate}
            onChange={(e) => setFrameRate(e.target.value)}
          >
            {frameRateOptions.map(option => (
              <Radio.Button key={option.value} value={option.value}>
                {option.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>

        <Divider />

        {/* 预计信息 */}
        <div style={{ 
          background: '#fafafa', 
          border: '1px solid #e8e8e8',
          borderRadius: '6px',
          padding: '12px'
        }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>预计文件大小:</Text>
              <Text strong>{getEstimatedFileSize()} MB</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>预计处理时间:</Text>
              <Text strong>{getEstimatedTime()}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>输出分辨率:</Text>
              <Text strong>{getCurrentQuality()?.width}×{getCurrentQuality()?.height}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>视频比例:</Text>
              <Text strong>{aspectRatio}</Text>
            </div>
          </Space>
        </div>

        {/* 提示信息 */}
        <Alert
          message="导出提示"
          description={
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>处理过程中请不要关闭浏览器窗口</li>
              <li>高质量设置需要更长的处理时间</li>
              <li>建议在处理大量照片时选择较低质量进行测试</li>
              {!hasAudio && <li>可以返回上一步添加背景音乐</li>}
            </ul>
          }
          type="info"
          showIcon
        />

        {/* 诊断工具 */}
        <div>
          <Button
            type="default"
            size="small"
            icon={<BugOutlined />}
            onClick={handleShowDiagnostic}
            style={{ width: '100%', marginBottom: '12px' }}
          >
            检查编解码器支持（解决MP4问题）
          </Button>
        </div>

        {/* 导出按钮 */}
        <Button
          type="primary"
          size="large"
          icon={<VideoCameraOutlined />}
          onClick={handleExport}
          disabled={selectedCount === 0}
          block
          style={{ height: '48px', fontSize: '16px' }}
        >
          {selectedCount === 0 ? '请先选择照片' : `开始生成电子相册 (${selectedCount}张照片)`}
        </Button>

        {/* 快速预设 */}
        <div>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
            质量预设: 
          </Text>
          <Space wrap>
            <Button 
              type="link" 
              size="small" 
              onClick={() => {setQuality('1080p'); setFormat('mp4'); setFrameRate(30)}}
            >
              标准质量
            </Button>
            <Button 
              type="link" 
              size="small"
              onClick={() => {setQuality('720p'); setFormat('mp4'); setFrameRate(24)}}
            >
              快速导出
            </Button>
            <Button 
              type="link" 
              size="small"
              onClick={() => {setQuality('2160p'); setFormat('mp4'); setFrameRate(30)}}
            >
              最佳质量
            </Button>
          </Space>
        </div>

      </Space>
      
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
    </Card>
  )
}

export default ExportPanel 