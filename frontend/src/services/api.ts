// ─── API Service Layer ─────────────────────────────────────────────────────
// Central axios client with auth token injection and global 401 handling.
// All API calls across the app go through the grouped exports below
// (authApi, workoutApi, nutritionApi, etc.) rather than using axios directly.

import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_BASE = '/api'

// ─── Axios Instance ────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})


// ─── Request Interceptor — Auth Token ─────────────────────────────────────
// Reads the JWT from Zustand state (single source of truth) on every request.
// This avoids a stale token from a manually-maintained localStorage key.

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


// ─── Response Interceptor — Global 401 Handling ────────────────────────────
// Any 401 clears auth state and redirects to /login so the user isn't left
// stuck on a protected page with an expired or invalid token.

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)


// ─── Auth API ──────────────────────────────────────────────────────────────

export const authApi = {
  register:    (data: any)             => apiClient.post('/auth/register', data),
  login:       (username: string, password: string) => {
    // Login uses OAuth2PasswordRequestForm so must be sent as FormData
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    return axios.post(`${API_BASE}/auth/login`, formData)
  },
  getMe:       ()                      => apiClient.get('/auth/me'),
  updateMe:    (data: any)             => apiClient.put('/auth/me', data),
  uploadPhoto: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/auth/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deletePhoto: () => apiClient.delete('/auth/photo'),
}


// ─── Workout API ───────────────────────────────────────────────────────────

export const workoutApi = {
  generate:        (days = 7)                                        => apiClient.post('/workouts/generate', { days }),
  getCurrent:      ()                                                => apiClient.get('/workouts/current'),
  getHistory:      ()                                                => apiClient.get('/workouts/history'),
  getVideos:       (exercise: string)                                => apiClient.get(`/workouts/videos/${encodeURIComponent(exercise)}`),
  getCompleted:    ()                                                => apiClient.get('/workouts/completed'),
  saveCompleted:   (completed: Record<string, boolean>)              => apiClient.put('/workouts/completed', { completed_exercises: completed }),
  completeExercise:(data: { exercise_key: string; exercise_name: string; calories_burned: number }) =>
                                                                        apiClient.post('/workouts/complete-exercise', data),
}


// ─── Nutrition API ─────────────────────────────────────────────────────────

export const nutritionApi = {
  generate:        (days = 7, allergies: string[] = [])              => apiClient.post('/nutrition/generate', { days, allergies }),
  getCurrent:      ()                                                => apiClient.get('/nutrition/current'),
  completeMeal:    (meal_key: string)                                => apiClient.post('/nutrition/complete-meal', { meal_key }),
  getRecipes:      (mealType = 'main course')                        => apiClient.get(`/nutrition/recipes?meal_type=${mealType}`),
  getRecipeVideos: (mealName: string)                                => apiClient.get(`/nutrition/videos/${encodeURIComponent(mealName)}`),
}


// ─── Progress API ──────────────────────────────────────────────────────────

export const progressApi = {
  log:        (data: any)       => apiClient.post('/progress/log', data),
  getHistory: (limit = 30)      => apiClient.get(`/progress/history?limit=${limit}`),
  getStats:   ()                => apiClient.get('/progress/stats'),
}


// ─── Health API ────────────────────────────────────────────────────────────

export const healthApi = {
  submitAssessment: (data: any) => apiClient.post('/health/assessment/submit', data),
  analyze:          (data: any) => apiClient.post('/health/analysis/analyze', data),
  getLatest:        ()          => apiClient.get('/health/assessment/latest'),
}


// ─── Chat (AROMI) API ──────────────────────────────────────────────────────

export const chatApi = {
  sendMessage:  (message: string, userStatus = 'normal') =>
    apiClient.post('/ai-coach/aromi-chat', { message, user_status: userStatus }),
  getHistory:   () => apiClient.get('/ai-coach/chat-history'),
  clearHistory: () => apiClient.delete('/ai-coach/chat-history'),
}


// ─── Google Calendar API ───────────────────────────────────────────────────

export const calendarApi = {
  getStatus:     () => apiClient.get('/calendar/status'),
  authorize:     () => apiClient.get('/calendar/authorize'),
  disconnect:    () => apiClient.delete('/calendar/disconnect'),
  syncWorkout:   () => apiClient.post('/calendar/sync-workout'),
  syncNutrition: () => apiClient.post('/calendar/sync-nutrition'),
}

export { apiClient }
