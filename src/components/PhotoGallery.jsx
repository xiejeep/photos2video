import React, { useState } from 'react'
import { Card, Row, Col, Checkbox, Button, Empty, Typography, Space, Tag } from 'antd'
import { 
  AppstoreOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SortAscendingOutlined
} from '@ant-design/icons'

const { Text } = Typography

const PhotoGallery = ({ photos, selectedPhotos, onSelectionChange, onClearAll }) => {
  const [sortBy, setSortBy] = useState('uploadTime') // uploadTime, name, size

  const handlePhotoSelect = (photoId, checked) => {
    if (checked) {
      onSelectionChange([...selectedPhotos, photoId])
    } else {
      onSelectionChange(selectedPhotos.filter(id => id !== photoId))
    }
  }

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(photos.map(photo => photo.id))
    }
  }

  const handleRemoveSelected = () => {
    onSelectionChange([])
  }

  const sortedPhotos = [...photos].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return b.size - a.size
      case 'uploadTime':
      default:
        return new Date(b.uploadTime) - new Date(a.uploadTime)
    }
  })

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AppstoreOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            <span>照片库</span>
            <Tag color="blue" style={{ marginLeft: '8px' }}>
              {photos.length} 张照片
            </Tag>
          </div>
          {photos.length > 0 && (
            <Space>
              <Button
                size="small"
                icon={<SortAscendingOutlined />}
                onClick={() => setSortBy(sortBy === 'name' ? 'uploadTime' : 'name')}
              >
                {sortBy === 'name' ? '按时间' : '按名称'}
              </Button>
              <Button
                size="small"
                type={selectedPhotos.length === photos.length ? 'primary' : 'default'}
                onClick={handleSelectAll}
              >
                {selectedPhotos.length === photos.length ? '取消全选' : '全选'}
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={onClearAll}
              >
                清空全部
              </Button>
            </Space>
          )}
        </div>
      }
      style={{ height: '400px' }}
      bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
    >
      {photos.length === 0 ? (
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="还没有上传照片"
          />
        </div>
      ) : (
        <>
          {selectedPhotos.length > 0 && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '8px 12px', 
              background: '#e6f7ff', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text type="secondary">
                已选择 {selectedPhotos.length} 张照片
              </Text>
              <Button 
                size="small" 
                type="link" 
                icon={<DeleteOutlined />}
                onClick={handleRemoveSelected}
              >
                清空选择
              </Button>
            </div>
          )}

          <Row gutter={[12, 12]}>
            {sortedPhotos.map((photo) => {
              const isSelected = selectedPhotos.includes(photo.id)
              return (
                <Col xs={12} sm={8} md={6} key={photo.id}>
                  <div 
                    className="photo-item"
                    style={{
                      position: 'relative',
                      border: isSelected ? '2px solid #1890ff' : '2px solid transparent',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.name}
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      zIndex: 2
                    }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handlePhotoSelect(photo.id, e.target.checked)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '4px',
                          padding: '2px'
                        }}
                      />
                    </div>

                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      color: 'white',
                      padding: '8px 6px 4px',
                      fontSize: '10px'
                    }}>
                      <div style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        marginBottom: '2px'
                      }}>
                        {photo.name}
                      </div>
                      <div style={{ opacity: 0.8 }}>
                        {formatFileSize(photo.size)}
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#1890ff',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {selectedPhotos.indexOf(photo.id) + 1}
                      </div>
                    )}
                  </div>
                </Col>
              )
            })}
          </Row>
        </>
      )}
    </Card>
  )
}

export default PhotoGallery 