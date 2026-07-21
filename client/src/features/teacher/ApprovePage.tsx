import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  X,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileText,
  Upload,
  Pencil,
  Code2,
  Swords,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { extractApiError } from '@/lib/api'
import {
  fetchTeacherQuests,
  fetchTeacherQuest,
  approveQuest,
  rejectQuest,
  type QuestStatus,
  type TeacherQuest,
  type TeacherQuestDetail,
} from './teacherApi'
import { QuestBuilder } from './QuestBuilder'
import { CodingQuestBuilder } from './CodingQuestBuilder'

const DIFFICULTY_VARIANT = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' } as const
const STATUS_FILTERS: { id: QuestStatus | 'ALL'; label: string }[] = [
  { id: 'PENDING_TEACHER_REVIEW', label: 'Pending' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'ALL', label: 'All' },
]

export function ApprovePage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<QuestStatus | 'ALL'>('PENDING_TEACHER_REVIEW')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-quests', filter],
    queryFn: () => fetchTeacherQuests(filter === 'ALL' ? undefined : filter),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['teacher-quests'] })

  const approveMut = useMutation({
    mutationFn: approveQuest,
    onSuccess: (q) => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['subject'] })
      toast.success('Published', { description: `"${q.title}" is now live for students.` })
    },
    onError: (e) => toast.error(extractApiError(e, 'Could not publish.')),
  })

  const rejectMut = useMutation({
    mutationFn: rejectQuest,
    onSuccess: (q) => {
      invalidate()
      toast.success('Rejected', { description: `"${q.title}" will not be shown to students.` })
    },
    onError: (e) => toast.error(extractApiError(e, 'Could not reject.')),
  })

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Teacher Portal</p>
          <h1 className="text-2xl font-bold">Review Generated Content</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Approve or reject AI-generated quests before they go live for students.
          </p>
        </div>
        <Link to="/teacher/upload">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload size={14} /> Generate more
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-raised p-1">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              filter === tab.id ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle size={15} className="shrink-0" />
          Couldn't load content. Make sure the backend is running.
        </div>
      )}

      {data && data.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Sparkles size={22} className="text-muted" />
          <p className="text-sm text-muted-foreground">
            {filter === 'PENDING_TEACHER_REVIEW' ? 'No drafts awaiting review.' : 'Nothing here yet.'}
          </p>
          <Link to="/teacher/upload" className="text-sm font-medium text-brand hover:underline">
            Generate quests from a document →
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((item) => (
            <QuestCard
              key={item.id}
              item={item}
              expanded={expanded === item.id}
              editing={editing === item.id}
              onToggle={() => {
                setExpanded(expanded === item.id ? null : item.id)
                if (editing === item.id) setEditing(null)
              }}
              onEdit={() => {
                setExpanded(item.id)
                setEditing(item.id)
              }}
              onEditDone={() => setEditing(null)}
              onApprove={() => approveMut.mutate(item.id)}
              onReject={() => rejectMut.mutate(item.id)}
              busy={
                (approveMut.isPending && approveMut.variables === item.id) ||
                (rejectMut.isPending && rejectMut.variables === item.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: QuestStatus }) {
  if (status === 'PUBLISHED')
    return (
      <Badge variant="success" className="text-[10px]">
        <CheckCircle size={9} /> Published
      </Badge>
    )
  if (status === 'REJECTED')
    return (
      <Badge variant="danger" className="text-[10px]">
        <X size={9} /> Rejected
      </Badge>
    )
  return (
    <Badge variant="warning" className="text-[10px]">
      Pending review
    </Badge>
  )
}

function QuestCard({
  item,
  expanded,
  editing,
  onToggle,
  onEdit,
  onEditDone,
  onApprove,
  onReject,
  busy,
}: {
  item: TeacherQuest
  expanded: boolean
  editing: boolean
  onToggle: () => void
  onEdit: () => void
  onEditDone: () => void
  onApprove: () => void
  onReject: () => void
  busy: boolean
}) {
  const isPending = item.status === 'PENDING_TEACHER_REVIEW'
  const isCoding = item.kind === 'CODING'
  const isArena = item.kind === 'ARENA'
  return (
    <div
      className={cn(
        'rounded-xl border bg-surface transition-all duration-200',
        item.status === 'PUBLISHED' ? 'border-success/40 bg-success/5' : 'border-border'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-warning/10 border-warning/20 text-warning">
          {isCoding ? <Code2 size={14} /> : isArena ? <Swords size={14} /> : <Zap size={14} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold">{item.title}</p>
            <StatusBadge status={item.status} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="muted" className="text-[10px]">
              {item.subject}
            </Badge>
            {item.topic && (
              <Badge variant="muted" className="text-[10px]">
                {item.topic}
              </Badge>
            )}
            <Badge variant={DIFFICULTY_VARIANT[item.difficulty]} className="text-[10px]">
              {item.difficulty}
            </Badge>
            <Badge variant="default" className="text-[10px]">
              +{item.xpReward} XP
            </Badge>
            {isCoding ? (
              <Badge variant="muted" className="text-[10px]">
                <Code2 size={9} /> Code
              </Badge>
            ) : isArena ? (
              <Badge variant="muted" className="text-[10px]">
                <Swords size={9} /> Arena
              </Badge>
            ) : (
              <span className="text-[10px] text-muted-foreground">{item.tileCount} tiles</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isArena && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded text-muted hover:text-foreground transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded text-muted hover:text-foreground transition-colors"
            title="Preview"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {isPending && (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className="h-7 px-2.5 text-xs text-success hover:text-success hover:bg-success/10"
                onClick={onApprove}
              >
                <CheckCircle size={12} /> Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className="h-7 px-2.5 text-xs text-danger hover:text-danger hover:bg-danger/10"
                onClick={onReject}
              >
                <X size={12} /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-4 border-t border-border bg-surface-raised/50 px-4 py-4 rounded-b-xl">
          {isCoding ? (
            <CodingQuestBuilder mode="edit" slug={item.id} onDone={onEditDone} />
          ) : (
            <QuestBuilder mode="edit" slug={item.id} onDone={onEditDone} />
          )}
        </div>
      ) : (
        expanded && <QuestPreview slug={item.id} sourceName={item.sourceName} />
      )}
    </div>
  )
}

function QuestPreview({ slug, sourceName }: { slug: string; sourceName: string | null }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-quest', slug],
    queryFn: () => fetchTeacherQuest(slug),
  })

  return (
    <div className="border-t border-border px-4 py-4 bg-surface-raised/50 rounded-b-xl animate-in fade-in slide-in-from-top-2 duration-200">
      {sourceName && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText size={12} /> Generated from {sourceName}
        </p>
      )}
      {isLoading && <p className="text-xs text-muted-foreground">Loading preview…</p>}
      {isError && <p className="text-xs text-danger">Couldn't load the preview.</p>}
      {data && data.kind === 'CODING' && <CodingPreview data={data} />}
      {data && data.kind === 'ARENA' && <ArenaPreview data={data} />}
      {data && data.kind !== 'CODING' && data.kind !== 'ARENA' && (
        <div className="space-y-4">
          {data.brief?.story && (
            <p className="text-sm text-foreground-subtle leading-relaxed">{data.brief.story}</p>
          )}

          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Correct sequence</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {data.tiles.map((t, i) => (
                <span key={t.id} className="flex items-center gap-1.5">
                  <span className="rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-foreground">
                    {t.label}
                  </span>
                  {i < data.tiles.length - 1 && <ArrowRight size={12} className="text-muted" />}
                </span>
              ))}
            </div>
          </div>

          {data.distractors && data.distractors.length > 0 && (
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Distractors</p>
              <div className="flex flex-wrap gap-1.5">
                {data.distractors.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(data.linkExplanations).length > 0 && (
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Why this order</p>
              <ul className="space-y-1">
                {Object.entries(data.linkExplanations).map(([k, v]) => (
                  <li key={k} className="text-xs text-muted-foreground">
                    • {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CodingPreview({ data }: { data: TeacherQuestDetail }) {
  const cc = data.codingFull
  return (
    <div className="space-y-4">
      {data.brief?.story && (
        <p className="text-sm text-foreground-subtle leading-relaxed">{data.brief.story}</p>
      )}

      <div>
        <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Challenge prompt</p>
        <p className="whitespace-pre-wrap text-sm text-foreground-subtle leading-relaxed">
          {cc?.prompt ?? data.prompt}
        </p>
      </div>

      {cc?.starterCode && (
        <div>
          <p className="text-[10px] text-muted uppercase tracking-widest mb-2">Starter code</p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground-subtle">
            {cc.starterCode}
          </pre>
        </div>
      )}

      {cc && cc.testCases.length > 0 && (
        <div>
          <p className="text-[10px] text-muted uppercase tracking-widest mb-2">
            Test cases ({cc.testCases.length})
          </p>
          <div className="space-y-1.5">
            {cc.testCases.map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-background px-3 py-2 text-xs">
                <p className="text-muted-foreground">{t.description}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-foreground-subtle">solution({t.input})</span>
                  <ArrowRight size={11} className="text-muted" />
                  <span className="text-success">{t.expectedOutput}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ArenaPreview({ data }: { data: TeacherQuestDetail }) {
  const ar = data.arenaFull
  if (!ar) return <p className="text-xs text-muted-foreground">No arena data.</p>
  return (
    <div className="space-y-4">
      {data.brief?.story && (
        <p className="text-sm text-foreground-subtle leading-relaxed">{data.brief.story}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="muted" className="text-[10px]">
          {ar.questions.length} questions
        </Badge>
        <Badge variant="muted" className="text-[10px]">
          {ar.secondsPerQuestion}s per question
        </Badge>
        <Badge variant="muted" className="text-[10px]">
          3 hearts
        </Badge>
      </div>

      <div>
        <p className="text-[10px] text-muted uppercase tracking-widest mb-2">
          Questions ({ar.questions.length}) — answer key
        </p>
        <div className="space-y-2">
          {ar.questions.map((q, i) => (
            <div key={q.id} className="rounded-lg border border-border bg-background px-3 py-2.5 text-xs">
              <p className="font-semibold text-foreground">
                {i + 1}. {q.prompt}
              </p>
              <ul className="mt-1.5 space-y-1">
                {q.options.map((option, oi) => (
                  <li
                    key={oi}
                    className={cn(
                      'flex items-center gap-1.5',
                      oi === q.answer ? 'font-medium text-success' : 'text-muted-foreground'
                    )}
                  >
                    {oi === q.answer ? (
                      <Check size={11} className="shrink-0" />
                    ) : (
                      <span className="w-[11px] shrink-0" />
                    )}
                    {option}
                  </li>
                ))}
              </ul>
              {q.explain && (
                <p className="mt-1.5 border-l-2 border-brand/40 pl-2 text-[11px] italic text-foreground-subtle">
                  {q.explain}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
