import type { StudentProfile } from '../types'

const BASE = process.env.API_BASE_URL || 'https://lite.soai.yun/api/lite/v1'

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = ''
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function sendCode(phone: string): Promise<void> {
  await request('/auth/send-code', { method: 'POST', body: JSON.stringify({ phone }) })
}

export async function verifyCode(
  phone: string,
  code: string
): Promise<{ token: string; profile: StudentProfile }> {
  return request('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  })
}
