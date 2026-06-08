import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { getCurrentInstance, useDidShow } from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'
import { reportService } from '../../services'
import type { ReportListItem, TrainingReport } from '../../services/types'
import './index.scss'

export default function ProfilePage() {
  const { profile, logout } = useAuthStore()
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [latestDetail, setLatestDetail] = useState<TrainingReport | null>(null)

  useEffect(() => {
    try { (getCurrentInstance()?.page as any)?.getTabBar?.()?.setSelected?.(2) } catch {}
  }, [])

  useDidShow(async () => {
    try { (getCurrentInstance()?.page as any)?.getTabBar?.()?.setSelected?.(2) } catch {}
    const list = await reportService.listReports().catch(() => [])
    setReports(list)
    if (list[0]) {
      const detail = await reportService.getReport(list[0].id).catch(() => null)
      setLatestDetail(detail)
    }
  })

  function handleLogout() {
    Taro.showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('profile')
          logout()
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }

  function goLatestReport() {
    if (reports[0]) Taro.navigateTo({ url: `/pages/report-detail/index?id=${reports[0].id}` })
  }

  const initial = profile?.name?.slice(0, 1) ?? '学'
  const trendReports = reports.slice(0, 5).reverse()
  const maxScore = trendReports.reduce((m, r) => Math.max(m, r.overallScore), 1)

  return (
    <View className='page'>
      {/* 头部 */}
      <View className='profile-header'>
        <View className='profile-avatar'>{initial}</View>
        <View className='profile-name'>{profile?.name ?? '学员'}</View>
        <View className='profile-level'>{profile?.currentLevel ?? '未设置级别'}</View>
      </View>

      {/* 训练综合趋势走向 */}
      {trendReports.length > 0 && (
        <View className='card' style={{ marginTop: '40rpx' }}>
          <View className='card-title' style={{ marginBottom: '24rpx' }}>训练综合趋势走向</View>
          <View className='trend-bars'>
            {trendReports.map((r, i) => (
              <View key={i} className='trend-col'>
                <Text className='trend-score'>{r.overallScore}</Text>
                <View className='trend-track'>
                  <View
                    className='trend-fill'
                    style={{ height: `${Math.round((r.overallScore / maxScore) * 100)}%` }}
                  />
                </View>
                <Text className='trend-date'>{r.trainingDate.slice(5)}</Text>
              </View>
            ))}
          </View>
          {reports.length > 1 && (
            <View className='trend-summary'>
              {reports[0].overallScore > reports[reports.length - 1].overallScore
                ? '↑ 综合得分呈上升趋势，训练效果持续改善'
                : reports[0].overallScore === reports[reports.length - 1].overallScore
                ? '→ 综合得分保持稳定'
                : '↓ 综合得分近期有所下降，建议重点复盘'}
            </View>
          )}
        </View>
      )}

      {/* AI 评判建议 */}
      {latestDetail && (
        <View className='card' style={{ marginTop: '20rpx' }}>
          <View className='ai-label'>🤖 AI 评判建议</View>
          {latestDetail.trendSummary && (
            <View className='ai-text'>{latestDetail.trendSummary}</View>
          )}
          {latestDetail.nextTrainingFocus && (
            <View className='ai-focus'>
              <Text className='ai-focus-tag'>下次训练重点</Text>
              <Text className='ai-text'>{latestDetail.nextTrainingFocus}</Text>
            </View>
          )}
        </View>
      )}

      {/* 风险评估 */}
      {latestDetail && latestDetail.riskPoints.length > 0 && (
        <View className='card' style={{ marginTop: '20rpx' }} onClick={goLatestReport}>
          <View className='row'>
            <View>
              <View className='card-title'>风险评估</View>
              <View className='muted' style={{ marginTop: '6rpx' }}>最近一次训练 · {reports[0]?.trainingDate}</View>
            </View>
            <View className='tag tag-danger'>{latestDetail.riskPoints.length} 项</View>
          </View>
          <View style={{ marginTop: '16rpx' }}>
            {latestDetail.riskPoints.slice(0, 2).map((p, i) => (
              <View key={i} className='risk-item'>
                <Text className='risk-dot'>⚠</Text>
                <Text className='risk-text'>{p}</Text>
              </View>
            ))}
          </View>
          <View className='muted' style={{ marginTop: '16rpx', color: '#00b896', fontSize: '26rpx' }}>
            查看完整风险报告 ›
          </View>
        </View>
      )}

      {/* 账户信息 */}
      <View className='card' style={{ marginTop: '20rpx' }}>
        <View className='menu-list'>
          {[
            { label: '当前级别', value: profile?.currentLevel ?? '未填写' },
            { label: '所属俱乐部', value: profile?.clubName ?? '未填写' },
            { label: '绑定教练',  value: profile?.coachName ?? '未绑定' },
          ].map(item => (
            <View key={item.label} className='menu-item'>
              <Text className='menu-label'>{item.label}</Text>
              <Text className='menu-value'>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='logout-btn' onClick={handleLogout}>退出登录</View>
    </View>
  )
}
