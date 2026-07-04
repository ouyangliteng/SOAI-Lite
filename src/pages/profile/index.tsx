import { useState, useEffect } from 'react'
import { View, Text, Input, Image } from '@tarojs/components'
import Taro, { getCurrentInstance, useDidShow } from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'
import { authService, reportService } from '../../services'
import type { ReportListItem, TrainingReport } from '../../services/types'
import './index.scss'

function getReportTime(item: ReportListItem) {
  return item.reportTime || item.createdAt || item.trainingDate || ''
}

function formatTrendDate(item: ReportListItem, index: number, total: number) {
  const base = (item.trainingDate || '').slice(5) || `第${index + 1}次`
  return total > 1 ? `${base}\n#${index + 1}` : base
}

export default function ProfilePage() {
  const { profile, setProfile, logout } = useAuthStore()
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [latestDetail, setLatestDetail] = useState<TrainingReport | null>(null)
  const [editing, setEditing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [localAvatarPath, setLocalAvatarPath] = useState('')
  const [draft, setDraft] = useState({
    name: '',
    currentLevel: '',
    clubName: '',
    coachName: '',
    avatarUrl: '',
  })

  useEffect(() => {
    try { (getCurrentInstance()?.page as any)?.getTabBar?.()?.setSelected?.(2) } catch {}
  }, [])

  useEffect(() => {
    if (editing) return  // don't clobber in-progress edits when profile refreshes
    resetDraft()
  }, [profile, editing])

  useDidShow(async () => {
    try { (getCurrentInstance()?.page as any)?.getTabBar?.()?.setSelected?.(2) } catch {}
    const remoteProfile = await authService.getProfile().catch(() => null)
    if (remoteProfile) {
      Taro.setStorageSync('profile', remoteProfile)
      setProfile(remoteProfile)
    }
    const list = await reportService.listReports().catch(() => [])
    const sorted = [...list].sort((a, b) => getReportTime(b).localeCompare(getReportTime(a)))
    setReports(sorted)
    if (sorted[0]) {
      const detail = await reportService.getReport(sorted[0].id).catch(() => null)
      setLatestDetail(detail)
    } else {
      setLatestDetail(null)
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

  function goAgreement(type: 'user' | 'privacy' | 'minor') {
    Taro.navigateTo({ url: `/pages/agreement/${type}/index` })
  }

  function showAbout() {
    Taro.showModal({
      title: '关于SOAI',
      content: 'SOAI-EQ马术姿态识别平台，为马术训练视频分析、骑乘姿态识别、AI训练报告与教学辅助提供服务。',
      showCancel: false,
    })
  }

  function showContact() {
    Taro.showModal({
      title: '联系我们',
      content: '联系邮箱：67260777@qq.com\n官方网站：https://soai.yun',
      showCancel: false,
    })
  }

  function showAccountCancel() {
    Taro.showModal({
      title: '账号注销',
      content: '如需注销账号，请发送申请至 67260777@qq.com。我们将在核验身份后按隐私政策处理账号与数据删除。',
      showCancel: false,
    })
  }

  function resetDraft() {
    setDraft({
      name: profile?.name || '',
      currentLevel: profile?.currentLevel || '',
      clubName: profile?.clubName || '',
      coachName: profile?.coachName || '',
      avatarUrl: profile?.avatarUrl || '',
    })
    setLocalAvatarPath('')
  }

  async function pickAvatar() {
    try {
      // chooseMedia is the current recommended API (wx 2.21.2+)
      const res = await (Taro as any).chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
      })
      const path = res.tempFiles?.[0]?.tempFilePath
      if (path) {
        setLocalAvatarPath(path)
        return
      }
    } catch { /* chooseMedia not available, fall through */ }
    // fallback: legacy chooseImage
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      const path = res.tempFiles?.[0]?.path || res.tempFilePaths?.[0]
      if (path) setLocalAvatarPath(path)
    } catch { /* user cancelled */ }
  }

  function startEditProfile() {
    resetDraft()
    setEditing(true)
    setTimeout(() => {
      try {
        Taro.pageScrollTo({ selector: '.profile-edit-card', duration: 220 })
      } catch {}
    }, 60)
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
      let avatarUrl = draft.avatarUrl
      if (localAvatarPath) {
        setUploadingAvatar(true)
        try {
          avatarUrl = await authService.uploadAvatar(localAvatarPath)
        } catch {
          Taro.showToast({ title: '头像上传失败，其他资料已保存', icon: 'none', duration: 2500 })
        } finally {
          setUploadingAvatar(false)
        }
      }
      const updated = await authService.updateProfile({
        name,
        currentLevel: draft.currentLevel.trim() || '未设置级别',
        clubName: draft.clubName.trim(),
        coachName: draft.coachName.trim(),
        avatarUrl,
      })
      Taro.setStorageSync('profile', updated)
      setProfile(updated)
      setLocalAvatarPath('')
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

  function renderProfileEditor() {
    const avatarSrc = localAvatarPath || draft.avatarUrl
    return (
      <View className='card profile-edit-card'>
        <View className='profile-edit-title'>个人信息</View>

        {/* 头像选取 */}
        <View className='edit-avatar-wrap'>
          <View className='profile-avatar' onClick={pickAvatar}>
            {avatarSrc
              ? <Image src={avatarSrc} className='profile-avatar-img' mode='aspectFill' />
              : <Text>{initial}</Text>
            }
          </View>
          <View className='edit-avatar-btn' onClick={pickAvatar}>
            <Text>{uploadingAvatar ? '上传中…' : '📷 更换头像'}</Text>
          </View>
        </View>

        <View className='profile-field'>
          <Text className='profile-field-label'>昵称</Text>
          <Input
            className='profile-input'
            value={draft.name}
            maxlength={20}
            placeholder='填写昵称'
            placeholderClass='profile-placeholder'
            adjustPosition
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
            adjustPosition
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
            adjustPosition
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
            adjustPosition
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
    )
  }

  return (
    <View className='page profile-page'>
      {/* 头部 */}
      <View className='profile-header'>
        <View className='profile-avatar'>
          {(editing && localAvatarPath)
            ? <Image src={localAvatarPath} className='profile-avatar-img' mode='aspectFill' />
            : profile?.avatarUrl
              ? <Image src={profile.avatarUrl} className='profile-avatar-img' mode='aspectFill' />
              : <Text>{initial}</Text>
          }
        </View>
        <View className='profile-name'>{profile?.name ?? '内测会员'}</View>
        <View className='profile-level'>{profile?.currentLevel ?? '未设置级别'}</View>
        <View className='profile-edit-btn' onClick={startEditProfile}>编辑资料</View>
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
                <Text className='trend-date'>{formatTrendDate(r, i, trendReports.length)}</Text>
              </View>
            ))}
          </View>
          {reports.length > 1 ? (
            <View className='trend-summary'>
              {reports[0].overallScore > reports[reports.length - 1].overallScore
                ? '↑ 综合得分呈上升趋势，训练效果持续改善'
                : reports[0].overallScore === reports[reports.length - 1].overallScore
                ? '→ 综合得分保持稳定'
                : '↓ 综合得分近期有所下降，建议重点复盘'}
            </View>
          ) : (
            <View className='trend-summary trend-summary-muted'>
              已记录 1 次训练，完成第 2 次不同视频分析后生成历史走向。
            </View>
          )}
        </View>
      )}

      {reports.length > 0 && (
        <View className='card' style={{ marginTop: '20rpx' }}>
          <View className='row'>
            <View className='card-title'>历史训练记录</View>
            <View className='history-count'>近 {reports.length} 次</View>
          </View>
          <View className='history-list'>
            {reports.map((r, i) => (
              <View
                key={r.id}
                className='history-item'
                onClick={() => Taro.navigateTo({ url: `/pages/report-detail/index?id=${r.id}` })}
              >
                <View>
                  <Text className='history-score'>{r.overallScore}</Text>
                  <Text className='history-unit'>分</Text>
                </View>
                <View className='history-main'>
                  <View className='history-title'>第 {reports.length - i} 次训练</View>
                  <View className='history-text'>{r.oneLineConclusion || '训练报告已生成'}</View>
                </View>
                <View className='history-side'>
                  <Text className='history-date'>{r.trainingDate}</Text>
                  <Text className='menu-arrow'>›</Text>
                </View>
              </View>
            ))}
          </View>
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
      {editing ? renderProfileEditor() : (
        <View className='card profile-info-card'>
          <View className='profile-info-head'>
            <View className='card-title'>个人信息</View>
            <View className='profile-info-edit' onClick={startEditProfile}>编辑</View>
          </View>
          <View className='menu-list profile-info-list'>
            {[
              { label: '当前级别', value: profile?.currentLevel ?? '未填写' },
              { label: '所属俱乐部', value: profile?.clubName ?? '未填写' },
              { label: '绑定教练',  value: profile?.coachName ?? '未绑定' },
            ].map(item => (
              <View key={item.label} className='menu-item menu-item-clickable' onClick={startEditProfile}>
                <Text className='menu-label'>{item.label}</Text>
                <View className='profile-info-value'>
                  <Text className='menu-value'>{item.value}</Text>
                  <Text className='menu-arrow'>›</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className='card' style={{ marginTop: '20rpx' }}>
        <View className='menu-list'>
          {[
            { label: '关于SOAI', action: showAbout },
            { label: '用户协议', action: () => goAgreement('user') },
            { label: '隐私政策', action: () => goAgreement('privacy') },
            { label: '未成年人保护', action: () => goAgreement('minor') },
            { label: '联系我们', action: showContact },
            { label: '账号注销', action: showAccountCancel },
          ].map(item => (
            <View key={item.label} className='menu-item menu-item-clickable' onClick={item.action}>
              <Text className='menu-label'>{item.label}</Text>
              <Text className='menu-arrow'>›</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='logout-btn' onClick={handleLogout}>退出登录</View>
    </View>
  )
}
