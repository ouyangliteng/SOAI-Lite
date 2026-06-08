import { useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import './index.scss'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const { setToken, setProfile } = useAuthStore()

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleSendCode() {
    if (phone.length !== 11 || countdown > 0) return
    try {
      setLoading(true)
      await authService.sendCode(phone)
      setCodeSent(true)
      setCountdown(60)
      Taro.showToast({ title: '验证码已发送', icon: 'success' })
    } catch {
      Taro.showToast({ title: '发送失败，请重试', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    if (code.length !== 6) return
    try {
      setLoading(true)
      const { token, profile } = await authService.verifyCode(phone, code)
      Taro.setStorageSync('token', token)
      Taro.setStorageSync('profile', profile)
      setToken(token)
      setProfile(profile)
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e: any) {
      Taro.showToast({ title: e.message || '登录失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-logo'>
        <Text className='login-logo-text'>SOAI</Text>
        <View className='login-logo-sub'>马术姿态 AI 评估</View>
      </View>

      <View className='login-card'>
        <View className='field'>
          <View className='field-label'>手机号</View>
          <View className='phone-row'>
            <View className='phone-prefix'>+86</View>
            <Input
              className='input phone-input'
              type='number'
              maxlength={11}
              placeholder='请输入手机号'
              placeholderStyle='color:#8b949e'
              value={phone}
              onInput={e => setPhone(e.detail.value)}
            />
          </View>
        </View>

        {codeSent && (
          <View className='field' style={{ marginTop: '24rpx' }}>
            <View className='field-label'>验证码</View>
            <View className='row'>
              <Input
                className='input'
                style={{ flex: 1 }}
                type='number'
                maxlength={6}
                placeholder='6 位验证码'
                placeholderStyle='color:#8b949e'
                value={code}
                onInput={e => setCode(e.detail.value)}
              />
              <View
                className={`send-btn ${countdown > 0 ? 'send-btn-disabled' : ''}`}
                onClick={handleSendCode}
              >
                {countdown > 0 ? `${countdown}s` : '重新发送'}
              </View>
            </View>
          </View>
        )}

        {!codeSent ? (
          <View
            className='btn btn-primary'
            style={{ marginTop: '40rpx' }}
            onClick={handleSendCode}
          >
            {loading ? '发送中…' : '获取验证码'}
          </View>
        ) : (
          <View
            className='btn btn-primary'
            style={{ marginTop: '40rpx' }}
            onClick={handleLogin}
          >
            {loading ? '登录中…' : '登录'}
          </View>
        )}
      </View>

      <View className='login-hint'>
        登录即同意《隐私说明》与视频分析授权
      </View>
    </View>
  )
}
