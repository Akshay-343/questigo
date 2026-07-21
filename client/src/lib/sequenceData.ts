// Sequence Builder content types. The actual content is now served by the
// backend (subjects/quests tables) — see features/play/playApi.ts.
// v1 = linear sequences only. A mission's canonical order is `tiles` in order.

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface SequenceTile {
  id: string
  label: string
  sub?: string // short supporting note shown on the tile
}

export interface SequenceMission {
  id: string
  order: number
  /** Short node label on the skill tree */
  node: string
  /** Full mission title */
  title: string
  topic: string
  difficulty: Difficulty
  xpReward: number
  isBoss?: boolean
  brief: {
    systemName: string
    story: string
  }
  /** Game-flavored instruction — never "arrange/order these" */
  prompt: string
  /** Correct tiles in canonical order */
  tiles: SequenceTile[]
  /** Optional non-required tiles that should never enter the pipeline */
  distractors?: SequenceTile[]
  /** Per-link teaching feedback, keyed "fromId->toId" */
  linkExplanations: Record<string, string>
}
