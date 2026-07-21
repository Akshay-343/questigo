import { Component, type ReactNode } from 'react'
import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { LogoMark } from '@/components/ui/Logo'

/** Shared dark-themed full-screen fallback. Uses plain anchors so it works both
 *  inside the router (route errors) and outside it (top-level render crashes). */
function ErrorScreen({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <LogoMark className="h-7 w-7 rounded-lg" />
        <span className="font-bold text-foreground">Questigo</span>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
        <AlertTriangle size={24} />
      </div>

      <div className="max-w-md space-y-1.5">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
        >
          <RotateCcw size={15} /> Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised"
        >
          <Home size={15} /> Go home
        </a>
      </div>
    </div>
  )
}

/** `errorElement` for the router — catches render errors thrown by route elements. */
export function RouteError() {
  const error = useRouteError()
  let message = 'Something went wrong while loading this page.'
  if (isRouteErrorResponse(error)) message = `${error.status} — ${error.statusText}`
  else if (error instanceof Error && error.message) message = error.message
  return <ErrorScreen title="This page failed to load" message={message} />
}

/** Final safety net for render errors anywhere outside the router's reach. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Uncaught render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          title="Something went wrong"
          message="An unexpected error occurred. Reload the page to continue."
        />
      )
    }
    return this.props.children
  }
}
