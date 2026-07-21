import { motion } from 'framer-motion'
import { AlertTriangle, Zap, Wrench, ArrowRight, Swords, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SequenceMission } from '@/lib/sequenceData'

interface MissionBriefProps {
  mission: SequenceMission & { kind?: string }
  onStart: () => void
}

const difficultyVariant = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' } as const

export function MissionBrief({ mission, onStart }: MissionBriefProps) {
  const isArena = mission.kind === 'ARENA'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* alert banner */}
        <div className="flex items-center gap-3 border-b border-danger/30 bg-danger/10 px-6 py-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-danger">
            {isArena ? 'Arena Challenge Incoming' : 'System Failure Detected'}
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="muted">{mission.topic}</Badge>
            <Badge variant={difficultyVariant[mission.difficulty]}>{mission.difficulty}</Badge>
            {mission.isBoss && <Badge variant="default">★ Boss System</Badge>}
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">{mission.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Target system: <span className="text-foreground-subtle">{mission.brief.systemName}</span>
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-background/50 p-4">
            {isArena ? (
              <Flame size={18} className="mt-0.5 shrink-0 text-warning" />
            ) : (
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
            )}
            <p className="text-sm leading-relaxed text-foreground-subtle">{mission.brief.story}</p>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
            <span className="text-sm text-muted-foreground">Mission reward</span>
            <span className="flex items-center gap-1.5 font-bold text-brand">
              <Zap size={16} /> +{mission.xpReward} XP
            </span>
          </div>

          <Button size="lg" className="mt-6 w-full gap-2" onClick={onStart}>
            {isArena ? <Swords size={16} /> : <Wrench size={16} />}
            {isArena ? 'Enter the Arena' : 'Begin Reconstruction'}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
