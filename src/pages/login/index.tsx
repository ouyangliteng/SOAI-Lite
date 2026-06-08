import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'
import * as mockAuth from '../../services/mock/auth'
import './index.scss'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { setToken, setProfile } = useAuthStore()

  async function handleWxLogin() {
    if (loading) return
    try {
      setLoading(true)
      const { code } = await Taro.login()
      const { token, profile } = await mockAuth.loginWithWx(code)
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
        <View className='lp-logo'>SOAI</View>
        <View className='lp-sub'>马术姿态 AI 评估</View>
        <View className='lp-tagline'>专业骑手训练分析平台</View>
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
