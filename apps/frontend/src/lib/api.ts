import axios from 'axios'
import { toast } from '../stores/toastStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor: auto-refresh on 401
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(undefined)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Don't retry refresh, login, or session check requests
    if (
      originalRequest.url === '/auth/refresh' ||
      originalRequest.url === '/auth/login' ||
      originalRequest.url === '/auth/me' ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/auth/refresh')
        processQueue(null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Friendly error messages
const ERROR_MESSAGES: Record<number, string> = {
  400: 'The submitted data is invalid',
  403: 'You do not have permission for this action',
  404: 'The requested resource was not found',
  413: 'The file is too large',
  429: 'Too many requests, please wait a moment',
  500: 'Server error, please try again',
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    // Don't show toasts for auth endpoints or silent requests
    const isSilent =
      url === '/auth/me' ||
      url === '/auth/refresh' ||
      url === '/auth/login' ||
      error.config?._silent

    if (!isSilent && status && status >= 400) {
      const serverMsg = error.response?.data?.message
      const msg = serverMsg || ERROR_MESSAGES[status] || 'An unexpected error occurred'
      toast.error(msg)
    }

    return Promise.reject(error)
  }
)

export default api
