import { useAuthStore } from '../../src/store/authStore'

beforeEach(() => {
  useAuthStore.setState({ token: null, profile: null })
})

test('initial state is logged out', () => {
  expect(useAuthStore.getState().isLoggedIn()).toBe(false)
})

test('setToken marks user as logged in', () => {
  useAuthStore.getState().setToken('abc123')
  expect(useAuthStore.getState().isLoggedIn()).toBe(true)
  expect(useAuthStore.getState().token).toBe('abc123')
})

test('logout clears token and profile', () => {
  useAuthStore.getState().setToken('abc123')
  useAuthStore.getState().logout()
  expect(useAuthStore.getState().isLoggedIn()).toBe(false)
  expect(useAuthStore.getState().token).toBeNull()
})
