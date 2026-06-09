import type { InviteAccess, StudentProfile } from '../types'

export async function verifyInvite(inviteCode: string): Promise<{
  success: boolean
  profile: StudentProfile
  inviteAccess: InviteAccess
  message?: string
}> {
  if (inviteCode.trim().toUpperCase() !== 'SOAI2026') {
    throw new Error('邀请码不正确，请向 SOAI 内测负责人确认。')
  }
  const profile = {
    id: 'student_mock',
    name: '内测学员',
    phone: '',
    currentLevel: '初级进阶',
    analysisConsent: true,
    caseConsent: false,
    inviteStatus: 'verified',
    inviteVerifiedAt: new Date().toISOString(),
  }
  return {
    success: true,
    profile,
    inviteAccess: {
      required: true,
      verified: true,
      verifiedAt: profile.inviteVerifiedAt,
      maxUsers: 20,
      acceptedUsers: 1,
    },
    message: '内测邀请码已通过，可以上传真实姿态识别视频。',
  }
}
