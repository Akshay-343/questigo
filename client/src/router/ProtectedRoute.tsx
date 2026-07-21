import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: Role
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    const redirect = role === 'TEACHER' ? '/teacher/login' : '/login'
    return <Navigate to={redirect} replace />
  }

  if (role && user.role !== role) {
    const redirect = user.role === 'TEACHER' ? '/teacher/dashboard' : '/dashboard'
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}
