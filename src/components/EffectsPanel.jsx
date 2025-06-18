import React from 'react'
import { 
  Card, 
  Form, 
  Select, 
  Slider, 
  Input, 
  ColorPicker, 
  Space, 
  Typography,
  Divider,
  Radio,
  Switch
} from 'antd'
import { ToolOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { TextArea } = Input

const EffectsPanel = ({ effects, onChange }) => {
  
  const handleChange = (field, value) => {
    onChange({ [field]: value })
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
          <span>视觉特效</span>
        </div>
      }
      style={{ height: '400px' }}
      bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
    >
      <Form layout="vertical" size="small">
        
        {/* 转场效果 */}
        <Form.Item label={<Text strong>转场效果</Text>}>
          <Select
            value={effects.transition}
            onChange={(value) => handleChange('transition', value)}
            placeholder="选择转场效果"
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
              <Text type="secondary">{effects.duration}秒</Text>
            </div>
          }
        >
          <Slider
            min={1}
            max={10}
            step={0.5}
            value={effects.duration}
            onChange={(value) => handleChange('duration', value)}
            marks={{
              1: '1s',
              3: '3s',
              5: '5s',
              10: '10s'
            }}
          />
        </Form.Item>

        <Divider />

        {/* 滤镜效果 */}
        <Form.Item label={<Text strong>滤镜效果</Text>}>
          <Select
            value={effects.filter}
            onChange={(value) => handleChange('filter', value)}
            placeholder="选择滤镜"
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
              <Text type="secondary">{effects.brightness || 0}</Text>
            </div>
          }
        >
          <Slider
            min={-50}
            max={50}
            value={effects.brightness || 0}
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
              <Text type="secondary">{effects.contrast || 0}</Text>
            </div>
          }
        >
          <Slider
            min={-50}
            max={50}
            value={effects.contrast || 0}
            onChange={(value) => handleChange('contrast', value)}
            marks={{
              '-50': '低',
              0: '正常',
              50: '高'
            }}
          />
        </Form.Item>

        <Divider />

        {/* 文字叠加 */}
        <Form.Item label={<Text strong>文字叠加</Text>}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <TextArea
              value={effects.textOverlay}
              onChange={(e) => handleChange('textOverlay', e.target.value)}
              placeholder="输入要添加的文字（支持多行）"
              rows={3}
              maxLength={200}
              showCount
            />
            
            <Space>
              <Text type="secondary">文字颜色：</Text>
              <ColorPicker
                value={effects.textColor || '#ffffff'}
                onChange={(color) => handleChange('textColor', color.toHexString())}
                size="small"
              />
            </Space>

            <Space>
              <Text type="secondary">文字位置：</Text>
              <Radio.Group
                value={effects.textPosition || 'bottom'}
                onChange={(e) => handleChange('textPosition', e.target.value)}
                size="small"
              >
                <Radio.Button value="top">顶部</Radio.Button>
                <Radio.Button value="center">中央</Radio.Button>
                <Radio.Button value="bottom">底部</Radio.Button>
              </Radio.Group>
            </Space>

            <Space>
              <Text type="secondary">文字大小：</Text>
              <Slider
                style={{ width: 120 }}
                min={12}
                max={48}
                value={effects.textSize || 24}
                onChange={(value) => handleChange('textSize', value)}
              />
              <Text type="secondary">{effects.textSize || 24}px</Text>
            </Space>
          </Space>
        </Form.Item>

        <Divider />

        {/* Ken Burns 效果 */}
        <Form.Item>
          <Space>
            <Text strong>Ken Burns 缩放效果：</Text>
            <Switch
              checked={effects.kenBurns || false}
              onChange={(checked) => handleChange('kenBurns', checked)}
            />
          </Space>
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              启用后照片会有缓慢的放大缩小效果，让静态照片更有动感
            </Text>
          </div>
        </Form.Item>

        {/* 3D 效果 */}
        <Form.Item>
          <Space>
            <Text strong>3D 翻转效果：</Text>
            <Switch
              checked={effects.flip3D || false}
              onChange={(checked) => handleChange('flip3D', checked)}
            />
          </Space>
        </Form.Item>

      </Form>
    </Card>
  )
}

export default EffectsPanel 