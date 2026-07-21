# Landing Page Design Review

## What is wrong and why

---

### 1. NAVIGATION

**Status: ✅ Correct structure**

The navbar is fixed at h-16, uses max-w-7xl, has backdrop blur, and a responsive hamburger.
No structural changes needed. Minor: the logo link goes to "/" but doesn't close the mobile drawer — acceptable.

---

### 2. HERO SECTION

**Status: ❌ Three structural problems**

**Problem A — Layout model is wrong.**

Currently uses `flex flex-col lg:flex-row` with `items-center`.
The copy column is `flex-1` (takes remaining space after visual).
The visual column is `w-[480px]` fixed width.

At 1280px container minus 64px gap: copy gets 672px, visual gets 480px.
That is a 58/42 split. The visual feels cramped.

More critically: `items-center` vertically centers both columns against each other.
Because the copy column (eyebrow + headline + description + CTAs + trust + stats) is ~650px tall
and the visual card is ~400px tall, the visual floats 125px below the top of the copy.
This means the top of the visual card does not align with anything in the copy —
it aligns with the middle of the description paragraph.

The page reads as: big wall of text | card hanging in space.

**Fix:** Switch to CSS Grid with `lg:grid-cols-2`. True 50/50 split.
Use `items-start` so both columns start from the top.
Add `lg:pt-8` to the visual column to optically align the card
with the headline (not the eyebrow badge).

**Problem B — Headline is too small for a hero.**

`lg:text-[3.25rem]` = 52px. On a 1440px screen this reads like a section heading,
not a product hero. Linear uses 72px. Vercel uses 64px. Clerk uses 60px.

**Fix:** `lg:text-6xl xl:text-7xl` (60–72px).

**Problem C — Hero background is completely flat.**

Two blurred blobs with 10% opacity at 160px blur are invisible on most monitors.
The hero has zero visual texture. Every modern SaaS product uses a subtle
dot grid or radial gradient to give the dark background depth.

**Fix:** Add a dot-grid overlay (`background-image: radial-gradient`) at 4% opacity.

---

### 3. STATISTICS SECTION

**Status: ✅ Correct placement, minor issue**

Stats are correctly embedded inside the hero copy column, separated by `border-t`.
This is the right pattern. The `grid-cols-2 sm:grid-cols-4` is correct.

Minor: `gap-y-6` (24px vertical gap) on the 2-column mobile view creates
excessive space between the two rows of stats on mobile.

---

### 4. FEATURES SECTION

**Status: ⚠️ Structure is right, details are off**

The 6-card `sm:grid-cols-2 lg:grid-cols-3` grid is correct.
The `bg-surface` section with `bg-background` cards creates good depth.

Issues:
- `mb-16` (64px) between section header and card grid is slightly heavy.
  `mb-12` (48px) feels tighter and more purposeful.
- Feature card gap is `gap-4` (16px) — fine on desktop, but the cards
  need slightly more breathing room at `gap-5` (20px).

---

### 5. HOW IT WORKS SECTION

**Status: ⚠️ Cards are good, visual connection is missing**

Three step cards with ghost numbers work well.
The section alternates correctly: bg-background (How it works) after bg-surface (Features).

Issue: The three cards look like independent blocks with no sense of sequence.
There is no visual signal that 01 → 02 → 03 is a flow, not a list.

**Fix:** Add a horizontal connector line between cards on desktop using
a gradient line (`from-border to-transparent`) positioned through the step circles.

---

### 6. CTA SECTION

**Status: ⚠️ Visually weak**

Currently just centered text and two buttons on `bg-surface`.
No decorative element. No sense of finality or invitation.
Visually indistinguishable from the Features section header.

**Fix:** Wrap in a subtle radial gradient behind the text.
Add a third trust line ("500+ students already learning").

---

### 7. FOOTER

**Status: ✅ Correct**

Three-column flex layout with logo, copyright, links. Nothing to change.

---

## Root Cause Summary

The page has two core problems:

1. **Hero layout model**: flex + items-center makes the visual float
   in dead vertical space rather than align with the copy start.
   Grid + items-start is the correct model.

2. **Visual scale**: Headline too small (52px vs 60-72px industry standard),
   visual column too narrow (42% vs 50%), background too flat.

Everything else is refinement, not structure.

---

## ASCII Wireframe — Target Structure

