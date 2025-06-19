import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Modal, Button, Space, Slider, Input, Typography, Row, Col, Divider } from 'antd'
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  RotateLeftOutlined, 
  RotateRightOutlined,
  ReloadOutlined,
  AimOutlined,
  CloseOutlined,
  CheckOutlined
} from '@ant-design/icons'

const { Text } = Typography

const ImageEditor = ({ 
  visible, 
  onCancel, 
  onConfirm,
  imageUrl,
  initialTransform,
  aspectRatio = 16/9
}) => {
  // 变换状态
  const [transform, setTransform] = useState({
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0,
    ...initialTransform
  })

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [transformStart, setTransformStart] = useState({ x: 0, y: 0 })

  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // 重置变换状态
  useEffect(() => {
    if (visible) {
      setTransform({
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0,
        ...initialTransform
      })
    }
  }, [visible, initialTransform])

  // 缩放操作
  const handleZoom = useCallback((delta) => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale + delta))
    }))
  }, [])

  // 旋转操作
  const handleRotation = useCallback((delta) => {
    setTransform(prev => ({
      ...prev,
      rotation: (prev.rotation + delta) % 360
    }))
  }, [])

  // 重置位置
  const handleCenter = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      x: 0,
      y: 0
    }))
  }, [])

  // 重置所有变换
  const handleReset = useCallback(() => {
    setTransform({
      scale: 1,
      rotation: 0,
      x: 0,
      y: 0
    })
  }, [])

  // 鼠标按下开始拖拽
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return // 只响应左键
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setTransformStart({ x: transform.x, y: transform.y })
    e.preventDefault()
  }, [transform.x, transform.y])

  // 鼠标移动拖拽
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    setTransform(prev => ({
      ...prev,
      x: transformStart.x + deltaX,
      y: transformStart.y + deltaY
    }))
  }, [isDragging, dragStart, transformStart])

  // 鼠标抬起结束拖拽
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 滚轮缩放
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    handleZoom(delta)
  }, [handleZoom])

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 确认编辑
  const handleConfirm = () => {
    onConfirm(transform)
  }

  // 计算显示区域样式
  const getViewportStyle = () => {
    // 编辑器主区域尺寸
    const maxWidth = 600
    const maxHeight = 400
    
    let width, height
    if (aspectRatio > maxWidth / maxHeight) {
      width = maxWidth
      height = maxWidth / aspectRatio
    } else {
      height = maxHeight
      width = maxHeight * aspectRatio
    }
    
    return {
      width: `${width}px`,
      height: `${height}px`
    }
  }

  // 计算图片变换样式
  const getImageStyle = () => {
    return {
      width: 'auto',
      height: 'auto',
      maxWidth: '100%',
      maxHeight: '100%',
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
      transformOrigin: 'center center',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none'
    }
  }

  return (
    <Modal
      title="编辑图片"
      open={visible}
      onCancel={onCancel}
      width={800}
      centered
      footer={null}
      destroyOnClose
      className="image-editor-modal"
      styles={{
        body: { padding: '20px' }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 编辑区域 */}
        <div
          style={{
            position: 'relative',
            alignSelf: 'center',
            width: '800px',
            height: '500px',
            background: '#1a1a1a',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
          onWheel={handleWheel}
        >
          {/* 图片容器 - 完全自由的空间 */}
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
              zIndex: 10 // 确保图片在遮罩下方但可见
            }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="编辑中"
                style={getImageStyle()}
                onMouseDown={handleMouseDown}

                draggable={false}
              />
            )}
          </div>

          {/* 遮罩层 - 创建可视区域窗口 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 20
            }}
          >
            {/* 计算可视区域位置 */}
            {(() => {
              const viewportStyle = getViewportStyle()
              const containerWidth = 800
              const containerHeight = 500
              const viewportWidth = parseInt(viewportStyle.width)
              const viewportHeight = parseInt(viewportStyle.height)
              const left = (containerWidth - viewportWidth) / 2
              const top = (containerHeight - viewportHeight) / 2

              return (
                <>
                  {/* 上方遮罩 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${top}px`,
                      background: 'rgba(0,0,0,0.7)',
                      borderBottom: '1px solid rgba(255,255,255,0.2)'
                    }}
                  />
                  {/* 下方遮罩 */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: `${containerHeight - top - viewportHeight}px`,
                      background: 'rgba(0,0,0,0.7)',
                      borderTop: '1px solid rgba(255,255,255,0.2)'
                    }}
                  />
                  {/* 左侧遮罩 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${top}px`,
                      left: 0,
                      width: `${left}px`,
                      height: `${viewportHeight}px`,
                      background: 'rgba(0,0,0,0.7)',
                      borderRight: '1px solid rgba(255,255,255,0.2)'
                    }}
                  />
                  {/* 右侧遮罩 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${top}px`,
                      right: 0,
                      width: `${containerWidth - left - viewportWidth}px`,
                      height: `${viewportHeight}px`,
                      background: 'rgba(0,0,0,0.7)',
                      borderLeft: '1px solid rgba(255,255,255,0.2)'
                    }}
                  />
                  {/* 可视区域边框 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${top}px`,
                      left: `${left}px`,
                      width: `${viewportWidth}px`,
                      height: `${viewportHeight}px`,
                      border: '2px solid #1890ff',
                      borderRadius: '4px',
                      boxShadow: '0 0 10px rgba(24,144,255,0.5)'
                    }}
                  />
                  {/* 中心参考线 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${top + viewportHeight/2 - 10}px`,
                      left: `${left + viewportWidth/2 - 10}px`,
                      width: '20px',
                      height: '20px',
                      border: '1px solid rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      background: 'rgba(24,144,255,0.3)'
                    }}
                  />
                  {/* 区域标签 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${top + 8}px`,
                      left: `${left + 8}px`,
                      background: '#1890ff',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    输出区域 ({viewportWidth}×{viewportHeight})
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* 控制面板 */}
        <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px' }}>
          <Row gutter={[16, 16]}>
            {/* 缩放控制 */}
            <Col span={12}>
              <Text strong>缩放 ({Math.round(transform.scale * 100)}%)</Text>
              <div style={{ marginTop: '8px' }}>
                <Space>
                  <Button
                    icon={<ZoomOutOutlined />}
                    onClick={() => handleZoom(-0.1)}
                    disabled={transform.scale <= 0.1}
                    size="small"
                  />
                  <Slider
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={transform.scale}
                    onChange={(value) => setTransform(prev => ({ ...prev, scale: value }))}
                    style={{ width: '120px' }}
                  />
                  <Button
                    icon={<ZoomInOutlined />}
                    onClick={() => handleZoom(0.1)}
                    disabled={transform.scale >= 5}
                    size="small"
                  />
                  <Button onClick={() => setTransform(prev => ({ ...prev, scale: 1 }))} size="small">
                    100%
                  </Button>
                </Space>
              </div>
            </Col>

            {/* 旋转控制 */}
            <Col span={12}>
              <Text strong>旋转 ({transform.rotation}°)</Text>
              <div style={{ marginTop: '8px' }}>
                <Space>
                  <Button
                    icon={<RotateLeftOutlined />}
                    onClick={() => handleRotation(-15)}
                    size="small"
                  />
                  <Input
                    value={transform.rotation}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      setTransform(prev => ({ ...prev, rotation: value % 360 }))
                    }}
                    style={{ width: '60px', textAlign: 'center' }}
                    size="small"
                  />
                  <Button
                    icon={<RotateRightOutlined />}
                    onClick={() => handleRotation(15)}
                    size="small"
                  />
                  <Button
                    icon={<RotateRightOutlined />}
                    onClick={() => handleRotation(90)}
                    size="small"
                  >
                    90°
                  </Button>
                </Space>
              </div>
            </Col>

            {/* 位置控制 */}
            <Col span={12}>
              <Text strong>位置 (X: {Math.round(transform.x)}, Y: {Math.round(transform.y)})</Text>
              <div style={{ marginTop: '8px' }}>
                <Space>
                  <Button
                    icon={<AimOutlined />}
                    onClick={handleCenter}
                    size="small"
                  >
                    居中
                  </Button>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    拖拽图片调整位置
                  </Text>
                </Space>
              </div>
            </Col>

            {/* 重置控制 */}
            <Col span={12}>
              <Text strong>重置选项</Text>
              <div style={{ marginTop: '8px' }}>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                    size="small"
                  >
                    重置所有
                  </Button>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    恢复默认设置
                  </Text>
                </Space>
              </div>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button
                icon={<CloseOutlined />}
                onClick={onCancel}
                size="large"
              >
                取消
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleConfirm}
                size="large"
              >
                确认应用
              </Button>
            </Space>
          </div>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              💡 拖拽图片调整位置，滚轮缩放，蓝色区域为最终视频显示范围
            </Text>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ImageEditor 