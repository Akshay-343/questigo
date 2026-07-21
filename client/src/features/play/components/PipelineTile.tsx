import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { SequenceTile } from '@/lib/sequenceData'

type TileState = 'staging' | 'placed' | 'ok' | 'bad' | 'locked'

interface PipelineTileProps {
  tile: SequenceTile
  state: TileState
  index?: number
  onClick?: () => void
  disabled?: boolean
}

const stateStyles: Record<TileState, string> = {
  staging: 'border-border bg-surface-raised hover:border-brand/60 hover:bg-surface-raised/80',
  placed: 'border-brand/50 bg-brand/10',
  ok: 'border-success/60 bg-success/10',
  bad: 'border-danger/60 bg-danger/10',
  locked: 'border-success/60 bg-success/10',
}

export function PipelineTile({ tile, state, index, onClick, disabled }: PipelineTileProps) {
  return (
    <motion.button
      layout
      layoutId={`tile-${tile.id}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.03 } : undefined}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl border px-5 py-4 text-left transition-colors',
        'md:w-56 md:flex-col md:items-start md:gap-1.5 md:px-5 md:py-4',
        stateStyles[state],
        disabled ? 'cursor-default' : 'cursor-pointer'
      )}
    >
      {index !== undefined && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/60 text-sm font-bold text-muted-foreground md:absolute md:right-2.5 md:top-2.5">
          {index + 1}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-mono text-base font-bold text-foreground">{tile.label}</p>
        {tile.sub && <p className="truncate text-xs text-muted-foreground">{tile.sub}</p>}
      </div>
    </motion.button>
  )
}
