import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Zap, Sparkles, ArrowUpCircle, ArrowRight, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLevelInfo } from '@/lib/levels'
import type { SequenceMission } from '@/lib/sequenceData'

interface SuccessScreenProps {
  mission: SequenceMission & { kind?: string }
  clean: boolean
  xpBefore: number
  xpAfter: number
  leveledUp: boolean
  hasNext: boolean
  onBackToTree: () => void
  onNext: () => void
}

export function SuccessScreen({
  mission,
  clean,
  xpBefore,
  xpAfter,
  leveledUp,
  hasNext,
  onBackToTree,
  onNext,
}: SuccessScreenProps) {
  const before = getLevelInfo(xpBefore)
  const after = getLevelInfo(xpAfter)
  const cleanBonus = clean ? 30 : 0
  const isArena = mission.kind === 'ARENA'
  // Sequence quests are the only kind with tiles to replay on this screen.
  const isCoding = !isArena && mission.tiles.length === 0

  const successTitle = isArena
    ? 'Round Won'
    : isCoding
      ? 'Challenge Solved'
      : 'Pipeline Restored'
  const successSubtitle = isArena
    ? `${mission.brief.systemName} — you held the streak and kept a heart.`
    : `${mission.brief.systemName} is back online.`
  const cleanLabel = isArena ? 'Flawless Round bonus' : 'Clean Build bonus'

  // animate the XP bar from old fill to new fill
  const startPct = leveledUp ? 0 : before.progressPct
  const [barPct, setBarPct] = useState(startPct)
  const [shownXp, setShownXp] = useState(xpBefore)

  useEffect(() => {
    const t = setTimeout(() => setBarPct(after.progressPct), 500)
    return () => clearTimeout(t)
  }, [after.progressPct])

  useEffect(() => {
    const duration = 900
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setShownXp(Math.round(xpBefore + (xpAfter - xpBefore) * p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    const delay = setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, 500)
    return () => {
      clearTimeout(delay)
      cancelAnimationFrame(raf)
    }
  }, [xpBefore, xpAfter])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-2xl"
    >
      <div className="overflow-hidden rounded-2xl border border-success/40 bg-surface">
        <div className="relative border-b border-success/30 bg-gradient-to-b from-success/15 to-transparent px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success/15"
          >
            <CheckCircle2 size={36} className="text-success" />
          </motion.div>
          <h1 className="text-2xl font-bold text-success">{successTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{successSubtitle}</p>
        </div>

        <div className="p-6 sm:p-8">
          {/* restored pipeline (sequence quests only) */}
          {!isCoding && !isArena && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5">
              {mission.tiles.map((tile, i) => (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="rounded-lg border border-success/40 bg-success/10 px-2.5 py-1.5 font-mono text-xs font-bold text-foreground">
                    {tile.label}
                  </span>
                  {i < mission.tiles.length - 1 && (
                    <ArrowRight size={12} className="text-success" />
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* rewards */}
          <div className="space-y-2">
            <RewardRow icon={<Zap size={15} className="text-brand" />} label="Mission reward" value={`+${mission.xpReward} XP`} delay={0.3} />
            {clean && (
              <RewardRow
                icon={<Sparkles size={15} className="text-warning" />}
                label={cleanLabel}
                value={`+${cleanBonus} XP`}
                delay={0.4}
                highlight
              />
            )}
          </div>

          {/* XP bar */}
          <div className="mt-6 rounded-xl border border-border bg-background/50 p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Level {after.level}</span>
              <span className="text-muted-foreground">
                {after.isMax ? `${shownXp} XP` : `${shownXp} / ${after.nextLevelFloor} XP`}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-raised">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: `${startPct}%` }}
                animate={{ width: `${barPct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </div>

            {leveledUp && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-brand/10 py-2 text-sm font-semibold text-brand"
              >
                <ArrowUpCircle size={16} /> Level Up! You reached Level {after.level}
              </motion.div>
            )}
          </div>

          {/* next node unlocked */}
          {hasNext && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 flex items-center justify-center gap-2 text-xs text-success"
            >
              <Sparkles size={13} /> Next node unlocked on the skill tree
            </motion.div>
          )}

          {/* actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="flex-1 gap-2" onClick={onBackToTree}>
              <LayoutGrid size={15} /> Back to Skill Tree
            </Button>
            {hasNext && (
              <Button className="flex-1 gap-2" onClick={onNext}>
                Next Mission <ArrowRight size={15} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function RewardRow({
  icon,
  label,
  value,
  delay,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delay: number
  highlight?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        highlight ? 'border-warning/30 bg-warning/5' : 'border-border bg-background/50'
      }`}
    >
      <span className="flex items-center gap-2 text-sm text-foreground-subtle">
        {icon} {label}
      </span>
      <span className="font-bold text-foreground">{value}</span>
    </motion.div>
  )
}
