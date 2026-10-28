// Turn whatever JSON came out of storage or a backup file into a valid GameState.
// Every field is type-checked; anything missing or the wrong shape falls back to its
// default, so a damaged save can lose a field but can never crash the app.
import { initialState, MAX_FREEZES, type CardProgress, type GameState, type Mastery } from './game'
import { DECK_SCENES, type DeckCard, type UserDeck } from '../data/decks'
import { DEFAULT_LOOK, DESTINATIONS, HAIR_COLORS, ITEM_BY_ID, RETIRED_DECOR, type Body, type Look, type Slot } from '../data/items'
import type { SceneId } from '../art/Landscape'

type Raw = Record<string, unknown>

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d)
const num = (v: unknown, d: number, min = -Infinity, max = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)
const strArr = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [])

const MASTERY: Mastery[] = ['new', 'learning', 'familiar', 'mastered']
const BODIES: Body[] = ['girl', 'guy']
/** Ids that aren't items any more but that the migration refunds, so they must survive until then. */
const REFUNDABLE = new Set(['hair-buns', ...Object.keys(RETIRED_DECOR)])

/** Does this look like a Wayfarer save at all? (Backup restore rejects unrelated JSON files.) */
export function looksLikeSave(v: unknown): v is Raw {
  return isObj(v) && (typeof v.xp === 'number' || isObj(v.cards) || isObj(v.look) || Array.isArray(v.owned))
}

function deckCard(v: unknown): DeckCard | null {
  if (!isObj(v)) return null
  const term = str(v.term, '').trim()
  const definition = str(v.definition, '').trim()
  const id = str(v.id, '')
  return id && term && definition ? { id, term, definition } : null
}

function deck(v: unknown): UserDeck | null {
  if (!isObj(v) || typeof v.id !== 'string' || !v.id) return null
  const seen = new Set<string>()
  const cards = (Array.isArray(v.cards) ? v.cards : [])
    .map(deckCard)
    .filter((c): c is DeckCard => !!c && !seen.has(c.id) && !!seen.add(c.id))
  if (!cards.length) return null
  const scene = DECK_SCENES.includes(v.scene as SceneId) ? (v.scene as SceneId) : DECK_SCENES[0]
  return {
    id: v.id,
    name: str(v.name, '').trim().slice(0, 40) || 'My deck',
    scene,
    createdAt: num(v.createdAt, 0, 0),
    cards,
    ...(typeof v.reverse === 'boolean' ? { reverse: v.reverse } : {}),
  }
}

function progress(v: unknown): CardProgress | null {
  if (!isObj(v)) return null
  const status = MASTERY.includes(v.status as Mastery) ? (v.status as Mastery) : null
  if (!status) return null
  const p: CardProgress = {
    status,
    attempts: num(v.attempts, 0, 0),
    correct: num(v.correct, 0, 0),
    lastChoice: num(v.lastChoice, 0, 0),
    lastAt: num(v.lastAt, 0, 0),
  }
  if (typeof v.step === 'number' && Number.isFinite(v.step)) p.step = Math.max(0, Math.floor(v.step))
  if (typeof v.due === 'number' && Number.isFinite(v.due)) p.due = v.due
  return p
}

function record<T>(v: unknown, each: (x: unknown) => T | null): Record<string, T> {
  const out: Record<string, T> = {}
  if (!isObj(v)) return out
  for (const [k, x] of Object.entries(v)) {
    const ok = each(x)
    if (ok !== null) out[k] = ok
  }
  return out
}

/** An equipped item must exist, sit in the right slot and be owned; otherwise wear the default. */
function look(v: unknown, owned: string[]): Look {
  const r = isObj(v) ? v : {}
  const body = BODIES.includes(r.body as Body) ? (r.body as Body) : DEFAULT_LOOK.body
  const pick = (key: keyof Look, slot: Slot) => {
    const id = r[key]
    return typeof id === 'string' && ITEM_BY_ID[id]?.slot === slot && owned.includes(id) ? id : (DEFAULT_LOOK[key] as string)
  }
  const hairColor = HAIR_COLORS.some((c) => c.id === r.hairColor) ? (r.hairColor as Look['hairColor']) : DEFAULT_LOOK.hairColor
  return { body, outfit: pick('outfit', 'outfit'), hair: pick('hair', 'hair'), hairColor, accessory: pick('accessory', 'accessory'), card: pick('card', 'card') }
}

/** Build a valid state from raw save data. Starter items, hair that fits the body and refunds are left to the migration. */
export function sanitize(raw: Raw): GameState {
  const base = initialState()
  const decks = (Array.isArray(raw.decks) ? raw.decks : []).map(deck).filter((d): d is UserDeck => !!d)
  const deckIds = new Set(decks.map((d) => d.id))
  const owned = [...new Set([...base.owned, ...strArr(raw.owned).filter((id) => ITEM_BY_ID[id] || REFUNDABLE.has(id))])]
  const daily = isObj(raw.daily) ? raw.daily : {}
  const streak = isObj(raw.streak) ? raw.streak : {}
  const activeDeck = typeof raw.activeDeck === 'string' && deckIds.has(raw.activeDeck) ? raw.activeDeck : null
  return {
    version: 1,
    name: str(raw.name, base.name).trim().slice(0, 20) || base.name,
    title: typeof raw.title === 'string' ? raw.title : null,
    onboarded: bool(raw.onboarded, base.onboarded),
    tips: strArr(raw.tips),
    decks,
    activeDeck,
    xp: Math.floor(num(raw.xp, base.xp, 0)),
    coins: Math.floor(num(raw.coins, base.coins, 0)),
    cards: record(raw.cards, progress),
    bookmarks: strArr(raw.bookmarks),
    owned,
    look: look(raw.look, owned),
    cardShuffle: bool(raw.cardShuffle, base.cardShuffle),
    reduceMotion: bool(raw.reduceMotion, base.reduceMotion),
    sound: bool(raw.sound, base.sound),
    daily: { day: str(daily.day, ''), count: Math.floor(num(daily.count, 0, 0)) },
    streak: {
      days: Math.floor(num(streak.days, 0, 0)),
      lastDay: typeof streak.lastDay === 'string' ? streak.lastDay : null,
      freezes: Math.floor(num(streak.freezes, 0, 0, MAX_FREEZES)),
    },
    destination: DESTINATIONS.some((d) => d.id === raw.destination) ? (raw.destination as string) : base.destination,
    achievements: record(raw.achievements, (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null)),
    createdAt: num(raw.createdAt, base.createdAt, 0),
  }
}
