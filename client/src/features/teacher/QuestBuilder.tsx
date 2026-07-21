import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowRight, ChevronDown, ChevronUp, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { extractApiError } from '@/lib/api'
import type { Difficulty } from '@/lib/sequenceData'
import {
  createQuest,
  fetchTeacherQuest,
  updateQuestStructure,
  type QuestStructureInput,
  type TeacherQuestDetail,
} from './teacherApi'

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD']
const XP_BY_DIFFICULTY: Record<Difficulty, number> = { EASY: 80, MEDIUM: 120, HARD: 180 }

interface TileForm {
  label: string
  sub: string
}

interface BuilderState {
  subject: string
  title: string
  nodeLabel: string
  topic: string
  difficulty: Difficulty
  xpReward: number
  xpTouched: boolean
  briefSystemName: string
  briefStory: string
  prompt: string
  tiles: TileForm[]
  distractors: TileForm[]
  explanations: string[]
}

function emptyState(): BuilderState {
  return {
    subject: '',
    title: '',
    nodeLabel: '',
    topic: '',
    difficulty: 'MEDIUM',
    xpReward: XP_BY_DIFFICULTY.MEDIUM,
    xpTouched: false,
    briefSystemName: '',
    briefStory: '',
    prompt: '',
    tiles: [
      { label: '', sub: '' },
      { label: '', sub: '' },
      { label: '', sub: '' },
    ],
    explanations: ['', ''],
    distractors: [],
  }
}

function fromDetail(d: TeacherQuestDetail): BuilderState {
  const tiles = d.tiles.map((t) => ({ label: t.label, sub: t.sub ?? '' }))
  const explanations = d.tiles
    .slice(0, -1)
    .map((t, i) => d.linkExplanations[`${t.id}->${d.tiles[i + 1].id}`] ?? '')
  return {
    subject: '',
    title: d.title,
    nodeLabel: d.node,
    topic: d.topic ?? '',
    difficulty: d.difficulty,
    xpReward: d.xpReward,
    xpTouched: true,
    briefSystemName: d.brief?.systemName ?? '',
    briefStory: d.brief?.story ?? '',
    prompt: d.prompt ?? '',
    tiles,
    distractors: (d.distractors ?? []).map((t) => ({ label: t.label, sub: t.sub ?? '' })),
    explanations,
  }
}

function toPayload(f: BuilderState): QuestStructureInput {
  return {
    title: f.title.trim(),
    nodeLabel: f.nodeLabel.trim(),
    topic: f.topic.trim() || null,
    difficulty: f.difficulty,
    xpReward: f.xpReward,
    briefSystemName: f.briefSystemName.trim() || undefined,
    briefStory: f.briefStory.trim() || undefined,
    prompt: f.prompt.trim() || undefined,
    tiles: f.tiles.map((t) => ({ label: t.label.trim(), sub: t.sub.trim() || null })),
    distractors: f.distractors
      .filter((d) => d.label.trim())
      .map((d) => ({ label: d.label.trim(), sub: d.sub.trim() || null })),
    explanations: f.explanations,
  }
}

/** Keep the explanations array aligned to the number of consecutive tile pairs. */
function resizeExplanations(exps: string[], tileCount: number): string[] {
  const need = Math.max(tileCount - 1, 0)
  const next = exps.slice(0, need)
  while (next.length < need) next.push('')
  return next
}

const fieldLabel = 'mb-1.5 block text-[10px] uppercase tracking-widest text-muted'
const textareaCls =
  'flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
const selectCls =
  'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

type BuilderProps =
  | { mode: 'create'; onCreated: (d: TeacherQuestDetail) => void; onCancel?: () => void }
  | { mode: 'edit'; slug: string; onDone: () => void }

