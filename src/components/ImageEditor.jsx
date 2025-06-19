import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Modal, Button, Space, Slider, Input, Typography, Row, Col, Divider, Tabs, Select, Checkbox, message } from 'antd'
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  RotateLeftOutlined, 
  RotateRightOutlined,
  ReloadOutlined,
  AimOutlined,
  CloseOutlined,
  CheckOutlined,
  SmileOutlined,
  HeartOutlined,
  StarOutlined,
  GiftOutlined,
  DeleteOutlined,
  DragOutlined,
  UndoOutlined
} from '@ant-design/icons'

const { Text } = Typography
const { Option } = Select

// 精简字体库
const fontFamilies = [
  // 常用系统字体
  { name: '微软雅黑', value: '"Microsoft YaHei", sans-serif', preview: '微软雅黑' },
  { name: '宋体', value: '"SimSun", serif', preview: '宋体' },
  { name: '楷体', value: '"KaiTi", serif', preview: '楷体' },
  { name: '黑体', value: '"SimHei", sans-serif', preview: '黑体' },
  { name: 'Arial', value: 'Arial, sans-serif', preview: 'Arial' },
  { name: 'Impact', value: 'Impact, sans-serif', preview: 'IMPACT' },
  
  // 用户下载的字体
  { name: '加油字体', value: '"JiaYouFont", "黑体", sans-serif', preview: '加油' },
  { name: '手写字体', value: '"ShouXieFont", "楷体", cursive', preview: '手写' },
  { name: '自由字体', value: '"FreeFont", "微软雅黑", sans-serif', preview: 'Free' },
]

