import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useAuthStore } from './store/authStore'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  const { setToken, setProfile } = useAuthStore()

  useEffect(() => {
    const token = Taro.getStorageSync('token') as string
    const profile = Taro.getStorageSync('profile')
    if (token) {
      setToken(token)
      if (profile) setProfile(profile)
    }
  }, [])

  return <>{children}</>
}

export default App
