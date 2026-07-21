import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { TeacherLoginPage } from '@/features/auth/TeacherLoginPage'
import { TeacherDashboard } from '@/features/dashboard/TeacherDashboard'
import { StudentDashboard } from '@/features/dashboard/StudentDashboard'
import { SubjectsPage } from '@/features/play/SubjectsPage'
import { SkillTreePage } from '@/features/play/SkillTreePage'
import { MissionPage } from '@/features/play/MissionPage'
import { LeaderboardPage } from '@/features/leaderboard/LeaderboardPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { TeacherLayout } from '@/components/layout/TeacherLayout'
import { UploadPage } from '@/features/teacher/UploadPage'
import { ApprovePage } from '@/features/teacher/ApprovePage'
import { CreateQuestPage } from '@/features/teacher/CreateQuestPage'
import { StudentsPage } from '@/features/teacher/StudentsPage'
import { RouteError } from '@/components/ErrorBoundary'
import { ProtectedRoute } from './ProtectedRoute'

const router = createBrowserRouter([
  {
    // Pathless layout route: a single errorElement covers every route below,
    // so a render error shows the friendly fallback instead of a blank screen.
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/teacher/login', element: <TeacherLoginPage /> },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute role="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/play',
        element: (
          <ProtectedRoute role="STUDENT">
            <SubjectsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/play/mission/:missionId',
        element: (
          <ProtectedRoute role="STUDENT">
            <MissionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/play/:subjectSlug',
        element: (
          <ProtectedRoute role="STUDENT">
            <SkillTreePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/leaderboard',
        element: (
          <ProtectedRoute role="STUDENT">
            <LeaderboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute role="STUDENT">
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/teacher',
        element: (
          <ProtectedRoute role="TEACHER">
            <TeacherLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/teacher/dashboard" replace /> },
          { path: 'dashboard', element: <TeacherDashboard /> },
          { path: 'quests/new', element: <CreateQuestPage /> },
          { path: 'upload', element: <UploadPage /> },
          { path: 'generate', element: <Navigate to="/teacher/upload" replace /> },
          { path: 'approve', element: <ApprovePage /> },
          { path: 'students', element: <StudentsPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
