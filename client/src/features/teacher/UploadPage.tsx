import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, File, X, AlertCircle, FolderOpen, Sparkles, ListOrdered, Code2, Swords } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { extractApiError } from '@/lib/api'
import { generateQuests, type QuestKind } from './teacherApi'

const KINDS: { id: QuestKind; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    id: 'SEQUENCE',
    label: 'Sequence Builder',
    icon: <ListOrdered size={15} />,
    hint: 'Ordered process steps to arrange.',
  },
  {
    id: 'CODING',
    label: 'Coding Challenge',
    icon: <Code2 size={15} />,
    hint: 'A Python solution(...) checked by tests.',
  },
  {
    id: 'ARENA',
    label: 'Rapid Arena',
    icon: <Swords size={15} />,
    hint: 'Timed multiple-choice questions against the clock.',
  },
]

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const MAX_BYTES = 10 * 1024 * 1024

export function UploadPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<globalThis.File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [subject, setSubject] = useState('')
  const [kind, setKind] = useState<QuestKind>('SEQUENCE')
  const [count, setCount] = useState(2)
  const [pastedText, setPastedText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFile = (files: FileList | null) => {
    if (!files?.length) return
    const f = files[0]
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      return
    }
    if (f.size > MAX_BYTES) {
      setError('File exceeds the 10 MB limit.')
      return
    }
    setError(null)
    setFile(f)
  }

  const canSubmit = subject.trim().length > 0 && (!!file || pastedText.trim().length >= 30) && !generating

  const handleGenerate = async () => {
    if (!canSubmit) return
    setGenerating(true)
    setError(null)
    try {
      const res = await generateQuests({ subject: subject.trim(), count, kind, file, text: pastedText.trim() || undefined })
      await queryClient.invalidateQueries({ queryKey: ['teacher-quests'] })
      toast.success('Quests generated', {
        description: `${res.created.length} draft${res.created.length === 1 ? '' : 's'} ready for review (via ${res.aiProvider}).`,
      })
      navigate('/teacher/approve')
    } catch (err) {
      setError(extractApiError(err, 'Generation failed. Please try again.'))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">Teacher Portal</p>
        <h1 className="text-2xl font-bold">Upload Learning Material</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Upload a PDF (or paste text) and Questigo generates quest drafts for your review.
        </p>
      </div>

      <div className="space-y-6">
        {/* Quest type */}
        <div>
          <Label className="mb-2 block">Quest type</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
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
        </div>

        {/* Drop zone */}
        <div>
          <Label className="mb-2 block">Document</Label>
          <div
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pickFile(e.dataTransfer.files)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200',
              dragging
                ? 'border-brand bg-brand/10 scale-[1.01]'
                : 'border-border bg-surface hover:border-brand/50 hover:bg-surface-raised'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files)}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised border border-border">
              <FolderOpen size={22} className={cn(dragging ? 'text-brand' : 'text-muted')} />
            </div>
            <div>
              <p className="text-sm font-medium">{dragging ? 'Drop your PDF here' : 'Drag & drop a PDF here'}</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse — PDF only, max 10MB</p>
            </div>
          </div>
        </div>

        {/* Selected file */}
        {file && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 border border-brand/20">
              <File size={14} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-muted hover:text-danger transition-colors p-1 rounded"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Paste fallback */}
        <div className="space-y-2">
          <Label htmlFor="paste">Or paste text {file && <span className="text-muted">(ignored while a PDF is selected)</span>}</Label>
          <textarea
            id="paste"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={!!file}
            rows={4}
            placeholder="Paste lecture notes or any study material here…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
          />
        </div>

        {/* Subject + count */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject / Track</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. DBMS"
            />
            <p className="text-xs text-muted-foreground">Matches an existing track by name, or creates a new one.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="count">Quests to generate</Label>
            <select
              id="count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-raised px-4 py-3">
          <AlertCircle size={14} className="text-muted shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Generated quests land as drafts in <span className="font-medium">Approve Content</span> — nothing reaches
            students until you approve it.
          </p>
        </div>

        <Button className="w-full gap-2" size="lg" onClick={handleGenerate} disabled={!canSubmit} loading={generating}>
          {generating ? <Sparkles size={16} /> : <Upload size={16} />}
          {generating ? 'Generating…' : 'Generate Quests'}
        </Button>
      </div>
    </div>
  )
}
