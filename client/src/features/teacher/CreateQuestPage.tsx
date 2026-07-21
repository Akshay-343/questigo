import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Code2, ListOrdered, PencilRuler } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuestBuilder } from './QuestBuilder'
import { CodingQuestBuilder } from './CodingQuestBuilder'

type Kind = 'SEQUENCE' | 'CODING'

const KINDS: { id: Kind; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    id: 'SEQUENCE',
    label: 'Sequence Builder',
    icon: <ListOrdered size={15} />,
    hint: 'Students arrange process steps into the correct order.',
  },
  {
    id: 'CODING',
    label: 'Coding Challenge',
    icon: <Code2 size={15} />,
    hint: 'Students implement a Python function, checked against test cases.',
  },
]

export function CreateQuestPage() {
  const navigate = useNavigate()
  const [kind, setKind] = useState<Kind>('SEQUENCE')
  const active = KINDS.find((k) => k.id === kind)!

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <Link
        to="/teacher/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} /> Dashboard
      </Link>

      <div className="mb-6 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
          <PencilRuler size={17} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create a Quest</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hand-author a quest. It lands as a draft for review — naming a new subject creates that
            track automatically.
          </p>
        </div>
      </div>

      {/* Quest-type picker */}
      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
              kind === k.id
                ? 'border-brand/50 bg-brand/10'
                : 'border-border bg-surface hover:border-brand/30'
            )}
          >
            <span className={cn('mt-0.5', kind === k.id ? 'text-brand' : 'text-muted')}>{k.icon}</span>
            <span>
              <span className="block text-sm font-semibold">{k.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{k.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        {active.id === 'SEQUENCE' ? (
          <QuestBuilder
            mode="create"
            onCancel={() => navigate('/teacher/dashboard')}
            onCreated={() => navigate('/teacher/approve')}
          />
        ) : (
          <CodingQuestBuilder
            mode="create"
            onCancel={() => navigate('/teacher/dashboard')}
            onCreated={() => navigate('/teacher/approve')}
          />
        )}
      </div>
    </div>
  )
}
