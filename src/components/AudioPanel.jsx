import React, { useRef, useState } from 'react'
import { Card, Upload, Button, Space, Typography, Slider, Switch, message, Select, Radio, Divider } from 'antd'
import { 
  AudioOutlined, 
  DeleteOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  UploadOutlined,
  StarOutlined
} from '@ant-design/icons'
import { AudioUtils } from '../utils/audioUtils.js'

const { Text } = Typography
const { Option } = Select

// 预设音乐库 - 修复Electron路径问题
const presetMusic = [
  {
    id: 'birthday',
    name: '生日',
    description: '温馨宁静的钢琴曲',
    url: '/audio/birthday.mp3',
    duration: 65,
    // 添加备用路径，用于Electron环境
    electronPath: 'public/audio/birthday.mp3'
  },
  // {
  //   id: 'relaxing-piano',
  //   name: '轻松钢琴',
  //   description: '温馨宁静的钢琴曲',
  //   url: '/audio/relaxing-piano.mp3',
  //   duration: 180
  // },
  // {
  //   id: 'gentle-guitar',
  //   name: '轻柔吉他',
  //   description: '优美的吉他旋律',
  //   url: '/audio/gentle-guitar.mp3',
  //   duration: 210
  // },
  // {
  //   id: 'nature-sounds',
  //   name: '自然之声',
  //   description: '鸟语花香的自然音效',
  //   url: '/audio/nature-sounds.mp3',
  //   duration: 300
  // },
  // {
  //   id: 'cinematic-ambient',
  //   name: '电影环境音乐',
  //   description: '大气磅礴的环境音乐',
  //   url: '/audio/cinematic-ambient.mp3',
  //   duration: 240
  // },
  // {
  //   id: 'happy-ukulele',
  //   name: '欢快尤克里里',
  //   description: '轻快活泼的夏威夷音乐',
  //   url: '/audio/happy-ukulele.mp3',
  //   duration: 165
  // },
  // {
  //   id: 'classical-strings',
  //   name: '古典弦乐',
  //   description: '优雅的古典弦乐四重奏',
  //   url: '/audio/classical-strings.mp3',
  //   duration: 220
  // }
]

// 获取音频的实际路径 - 兼容Electron环境
const getAudioUrl = (preset) => {
  // 检查是否在Electron环境中
  if (AudioUtils.isElectronEnvironment()) {
    try {
      // 在Electron环境中，尝试构建正确的文件路径
      const { remote } = require('electron');
      const path = require('path');
      const fs = require('fs');
      
      // 尝试多个可能的路径
      const possiblePaths = [
        path.join(process.resourcesPath, 'app', 'public', 'audio', `${preset.id}.mp3`),
        path.join(process.resourcesPath, 'public', 'audio', `${preset.id}.mp3`),
        path.join(remote ? remote.app.getAppPath() : '', 'public', 'audio', `${preset.id}.mp3`),
        path.join(remote ? remote.app.getAppPath() : '', 'dist', 'audio', `${preset.id}.mp3`)
      ];
      
      // 寻找存在的文件
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          console.log('找到音频文件:', filePath);
          return `file://${filePath}`;
        }
      }
      
      // 如果都找不到，回退到原始URL
      console.warn('未找到音频文件，使用原始URL:', preset.url);
      return preset.url;
    } catch (error) {
      console.warn('Electron路径解析失败，使用原始URL:', error);
      return preset.url;
    }
  } else {
    // 浏览器环境，直接使用原始URL
    return preset.url;
  }
}

