"""XP -> Level derivation. Mirrors the frontend table in client/src/lib/levels.ts
and CLAUDE.md section 6 so client and server agree on level math."""

LEVEL_THRESHOLDS = [0, 100, 300, 600, 1200, 2100, 3000, 4200, 5800, 8000]


def level_for_xp(xp: int) -> int:
    """Return the level (1-based) a given XP total maps to."""
    level = 1
    for i, floor in enumerate(LEVEL_THRESHOLDS):
        if xp >= floor:
            level = i + 1
    return level
