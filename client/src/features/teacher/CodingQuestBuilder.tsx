import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { extractApiError } from '@/lib/api'
import type { Difficulty } from '@/lib/sequenceData'
import {
  createCodingQuest,
  fetchTeacherQuest,
  updateCodingQuest,
  type CodingQuestInput,
  type TeacherQuestDetail,
} from './teacherApi'

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD']
const XP_BY_DIFFICULTY: Record<Difficulty, number> = { EASY: 80, MEDIUM: 120, HARD: 180 }

const DEFAULT_STARTER = `def solution(value):
    # implement me
    pass
`

interface TestForm {
  description: string
  input: string
  expectedOutput: string
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
  starterCode: string
  tests: TestForm[]
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
    starterCode: DEFAULT_STARTER,
    tests: [{ description: '', input: '', expectedOutput: '' }],
  }
}

function fromDetail(d: TeacherQuestDetail): BuilderState {
  const cc = d.codingFull
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
    prompt: cc?.prompt ?? d.prompt ?? '',
    starterCode: cc?.starterCode ?? DEFAULT_STARTER,
    tests: (cc?.testCases ?? []).map((t) => ({
      description: t.description,
      input: t.input,
      expectedOutput: t.expectedOutput,
    })),
  }
}

function toPayload(f: BuilderState): CodingQuestInput {
  return {
    title: f.title.trim(),
    nodeLabel: f.nodeLabel.trim(),
    topic: f.topic.trim() || null,
    difficulty: f.difficulty,
    xpReward: f.xpReward,
    briefSystemName: f.briefSystemName.trim() || undefined,
    briefStory: f.briefStory.trim() || undefined,
    prompt: f.prompt.trim(),
    starterCode: f.starterCode,
    language: 'python',
    testCases: f.tests
      .filter((t) => t.description.trim() && t.input.trim())
      .map((t) => ({
        description: t.description.trim(),
        input: t.input.trim(),
        expectedOutput: t.expectedOutput,
      })),
  }
}

const fieldLabel = 'mb-1.5 block text-[10px] uppercase tracking-widest text-muted'
const textareaCls =
  'flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
const codeCls = `${textareaCls} font-mono text-xs leading-relaxed`
const selectCls =
  'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

type BuilderProps =
  | { mode: 'create'; onCreated: (d: TeacherQuestDetail) => void; onCancel?: () => void }
  | { mode: 'edit'; slug: string; onDone: () => void }

export function CodingQuestBuilder(props: BuilderProps) {
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
    mutationFn: (payload: CodingQuestInput) =>
      isEdit
        ? updateCodingQuest(slug!, payload)
        : createCodingQuest({ ...payload, subject: form.subject.trim() }),
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
        toast.success('Coding quest created', {
          description: `"${updated.title}" is awaiting review.`,
        })
        props.onCreated(updated)
      }
    },
    onError: (e) => toast.error(extractApiError(e, 'Could not save the coding quest.')),
  })

  const setF = (patch: Partial<BuilderState>) => setForm((f) => ({ ...f, ...patch }))

  const setDifficulty = (difficulty: Difficulty) =>
    setForm((f) => ({
      ...f,
      difficulty,
      xpReward: f.xpTouched ? f.xpReward : XP_BY_DIFFICULTY[difficulty],
    }))

  const setTest = (i: number, patch: Partial<TestForm>) =>
    setForm((f) => ({
      ...f,
      tests: f.tests.map((t, j) => (j === i ? { ...t, ...patch } : t)),
    }))

  const addTest = () =>
    setForm((f) => ({ ...f, tests: [...f.tests, { description: '', input: '', expectedOutput: '' }] }))

  const removeTest = (i: number) =>
    setForm((f) => {
      if (f.tests.length <= 1) return f
      return { ...f, tests: f.tests.filter((_, j) => j !== i) }
    })

  const valid = useMemo(() => {
    const filledTests = form.tests.filter((t) => t.description.trim() && t.input.trim())
    const base =
      form.title.trim().length > 0 &&
      form.nodeLabel.trim().length > 0 &&
      form.prompt.trim().length > 0 &&
      filledTests.length >= 1
    return isEdit ? base : base && form.subject.trim().length > 0
  }, [form, isEdit])

  if (isEdit && detailQuery.isLoading)
    return <p className="px-4 py-4 text-xs text-muted-foreground">Loading editor…</p>
  if (isEdit && detailQuery.isError)
    return <p className="px-4 py-4 text-xs text-danger">Couldn't load the quest.</p>
  if (props.mode === 'edit' && detailQuery.data?.kind === 'SEQUENCE')
    return (
      <div className="px-4 py-4 text-xs text-muted-foreground">
        This is a Sequence quest — it isn't edited as a coding challenge.
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
            placeholder="e.g. Data Structures (a new track is created if it doesn't exist)"
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

      {/* Prompt */}
      <div>
        <label className={fieldLabel}>Challenge prompt</label>
        <textarea
          rows={4}
          value={form.prompt}
          onChange={(e) => setF({ prompt: e.target.value })}
          className={textareaCls}
          placeholder="Describe the task. Tell the student to implement solution(...) and what it should return."
        />
        <p className="mt-1 text-[11px] text-muted">
          The student implements a function named <code className="text-foreground-subtle">solution</code>; each
          test calls <code className="text-foreground-subtle">solution(&lt;input&gt;)</code>.
        </p>
      </div>

      {/* Starter code */}
      <div>
        <label className={fieldLabel}>Starter code (Python)</label>
        <textarea
          rows={5}
          spellCheck={false}
          value={form.starterCode}
          onChange={(e) => setF({ starterCode: e.target.value })}
          className={codeCls}
          placeholder="def solution(value):\n    pass"
        />
      </div>

      {/* Test cases */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted">Test cases</p>
          <span className="text-[10px] text-muted">{form.tests.length} · min 1</span>
        </div>
        <div className="space-y-3">
          {form.tests.map((t, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-raised/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground-subtle">Test {i + 1}</span>
                <button
                  type="button"
                  title="Remove"
                  disabled={form.tests.length <= 1}
                  onClick={() => removeTest(i)}
                  className="rounded p-1 text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={13} className="text-danger/80" />
                </button>
              </div>
              <div className="space-y-2">
                <Input
                  value={t.description}
                  onChange={(e) => setTest(i, { description: e.target.value })}
                  placeholder="Description (e.g. removes duplicates and sorts)"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={t.input}
                    onChange={(e) => setTest(i, { input: e.target.value })}
                    placeholder="Input expression, e.g. [3, 1, 2, 3]"
                    className="font-mono text-xs"
                  />
                  <Input
                    value={t.expectedOutput}
                    onChange={(e) => setTest(i, { expectedOutput: e.target.value })}
                    placeholder="Expected output, e.g. [1, 2, 3]"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="mt-2 gap-1.5 text-xs" onClick={addTest}>
          <Plus size={13} /> Add test case
        </Button>
        <p className="mt-2 text-[11px] text-muted">
          <span className="text-foreground-subtle">Input</span> is the argument expression passed to{' '}
          <code className="text-foreground-subtle">solution(...)</code>;{' '}
          <span className="text-foreground-subtle">expected output</span> is compared against{' '}
          <code className="text-foreground-subtle">str(result)</code>.
        </p>
      </div>

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
