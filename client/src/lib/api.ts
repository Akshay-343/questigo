import axios, { AxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

/** Zustand persists the auth store under this localStorage key. */
const AUTH_STORAGE_KEY = 'questigo-auth'

/** Read the JWT straight from the persisted auth store (decoupled — avoids a circular import with authStore). */
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.state?.token ?? null
  } catch {
    return null
  }
}

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')

    // Session expired / invalid token on a protected call — clear auth and bounce to login.
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

/** Pull the human-readable message out of our standard { data, error } envelope. */
export function extractApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof AxiosError) {
    const msg = (error.response?.data as { error?: string } | undefined)?.error
    if (msg) return msg
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?'
  }
  return fallback
}
