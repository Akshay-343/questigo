import { api } from '@/lib/api'
import type { AuthUser } from '@/types'
import type { Difficulty, SequenceMission } from '@/lib/sequenceData'

export type QuestKind = 'SEQUENCE' | 'CODING' | 'ARENA'

export interface QuestSummary {
  id: string
  order: number
  node: string
  title: string
  topic: string
  difficulty: Difficulty
  xpReward: number
  isBoss: boolean
  kind: QuestKind
  completed: boolean
  cleanBuild: boolean
}

export interface CodingTestCase {
  id: string
  description: string
}

export interface CodingChallenge {
  prompt: string
  starterCode: string
  language: string
  testCases: CodingTestCase[]
}

export interface TestResult {
  id: string
  description: string
  passed: boolean
  actual: string | null
  expected: string | null
}

export interface RunResult {
  results: TestResult[]
  allPassed: boolean
  error: string | null
}

export interface ArenaQuestion {
  id: string
  prompt: string
  options: string[]
}

export interface ArenaRound {
  intro: string
  secondsPerQuestion: number
  questions: ArenaQuestion[]
}

/** Result of grading a single arena question — the key for that question only. */
export interface ArenaAnswerResult {
  correct: boolean
  answer: number
  explain: string
}

export interface SubjectSummary {
  id: string
  title: string
  subtitle: string
  description: string
  questCount: number
  completedCount: number
}

export interface SubjectWithQuests {
  id: string
  title: string
  subtitle: string
  description: string
  quests: QuestSummary[]
}

/** Full quest payload — a superset of SequenceMission, so gameplay components consume it directly. */
export interface QuestDetail extends SequenceMission {
  kind: QuestKind
  coding: CodingChallenge | null
  arena: ArenaRound | null
  subjectSlug: string
  nextQuestSlug: string | null
  completed: boolean
  cleanBuild: boolean
}

export interface UnlockedAchievement {
  key: string
  title: string
  description: string
  icon: string
}

export interface CompleteQuestResult {
  user: AuthUser
  xpAwarded: number
  alreadyCompleted: boolean
  leveledUp: boolean
  newLevel: number
  unlockedAchievements: UnlockedAchievement[]
}

export async function fetchSubjects(): Promise<SubjectSummary[]> {
  const { data } = await api.get('/subjects')
  return data.data as SubjectSummary[]
}

export async function fetchSubject(slug: string): Promise<SubjectWithQuests> {
  const { data } = await api.get(`/subjects/${slug}`)
  return data.data as SubjectWithQuests
}

export async function fetchQuest(slug: string): Promise<QuestDetail> {
  const { data } = await api.get(`/quests/${slug}`)
  return data.data as QuestDetail
}

export async function completeQuest(
  slug: string,
  clean: boolean,
  code?: string
): Promise<CompleteQuestResult> {
  const { data } = await api.post(`/student/quests/${slug}/complete`, { clean, code })
  return data.data as CompleteQuestResult
}

export async function runChallenge(slug: string, code: string): Promise<RunResult> {
  const { data } = await api.post(`/student/challenges/${slug}/run`, { code })
  return data.data as RunResult
}

export async function answerArena(
  slug: string,
  questionId: string,
  choice: number
): Promise<ArenaAnswerResult> {
  const { data } = await api.post(`/student/arena/${slug}/answer`, { questionId, choice })
  return data.data as ArenaAnswerResult
}
