import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useAuthStore } from './store/authStore'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  const { setToken, setProfile, isLoggedIn } = useAuthStore()

  useEffect(() => {
    const token = Taro.getStorageSync('token') as string
    const profile = Taro.getStorageSync('profile')
    if (token) {
      setToken(token)
      if (profile) setProfile(profile)
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  }, [isLoggedIn()])

  return <>{children}</>
}

export default App
