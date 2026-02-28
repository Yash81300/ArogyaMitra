// ─── API Service Layer ─────────────────────────────────────────────────────
// Central axios client with auth token injection and global 401 handling.
// All API calls across the app go through the grouped exports below
// (authApi, workoutApi, nutritionApi, etc.) rather than using axios directly.

import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// In production (Railway), VITE_API_URL is set to the backend service URL.
// In development, requests go to /api and are proxied by Vite to localhost:8000.
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

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
