// ─── Auth Store ────────────────────────────────────────────────────────────
// Zustand store that manages authentication state across the app.
// State is persisted to localStorage under the key "auth-storage" via the
// `persist` middleware so the user stays logged in across page refreshes.
//
// The JWT token is the single source of truth — the axios interceptor in
// api.ts reads it directly from this store on every request.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'


// ─── Types ─────────────────────────────────────────────────────────────────

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  is_active: boolean

  // ── Fitness Profile ──────────────────────────────────────────────────────
  fitness_level?: string
  fitness_goal?: string
  workout_preference?: string
  diet_preference?: string
  age?: number
  height?: number      // cm
  weight?: number      // kg
  gender?: string

  // ── Gamification ────────────────────────────────────────────────────────
  streak_points: number
  total_workouts: number
  charity_donations: number

  // ── Optional Profile Fields ──────────────────────────────────────────────
  phone?: string
  bio?: string
  profile_photo_url?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  lastRefresh: number | null   // Unix timestamp of last /auth/me refresh

  // ── Actions ───────────────────────────────────────────────────────────────
  setUser:     (user: User) => void
  setToken:    (token: string) => void
  logout:      () => void
  refreshUser: () => Promise<void>
  updateUser:  (data: Partial<User>) => void
}


// ─── Store ─────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      lastRefresh: null,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setToken: (token) => {
        // Zustand persist writes to localStorage automatically — no need to
        // call localStorage.setItem manually (which would create a second,
        // out-of-sync copy of the token).
        set({ token })
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      refreshUser: async () => {
        try {
          const res = await authApi.getMe()
          const current = get().user
          set({ user: { ...current, ...res.data }, isAuthenticated: true, lastRefresh: Date.now() })
        } catch {
          get().logout()
        }
      },

      updateUser: (data) => {
        const current = get().user
        if (current) {
          set({ user: { ...current, ...data } })
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist the fields needed to restore session on reload
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastRefresh: state.lastRefresh,
      }),
    }
  )
)
