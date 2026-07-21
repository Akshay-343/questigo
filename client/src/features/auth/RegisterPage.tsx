import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoMark } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required.'
    if (!email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email.'
    if (!password) e.password = 'Password is required.'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password.'
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return
    setLoading(true)
    const result = await register(name, email, password)
    setLoading(false)
    if (!result.success) {
      setFormError(result.error ?? 'Could not create your account.')
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} /> Back to home
      </Link>

      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-brand/8 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <LogoMark className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-bold">Questigo</span>
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start your learning adventure today. It's free.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-black/20">
          {formError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle size={15} className="shrink-0" />
              {formError}
            </div>
          )}

          <div className="mb-5 flex rounded-lg overflow-hidden border border-border">
            <button className="flex-1 py-2.5 text-sm font-medium bg-brand text-white">Student</button>
            <button
              className="flex-1 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60 relative group"
              disabled
            >
              Teacher
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs bg-surface-raised border border-border rounded px-2 py-1 whitespace-nowrap">
                Use teacher portal
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  id="name"
                  placeholder="Alice Chen"
                  className="pl-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
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
                  placeholder="Min. 8 characters"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                />
              </div>
            </div>

            <div className="pt-1">
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:text-brand-light font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
