// Fixed XP→Level threshold table (see CLAUDE.md §6). Level is derived, never stored independently.
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1200, 2100, 3000, 4200, 5800, 8000]

export interface LevelInfo {
  level: number
  /** XP required to have reached the current level */
  currentLevelFloor: number
  /** XP required to reach the next level (null at max level) */
  nextLevelFloor: number | null
  /** XP earned within the current level band */
  xpIntoLevel: number
  /** XP span of the current level band (null at max level) */
  xpForLevel: number | null
  /** 0–100 progress toward the next level */
  progressPct: number
  isMax: boolean
}

export function getLevelInfo(xp: number): LevelInfo {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
  }

  const currentLevelFloor = LEVEL_THRESHOLDS[level - 1]
  const isMax = level >= LEVEL_THRESHOLDS.length
  const nextLevelFloor = isMax ? null : LEVEL_THRESHOLDS[level]

  const xpIntoLevel = xp - currentLevelFloor
  const xpForLevel = nextLevelFloor === null ? null : nextLevelFloor - currentLevelFloor
  const progressPct = xpForLevel === null ? 100 : Math.min(100, (xpIntoLevel / xpForLevel) * 100)

  return { level, currentLevelFloor, nextLevelFloor, xpIntoLevel, xpForLevel, progressPct, isMax }
}
