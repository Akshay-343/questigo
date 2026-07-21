import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, Users, Zap, Upload, Eye, Plus, PencilRuler,
  TrendingUp, ArrowRight, AlertCircle, type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { fetchTeacherOverview, type TeacherSubjectSummary } from '@/features/teacher/teacherApi'

interface StatDef {
  label: string
  value: number
  icon: LucideIcon
  color: string
  bg: string
}

export function TeacherDashboard() {
  const { user } = useAuthStore()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-overview'],
    queryFn: fetchTeacherOverview,
    staleTime: 30_000,
  })

  const stats: StatDef[] = [
    { label: 'Subjects', value: data?.stats.subjects ?? 0, icon: BookOpen, color: 'text-brand', bg: 'bg-brand/10 border-brand/20' },
    { label: 'Quests', value: data?.stats.quests ?? 0, icon: Zap, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    { label: 'Students', value: data?.stats.students ?? 0, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold">{user?.name ?? 'Teacher'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your courses today.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to="/teacher/upload">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload size={15} />
              <span className="hidden sm:inline">Upload PDF</span>
            </Button>
          </Link>
          <Link to="/teacher/quests/new">
            <Button size="sm" className="gap-2">
              <PencilRuler size={15} />
              <span className="hidden sm:inline">Create Quest</span>
            </Button>
          </Link>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle size={15} className="shrink-0" />
          Couldn't load your dashboard. Make sure the backend is running.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${stat.bg} ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
              </div>
              {isLoading ? (
                <div className="h-9 w-12 animate-pulse rounded bg-surface-raised" />
              ) : (
                <p className="text-3xl font-bold">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp size={11} className="text-success" />
                Active
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subjects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Your Subjects</CardTitle>
                <Link to="/teacher/quests/new">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <Plus size={13} />
                    New Quest
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {isLoading && (
                <>
                  <div className="h-[68px] animate-pulse rounded-lg border border-border bg-surface-raised" />
                  <div className="h-[68px] animate-pulse rounded-lg border border-border bg-surface-raised" />
                </>
              )}

              {data && data.subjects.length === 0 && (
                <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                  No subjects yet.{' '}
                  <Link to="/teacher/quests/new" className="font-medium text-brand hover:underline">
                    Create your first quest
                  </Link>{' '}
                  or generate one from a PDF.
                </div>
              )}

              {data?.subjects.map((subject) => (
                <SubjectRow key={subject.id} subject={subject} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Link to="/teacher/upload">
                <Button variant="outline" className="w-full justify-start gap-3 text-sm" size="sm">
                  <Upload size={14} className="text-brand" />
                  Upload PDF & Generate
                </Button>
              </Link>
              <Link to="/teacher/approve">
                <Button variant="outline" className="w-full justify-start gap-3 text-sm" size="sm">
                  <Eye size={14} className="text-warning" />
                  Review Pending Content
                </Button>
              </Link>
              <Link to="/teacher/students">
                <Button variant="outline" className="w-full justify-start gap-3 text-sm" size="sm">
                  <Users size={14} className="text-violet-400" />
                  View Students
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SubjectRow({ subject }: { subject: TeacherSubjectSummary }) {
  return (
    <Link
      to="/teacher/approve"
      className="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-4 hover:border-brand/40 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 border border-brand/20">
          <BookOpen size={16} className="text-brand" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{subject.title}</p>
          <p className="text-xs text-muted-foreground">
            {subject.questCount} {subject.questCount === 1 ? 'quest' : 'quests'}
          </p>
        </div>
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        Manage <ArrowRight size={12} />
      </span>
    </Link>
  )
}
