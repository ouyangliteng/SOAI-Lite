import { useState } from 'react'
import { View, Text, Image, Input } from '@tarojs/components'
import Taro, { useDidShow, getCurrentInstance } from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'
import { useReportStore } from '../../store/reportStore'
import { reportService, analysisService, inviteService } from '../../services'
import type { ReportListItem, AnalysisTask } from '../../services/types'
import './index.scss'

export default function HomePage() {
  const { profile, setProfile } = useAuthStore()
  const { currentTaskId } = useReportStore()
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [latestReport, setLatestReport] = useState<ReportListItem | null>(null)
  const [activeTask, setActiveTask] = useState<AnalysisTask | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  useDidShow(async () => {
    try { (getCurrentInstance()?.page as any)?.getTabBar?.()?.setSelected?.(0) } catch {}
    const list = await reportService.listReports().catch(() => [])
    const sorted = [...list].sort((a, b) => b.trainingDate.localeCompare(a.trainingDate))
    setReports(sorted)
    setLatestReport(sorted[0] ?? null)

    if (currentTaskId) {
      const task = await analysisService.getTask(currentTaskId).catch(() => null)
      if (task && task.status !== 'completed' && task.status !== 'failed') {
        setActiveTask(task)
      } else {
        setActiveTask(null)
      }
    }
  })

  const initial = profile?.name?.slice(0, 1) ?? '学'
  const inviteVerified = Boolean(profile?.inviteVerifiedAt)

  function goReport() {
    if (latestReport) Taro.navigateTo({ url: `/pages/report-detail/index?id=${latestReport.id}` })
  }

  async function handleVerifyInvite() {
    const code = inviteCode.trim().replace(/\s+/g, '').toUpperCase()
    if (!code) {
      Taro.showToast({ title: '请输入内测邀请码', icon: 'none' })
      return
    }
    if (inviteLoading) return
    try {
      setInviteLoading(true)
      const result = await inviteService.verifyInvite(code)
      Taro.setStorageSync('profile', result.profile)
      setProfile(result.profile)
      setInviteCode('')
      Taro.showToast({ title: '邀请码已通过', icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '邀请码验证失败', icon: 'none' })
    } finally {
      setInviteLoading(false)
    }
  }

  function goUpload() {
    if (!inviteVerified) {
      Taro.showToast({ title: '请先输入内测邀请码', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: '/pages/upload/index' })
  }

  return (
    <View className='page home-page'>
      {/* 用户卡 → 我的 */}
      <View className='card' style={{ cursor: 'pointer' }} onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}>
        <View className='row'>
          <View className='home-avatar'>
            {profile?.avatarUrl
              ? <Image src={profile.avatarUrl} style={{ width: '100%', height: '100%' }} />
              : <Text>{initial}</Text>
            }
          </View>
          <View style={{ flex: 1, marginLeft: '20rpx' }}>
            <View className='card-title'>{profile?.name ?? '学员'}</View>
            <View className='muted'>{profile?.currentLevel ?? ''}{profile?.clubName ? ` · ${profile.clubName}` : ''}</View>
          </View>
          <Text className='muted' style={{ fontSize: '28rpx' }}>›</Text>
        </View>
      </View>

      <View className={`invite-card ${inviteVerified ? 'invite-card-ok' : ''}`}>
        <View>
          <View className='invite-title'>内测邀请码</View>
          <View className='muted' style={{ marginTop: '6rpx' }}>
            {inviteVerified ? '已开放真实姿态识别上传测试。' : '仅限受邀学员上传测试视频。'}
          </View>
        </View>
        {inviteVerified ? (
          <View className='invite-status'>已通过</View>
        ) : (
          <View className='invite-input-row'>
            <Input
              className='invite-input'
              value={inviteCode}
              maxlength={24}
              placeholder='输入邀请码'
              placeholderClass='invite-placeholder'
              confirmType='done'
              onInput={(e) => setInviteCode(String(e.detail.value || ''))}
              onConfirm={handleVerifyInvite}
            />
            <View
              className={`invite-btn ${inviteLoading ? 'invite-btn-loading' : ''}`}
              onClick={handleVerifyInvite}
            >
              {inviteLoading ? '验证中' : '验证'}
            </View>
          </View>
        )}
      </View>

      {/* 三个 stat 卡，各自跳转 */}
      <View className='stats-row'>
        <View className='stat-card' onClick={() => Taro.switchTab({ url: '/pages/reports/index' })}>
          <View className='stat-value'>{latestReport?.overallScore ?? '--'}</View>
          <View className='stat-label'>最近得分</View>
        </View>
        <View className='stat-card' onClick={() => Taro.switchTab({ url: '/pages/reports/index' })}>
          <View className='stat-value'>{reports.length || '--'}</View>
          <View className='stat-label'>训练次数</View>
        </View>
        <View className='stat-card' onClick={goReport}>
          <View className='stat-value'>{latestReport?.riskCount ?? '--'}</View>
          <View className='stat-label'>风险项</View>
        </View>
      </View>

      <View className='section-title'>本次训练</View>
      <View className='card'>
        <View className='card-title'>上传训练视频</View>
        <View className='muted' style={{ marginTop: '10rpx' }}>
          真实姿态识别测试限 15 秒内，MP4/MOV，150MB 以内，画面需包含骑手上身与腿部。
        </View>
        <View
          className={`btn ${inviteVerified ? 'btn-primary' : 'btn-ghost'}`}
          style={{ marginTop: '26rpx' }}
          onClick={goUpload}
        >
          {inviteVerified ? '上传视频' : '输入邀请码后上传'}
        </View>
      </View>

      {activeTask && (
        <View className='card' style={{ marginTop: '20rpx', borderColor: '#00b896' }}>
          <View className='row'>
            <View>
              <View className='card-title'>分析进行中</View>
              <View className='muted'>{activeTask.progressText}</View>
            </View>
            <View className='task-dot' />
          </View>
          <View
            className='btn btn-secondary'
            style={{ marginTop: '24rpx' }}
            onClick={() => Taro.navigateTo({ url: `/pages/analysis/index?taskId=${activeTask.id}` })}
          >
            查看进度
          </View>
        </View>
      )}

      <View className='section-title'>最近报告</View>
      {latestReport ? (
        <View className='card home-latest-report'>
          <View className='row'>
            <View>
              <Text className='score-big'>{latestReport.overallScore}</Text>
              <Text className='score-unit'>分</Text>
            </View>
            <View className='tag'>{latestReport.trainingDate}</View>
          </View>
          <View className='muted' style={{ marginTop: '8rpx' }}>{latestReport.oneLineConclusion}</View>
          <View className='divider' />
          <View
            className='muted risk-tap'
            onClick={goReport}
          >
            风险点 {latestReport.riskCount} 项 <Text style={{ color: '#00b896', marginLeft: '8rpx' }}>› 查看风险评估</Text>
          </View>
          <View
            className='btn btn-secondary'
            style={{ marginTop: '24rpx' }}
            onClick={goReport}
          >
            查看完整报告
          </View>
        </View>
      ) : (
        <View className='card'>
          <View className='card-title'>暂无报告</View>
          <View className='muted'>上传视频并完成分析后，报告会显示在这里。</View>
        </View>
      )}
    </View>
  )
}
