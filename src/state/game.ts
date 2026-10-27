// Pure game rules. No React, no storage — easy to test and to move server-side later.
import { CARDS, CARD_BY_ID, TOPIC_ORDER, type TopicId } from '../data/cards'
import { ITEMS, ITEM_BY_ID, DEFAULT_LOOK, DESTINATIONS, type Look, type Slot } from '../data/items'
import { ACHIEVEMENTS, ACH_BY_ID } from '../data/achievements'

export type Mastery = 'new' | 'learning' | 'familiar' | 'mastered'

export interface CardProgress {
  status: Mastery
  attempts: number
  correct: number
  lastChoice: number
  lastAt: number
}

export interface GameState {
  version: 1
  name: string
  title: string | null
  onboarded: boolean
  xp: number
  coins: number
  cards: Record<string, CardProgress>
  bookmarks: string[]
  owned: string[]
  look: Look
  destination: string
  hiddenDecor: string[]
  achievements: Record<string, number>
  createdAt: number
}

export const initialState = (): GameState => ({
  version: 1,
  name: 'Wanderer',
  title: null,
  onboarded: false,
  xp: 0,
  coins: 40,
  cards: {},
  bookmarks: [],
  owned: ITEMS.filter((i) => i.starter).map((i) => i.id),
  look: { ...DEFAULT_LOOK },
  destination: 'lake',
  hiddenDecor: [],
  achievements: {},
  createdAt: Date.now(),
})

// ── Levels ──────────────────────────────────────────────────────
/** Total XP needed to reach a level: 0, 100, 300, 600, 1000… */
export const xpForLevel = (level: number) => 50 * level * (level - 1)

export function levelInfo(xp: number) {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  const floor = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, into: xp - floor, span: next - floor, pct: (xp - floor) / (next - floor) }
}

// ── Rewards (deterministic) ─────────────────────────────────────
// status before answering → [xp, coins, nextStatus] for correct / wrong
const RULES: Record<Mastery, { right: [number, number, Mastery]; wrong: [number, number, Mastery] }> = {
  new: { right: [20, 10, 'familiar'], wrong: [5, 0, 'learning'] },
  learning: { right: [12, 6, 'familiar'], wrong: [3, 0, 'learning'] },
  familiar: { right: [15, 8, 'mastered'], wrong: [3, 0, 'learning'] },
  mastered: { right: [3, 0, 'mastered'], wrong: [2, 0, 'familiar'] },
}

export const statusOf = (s: GameState, id: string): Mastery => s.cards[id]?.status ?? 'new'

export interface AnswerResult {
  correct: boolean
  xp: number
  coins: number
  from: Mastery
  to: Mastery
  levelUp: number | null
  plantUp: number | null
  achievements: string[]
}

export function answerCard(s: GameState, cardId: string, choice: number): { state: GameState; result: AnswerResult } {
  const card = CARD_BY_ID[cardId]
  const prev = s.cards[cardId]
  const from = prev?.status ?? 'new'
  const correct = choice === card.answerIndex
  const [xp, coins, to] = correct ? RULES[from].right : RULES[from].wrong
  const beforeLevel = levelInfo(s.xp).level
  const beforePlant = plantInfo(s).stage

  let next: GameState = {
    ...s,
    xp: s.xp + xp,
    coins: s.coins + coins,
    cards: {
      ...s.cards,
      [cardId]: {
        status: to,
        attempts: (prev?.attempts ?? 0) + 1,
        correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
        lastChoice: choice,
        lastAt: Date.now(),
      },
    },
  }
  const ach = checkAchievements(next)
  next = ach.state
  const afterLevel = levelInfo(next.xp).level
  const afterPlant = plantInfo(next).stage
  return {
    state: next,
    result: {
      correct, xp, coins, from, to,
      levelUp: afterLevel > beforeLevel ? afterLevel : null,
      plantUp: afterPlant > beforePlant ? afterPlant : null,
      achievements: ach.unlocked,
    },
  }
}

// ── Mastery stats ───────────────────────────────────────────────
export function masteryCounts(s: GameState, topic?: TopicId) {
  const counts: Record<Mastery, number> = { new: 0, learning: 0, familiar: 0, mastered: 0 }
  for (const c of CARDS) if (!topic || c.topic === topic) counts[statusOf(s, c.id)]++
  return counts
}

