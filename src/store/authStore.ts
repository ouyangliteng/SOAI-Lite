import { create } from 'zustand'
import type { StudentProfile } from '../services/types'

interface AuthState {
  token: string | null
  profile: StudentProfile | null
  isLoggedIn: () => boolean
  setToken: (token: string) => void
  setProfile: (profile: StudentProfile) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  profile: null,
  isLoggedIn: () => !!get().token,
  setToken: (token) => set({ token }),
  setProfile: (profile) => set({ profile }),
  logout: () => set({ token: null, profile: null }),
}))
