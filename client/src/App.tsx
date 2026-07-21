import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AppRouter } from '@/router'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    // Demo-friendly defaults: cache list results for 30s and don't refetch on
    // window focus (avoids surprise flicker when alt-tabbing during a demo).
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            color: '#f1f5f9',
          },
        }}
      />
    </QueryClientProvider>
  )
}
