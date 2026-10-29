// Pure game rules. No React, no storage — easy to test and to move server-side later.
import { CARDS, CARD_BY_ID, type Card } from '../data/cards'
import { deckFeedCards, shuffle, type UserDeck } from '../data/decks'
import { DEFAULT_AVATAR, FRAME_BY_ID, isColorFrame, type Frame } from '../data/avatars'
import { CARD_FX, type Unlock } from '../data/cosmetics'
import { ACHIEVEMENTS } from '../data/achievements'

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
  /** What Learn shows: null = the built-in nature field notes, otherwise a deck id. */
  activeDeck: string | null
  /** Has the player picked something to study yet? Until then Learn asks. */
  deckChosen: boolean
  xp: number
  cards: Record<string, CardProgress>
  bookmarks: string[]
  /** How each deck is studied (filter and order), keyed by deck id or 'nature' for Field notes. */
  studyPrefs: Record<string, StudyPrefs>
  /** The icon shown as your picture, unless you uploaded a photo. */
  avatar: string
  /** The frame around your picture: 'none', a custom ring or an unlocked special one. */
  frame: Frame
  /** Unlockable looks: the background behind your icon, the effect on Learn cards, and your title's effect. */
  cosmetics: Cosmetics
  /** Your uploaded picture: a small square image as a data URL, or null. */
  photo: string | null
  /** Turn off non-essential animation, on top of the phone's own setting. */
  reduceMotion: boolean
  /** Sound effects on answers and swipes. */
  sound: boolean
  /** Answers today (local date). */
  daily: { day: string; count: number }
  /** Days in a row the daily goal was met. */
  streak: { days: number; lastDay: string | null }
  /** Days the daily goal was met in all, in a row or not. */
  goalDays: number
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
  deckChosen: false,
  xp: 0,
  cards: {},
  bookmarks: [],
  studyPrefs: {},
  avatar: DEFAULT_AVATAR,
  frame: 'none',
  cosmetics: { bg: 'none', card: 'none', title: 'none' },
  photo: null,
  reduceMotion: false,
  sound: true,
  daily: { day: '', count: 0 },
  streak: { days: 0, lastDay: null },
  goalDays: 0,
  achievements: {},
  createdAt: Date.now(),
})

export interface Cosmetics {
  bg: string
  card: string
  title: string
  /** Learn card themes to shuffle between, one picked each time the app opens (fewer than 2 = off). */
  cardShuffle?: string[]
}

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
// status before answering → [xp, nextStatus] for correct / wrong
const RULES: Record<Mastery, { right: [number, Mastery]; wrong: [number, Mastery] }> = {
  new: { right: [20, 'familiar'], wrong: [5, 'learning'] },
  learning: { right: [12, 'familiar'], wrong: [3, 'learning'] },
  familiar: { right: [15, 'mastered'], wrong: [3, 'learning'] },
  mastered: { right: [3, 'mastered'], wrong: [2, 'familiar'] },
}

export const statusOf = (s: GameState, id: string): Mastery => s.cards[id]?.status ?? 'new'

// ── Daily goal & day streak ─────────────────────────────────────
export const DAILY_GOAL = 10
/** Local calendar day, e.g. "2026-10-28". */
export const dayKey = (t = Date.now()) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)

/** Answers so far today. */
export const todayCount = (s: GameState) => (s.daily?.day === dayKey() ? s.daily.count : 0)
// saves restored or hot-reloaded from before the daily goal may lack these fields
const streakOf = (s: GameState): GameState['streak'] => s.streak ?? { days: 0, lastDay: null }

/** The streak as it stands now: it's still alive if the goal was met yesterday or today. */
export function currentStreak(s: GameState) {
  const { days, lastDay } = streakOf(s)
  if (!lastDay || !days) return 0
  return daysBetween(lastDay, dayKey()) <= 1 ? days : 0
}

