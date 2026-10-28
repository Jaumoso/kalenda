import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  language?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean | null
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: null,
      isLoading: false,

      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password, rememberMe })
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          if (error instanceof Error && 'response' in error) {
            const axiosError = error as { response?: { data?: { message?: string } } }
            const loginError = new Error(axiosError.response?.data?.message || 'Login failed')
            Object.assign(loginError, { cause: error })
            throw loginError
          }
          throw error
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            isAuthenticated: false,
          })
        }
      },

      checkAuth: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({
            user: data.user,
            isAuthenticated: true,
          })
        } catch {
          set({
            user: null,
            isAuthenticated: false,
          })
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        }))
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
