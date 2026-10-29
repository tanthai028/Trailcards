// User-imported decks. Two ways in: Quizlet-style "term <sep> definition" text (wrong answers
// are borrowed from the deck's other definitions), or the stricter AI card format, where each
// card brings its own wrong answers and explanation, or is an open "recall" question.
import type { Card } from './cards'
import type { SceneId } from '../art/Landscape'

export interface DeckCard {
  /** Hash of term + definition, so re-importing the same card keeps its progress. */
  id: string
  /** The question (or term). */
  term: string
  /** The right answer: the definition, the correct choice, or a recall card's model answer. */
  definition: string
  /** pair (default): wrong answers come from other cards. mcq: brings its own. recall: self-rated. */
  kind?: 'pair' | 'mcq' | 'recall'
  /** mcq only: the wrong choices. */
  wrong?: string[]
  /** Why the answer is right, shown after answering. */
  explain?: string
}

export interface UserDeck {
  id: string
  name: string
  scene: SceneId
  createdAt: number
  cards: DeckCard[]
  /** Practice definition → term instead of term → definition. */
  reverse?: boolean
  /** What the AI prompt was about (a topic or job description), reused for "More cards". */
  topic?: string
  /** Set while this deck is shared with the group: its id on the server. */
  sharedId?: string
  /** 'explore' when it was added from a deck a friend shared. */
  origin?: 'explore'
}

/** Term/definition cards borrow wrong answers from the deck, so they need a correct answer plus 3 others. */
export const MIN_DECK_CARDS = 4
/** AI-format cards carry their own answers, so one is enough. */
export const minCards = (cards: DeckCard[]) => (cards.some((c) => (c.kind ?? 'pair') === 'pair') ? MIN_DECK_CARDS : 1)

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

// ── AI card format ──────────────────────────────────────────────
// The app writes a prompt; the user runs it in ChatGPT or Claude and pastes the reply back.
// Replies are messy (code fences, chatter, smart quotes, trailing commas), so parsing is
// forgiving about the wrapper and strict about each card.

export interface PromptOptions {
  /** A topic ("cell biology"), or pasted study notes or a job description. */
  topic: string
  count: number
  /** Share of open recall questions, 0 to 1; the rest are multiple choice. */
  recall: number
  /** Questions already in the deck, so a follow-up prompt doesn't repeat them. */
  avoid?: string[]
}

export function buildPrompt({ topic, count, recall, avoid = [] }: PromptOptions): string {
  const nRecall = Math.round(count * recall)
  const nMcq = count - nRecall
  // Long or multi-line text is pasted material: a job description (prep for its interview) or study notes.
  const pasted = topic.length > 200 || /\n/.test(topic.trim())
  const isJob = pasted && /\b(job|role|position|candidate|hiring|responsibilit|requirement|qualification|engineer|developer|manager|we use|you will|years of experience)/i.test(topic)
  const subject = isJob
    ? `the job description below. Cover the skills, tools and situations it asks about, the way an interviewer for this role would.\n\nJob description:\n"""\n${topic.trim()}\n"""`
    : pasted
      ? `the study notes below. Cover the key facts, terms and ideas in them.\n\nNotes:\n"""\n${topic.trim()}\n"""`
      : `this topic: ${topic.trim()}`
  const avoidText = avoid.length
    ? `\n\nThe deck already has these questions. Don't repeat them or ask the same thing in other words:\n${avoid.slice(0, 120).map((q) => `- ${q}`).join('\n')}`
    : ''
  return `Write ${count} ${isJob ? 'interview-prep' : 'study'} flashcards about ${subject}

Make ${nMcq} multiple-choice cards and ${nRecall} open "recall" cards. Mix easy, medium and hard. Each card tests one idea. ${isJob ? 'Questions should be ones a real interviewer might ask.' : 'Questions should check real understanding, not just the wording.'}

- Multiple choice: exactly 4 choices, one clearly correct; the 3 wrong ones should be plausible mistakes, not jokes. Keep choices short.
- Recall: an open question to answer out loud. "answer" is a model answer of 2-4 sentences or short key points.
- "explain" says in 1-2 sentences why the answer is right.${avoidText}

Reply with ONLY this JSON, no other text:
{"deck":"short deck name","cards":[
 {"type":"mcq","q":"question","choices":["A","B","C","D"],"answer":0,"explain":"why"},
 {"type":"recall","q":"question","answer":"model answer","explain":"why it matters"}
]}
"answer" for multiple choice is the index (0-3) of the correct choice.`
}

