import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Database, Zap, CheckCircle2, AlertCircle, Compass } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/authStore'
import { getLevelInfo } from '@/lib/levels'
import { fetchSubjects, type SubjectSummary } from './playApi'

export function SubjectsPage() {
  const { user } = useAuthStore()
  const { data: subjects, isLoading, isError } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })

  const lvl = getLevelInfo(user?.xp ?? 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <Badge variant="level" className="gap-1 px-2.5 py-1">
            <Zap size={11} /> Level {lvl.level}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/20">
            <Compass size={20} className="text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Skill Trees</h1>
            <p className="text-xs text-muted-foreground">Pick a track and start restoring systems.</p>
          </div>
        </div>

        {isError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle size={15} className="shrink-0" />
            Couldn't load the skill trees. Make sure the backend is running.
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        )}

        {subjects && subjects.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
            <Database size={28} className="mx-auto mb-3 text-muted" />
            <p className="text-sm font-medium">No tracks published yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Once a teacher approves generated content, new skill trees show up here.
            </p>
          </div>
        )}

        {subjects && subjects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map((subject, i) => (
              <SubjectCard key={subject.id} subject={subject} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function SubjectCard({ subject, index }: { subject: SubjectSummary; index: number }) {
  const pct = subject.questCount ? Math.round((subject.completedCount / subject.questCount) * 100) : 0
  const allDone = subject.questCount > 0 && subject.completedCount === subject.questCount

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Link to={`/play/${subject.id}`} className="group block h-full">
        <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <Database size={20} className="text-brand" />
            </div>
            <ArrowRight
              size={18}
              className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand"
            />
          </div>

          <h2 className="mt-4 font-bold">{subject.title}</h2>
          {subject.subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subject.subtitle}</p>
          )}
          {subject.description && (
            <p className="mt-2 line-clamp-2 text-sm text-foreground-subtle">{subject.description}</p>
          )}

          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {allDone && <CheckCircle2 size={12} className="text-success" />}
                {allDone ? 'All systems restored' : 'Track progress'}
              </span>
              <span>
                {subject.completedCount} / {subject.questCount}
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
