import { useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services'
import './index.scss'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { setToken, setProfile } = useAuthStore()

  async function handleWxLogin() {
    if (loading) return
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

  return (
    <View className='lp'>
      <View className='lp-top'>
        <Image
          className='lp-logo'
          src='/assets/login-soai-logo.png'
          mode='widthFix'
        />
        <View className='lp-sub'>马术姿态 AI 评估</View>
        <View className='lp-tagline'>SOAI-EQ训练平台</View>
      </View>

      <View className='lp-body'>
        <View
          className={`lp-wx-btn${loading ? ' lp-wx-btn-loading' : ''}`}
          onClick={handleWxLogin}
        >
          <Text className='lp-wx-icon'>🟢</Text>
          <Text className='lp-wx-text'>{loading ? '登录中…' : '微信授权登录'}</Text>
        </View>

        <View className='lp-hint'>
          登录即同意《隐私说明》与视频分析授权
        </View>
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
