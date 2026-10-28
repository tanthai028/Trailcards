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

/** 'line' = term and definition on their own lines, as Knowt and plain notes copy out. */
export type TermSep = 'tab' | 'comma' | 'dash' | 'line' | 'custom'
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
  const most = (re: RegExp) => lines.length > 0 && lines.filter((l) => re.test(l)).length >= lines.length / 2
  if (most(/ - /)) return { termSep: 'dash', rowSep: 'newline' }
  if (most(/,/)) return { termSep: 'comma', rowSep: 'newline' }
  return { termSep: 'line', rowSep: 'newline' }
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

/**
 * Term and definition on separate lines. With blank lines between cards, the first
 * line of each block is the term and the rest is the definition; otherwise lines pair up.
 */
function lineRows(text: string): { row: number; pair: [string, string] | null; raw: string }[] {
  const lines = text.split(/\r?\n/)
  const blocks: { row: number; lines: string[] }[] = []
  let cur: { row: number; lines: string[] } | null = null
  lines.forEach((l, i) => {
    if (!l.trim()) { cur = null; return }
    if (!cur) blocks.push((cur = { row: i + 1, lines: [] }))
    cur.lines.push(l)
  })
  if (blocks.length > 1 && blocks.every((b) => b.lines.length >= 2)) {
    return blocks.map((b) => ({ row: b.row, pair: [b.lines[0], b.lines.slice(1).join(' ')], raw: b.lines.join(' ') }))
  }
  const filled = lines.map((l, i) => ({ l, row: i + 1 })).filter((x) => x.l.trim())
  const out: { row: number; pair: [string, string] | null; raw: string }[] = []
  for (let i = 0; i < filled.length; i += 2) {
    const a = filled[i]
    const b = filled[i + 1]
    out.push({ row: a.row, pair: b ? [a.l, b.l] : null, raw: a.l })
  }
  return out
}

export function parseDeck(text: string, o: ParseOptions): ParseResult {
  if (o.termSep === 'line') return collect(lineRows(text))
  const rowSep = o.rowSep === 'newline' ? /\r?\n/ : o.rowSep === 'semicolon' ? ';' : o.customRow || '\n'
  const rows = text.split(rowSep)
  return collect(rows.map((raw, i) => ({ row: i + 1, raw, pair: raw.trim() ? splitRow(raw, o) : null })).filter((r) => r.raw.trim()))
}

function collect(rows: { row: number; raw: string; pair: [string, string] | null }[]): ParseResult {
  const cards: DeckCard[] = []
  const problems: ParseResult['problems'] = []
  const seen = new Set<string>()
  let duplicates = 0
  rows.forEach(({ row, raw, pair }) => {
    if (!pair) return problems.push({ row, text: raw.trim(), reason: 'No definition found' })
    const [term, definition] = pair.map(clean)
    if (!term) return problems.push({ row, text: raw.trim(), reason: 'Missing term' })
    if (!definition) return problems.push({ row, text: raw.trim(), reason: 'Missing definition' })
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
  // Draw wrong answers at random from the deck's distinct definitions. Scanning the whole
  // deck for every card took about 1s at 3,000 cards; this stays instant at any size.
  const defs = [...new Set(deck.cards.map((c) => c.definition))]
  const out = deck.cards.map((c) => {
    const rand = seeded(`${c.id}-wrong`)
    const want = Math.min(3, defs.length - 1)
    const picked = new Set<string>()
    for (let tries = 0; picked.size < want && tries < 60; tries++) {
      const d = defs[Math.floor(rand() * defs.length)]
      if (d !== c.definition) picked.add(d)
    }
    const wrong = [...picked]
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