/** Does pasted text look like the AI JSON format rather than term/definition lines? */
export const looksLikeAiFormat = (text: string) => {
  const t = text.trim()
  return /^\`\`\`/.test(t) || /^[{[]/.test(t) || /"cards"\s*:/.test(t)
}

/** Pull the JSON out of a chat reply and parse it, repairing the usual damage. */
function extractJson(text: string): unknown {
  let t = text.replace(/\`\`\`(?:json)?/gi, '').trim()
  const start = t.search(/[{[]/)
  const end = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'))
  if (start < 0 || end < start) return undefined
  t = t.slice(start, end + 1)
  const attempts = [
    t,
    t.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/,\s*([}\]])/g, '$1'),
  ]
  for (const a of attempts) {
    try {
      return JSON.parse(a)
    } catch {
      /* try the next repair */
    }
  }
  return undefined
}

const text = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : typeof v === 'number' ? String(v) : '')

export interface AiParseResult extends ParseResult {
  /** Deck name the reply suggested, if any. */
  name: string
  /** Set when the reply had no readable JSON at all. */
  error?: string
}

export function parseAiDeck(input: string): AiParseResult {
  const data = extractJson(input)
  const list = Array.isArray(data) ? data : data && typeof data === 'object' ? (data as { cards?: unknown }).cards : undefined
  if (!Array.isArray(list)) {
    return { name: '', cards: [], problems: [], duplicates: 0, error: data === undefined ? "Couldn't find the cards in that reply. Paste the whole answer, including the { } brackets." : 'The reply has no "cards" list.' }
  }
  const name = data && typeof data === 'object' && !Array.isArray(data) ? text((data as { deck?: unknown; name?: unknown }).deck ?? (data as { name?: unknown }).name).slice(0, 40) : ''
  const cards: DeckCard[] = []
  const problems: ParseResult['problems'] = []
  const seen = new Set<string>()
  let duplicates = 0
  list.forEach((raw, i) => {
    const row = i + 1
    const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const q = text(c.q ?? c.question ?? c.prompt)
    const explain = text(c.explain ?? c.explanation ?? c.why) || undefined
    const type = text(c.type ?? c.kind).toLowerCase()
    const choices = Array.isArray(c.choices ?? c.options) ? ((c.choices ?? c.options) as unknown[]).map(text).filter(Boolean) : []
    const fail = (reason: string) => problems.push({ row, text: q || JSON.stringify(raw ?? '').slice(0, 40), reason })
    if (!q) return fail('Missing question')
    let card: DeckCard
    if (type === 'recall' || (!choices.length && type !== 'mcq')) {
      const answer = text(c.answer ?? c.a)
      if (!answer) return fail('Missing answer')
      card = { id: cardId(q, answer), term: q, definition: answer, kind: 'recall', ...(explain ? { explain } : {}) }
    } else {
      const distinct = [...new Set(choices)]
      if (distinct.length < 2) return fail('Needs at least 2 different choices')
      if (distinct.length > 6) return fail('Too many choices (6 at most)')
      // answer may be an index, a letter (A-D) or the choice's text
      const a = c.answer ?? c.correct
      let idx = -1
      if (typeof a === 'number') idx = Number.isInteger(a) ? a : -1
      else if (typeof a === 'string') {
        const t = a.trim()
        if (/^[A-Fa-f]$/.test(t)) idx = t.toUpperCase().charCodeAt(0) - 65
        else if (/^\d+$/.test(t)) idx = Number(t)
        else idx = choices.findIndex((ch) => ch.toLowerCase() === text(t).toLowerCase())
      }
      if (idx < 0 || idx >= choices.length) return fail('Answer doesn\'t match a choice')
      const right = choices[idx]
      card = { id: cardId(q, right), term: q, definition: right, kind: 'mcq', wrong: distinct.filter((ch) => ch !== right), ...(explain ? { explain } : {}) }
    }
    if (seen.has(card.id)) return duplicates++
    seen.add(card.id)
    cards.push(card)
  })
  return { name, cards, problems, duplicates }
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

/** The same shuffle every time for the same seed. */
export function shuffle<T>(list: T[], seed: string) {
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
  // reverse decks show the definition and ask for the term
  const ask = (c: DeckCard) => (deck.reverse ? c.definition : c.term)
  const ans = (c: DeckCard) => (deck.reverse ? c.term : c.definition)
  const pool = [...new Set(deck.cards.filter((c) => (c.kind ?? 'pair') === 'pair').map(ans))]
  const out = deck.cards.map((c): DeckFeedCard => {
    const meta = { id: c.id, topic: 'sky' as const, hook: '', body: '', deck: { id: deck.id, name: deck.name, scene: deck.scene } }
    if (c.kind === 'recall') {
      const prompt = 'Think of your answer, then reveal it'
      return {
        ...meta, title: c.term, choices: [], answerIndex: -1, prompt,
        q: { kind: 'recall', prompt, answer: c.definition, explain: c.explain ?? '' },
        explain: c.explain ?? '',
      }
    }
    if (c.kind === 'mcq' && c.wrong?.length) {
      const choices = shuffle([c.definition, ...c.wrong], `${c.id}-order`)
      const prompt = 'Pick the right answer'
      return {
        ...meta, title: c.term, choices, answerIndex: choices.indexOf(c.definition), prompt,
        q: { kind: 'mcq', prompt, correct: c.definition, wrong: c.wrong, explain: c.explain ?? c.definition },
        explain: c.explain ?? c.definition,
      }
    }
    const rand = seeded(`${c.id}-wrong`)
    const want = Math.min(3, pool.length - 1)
    const picked = new Set<string>()
    for (let tries = 0; picked.size < want && tries < 60; tries++) {
      const d = pool[Math.floor(rand() * pool.length)]
      if (d !== ans(c)) picked.add(d)
    }
    const wrong = [...picked]
    const choices = shuffle([ans(c), ...wrong], `${c.id}-order`)
    const prompt = deck.reverse ? 'Pick the matching term' : c.term.trim().endsWith('?') ? 'Pick the right answer' : 'Pick the matching definition'
    return {
      id: c.id,
      topic: 'sky',
      title: ask(c),
      hook: '',
      body: '',
      q: { kind: 'mcq', prompt, correct: ans(c), wrong, explain: ans(c) },
      choices,
      answerIndex: choices.indexOf(ans(c)),
      prompt,
      explain: `${c.term}: ${c.definition}`,
      deck: { id: deck.id, name: deck.name, scene: deck.scene },
    } satisfies DeckFeedCard
  })
  built.set(deck, out)
  return out
}

export const DECK_SCENES: SceneId[] = ['meadow', 'night', 'peaks', 'coast', 'forest', 'pasture']
