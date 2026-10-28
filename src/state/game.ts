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
  /** Spaced review: how many spaced steps this card has passed, and when it's next due (ms). */
  step?: number
  due?: number
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
  /** Turn off non-essential animation, on top of the phone's own setting. */
  reduceMotion: boolean
  /** Sound effects on answers and swipes. */
  sound: boolean
  /** Answers today (local date). */
  daily: { day: string; count: number }
  /** Days in a row the daily goal was met, and spare streak freezes. */
  streak: { days: number; lastDay: string | null; freezes: number }
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
  reduceMotion: false,
  sound: true,
  daily: { day: '', count: 0 },
  streak: { days: 0, lastDay: null, freezes: 0 },
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

// ── Daily goal & day streak ─────────────────────────────────────
export const DAILY_GOAL = 10
export const FREEZE_COST = 50
export const MAX_FREEZES = 2
/** Local calendar day, e.g. "2026-10-28". */
export const dayKey = (t = Date.now()) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)

/** Answers so far today. */
export const todayCount = (s: GameState) => (s.daily?.day === dayKey() ? s.daily.count : 0)
// saves restored or hot-reloaded from before the daily goal may lack these fields
const streakOf = (s: GameState): GameState['streak'] => s.streak ?? { days: 0, lastDay: null, freezes: 0 }

/** The streak as it stands now: it's still alive if the goal was met yesterday or today, or freezes cover the gap. */
export function currentStreak(s: GameState) {
  const { days, lastDay, freezes } = streakOf(s)
  if (!lastDay || !days) return 0
  const missed = daysBetween(lastDay, dayKey()) - 1 // full days skipped since the last goal
  return missed <= 0 || missed <= freezes ? days : 0
}

/** Count one answer toward today; when it completes the goal, extend (or restart) the streak. */
function countDaily(s: GameState): { state: GameState; goalStreak: number | null } {
  const today = dayKey()
  const count = (s.daily?.day === today ? s.daily.count : 0) + 1
  let next: GameState = { ...s, daily: { day: today, count } }
  if (count !== DAILY_GOAL) return { state: next, goalStreak: null }
  const { days, lastDay, freezes } = streakOf(s)
  let streak: GameState['streak'] = { days: 1, lastDay: today, freezes }
  if (lastDay) {
    const missed = daysBetween(lastDay, today) - 1
    if (missed < 0) streak = { ...streakOf(s) } // already met today
    else if (missed === 0) streak = { days: days + 1, lastDay: today, freezes }
    else if (missed <= freezes) streak = { days: days + 1, lastDay: today, freezes: freezes - missed } // freezes cover the gap
  }
  next = { ...next, streak }
  return { state: next, goalStreak: streak.days }
}

export function buyFreeze(s: GameState): GameState | null {
  const st = streakOf(s)
  if (s.coins < FREEZE_COST || st.freezes >= MAX_FREEZES) return null
  return { ...s, coins: s.coins - FREEZE_COST, streak: { ...st, freezes: st.freezes + 1 } }
}

// ── Spaced review ───────────────────────────────────────────────
// Each right answer on a due card pushes the next review further out; a miss starts over
// and comes back in 10 minutes. A card counts as mastered from the 7-day step on.
const DAY = 86_400_000
export const INTERVALS = [1, 3, 7, 16, 35, 90].map((d) => d * DAY)
const RETRY = 10 * 60_000
const MASTERED_STEP = 2

/** Step and due time, filling in saves made before spaced review existed. */
export function schedule(p: CardProgress | undefined): { step: number; due: number } {
  if (!p) return { step: 0, due: 0 }
  if (p.due != null) return { step: p.step ?? 0, due: p.due }
  if (p.status === 'mastered') return { step: MASTERED_STEP, due: p.lastAt + INTERVALS[MASTERED_STEP] }
  if (p.status === 'familiar') return { step: 0, due: p.lastAt + INTERVALS[0] }
  return { step: 0, due: p.lastAt }
}

export const isDue = (s: GameState, id: string, now = Date.now()) => {
  const p = s.cards[id]
  return !!p && p.status !== 'new' && schedule(p).due <= now
}

/** When the next card in this source comes due, or null if none are scheduled. */
export function nextDueAt(s: GameState, cards: Card[] = sourceCards(s)): number | null {
  let best: number | null = null
  for (const c of cards) {
    const p = s.cards[c.id]
    if (!p || p.status === 'new') continue
    const { due } = schedule(p)
    if (best == null || due < best) best = due
  }
  return best
}

