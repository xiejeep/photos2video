import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Modal, Button, Space, Slider, Input, Typography, Row, Col, Divider, Tabs, Select, Checkbox, message, Tag } from 'antd'
import { useDeviceDetection } from '../utils/deviceDetector'
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

// 滤镜选项
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
  onStickerApply,
  // 新增的特效相关props
  effects = {},
  onEffectsChange
}) => {
  // 设备检测
  const { hasMouse, hasTouch, inputType } = useDeviceDetection()

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

  // 处理应用范围变化
  const handleApplyScopeChange = (newScope) => {
    setApplyScope(newScope)
    
    // 当应用范围改变时，重新应用当前特效设置
    let targetPhotoIds = []
    
    switch (newScope) {
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
    
    // 重新应用当前特效到新的目标范围
    if (onEffectsChange && targetPhotoIds.length > 0) {
      onEffectsChange(currentEffects, targetPhotoIds, newScope)
    }
  }

  // 特效状态
  const [currentEffects, setCurrentEffects] = useState({
    filter: 'none',
    brightness: 0,
    contrast: 0,
    ...effects
  })

  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const lastPhotoIdRef = useRef(null)
  const initializedRef = useRef(false)

  // 当组件初始化或图片切换时设置变换状态
  useEffect(() => {
    if (visible && currentPhotoId) {
      // 检查是否是组件初始化或图片切换
      const isPhotoChange = lastPhotoIdRef.current !== currentPhotoId
      const isInitialization = !initializedRef.current
      
      if (isInitialization || isPhotoChange) {
        // 使用传入的initialTransform，如果没有则使用默认值
        setTransform({
          scale: initialTransform?.scale || 1,
          rotation: initialTransform?.rotation || 0,
          x: initialTransform?.x || 0,
          y: initialTransform?.y || 0
        })
        
        lastPhotoIdRef.current = currentPhotoId
        initializedRef.current = true
      }
    }
  }, [visible, currentPhotoId, initialTransform]) // 添加initialTransform依赖，确保图片切换时使用正确的变换状态

  // 单独处理贴纸状态变化，不影响变换状态
  useEffect(() => {
    if (visible) {
      // 初始化当前图片的贴纸状态
      const currentPhoto = photos.find(p => p.id === currentPhotoId)
      setStickers(currentPhoto?.stickers || [])
      setSelectedSticker(null)
      setEditingText(null)
      setApplyScope('all')
      setSelectedPhotos([])
    }
  }, [visible, currentPhotoId, photos])

  // 仅在组件首次显示时初始化特效状态
  useEffect(() => {
    if (visible) {
      setCurrentEffects({
        filter: 'none',
        brightness: 0,
        contrast: 0,
        ...effects
      })
    }
  }, [visible]) // 移除effects依赖，避免外部effects变化导致重置

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

  // 缩放操作 - 更新状态并自动保存
  const handleZoom = useCallback((delta) => {
    const newTransform = {
      ...transform,
      scale: Math.max(0.1, Math.min(5, transform.scale + delta))
    }
    setTransform(newTransform)
    
    // 自动保存变换状态
    const result = {
      transform: newTransform,
      stickers: [],
      applyScope: 'current',
      selectedPhotos: []
    }
    onConfirm(result)
  }, [transform, onConfirm])

  // 旋转操作 - 更新状态并自动保存
  const handleRotation = useCallback((delta) => {
    const newTransform = {
      ...transform,
      rotation: (transform.rotation + delta) % 360
    }
    setTransform(newTransform)
    
    // 自动保存变换状态
    const result = {
      transform: newTransform,
      stickers: [],
      applyScope: 'current',
      selectedPhotos: []
    }
    onConfirm(result)
  }, [transform, onConfirm])

  // 重置位置 - 更新状态并自动保存
  const handleCenter = useCallback(() => {
    const newTransform = {
      ...transform,
      x: 0,
      y: 0
    }
    setTransform(newTransform)
    
    // 自动保存变换状态
    const result = {
      transform: newTransform,
      stickers: [],
      applyScope: 'current',
      selectedPhotos: []
    }
    onConfirm(result)
  }, [transform, onConfirm])

  // 重置所有变换到原始状态
  const handleReset = useCallback(() => {
    setTransform({ ...originalTransform.current })
  }, [])

  // 获取事件坐标（支持鼠标和触摸）
  const getEventCoords = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  // 鼠标/触摸按下开始拖拽
  const handleMouseDown = useCallback((e) => {
    if (e.type === 'mousedown' && e.button !== 0) return // 只响应左键
    
    const coords = getEventCoords(e)
    setIsDragging(true)
    setDragStart(coords)
    setTransformStart({ x: transform.x, y: transform.y })
    e.preventDefault()
  }, [transform.x, transform.y])

  // 鼠标/触摸移动拖拽
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const coords = getEventCoords(e)
      const deltaX = coords.x - dragStart.x
      const deltaY = coords.y - dragStart.y
      
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
    if (isDragging) {
      // 拖拽结束后自动保存变换状态
      const result = {
        transform,
        stickers: [],
        applyScope: 'current',
        selectedPhotos: []
      }
      onConfirm(result)
    }
    setIsDragging(false)
    handleStickerDragEnd()
  }, [isDragging, transform, onConfirm, handleStickerDragEnd])

  // 滚轮缩放 - 防抖自动保存
  const wheelTimeoutRef = useRef(null)
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.1, Math.min(5, transform.scale + delta))
    
    setTransform(prev => ({ ...prev, scale: newScale }))
    
    // 防抖处理，滚轮停止后才保存
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current)
    }
    wheelTimeoutRef.current = setTimeout(() => {
      const result = {
        transform: { ...transform, scale: newScale },
        stickers: [],
        applyScope: 'current',
        selectedPhotos: []
      }
      onConfirm(result)
    }, 300) // 300ms防抖
  }, [transform, onConfirm])

  // 触摸缩放支持
  const touchStartDistance = useRef(null)
  const touchStartScale = useRef(null)
  
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return null
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // 双指触摸，准备缩放
      touchStartDistance.current = getTouchDistance(e.touches)
      touchStartScale.current = transform.scale
      e.preventDefault()
    } else if (e.touches.length === 1) {
      // 单指触摸，拖拽
      handleMouseDown(e)
    }
  }, [transform.scale, handleMouseDown])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && touchStartDistance.current && touchStartScale.current) {
      // 双指缩放
      const currentDistance = getTouchDistance(e.touches)
      if (currentDistance) {
        const scaleChange = currentDistance / touchStartDistance.current
        const newScale = Math.max(0.1, Math.min(5, touchStartScale.current * scaleChange))
        
        setTransform(prev => ({ ...prev, scale: newScale }))
        e.preventDefault()
      }
    } else {
      // 单指拖拽
      handleMouseMove(e)
    }
  }, [handleMouseMove])

  const handleTouchEnd = useCallback((e) => {
    if (touchStartDistance.current && touchStartScale.current) {
      // 缩放结束，保存状态
      const result = {
        transform,
        stickers: [],
        applyScope: 'current',
        selectedPhotos: []
      }
      onConfirm(result)
      
      touchStartDistance.current = null
      touchStartScale.current = null
    }
    handleMouseUp()
  }, [transform, onConfirm, handleMouseUp])

  // 添加全局事件监听（支持鼠标和触摸）
  useEffect(() => {
    if (isDragging || draggedSticker) {
      // 鼠标事件
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      // 触摸事件
      document.addEventListener('touchmove', handleMouseMove, { passive: false })
      document.addEventListener('touchend', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleMouseMove)
        document.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [isDragging, draggedSticker, handleMouseMove, handleMouseUp])



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

  // 处理特效变化
  const handleEffectChange = (field, value) => {
    const newEffects = { ...currentEffects, [field]: value }
    setCurrentEffects(newEffects)
    
    // 立即应用特效，根据当前应用范围
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
    
    // 实时更新全局特效并应用到选定的图片
    if (onEffectsChange) {
      onEffectsChange(newEffects, targetPhotoIds, applyScope)
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

  // 生成CSS滤镜字符串
  const getFilterStyle = () => {
    let filters = []
    
    // 亮度
    if (currentEffects.brightness !== 0) {
      const brightness = 1 + (currentEffects.brightness / 100)
      filters.push(`brightness(${brightness})`)
    }
    
    // 对比度
    if (currentEffects.contrast !== 0) {
      const contrast = 1 + (currentEffects.contrast / 100)
      filters.push(`contrast(${contrast})`)
    }
    
    // 滤镜效果
    switch (currentEffects.filter) {
      case 'grayscale':
        filters.push('grayscale(100%)')
        break
      case 'vintage':
        filters.push('sepia(60%) saturate(120%) hue-rotate(15deg)')
        break
      case 'warm':
        filters.push('hue-rotate(15deg) saturate(110%)')
        break
      case 'cool':
        filters.push('hue-rotate(-15deg) saturate(110%)')
        break
      case 'contrast':
        filters.push('contrast(140%)')
        break
      case 'soft':
        filters.push('blur(0.5px) brightness(1.1)')
        break
      case 'vivid':
        filters.push('saturate(150%) contrast(110%)')
        break
    }
    
    return filters.length > 0 ? filters.join(' ') : 'none'
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
      userSelect: 'none',
      filter: getFilterStyle(),
      transition: 'filter 0.3s ease'
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
      flexDirection: 'column',
      gap: '20px',
      width: '100%',
      padding: '20px',
      background: '#fff',
      borderRadius: '8px',
      border: '1px solid #d9d9d9',
      marginTop: '16px'
    }}>
      
      {/* 上方：图片编辑器 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 标题 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text strong style={{ fontSize: '16px' }}>图片编辑器</Text>
            <Tag 
              color={inputType === 'mouse' ? 'blue' : inputType === 'touch' ? 'green' : 'orange'}
              style={{ fontSize: '11px' }}
            >
              {inputType === 'mouse' ? '🖱️ 鼠标模式' : 
               inputType === 'touch' ? '👆 触摸模式' : 
               inputType === 'hybrid' ? '🖱️👆 混合模式' : '⌨️ 键盘模式'}
            </Tag>
          </div>
          <Button 
            icon={<CloseOutlined />} 
            onClick={onCancel}
            type="text"
            size="small"
            title="收起编辑器"
          />
        </div>
        
        {/* 编辑区域容器 - 水平布局 */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: '100%'
        }}>
          {/* 左侧：旋转缩放控制面板 */}
          <div style={{ 
            background: '#fafafa', 
            padding: '16px', 
            borderRadius: '8px',
            width: '200px',
            flexShrink: 0
          }}>
            <Text strong style={{ display: 'block', marginBottom: '8px', textAlign: 'center' }}>
              🎛️ 图片控制
            </Text>
            <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginBottom: '16px', textAlign: 'center' }}>
              调整后自动保存，导出时生效
            </Text>
            
            {/* 操作提示 - 根据设备类型显示 */}
            <div style={{ 
              fontSize: '9px', 
              color: '#666', 
              background: '#f0f0f0', 
              padding: '6px', 
              borderRadius: '4px', 
              marginBottom: '12px',
              lineHeight: '1.3'
            }}>
              {inputType === 'touch' ? (
                <>
                  👆 单指拖拽移动<br/>
                  🤏 双指缩放大小<br/>
                  📱 点击按钮操作
                </>
              ) : inputType === 'mouse' ? (
                <>
                  🖱️ 拖拽移动图片<br/>
                  🎡 滚轮缩放大小<br/>
                  🎯 点击按钮操作
                </>
              ) : (
                <>
                  🖱️👆 支持多种操作<br/>
                  拖拽、滚轮、触摸<br/>
                  均可使用
                </>
              )}
            </div>
            
            {/* 缩放控制 */}
            <div style={{ marginBottom: '20px' }}>
              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                图片缩放 ({Math.round(transform.scale * 100)}%)
              </Text>
              <div style={{ marginBottom: '8px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      icon={<ZoomOutOutlined />}
                      onClick={() => handleZoom(-0.1)}
                      disabled={transform.scale <= 0.1}
                      size="small"
                    />
                    <Button
                      icon={<ZoomInOutlined />}
                      onClick={() => handleZoom(0.1)}
                      disabled={transform.scale >= 5}
                      size="small"
                    />
                  </div>
                  <Slider
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={transform.scale}
                    onChange={(value) => {
                      const newTransform = { ...transform, scale: value }
                      setTransform(newTransform)
                    }}
                    onAfterChange={(value) => {
                      // 滑块拖拽结束后自动保存
                      const newTransform = { ...transform, scale: value }
                      const result = {
                        transform: newTransform,
                        stickers: [],
                        applyScope: 'current',
                        selectedPhotos: []
                      }
                      onConfirm(result)
                    }}
                    style={{ width: '100%' }}
                  />
                </Space>
              </div>
            </div>

            {/* 旋转控制 */}
            <div style={{ marginBottom: '20px' }}>
              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                图片旋转 ({transform.rotation}°)
              </Text>
              <div style={{ marginBottom: '8px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                  </div>
                  <Button
                    onClick={handleCenter}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    居中
                  </Button>
                </Space>
              </div>
            </div>

            {/* 重置按钮 */}
            <Button
              icon={<UndoOutlined />}
              onClick={() => {
                // 重置图片编辑状态到原始状态
                const resetTransform = { ...originalTransform.current }
                setTransform(resetTransform)
                
                // 自动保存重置状态
                const result = {
                  transform: resetTransform,
                  stickers: [],
                  applyScope: 'current',
                  selectedPhotos: []
                }
                onConfirm(result)
              }}
              size="small"
              style={{ width: '100%' }}
              title="重置图片编辑到原始未编辑状态"
            >
              重置编辑
            </Button>
          </div>

          {/* 中间：图片编辑区域 */}
          <div
            style={{
              position: 'relative',
              width: '700px',
              height: '400px',
              background: '#1a1a1a',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0
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
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
        </div>

        {/* 图片选择器 - 与图片编辑区域等宽 */}
        <div style={{ 
          background: '#f6ffed', 
          padding: '8px', 
          borderRadius: '8px', 
          border: '1px solid #b7eb8f', 
          marginTop: '12px',
          maxWidth: '700px',
          alignSelf: 'center' 
        }}>
          {/* 水平滚动的图片选择器 */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '8px', 
              overflowX: 'auto', 
              paddingBottom: '4px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#b7eb8f #f0f0f0'
            }}
            className="photo-selector-scroll"
          >
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  width: '80px',
                  height: '60px',
                  border: photo.id === currentPhotoId ? '3px solid #1890ff' : '1px solid #d9d9d9',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: '#fff',
                  transition: 'all 0.2s ease',
                  boxShadow: photo.id === currentPhotoId ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 2px 6px rgba(0,0,0,0.1)'
                }}
                onClick={() => {
                  // 切换到选中的图片
                  if (onConfirm) {
                    onConfirm({
                      transform: null,
                      stickers: [],
                      applyScope: 'current',
                      selectedPhotos: [],
                      action: 'switchPhoto',
                      photoId: photo.id
                    })
                  }
                }}
                onMouseEnter={(e) => {
                  if (photo.id !== currentPhotoId) {
                    e.target.style.transform = 'scale(1.05)'
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (photo.id !== currentPhotoId) {
                    e.target.style.transform = 'scale(1)'
                    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <img
                  src={photo.editedUrl || photo.url}
                  alt={`图片 ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                
                {/* 图片序号 */}
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  background: photo.id === currentPhotoId ? '#1890ff' : 'rgba(0,0,0,0.7)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  minWidth: '16px',
                  textAlign: 'center'
                }}>
                  {index + 1}
                </div>
                
                {/* 当前编辑指示器 */}
                {photo.id === currentPhotoId && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '2px',
                    background: '#1890ff',
                    color: 'white',
                    fontSize: '8px',
                    padding: '1px 3px',
                    borderRadius: '2px'
                  }}>
                    编辑中
                  </div>
                )}
                
                {/* 贴纸标识 */}
                {photo.hasStickers && (
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: '#52c41a',
                    color: 'white',
                    fontSize: '8px',
                    padding: '1px 3px',
                    borderRadius: '2px'
                  }}>
                    贴纸
                  </div>
                )}
                
                {/* 编辑状态标识 */}
                {photo.isEdited && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: '#fa8c16',
                    color: 'white',
                    fontSize: '8px',
                    padding: '1px 3px',
                    borderRadius: '2px'
                  }}>
                    已编辑
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 滚动提示 */}
          {photos.length > 4 && (
            <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '6px', textAlign: 'center' }}>
              💡 可以左右滚动查看更多图片
            </Text>
          )}
        </div>

        {/* 贴纸控制面板 */}
        <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px' }}>
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

      {/* 下方：特效控制、贴纸选择和应用设置（改为水平布局） */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        
        {/* 特效控制 */}
        <div style={{ background: '#fff1f0', padding: '16px', borderRadius: '8px', flex: '1', minWidth: '300px' }}>
          <Text strong style={{ display: 'block', marginBottom: '12px' }}>🎨 视觉特效</Text>
          
          {/* 滤镜选择 */}
          <div style={{ marginBottom: '16px' }}>
            <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>滤镜效果</Text>
            <Select
              value={currentEffects.filter}
              onChange={(value) => handleEffectChange('filter', value)}
              style={{ width: '100%' }}
              size="small"
            >
              {filterOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>
          
          {/* 亮度调节 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '12px' }}>亮度</Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>{currentEffects.brightness}</Text>
            </div>
            <Slider
              min={-50}
              max={50}
              value={currentEffects.brightness}
              onChange={(value) => handleEffectChange('brightness', value)}
              size="small"
              marks={{
                '-50': '暗',
                0: '标准',
                50: '亮'
              }}
              step={5}
            />
          </div>
          
          {/* 对比度调节 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text strong style={{ fontSize: '12px' }}>对比度</Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>{currentEffects.contrast}</Text>
            </div>
            <Slider
              min={-50}
              max={50}
              value={currentEffects.contrast}
              onChange={(value) => handleEffectChange('contrast', value)}
              size="small"
              marks={{
                '-50': '低',
                0: '标准',
                50: '高'
              }}
              step={5}
            />
          </div>

          {/* 特效应用说明 */}
          <div style={{ 
            padding: '8px', 
            background: '#e6f7ff', 
            borderRadius: '4px', 
            border: '1px solid #91d5ff'
          }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              💡 调整特效会立即应用到{applyScope === 'all' ? '所有图片' : applyScope === 'selected' ? '选中图片' : '当前图片'}
            </Text>
          </div>
        </div>
        
        {/* 贴纸选择 */}
        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', flex: '1', minWidth: '300px' }}>
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



        {/* 应用范围设置 */}
        <div style={{ background: '#e6f7ff', padding: '16px', borderRadius: '8px', flex: '0 0 280px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>🎯 应用范围</Text>
          <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '12px' }}>
            设置特效和贴纸的应用范围
          </Text>
          
          <Select
            value={applyScope}
            onChange={handleApplyScopeChange}
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
                选择目标图片：
              </Text>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {photos.map((photo, index) => (
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
                      <span style={{ fontSize: '12px' }}>图片 {index + 1}</span>
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

                {/* 贴纸操作按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            style={{ width: '100%' }}
            title="清除所有贴纸"
          >
            清除贴纸
          </Button>
        </div>
        </div>
      </div>
  )
}

export default ImageEditor 