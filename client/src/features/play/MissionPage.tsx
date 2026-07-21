import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { createElement } from 'react'
import { ArrowLeft, Trophy, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { achievementIcon } from '@/lib/achievementIcons'
import { fetchQuest, completeQuest, type UnlockedAchievement } from './playApi'
import { MissionBrief } from './components/MissionBrief'
import { SequenceBuilder } from './components/SequenceBuilder'
import { SuccessScreen } from './components/SuccessScreen'

// Monaco is heavy (~2MB) — only load it when a coding challenge or case is opened.
const CodingChallenge = lazy(() =>
  import('./components/CodingChallenge').then((m) => ({ default: m.CodingChallenge }))
)
const ArenaGame = lazy(() =>
  import('./components/ArenaGame').then((m) => ({ default: m.ArenaGame }))
)

type Phase = 'brief' | 'build' | 'success'

const difficultyVariant = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' } as const

export function MissionPage() {
  const { missionId } = useParams<{ missionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setUser } = useAuthStore()

  const { data: mission, isLoading, isError } = useQuery({
    queryKey: ['quest', missionId],
    queryFn: () => fetchQuest(missionId!),
    enabled: !!missionId,
  })

  const [phase, setPhase] = useState<Phase>('brief')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState({ clean: false, xpBefore: 0, xpAfter: 0, leveledUp: false })

  // Reset the flow when switching missions (the component is reused across mission routes).
  useEffect(() => {
    setPhase('brief')
  }, [missionId])

  if (isError) {
    return (
      <CenteredNotice>
        <AlertCircle size={20} className="text-danger" />
        <p className="text-sm text-muted-foreground">This mission couldn't be loaded.</p>
        <Link to="/play" className="text-sm font-medium text-brand">Back to Tracks</Link>
      </CenteredNotice>
    )
  }

  if (isLoading || !mission) {
    return (
      <CenteredNotice>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading mission...</p>
      </CenteredNotice>
    )
  }

  async function handleSolved(clean: boolean, code?: string) {
    if (!mission) return
    const levelBefore = useAuthStore.getState().user?.level ?? 1
    setSubmitting(true)
    try {
      const res = await completeQuest(mission.id, clean, code)
      setUser(res.user)

      if (!res.alreadyCompleted) {
        if (clean) {
          toast.success(mission.kind === 'ARENA' ? 'Flawless Round' : 'Achievement: Clean Build', {
            description:
              mission.kind === 'ARENA'
                ? 'Cleared every question without dropping a heart.'
                : 'Restored a pipeline with zero broken validations.',
            icon: <Trophy size={16} />,
          })
        }
        if (res.leveledUp) {
          toast.success(`Level Up — Level ${res.newLevel}!`)
        }
      }

      // Stack newly-unlocked achievement toasts, spaced out so they don't overlap.
      res.unlockedAchievements.forEach((a, i) => {
        setTimeout(() => showAchievementToast(a), 500 * (i + 1))
      })

      // refresh tree progress + leaderboard standings
      queryClient.invalidateQueries({ queryKey: ['subject', mission.subjectSlug] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })

      setResult({
        clean,
        xpBefore: res.user.xp - res.xpAwarded,
        xpAfter: res.user.xp,
        leveledUp: res.newLevel > levelBefore,
      })
      setPhase('success')
    } catch {
      toast.error('Could not save your progress. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const hasNext = !!mission.nextQuestSlug
  // The brief/success screens set their own narrow max-w internally, so widening
  // the shared container here only affects the build phase (pipeline/editor).
  // Coding gets extra width so the editor pane can fill a real half of the screen;
  // the arena sets its own narrower max-w internally.
  const containerWidth =
    phase !== 'build'
      ? 'max-w-3xl'
      : mission.kind === 'CODING'
        ? 'max-w-[1680px]'
        : 'max-w-6xl'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className={cn('mx-auto flex items-center justify-between px-4 py-3 transition-[max-width] duration-300 sm:px-6', containerWidth)}>
          <Link
            to={`/play/${mission.subjectSlug}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} /> Skill Tree
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={difficultyVariant[mission.difficulty]}>{mission.difficulty}</Badge>
            <span className="hidden text-xs text-muted-foreground sm:inline">{mission.node}</span>
          </div>
        </div>
      </header>

      <main className={cn('mx-auto px-4 py-8 transition-[max-width] duration-300 sm:px-6 sm:py-12', containerWidth)}>
        <AnimatePresence mode="wait">
          {phase === 'brief' && (
            <MissionBrief key="brief" mission={mission} onStart={() => setPhase('build')} />
          )}

          {phase === 'build' && (
            <motion.div
              key="build"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h1 className="text-xl font-bold sm:text-2xl">{mission.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{mission.brief.systemName}</p>
              </div>
              {mission.kind === 'CODING' || mission.kind === 'ARENA' ? (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      Loading {mission.kind === 'ARENA' ? 'arena' : 'editor'}…
                    </div>
                  }
                >
                  {mission.kind === 'ARENA' ? (
                    <ArenaGame mission={mission} submitting={submitting} onSolved={handleSolved} />
                  ) : (
                    <CodingChallenge
                      mission={mission}
                      submitting={submitting}
                      onSolved={(code) => handleSolved(false, code)}
                    />
                  )}
                </Suspense>
              ) : (
                <SequenceBuilder mission={mission} onSolved={handleSolved} />
              )}
            </motion.div>
          )}

          {phase === 'success' && (
            <SuccessScreen
              key="success"
              mission={mission}
              clean={result.clean}
              xpBefore={result.xpBefore}
              xpAfter={result.xpAfter}
              leveledUp={result.leveledUp}
              hasNext={hasNext}
              onBackToTree={() => navigate(`/play/${mission.subjectSlug}`)}
              onNext={() => mission.nextQuestSlug && navigate(`/play/mission/${mission.nextQuestSlug}`)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function showAchievementToast(a: UnlockedAchievement) {
  toast.success('Achievement Unlocked!', {
    description: `${a.title} — ${a.description}`,
    icon: createElement(achievementIcon(a.icon), { size: 16 }),
  })
}

function CenteredNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      {children}
    </div>
  )
}
