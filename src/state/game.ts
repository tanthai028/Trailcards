// Pure game rules. No React, no storage — easy to test and to move server-side later.
import { CARDS, CARD_BY_ID, TOPIC_ORDER, type Card, type TopicId } from '../data/cards'
import { deckFeedCards, type UserDeck } from '../data/decks'
import { ITEMS, ITEM_BY_ID, DEFAULT_LOOK, DEFAULT_HAIR, DESTINATIONS, VAN_TIERS, hairFits, type Body, type Look, type Slot } from '../data/items'
import { ACHIEVEMENTS, ACH_BY_ID } from '../data/achievements'
import type { SceneId } from '../art/Landscape'

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
  /** One-time hints already shown. */
  tips: string[]
  /** Imported study decks. */
  decks: UserDeck[]
  /** What Learn shows: null = the built-in field notes, otherwise a deck id. */
  activeDeck: string | null
  xp: number
  coins: number
  cards: Record<string, CardProgress>
  bookmarks: string[]
  owned: string[]
  look: Look
  /** Learn cards cycle through every background you own instead of one. */
  cardShuffle: boolean
  destination: string
  achievements: Record<string, number>
  createdAt: number
}

export const initialState = (): GameState => ({
  version: 1,
  name: 'Wanderer',
  title: null,
  onboarded: false,
  tips: [],
  decks: [],
  activeDeck: null,
  xp: 0,
  coins: 40,
  cards: {},
  bookmarks: [],
  owned: ITEMS.filter((i) => i.starter).map((i) => i.id),
  look: { ...DEFAULT_LOOK },
  cardShuffle: false,
  destination: 'lake',
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
  const card = findCard(s, cardId)!
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

// ── Card sources: built-in field notes + imported decks ─────────
export const deckCards = (s: GameState) => s.decks.flatMap(deckFeedCards)
export const allCards = (s: GameState): Card[] => [...CARDS, ...deckCards(s)]
export const findCard = (s: GameState, id: string): Card | undefined => CARD_BY_ID[id] ?? deckCards(s).find((c) => c.id === id)

/** Cards for the active source (falls back to field notes if the deck was deleted). */
export function sourceCards(s: GameState): Card[] {
  const deck = s.activeDeck ? s.decks.find((d) => d.id === s.activeDeck) : undefined
  return deck ? deckFeedCards(deck) : CARDS
}

// ── Mastery stats ───────────────────────────────────────────────
/** Per topic: built-in cards only. Overall: every card, so studying your own decks grows the plant too. */
export function masteryCounts(s: GameState, topic?: TopicId) {
  const counts: Record<Mastery, number> = { new: 0, learning: 0, familiar: 0, mastered: 0 }
  for (const c of topic ? CARDS : allCards(s)) if (!topic || c.topic === topic) counts[statusOf(s, c.id)]++
  return counts
}

export function stats(s: GameState) {
  const entries = Object.values(s.cards)
  const attempts = entries.reduce((a, c) => a + c.attempts, 0)
  const correct = entries.reduce((a, c) => a + c.correct, 0)
  return {
    explored: allCards(s).filter((c) => s.cards[c.id]).length,
    total: allCards(s).length,
    attempts,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
    ...masteryCounts(s),
  }
}

export const reviewQueue = (s: GameState, cards: Card[] = sourceCards(s)) =>
  cards.filter((c) => ['learning', 'familiar'].includes(statusOf(s, c.id)))
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
  // van upgrades unlock strictly in order
  if (item.slot === 'van' && VAN_TIERS.indexOf(itemId as (typeof VAN_TIERS)[number]) !== vanTier(s)) return { state: s, ok: false, achievements: [] }
  const bought = { ...s, coins: s.coins - item.cost, owned: [...s.owned, itemId] }
  const ach = checkAchievements(bought)
  return { state: ach.state, ok: true, achievements: ach.unlocked }
}

const SLOT_KEY: Partial<Record<Slot, keyof Look>> = { outfit: 'outfit', hair: 'hair', accessory: 'accessory', card: 'card' }

export function equipItem(s: GameState, itemId: string) {
  const item = ITEM_BY_ID[itemId]
  const key = item && SLOT_KEY[item.slot]
  if (!key || !s.owned.includes(itemId)) return { state: s, achievements: [] as string[] }
  if (item.slot === 'hair' && !hairFits(itemId, s.look.body)) return { state: s, achievements: [] as string[] }
  const ach = checkAchievements({ ...s, look: { ...s.look, [key]: itemId } })
  return { state: ach.state, achievements: ach.unlocked }
}

/** The scene behind the Learn card at a position: your chosen background, or, when mixing, your owned ones in turn so each swipe changes it. */
export function cardScene(s: GameState, position: number): SceneId {
  const own = ITEMS.filter((i) => i.slot === 'card' && s.owned.includes(i.id))
  if (s.cardShuffle && own.length > 1) return own[position % own.length].scene!
  return ITEM_BY_ID[s.look.card]?.scene ?? 'meadow'
}

/** Switch body type. Outfits and extras carry over; hair falls back to that body's free style. */
export function setBody(s: GameState, body: Body): GameState {
  if (s.look.body === body) return s
  return { ...s, look: { ...s.look, body, hair: DEFAULT_HAIR[body] } }
}

/** 0 = bare van; 1–3 = upgrades owned in sequence. */
export const vanTier = (s: GameState) => {
  let t = 0
  while (t < VAN_TIERS.length && s.owned.includes(VAN_TIERS[t])) t++
  return t
}

/** Tabs that hold something the player can buy right now (for nav dots). */
export function affordable(s: GameState) {
  const closet = ITEMS.some(
    (i) => i.slot !== 'van' && !s.owned.includes(i.id) && (!i.body || i.body === s.look.body) && i.cost <= s.coins,
  )
  const nextVan = VAN_TIERS[vanTier(s)]
  const van = !!nextVan && ITEM_BY_ID[nextVan].cost <= s.coins
  return { closet, van }
}

export const unlockedDestinations = (s: GameState) =>
  DESTINATIONS.filter((d) => levelInfo(s.xp).level >= d.level).map((d) => d.id as string)

// ── Achievements ────────────────────────────────────────────────
const RULES_ACH: Record<string, (s: GameState) => boolean> = {
  'first-card': (s) => Object.keys(s.cards).length >= 1,
  'ten-cards': (s) => Object.keys(s.cards).length >= 10,
  'mastery-10': (s) => masteryCounts(s).mastered >= 10,
  stylist: (s) => s.look.outfit !== 'outfit-trailhead',
  homemaker: (s) => vanTier(s) >= 2,
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