```
╔════════════════════════════════════════════════════════════════════╗
║  🟣 Questigo    Features   How it works   For Teachers   [Log in] [Get Started] ║
╚════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════╗
║                 HERO  (bg-background + dot grid)                   ║
║  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ║
║                                                                    ║
║  ┌───────────────────────────┐  ┌──────────────────────────────┐  ║
║  │ ✦ Game-based education    │  │  ┌──────────────────────────┐│  ║
║  │                           │  │  │ ● ● ●  questigo.dev/...  ││  ║
║  │ Learn Programming         │  │  ├──────────────┬───────────┤│  ║
║  │ Through RPG Quests        │  │  │ Fibonacci    │  Tests    ││  ║
║  │              [lg: 60-72px]│  │  │              │ ✓ f(0)=0  ││  ║
║  │                           │  │  │ function     │ ✓ f(5)=5  ││  ║
║  │ Stop watching tutorials.  │  │  │   fib(n) {   │ ✓ f(10)=55││ ║
║  │ Complete quests, earn XP. │  │  │   ...        │           ││  ║
║  │                           │  │  │ }            │ 3/3 Passed││  ║
║  │  [Start for Free →]       │  │  │              │ [Submit]  ││  ║
║  │  [Teacher Portal]         │  │  ├──────────────┴───────────┤│  ║
║  │                           │  │  │ ✓ All passed  ⚡ +100 XP ││  ║
║  │  ✓ Free · No card         │  │  └──────────────────────────┘│  ║
║  │                           │  │     ╭──────────────╮         │  ║
║  │ ─────────────────         │  │     │ ⚡ +100 XP   │◄floating│  ║
║  │ 500+  120+  80+  15+      │  │     │ Quest done!  │         │  ║
║  └───────────────────────────┘  │     ╰──────────────╯         │  ║
║                                  │  ╭──────────────╮           │  ║
║                                  │  │ ⭐ Level 3   │◄floating  │  ║
║                                  │  │ Leveled up!  │           │  ║
║                                  └──────────────────────────────┘  ║
╚════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════╗
║               FEATURES  (bg-surface)                               ║
║                                                                    ║
║              FEATURES  [small uppercase label]                     ║
║       Everything you need to master programming                    ║
║          A complete learning environment...                        ║
║                                                                    ║
║   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           ║
║   │ 💜 Live Code │  │ 🏆 Quest     │  │ ⚡ XP &      │           ║
║   │              │  │  Learning    │  │  Levels      │           ║
║   └──────────────┘  └──────────────┘  └──────────────┘           ║
║   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           ║
║   │ ⭐ Achieve   │  │ 👥 Leaderbd  │  │ ✨ AI Gen    │           ║
║   └──────────────┘  └──────────────┘  └──────────────┘           ║
╚════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════╗
║             HOW IT WORKS  (bg-background)                          ║
║                                                                    ║
║            HOW IT WORKS  [small uppercase label]                   ║
║          From zero to developer, step by step                      ║
║                                                                    ║
║   ┌──────────────┐────────────────┌──────────────┐───────────────┐║
║   │     ①        │ ─ ─ ─ ─ ─ ─ → │     ②        │ ─ ─ ─ ─ → ③  │║
║   │  Choose a    │                │  Solve the   │  Level Up     │║
║   │  Quest       │                │  Challenge   │               │║
║   └──────────────┘                └──────────────┘               │║
╚════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════╗
║                  CTA  (bg-surface)                                 ║
║                                                                    ║
║              Start your quest today                                ║
║        Join 500+ students learning the fun way                     ║
║                                                                    ║
║           [Create Free Account →]   [Sign In]                     ║
╚════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════╗
║   🟣 Questigo    MCA Major Project © 2026    Student · Teacher    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## Implementation Checklist

- [ ] Hero: `flex + items-center` → `grid lg:grid-cols-2 + items-start`
- [ ] Hero: headline scale `lg:text-6xl xl:text-7xl`
- [ ] Hero: add dot-grid background texture
- [ ] Hero: visual column `lg:pt-8` to align with headline
- [ ] Hero: visual wrapper `px-6` so floating badges have room
- [ ] Features: `mb-16` → `mb-12`, `gap-4` → `gap-5`
- [ ] How it works: add gradient connector line between step circles
- [ ] CTA: add trust social proof line, subtle background treatment
- [ ] Verify: all sections use `CONTAINER = mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`
