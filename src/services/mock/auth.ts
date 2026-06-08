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

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
