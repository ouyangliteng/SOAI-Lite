import { useState, useEffect, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { analysisService } from '../../services'
import type { AnalysisStatus } from '../../services/types'
import './index.scss'

const STEPS: { key: string; label: string }[] = [
  { key: 'start',             label: '视频上传完成' },
  { key: 'queued',            label: '排队等待分析' },
  { key: 'analyzing',        label: 'AI 分析骨骼与关节角度' },
  { key: 'generating_report',label: '生成训练报告' },
  { key: 'completed',        label: '分析完成' },
]

const STATUS_ORDER = ['start', 'queued', 'analyzing', 'generating_report', 'completed']

export default function AnalysisPage() {
  const router = useRouter()
  const taskId = router.params.taskId ?? null
  const [status, setStatus] = useState<AnalysisStatus>('queued')
  const [progressText, setProgressText] = useState('排队等待中…')
  const [failureText, setFailureText] = useState('真实姿态识别超时，请稍后重试。')
  const [failed, setFailed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (!taskId) return
    timerRef.current = setInterval(async () => {
      if (Date.now() - startTime.current > 5 * 60 * 1000) {
        clearInterval(timerRef.current!)
        setFailed(true)
        return
      }
      try {
        const task = await analysisService.getTask(taskId)
        setStatus(task.status)
        setProgressText(task.progressText)
        if (task.status === 'completed' && task.reportId) {
          clearInterval(timerRef.current!)
          setTimeout(() => {
            Taro.redirectTo({ url: `/pages/report-detail/index?id=${task.reportId}` })
          }, 800)
        } else if (task.status === 'failed') {
          clearInterval(timerRef.current!)
          setFailureText(task.errorMessage || task.progressText || '真实姿态识别失败，请稍后重试。')
          setFailed(true)
        } else if (task.status === 'completed' && !task.reportId) {
          clearInterval(timerRef.current!)
          setFailed(true)
        }
      } catch {
        // network hiccup, keep polling
      }
    }, 3000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [taskId])

  if (!taskId) {
    return (
      <View className='page'>
        <View className='error-center'>
          <Text className='error-icon'>📋</Text>
          <View className='card-title'>没有进行中的分析任务</View>
          <View className='muted' style={{ marginTop: '12rpx' }}>请先上传训练视频开始分析</View>
          <View
            className='btn btn-secondary'
            style={{ marginTop: '32rpx', width: '100%' }}
            onClick={() => Taro.navigateTo({ url: '/pages/upload/index' })}
          >
            去上传视频
          </View>
        </View>
      </View>
    )
  }

  if (failed) {
    return (
      <View className='page'>
        <View className='error-center'>
          <Text className='error-icon'>⚠️</Text>
          <View className='card-title'>真实姿态识别未完成</View>
          <View className='muted'>{failureText}</View>
          <View
            className='btn btn-secondary'
            style={{ marginTop: '32rpx', width: '100%' }}
            onClick={() => Taro.navigateTo({ url: '/pages/upload/index' })}
          >
            重新上传
          </View>
        </View>
      </View>
    )
  }

  const currentIdx = STATUS_ORDER.indexOf(status)

  return (
    <View className='page'>
      <View className='analysis-center'>
        <View className='ai-spinner' />
        <View className='analysis-title'>AI 姿态分析中</View>
        <View className='analysis-sub'>{progressText}</View>
      </View>
      <View className='progress-steps'>
        {STEPS.map((step) => {
          const stepIdx = STATUS_ORDER.indexOf(step.key)
          const isDone = stepIdx < currentIdx
          const isActive = stepIdx === currentIdx
          return (
            <View key={step.key} className='step-item'>
              <View className={`step-dot ${isActive ? 'step-dot-active' : isDone ? 'step-dot-done' : ''}`} />
              <Text className={`step-label ${isActive ? 'step-label-active' : ''}`}>
                {step.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