export function stats(s: GameState) {
  const entries = Object.values(s.cards)
  const attempts = entries.reduce((a, c) => a + c.attempts, 0)
  const correct = entries.reduce((a, c) => a + c.correct, 0)
  return {
    explored: entries.length,
    attempts,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
    ...masteryCounts(s),
  }
}

export const reviewQueue = (s: GameState) =>
  CARDS.filter((c) => ['learning', 'familiar'].includes(statusOf(s, c.id)))
    // shaky concepts first
    .sort((a, b) => (statusOf(s, a.id) === 'learning' ? -1 : 0) - (statusOf(s, b.id) === 'learning' ? -1 : 0))

// ── Plant ───────────────────────────────────────────────────────
export const PLANT_STAGES = [
  { name: 'Seed', at: 0 },
  { name: 'Sprout', at: 4 },
  { name: 'Sapling', at: 12 },
  { name: 'Leafy', at: 28 },
  { name: 'Blooming', at: 50 },
]

/** Growth points: 1 per concept answered right, +2 more once it's mastered through review. */
export function plantInfo(s: GameState) {
  const m = masteryCounts(s)
  const points = m.familiar + m.mastered * 3
  let stage = 0
  while (stage < PLANT_STAGES.length - 1 && points >= PLANT_STAGES[stage + 1].at) stage++
  const nextAt = PLANT_STAGES[stage + 1]?.at ?? null
  const base = PLANT_STAGES[stage].at
  return { stage, points, nextAt, pct: nextAt ? (points - base) / (nextAt - base) : 1, name: PLANT_STAGES[stage].name }
}

// ── Shop & closet ───────────────────────────────────────────────
export function buyItem(s: GameState, itemId: string): { state: GameState; ok: boolean; achievements: string[] } {
  const item = ITEM_BY_ID[itemId]
  if (!item || s.owned.includes(itemId) || s.coins < item.cost) return { state: s, ok: false, achievements: [] }
  const bought = { ...s, coins: s.coins - item.cost, owned: [...s.owned, itemId] }
  const ach = checkAchievements(bought)
  return { state: ach.state, ok: true, achievements: ach.unlocked }
}

const SLOT_KEY: Partial<Record<Slot, keyof Look>> = { outfit: 'outfit', hair: 'hair', accessory: 'accessory' }

export function equipItem(s: GameState, itemId: string) {
  const item = ITEM_BY_ID[itemId]
  const key = item && SLOT_KEY[item.slot]
  if (!key || !s.owned.includes(itemId)) return { state: s, achievements: [] as string[] }
  const ach = checkAchievements({ ...s, look: { ...s.look, [key]: itemId } })
  return { state: ach.state, achievements: ach.unlocked }
}

export const unlockedDestinations = (s: GameState) =>
  DESTINATIONS.filter((d) => levelInfo(s.xp).level >= d.level).map((d) => d.id as string)

// ── Achievements ────────────────────────────────────────────────
const RULES_ACH: Record<string, (s: GameState) => boolean> = {
  'first-card': (s) => Object.keys(s.cards).length >= 1,
  'ten-cards': (s) => Object.keys(s.cards).length >= 10,
  'mastery-10': (s) => masteryCounts(s).mastered >= 10,
  stylist: (s) => s.look.outfit !== 'outfit-trailhead',
  homemaker: (s) => s.owned.filter((id) => ITEM_BY_ID[id]?.slot === 'decor').length >= 3,
  ...Object.fromEntries(
    TOPIC_ORDER.map((t) => [
      `topic-${t}`,
      (s: GameState) => {
        const m = masteryCounts(s, t)
        return m.new === 0 && m.learning === 0
      },
    ]),
  ),
}

export function checkAchievements(s: GameState) {
  const unlocked = ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && RULES_ACH[a.id]?.(s)).map((a) => a.id)
  if (!unlocked.length) return { state: s, unlocked }
  const now = Date.now()
  return {
    unlocked,
    state: {
      ...s,
      coins: s.coins + unlocked.reduce((sum, id) => sum + ACH_BY_ID[id].coins, 0),
      achievements: { ...s.achievements, ...Object.fromEntries(unlocked.map((id) => [id, now])) },
    },
  }
}
