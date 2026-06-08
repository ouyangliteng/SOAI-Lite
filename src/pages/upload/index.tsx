import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { uploadService, analysisService } from '../../services'
import './index.scss'

const MAX_SIZE = 100 * 1024 * 1024

type Stage = 'idle' | 'selected' | 'uploading' | 'done' | 'error'

export default function UploadPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [file, setFile] = useState<{ path: string; name: string; size: number } | null>(null)
  const [progress, setProgress] = useState(0)
  const [errMsg, setErrMsg] = useState('')
  const [consent, setConsent] = useState(false)
  async function handleChoose() {
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album', 'camera'],
      })
      const item = res.tempFiles[0]
      if (item.size > MAX_SIZE) {
        Taro.showToast({ title: '视频超过 100MB，请压缩后上传', icon: 'error' })
        return
      }
      setFile({ path: item.tempFilePath, name: `training_${Date.now()}.mp4`, size: item.size })
      setStage('selected')
    } catch {
      // user cancelled
    }
  }

  async function handleUpload() {
    if (!file || !consent) {
      if (!consent) Taro.showToast({ title: '请勾选视频使用授权', icon: 'none' })
      return
    }
    try {
      setStage('uploading')
      setProgress(0)
      const { uploadUrl, videoId } = await uploadService.getUploadToken(file.name, file.size)
      await uploadService.doUpload(uploadUrl, file.path, setProgress)
      await uploadService.notifyUploaded(videoId)
      const analysisTask = await analysisService.createTask(videoId)
      setStage('done')
      Taro.navigateTo({ url: `/pages/analysis/index?taskId=${analysisTask.id}` })
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : '上传失败')
      setStage('error')
    }
  }

  return (
    <View className='page'>
      {(stage === 'idle' || stage === 'selected') && (
        <View className='upload-zone' onClick={handleChoose}>
          <Text className='upload-icon'>🎬</Text>
          <Text className='upload-tip'>
            {stage === 'idle' ? '点击选择训练视频' : '已选择，点击重新选择'}
          </Text>
          <Text className='upload-tip' style={{ fontSize: '22rpx' }}>MP4 / MOV · 100MB 以内</Text>
        </View>
      )}

      {file && (
        <View className='file-info'>
          <View className='file-name'>{file.name}</View>
          <View className='file-meta'>{(file.size / (1024 * 1024)).toFixed(1)} MB</View>
        </View>
      )}

      {stage === 'uploading' && (
        <View className='upload-progress'>
          <View className='progress-label'>
            <Text>上传中…</Text>
            <Text>{progress}%</Text>
          </View>
          <View className='progress-track'>
            <View className='progress-bar' style={{ width: `${progress}%` }} />
          </View>
        </View>
      )}

      {stage === 'error' && (
        <View className='error-box'>{errMsg}，请重试</View>
      )}

      {(stage === 'idle' || stage === 'selected' || stage === 'error') && (
        <>
          <View className='consent-row' onClick={() => setConsent(c => !c)}>
            <View className={`consent-check ${consent ? 'consent-check-on' : ''}`}>
              {consent && '✓'}
            </View>
            <Text className='consent-text'>
              我同意将本次训练视频用于 AI 姿态分析，视频当天可看，次日自动删除。
            </Text>
          </View>
          <View
            className={`btn ${file && consent ? 'btn-primary' : 'btn-ghost'}`}
            style={{ marginTop: '40rpx' }}
            onClick={handleUpload}
          >
            开始上传并分析
          </View>
        </>
      )}
    </View>
  )
}
