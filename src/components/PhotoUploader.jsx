import React from 'react'
import { Upload, Card, Typography, Button, message } from 'antd'
import { InboxOutlined, PictureOutlined } from '@ant-design/icons'
import { v4 as uuidv4 } from 'uuid'

const { Dragger } = Upload
const { Title, Text } = Typography

const PhotoUploader = ({ onPhotosUploaded }) => {
  const previousFileListRef = React.useRef([])
  
  const handleUpload = ({ fileList }) => {
    // 找出新增的文件（uid不在上一次列表中的文件）
    const newFiles = fileList.filter(currentFile => {
      return !previousFileListRef.current.some(prevFile => 
        prevFile.uid === currentFile.uid
      )
    })
    
    if (newFiles.length === 0) {
      return // 没有新文件，直接返回
    }

    // 验证新文件是否为图片
    const validNewFiles = newFiles.filter(file => {
      const isImage = file.type?.startsWith('image/')
      if (!isImage && file.originFileObj) {
        message.error(`${file.name} 不是有效的图片文件`)
        return false
      }
      return file.originFileObj && file.status !== 'error'
    })

    if (validNewFiles.length === 0) {
      // 更新ref即使没有有效文件
      previousFileListRef.current = [...fileList]
      return
    }

    // 转换为照片对象
    const newPhotos = validNewFiles.map(file => ({
      id: uuidv4(),
      name: file.name,
      file: file.originFileObj,
      url: URL.createObjectURL(file.originFileObj),
      size: file.size,
      uploadTime: new Date().toISOString()
    }))

    // 更新ref为当前fileList
    previousFileListRef.current = [...fileList]

    if (newPhotos.length > 0) {
      onPhotosUploaded(newPhotos)
    }
  }

  const handleClear = () => {
    previousFileListRef.current = []
    message.info('已清除上传记录，可以重新选择照片')
  }

  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    beforeUpload: () => false, // 阻止自动上传
    onChange: handleUpload,
    showUploadList: false,
    style: { width: '100%' }
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <PictureOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          <span>导入照片</span>
        </div>
      }
      style={{ height: '400px' }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Dragger {...uploadProps} style={{ flex: 1 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: '16px', marginBottom: '8px' }}>
            点击或拖拽照片到此区域上传
          </p>
          <p className="ant-upload-hint" style={{ color: '#666' }}>
            支持单张或批量上传，支持 JPG、PNG、GIF 等格式
          </p>
          <div style={{ marginTop: '16px' }}>
            <Button type="primary" size="large" style={{ marginRight: '8px' }}>
              选择照片
            </Button>
            <Button onClick={handleClear} size="large">
              重置
            </Button>
          </div>
        </Dragger>
        
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#f0f8ff', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          <Text type="secondary">
            💡 小贴士：支持 Ctrl/Cmd + A 全选照片，推荐照片尺寸比例一致以获得更好效果
          </Text>
        </div>
      </div>
    </Card>
  )
}

export default PhotoUploader 