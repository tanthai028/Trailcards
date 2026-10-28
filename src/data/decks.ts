// User-imported decks: Quizlet-style "term <sep> definition" text, turned into
// multiple-choice cards whose wrong answers come from the same deck.
import type { Card } from './cards'
import type { SceneId } from '../art/Landscape'

export interface DeckCard {
  /** Hash of term + definition, so re-importing the same card keeps its progress. */
  id: string
  term: string
  definition: string
}

export interface UserDeck {
  id: string
  name: string
  scene: SceneId
  createdAt: number
  cards: DeckCard[]
}

/** Multiple choice needs a correct answer plus 3 others from the same deck. */
export const MIN_DECK_CARDS = 4

export type TermSep = 'tab' | 'comma' | 'dash' | 'custom'
export type RowSep = 'newline' | 'semicolon' | 'custom'

export interface ParseOptions {
  termSep: TermSep
  rowSep: RowSep
  customTerm?: string
  customRow?: string
}

export interface ParseResult {
  cards: DeckCard[]
  /** Rows that couldn't become a card, with the 1-based row number and why. */
  problems: { row: number; text: string; reason: string }[]
  duplicates: number
}

function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return (h >>> 0).toString(36)
}

export const cardId = (term: string, definition: string) => `u-${hash(`${term.toLowerCase()}|${definition.toLowerCase()}`)}`

/** Guess the separators Quizlet/Anki exports usually use. */
export function detectOptions(text: string): ParseOptions {
  if (text.includes('\t')) return { termSep: 'tab', rowSep: 'newline' }
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length && lines.filter((l) => / - /.test(l)).length >= lines.length / 2) return { termSep: 'dash', rowSep: 'newline' }
  return { termSep: 'comma', rowSep: 'newline' }
}

/** Split one row in two at the first separator. Commas respect "quoted, fields" like CSV. */
function splitRow(row: string, o: ParseOptions): [string, string] | null {
  if (o.termSep === 'comma') {
    const cells: string[] = []
    let cur = ''
    let quoted = false
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (ch === '"') {
        if (quoted && row[i + 1] === '"') { cur += '"'; i++ } else quoted = !quoted
      } else if (ch === ',' && !quoted && cells.length === 0) {
        cells.push(cur)
        cur = ''
      } else cur += ch
    }
    cells.push(cur)
    return cells.length >= 2 ? [cells[0], cells[1]] : null
  }
  const sep = o.termSep === 'tab' ? '\t' : o.termSep === 'dash' ? ' - ' : o.customTerm || ''
  if (!sep) return null
  const at = row.indexOf(sep)
  return at < 0 ? null : [row.slice(0, at), row.slice(at + sep.length)]
}

const clean = (s: string) => s.replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim()

export function parseDeck(text: string, o: ParseOptions): ParseResult {
  const rowSep = o.rowSep === 'newline' ? /\r?\n/ : o.rowSep === 'semicolon' ? ';' : o.customRow || '\n'
  const rows = text.split(rowSep)
  const cards: DeckCard[] = []
  const problems: ParseResult['problems'] = []
  const seen = new Set<string>()
  let duplicates = 0
  rows.forEach((raw, i) => {
    if (!raw.trim()) return
    const pair = splitRow(raw, o)
    if (!pair) return problems.push({ row: i + 1, text: raw.trim(), reason: 'No separator found' })
    const [term, definition] = pair.map(clean)
    if (!term) return problems.push({ row: i + 1, text: raw.trim(), reason: 'Missing term' })
    if (!definition) return problems.push({ row: i + 1, text: raw.trim(), reason: 'Missing definition' })
    const id = cardId(term, definition)
    if (seen.has(id)) return duplicates++
    seen.add(id)
    cards.push({ id, term, definition })
  })
  return { cards, problems, duplicates }
}

// ── Deck cards -> feed cards ─────────────────────────────────────
function seeded(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

function shuffle<T>(list: T[], seed: string) {
  const out = [...list]
  const rand = seeded(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export interface DeckFeedCard extends Card {
  deck: { id: string; name: string; scene: SceneId }
}

const built = new WeakMap<UserDeck, DeckFeedCard[]>()

/** Each card asks for its definition; the 3 wrong options are other definitions in the deck. */
export function deckFeedCards(deck: UserDeck): DeckFeedCard[] {
  const hit = built.get(deck)
  if (hit) return hit
  const out = deck.cards.map((c) => {
    const others = [...new Set(deck.cards.filter((o) => o.id !== c.id && o.definition !== c.definition).map((o) => o.definition))]
    const wrong = shuffle(others, c.id).slice(0, 3)
    const choices = shuffle([c.definition, ...wrong], `${c.id}-order`)
    const prompt = c.term.trim().endsWith('?') ? 'Pick the right answer' : 'Pick the matching definition'
    return {
      id: c.id,
      topic: 'sky',
      title: c.term,
      hook: '',
      body: '',
      q: { kind: 'mcq', prompt, correct: c.definition, wrong, explain: c.definition },
      choices,
      answerIndex: choices.indexOf(c.definition),
      prompt,
      explain: `${c.term}: ${c.definition}`,
      deck: { id: deck.id, name: deck.name, scene: deck.scene },
    } satisfies DeckFeedCard
  })
  built.set(deck, out)
  return out
}

export const DECK_SCENES: SceneId[] = ['meadow', 'night', 'peaks', 'coast', 'forest', 'pasture']
