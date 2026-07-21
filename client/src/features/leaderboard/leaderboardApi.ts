import { api } from '@/lib/api'

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  xp: number
  level: number
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get('/leaderboard')
  return data.data as LeaderboardEntry[]
}
