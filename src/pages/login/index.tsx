import { useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services'
import './index.scss'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [agreePolicy, setAgreePolicy] = useState(false)
  const { setToken, setProfile } = useAuthStore()

  useEffect(() => {
    const token = Taro.getStorageSync('token') as string
    const profile = Taro.getStorageSync('profile')
    if (!token) return
    setToken(token)
    if (profile) setProfile(profile)
    Taro.switchTab({ url: '/pages/home/index' })
  }, [setProfile, setToken])

  async function handleWxLogin() {
    if (loading) return
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
      Taro.setStorageSync('token', token)
      Taro.setStorageSync('profile', profile)
      setToken(token)
      setProfile(profile)
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e: any) {
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
        <View
          className={`lp-wx-btn${loading ? ' lp-wx-btn-loading' : ''}`}
          onClick={handleWxLogin}
        >
          <Text className='lp-wx-icon'>🟢</Text>
          <Text className='lp-wx-text'>{loading ? '登录中…' : '微信授权登录'}</Text>
        </View>

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

        <View className='lp-version'>邀请版SOAI-EQ 2026</View>
      </View>
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

function getOrCreateAnonymousId() {
  const key = 'soai_lite_anonymous_id'
  const saved = Taro.getStorageSync(key)
  if (saved) return saved
  const next = `lite_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  Taro.setStorageSync(key, next)
  return next
}
