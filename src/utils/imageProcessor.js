/**
 * 图片处理工具
 * 根据用户编辑参数生成裁剪后的图片
 */

/**
 * 处理图片：提取ImageEditor中可视区域的内容
 * @param {string} imageUrl - 原始图片URL
 * @param {Object} transform - 变换参数 {scale, rotation, x, y}
 * @param {number} aspectRatio - 目标宽高比 (width/height)
 * @param {number} outputWidth - 输出图片宽度，默认1920
 * @returns {Promise<string>} - 返回处理后图片的blob URL
 */
export const processImage = async (imageUrl, transform, aspectRatio, outputWidth = 1920) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        console.log('开始处理图片...')
        console.log('原始图片尺寸:', img.width, 'x', img.height)
        console.log('变换参数:', transform)
        
        // 计算输出尺寸
        const outputHeight = Math.round(outputWidth / aspectRatio)
        
        // ImageEditor固定尺寸
        const editorWidth = 800
        const editorHeight = 500
        
        // 第一步：创建临时canvas，完全重现ImageEditor的渲染
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = editorWidth
        tempCanvas.height = editorHeight
        
        // 黑色背景
        tempCtx.fillStyle = '#000000'
        tempCtx.fillRect(0, 0, editorWidth, editorHeight)
        
        // 计算图片在ImageEditor中的尺寸（模拟maxWidth: '100%', maxHeight: '100%'）
        const imgAspectRatio = img.width / img.height
        const containerAspectRatio = editorWidth / editorHeight
        
        let imgDisplayWidth, imgDisplayHeight
        if (imgAspectRatio > containerAspectRatio) {
          imgDisplayWidth = editorWidth
          imgDisplayHeight = editorWidth / imgAspectRatio
        } else {
          imgDisplayHeight = editorHeight
          imgDisplayWidth = imgDisplayHeight * imgAspectRatio
        }
        
        console.log('图片显示尺寸:', imgDisplayWidth, 'x', imgDisplayHeight)
        
        // 保存状态并应用变换（完全模拟ImageEditor的变换顺序）
        tempCtx.save()
        
        // 移动到编辑器中心（模拟flex布局的居中效果）
        tempCtx.translate(editorWidth / 2, editorHeight / 2)
        
        // 应用用户变换（模拟CSS transform的顺序：translate -> rotate -> scale）
        tempCtx.translate(transform.x, transform.y)
        
        if (transform.rotation) {
          tempCtx.rotate(transform.rotation * Math.PI / 180)
        }
        
        if (transform.scale && transform.scale !== 1) {
          tempCtx.scale(transform.scale, transform.scale)
        }
        
        // 绘制图片（以图片中心为原点）
        tempCtx.drawImage(
          img,
          -imgDisplayWidth / 2,
          -imgDisplayHeight / 2,
          imgDisplayWidth,
          imgDisplayHeight
        )
        
        tempCtx.restore()
        
        // 第二步：计算可视区域位置
        const maxViewWidth = 600
        const maxViewHeight = 400
        
        let viewWidth, viewHeight
        if (aspectRatio > maxViewWidth / maxViewHeight) {
          viewWidth = maxViewWidth
          viewHeight = maxViewWidth / aspectRatio
        } else {
          viewHeight = maxViewHeight
          viewWidth = maxViewHeight * aspectRatio
        }
        
        const viewLeft = (editorWidth - viewWidth) / 2
        const viewTop = (editorHeight - viewHeight) / 2
        
        console.log('可视区域:', viewLeft, viewTop, viewWidth, viewHeight)
        
        // 第三步：创建输出canvas并提取可视区域
        const outputCanvas = document.createElement('canvas')
        const outputCtx = outputCanvas.getContext('2d')
        outputCanvas.width = outputWidth
        outputCanvas.height = outputHeight
        
        // 直接从临时canvas提取可视区域并缩放到输出尺寸
        outputCtx.drawImage(
          tempCanvas,
          viewLeft, viewTop, viewWidth, viewHeight,  // 源区域
          0, 0, outputWidth, outputHeight            // 目标区域
        )
        
        console.log('图片处理完成')
        
        // 转换为blob
        outputCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            resolve(url)
          } else {
            reject(new Error('图片处理失败'))
          }
        }, 'image/jpeg', 0.9)
        
      } catch (error) {
        console.error('图片处理错误:', error)
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    
    img.src = imageUrl
  })
}

/**
 * 释放blob URL
 * @param {string} url - blob URL
 */
export const releaseBlobUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/**
 * 批量释放blob URLs
 * @param {string[]} urls - blob URL数组
 */
export const releaseBlobUrls = (urls) => {
  urls.forEach(url => releaseBlobUrl(url))
} 