import { api } from '@/lib/api'
import type { AuthUser } from '@/types'
import type { Difficulty } from '@/lib/sequenceData'

export interface CompletedQuest {
  id: string
  title: string
  node: string
  subject: string
  difficulty: Difficulty
  xpReward: number
  isBoss: boolean
  cleanBuild: boolean
  completedAt: string | null
}

export interface Achievement {
  key: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt: string | null
}

export interface ProfileStats {
  completedCount: number
  cleanBuilds: number
  bossesDefeated: number
  achievementsUnlocked: number
}

export interface Profile {
  user: AuthUser
  completedQuests: CompletedQuest[]
  achievements: Achievement[]
  stats: ProfileStats
}

export async function fetchProfile(): Promise<Profile> {
  const { data } = await api.get('/student/profile')
  return data.data as Profile
}
