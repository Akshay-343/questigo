import { api } from '@/lib/api'
import type { Difficulty, SequenceMission } from '@/lib/sequenceData'

export type QuestStatus = 'PENDING_TEACHER_REVIEW' | 'PUBLISHED' | 'REJECTED'

export type QuestKind = 'SEQUENCE' | 'CODING' | 'ARENA'

export interface TeacherQuest {
  id: string // slug
  title: string
  nodeLabel: string
  topic: string | null
  difficulty: Difficulty
  xpReward: number
  status: QuestStatus
  kind: QuestKind
  subject: string
  subjectSlug: string
  tileCount: number
  sourceName: string | null
  createdAt: string
}

export interface GenerateResponse {
  subject: string
  subjectSlug: string
  aiProvider: string
  created: TeacherQuest[]
}

export interface TeacherSubjectSummary {
  id: string // slug
  title: string
  description: string | null
  questCount: number
}

export interface TeacherOverview {
  stats: { subjects: number; quests: number; students: number }
  subjects: TeacherSubjectSummary[]
}

export interface TeacherStudent {
  rank: number
  id: string
  name: string
  email: string
  xp: number
  level: number
  completedCount: number
  achievementsCount: number
  joinedAt: string
}

/** A coding-challenge test case with its input/expected — teacher authoring view only. */
export interface CodingTestCaseFull {
  id: string
  description: string
  input: string
  expectedOutput: string
}

/** Full coding-challenge payload returned on the teacher preview/edit path. */
export interface CodingChallengeAuthor {
  prompt: string
  starterCode: string
  language: string
  testCases: CodingTestCaseFull[]
}

/** One arena question with its answer key — teacher authoring view only. */
export interface ArenaQuestionAuthor {
  id: string
  prompt: string
  options: string[]
  answer: number
  explain: string
}

/** Full arena-round payload returned on the teacher preview path. */
export interface ArenaRoundAuthor {
  intro: string
  secondsPerQuestion: number
  questions: ArenaQuestionAuthor[]
}

/** Quest preview payload — same shape gameplay uses (superset of SequenceMission). */
export interface TeacherQuestDetail extends SequenceMission {
  kind: QuestKind
  subjectSlug: string
  /** Populated only for CODING quests (inputs/expected included). */
  codingFull?: CodingChallengeAuthor | null
  /** Populated only for ARENA quests (questions + answer key + explanations). */
  arenaFull?: ArenaRoundAuthor | null
}

export interface AuthorTileInput {
  label: string
  sub?: string | null
}

/** Shared body for hand-authoring / structurally replacing a Sequence quest. */
export interface QuestStructureInput {
  title: string
  nodeLabel: string
  topic?: string | null
  difficulty: Difficulty
  xpReward?: number
  briefSystemName?: string
  briefStory?: string
  prompt?: string
  tiles: AuthorTileInput[]
  distractors: AuthorTileInput[]
  /** Per consecutive pair; index i explains tiles[i] -> tiles[i+1]. */
  explanations: string[]
}

export interface QuestCreateInput extends QuestStructureInput {
  subject: string
}

export interface CodingTestCaseInput {
  description: string
  input: string
  expectedOutput: string
}

/** Shared body for hand-authoring / replacing a CODING quest. */
export interface CodingQuestInput {
  title: string
  nodeLabel: string
  topic?: string | null
  difficulty: Difficulty
  xpReward?: number
  briefSystemName?: string
  briefStory?: string
  prompt: string
  starterCode: string
  language: 'python'
  testCases: CodingTestCaseInput[]
}

export interface CodingQuestCreateInput extends CodingQuestInput {
  subject: string
}

export async function generateQuests(params: {
  subject: string
  count: number
  kind?: QuestKind
  file?: File | null
  text?: string
}): Promise<GenerateResponse> {
  const form = new FormData()
  form.append('subject', params.subject)
  form.append('count', String(params.count))
  form.append('kind', params.kind ?? 'SEQUENCE')
  if (params.file) form.append('file', params.file)
  if (params.text) form.append('text', params.text)
  const { data } = await api.post('/teacher/generate', form)
  return data.data as GenerateResponse
}

export async function fetchTeacherOverview(): Promise<TeacherOverview> {
  const { data } = await api.get('/teacher/overview')
  return data.data as TeacherOverview
}

export async function fetchTeacherStudents(): Promise<TeacherStudent[]> {
  const { data } = await api.get('/teacher/students')
  return data.data as TeacherStudent[]
}

export async function fetchTeacherQuests(status?: QuestStatus): Promise<TeacherQuest[]> {
  const { data } = await api.get('/teacher/quests', { params: status ? { status } : undefined })
  return data.data as TeacherQuest[]
}

export async function fetchTeacherQuest(slug: string): Promise<TeacherQuestDetail> {
  const { data } = await api.get(`/teacher/quests/${slug}`)
  return data.data as TeacherQuestDetail
}

export async function createQuest(input: QuestCreateInput): Promise<TeacherQuestDetail> {
  const { data } = await api.post('/teacher/quests', input)
  return data.data as TeacherQuestDetail
}

export async function updateQuestStructure(
  slug: string,
  input: QuestStructureInput
): Promise<TeacherQuestDetail> {
  const { data } = await api.put(`/teacher/quests/${slug}/structure`, input)
  return data.data as TeacherQuestDetail
}

export async function createCodingQuest(input: CodingQuestCreateInput): Promise<TeacherQuestDetail> {
  const { data } = await api.post('/teacher/coding-quests', input)
  return data.data as TeacherQuestDetail
}

export async function updateCodingQuest(
  slug: string,
  input: CodingQuestInput
): Promise<TeacherQuestDetail> {
  const { data } = await api.put(`/teacher/coding-quests/${slug}`, input)
  return data.data as TeacherQuestDetail
}

export async function approveQuest(slug: string): Promise<TeacherQuest> {
  const { data } = await api.post(`/teacher/quests/${slug}/approve`)
  return data.data as TeacherQuest
}

export async function rejectQuest(slug: string): Promise<TeacherQuest> {
  const { data } = await api.post(`/teacher/quests/${slug}/reject`)
  return data.data as TeacherQuest
}
