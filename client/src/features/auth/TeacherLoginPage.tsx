import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, GraduationCap, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoMark } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'

export function TeacherLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Login failed.')
      return
    }
    navigate('/teacher/dashboard')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} /> Back to home
      </Link>

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <LogoMark className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-bold">Questigo</span>
          </Link>
          <br></br>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs text-violet-400 font-medium mb-4">
            <GraduationCap size={12} />
            Teacher Portal
          </div>
          <h1 className="text-2xl font-bold">Welcome back, Educator</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your subjects, quests, and students.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-black/20">
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@questigo.dev"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-surface-raised border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Demo credentials</p>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground-subtle">Email:</span> teacher@questigo.dev
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground-subtle">Password:</span> demo1234
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Are you a student?{' '}
          <Link to="/login" className="text-brand hover:text-brand-light font-medium transition-colors">
            Student login
          </Link>
        </p>
      </div>
    </div>
  )
}