/** Count one answer toward today; when it completes the goal, extend (or restart) the streak. */
function countDaily(s: GameState): { state: GameState; goalStreak: number | null } {
  const today = dayKey()
  const count = (s.daily?.day === today ? s.daily.count : 0) + 1
  let next: GameState = { ...s, daily: { day: today, count } }
  if (count !== DAILY_GOAL) return { state: next, goalStreak: null }
  const { days, lastDay } = streakOf(s)
  let streak: GameState['streak'] = { days: 1, lastDay: today }
  if (lastDay) {
    const gap = daysBetween(lastDay, today)
    if (gap < 1) streak = { ...streakOf(s) } // already met today
    else if (gap === 1) streak = { days: days + 1, lastDay: today }
  }
  // a new day's goal (not a second one today) counts toward Habit Builder
  const firstToday = !lastDay || daysBetween(lastDay, today) >= 1
  next = { ...next, streak, goalDays: (s.goalDays ?? 0) + (firstToday ? 1 : 0) }
  return { state: next, goalStreak: streak.days }
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
  from: Mastery
  to: Mastery
  levelUp: number | null
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
  // Answering a card before it's due (practice in the endless feed, Saved, or a quick retry
  // after a miss) earns a little XP, and the schedule doesn't move, so the feed
  // can't be farmed and reviews can't be rushed.
  const early = !!prev && from !== 'new' && sched.due > now
  let [xp, to] = correct || partial ? RULES[from].right : RULES[from].wrong
  let step = 0
  let due = now + RETRY
  if (early) {
    ;[xp, to] = [correct ? 2 : 1, from]
    ;({ step, due } = sched)
  } else if (partial) {
    // half the reward, back tomorrow at the same step
    xp = Math.round(xp / 2)
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

  let next: GameState = {
    ...s,
    xp: s.xp + xp,
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
  return {
    state: next,
    result: {
      correct, partial, xp, from, to,
      levelUp: afterLevel > beforeLevel ? afterLevel : null,
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
// ── What the feed shows ─────────────────────────────────────────
/** 'choice' = cards you answer by tapping (multiple choice, true/false, term matching). */
export type KindFilter = 'all' | 'choice' | 'recall'
export interface StudyPrefs {
  kind: KindFilter
  /** New cards in the deck's own order, or shuffled (a fresh order each day). */
  order: 'deck' | 'shuffle'
}
export const DEFAULT_PREFS: StudyPrefs = { kind: 'all', order: 'deck' }
export const prefsKey = (s: GameState) => s.activeDeck ?? 'nature'
export const studyPrefs = (s: GameState): StudyPrefs => ({ ...DEFAULT_PREFS, ...s.studyPrefs?.[prefsKey(s)] })
export const isRecall = (c: Card) => c.q.kind === 'recall'

/** The current deck as the feed uses it: filtered by card type and put in the chosen order. */
export function feedCards(s: GameState): Card[] {
  const p = studyPrefs(s)
  let cards = sourceCards(s)
  if (p.kind !== 'all') {
    const kept = cards.filter((c) => isRecall(c) === (p.kind === 'recall'))
    // a filter that matches nothing (the deck changed since) shows everything instead
    if (kept.length) cards = kept
  }
  return p.order === 'shuffle' ? shuffle(cards, `${prefsKey(s)}-${dayKey()}`) : cards
}

export function sourceCards(s: GameState): Card[] {
  const deck = s.activeDeck ? s.decks.find((d) => d.id === s.activeDeck) : undefined
  return deck ? deckFeedCards(deck) : CARDS
}

// ── Mastery stats ───────────────────────────────────────────────
/** Every card: Field notes and your own decks. */
export function masteryCounts(s: GameState) {
  const counts: Record<Mastery, number> = { new: 0, learning: 0, familiar: 0, mastered: 0 }
  for (const c of allCards(s)) counts[statusOf(s, c.id)]++
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

/**
 * The Study feed: new cards with due reviews mixed in (one after every 3 new), then any
 * remaining reviews. When it runs out, the feed keeps going with practiceBatch.
 */
export function studyQueue(s: GameState, cards: Card[] = sourceCards(s)): string[] {
  const fresh = cards.filter((c) => statusOf(s, c.id) === 'new').map((c) => c.id)
  const due = reviewQueue(s, cards).map((c) => c.id)
  const out: string[] = []
  let d = 0
  fresh.forEach((id, i) => {
    out.push(id)
    if ((i + 1) % 3 === 0 && d < due.length) out.push(due[d++])
  })
  while (d < due.length) out.push(due[d++])
  return out
}

/**
 * Practice once nothing is new or due: misses first, then cards you scrolled past, then the rest,
 * least recently seen first. Recent cards are skipped; if that leaves nothing, only the very
 * last one is (a one-card deck simply repeats).
 */
export function practiceBatch(s: GameState, avoid: Set<string>, n = 10, cards: Card[] = sourceCards(s), last?: string): string[] {
  const rank: Record<Mastery, number> = { learning: 0, new: 1, familiar: 2, mastered: 3 }
  const by = (a: Card, b: Card) => rank[statusOf(s, a.id)] - rank[statusOf(s, b.id)] || (s.cards[a.id]?.lastAt ?? 0) - (s.cards[b.id]?.lastAt ?? 0)
  let pool = cards.filter((c) => !avoid.has(c.id))
  if (!pool.length) pool = cards.filter((c) => c.id !== last)
  if (!pool.length) pool = cards
  return [...pool].sort(by).slice(0, n).map((c) => c.id)
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

// ── Achievements ────────────────────────────────────────────────
const hourOfAnswer = (s: GameState, from: number, to: number) => Object.values(s.cards).some((c) => { const h = new Date(c.lastAt).getHours(); return h >= from && h < to })
/** Cards you missed at some point and have since got right (they've left "learning"). */
export const comebacks = (s: GameState) => Object.values(s.cards).filter((c) => c.attempts > c.correct && (c.status === 'familiar' || c.status === 'mastered')).length

const RULES_ACH: Record<string, (s: GameState) => boolean> = {
  'first-card': (s) => Object.keys(s.cards).length >= 1,
  'ten-cards': (s) => Object.keys(s.cards).length >= 10,
  'answers-100': (s) => totalAnswers(s) >= 100,
  'answers-1000': (s) => totalAnswers(s) >= 1000,
  'streak-3': (s) => (s.streak?.days ?? 0) >= 3,
  'streak-7': (s) => (s.streak?.days ?? 0) >= 7,
  'streak-30': (s) => (s.streak?.days ?? 0) >= 30,
  'streak-100': (s) => (s.streak?.days ?? 0) >= 100,
  'goal-days-30': (s) => (s.goalDays ?? 0) >= 30,
  'mastery-10': (s) => masteryCounts(s).mastered >= 10,
  'mastery-50': (s) => masteryCounts(s).mastered >= 50,
  'mastery-200': (s) => masteryCounts(s).mastered >= 200,
  'comeback-10': (s) => comebacks(s) >= 10,
  'first-deck': (s) => s.decks.length >= 1,
  'decks-5': (s) => s.decks.length >= 5,
  'share-deck': (s) => s.decks.some((d) => d.sharedId),
  explorer: (s) => s.decks.some((d) => d.origin === 'explore'),
  'night-owl': (s) => hourOfAnswer(s, 0, 4),
  'early-bird': (s) => hourOfAnswer(s, 5, 7),
}

export function checkAchievements(s: GameState) {
  const unlocked = ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && RULES_ACH[a.id]?.(s)).map((a) => a.id)
  if (!unlocked.length) return { state: s, unlocked }
  const now = Date.now()
  return {
    unlocked,
    state: {
      ...s,
      achievements: { ...s.achievements, ...Object.fromEntries(unlocked.map((id) => [id, now])) },
    },
  }
}

/** Custom rings are always yours; special frames unlock with a level or a trophy. */
export function frameUnlocked(s: GameState, frame: Frame) {
  if (frame === 'none' || isColorFrame(frame)) return true
  const f = FRAME_BY_ID[frame]
  return !!f && isUnlocked(s, f.unlock)
}

/** Shuffle on: a different Learn card theme from your picks (the unlocked ones), for this visit. */
export function shuffleCard(s: GameState): GameState {
  const picks = (s.cosmetics.cardShuffle ?? []).filter((id) => isUnlocked(s, CARD_FX.find((c) => c.id === id)?.unlock ?? null))
  const others = picks.filter((id) => id !== s.cosmetics.card)
  if (picks.length < 2 || !others.length) return s
  return { ...s, cosmetics: { ...s.cosmetics, card: others[Math.floor(Math.random() * others.length)] } }
}

/** A level reached, a trophy earned, or free (null). */
export function isUnlocked(s: GameState, u: Unlock) {
  if (!u) return true
  return 'level' in u ? levelInfo(s.xp).level >= u.level : !!s.achievements[u.trophy]
}

/**
 * Take back the last answer: the card's progress, XP, today's count, the streak and any
 * trophy it earned go back to how they were. Anything else changed since is kept.
 */
export function undoAnswer(now: GameState, before: GameState): GameState {
  return { ...now, xp: before.xp, cards: before.cards, daily: before.daily, streak: before.streak, achievements: before.achievements }
}

// ── Profile summaries ───────────────────────────────────────────
/** Every answer ever given, right or wrong. */
export const totalAnswers = (s: GameState) => Object.values(s.cards).reduce((n, c) => n + c.attempts, 0)

export interface DeckProgress {
  /** null = Field notes. */
  id: string | null
  name: string
  counts: Record<Mastery, number>
  due: number
}

/** Mastery for each deck you have: Field notes (once you've studied it, or if it's all you have) and your own decks. */
export function deckProgress(s: GameState): DeckProgress[] {
  const now = Date.now()
  const of = (id: string | null, name: string, cards: Card[]): DeckProgress => {
    const counts: Record<Mastery, number> = { new: 0, learning: 0, familiar: 0, mastered: 0 }
    let due = 0
    for (const c of cards) {
      counts[statusOf(s, c.id)]++
      if (isDue(s, c.id, now)) due++
    }
    return { id, name, counts, due }
  }
  const out = s.decks.map((d) => of(d.id, d.name, deckFeedCards(d)))
  const nature = of(null, 'Field notes', CARDS)
  const studied = nature.counts.new < CARDS.length
  return studied || !out.length ? [nature, ...out] : out
}

/** How far along a trophy is, for a progress bar: [now, goal]. Null when it has no count. */
export function achievementProgress(s: GameState, id: string): [number, number] | null {
  const of = (now: number, goal: number): [number, number] => [Math.min(now, goal), goal]
  const answered = Object.keys(s.cards).length
  const streak = currentStreak(s)
  switch (id) {
    case 'first-card': return of(answered, 1)
    case 'ten-cards': return of(answered, 10)
    case 'answers-100': return of(totalAnswers(s), 100)
    case 'answers-1000': return of(totalAnswers(s), 1000)
    case 'streak-3': return of(streak, 3)
    case 'streak-7': return of(streak, 7)
    case 'streak-30': return of(streak, 30)
    case 'streak-100': return of(streak, 100)
    case 'goal-days-30': return of(s.goalDays ?? 0, 30)
    case 'mastery-10': return of(masteryCounts(s).mastered, 10)
    case 'mastery-50': return of(masteryCounts(s).mastered, 50)
    case 'mastery-200': return of(masteryCounts(s).mastered, 200)
    case 'comeback-10': return of(comebacks(s), 10)
    case 'first-deck': return of(s.decks.length, 1)
    case 'decks-5': return of(s.decks.length, 5)
    default: return null
  }
}
