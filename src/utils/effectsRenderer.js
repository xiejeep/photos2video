/**
 * 效果渲染工具
 * 统一预览和导出的效果处理逻辑，确保一致性
 */

export class EffectsRenderer {
  /**
   * 将CSS滤镜转换为Canvas可用的描述
   * @param {Object} effects 效果参数
   * @returns {string} CSS filter 字符串
   */
  static getCSSFilter(effects) {
    const filters = []
    
    // 亮度
    if (effects.brightness) {
      filters.push(`brightness(${1 + effects.brightness / 100})`)
    }
    
    // 对比度
    if (effects.contrast) {
      filters.push(`contrast(${1 + effects.contrast / 100})`)
    }

    // 预设滤镜
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

  /**
   * 计算Ken Burns缩放值
   * @param {boolean} enabled 是否启用Ken Burns
   * @param {number} time 当前时间（秒）
   * @returns {number} 缩放值
   */
  static getKenBurnsScale(enabled, time = Date.now() / 1000) {
    if (!enabled) return 1
    
    const animationDuration = 4 // 4秒循环
    const timeInCycle = time % animationDuration
    const animationProgress = timeInCycle / animationDuration
    
    // 使用正弦函数创建平滑的来回缩放（5%-10%缩放范围）
    const scaleVariation = Math.sin(animationProgress * Math.PI * 2) * 0.025 + 0.075
    return 1 + scaleVariation
  }

  /**
   * 计算图片在容器中的显示尺寸和位置（object-fit: contain 逻辑）
   * @param {number} imgWidth 图片宽度
   * @param {number} imgHeight 图片高度  
   * @param {number} containerWidth 容器宽度
   * @param {number} containerHeight 容器高度
   * @returns {Object} 显示信息 {width, height, x, y}
   */
  static getContainDisplayInfo(imgWidth, imgHeight, containerWidth, containerHeight) {
    const imgRatio = imgWidth / imgHeight
    const containerRatio = containerWidth / containerHeight
    
    let displayWidth, displayHeight, x, y
    
    if (imgRatio > containerRatio) {
      // 图片更宽，以容器宽度为准
      displayWidth = containerWidth
      displayHeight = containerWidth / imgRatio
      x = 0
      y = (containerHeight - displayHeight) / 2
    } else {
      // 图片更高或比例相同，以容器高度为准
      displayHeight = containerHeight
      displayWidth = containerHeight * imgRatio
      x = (containerWidth - displayWidth) / 2
      y = 0
    }
    
    return { width: displayWidth, height: displayHeight, x, y }
  }

  /**
   * 生成预览样式对象
   * @param {Object} effects 效果参数
   * @param {Object} options 额外选项
   * @returns {Object} React样式对象
   */
  static getPreviewStyle(effects, options = {}) {
    const style = {
      filter: this.getCSSFilter(effects),
      objectFit: 'contain'
    }

    // Ken Burns 动画
    if (effects.kenBurns) {
      style.animation = 'kenBurns 4s ease-in-out infinite alternate'
    }

    // 转场相关样式
    if (options.transition) {
      Object.assign(style, options.transition)
    }

    return style
  }

  /**
   * 验证效果参数的有效性
   * @param {Object} effects 效果参数
   * @returns {Object} 验证后的效果参数
   */
  static validateEffects(effects = {}) {
    const validated = { ...effects }
    
    // 确保数值参数在合理范围内
    if (validated.brightness !== undefined) {
      validated.brightness = Math.max(-100, Math.min(100, validated.brightness))
    }
    
    if (validated.contrast !== undefined) {
      validated.contrast = Math.max(-100, Math.min(100, validated.contrast))
    }
    
    if (validated.duration !== undefined) {
      validated.duration = Math.max(1, Math.min(10, validated.duration))
    }

    // 确保滤镜值有效
    const validFilters = ['none', 'grayscale', 'vintage', 'warm', 'cool', 'contrast', 'soft', 'vivid']
    if (!validFilters.includes(validated.filter)) {
      validated.filter = 'none'
    }

    // 确保转场效果有效
    const validTransitions = ['none', 'fade', 'slide', 'zoom', 'rotate']
    if (!validTransitions.includes(validated.transition)) {
      validated.transition = 'fade'
    }

    return validated
  }
} 