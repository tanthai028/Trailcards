// Unlockable looks with a little life in them: picture backgrounds, card themes and title
// effects (frames live in avatars.ts). All unlock by studying: a level or a trophy.

/** null = free from the start. */
export type Unlock = { level: number } | { trophy: string } | null

export interface Cosmetic {
  id: string
  name: string
  unlock: Unlock
}

/** A little life around your picture, icon or photo alike: in front of it, or glowing behind. */
export const ICON_FX: Cosmetic[] = [
  { id: 'none', name: 'None', unlock: null },
  { id: 'sparkle', name: 'Sparkle', unlock: { trophy: 'first-card' } },
  { id: 'glow', name: 'Glow', unlock: { level: 2 } },
  { id: 'bubbles', name: 'Bubbles', unlock: { trophy: 'ten-cards' } },
  { id: 'orbit', name: 'Orbit', unlock: { level: 4 } },
  { id: 'snow', name: 'Snow', unlock: { trophy: 'mastery-10' } },
  { id: 'flame', name: 'Flame', unlock: { trophy: 'streak-7' } },
  { id: 'rainbow', name: 'Rainbow', unlock: { level: 12 } },
]

/** The scene at the top of every Learn card: by topic (each deck's own), or one place for all. */
export const CARD_SCENES: Cosmetic[] = [
  { id: 'auto', name: 'By topic', unlock: null },
  { id: 'campground', name: 'Campground', unlock: null },
  { id: 'room', name: 'Cozy room', unlock: { trophy: 'first-card' } },
  { id: 'beach', name: 'Beach', unlock: { trophy: 'ten-cards' } },
  { id: 'city', name: 'City night', unlock: { level: 2 } },
  { id: 'cabin', name: 'Snowy cabin', unlock: { level: 3 } },
]

/** An effect over the scene at the top of every Learn card. */
export const CARD_FX: Cosmetic[] = [
  { id: 'none', name: 'Plain', unlock: null },
  // early ones, so there's something new to try within the first sessions
  { id: 'sparkles', name: 'Sparkles', unlock: { trophy: 'first-card' } },
  { id: 'fireflies', name: 'Fireflies', unlock: { level: 2 } },
  { id: 'clouds', name: 'Clouds', unlock: { trophy: 'ten-cards' } },
  { id: 'leaves', name: 'Leaves', unlock: { level: 3 } },
  { id: 'rain', name: 'Rain', unlock: { trophy: 'streak-3' } },
  { id: 'snow', name: 'Snowfall', unlock: { trophy: 'mastery-10' } },
  { id: 'petals', name: 'Petals', unlock: { trophy: 'goal-days-30' } },
  { id: 'aurora', name: 'Aurora', unlock: { level: 8 } },
  { id: 'starfall', name: 'Starfall', unlock: { trophy: 'streak-30' } },
]

/** How your title shows on your profile and the leaderboard. */
export const TITLE_FX: Cosmetic[] = [
  { id: 'none', name: 'Plain', unlock: null },
  { id: 'glow', name: 'Glow', unlock: { level: 3 } },
  { id: 'frost', name: 'Frost', unlock: { trophy: 'answers-100' } },
  { id: 'neon', name: 'Neon', unlock: { level: 7 } },
  { id: 'rainbow', name: 'Rainbow', unlock: { trophy: 'streak-30' } },
]

export const known = (list: Cosmetic[], id: unknown) => list.some((c) => c.id === id)
