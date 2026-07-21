import { useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ArrowRight, ArrowDown, Check, X, Lightbulb, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SequenceMission, SequenceTile } from '@/lib/sequenceData'
import { PipelineTile } from './PipelineTile'

interface SequenceBuilderProps {
  mission: SequenceMission
  onSolved: (clean: boolean) => void
}

type LinkState = 'pending' | 'ok' | 'bad'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function SequenceBuilder({ mission, onSolved }: SequenceBuilderProps) {
  const answer = useMemo(() => mission.tiles.map((t) => t.id), [mission])
  const slotCount = answer.length

  const allTiles = useMemo<SequenceTile[]>(
    () => shuffle([...mission.tiles, ...(mission.distractors ?? [])]),
    [mission]
  )
  const tileById = useMemo(() => {
    const m = new Map<string, SequenceTile>()
    allTiles.forEach((t) => m.set(t.id, t))
    return m
  }, [allTiles])

  // slots[i] holds a tile id or null
  const [slots, setSlots] = useState<(string | null)[]>(Array(slotCount).fill(null))
  const [links, setLinks] = useState<LinkState[]>(Array(Math.max(0, slotCount - 1)).fill('pending'))
  const [feedback, setFeedback] = useState<string[]>([])
  const [hasFailed, setHasFailed] = useState(false)
  const [solved, setSolved] = useState(false)

  const placedIds = slots.filter(Boolean) as string[]
  const stagingTiles = allTiles.filter((t) => !placedIds.includes(t.id))
  const allPlaced = slots.every(Boolean)

  function resetValidation() {
    setLinks(Array(Math.max(0, slotCount - 1)).fill('pending'))
    setFeedback([])
  }

  function placeTile(tileId: string) {
    if (solved) return
    const firstEmpty = slots.findIndex((s) => s === null)
    if (firstEmpty === -1) return
    const next = [...slots]
    next[firstEmpty] = tileId
    setSlots(next)
    resetValidation()
  }

  function removeTile(slotIndex: number) {
    if (solved) return
    const next = [...slots]
    next[slotIndex] = null
    setSlots(next)
    resetValidation()
  }

  function validate() {
    if (!allPlaced) return
    const newLinks: LinkState[] = []
    const messages: string[] = []
    for (let p = 0; p < slotCount - 1; p++) {
      const correct = slots[p] === answer[p] && slots[p + 1] === answer[p + 1]
      newLinks.push(correct ? 'ok' : 'bad')
      if (!correct && messages.length < 2) {
        const key = `${answer[p]}->${answer[p + 1]}`
        if (mission.linkExplanations[key]) messages.push(mission.linkExplanations[key])
      }
    }
    setLinks(newLinks)

    const isSolved = newLinks.every((l) => l === 'ok')
    if (isSolved) {
      setSolved(true)
      setFeedback([])
      // brief beat so the green lock animation reads before transitioning
      setTimeout(() => onSolved(!hasFailed), 900)
    } else {
      setHasFailed(true)
      setFeedback(messages)
    }
  }

  function tileStateFor(slotIndex: number): 'placed' | 'ok' | 'bad' {
    const link = links
    const leftOk = slotIndex === 0 ? link[0] === 'ok' : link[slotIndex - 1] === 'ok'
    const rightOk = slotIndex === slotCount - 1 ? link[slotIndex - 1] === 'ok' : link[slotIndex] === 'ok'
    const anyValidated = link.some((l) => l !== 'pending')
    if (!anyValidated) return 'placed'
    return leftOk && rightOk ? 'ok' : 'bad'
  }

  return (
    <LayoutGroup>
      <div className="space-y-10">
        {/* Prompt */}
        <div className="flex items-start gap-3 rounded-xl border border-brand/30 bg-brand/5 p-5">
          <Cpu size={20} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-base text-foreground-subtle">{mission.prompt}</p>
        </div>

        {/* Staging area */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recovered Components
            </h3>
            <span className="text-xs text-muted">{stagingTiles.length} remaining</span>
          </div>
          <div
            className={cn(
              'flex min-h-[84px] flex-wrap gap-4 rounded-xl border border-dashed border-border bg-background/40 p-4',
              stagingTiles.length === 0 && 'items-center justify-center'
            )}
          >
            <AnimatePresence mode="popLayout">
              {stagingTiles.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted"
                >
                  All components placed — validate the pipeline below.
                </motion.p>
              ) : (
                stagingTiles.map((tile) => (
                  <div key={tile.id} className="w-full sm:w-auto md:w-56">
                    <PipelineTile tile={tile} state="staging" onClick={() => placeTile(tile.id)} disabled={solved} />
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
          <p className="mt-2 text-xs text-muted">
            Tap a component to drop it into the next pipeline slot. Tap a placed component to pull it back.
          </p>
        </div>

        {/* Pipeline track */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {mission.brief.systemName}
          </h3>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center md:gap-3">
            {slots.map((tileId, i) => (
              <div key={i} className="contents">
                <div className="flex-1 md:flex-none">
                  {tileId ? (
                    <PipelineTile
                      tile={tileById.get(tileId)!}
                      state={tileStateFor(i)}
                      index={i}
                      onClick={() => removeTile(i)}
                      disabled={solved}
                    />
                  ) : (
                    <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/30 px-4 py-4 text-xs text-muted md:h-[76px] md:w-56">
                      Slot {i + 1}
                    </div>
                  )}
                </div>

                {/* connector */}
                {i < slotCount - 1 && (
                  <div className="flex items-center justify-center py-1 md:py-0">
                    <Connector state={links[i]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2 rounded-xl border border-danger/40 bg-danger/5 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-danger">
                <X size={16} /> Pipeline unstable — broken connections detected
              </div>
              {feedback.map((msg, i) => (
                <div key={i} className="flex items-start gap-2 pl-1 text-xs text-foreground-subtle">
                  <Lightbulb size={13} className="mt-0.5 shrink-0 text-warning" />
                  <span>{msg}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action bar */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {hasFailed ? 'Adjust the broken links and validate again — no penalty for retries.' : 'Build the full pipeline, then validate.'}
          </p>
          <Button
            size="lg"
            onClick={validate}
            disabled={!allPlaced || solved}
            className="w-full sm:w-auto"
          >
            {solved ? (
              <>
                <Check size={16} /> Pipeline Restored
              </>
            ) : (
              'Validate Pipeline'
            )}
          </Button>
        </div>
      </div>
    </LayoutGroup>
  )
}

function Connector({ state }: { state: LinkState }) {
  const color =
    state === 'ok' ? 'text-success' : state === 'bad' ? 'text-danger' : 'text-border'
  return (
    <div className={cn('flex items-center justify-center transition-colors', color)}>
      {state === 'ok' ? (
        <Check size={16} className="md:hidden" />
      ) : state === 'bad' ? (
        <X size={16} className="md:hidden" />
      ) : (
        <ArrowDown size={16} className="md:hidden" />
      )}
      {state === 'ok' ? (
        <Check size={18} className="hidden md:block" />
      ) : state === 'bad' ? (
        <X size={18} className="hidden md:block" />
      ) : (
        <ArrowRight size={18} className="hidden md:block" />
      )}
    </div>
  )
}
