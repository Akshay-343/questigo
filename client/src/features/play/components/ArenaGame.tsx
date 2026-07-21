import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Zap, Flame, Timer, Trophy, RotateCcw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { answerArena, type ArenaAnswerResult, type QuestDetail } from '../playApi'

interface Props {
  mission: QuestDetail
  onSolved: (clean: boolean, code: string) => void
  submitting: boolean
}

/** Wrong answers allowed before the run ends. Mirrors HEARTS in arena_service.py. */
const HEARTS = 3
const BASE_POINTS = 100
const MAX_SPEED_BONUS = 100
/** Streak multiplier climbs 0.25 per consecutive hit and tops out here. */
const MAX_MULTIPLIER = 3
const FEEDBACK_MS = 1600
const TICK_MS = 50

type Phase = 'ready' | 'question' | 'feedback' | 'over' | 'done'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function ArenaGame({ mission, onSolved, submitting }: Props) {
  const round = mission.arena!
  const questions = round.questions
  const totalMs = round.secondsPerQuestion * 1000

  const [phase, setPhase] = useState<Phase>('ready')
  const [index, setIndex] = useState(0)
  const [msLeft, setMsLeft] = useState(totalMs)
  const [hearts, setHearts] = useState(HEARTS)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [gained, setGained] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [result, setResult] = useState<ArenaAnswerResult | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [countdown, setCountdown] = useState(3)

  const question = questions[index]
  // Guards the async grade call so a timeout and a click can't both resolve.
  const answeringRef = useRef(false)
  // Mirrors msLeft so scoring can read the remaining time without making
  // submitAnswer depend on it (which would rebuild the timer on every tick).
  const msLeftRef = useRef(totalMs)
  msLeftRef.current = msLeft

  /** Grade one pick (or -1 for a timeout), bank the points, and queue the next step. */
  const submitAnswer = useCallback(
    async (choice: number) => {
      if (answeringRef.current) return
      answeringRef.current = true

      const remaining = msLeftRef.current
      setPicked(choice)
      setPhase('feedback')
      setAnswers((prev) => ({ ...prev, [question.id]: choice }))

      let res: ArenaAnswerResult
      try {
        res = await answerArena(mission.id, question.id, choice)
      } catch {
        // Never strand the player on a network hiccup — treat it as a miss and move on.
        res = { correct: false, answer: -1, explain: 'Could not reach the server for this one.' }
      }
      setResult(res)

      if (res.correct) {
        const nextStreak = streak + 1
        const multiplier = Math.min(MAX_MULTIPLIER, 1 + nextStreak * 0.25)
        const speedBonus = Math.round(MAX_SPEED_BONUS * (remaining / totalMs))
        const points = Math.round((BASE_POINTS + speedBonus) * multiplier)
        setGained(points)
        setScore((s) => s + points)
        setStreak(nextStreak)
        setBestStreak((b) => Math.max(b, nextStreak))
      } else {
        setGained(0)
        setStreak(0)
        setHearts((h) => h - 1)
      }
    },
    [question, mission.id, streak, totalMs]
  )

  // "Get ready" countdown before the first question.
  useEffect(() => {
    if (phase !== 'ready') return
    if (countdown <= 0) {
      setPhase('question')
      setMsLeft(totalMs)
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 800)
    return () => clearTimeout(t)
  }, [phase, countdown, totalMs])

  // Question countdown — decrement only, so the updater stays pure.
  useEffect(() => {
    if (phase !== 'question') return
    const id = setInterval(() => setMsLeft((ms) => Math.max(0, ms - TICK_MS)), TICK_MS)
    return () => clearInterval(id)
  }, [phase, index])

  // Hitting zero counts as a miss (choice -1).
  useEffect(() => {
    if (phase === 'question' && msLeft <= 0) void submitAnswer(-1)
  }, [phase, msLeft, submitAnswer])

  // Hold the feedback, then advance: next question, out of hearts, or finished.
  useEffect(() => {
    if (phase !== 'feedback' || result === null) return
    const t = setTimeout(() => {
      answeringRef.current = false
      setPicked(null)
      setResult(null)
      if (hearts <= 0) {
        setPhase('over')
      } else if (index + 1 >= questions.length) {
        setPhase('done')
      } else {
        setIndex((i) => i + 1)
        setMsLeft(totalMs)
        setPhase('question')
      }
    }, FEEDBACK_MS)
    return () => clearTimeout(t)
  }, [phase, result, hearts, index, questions.length, totalMs])

  const restart = () => {
    answeringRef.current = false
    setPhase('ready')
    setCountdown(3)
    setIndex(0)
    setMsLeft(totalMs)
    setHearts(HEARTS)
    setStreak(0)
    setBestStreak(0)
    setScore(0)
    setGained(0)
    setPicked(null)
    setResult(null)
    setAnswers({})
  }

  const correctCount = Object.keys(answers).length - (HEARTS - hearts)
  const perfect = hearts === HEARTS

  if (phase === 'ready') {
    return (
      <ArenaShell>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-sm text-muted-foreground">{round.intro || 'Get ready.'}</p>
          <motion.div
            key={countdown}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="text-7xl font-black text-brand"
          >
            {countdown > 0 ? countdown : 'GO'}
          </motion.div>
          <p className="text-xs uppercase tracking-widest text-muted">
            {questions.length} questions · {HEARTS} hearts · {round.secondsPerQuestion}s each
          </p>
        </div>
      </ArenaShell>
    )
  }

  if (phase === 'over') {
    return (
      <ArenaShell>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/15">
            <X size={34} className="text-danger" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-danger">Out of Hearts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You made it to question {index + 1} of {questions.length} with {score.toLocaleString()} points.
            </p>
          </div>
          <p className="max-w-sm text-sm text-foreground-subtle">
            No XP this time — the round has to be finished with at least one heart left.
          </p>
          <Button className="mt-2 gap-2" onClick={restart}>
            <RotateCcw size={15} /> Run It Again
          </Button>
        </div>
      </ArenaShell>
    )
  }

  if (phase === 'done') {
    return (
      <ArenaShell>
        <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15"
          >
            <Trophy size={34} className="text-success" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-success">
              {perfect ? 'Flawless Round' : 'Round Complete'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {perfect
                ? 'Every question, first try. The clean bonus is yours.'
                : `${correctCount} of ${questions.length} correct.`}
            </p>
          </div>

          <div className="grid w-full max-w-md grid-cols-3 gap-3">
            <StatTile label="Score" value={score.toLocaleString()} accent="text-brand" />
            <StatTile label="Best streak" value={`${bestStreak}x`} accent="text-warning" />
            <StatTile label="Hearts left" value={`${hearts}`} accent="text-danger" />
          </div>

          <Button
            size="lg"
            className="mt-2 w-full max-w-md gap-2"
            loading={submitting}
            onClick={() => onSolved(perfect, JSON.stringify({ answers }))}
          >
            <Zap size={16} /> Claim {mission.xpReward} XP
          </Button>
        </div>
      </ArenaShell>
    )
  }

  // --- live question ---
  const pct = (msLeft / totalMs) * 100
  const urgent = msLeft <= 5000
  const showingFeedback = phase === 'feedback' && result !== null

  return (
    <ArenaShell>
      {/* HUD */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: HEARTS }).map((_, i) => (
            <Heart
              key={i}
              size={17}
              className={cn(
                'transition-all duration-300',
                i < hearts ? 'fill-danger text-danger' : 'text-border'
              )}
            />
          ))}
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          {index + 1} / {questions.length}
        </span>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {streak >= 2 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning"
              >
                <Flame size={12} /> {streak}x
              </motion.span>
            )}
          </AnimatePresence>
          <span className="font-mono text-sm font-bold tabular-nums text-brand">
            {score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* timer bar */}
      <div className="h-1.5 w-full bg-surface-raised">
        <div
          className={cn(
            'h-full transition-[width] ease-linear',
            urgent ? 'bg-danger' : 'bg-brand'
          )}
          style={{ width: `${pct}%`, transitionDuration: `${TICK_MS}ms` }}
        />
      </div>

      <div className="p-5 sm:p-8">
        <div className="mb-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Timer size={12} className={cn(urgent && 'text-danger')} />
          <span className={cn('tabular-nums', urgent && 'font-bold text-danger')}>
            {Math.ceil(msLeft / 1000)}s
          </span>
        </div>

        {/* Prompt and options animate as one block, so the question can never be
            left showing above the next question's answers mid-transition. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="mx-auto max-w-2xl text-balance text-center text-lg font-bold leading-snug sm:text-2xl">
              {question.prompt}
            </h2>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              {question.options.map((option, i) => (
                <OptionButton
                  key={`${question.id}-${i}`}
                  letter={OPTION_LETTERS[i]}
                  label={option}
                  disabled={phase !== 'question'}
                  state={
                    !showingFeedback
                      ? 'idle'
                      : i === result.answer
                        ? 'correct'
                        : i === picked
                          ? 'wrong'
                          : 'dim'
                  }
                  onClick={() => void submitAnswer(i)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* feedback */}
        <AnimatePresence>
          {showingFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto mt-6 max-w-3xl"
            >
              <div
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border px-4 py-3',
                  result.correct
                    ? 'border-success/40 bg-success/10'
                    : 'border-danger/40 bg-danger/10'
                )}
              >
                {result.correct ? (
                  <Check size={16} className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <X size={16} className="mt-0.5 shrink-0 text-danger" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      result.correct ? 'text-success' : 'text-danger'
                    )}
                  >
                    {result.correct
                      ? `Correct  +${gained}`
                      : picked === -1
                        ? 'Time up — heart lost'
                        : 'Wrong — heart lost'}
                  </p>
                  {result.explain && (
                    <p className="mt-0.5 text-sm text-foreground-subtle">{result.explain}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ArenaShell>
  )
}

function ArenaShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface">
      {children}
    </div>
  )
}

function OptionButton({
  letter,
  label,
  state,
  disabled,
  onClick,
}: {
  letter: string
  label: string
  state: 'idle' | 'correct' | 'wrong' | 'dim'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      animate={state === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors',
        state === 'idle' &&
          'border-border bg-background/50 hover:border-brand/60 hover:bg-brand/5 disabled:hover:border-border disabled:hover:bg-background/50',
        state === 'correct' && 'border-success/60 bg-success/15',
        state === 'wrong' && 'border-danger/60 bg-danger/15',
        state === 'dim' && 'border-border bg-background/50 opacity-40'
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
          state === 'correct'
            ? 'bg-success/25 text-success'
            : state === 'wrong'
              ? 'bg-danger/25 text-danger'
              : 'bg-surface-raised text-muted-foreground'
        )}
      >
        {letter}
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{label}</span>
      {state === 'correct' && <Check size={16} className="shrink-0 text-success" />}
      {state === 'wrong' && <X size={16} className="shrink-0 text-danger" />}
    </motion.button>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-3 py-3">
      <p className={cn('text-xl font-bold tabular-nums', accent)}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted">{label}</p>
    </div>
  )
}
