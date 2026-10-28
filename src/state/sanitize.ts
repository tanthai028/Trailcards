// Turn whatever JSON came out of storage or a backup file into a valid GameState.
// Every field is type-checked; anything missing or the wrong shape falls back to its
// default, so a damaged save can lose a field but can never crash the app.
import { ACH_BY_ID } from '../data/achievements'
import { initialState, type CardProgress, type GameState, type Mastery } from './game'
import { DECK_SCENES, type DeckCard, type UserDeck } from '../data/decks'
import { AVATAR_BY_ID, DEFAULT_AVATAR, isKnownFrame, type Frame } from '../data/avatars'
import { CARD_FX, PIC_BGS, TITLE_FX, known } from '../data/cosmetics'
import type { SceneId } from '../art/Landscape'

type Raw = Record<string, unknown>

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d)
const num = (v: unknown, d: number, min = -Infinity, max = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)
const strArr = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [])

const MASTERY: Mastery[] = ['new', 'learning', 'familiar', 'mastered']

/** Does this look like a Wayfarer save at all? (Backup restore rejects unrelated JSON files.) */
export function looksLikeSave(v: unknown): v is Raw {
  return isObj(v) && (typeof v.xp === 'number' || isObj(v.cards) || isObj(v.look) || Array.isArray(v.owned))
}

function deckCard(v: unknown): DeckCard | null {
  if (!isObj(v)) return null
  const term = str(v.term, '').trim()
  const definition = str(v.definition, '').trim()
  const id = str(v.id, '')
  if (!id || !term || !definition) return null
  const card: DeckCard = { id, term, definition }
  const explain = str(v.explain, '').trim()
  if (explain) card.explain = explain
  if (v.kind === 'recall') card.kind = 'recall'
  else if (v.kind === 'mcq') {
    // an mcq card without usable wrong choices falls back to a plain pair
    const wrong = strArr(v.wrong).map((w) => w.trim()).filter((w) => w && w !== definition)
    if (wrong.length) Object.assign(card, { kind: 'mcq', wrong })
  }
  return card
}

/** A deck from a save, a backup or someone's shared deck: bad cards are dropped, and no cards means no deck. */
export function cleanDeck(v: unknown): UserDeck | null {
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
    ...(typeof v.topic === 'string' && v.topic.trim() ? { topic: v.topic.slice(0, 4000) } : {}),
    ...(typeof v.sharedId === 'string' && v.sharedId ? { sharedId: v.sharedId } : {}),
    ...(v.origin === 'explore' ? { origin: 'explore' as const } : {}),
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

/** A known icon, or the default. */
export const cleanAvatar = (v: unknown) => (typeof v === 'string' && AVATAR_BY_ID[v] ? v : DEFAULT_AVATAR)
/** Known looks only; anything else is plain. */
export function cleanCosmetics(v: unknown): GameState['cosmetics'] {
  const r = isObj(v) ? v : {}
  const pick = (list: typeof PIC_BGS, id: unknown) => (known(list, id) ? (id as string) : 'none')
  return { bg: pick(PIC_BGS, r.bg), card: pick(CARD_FX, r.card), title: pick(TITLE_FX, r.title) }
}

/** A known frame, or none. */
export const cleanFrame = (v: unknown): Frame => (isKnownFrame(v) ? v : 'none')

/** An uploaded picture: only a small image data URL is kept. */
const photo = (v: unknown) => (typeof v === 'string' && /^data:image\/(webp|png|jpeg);base64,/.test(v) && v.length < 200_000 ? v : null)

/** Build a valid state from raw save data. Fields the app no longer has (coins, items, the van…) are dropped. */
export function sanitize(raw: Raw): GameState {
  const base = initialState()
  const decks = (Array.isArray(raw.decks) ? raw.decks : []).map(cleanDeck).filter((d): d is UserDeck => !!d)
  const deckIds = new Set(decks.map((d) => d.id))
  const daily = isObj(raw.daily) ? raw.daily : {}
  const streak = isObj(raw.streak) ? raw.streak : {}
  const activeDeck = typeof raw.activeDeck === 'string' && deckIds.has(raw.activeDeck) ? raw.activeDeck : null
  // trophies for features that are gone (outfits, the van) are dropped, and so is their title
  const achievements = record(raw.achievements, (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null))
  for (const id of Object.keys(achievements)) if (!ACH_BY_ID[id]) delete achievements[id]
  const titles = new Set(Object.keys(achievements).map((id) => ACH_BY_ID[id].title))
  return {
    version: 1,
    name: str(raw.name, base.name).trim().slice(0, 20) || base.name,
    title: typeof raw.title === 'string' && titles.has(raw.title) ? raw.title : null,
    onboarded: bool(raw.onboarded, base.onboarded),
    tips: strArr(raw.tips),
    decks,
    activeDeck,
    // saves from before this existed were already studying (the nature deck), so they count as chosen
    deckChosen: bool(raw.deckChosen, raw.onboarded === true || isObj(raw.cards) && Object.keys(raw.cards).length > 0),
    xp: Math.floor(num(raw.xp, base.xp, 0)),
    cards: record(raw.cards, progress),
    bookmarks: strArr(raw.bookmarks),
    // saves from the character days had a `look` instead: they start with the default icon
    studyPrefs: record(raw.studyPrefs, (x) => {
      if (!isObj(x)) return null
      return { kind: x.kind === 'choice' || x.kind === 'recall' ? x.kind : 'all', order: x.order === 'shuffle' ? 'shuffle' : 'deck' } as const
    }),
    avatar: cleanAvatar(raw.avatar),
    frame: cleanFrame(raw.frame),
    cosmetics: cleanCosmetics(raw.cosmetics),
    photo: photo(raw.photo),
    reduceMotion: bool(raw.reduceMotion, base.reduceMotion),
    sound: bool(raw.sound, base.sound),
    haptics: bool(raw.haptics, base.haptics),
    daily: { day: str(daily.day, ''), count: Math.floor(num(daily.count, 0, 0)) },
    streak: {
      days: Math.floor(num(streak.days, 0, 0)),
      lastDay: typeof streak.lastDay === 'string' ? streak.lastDay : null,
    },
    // saves from before this counted at least their current streak
    goalDays: Math.floor(num(raw.goalDays, num(streak.days, 0, 0), 0)),
    achievements,
    createdAt: num(raw.createdAt, base.createdAt, 0),
  }
}
