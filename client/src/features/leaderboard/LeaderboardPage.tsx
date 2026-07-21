import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Crown, Trophy, AlertCircle, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogoMark } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { fetchLeaderboard, type LeaderboardEntry } from './leaderboardApi'

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

const RANK_ACCENT: Record<number, string> = {
  1: 'text-warning',
  2: 'text-foreground-subtle',
  3: 'text-amber-600',
}

export function LeaderboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7 rounded-lg" />
            <span className="font-bold">Questigo</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/15">
            <Trophy size={22} className="text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Top learners ranked by XP.</p>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle size={15} className="shrink-0" />
            Couldn't load the leaderboard. Make sure the backend is running.
          </div>
        )}

        {data && data.length === 0 && (
          <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center text-sm text-muted-foreground">
            No students on the board yet. Be the first to restore a system!
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-2">
            {data.map((entry: LeaderboardEntry) => {
              const isYou = entry.id === user?.id
              return (
                <Card
                  key={entry.id}
                  className={isYou ? 'border-brand/50 bg-brand/5' : 'border-border'}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`flex w-7 shrink-0 items-center justify-center text-lg font-extrabold ${RANK_ACCENT[entry.rank] ?? 'text-muted-foreground'}`}>
                      {entry.rank === 1 ? <Crown size={20} /> : entry.rank}
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-bold text-brand">
                      {initials(entry.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {entry.name}
                        {isYou && <span className="ml-2 text-xs font-medium text-brand">You</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{entry.xp.toLocaleString()} XP</p>
                    </div>
                    <Badge variant="level" className="gap-1 px-2.5 py-1">
                      <Zap size={11} />
                      Lvl {entry.level}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
