import type { StudentProfile } from '../types'

const MOCK_CODE = '123456'

export async function sendCode(_phone: string): Promise<void> {
  await delay(300)
}

export async function verifyCode(
  phone: string,
  code: string
): Promise<{ token: string; profile: StudentProfile }> {
  await delay(500)
  if (code !== MOCK_CODE) throw new Error('验证码错误')
  return {
    token: `mock_jwt_${Date.now()}`,
    profile: {
      id: 'student_001',
      name: '测试学员',
      phone,
      currentLevel: '初级',
      analysisConsent: true,
      caseConsent: false,
    },
  }
}

export async function loginWithWx(
  _code: string,
  anonymousId = 'mock',
  userInfo: Partial<import('../types').StudentProfile> = {}
): Promise<{ token: string; profile: import('../types').StudentProfile }> {
  await delay(600)
  return {
    token: `mock_wx_jwt_${Date.now()}`,
    profile: {
      id: `student_mock_${anonymousId}`,
      name: userInfo.name || '内测会员',
      phone: '',
      currentLevel: '初级骑手',
      avatarUrl: userInfo.avatarUrl || '',
      analysisConsent: true,
      caseConsent: false,
    },
  }
}

export async function getProfile(): Promise<import('../types').StudentProfile> {
  await delay(120)
  return {
    id: 'student_mock',
    name: '内测会员',
    phone: '',
    currentLevel: '初级进阶',
    clubName: '',
    coachName: '',
    analysisConsent: true,
    caseConsent: false,
  }
}

export async function updateProfile(
  payload: Partial<import('../types').StudentProfile>
): Promise<import('../types').StudentProfile> {
  await delay(200)
  return {
    id: 'student_mock',
    name: payload.name || '内测会员',
    phone: payload.phone || '',
    currentLevel: payload.currentLevel || '初级进阶',
    clubName: payload.clubName || '',
    coachName: payload.coachName || '',
    avatarUrl: payload.avatarUrl || '',
    analysisConsent: true,
    caseConsent: false,
  }
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