// 预设贴纸库
const stickerCategories = {
  emotion: {
    name: '表情',
    icon: <SmileOutlined />,
    stickers: [
      { id: 'smile', emoji: '😊', name: '笑脸' },
      { id: 'heart_eyes', emoji: '😍', name: '爱心眼' },
      { id: 'laugh', emoji: '😂', name: '大笑' },
      { id: 'kiss', emoji: '😘', name: '飞吻' },
      { id: 'wink', emoji: '😉', name: '眨眼' },
      { id: 'cool', emoji: '😎', name: '酷' },
      { id: 'thinking', emoji: '🤔', name: '思考' },
      { id: 'surprised', emoji: '😮', name: '惊讶' },
    ]
  },
  love: {
    name: '爱心',
    icon: <HeartOutlined />,
    stickers: [
      { id: 'red_heart', emoji: '❤️', name: '红心' },
      { id: 'pink_heart', emoji: '💖', name: '粉心' },
      { id: 'yellow_heart', emoji: '💛', name: '黄心' },
      { id: 'green_heart', emoji: '💚', name: '绿心' },
      { id: 'blue_heart', emoji: '💙', name: '蓝心' },
      { id: 'purple_heart', emoji: '💜', name: '紫心' },
      { id: 'broken_heart', emoji: '💔', name: '心碎' },
      { id: 'sparkling_heart', emoji: '💖', name: '闪亮心' },
    ]
  },
  celebration: {
    name: '庆祝',
    icon: <StarOutlined />,
    stickers: [
      { id: 'party', emoji: '🎉', name: '派对' },
      { id: 'balloon', emoji: '🎈', name: '气球' },
      { id: 'gift', emoji: '🎁', name: '礼物' },
      { id: 'cake', emoji: '🎂', name: '蛋糕' },
      { id: 'star', emoji: '⭐', name: '星星' },
      { id: 'firework', emoji: '🎆', name: '烟花' },
      { id: 'crown', emoji: '👑', name: '皇冠' },
      { id: 'trophy', emoji: '🏆', name: '奖杯' },
    ]
  },
  text: {
    name: '文字',
    icon: <GiftOutlined />,
    stickers: [
      { id: 'custom_text', text: '自定义文字', style: { fontSize: '32px', fontWeight: 'bold', color: '#1890ff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', fontFamily: '"Microsoft YaHei", sans-serif' }, isCustom: true, name: '添加自定义文字' },
      { id: 'wow', text: 'WOW!', style: { fontSize: '32px', fontWeight: 'bold', color: '#ff4d4f', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', fontFamily: 'Impact, sans-serif' }},
      { id: 'love', text: 'LOVE', style: { fontSize: '28px', fontWeight: 'bold', color: '#eb2f96', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', fontFamily: '"Comic Sans MS", cursive' }},
      { id: 'cool', text: 'COOL', style: { fontSize: '30px', fontWeight: 'bold', color: '#1890ff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', fontFamily: 'Impact, sans-serif' }},
      { id: 'awesome', text: 'AWESOME', style: { fontSize: '24px', fontWeight: 'bold', color: '#52c41a', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', fontFamily: 'Arial, sans-serif' }},
      { id: 'happy', text: 'HAPPY', style: { fontSize: '28px', fontWeight: 'bold', color: '#faad14', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', fontFamily: '"Comic Sans MS", cursive' }},
      { id: 'best', text: 'BEST', style: { fontSize: '30px', fontWeight: 'bold', color: '#722ed1', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', fontFamily: 'Georgia, serif' }},
    ]
  }
}

const ImageEditor = ({ 
  visible, 
  onCancel, 
  onConfirm,
  imageUrl,
  initialTransform,
  aspectRatio = 16/9,
  photos = [],
  currentPhotoId,
  onStickerApply
}) => {
  // 变换状态
  const [transform, setTransform] = useState({
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0,
    ...initialTransform
  })
  
  // 保存原始的初始状态，用于重置到图片的真正原始状态
  const originalTransform = useRef({
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0
  })

  // 贴纸状态
  const [stickers, setStickers] = useState([])
  const [selectedSticker, setSelectedSticker] = useState(null)
  const [draggedSticker, setDraggedSticker] = useState(null)
  const [stickerDragStart, setStickerDragStart] = useState({ x: 0, y: 0 })
  const [editingText, setEditingText] = useState(null) // 正在编辑的文字贴纸ID

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [transformStart, setTransformStart] = useState({ x: 0, y: 0 })

  // 应用范围状态
  const [applyScope, setApplyScope] = useState('all') // 'current' | 'selected' | 'all'
  const [selectedPhotos, setSelectedPhotos] = useState([])

  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // 重置变换状态和初始化贴纸状态
  useEffect(() => {
    if (visible) {
      // 设置当前图片的变换状态（可能已经被编辑过）
      setTransform({
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0,
        ...initialTransform
      })
      
      // 初始化当前图片的贴纸状态
      const currentPhoto = photos.find(p => p.id === currentPhotoId)
      setStickers(currentPhoto?.stickers || [])
      setSelectedSticker(null)
      setEditingText(null)
      setApplyScope('all')
      setSelectedPhotos([])
    }
  }, [visible, initialTransform, currentPhotoId, photos])

  // 添加贴纸
  const addSticker = (stickerData) => {
    if (stickerData.isCustom) {
      // 对于自定义文字，直接进入编辑模式
      const newSticker = {
        id: Date.now(),
        ...stickerData,
        text: '点击编辑文字',
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
      }
      setStickers(prev => [...prev, newSticker])
      setSelectedSticker(newSticker.id)
      setEditingText(newSticker.id)
    } else {
      const newSticker = {
        id: Date.now(),
        ...stickerData,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
      }
      setStickers(prev => [...prev, newSticker])
      setSelectedSticker(newSticker.id)
    }
  }

  // 删除贴纸
  const deleteSticker = (stickerId) => {
    setStickers(prev => prev.filter(s => s.id !== stickerId))
    if (selectedSticker === stickerId) {
      setSelectedSticker(null)
    }
  }

  // 更新贴纸属性
  const updateSticker = (stickerId, updates) => {
    setStickers(prev => prev.map(s => 
      s.id === stickerId ? { ...s, ...updates } : s
    ))
  }

  // 贴纸拖拽处理
  const handleStickerMouseDown = (e, sticker) => {
    e.stopPropagation()
    setDraggedSticker(sticker.id)
    setSelectedSticker(sticker.id)
    setStickerDragStart({ x: e.clientX, y: e.clientY })
  }

  // 双击编辑文字
  const handleStickerDoubleClick = (e, sticker) => {
    e.stopPropagation()
    if (sticker.text) {
      setEditingText(sticker.id)
    }
  }

  const handleStickerDrag = useCallback((e) => {
    if (!draggedSticker) return
    
    const deltaX = e.clientX - stickerDragStart.x
    const deltaY = e.clientY - stickerDragStart.y
    
    updateSticker(draggedSticker, {
      x: stickers.find(s => s.id === draggedSticker)?.x + deltaX,
      y: stickers.find(s => s.id === draggedSticker)?.y + deltaY
    })
    
    setStickerDragStart({ x: e.clientX, y: e.clientY })
  }, [draggedSticker, stickerDragStart, stickers])

  const handleStickerDragEnd = useCallback(() => {
    setDraggedSticker(null)
  }, [])

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

  // 重置所有变换到原始状态
  const handleReset = useCallback(() => {
    setTransform({ ...originalTransform.current })
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
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      setTransform(prev => ({
        ...prev,
        x: transformStart.x + deltaX,
        y: transformStart.y + deltaY
      }))
    } else if (draggedSticker) {
      handleStickerDrag(e)
    }
  }, [isDragging, dragStart, transformStart, draggedSticker, handleStickerDrag])

  // 鼠标抬起结束拖拽
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    handleStickerDragEnd()
  }, [handleStickerDragEnd])

  // 滚轮缩放
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    handleZoom(delta)
  }, [handleZoom])

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging || draggedSticker) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, draggedSticker, handleMouseMove, handleMouseUp])

  // 应用图片编辑（只作用于当前图片）
  const handleApplyImageEdit = () => {
    const result = {
      transform,
      stickers: [], // 图片编辑不包含贴纸
      applyScope: 'current',
      selectedPhotos: []
    }
    
    onConfirm(result)
    message.success('图片编辑已应用到当前图片')
  }

  // 应用贴纸（可以选择范围）
  const handleApplyStickers = () => {
    if (stickers.length === 0) {
      message.warning('请先添加贴纸')
      return
    }

    let targetPhotoIds = []
    
    switch (applyScope) {
      case 'current':
        targetPhotoIds = [currentPhotoId]
        break
      case 'selected':
        targetPhotoIds = selectedPhotos
        break
      case 'all':
        targetPhotoIds = photos.map(p => p.id)
        break
    }
    
    if (onStickerApply) {
      onStickerApply(stickers, targetPhotoIds)
      message.success(`贴纸已应用到 ${targetPhotoIds.length} 张图片`)
    }
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

  // 计算贴纸样式
  const getStickerStyle = (sticker) => {
    const baseSize = sticker.emoji ? 48 : 32
    return {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: `translate(calc(-50% + ${sticker.x}px), calc(-50% + ${sticker.y}px)) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
      fontSize: sticker.emoji ? `${baseSize * sticker.scale}px` : undefined,
      cursor: 'move',
      userSelect: 'none',
      zIndex: selectedSticker === sticker.id ? 1000 : 100,
      border: selectedSticker === sticker.id ? '2px dashed #1890ff' : 'none',
      borderRadius: '4px',
      padding: '4px',
      background: selectedSticker === sticker.id ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
      ...sticker.style
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div style={{ 
      display: 'flex',
      gap: '20px',
      width: '100%',
      padding: '20px',
      background: '#fff',
      borderRadius: '8px',
      border: '1px solid #d9d9d9',
      marginTop: '16px'
    }}>
      
      {/* 左侧：编辑区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 标题 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: '12px'
        }}>
          <Text strong style={{ fontSize: '16px' }}>图片编辑器</Text>
          <Button 
            icon={<CloseOutlined />} 
            onClick={onCancel}
            type="text"
            size="small"
            title="收起编辑器"
          />
        </div>
        
        {/* 编辑区域 */}
        <div
          style={{
            position: 'relative',
            alignSelf: 'center',
            width: '100%',
            maxWidth: '700px',
            height: '400px',
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

            {/* 贴纸层 */}
            {stickers.map(sticker => (
              <div
                key={sticker.id}
                style={getStickerStyle(sticker)}
                onMouseDown={(e) => handleStickerMouseDown(e, sticker)}
                onDoubleClick={(e) => handleStickerDoubleClick(e, sticker)}
              >
                {sticker.emoji ? (
                  <span>{sticker.emoji}</span>
                ) : editingText === sticker.id ? (
                  <Input
                    value={sticker.text}
                    onChange={(e) => updateSticker(sticker.id, { text: e.target.value })}
                    onBlur={() => setEditingText(null)}
                    onPressEnter={() => setEditingText(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingText(null)
                      }
                    }}
                    autoFocus
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '2px solid #1890ff',
                      borderRadius: '4px',
                      textAlign: 'center',
                      minWidth: '100px',
                      boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                      ...sticker.style,
                      fontSize: `${parseInt(sticker.style.fontSize) * sticker.scale}px`
                    }}
                    placeholder="输入文字内容"
                  />
                ) : (
                  <span 
                    style={sticker.style}
                    title="双击编辑文字"
                  >
                    {sticker.text}
                  </span>
                )}
                
                {/* 选中状态的控制点 */}
                {selectedSticker === sticker.id && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '16px',
                        height: '16px',
                        background: '#ff4d4f',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'white'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSticker(sticker.id)
                      }}
                    >
                      ×
                    </div>
                    {/* 编辑/确认按钮（仅文字贴纸显示） */}
                    {sticker.text && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '-8px',
                          width: '16px',
                          height: '16px',
                          background: editingText === sticker.id ? '#1890ff' : '#52c41a',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: 'white'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingText === sticker.id) {
                            setEditingText(null) // 确认编辑
                          } else {
                            setEditingText(sticker.id) // 开始编辑
                          }
                        }}
                        title={editingText === sticker.id ? "确认编辑" : "编辑文字"}
                      >
                        {editingText === sticker.id ? '✓' : '✎'}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
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
              const containerWidth = 700
              const containerHeight = 400
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

        {/* 基础控制面板 */}
        <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px' }}>
          <Row gutter={[16, 16]}>
            {/* 缩放控制 */}
            <Col span={12}>
              <Text strong>图片缩放 ({Math.round(transform.scale * 100)}%)</Text>
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
                </Space>
              </div>
            </Col>

            {/* 旋转控制 */}
            <Col span={12}>
              <Text strong>图片旋转 ({transform.rotation}°)</Text>
              <div style={{ marginTop: '8px' }}>
                <Space>
                  <Button
                    icon={<RotateLeftOutlined />}
                    onClick={() => handleRotation(-15)}
                    size="small"
                  />
                  <Button
                    icon={<RotateRightOutlined />}
                    onClick={() => handleRotation(15)}
                    size="small"
                  />
                  <Button
                    onClick={handleCenter}
                    size="small"
                  >
                    居中
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>

          {/* 贴纸控制 */}
          {selectedSticker && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>贴纸缩放</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Slider
                      min={0.5}
                      max={3}
                      step={0.1}
                      value={stickers.find(s => s.id === selectedSticker)?.scale || 1}
                      onChange={(value) => updateSticker(selectedSticker, { scale: value })}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <Text strong>贴纸旋转</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Space>
                      <Button
                        icon={<RotateLeftOutlined />}
                        onClick={() => {
                          const currentSticker = stickers.find(s => s.id === selectedSticker)
                          updateSticker(selectedSticker, { rotation: (currentSticker?.rotation || 0) - 15 })
                        }}
                        size="small"
                      />
                      <Button
                        icon={<RotateRightOutlined />}
                        onClick={() => {
                          const currentSticker = stickers.find(s => s.id === selectedSticker)
                          updateSticker(selectedSticker, { rotation: (currentSticker?.rotation || 0) + 15 })
                        }}
                        size="small"
                      />
                    </Space>
                  </div>
                </Col>
              </Row>
              
              {/* 文字贴纸特殊控制 */}
              {stickers.find(s => s.id === selectedSticker)?.text && (
                <>
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={8}>
                      <Text strong>文字颜色</Text>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {['#ff4d4f', '#eb2f96', '#1890ff', '#52c41a', '#faad14', '#722ed1', '#ffffff', '#000000'].map(color => (
                          <div
                            key={color}
                            style={{
                              width: '20px',
                              height: '20px',
                              background: color,
                              border: '1px solid #d9d9d9',
                              borderRadius: '2px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const currentSticker = stickers.find(s => s.id === selectedSticker)
                              updateSticker(selectedSticker, {
                                style: { ...currentSticker.style, color }
                              })
                            }}
                          />
                        ))}
                      </div>
                    </Col>
                    <Col span={8}>
                      <Text strong>字体大小</Text>
                      <div style={{ marginTop: '8px' }}>
                        <Slider
                          min={12}
                          max={60}
                          value={parseInt(stickers.find(s => s.id === selectedSticker)?.style?.fontSize) || 32}
                          onChange={(value) => {
                            const currentSticker = stickers.find(s => s.id === selectedSticker)
                            updateSticker(selectedSticker, {
                              style: { ...currentSticker.style, fontSize: `${value}px` }
                            })
                          }}
                        />
                      </div>
                    </Col>
                    <Col span={8}>
                      <Text strong>{editingText === selectedSticker ? '确认编辑' : '编辑文字'}</Text>
                      <div style={{ marginTop: '8px' }}>
                        <Button
                          type={editingText === selectedSticker ? "default" : "primary"}
                          size="small"
                          onClick={() => {
                            if (editingText === selectedSticker) {
                              setEditingText(null) // 确认编辑
                            } else {
                              setEditingText(selectedSticker) // 开始编辑
                            }
                          }}
                          style={{ width: '100%' }}
                        >
                          {editingText === selectedSticker ? '确认' : '编辑内容'}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  
                  {/* 字体选择和样式 */}
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={12}>
                      <Text strong>字体选择</Text>
                      <div style={{ marginTop: '8px' }}>
                        <Select
                          key={`font-${selectedSticker}`}
                          value={stickers.find(s => s.id === selectedSticker)?.style?.fontFamily || '"Microsoft YaHei", sans-serif'}
                          onChange={(value) => {
                            const currentSticker = stickers.find(s => s.id === selectedSticker)
                            updateSticker(selectedSticker, {
                              style: { ...currentSticker.style, fontFamily: value }
                            })
                          }}
                          style={{ width: '100%' }}
                          size="small"
                          placeholder="选择字体"
                        >
                          {fontFamilies.map(font => (
                            <Option key={font.value} value={font.value}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px' }}>{font.name}</span>
                                <span style={{ 
                                  fontFamily: font.value, 
                                  fontSize: '11px', 
                                  color: '#666',
                                  fontWeight: 'bold'
                                }}>
                                  {font.preview}
                                </span>
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text strong>字体样式</Text>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                        <Button
                          size="small"
                          type={stickers.find(s => s.id === selectedSticker)?.style?.fontWeight === 'bold' ? 'primary' : 'default'}
                          onClick={() => {
                            const currentSticker = stickers.find(s => s.id === selectedSticker)
                            const currentWeight = currentSticker?.style?.fontWeight
                            updateSticker(selectedSticker, {
                              style: { 
                                ...currentSticker.style, 
                                fontWeight: currentWeight === 'bold' ? 'normal' : 'bold'
                              }
                            })
                          }}
                          style={{ flex: 1, fontSize: '10px', fontWeight: 'bold' }}
                        >
                          粗体
                        </Button>
                        <Button
                          size="small"
                          type={stickers.find(s => s.id === selectedSticker)?.style?.fontStyle === 'italic' ? 'primary' : 'default'}
                          onClick={() => {
                            const currentSticker = stickers.find(s => s.id === selectedSticker)
                            const currentStyle = currentSticker?.style?.fontStyle
                            updateSticker(selectedSticker, {
                              style: { 
                                ...currentSticker.style, 
                                fontStyle: currentStyle === 'italic' ? 'normal' : 'italic'
                              }
                            })
                          }}
                          style={{ flex: 1, fontSize: '10px', fontStyle: 'italic' }}
                        >
                          斜体
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  
                  {/* 文字效果 */}
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={24}>
                      <Text strong>文字效果</Text>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          type={stickers.find(s => s.id === selectedSticker)?.style?.textShadow?.includes('2px 2px 4px') ? 'primary' : 'default'}
                          onClick={() => {
                            const currentSticker = stickers.find(s => s.id === selectedSticker)
                            const hasShadow = currentSticker?.style?.textShadow?.includes('2px 2px 4px')
                            updateSticker(selectedSticker, {
                              style: { 
                                ...currentSticker.style, 
                                textShadow: hasShadow ? 'none' : '2px 2px 4px rgba(0,0,0,0.5)'
                              }
                            })
                          }}
                          style={{ fontSize: '10px' }}
                        >
                          阴影
                        </Button>
                        <Button
                          size="small"
                          type={stickers.find(s => s.id === selectedSticker)?.style?.textDecoration === 'underline' ? 'primary' : 'default'}
                          onClick={() => {
                            const currentSticker = stickers.find(s => s.id === selectedSticker)
                            const hasUnderline = currentSticker?.style?.textDecoration === 'underline'
                            updateSticker(selectedSticker, {
                              style: { 
                                ...currentSticker.style, 
                                textDecoration: hasUnderline ? 'none' : 'underline'
                              }
                            })
                          }}
                          style={{ fontSize: '10px' }}
                        >
                          下划线
                        </Button>
                        <Button
                          size="small"
                          type={stickers.find(s => s.id === selectedSticker)?.style?.textDecoration === 'line-through' ? 'primary' : 'default'}
                          onClick={() => {
                            const currentSticker = stickers.find(s => s.id === selectedSticker)
                            const hasStrikethrough = currentSticker?.style?.textDecoration === 'line-through'
                            updateSticker(selectedSticker, {
                              style: { 
                                ...currentSticker.style, 
                                textDecoration: hasStrikethrough ? 'none' : 'line-through'
                              }
                            })
                          }}
                          style={{ fontSize: '10px' }}
                        >
                          删除线
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 右侧：贴纸选择和应用设置 */}
      <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 贴纸选择 */}
        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', flex: 1 }}>
          <Text strong style={{ display: 'block', marginBottom: '12px' }}>选择贴纸</Text>
          
          <Tabs
            size="small"
            items={Object.entries(stickerCategories).map(([key, category]) => ({
              key,
              label: (
                <span style={{ fontSize: '12px' }}>
                  {category.icon} {category.name}
                </span>
              ),
              children: (
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  {category.stickers.map(sticker => (
                    <div
                      key={sticker.id}
                      style={{
                        padding: '8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: '#fff',
                        transition: 'all 0.2s',
                        fontSize: sticker.emoji ? '20px' : '12px',
                        fontWeight: sticker.text ? 'bold' : 'normal'
                      }}
                      onClick={() => addSticker(sticker)}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)'
                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)'
                        e.target.style.boxShadow = 'none'
                      }}
                      title={sticker.name}
                    >
                      {sticker.emoji ? (
                        <div>{sticker.emoji}</div>
                      ) : (
                        <div style={{ ...sticker.style, fontSize: '10px' }}>{sticker.text}</div>
                      )}
                    </div>
                  ))}
                </div>
              )
            }))}
          />
        </div>

        {/* 贴纸应用范围设置 */}
        <div style={{ background: '#e6f7ff', padding: '16px', borderRadius: '8px' }}>
          <Text strong style={{ display: 'block', marginBottom: '12px' }}>贴纸应用范围</Text>
          
          <Select
            value={applyScope}
            onChange={setApplyScope}
            style={{ width: '100%', marginBottom: '12px' }}
            size="small"
          >
            <Option value="current">仅当前图片</Option>
            <Option value="selected">选择的图片</Option>
            <Option value="all">所有图片</Option>
          </Select>

          {applyScope === 'selected' && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                选择要应用贴纸的图片：
              </Text>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {photos.map(photo => (
                  <div key={photo.id} style={{ marginBottom: '4px' }}>
                    <Checkbox
                      checked={selectedPhotos.includes(photo.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPhotos(prev => [...prev, photo.id])
                        } else {
                          setSelectedPhotos(prev => prev.filter(id => id !== photo.id))
                        }
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>{photo.name}</span>
                    </Checkbox>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stickers.length > 0 && (
            <div style={{ marginTop: '12px', padding: '8px', background: '#fff', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                当前已添加 {stickers.length} 个贴纸
              </Text>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleApplyImageEdit}
            size="large"
            style={{ width: '100%' }}
            disabled={
              transform.scale === (initialTransform?.scale || 1) && 
              transform.rotation === (initialTransform?.rotation || 0) && 
              transform.x === (initialTransform?.x || 0) && 
              transform.y === (initialTransform?.y || 0)
            }
          >
            应用图片编辑
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleApplyStickers}
            size="large"
            style={{ width: '100%', background: '#52c41a', borderColor: '#52c41a' }}
            disabled={stickers.length === 0 || (applyScope === 'selected' && selectedPhotos.length === 0)}
          >
            应用贴纸装饰
          </Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              icon={<UndoOutlined />}
              onClick={() => {
                // 重置图片编辑状态到原始状态
                setTransform({ ...originalTransform.current })
              }}
              size="large"
              style={{ flex: 1 }}
              title="重置图片编辑到原始未编辑状态"
            >
              重置图片编辑
            </Button>
            <Button
              icon={<UndoOutlined />}
              onClick={() => {
                // 重置贴纸相关状态
                setStickers([])
                setSelectedSticker(null)
                setEditingText(null)
                setApplyScope('all')
                setSelectedPhotos([])
              }}
              size="large"
              style={{ flex: 1 }}
              title="清除所有贴纸"
            >
              清除贴纸
            </Button>
          </div>
        </div>


      </div>
    </div>
  )
}

export default ImageEditor 