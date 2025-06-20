import { useState, useEffect } from 'react'

// 设备检测工具
export const deviceDetector = {
  // 检测是否有鼠标
  hasMouse() {
    // 使用 matchMedia 检测指针精度
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    
    // 如果只有粗糙指针（触摸），则认为没有鼠标
    if (hasCoarsePointer && !hasFinePointer) {
      return false
    }
    
    // 如果有精确指针（鼠标），则认为有鼠标
    if (hasFinePointer) {
      return true
    }
    
    // 其他情况，检查用户代理字符串
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    
    return !isMobile
  },

  // 检测是否为触摸设备
  isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    )
  },

  // 检测是否为移动设备
  isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase()
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  },

  // 获取输入类型
  getInputType() {
    const hasMouse = this.hasMouse()
    const hasTouch = this.isTouchDevice()
    
    if (hasMouse && hasTouch) {
      return 'hybrid' // 混合输入（如带触摸屏的笔记本）
    } else if (hasMouse) {
      return 'mouse' // 纯鼠标
    } else if (hasTouch) {
      return 'touch' // 纯触摸
    } else {
      return 'keyboard' // 键盘导航
    }
  }
}

// React Hook 用于检测设备类型
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    hasMouse: deviceDetector.hasMouse(),
    hasTouch: deviceDetector.isTouchDevice(),
    isMobile: deviceDetector.isMobileDevice(),
    inputType: deviceDetector.getInputType()
  })

  useEffect(() => {
    // 监听媒体查询变化
    const finePointerQuery = window.matchMedia('(pointer: fine)')
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)')
    
    const updateDeviceInfo = () => {
      setDeviceInfo({
        hasMouse: deviceDetector.hasMouse(),
        hasTouch: deviceDetector.isTouchDevice(),
        isMobile: deviceDetector.isMobileDevice(),
        inputType: deviceDetector.getInputType()
      })
    }

    // 监听指针类型变化（当外接鼠标时）
    finePointerQuery.addListener(updateDeviceInfo)
    coarsePointerQuery.addListener(updateDeviceInfo)

    return () => {
      finePointerQuery.removeListener(updateDeviceInfo)
      coarsePointerQuery.removeListener(updateDeviceInfo)
    }
  }, [])

  return deviceInfo
} 