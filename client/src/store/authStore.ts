import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, AuthState } from '@/types'
import { api, extractApiError } from '@/lib/api'

interface AuthResponse {
  user: AuthUser
  token: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const { data } = await api.post('/auth/login', {
            email: email.trim().toLowerCase(),
            password,
          })
          const { user, token } = data.data as AuthResponse
          set({ user, token, isAuthenticated: true })
          return { success: true }
        } catch (err) {
          return { success: false, error: extractApiError(err, 'Invalid email or password.') }
        }
      },

      register: async (name: string, email: string, password: string) => {
        try {
          const { data } = await api.post('/auth/register', {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          })
          const { user, token } = data.data as AuthResponse
          set({ user, token, isAuthenticated: true })
          return { success: true }
        } catch (err) {
          return { success: false, error: extractApiError(err, 'Could not create your account.') }
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user: AuthUser) => set({ user }),
    }),
    {
      name: 'questigo-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
