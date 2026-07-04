import { useEffect, useState } from 'react'
import { View, Text, Image, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'
import { authService, inviteService } from '../../services'
import type { StudentProfile } from '../../services/types'
import './index.scss'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [agreePolicy, setAgreePolicy] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteVerifiedAt, setInviteVerifiedAt] = useState(() => getInviteVerifiedAt())
  const { setToken, setProfile, logout } = useAuthStore()

  useEffect(() => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('profile')
    logout()
    setInviteVerifiedAt(getInviteVerifiedAt())
  }, [logout])

  async function handleWxLogin() {
    if (loading) return
    const normalizedInviteCode = inviteCode.trim().replace(/\s+/g, '').toUpperCase()
    const hasInviteAccess = Boolean(inviteVerifiedAt)
    if (!hasInviteAccess && !normalizedInviteCode) {
      Taro.showToast({
        title: '请输入内部邀请码',
        icon: 'none',
      })
      return
    }
    if (!agreePolicy) {
      Taro.showToast({
        title: '请先阅读并同意相关协议',
        icon: 'none',
      })
      return
    }
    try {
      setLoading(true)
      const wxUserInfo = await getWxUserInfo().catch(() => null)
      const { code } = await Taro.login()
      const anonymousId = getOrCreateAnonymousId()
      const { token, profile } = await authService.loginWithWx(code, anonymousId, wxUserInfo || undefined)
      let finalProfile = mergeInviteAccess(mergeWxUserInfo(profile, wxUserInfo), inviteVerifiedAt)
      Taro.setStorageSync('token', token)
      Taro.setStorageSync('profile', finalProfile)
      if (!hasInviteAccess) {
        const inviteResult = await inviteService.verifyInvite(normalizedInviteCode)
        const verifiedAt = inviteResult.profile.inviteVerifiedAt || new Date().toISOString()
        setInviteVerifiedAt(verifiedAt)
        setInviteVerifiedAtStorage(verifiedAt)
        finalProfile = mergeInviteAccess(mergeWxUserInfo(inviteResult.profile, wxUserInfo), verifiedAt)
      }
      if (wxUserInfo?.name || wxUserInfo?.avatarUrl) {
        finalProfile = await authService.updateProfile({
          ...finalProfile,
          name: wxUserInfo.name || finalProfile.name,
          avatarUrl: wxUserInfo.avatarUrl || finalProfile.avatarUrl,
        }).catch(() => finalProfile)
        finalProfile = mergeInviteAccess(mergeWxUserInfo(finalProfile, wxUserInfo), inviteVerifiedAt || finalProfile.inviteVerifiedAt)
      }
      Taro.setStorageSync('profile', finalProfile)
      setToken(token)
      setProfile(finalProfile)
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e: any) {
      if (String(e?.message || '').includes('邀请码')) {
        Taro.removeStorageSync('token')
        Taro.removeStorageSync('profile')
        logout()
      }
      Taro.showToast({ title: e.message || '登录失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  function goAgreement(type: 'user' | 'privacy') {
    Taro.navigateTo({ url: `/pages/agreement/${type}/index` })
  }

  return (
    <View className='lp'>
      <View className='lp-top'>
        <View className='lp-logo-stage'>
          <Image
            className='lp-logo'
            src='/assets/login-soai-logo.png'
            mode='widthFix'
          />
        </View>
        <View className='lp-sub'>马术姿态安全AI评估</View>
        <View className='lp-tagline'>SOAI-EQ专业分析平台</View>
      </View>

      <View className='lp-body'>
        {inviteVerifiedAt ? (
          <View className='lp-invite-panel lp-invite-panel-ok'>
            <Text className='lp-invite-label'>内部测试资格</Text>
            <Text className='lp-invite-ok'>已通过邀请码验证，本次只需微信授权登录</Text>
          </View>
        ) : (
          <View className='lp-invite-panel'>
            <Text className='lp-invite-label'>内部测试邀请码</Text>
            <Input
              className='lp-invite-input'
              value={inviteCode}
              maxlength={24}
              placeholder='请输入 SOAI 内测邀请码'
              placeholderClass='lp-invite-placeholder'
              confirmType='done'
              disabled={loading}
              onInput={(e) => setInviteCode(String(e.detail.value || ''))}
              onConfirm={handleWxLogin}
            />
          </View>
        )}

        <Button
          className={`lp-wx-btn${loading ? ' lp-wx-btn-loading' : ''}`}
          hoverClass='lp-wx-btn-hover'
          disabled={loading}
          onClick={handleWxLogin}
        >
          <Text className='lp-wx-icon'>🟢</Text>
          <Text className='lp-wx-text'>{loading ? '登录中…' : '微信授权登录'}</Text>
        </Button>

        <View className='lp-agreement'>
          <View className='lp-agreement-links'>
            <Text className='lp-link' onClick={() => goAgreement('user')}>《SOAI-EQ用户服务协议》</Text>
            <Text className='lp-link' onClick={() => goAgreement('privacy')}>《SOAI-EQ隐私政策》</Text>
          </View>

          <View className='lp-consent-row'>
            <View
              className={`lp-checkbox${agreePolicy ? ' lp-checkbox-on' : ''}`}
              onClick={() => setAgreePolicy((prev) => !prev)}
            >
              {agreePolicy ? '✓' : ''}
            </View>
            <Text>我已阅读并同意</Text>
          </View>

          <Text className='lp-auth-hint'>勾选后可进行微信授权登录与视频分析授权</Text>
        </View>
      </View>

      <View className='lp-version'>SOAI-EQ 0424</View>
    </View>
  )
}

async function getWxUserInfo() {
  const result = await Taro.getUserProfile({
    desc: '用于在 SOAI 训练报告中显示微信昵称和头像',
  })
  return {
    name: result.userInfo?.nickName || '',
    avatarUrl: result.userInfo?.avatarUrl || '',
  }
}

function mergeWxUserInfo(profile: StudentProfile, wxUserInfo: Pick<StudentProfile, 'name' | 'avatarUrl'> | null) {
  if (!wxUserInfo) return profile
  return {
    ...profile,
    name: wxUserInfo.name || profile.name,
    avatarUrl: wxUserInfo.avatarUrl || profile.avatarUrl,
  }
}

function mergeInviteAccess(profile: StudentProfile, verifiedAt?: string) {
  if (!verifiedAt || profile.inviteVerifiedAt) return profile
  return {
    ...profile,
    inviteStatus: 'verified',
    inviteVerifiedAt: verifiedAt,
  }
}

function getInviteVerifiedAt() {
  return Taro.getStorageSync('soai_lite_invite_verified_at') as string
}

function setInviteVerifiedAtStorage(verifiedAt: string) {
  Taro.setStorageSync('soai_lite_invite_verified_at', verifiedAt)
}

function getOrCreateAnonymousId() {
  const key = 'soai_lite_anonymous_id'
  const saved = Taro.getStorageSync(key)
  if (saved) return saved
  const next = `lite_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  Taro.setStorageSync(key, next)
  return next
}