const AudioPanel = ({ audioFile, onAudioUpload }) => {
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [fadeIn, setFadeIn] = useState(true)
  const [fadeOut, setFadeOut] = useState(true)
  const [musicSource, setMusicSource] = useState('preset') // 'preset' 或 'upload'
  const [selectedPreset, setSelectedPreset] = useState(null)

  const handlePresetSelect = async (presetId) => {
    const preset = presetMusic.find(p => p.id === presetId)
    if (preset) {
      setSelectedPreset(preset)
      
      // 获取适合当前环境的音频URL
      const audioUrl = getAudioUrl(preset);
      
      const audioData = {
        type: 'preset',
        id: preset.id,
        name: preset.name,
        url: audioUrl,
        originalUrl: preset.url, // 保留原始URL作为备用
        duration: preset.duration,
        volume,
        fadeIn,
        fadeOut
      }
      
      // 验证音频文件是否可以加载
      try {
        await AudioUtils.createAudioElement(audioData);
        onAudioUpload(audioData);
        message.success(`已选择预设音乐: ${preset.name}`);
      } catch (error) {
        console.error('音频验证失败:', error);
        message.error('音频文件加载失败，请检查文件是否存在');
      }
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const isAudio = file.type?.startsWith('audio/') || 
                   file.name?.match(/\.(mp3|wav|ogg|m4a|aac)$/i)
    
    if (!isAudio) {
      message.error('请选择音频文件 (MP3, WAV, OGG, M4A, AAC)')
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      message.error('音频文件大小不能超过 50MB')
      return
    }

    const audioData = {
      type: 'upload',
      file: file,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      volume,
      fadeIn,
      fadeOut
    }

    onAudioUpload(audioData)
    setSelectedPreset(null)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const togglePlay = () => {
    if (!audioRef.current || !audioFile) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(error => {
        console.warn('Audio play failed:', error)
        message.warning('音频播放失败，请检查文件是否有效')
      })
    }
    setIsPlaying(!isPlaying)
  }

  const handleVolumeChange = (value) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value / 100
    }
    if (audioFile) {
      onAudioUpload({
        ...audioFile,
        volume: value
      })
    }
  }

  const handleFadeChange = (type, checked) => {
    if (type === 'fadeIn') {
      setFadeIn(checked)
    } else {
      setFadeOut(checked)
    }
    
    if (audioFile) {
      onAudioUpload({
        ...audioFile,
        [type]: checked
      })
    }
  }

  const handleRemoveAudio = () => {
    onAudioUpload(null)
    setSelectedPreset(null)
    setIsPlaying(false)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AudioOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          <span>背景音乐</span>
        </div>
      }
      style={{ height: '400px' }}
      bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto', padding: '16px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        
        {/* 音乐来源选择 */}
        {!audioFile && (
          <div>
            <Text strong style={{ marginBottom: '12px', display: 'block' }}>音乐来源</Text>
            <Radio.Group 
              value={musicSource} 
              onChange={(e) => setMusicSource(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="preset">
                  <StarOutlined style={{ color: '#faad14' }} /> 预设音乐库
                </Radio>
                <Radio value="upload">
                  <UploadOutlined style={{ color: '#52c41a' }} /> 上传自定义音乐
                </Radio>
              </Space>
            </Radio.Group>
          </div>
        )}

        {/* 预设音乐选择 */}
        {!audioFile && musicSource === 'preset' && (
          <div>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>选择预设音乐</Text>
            <Select
              placeholder="请选择一首背景音乐"
              style={{ width: '100%' }}
              onChange={handlePresetSelect}
              size="large"
            >
              {presetMusic.map(music => (
                <Option key={music.id} value={music.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{music.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{music.description}</div>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatDuration(music.duration)}
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
        )}

        {/* 文件上传 */}
        {!audioFile && musicSource === 'upload' && (
          <div>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>上传音频文件</Text>
            <Button
              type="dashed"
              icon={<UploadOutlined />}
              onClick={handleUploadClick}
              style={{ 
                width: '100%', 
                height: '80px', 
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div>点击选择音频文件</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                支持 MP3、WAV、OGG、M4A、AAC 格式
              </div>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* 已选择的音频信息 */}
        {audioFile && (
          <div style={{ 
            border: '1px solid #d9d9d9', 
            borderRadius: '8px', 
            padding: '16px',
            background: '#fafafa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{audioFile.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {audioFile.type === 'preset' 
                    ? `预设音乐 • ${formatDuration(audioFile.duration)}`
                    : `自定义文件 • ${formatFileSize(audioFile.size)}`
                  }
                </Text>
              </div>
              <Space>
                <Button
                  type="primary"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlay}
                  size="small"
                >
                  {isPlaying ? '暂停' : '播放'}
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemoveAudio}
                  size="small"
                >
                  删除
                </Button>
              </Space>
            </div>
            
            {/* 隐藏的音频元素 */}
            <audio
              ref={audioRef}
              src={audioFile.url}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              volume={volume / 100}
            />
          </div>
        )}

        {/* 音频设置 */}
        {audioFile && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            
            {/* 音量控制 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text strong>音量</Text>
                <Text type="secondary">{volume}%</Text>
              </div>
              <Slider
                min={0}
                max={100}
                value={volume}
                onChange={handleVolumeChange}
                marks={{
                  0: '静音',
                  50: '50%',
                  100: '100%'
                }}
              />
            </div>

            {/* 淡入淡出设置 */}
            <div>
              <Text strong style={{ marginBottom: '12px', display: 'block' }}>音频效果</Text>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>淡入效果</Text>
                  <Switch
                    checked={fadeIn}
                    onChange={(checked) => handleFadeChange('fadeIn', checked)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>淡出效果</Text>
                  <Switch
                    checked={fadeOut}
                    onChange={(checked) => handleFadeChange('fadeOut', checked)}
                  />
                </div>
              </Space>
            </div>

            {/* 提示信息 */}
            <div style={{ 
              background: '#e6f7ff', 
              border: '1px solid #91d5ff',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 背景音乐会自动循环播放，直到相册播放结束。建议选择轻柔的音乐以配合照片展示。
              </Text>
            </div>
          </>
        )}
      </Space>
    </Card>
  )
}

export default AudioPanel 