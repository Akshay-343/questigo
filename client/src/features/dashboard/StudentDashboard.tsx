import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Zap, Trophy, Database, ArrowRight, CheckCircle2, LogOut, User, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LogoMark } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { getLevelInfo } from '@/lib/levels'
import { fetchSubjects } from '@/features/play/playApi'
import { fetchProfile } from '@/features/profile/profileApi'

export function StudentDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { data: subjects, isLoading, isError } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const lvl = getLevelInfo(user?.xp ?? 0)
  const tracks = subjects ?? []
  const doneCount = tracks.reduce((sum, s) => sum + s.completedCount, 0)
  const totalQuests = tracks.reduce((sum, s) => sum + s.questCount, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7 rounded-lg" />
            <span className="font-bold">Questigo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/leaderboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trophy size={15} />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <User size={15} />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <Badge variant="level" className="gap-1 px-2.5 py-1">
              <Zap size={11} />
              Level {lvl.level}
            </Badge>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground">{user?.xp ?? 0} XP</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-danger/40 hover:text-danger"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ready to restore some systems?</p>
        </div>

        {/* XP card */}
        <Card className="mb-8 border-brand/30 bg-gradient-to-r from-brand/10 to-surface">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-brand">{user?.xp ?? 0}</span>
                  <span className="text-sm text-muted-foreground">
                    {lvl.isMax ? 'Max level reached' : `/ ${lvl.nextLevelFloor} XP to Level ${lvl.level + 1}`}
                  </span>
                </div>
              </div>
              <Badge variant="level" className="px-4 py-2 text-base">
                Lvl {lvl.level}
              </Badge>
            </div>
            <Progress value={lvl.progressPct} className="h-3" />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 size={20} className="text-success" />
              <div>
                <p className="text-lg font-bold">
                  {doneCount}
                  {totalQuests > 0 && <span className="text-sm text-muted-foreground"> / {totalQuests}</span>}
                </p>
                <p className="text-xs text-muted-foreground">Systems restored</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Trophy size={20} className="text-warning" />
              <div>
                <p className="text-lg font-bold">{profile?.stats.achievementsUnlocked ?? 0}</p>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="flex items-center gap-3 p-4">
              <Zap size={20} className="text-brand" />
              <div>
                <p className="text-lg font-bold">Level {lvl.level}</p>
                <p className="text-xs text-muted-foreground">{Math.round(lvl.progressPct)}% to next</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill trees — primary call to action */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Continue Learning
          </h2>
          {tracks.length > 0 && (
            <Link to="/play" className="text-xs font-medium text-brand hover:underline">
              View all tracks
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
            <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
          </div>
        ) : isError ? (
          <Card className="border-danger/30 bg-danger/5">
            <CardContent className="flex items-center gap-2.5 px-6 py-8 text-sm text-danger">
              <AlertCircle size={16} className="shrink-0" />
              Couldn't load your tracks. Make sure the backend is running.
            </CardContent>
          </Card>
        ) : tracks.length === 0 ? (
          <Card className="border-border">
            <CardContent className="px-6 py-10 text-center">
              <Database size={26} className="mx-auto mb-3 text-muted" />
              <p className="text-sm font-medium">No tracks available yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                New skill trees appear here once a teacher publishes content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tracks.map((track) => {
              const pct = track.questCount
                ? Math.round((track.completedCount / track.questCount) * 100)
                : 0
              return (
                <Link key={track.id} to={`/play/${track.id}`} className="block">
                  <Card className="group h-full border-border transition-colors hover:border-brand/50">
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15">
                            <Database size={22} className="text-brand" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold">{track.title}</h3>
                              <Badge variant="default" className="px-2 py-0">
                                Sequence Builder
                              </Badge>
                            </div>
                            {track.subtitle && (
                              <p className="mt-0.5 text-sm text-muted-foreground">{track.subtitle}</p>
                            )}
                          </div>
                        </div>
                        <ArrowRight
                          size={18}
                          className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand"
                        />
                      </div>
                      <div className="mt-auto pt-5">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Track progress</span>
                          <span>
                            {track.completedCount} / {track.questCount}
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
