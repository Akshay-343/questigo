import { useQuery } from '@tanstack/react-query'
import { Users, Zap, CheckCircle2, Trophy, AlertCircle, Crown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InitialsAvatar } from '@/components/ui/avatar'
import { fetchTeacherStudents, type TeacherStudent } from './teacherApi'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function StudentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: fetchTeacherStudents,
    staleTime: 30_000,
  })

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-400">
          <Users size={17} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone enrolled, ranked by XP. {data ? `${data.length} student${data.length === 1 ? '' : 's'}.` : ''}
          </p>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle size={15} className="shrink-0" />
          Couldn't load students. Make sure the backend is running.
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Users size={22} className="text-muted" />
          <p className="text-sm text-muted-foreground">No students have registered yet.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-2.5">
          {data.map((s) => (
            <StudentRow key={s.id} student={s} />
          ))}
        </div>
      )}
    </div>
  )
}

const RANK_ACCENT: Record<number, string> = {
  1: 'text-warning',
  2: 'text-foreground-subtle',
  3: 'text-amber-700',
}

function StudentRow({ student: s }: { student: TeacherStudent }) {
  return (
    <Card className="border-border">
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4">
        <div className={`w-7 shrink-0 text-center text-sm font-bold ${RANK_ACCENT[s.rank] ?? 'text-muted'}`}>
          {s.rank <= 3 ? <Crown size={16} className="mx-auto" /> : s.rank}
        </div>

        <InitialsAvatar name={s.name} size="md" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{s.name}</p>
          <p className="truncate text-xs text-muted-foreground">{s.email}</p>
          <p className="mt-0.5 text-[10px] text-muted">Joined {formatDate(s.joinedAt)}</p>
        </div>

        <div className="hidden items-center gap-5 sm:flex">
          <Metric icon={CheckCircle2} accent="text-success" value={s.completedCount} label="quests" />
          <Metric icon={Trophy} accent="text-warning" value={s.achievementsCount} label="achv" />
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="level" className="gap-1 px-2 py-0.5">
            <Zap size={10} /> Lvl {s.level}
          </Badge>
          <span className="text-xs font-medium text-brand">{s.xp.toLocaleString()} XP</span>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({
  icon: Icon,
  accent,
  value,
  label,
}: {
  icon: typeof CheckCircle2
  accent: string
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={15} className={accent} />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[10px] text-muted">{label}</span>
    </div>
  )
}
