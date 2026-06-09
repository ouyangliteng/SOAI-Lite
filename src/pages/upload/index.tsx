import { useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { uploadService, analysisService } from '../../services'
import type { UploadQuota } from '../../services/types'
import { useAuthStore } from '../../store/authStore'
import landscapePoseGuide from '../../assets/upload-landscape-pose-guide.jpg'
import './index.scss'

const MAX_SIZE = 150 * 1024 * 1024
const MAX_DURATION_SEC = 15

type Stage = 'idle' | 'selected' | 'uploading' | 'done' | 'error'

export default function UploadPage() {
  const { profile } = useAuthStore()
  const [stage, setStage] = useState<Stage>('idle')
  const [file, setFile] = useState<{ path: string; name: string; size: number; duration: number } | null>(null)
  const [progress, setProgress] = useState(0)
  const [errMsg, setErrMsg] = useState('')
  const [consent, setConsent] = useState(false)
  const [quota, setQuota] = useState<UploadQuota | null>(null)

  useEffect(() => {
    uploadService.getUploadQuota()
      .then(setQuota)
      .catch(() => {})
  }, [])

  const inviteVerified = Boolean(profile?.inviteVerifiedAt)

  async function handleChoose() {
    if (!inviteVerified) {
      Taro.showToast({ title: '请先在首页输入内测邀请码', icon: 'none' })
      return
    }
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album', 'camera'],
      })
      const item = res.tempFiles[0]
      if (item.size > MAX_SIZE) {
        Taro.showToast({ title: '视频超过 150MB，请压缩后上传', icon: 'error' })
        return
      }
      const duration = Math.round(item.duration ?? 0)
      if (duration > MAX_DURATION_SEC) {
        Taro.showToast({ title: '请上传 15 秒内真实测试视频', icon: 'none' })
        return
      }
      setFile({ path: item.tempFilePath, name: `training_${Date.now()}.mp4`, size: item.size, duration })
      setStage('selected')
    } catch {
      // user cancelled
    }
  }

  async function handleUpload() {
    if (!inviteVerified) {
      Taro.showToast({ title: '请先在首页输入内测邀请码', icon: 'none' })
      return
    }
    if (quota && quota.remaining <= 0) {
      Taro.showToast({ title: '今天已达到 3 次上传上限', icon: 'none' })
      return
    }
    if (!file || !consent) {
      if (!consent) Taro.showToast({ title: '请勾选视频使用授权', icon: 'none' })
      return
    }
    try {
      setStage('uploading')
      setProgress(0)
      const { uploadUrl, videoId, reused, reportId, message } = await uploadService.getUploadToken(file.name, file.size, file.duration)
      uploadService.getUploadQuota().then(setQuota).catch(() => {})
      if (reused && reportId) {
        setStage('done')
        Taro.showToast({ title: message || '已复用原报告', icon: 'none' })
        setTimeout(() => {
          Taro.navigateTo({ url: `/pages/report-detail/index?id=${reportId}` })
        }, 600)
        return
      }
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
      {!inviteVerified && (
        <View className='invite-lock'>
          <View className='file-name'>内测邀请码未通过</View>
          <View className='file-meta'>请返回首页输入邀请码后，再上传真实姿态识别测试视频。</View>
          <View
            className='btn btn-secondary'
            style={{ marginTop: '20rpx' }}
            onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
          >
            返回首页验证
          </View>
        </View>
      )}

      {quota && (
        <View className='file-info'>
          <View className='file-name'>今日剩余分析次数</View>
          <View className='file-meta'>{quota.remaining} / {quota.limit}</View>
        </View>
      )}

      {inviteVerified && (stage === 'idle' || stage === 'selected') && (
        <>
          <View className='landscape-guide'>
            <View className='landscape-phone'>
              <View className='phone-side-key' />
              <View className='phone-speaker' />
              <View className='phone-camera' />
              <View className='phone-screen'>
                <Image
                  className='guide-pose-image'
                  src={landscapePoseGuide}
                  mode='aspectFit'
                />
                <View className='screen-glass' />
              </View>
            </View>
            <View className='guide-copy'>
              <Text className='guide-title'>建议横屏录制</Text>
              <Text className='guide-text'>
                横屏采集并尽量让主体人物居中录制，视频动态捕捉更准确，AI 判断更清晰，训练结论也会更稳定、准确。
              </Text>
            </View>
          </View>

          <View className='upload-zone' onClick={handleChoose}>
            <Text className='upload-icon'>🎬</Text>
            <Text className='upload-tip'>
              {stage === 'idle' ? '点击选择训练视频' : '已选择，点击重新选择'}
            </Text>
            <Text className='upload-tip' style={{ fontSize: '22rpx' }}>真实姿态识别测试 · 15 秒内 · 150MB 以内</Text>
          </View>
        </>
      )}

      {file && (
        <View className='file-info'>
          <View className='file-name'>{file.name}</View>
          <View className='file-meta'>{(file.size / (1024 * 1024)).toFixed(1)} MB · {file.duration || '--'} 秒</View>
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

      {inviteVerified && (stage === 'idle' || stage === 'selected' || stage === 'error') && (
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
