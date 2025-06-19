import React, { useState } from 'react'
import { 
  Card, 
  Form, 
  Select, 
  Slider, 
  Space, 
  Typography,
  Switch,
  Row,
  Col,
  Radio,
  Button,
  Checkbox,
  message,
  Tooltip
} from 'antd'
import { ToolOutlined, CheckOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import AudioPanel from './AudioPanel'

const { Title, Text } = Typography

const EffectsPanel = ({ effects, onChange, photos = [], selectedPhotos = [], audioFile, onAudioUpload }) => {
  const [applyScope, setApplyScope] = useState('all')
  const [selectedForEffects, setSelectedForEffects] = useState([])
  const [tempEffects, setTempEffects] = useState(effects)
  
  const handleChange = (field, value) => {
    setTempEffects(prev => ({ ...prev, [field]: value }))
    
    // 色彩调节直接应用到全局
    if (['filter', 'brightness', 'contrast'].includes(field)) {
      onChange({ ...tempEffects, [field]: value })
    }
  }

  const handleApplyMotionEffects = () => {
    let targetPhotoIds = []
    
    switch (applyScope) {
      case 'all':
        targetPhotoIds = photos.map(p => p.id)
        break
      case 'selected':
        targetPhotoIds = selectedForEffects
        break
      default:
        targetPhotoIds = photos.map(p => p.id)
    }
    
    // 只应用动效相关的设置
    const motionEffects = {
      transition: tempEffects.transition,
      duration: tempEffects.duration,
      kenBurns: tempEffects.kenBurns,
      flip3D: tempEffects.flip3D
    }
    
    onChange(motionEffects, targetPhotoIds, applyScope)
    message.success(`动效设置已应用到 ${targetPhotoIds.length} 张图片`)
  }

  const transitionOptions = [
    { label: '淡入淡出', value: 'fade' },
    { label: '滑动', value: 'slide' },
    { label: '缩放', value: 'zoom' },
    { label: '旋转', value: 'rotate' },
    { label: '翻页', value: 'flip' },
    { label: '溶解', value: 'dissolve' },
    { label: '百叶窗', value: 'blinds' },
    { label: '马赛克', value: 'pixelate' },
  ]

  const filterOptions = [
    { label: '无滤镜', value: 'none' },
    { label: '复古', value: 'vintage' },
    { label: '黑白', value: 'grayscale' },
    { label: '暖色调', value: 'warm' },
    { label: '冷色调', value: 'cool' },
    { label: '高对比度', value: 'contrast' },
    { label: '柔光', value: 'soft' },
    { label: '鲜艳', value: 'vivid' },
  ]

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ToolOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          <span>视觉特效设置</span>
        </div>
      }
      style={{ height: 'auto', minHeight: '500px' }}
      bodyStyle={{ padding: '20px' }}
    >
      <Form layout="vertical" size="small">
        <Row gutter={[24, 16]}>
          {/* 左列：基础设置 */}
          <Col xs={24} md={12} lg={8}>
            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Title level={5} style={{ margin: 0, color: '#1890ff' }}>🎬 基础动效</Title>
                <Tooltip 
                  title="基础动效需要点击&quot;应用&quot;按钮选择图片范围；色彩调节会实时应用到全部图片。"
                  placement="topLeft"
                  overlayStyle={{ maxWidth: '300px' }}
                >
                  <QuestionCircleOutlined style={{ color: '#1890ff', fontSize: '14px', cursor: 'help' }} />
                </Tooltip>
              </div>
              
              {/* 转场效果 */}
              <Form.Item label={<Text strong>转场效果</Text>} style={{ marginBottom: '16px' }}>
                <Select
                  value={tempEffects.transition}
                  onChange={(value) => handleChange('transition', value)}
                  placeholder="选择转场效果"
                  size="middle"
                >
                  {transitionOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* 每张照片显示时长 */}
              <Form.Item 
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>照片显示时长</Text>
                    <Text type="secondary">{tempEffects.duration}秒</Text>
                  </div>
                }
                style={{ marginBottom: '16px' }}
              >
                <Slider
                  min={1}
                  max={10}
                  step={0.5}
                  value={tempEffects.duration}
                  onChange={(value) => handleChange('duration', value)}
                  marks={{
                    1: '1s',
                    5: '5s',
                    10: '10s'
                  }}
                />
              </Form.Item>

              {/* 动效开关 */}
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Text strong>Ken Burns 缩放效果</Text>
                    <Tooltip 
                      title="Ken Burns效果会为照片添加缓慢的缩放和平移动画，让静态照片看起来更生动。常用于纪录片和照片幻灯片中。"
                      placement="topLeft"
                    >
                      <QuestionCircleOutlined style={{ color: '#1890ff', fontSize: '12px', cursor: 'help' }} />
                    </Tooltip>
                  </div>
                  <Switch
                    checked={tempEffects.kenBurns || false}
                    onChange={(checked) => handleChange('kenBurns', checked)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Text strong>3D 翻转效果</Text>
                    <Tooltip 
                      title="3D翻转效果会让照片在切换时产生立体翻转动画，如翻书或翻卡片的效果。可以增加视觉层次感和现代感。"
                      placement="topLeft"
                    >
                      <QuestionCircleOutlined style={{ color: '#1890ff', fontSize: '12px', cursor: 'help' }} />
                    </Tooltip>
                  </div>
                  <Switch
                    checked={tempEffects.flip3D || false}
                    onChange={(checked) => handleChange('flip3D', checked)}
                  />
                </div>
              </Space>

              {/* 基础动效应用设置 */}
              <div style={{ marginTop: '20px', padding: '12px', background: '#e6f7ff', borderRadius: '6px', border: '1px solid #91d5ff' }}>
                <Text strong style={{ fontSize: '12px', color: '#1890ff', display: 'block', marginBottom: '8px' }}>
                  应用到图片
                </Text>
                <Radio.Group
                  value={applyScope}
                  onChange={(e) => setApplyScope(e.target.value)}
                  style={{ fontSize: '11px' }}
                >
                  <Space direction="vertical" size="small">
                    <Radio value="all" style={{ fontSize: '11px' }}>所有图片 ({photos.length}张)</Radio>
                    <Radio value="selected" style={{ fontSize: '11px' }}>选择图片</Radio>
                  </Space>
                </Radio.Group>
                {applyScope === 'selected' && (
                  <div style={{ marginTop: '8px', maxHeight: '100px', overflow: 'auto' }}>
                    <Checkbox.Group
                      value={selectedForEffects}
                      onChange={setSelectedForEffects}
                    >
                      <Space direction="vertical" size="small">
                        {photos.map((photo, index) => (
                          <Checkbox key={photo.id} value={photo.id} style={{ fontSize: '10px' }}>
                            图片 {index + 1}
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  </div>
                )}
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleApplyMotionEffects}
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={applyScope === 'selected' && selectedForEffects.length === 0}
                >
                  应用动效设置
                </Button>
              </div>
            </div>
          </Col>

          {/* 中列：滤镜和调色 */}
          <Col xs={24} md={12} lg={8}>
            <div style={{ background: '#fff7e6', padding: '16px', borderRadius: '8px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Title level={5} style={{ margin: 0, color: '#fa8c16' }}>🎨 色彩调节</Title>
                <Tooltip 
                  title="色彩调节会立即应用到所有图片和视频预览中，无需单独的应用操作。这些设置将影响整个相册的视觉风格。"
                  placement="topLeft"
                  overlayStyle={{ maxWidth: '300px' }}
                >
                  <QuestionCircleOutlined style={{ color: '#fa8c16', fontSize: '14px', cursor: 'help' }} />
                </Tooltip>
              </div>
              
              {/* 滤镜效果 */}
              <Form.Item label={<Text strong>滤镜效果</Text>} style={{ marginBottom: '16px' }}>
                <Select
                  value={tempEffects.filter}
                  onChange={(value) => handleChange('filter', value)}
                  placeholder="选择滤镜"
                  size="middle"
                >
                  {filterOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* 亮度调节 */}
              <Form.Item 
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>亮度</Text>
                    <Text type="secondary">{tempEffects.brightness || 0}</Text>
                  </div>
                }
                style={{ marginBottom: '16px' }}
              >
                <Slider
                  min={-50}
                  max={50}
                  value={tempEffects.brightness || 0}
                  onChange={(value) => handleChange('brightness', value)}
                  marks={{
                    '-50': '暗',
                    0: '正常',
                    50: '亮'
                  }}
                />
              </Form.Item>

              {/* 对比度调节 */}
              <Form.Item 
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>对比度</Text>
                    <Text type="secondary">{tempEffects.contrast || 0}</Text>
                  </div>
                }
              >
                <Slider
                  min={-50}
                  max={50}
                  value={tempEffects.contrast || 0}
                  onChange={(value) => handleChange('contrast', value)}
                  marks={{
                    '-50': '低',
                    0: '正常',
                    50: '高'
                  }}
                />
              </Form.Item>


            </div>
          </Col>

          {/* 右列：背景音乐 */}
          <Col xs={24} md={24} lg={8}>
            <AudioPanel 
              audioFile={audioFile}
              onAudioUpload={onAudioUpload}
            />
          </Col>
        </Row>


      </Form>
    </Card>
  )
}

export default EffectsPanel 