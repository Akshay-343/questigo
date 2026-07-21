import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  AlertCircle,
  Zap,
  CheckCircle2,
  Sparkles,
  Trophy,
  Lock,
  Crown,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LogoMark } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { getLevelInfo } from '@/lib/levels'
import { achievementIcon } from '@/lib/achievementIcons'
import { fetchProfile, type Achievement, type CompletedQuest } from './profileApi'

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

const DIFFICULTY_VARIANT = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' } as const

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ProfilePage() {
  const { user } = useAuthStore()
  const { data, isLoading, isError } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile })

  const lvl = getLevelInfo(data?.user.xp ?? user?.xp ?? 0)
  const displayUser = data?.user ?? user

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7 rounded-lg" />
            <span className="font-bold">Questigo</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {isError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle size={15} className="shrink-0" />
            Couldn't load your profile. Make sure the backend is running.
          </div>
        )}

        {isLoading && (
          <div className="space-y-6">
            <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
            <div className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
            <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
          </div>
        )}

        {data && displayUser && (
          <>
            {/* Hero */}
            <Card className="mb-8 border-brand/30 bg-gradient-to-br from-brand/10 to-surface">
              <CardContent className="p-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-2xl font-extrabold text-brand">
                    {initials(displayUser.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-bold">{displayUser.name}</h1>
                    <p className="truncate text-sm text-muted-foreground">{displayUser.email}</p>
                    <Badge variant="level" className="mt-2 gap-1 px-2.5 py-1">
                      <Zap size={11} />
                      Level {lvl.level}
                    </Badge>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{displayUser.xp.toLocaleString()} XP</span>
                    <span>
                      {lvl.isMax
                        ? 'Max level reached'
                        : `${lvl.nextLevelFloor?.toLocaleString()} XP to Level ${lvl.level + 1}`}
                    </span>
                  </div>
                  <Progress value={lvl.progressPct} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={CheckCircle2} accent="text-success" value={data.stats.completedCount} label="Completed" />
              <StatCard icon={Sparkles} accent="text-brand" value={data.stats.cleanBuilds} label="Clean builds" />
              <StatCard icon={Crown} accent="text-warning" value={data.stats.bossesDefeated} label="Bosses" />
              <StatCard icon={Trophy} accent="text-warning" value={data.stats.achievementsUnlocked} label="Achievements" />
            </div>

            {/* Achievements */}
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Achievements
            </h2>
            <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.achievements.map((a) => (
                <AchievementCard key={a.key} achievement={a} />
              ))}
            </div>

            {/* Completed quests */}
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Completed Quests
            </h2>
            {data.completedQuests.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center text-sm text-muted-foreground">
                No quests completed yet.{' '}
                <Link to="/play" className="font-medium text-brand hover:underline">
                  Browse the skill trees
                </Link>{' '}
                to restore your first system.
              </div>
            ) : (
              <div className="space-y-2">
                {data.completedQuests.map((q) => (
                  <CompletedQuestRow key={q.id} quest={q} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({
  icon: Icon,
  accent,
  value,
  label,
}: {
  icon: LucideIcon
  accent: string
  value: number
  label: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon size={20} className={accent} />
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = achievementIcon(achievement.icon)
  const { unlocked } = achievement
  return (
    <Card className={unlocked ? 'border-brand/40 bg-brand/5' : 'border-border opacity-60'}>
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            unlocked ? 'bg-brand/15 text-brand' : 'bg-surface-raised text-muted-foreground'
          }`}
        >
          {unlocked ? <Icon size={18} /> : <Lock size={16} />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{achievement.title}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CompletedQuestRow({ quest }: { quest: CompletedQuest }) {
  return (
    <Card className="border-border">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
          {quest.isBoss ? <Crown size={18} /> : <CheckCircle2 size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{quest.title}</p>
            {quest.cleanBuild && <Sparkles size={13} className="shrink-0 text-brand" />}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {quest.subject} · {quest.node}
            {quest.completedAt && ` · ${formatDate(quest.completedAt)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={DIFFICULTY_VARIANT[quest.difficulty]} className="px-2 py-0">
            {quest.difficulty}
          </Badge>
          <span className="text-xs font-medium text-brand">+{quest.xpReward} XP</span>
        </div>
      </CardContent>
    </Card>
  )
}
