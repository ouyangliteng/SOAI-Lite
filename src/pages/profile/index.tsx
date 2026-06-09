import { useState, useEffect } from 'react'
import { View, Text, Input, Image } from '@tarojs/components'
import Taro, { getCurrentInstance, useDidShow } from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'
import { authService, reportService } from '../../services'
import type { ReportListItem, TrainingReport } from '../../services/types'
import './index.scss'

export default function ProfilePage() {
  const { profile, setProfile, logout } = useAuthStore()
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [latestDetail, setLatestDetail] = useState<TrainingReport | null>(null)
  const [editing, setEditing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [draft, setDraft] = useState({
    name: '',
    currentLevel: '',
    clubName: '',
    coachName: '',
  })

  useEffect(() => {
    try { (getCurrentInstance()?.page as any)?.getTabBar?.()?.setSelected?.(2) } catch {}
  }, [])

  useEffect(() => {
    resetDraft()
  }, [profile])

  useDidShow(async () => {
    try { (getCurrentInstance()?.page as any)?.getTabBar?.()?.setSelected?.(2) } catch {}
    const remoteProfile = await authService.getProfile().catch(() => null)
    if (remoteProfile) {
      Taro.setStorageSync('profile', remoteProfile)
      setProfile(remoteProfile)
    }
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

  function resetDraft() {
    setDraft({
      name: profile?.name || '',
      currentLevel: profile?.currentLevel || '',
      clubName: profile?.clubName || '',
      coachName: profile?.coachName || '',
    })
  }

  function startEditProfile() {
    resetDraft()
    setEditing(true)
  }

  async function saveProfile() {
    if (savingProfile) return
    const name = draft.name.trim()
    if (!name) {
      Taro.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }
    try {
      setSavingProfile(true)
      const updated = await authService.updateProfile({
        name,
        currentLevel: draft.currentLevel.trim() || '未设置级别',
        clubName: draft.clubName.trim(),
        coachName: draft.coachName.trim(),
      })
      Taro.setStorageSync('profile', updated)
      setProfile(updated)
      setEditing(false)
      Taro.showToast({ title: '资料已保存', icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
    } finally {
      setSavingProfile(false)
    }
  }

  const initial = profile?.name?.slice(0, 1) ?? '学'
  const trendReports = reports.slice(0, 5).reverse()
  const maxScore = trendReports.reduce((m, r) => Math.max(m, r.overallScore), 1)

  return (
    <View className='page'>
      {/* 头部 */}
      <View className='profile-header'>
        <View className='profile-avatar'>
          {profile?.avatarUrl
            ? <Image src={profile.avatarUrl} className='profile-avatar-img' />
            : <Text>{initial}</Text>
          }
        </View>
        <View className='profile-name'>{profile?.name ?? '内测会员'}</View>
        <View className='profile-level'>{profile?.currentLevel ?? '未设置级别'}</View>
        <View className='profile-edit-btn' onClick={startEditProfile}>编辑资料</View>
      </View>

      {editing && (
        <View className='card profile-edit-card'>
          <View className='profile-edit-title'>个人信息</View>
          <View className='profile-field'>
            <Text className='profile-field-label'>昵称</Text>
            <Input
              className='profile-input'
              value={draft.name}
              maxlength={20}
              placeholder='填写昵称'
              placeholderClass='profile-placeholder'
              onInput={(e) => setDraft(prev => ({ ...prev, name: String(e.detail.value || '') }))}
            />
          </View>
          <View className='profile-field'>
            <Text className='profile-field-label'>当前级别</Text>
            <Input
              className='profile-input'
              value={draft.currentLevel}
              maxlength={24}
              placeholder='如：初级进阶'
              placeholderClass='profile-placeholder'
              onInput={(e) => setDraft(prev => ({ ...prev, currentLevel: String(e.detail.value || '') }))}
            />
          </View>
          <View className='profile-field'>
            <Text className='profile-field-label'>所属俱乐部</Text>
            <Input
              className='profile-input'
              value={draft.clubName}
              maxlength={30}
              placeholder='可选'
              placeholderClass='profile-placeholder'
              onInput={(e) => setDraft(prev => ({ ...prev, clubName: String(e.detail.value || '') }))}
            />
          </View>
          <View className='profile-field'>
            <Text className='profile-field-label'>绑定教练</Text>
            <Input
              className='profile-input'
              value={draft.coachName}
              maxlength={20}
              placeholder='可选'
              placeholderClass='profile-placeholder'
              onInput={(e) => setDraft(prev => ({ ...prev, coachName: String(e.detail.value || '') }))}
            />
          </View>
          <View className='profile-edit-actions'>
            <View
              className='profile-action profile-action-ghost'
              onClick={() => { resetDraft(); setEditing(false) }}
            >
              取消
            </View>
            <View className='profile-action profile-action-primary' onClick={saveProfile}>
              {savingProfile ? '保存中' : '保存'}
            </View>
          </View>
        </View>
      )}

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
