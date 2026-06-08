import { sendCode, verifyCode } from '../../src/services/mock/auth'

test('sendCode resolves without error', async () => {
  await expect(sendCode('13800138000')).resolves.toBeUndefined()
})

test('verifyCode returns token and profile', async () => {
  const result = await verifyCode('13800138000', '123456')
  expect(result.token).toBeTruthy()
  expect(result.profile.phone).toBe('13800138000')
})

test('verifyCode wrong code throws', async () => {
  await expect(verifyCode('13800138000', '000000')).rejects.toThrow('验证码错误')
})
