// Unlockable looks with a little life in them: picture backgrounds, card themes and title
// effects (frames live in avatars.ts). All unlock by studying: a level or a trophy.

/** null = free from the start. */
export type Unlock = { level: number } | { trophy: string } | null

export interface Cosmetic {
  id: string
  name: string
  unlock: Unlock
}

/** Behind your icon (a photo covers it). */
export const PIC_BGS: Cosmetic[] = [
  { id: 'none', name: 'Icon colour', unlock: null },
  // early ones, so there's something new to try within the first sessions
  { id: 'sunset', name: 'Sunset', unlock: { trophy: 'first-card' } },
  { id: 'meadow', name: 'Meadow', unlock: { level: 2 } },
  { id: 'berry', name: 'Berry', unlock: { trophy: 'ten-cards' } },
  { id: 'sky', name: 'Sky', unlock: { level: 3 } },
  { id: 'aurora', name: 'Aurora', unlock: { level: 4 } },
  { id: 'galaxy', name: 'Galaxy', unlock: { level: 6 } },
  { id: 'ember', name: 'Ember', unlock: { trophy: 'streak-7' } },
  { id: 'ocean', name: 'Ocean', unlock: { trophy: 'mastery-50' } },
  { id: 'holo', name: 'Holo', unlock: { level: 12 } },
]

/** An effect over the scene at the top of every Learn card. */
export const CARD_FX: Cosmetic[] = [
  { id: 'none', name: 'Plain', unlock: null },
  { id: 'fireflies', name: 'Fireflies', unlock: { level: 2 } },
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
