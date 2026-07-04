import { useEffect, useRef } from 'react'
import Taro, { useDidHide, useDidShow } from '@tarojs/taro'
import { useAuthStore } from './store/authStore'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  const firstShowRef = useRef(true)
  const { logout } = useAuthStore()

  useEffect(() => {
    clearSession()
    logout()
  }, [logout])

  useDidHide(() => {
    clearSession()
    logout()
  })

  useDidShow(() => {
    if (firstShowRef.current) {
      firstShowRef.current = false
      return
    }
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.reLaunch({ url: '/pages/login/index' }).catch(() => {})
    }
  })

  return <>{children}</>
}

function clearSession() {
  Taro.removeStorageSync('token')
  Taro.removeStorageSync('profile')
}

export default App
