import { useState } from 'react'
import '@/lib/monacoSetup'
import Editor from '@monaco-editor/react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Play, RotateCcw, CheckCircle2, XCircle, Zap, AlertTriangle, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { runChallenge, type QuestDetail, type RunResult } from '../playApi'

interface Props {
  mission: QuestDetail
  onSolved: (code: string) => void
  submitting: boolean
}

export function CodingChallenge({ mission, onSolved, submitting }: Props) {
  const challenge = mission.coding!
  const [code, setCode] = useState(challenge.starterCode)
  const [result, setResult] = useState<RunResult | null>(null)

  const runMut = useMutation({
    mutationFn: () => runChallenge(mission.id, code),
    onSuccess: setResult,
  })

  const allPassed = result?.allPassed ?? false

  const reset = () => {
    if (code !== challenge.starterCode && !confirm('Reset your code back to the starter template?')) return
    setCode(challenge.starterCode)
    setResult(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
      {/* Left: prompt + test list */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="muted">{mission.topic}</Badge>
            <Badge variant="default" className="gap-1">
              <Zap size={11} /> +{mission.xpReward} XP
            </Badge>
          </div>
          <p className="whitespace-pre-line text-base leading-relaxed text-foreground-subtle">
            {challenge.prompt}
          </p>
        </div>

        <div className="flex-1 rounded-2xl border border-border bg-surface p-6">
          <p className="mb-3 text-[10px] uppercase tracking-widest text-muted">Test cases</p>
          <ul className="space-y-2">
            {challenge.testCases.map((tc) => {
              const res = result?.results.find((r) => r.id === tc.id)
              return (
                <li key={tc.id} className="flex items-start gap-2 text-sm">
                  <ResultIcon passed={res?.passed} />
                  <div className="min-w-0 flex-1">
                    <span className="text-foreground-subtle">{tc.description}</span>
                    {res && !res.passed && (
                      <div className="mt-1 space-y-0.5 font-mono text-xs">
                        <p className="text-danger">got: {res.actual}</p>
                        <p className="text-muted-foreground">want: {res.expected}</p>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Right: editor + controls — sized like a traditional online compiler pane */}
      <div className="flex flex-col">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-[#1e1e1e]">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="font-mono text-xs text-muted-foreground">{challenge.language}</span>
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <Editor
            height="72vh"
            language={challenge.language}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 15,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 14, bottom: 14 },
              tabSize: 4,
            }}
          />
        </div>

        {result?.error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span className="font-mono">{result.error}</span>
          </div>
        )}

        {result && !result.error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-3 rounded-lg border px-3 py-2 text-sm font-medium',
              allPassed
                ? 'border-success/40 bg-success/10 text-success'
                : 'border-warning/40 bg-warning/10 text-warning'
            )}
          >
            {allPassed
              ? 'All tests passed — submit to earn XP.'
              : `${result.results.filter((r) => r.passed).length} / ${result.results.length} tests passed.`}
          </motion.div>
        )}

        <div className="mt-3 flex gap-3">
          {allPassed ? (
            <Button
              className="flex-1 gap-2"
              loading={submitting}
              onClick={() => onSolved(code)}
            >
              <Trophy size={15} /> Submit &amp; Earn XP
            </Button>
          ) : (
            <Button
              className="flex-1 gap-2"
              loading={runMut.isPending}
              disabled={!code.trim()}
              onClick={() => runMut.mutate()}
            >
              <Play size={15} /> Run Tests
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultIcon({ passed }: { passed?: boolean }) {
  if (passed === undefined)
    return <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
  return passed ? (
    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" />
  ) : (
    <XCircle size={15} className="mt-0.5 shrink-0 text-danger" />
  )
}
