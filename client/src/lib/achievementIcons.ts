import {
  Footprints,
  Sparkles,
  Swords,
  Layers,
  Star,
  Gem,
  Medal,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

/** Maps an achievement's `icon` name (from the API) to a Lucide component. */
export const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Footprints,
  Sparkles,
  Swords,
  Layers,
  Star,
  Gem,
  Medal,
  Trophy,
}

export function achievementIcon(name: string): LucideIcon {
  return ACHIEVEMENT_ICONS[name] ?? Trophy
}