export function QuestBuilder(props: BuilderProps) {
  const queryClient = useQueryClient()
  const isEdit = props.mode === 'edit'
  const slug = props.mode === 'edit' ? props.slug : null

  const detailQuery = useQuery({
    queryKey: ['teacher-quest', slug],
    queryFn: () => fetchTeacherQuest(slug!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<BuilderState>(emptyState)
  const [seeded, setSeeded] = useState(!isEdit)

  useEffect(() => {
    if (isEdit && detailQuery.data && !seeded) {
      setForm(fromDetail(detailQuery.data))
      setSeeded(true)
    }
  }, [isEdit, detailQuery.data, seeded])

  const mutation = useMutation({
    mutationFn: (payload: QuestStructureInput) =>
      isEdit
        ? updateQuestStructure(slug!, payload)
        : createQuest({ ...payload, subject: form.subject.trim() }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-quests'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-overview'] })
      queryClient.invalidateQueries({ queryKey: ['subject', updated.subjectSlug] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      if (props.mode === 'edit') {
        queryClient.setQueryData(['teacher-quest', slug], updated)
        toast.success('Saved', { description: `Changes to "${updated.title}" were saved.` })
        props.onDone()
      } else {
        toast.success('Quest created', {
          description: `"${updated.title}" is awaiting review.`,
        })
        props.onCreated(updated)
      }
    },
    onError: (e) => toast.error(extractApiError(e, 'Could not save the quest.')),
  })

  const setF = (patch: Partial<BuilderState>) => setForm((f) => ({ ...f, ...patch }))

  const setDifficulty = (difficulty: Difficulty) =>
    setForm((f) => ({
      ...f,
      difficulty,
      xpReward: f.xpTouched ? f.xpReward : XP_BY_DIFFICULTY[difficulty],
    }))

  const setTile = (group: 'tiles' | 'distractors', i: number, patch: Partial<TileForm>) =>
    setForm((f) => ({
      ...f,
      [group]: f[group].map((t, j) => (j === i ? { ...t, ...patch } : t)),
    }))

  const addTile = () =>
    setForm((f) => {
      const tiles = [...f.tiles, { label: '', sub: '' }]
      return { ...f, tiles, explanations: resizeExplanations(f.explanations, tiles.length) }
    })

  const removeTile = (i: number) =>
    setForm((f) => {
      if (f.tiles.length <= 3) return f
      const tiles = f.tiles.filter((_, j) => j !== i)
      return { ...f, tiles, explanations: resizeExplanations(f.explanations, tiles.length) }
    })

  const moveTile = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const j = i + dir
      if (j < 0 || j >= f.tiles.length) return f
      const tiles = [...f.tiles]
      ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
      return { ...f, tiles }
    })

  const addDistractor = () => setForm((f) => ({ ...f, distractors: [...f.distractors, { label: '', sub: '' }] }))
  const removeDistractor = (i: number) =>
    setForm((f) => ({ ...f, distractors: f.distractors.filter((_, j) => j !== i) }))

  const setExplanation = (i: number, value: string) =>
    setForm((f) => ({ ...f, explanations: f.explanations.map((e, j) => (j === i ? value : e)) }))

  const valid = useMemo(() => {
    const base =
      form.title.trim().length > 0 &&
      form.nodeLabel.trim().length > 0 &&
      form.tiles.length >= 3 &&
      form.tiles.every((t) => t.label.trim().length > 0)
    return isEdit ? base : base && form.subject.trim().length > 0
  }, [form, isEdit])

  if (isEdit && detailQuery.isLoading)
    return <p className="px-4 py-4 text-xs text-muted-foreground">Loading editor…</p>
  if (isEdit && detailQuery.isError)
    return <p className="px-4 py-4 text-xs text-danger">Couldn't load the quest.</p>
  if (props.mode === 'edit' && detailQuery.data?.kind === 'CODING')
    return (
      <div className="px-4 py-4 text-xs text-muted-foreground">
        This is a coding challenge — it isn't edited as a sequence.
        <button className="ml-2 font-medium text-brand" onClick={props.onDone}>
          Close
        </button>
      </div>
    )

  return (
    <div className="space-y-5">
      {/* Subject (create only) */}
      {!isEdit && (
        <div>
          <label className={fieldLabel}>Subject / track</label>
          <Input
            value={form.subject}
            onChange={(e) => setF({ subject: e.target.value })}
            placeholder="e.g. Operating Systems (a new track is created if it doesn't exist)"
          />
        </div>
      )}

      {/* Details */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={fieldLabel}>Title</label>
          <Input value={form.title} onChange={(e) => setF({ title: e.target.value })} placeholder="Quest title" />
        </div>
        <div>
          <label className={fieldLabel}>Node label</label>
          <Input
            value={form.nodeLabel}
            onChange={(e) => setF({ nodeLabel: e.target.value })}
            placeholder="Short skill-tree label"
          />
        </div>
        <div>
          <label className={fieldLabel}>Topic (optional)</label>
          <Input value={form.topic} onChange={(e) => setF({ topic: e.target.value })} placeholder="Topic" />
        </div>
        <div>
          <label className={fieldLabel}>Difficulty</label>
          <select value={form.difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={selectCls}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>XP reward</label>
          <Input
            type="number"
            min={0}
            max={10000}
            value={form.xpReward}
            onChange={(e) => setF({ xpReward: Number(e.target.value), xpTouched: true })}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabel}>System name (optional)</label>
          <Input
            value={form.briefSystemName}
            onChange={(e) => setF({ briefSystemName: e.target.value })}
            placeholder="Defaults to the title"
          />
        </div>
        <div>
          <label className={fieldLabel}>Story (optional)</label>
          <Input value={form.briefStory} onChange={(e) => setF({ briefStory: e.target.value })} placeholder="1–2 sentence framing" />
        </div>
      </div>
      <div>
        <label className={fieldLabel}>Prompt (optional)</label>
        <textarea
          rows={2}
          value={form.prompt}
          onChange={(e) => setF({ prompt: e.target.value })}
          className={textareaCls}
          placeholder="The task instruction shown to the student"
        />
      </div>

      {/* Correct sequence */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted">Correct sequence</p>
          <span className="text-[10px] text-muted">{form.tiles.length} steps · min 3</span>
        </div>
        <div className="space-y-2">
          {form.tiles.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs text-muted">{i + 1}</span>
              <Input value={t.label} onChange={(e) => setTile('tiles', i, { label: e.target.value })} placeholder="Step label" />
              <Input value={t.sub} onChange={(e) => setTile('tiles', i, { sub: e.target.value })} placeholder="Note (optional)" />
              <div className="flex shrink-0 items-center">
                <IconBtn title="Move up" disabled={i === 0} onClick={() => moveTile(i, -1)}>
                  <ChevronUp size={14} />
                </IconBtn>
                <IconBtn title="Move down" disabled={i === form.tiles.length - 1} onClick={() => moveTile(i, 1)}>
                  <ChevronDown size={14} />
                </IconBtn>
                <IconBtn title="Remove" disabled={form.tiles.length <= 3} onClick={() => removeTile(i)}>
                  <Trash2 size={13} className="text-danger/80" />
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="mt-2 gap-1.5 text-xs" onClick={addTile}>
          <Plus size={13} /> Add step
        </Button>
      </div>

      {/* Distractors */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-widest text-muted">Distractors (optional wrong steps)</p>
        <div className="space-y-2">
          {form.distractors.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={t.label} onChange={(e) => setTile('distractors', i, { label: e.target.value })} placeholder="Wrong step label" />
              <Input value={t.sub} onChange={(e) => setTile('distractors', i, { sub: e.target.value })} placeholder="Note (optional)" />
              <IconBtn title="Remove" onClick={() => removeDistractor(i)}>
                <Trash2 size={13} className="text-danger/80" />
              </IconBtn>
            </div>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="mt-2 gap-1.5 text-xs" onClick={addDistractor}>
          <Plus size={13} /> Add distractor
        </Button>
      </div>

      {/* Why this order */}
      {form.tiles.length > 1 && (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-widest text-muted">Why this order (optional)</p>
          <div className="space-y-3">
            {form.tiles.slice(0, -1).map((t, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center gap-1.5 text-xs text-foreground-subtle">
                  <span className="font-medium">{t.label.trim() || `Step ${i + 1}`}</span>
                  <ArrowRight size={11} className="text-muted" />
                  <span className="font-medium">{form.tiles[i + 1].label.trim() || `Step ${i + 2}`}</span>
                </div>
                <textarea
                  rows={2}
                  value={form.explanations[i] ?? ''}
                  onChange={(e) => setExplanation(i, e.target.value)}
                  className={textareaCls}
                  placeholder="Auto-filled if left blank"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => (props.mode === 'edit' ? props.onDone() : props.onCancel?.())}
          disabled={mutation.isPending}
        >
          <X size={13} /> Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!valid}
          loading={mutation.isPending}
          onClick={() => mutation.mutate(toPayload(form))}
        >
          <Save size={13} /> {isEdit ? 'Save changes' : 'Create quest'}
        </Button>
      </div>
    </div>
  )
}

function IconBtn({
  children,
  title,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  title: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded p-1 text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
