import React from 'react'
import { Spin, Typography, Progress } from 'antd'
import { LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const LoadingOverlay = ({ 
  text = '正在处理...', 
  description = '', 
  progress = null,
  steps = null,
  currentStep = 0
}) => {
  
  const defaultSteps = [
    '准备处理环境',
    '加载照片资源', 
    '应用特效和滤镜',
    '生成视频帧',
    '合成背景音乐',
    '压缩和优化',
    '准备下载'
  ]

  const processingSteps = steps || defaultSteps

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div style={{ textAlign: 'center', minWidth: '400px' }}>
          
          {/* 主要加载动画 */}
          <div style={{ marginBottom: '24px' }}>
            <Spin 
              indicator={
                <LoadingOutlined 
                  style={{ 
                    fontSize: 48, 
                    color: '#1890ff' 
                  }} 
                  spin 
                />
              } 
            />
          </div>

          {/* 标题和描述 */}
          <Title level={3} style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
            {text}
          </Title>
          
          {description && (
            <Text type="secondary" style={{ fontSize: '14px', marginBottom: '24px', display: 'block' }}>
              {description}
            </Text>
          )}

          {/* 进度条 */}
          {progress !== null && (
            <div style={{ margin: '24px 0' }}>
              <Progress 
                percent={progress} 
                strokeColor={{
                  from: '#108ee9',
                  to: '#87d068',
                }}
                status="active"
                showInfo={true}
              />
            </div>
          )}

          {/* 步骤显示 */}
          {steps && (
            <div style={{ margin: '24px 0', textAlign: 'left' }}>
              <div style={{ 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                padding: '16px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {processingSteps.map((step, index) => (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '4px 0',
                      color: index < currentStep ? '#52c41a' : 
                             index === currentStep ? '#1890ff' : '#8c8c8c'
                    }}
                  >
                    {index < currentStep ? (
                      <CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                    ) : index === currentStep ? (
                      <Spin 
                        size="small" 
                        style={{ marginRight: '8px' }}
                        indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />}
                      />
                    ) : (
                      <div style={{ 
                        width: '14px', 
                        height: '14px', 
                        borderRadius: '50%', 
                        border: '2px solid #d9d9d9',
                        marginRight: '8px'
                      }} />
                    )}
                    <Text 
                      style={{ 
                        color: 'inherit',
                        fontWeight: index === currentStep ? 'bold' : 'normal'
                      }}
                    >
                      {step}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div style={{ 
            marginTop: '24px',
            padding: '12px',
            background: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '6px',
            textAlign: 'left'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              💡 <strong>请耐心等待：</strong>
              <br />
              • 请不要关闭浏览器窗口或刷新页面
              <br />
              • 处理时间取决于照片数量和质量设置
              <br />
              • 高质量设置需要更长的处理时间
            </Text>
          </div>

          {/* 取消按钮 (可选) */}
          {/* 
          <div style={{ marginTop: '24px' }}>
            <Button type="default" onClick={onCancel}>
              取消处理
            </Button>
          </div>
          */}

        </div>
      </div>

      {/* 背景样式 */}
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
        }

        .loading-content {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
          text-align: center;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
        }

        @media (max-width: 768px) {
          .loading-content {
            padding: 24px;
            margin: 20px;
          }
        }
      `}</style>
    </div>
  )
}

export default LoadingOverlay 