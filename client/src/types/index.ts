export type Role = 'STUDENT' | 'TEACHER'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  xp: number
  level: number
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  /** Replace the current user with an authoritative copy from the server (e.g. after quest completion). */
  setUser: (user: AuthUser) => void
}
