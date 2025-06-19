// 编解码器检测工具
export class CodecDetector {
  
  // 检测MediaRecorder支持的所有格式
  static getAllSupportedFormats() {
    const formats = [
      // MP4 相关
      'video/mp4',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1.42E01E', 
      'video/mp4;codecs=avc1.420028',
      'video/mp4;codecs=avc1.42001E',
      'video/mp4;codecs=h264',
      
      // WebM 相关
      'video/webm',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,vorbis',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      
      // 其他格式
      'video/x-matroska',
      'video/x-matroska;codecs=avc1.42E01E,mp4a.40.2'
    ]
    
    const supported = []
    const unsupported = []
    
    formats.forEach(format => {
      if (MediaRecorder.isTypeSupported(format)) {
        supported.push(format)
      } else {
        unsupported.push(format)
      }
    })
    
    return { supported, unsupported }
  }
  
  // 检测环境信息
  static getEnvironmentInfo() {
    const userAgent = navigator.userAgent
    const isElectron = userAgent.includes('Electron')
    const chromeVersion = userAgent.match(/Chrome\/(\d+)/)
    const electronVersion = userAgent.match(/Electron\/(\d+\.\d+\.\d+)/)
    
    return {
      userAgent,
      isElectron,
      chromeVersion: chromeVersion ? chromeVersion[1] : 'Unknown',
      electronVersion: electronVersion ? electronVersion[1] : 'Unknown',
      platform: navigator.platform,
      isWindows: navigator.platform.includes('Win'),
      isMac: navigator.platform.includes('Mac'),
      isLinux: navigator.platform.includes('Linux')
    }
  }
  
  // 详细的MP4支持检测
  static testMP4Support() {
    const mp4Formats = [
      'video/mp4',
      'video/mp4;codecs="avc1.42E01E"',
      'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
      'video/mp4;codecs="avc1.420028"',
      'video/mp4;codecs="avc1.42001E"',
      'video/mp4;codecs="h264"',
      'video/mp4;codecs="avc1.4D4028"'
    ]
    
    const results = mp4Formats.map(format => ({
      format,
      supported: MediaRecorder.isTypeSupported(format),
      description: this.getFormatDescription(format)
    }))
    
    return results
  }
  
  // 获取格式描述
  static getFormatDescription(format) {
    const descriptions = {
      'video/mp4': 'MP4 容器（无特定编解码器）',
      'video/mp4;codecs="avc1.42E01E"': 'MP4 + H.264 Baseline Profile',
      'video/mp4;codecs="avc1.42E01E,mp4a.40.2"': 'MP4 + H.264 + AAC',
      'video/mp4;codecs="avc1.420028"': 'MP4 + H.264 Baseline Profile Level 4.0',
      'video/mp4;codecs="avc1.42001E"': 'MP4 + H.264 Baseline Profile Level 3.0',
      'video/mp4;codecs="h264"': 'MP4 + H.264 (通用)',
      'video/mp4;codecs="avc1.4D4028"': 'MP4 + H.264 Main Profile Level 4.0',
      'video/webm': 'WebM 容器',
      'video/webm;codecs=vp9,opus': 'WebM + VP9 + Opus',
      'video/webm;codecs=vp8,vorbis': 'WebM + VP8 + Vorbis'
    }
    
    return descriptions[format] || '未知格式'
  }
  
  // 生成完整的诊断报告
  static generateDiagnosticReport() {
    const envInfo = this.getEnvironmentInfo()
    const allFormats = this.getAllSupportedFormats()
    const mp4Test = this.testMP4Support()
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      allSupportedFormats: allFormats.supported,
      allUnsupportedFormats: allFormats.unsupported,
      mp4DetailedTest: mp4Test,
      recommendations: this.getRecommendations(envInfo, allFormats, mp4Test)
    }
    
    return report
  }
  
  // 获取建议
  static getRecommendations(envInfo, allFormats, mp4Test) {
    const recommendations = []
    
    if (envInfo.isElectron) {
      recommendations.push('检测到Electron环境')
      
      if (!allFormats.supported.some(f => f.includes('mp4'))) {
        recommendations.push('❌ MP4格式完全不支持')
        recommendations.push('💡 建议升级到更新版本的Electron')
        recommendations.push('💡 或者使用FFmpeg进行后处理转换')
      } else {
        const supportedMP4 = allFormats.supported.filter(f => f.includes('mp4'))
        recommendations.push(`✅ 支持 ${supportedMP4.length} 种MP4变体`)
        recommendations.push('💡 可以尝试使用支持的MP4编解码器')
      }
      
      if (parseInt(envInfo.chromeVersion) < 90) {
        recommendations.push('⚠️ Chrome版本较旧，可能影响编解码器支持')
        recommendations.push('💡 建议升级Electron版本以获得更新的Chromium')
      }
    }
    
    return recommendations
  }
  
  // 控制台输出诊断信息
  static logDiagnostics() {
    const report = this.generateDiagnosticReport()
    
    console.group('🔍 编解码器诊断报告')
    console.log('📅 生成时间:', report.timestamp)
    
    console.group('🖥️ 环境信息')
    console.log('User Agent:', report.environment.userAgent)
    console.log('是否为Electron:', report.environment.isElectron)
    console.log('Chrome版本:', report.environment.chromeVersion)
    console.log('Electron版本:', report.environment.electronVersion)
    console.log('平台:', report.environment.platform)
    console.groupEnd()
    
    console.group('✅ 支持的格式')
    report.allSupportedFormats.forEach(format => {
      console.log(`✅ ${format}`)
    })
    console.groupEnd()
    
    console.group('❌ 不支持的格式')
    report.allUnsupportedFormats.forEach(format => {
      console.log(`❌ ${format}`)
    })
    console.groupEnd()
    
    console.group('🎬 MP4详细测试')
    report.mp4DetailedTest.forEach(test => {
      const icon = test.supported ? '✅' : '❌'
      console.log(`${icon} ${test.format} - ${test.description}`)
    })
    console.groupEnd()
    
    console.group('💡 建议')
    report.recommendations.forEach(rec => {
      console.log(rec)
    })
    console.groupEnd()
    
    console.groupEnd()
    
    return report
  }
} 