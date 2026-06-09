import Taro from '@tarojs/taro'
import type { InviteAccess, StudentProfile } from '../types'

const BASE = process.env.API_BASE_URL || 'https://api.soai.yun/api/lite/v1'

function request<T>(path: string, opts?: { method?: 'POST'; body?: object }): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = Taro.getStorageSync('token') || ''
    Taro.request({
      url: `${BASE}${path}`,
      method: opts?.method || 'GET',
      data: opts?.body,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      success: (res) => {
        if (res.statusCode >= 400) {
          reject(new Error((res.data as any)?.message || `API ${res.statusCode}`))
        } else {
          resolve(res.data as T)
        }
      },
      fail: (err) => reject(new Error(err.errMsg)),
    })
  })
}

export async function verifyInvite(inviteCode: string): Promise<{
  success: boolean
  profile: StudentProfile
  inviteAccess: InviteAccess
  message?: string
}> {
  return request('/invite/verify', {
    method: 'POST',
    body: { inviteCode: inviteCode.trim() },
  })
}
