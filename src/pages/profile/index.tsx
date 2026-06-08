import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/authStore'
import './index.scss'

export default function ProfilePage() {
  const { profile, logout } = useAuthStore()

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

  const initial = profile?.name?.slice(0, 1) ?? '学'
  const maskedPhone = profile?.phone
    ? `${profile.phone.slice(0, 3)}****${profile.phone.slice(-4)}`
    : '--'

  const menuItems = [
    { label: '手机号',   value: maskedPhone },
    { label: '所属俱乐部', value: profile?.clubName ?? '未填写' },
    { label: '绑定教练',  value: profile?.coachName ?? '未绑定' },
    { label: '当前级别',  value: profile?.currentLevel ?? '未填写' },
  ]

  return (
    <View className='page'>
      <View className='profile-header'>
        <View className='profile-avatar'>{initial}</View>
        <View className='profile-name'>{profile?.name ?? '学员'}</View>
        <View className='profile-level'>{profile?.currentLevel ?? '未设置级别'}</View>
      </View>

      <View className='card' style={{ marginTop: '40rpx' }}>
        <View className='menu-list'>
          {menuItems.map(item => (
            <View key={item.label} className='menu-item'>
              <Text className='menu-label'>{item.label}</Text>
              <Text className='menu-value'>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='logout-btn' onClick={handleLogout}>退出登录</View>
    </View>
  )
}
