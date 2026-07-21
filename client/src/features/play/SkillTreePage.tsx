import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Lock, Play, Zap, Database, Star, AlertCircle, Code2, Swords } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { getLevelInfo } from '@/lib/levels'
import { fetchSubject, type QuestSummary } from './playApi'

type NodeStatus = 'completed' | 'available' | 'locked'

const difficultyVariant = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' } as const

export function SkillTreePage() {
  const navigate = useNavigate()
  const { subjectSlug = 'dbms' } = useParams<{ subjectSlug: string }>()
  const { user } = useAuthStore()
  const { data: subject, isLoading, isError } = useQuery({
    queryKey: ['subject', subjectSlug],
    queryFn: () => fetchSubject(subjectSlug),
  })

  const lvl = getLevelInfo(user?.xp ?? 0)
  const quests = subject?.quests ?? []
  const doneCount = quests.filter((q) => q.completed).length
  const trackPct = quests.length ? Math.round((doneCount / quests.length) * 100) : 0

  function statusFor(quest: QuestSummary, index: number): NodeStatus {
    if (quest.completed) return 'completed'
    if (index === 0) return 'available'
    return quests[index - 1].completed ? 'available' : 'locked'
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <Badge variant="level" className="gap-1 px-2.5 py-1">
            <Zap size={11} /> Level {lvl.level}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {isError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle size={15} className="shrink-0" />
            Couldn't load the skill tree. Make sure the backend is running.
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        )}

        {subject && (
          <>
            {/* track header */}
            <div className="mb-8 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 to-surface p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/20">
                  <Database size={20} className="text-brand" />
                </div>
                <div>
                  <h1 className="text-xl font-bold sm:text-2xl">{subject.title} Skill Tree</h1>
                  <p className="text-xs text-muted-foreground">{subject.subtitle}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-foreground-subtle">{subject.description}</p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Track progress</span>
                  <span>
                    {doneCount} / {quests.length} systems restored
                  </span>
                </div>
                <Progress value={trackPct} className="h-2" />
              </div>
            </div>

            {/* node tree */}
            <div className="relative mx-auto max-w-md">
              {quests.map((quest, i) => {
                const status = statusFor(quest, i)
                return (
                  <div key={quest.id} className="relative">
                    {i > 0 && (
                      <div className="flex justify-center">
                        <div className={cn('h-8 w-0.5', status === 'locked' ? 'bg-border' : 'bg-brand/50')} />
                      </div>
                    )}
                    <SkillNode
                      quest={quest}
                      status={status}
                      onClick={() => status !== 'locked' && navigate(`/play/mission/${quest.id}`)}
                    />
                  </div>
                )
              })}
            </div>

            <p className="mx-auto mt-8 max-w-md text-center text-xs text-muted">
              Restore each system to unlock the next node in the tree.
            </p>
          </>
        )}
      </main>
    </div>
  )
}

function SkillNode({
  quest,
  status,
  onClick,
}: {
  quest: QuestSummary
  status: NodeStatus
  onClick: () => void
}) {
  const locked = status === 'locked'
  const completed = status === 'completed'

  return (
    <motion.button
      onClick={onClick}
      disabled={locked}
      whileHover={!locked ? { scale: 1.02 } : undefined}
      whileTap={!locked ? { scale: 0.98 } : undefined}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors',
        completed && 'border-success/50 bg-success/5',
        status === 'available' && 'border-brand/60 bg-brand/10 shadow-lg shadow-brand/10',
        locked && 'cursor-not-allowed border-border bg-surface/50 opacity-60'
      )}
    >
      {/* status orb */}
      <div
        className={cn(
          'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          completed && 'bg-success/15 text-success',
          status === 'available' && 'bg-brand/20 text-brand',
          locked && 'bg-surface-raised text-muted'
        )}
      >
        {status === 'available' && (
          <span className="absolute inset-0 animate-ping rounded-xl bg-brand/20" />
        )}
        {completed ? (
          <Check size={20} />
        ) : locked ? (
          <Lock size={18} />
        ) : quest.kind === 'CODING' ? (
          <Code2 size={18} />
        ) : quest.kind === 'ARENA' ? (
          <Swords size={18} />
        ) : (
          <Play size={18} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-foreground">{quest.node}</p>
          {quest.isBoss && <Star size={13} className="shrink-0 text-warning" fill="currentColor" />}
          {quest.kind === 'CODING' && (
            <Badge variant="muted" className="gap-1 px-1.5 py-0 text-[10px]">
              <Code2 size={9} /> Code
            </Badge>
          )}
          {quest.kind === 'ARENA' && (
            <Badge variant="muted" className="gap-1 px-1.5 py-0 text-[10px]">
              <Swords size={9} /> Arena
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{quest.title}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <Badge variant={difficultyVariant[quest.difficulty]} className="px-2 py-0">
            {quest.difficulty}
          </Badge>
          <span className="flex items-center gap-0.5 text-xs text-brand">
            <Zap size={11} /> {quest.xpReward}
          </span>
        </div>
      </div>

      {/* right state label */}
      <div className="shrink-0 text-right">
        {completed && <span className="text-xs font-semibold text-success">Restored</span>}
        {status === 'available' && <span className="text-xs font-semibold text-brand">Play →</span>}
        {locked && <span className="text-xs text-muted">Locked</span>}
      </div>
    </motion.button>
  )
}
