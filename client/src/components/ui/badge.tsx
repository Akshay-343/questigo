import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand/15 text-brand border border-brand/30',
        success: 'bg-success/15 text-success border border-success/30',
        warning: 'bg-warning/15 text-warning border border-warning/30',
        danger: 'bg-danger/15 text-danger border border-danger/30',
        muted: 'bg-surface-raised text-muted-foreground border border-border',
        level: 'bg-brand text-white font-bold',
        easy: 'bg-success/15 text-success border border-success/30',
        medium: 'bg-warning/15 text-warning border border-warning/30',
        hard: 'bg-danger/15 text-danger border border-danger/30',
        teacher: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