export interface AnswerResult {
  correct: boolean
  /** Recall cards rated "Partly": half rewards, back tomorrow, no step up. */
  partial: boolean
  xp: number
  coins: number
  from: Mastery
  to: Mastery
  levelUp: number | null
  plantUp: number | null
  /** Set when this answer completed today's goal: the streak length after it. */
  goalStreak: number | null
  achievements: string[]
}

export function answerCard(s: GameState, cardId: string, choice: number): { state: GameState; result: AnswerResult } {
  const card = findCard(s, cardId)!
  const prev = s.cards[cardId]
  const from = prev?.status ?? 'new'
  // Recall cards are answered by rating yourself: 0 missed it, 1 partly, 2 got it.
  const grade = card.q.kind === 'recall' ? Math.max(0, Math.min(2, choice)) : choice === card.answerIndex ? 2 : 0
  const correct = grade === 2
  const partial = grade === 1
  const now = Date.now()
  const sched = schedule(prev)
  // Answering a card before it's due (e.g. from Saved) is practice: a little XP, no coins,
  // and the schedule doesn't move, so reviews can't be rushed or farmed.
  const early = !!prev && from !== 'new' && from !== 'learning' && sched.due > now
  let [xp, coins, to] = correct || partial ? RULES[from].right : RULES[from].wrong
  let step = 0
  let due = now + RETRY
  if (early) {
    ;[xp, coins, to] = [correct ? 2 : 1, 0, from]
    ;({ step, due } = sched)
  } else if (partial) {
    // half the reward, back tomorrow at the same step
    ;[xp, coins] = [Math.round(xp / 2), Math.round(coins / 2)]
    step = from === 'new' || from === 'learning' ? 0 : sched.step
    due = now + INTERVALS[0]
    to = from === 'new' ? 'learning' : from === 'mastered' ? 'familiar' : from
  } else if (correct) {
    step = from === 'new' || from === 'learning' ? 0 : Math.min(sched.step + 1, INTERVALS.length - 1)
    due = now + INTERVALS[step]
    to = step >= MASTERED_STEP ? 'mastered' : 'familiar'
  } else {
    // any miss starts the schedule over: back to learning, due again in 10 minutes
    to = 'learning'
  }
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
        lastAt: now,
        step,
        due,
      },
    },
  }
  const daily = countDaily(next)
  next = daily.state
  const ach = checkAchievements(next)
  next = ach.state
  const afterLevel = levelInfo(next.xp).level
  const afterPlant = plantInfo(next).stage
  return {
    state: next,
    result: {
      correct, partial, xp, coins, from, to,
      levelUp: afterLevel > beforeLevel ? afterLevel : null,
      plantUp: afterPlant > beforePlant ? afterPlant : null,
      goalStreak: daily.goalStreak,
      achievements: ach.unlocked,
    },
  }
}

// ── Card sources: built-in field notes + imported decks ─────────
// Decks only change by replacing s.decks, so the flattened list and its id index are cached per array.
const deckIndex = new WeakMap<UserDeck[], { list: Card[]; byId: Map<string, Card> }>()
function indexDecks(decks: UserDeck[]) {
  let hit = deckIndex.get(decks)
  if (!hit) {
    const list = decks.flatMap(deckFeedCards)
    hit = { list, byId: new Map(list.map((c) => [c.id, c])) }
    deckIndex.set(decks, hit)
  }
  return hit
}
export const deckCards = (s: GameState) => indexDecks(s.decks).list
export const allCards = (s: GameState): Card[] => [...CARDS, ...deckCards(s)]
export const findCard = (s: GameState, id: string): Card | undefined => CARD_BY_ID[id] ?? indexDecks(s.decks).byId.get(id)

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

/** Cards due for review now: misses first, then the most overdue. */
export const reviewQueue = (s: GameState, cards: Card[] = sourceCards(s)) => {
  const now = Date.now()
  return cards
    .filter((c) => isDue(s, c.id, now))
    .sort((a, b) => {
      const la = statusOf(s, a.id) === 'learning' ? 0 : 1
      const lb = statusOf(s, b.id) === 'learning' ? 0 : 1
      return la - lb || schedule(s.cards[a.id]).due - schedule(s.cards[b.id]).due
    })
}

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

/** Items that count toward a collection: "Bare" (no extra) is not an item, and hairstyles count only for your body type. */
export const collectionItems = (s: GameState, slot: Slot) =>
  ITEMS.filter((i) => i.slot === slot && i.id !== 'acc-none' && (!i.body || i.body === s.look.body))

/** Tabs that hold something the player can buy right now (for nav dots). Quiet until a few cards are answered, so new players start with Learn. */
export function affordable(s: GameState) {
  if (Object.keys(s.cards).length < 3) return { closet: false, van: false }
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
