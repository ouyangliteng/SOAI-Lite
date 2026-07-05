import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useAuthStore } from './store/authStore'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  const { logout } = useAuthStore()

  useEffect(() => {
    clearSession()
    logout()
  }, [logout])

  return <>{children}</>
}

function clearSession() {
  Taro.removeStorageSync('token')
  Taro.removeStorageSync('profile')
}

export default App
