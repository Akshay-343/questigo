import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Code2, Trophy, Zap, Users,
  CheckCircle, Menu, X, Sparkles, Upload, Gamepad2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/ui/Logo'

// ─── Shared container ─────────────────────────────────────────────────────────
const cn = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'

// ─── Teacher Workflow Visual ──────────────────────────────────────────────────
// Shows the core product loop: upload PDF → AI generates → teacher approves.
// This is the actual product story, not a generic code editor.

function WorkflowVisual() {
  return (
    <div className="relative select-none">
      <div className="absolute inset-0 translate-y-4 scale-95 rounded-3xl bg-brand/15 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/60 ring-1 ring-white/5">

        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-4 py-3">
          <div className="flex gap-1.5">
            <span className="block h-2.5 w-2.5 rounded-full bg-red-500/50" />
            <span className="block h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
            <span className="block h-2.5 w-2.5 rounded-full bg-green-500/50" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">
            questigo.dev / teacher / upload
          </span>
        </div>

        <div className="space-y-2.5 p-4">

          {/* Step 1 — PDF uploaded */}
          <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/5 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-success/30 bg-success/10">
              <Upload size={14} className="text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">data_structures.pdf</p>
              <p className="text-[10px] text-muted-foreground">Uploaded · 4.2 MB</p>
            </div>
            <CheckCircle size={14} className="shrink-0 text-success" />
          </div>

          {/* Step 2 — AI generating */}
          <div className="flex items-center gap-3 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
              <Sparkles size={14} className="text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">Generating quests…</p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-raised">
                <div className="h-full w-3/4 rounded-full bg-brand/70" />
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-brand">75%</span>
          </div>

          {/* Step 3 — Generated content ready to approve */}
          <div className="rounded-xl border border-border bg-surface-raised/60 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Ready for Approval
            </p>
            <div className="space-y-1.5">
              {[
                { type: 'quest', label: 'Introduction to Linked Lists', xp: 80 },
                { type: 'challenge', label: 'Reverse a Linked List', xp: 120 },
                { type: 'quest', label: 'Stack vs Queue Comparison', xp: 60 },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2"
                >
                  {item.type === 'quest'
                    ? <Zap size={10} className="shrink-0 text-warning" />
                    : <Code2 size={10} className="shrink-0 text-brand" />}
                  <span className="flex-1 truncate text-[11px] text-foreground-subtle">
                    {item.label}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-warning">
                    +{item.xp} XP
                  </span>
                  <span className="shrink-0 rounded border border-success/25 bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                    Approve
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── How Questigo Works (4-step pipeline) ────────────────────────────────────

const workflow = [
  {
    step: '01',
    icon: <Upload size={20} />,
    color: 'text-brand',
    ring: 'border-brand/30 bg-brand/10',
    title: 'Teacher Uploads Material',
    description:
      'Upload a PDF, lecture notes, or paste raw text directly into the portal.',
  },
  {
    step: '02',
    icon: <Sparkles size={20} />,
    color: 'text-violet-400',
    ring: 'border-violet-500/30 bg-violet-500/10',
    title: 'AI Generates Content',
    description:
      'Questigo analyzes the material and produces quests and coding challenges with test cases automatically.',
  },
  {
    step: '03',
    icon: <CheckCircle size={20} />,
    color: 'text-success',
    ring: 'border-success/30 bg-success/10',
    title: 'Teacher Approves',
    description:
      'The teacher reviews each item in the approval queue — edit, approve, or discard before publishing.',
  },
  {
    step: '04',
    icon: <Gamepad2 size={20} />,
    color: 'text-warning',
    ring: 'border-warning/30 bg-warning/10',
    title: 'Students Learn by Playing',
    description:
      'Students unlock quests, solve coding challenges, earn XP, level up, and compete on the leaderboard.',
  },
]

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <Sparkles size={20} />,
    color: 'text-brand',
    bg: 'bg-brand/10 border-brand/20',
    title: 'AI Quest Generation',
    description:
      'Upload a PDF or paste notes. Questigo analyzes the content and produces structured quests and coding challenges — no manual authoring.',
  },
  {
    icon: <CheckCircle size={20} />,
    color: 'text-success',
    bg: 'bg-success/10 border-success/20',
    title: 'Teacher Approval Workflow',
    description:
      'Generated content goes into a review queue. Teachers edit, approve, or reject each item before students can access it.',
  },
  {
    icon: <Code2 size={20} />,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    title: 'Live Coding Challenges',
    description:
      'Students write real code in the browser. Test cases run instantly and report pass/fail per case — no manual grading.',
  },
  {
    icon: <Zap size={20} />,
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/20',
    title: 'XP & Level Progression',
    description:
      'Every completed quest awards XP. Students level up through a fixed progression table and track their growth over time.',
  },
  {
    icon: <Trophy size={20} />,
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/20',
    title: 'Quest-Based Learning',
    description:
      'Subjects are organized into topics and quests. Students follow a structured path rather than an unordered problem list.',
  },
  {
    icon: <Users size={20} />,
    color: 'text-foreground-subtle',
    bg: 'bg-surface-raised border-border',
    title: 'Leaderboard & Achievements',
    description:
      'Students compete on an XP leaderboard and unlock achievements for milestones — driving consistent engagement.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ══════════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════════ */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className={`${cn} flex h-16 items-center justify-between`}>

          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8 rounded-lg" />
            <span className="text-[15px] font-bold tracking-tight">Questigo</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm">Student Login</Button>
            </Link>
            <Link to="/teacher/login">
              <Button size="sm" className="gap-1.5">
                Teacher Portal <ArrowRight size={13} />
              </Button>
            </Link>
          </div>

          <button
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground md:hidden"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-border/50 bg-background/95 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              <a
                href="#how-it-works"
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                onClick={() => setMobileNavOpen(false)}
              >
                How it works
              </a>
              <a
                href="#features"
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                onClick={() => setMobileNavOpen(false)}
              >
                Features
              </a>
              <div className="mt-3 flex flex-col gap-2 border-t border-border/50 pt-3">
                <Link to="/teacher/login" onClick={() => setMobileNavOpen(false)}>
                  <Button className="w-full" size="sm">Teacher Portal</Button>
                </Link>
                <Link to="/login" onClick={() => setMobileNavOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">Student Login</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO

          Left: what Questigo is + who it's for + entry-point CTAs.
          Right: the teacher workflow visual (upload → generate → approve).

          The headline answers "What is Questigo?" in one line.
          The sub answers "How?" in two sentences.
          CTAs route teacher and student to their correct entry point.
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-16">

        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
        </div>

        <div className={`${cn} relative z-10`}>
          <div className="grid items-start gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">

            {/* Copy column */}
            <div className="text-center lg:text-left">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand">
                <Sparkles size={11} />
                AI-powered content generation for educators
              </div>

              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                Turn Your Notes Into{' '}
                <span className="bg-gradient-to-r from-brand via-violet-400 to-brand-light bg-clip-text text-transparent">
                  Gamified Quests
                </span>
              </h1>

              <p className="mx-auto mb-3 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0 lg:max-w-[440px]">
                Upload a PDF. AI generates quests and coding challenges. Students learn through gameplay — no manual authoring required.
              </p>

              <p className="mx-auto mb-8 max-w-lg text-sm leading-relaxed text-muted-foreground lg:mx-0 lg:max-w-[440px]">
                Built for programming educators who want active, gamified learning without spending hours writing content.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link to="/teacher/login">
                  <Button size="lg" className="h-12 w-full gap-2 px-8 sm:w-auto">
                    <Upload size={15} />
                    Start as Teacher
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="h-12 w-full gap-2 px-8 sm:w-auto">
                    Student Login
                    <ArrowRight size={15} />
                  </Button>
                </Link>
              </div>

              <p className="mt-5 text-xs text-muted-foreground">
                MCA Major Project · Demo credentials available on the login page
              </p>
            </div>

            {/* Teacher Workflow Visual */}
            <div className="px-6 lg:pt-8">
              <WorkflowVisual />
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW QUESTIGO WORKS

          The most important section for a lecturer or evaluator.
          4-step teacher→student pipeline. Answers "how does this work?"
          in under 10 seconds.

          Arrow icons between steps on desktop signal sequential flow.
          On mobile the grid stacks 2×2, arrows are hidden.
      ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="border-t border-border/50 bg-surface py-24">
        <div className={cn}>

          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From teaching material to student gameplay
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              The entire pipeline runs inside Questigo — no external tools, no manual question writing.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item, i) => (
              <div key={item.step} className="relative rounded-2xl border border-border bg-background p-6">

                {/* connector arrow between cards — desktop only */}
                {i < workflow.length - 1 && (
                  <ArrowRight
                    size={14}
                    className="absolute -right-[11px] top-[52px] z-10 hidden -translate-y-1/2 text-border lg:block"
                  />
                )}

                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${item.ring} ${item.color}`}>
                  {item.icon}
                </div>

                <p className="mb-1 font-mono text-xs font-bold text-muted-foreground">{item.step}</p>
                <h3 className="mb-2 text-[15px] font-semibold leading-snug">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES

          bg-background alternates with bg-surface above.
          Cards use bg-surface to create depth against the page.
          Features are split between teacher-facing and student-facing.
      ══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24">
        <div className={cn}>

          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">Features</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything the platform provides
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              For teachers who create content and students who learn through it.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-brand/30"
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${f.bg} ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="mb-2 text-[15px] font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border/50 bg-surface">
        <div className={`${cn} flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row`}>
          <div className="flex items-center gap-2">
            <LogoMark className="h-6 w-6 rounded-md" />
            <span className="font-semibold text-foreground">Questigo</span>
            <span className="text-border">·</span>
            <span>MCA Major Project © 2026</span>
          </div>
          <div className="flex gap-6">
            <Link to="/teacher/login" className="transition-colors hover:text-foreground">Teacher Login</Link>
            <Link to="/login" className="transition-colors hover:text-foreground">Student Login</Link>
            <Link to="/register" className="transition-colors hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
