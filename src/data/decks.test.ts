import { describe, expect, it } from 'vitest'
import { buildPrompt, deckFeedCards, looksLikeAiFormat, minCards, parseAiDeck, type UserDeck } from './decks'
import { parseStoredSave } from '../state/storage'
import { initialState } from '../state/game'

const reply = `Sure! Here are your cards:

\`\`\`json
{"deck":"System design","cards":[
 {"type":"mcq","q":"What does a load balancer do?","choices":["Spreads traffic across servers","Stores sessions","Encrypts disks","Compiles code"],"answer":0,"explain":"It distributes requests so no server is overloaded."},
 {"type":"recall","q":"Explain the CAP theorem.","answer":"A distributed system can't guarantee consistency, availability and partition tolerance all at once.","explain":"Shows you understand trade-offs."},
]}
\`\`\`
Good luck!`

describe('AI card format', () => {
  it('finds the JSON inside a chatty reply with code fences and a trailing comma', () => {
    const r = parseAiDeck(reply)
    expect(r.error).toBeUndefined()
    expect(r.name).toBe('System design')
    expect(r.cards).toHaveLength(2)
    expect(r.cards[0]).toMatchObject({ kind: 'mcq', term: 'What does a load balancer do?', definition: 'Spreads traffic across servers', wrong: ['Stores sessions', 'Encrypts disks', 'Compiles code'] })
    expect(r.cards[1]).toMatchObject({ kind: 'recall', definition: expect.stringContaining('consistency') })
  })

  it('accepts a bare array, smart quotes, letter and text answers', () => {
    const r = parseAiDeck(`[{\u201Cq\u201D:\u201CBest O for lookup in a hash map?\u201D,\u201Cchoices\u201D:[\u201CO(1)\u201D,\u201CO(n)\u201D,\u201CO(log n)\u201D],\u201Canswer\u201D:\u201CA\u201D},
      {"q":"Stack order?","choices":["FIFO","LIFO"],"answer":"LIFO"}]`)
    expect(r.cards.map((c) => c.definition)).toEqual(['O(1)', 'LIFO'])
  })

  it('reports bad cards one by one and keeps the good ones', () => {
    const r = parseAiDeck(JSON.stringify({ cards: [
      { type: 'mcq', q: 'ok?', choices: ['a', 'b', 'c', 'd'], answer: 1 },
      { type: 'mcq', q: '', choices: ['a', 'b'], answer: 0 },
      { type: 'mcq', q: 'no match', choices: ['a', 'b'], answer: 5 },
      { type: 'mcq', q: 'one choice', choices: ['a', 'a'], answer: 0 },
      { type: 'recall', q: 'no answer' },
      { type: 'mcq', q: 'ok?', choices: ['a', 'b', 'c', 'd'], answer: 1 },
    ] }))
    expect(r.cards).toHaveLength(1)
    expect(r.duplicates).toBe(1)
    expect(r.problems.map((p) => p.reason)).toEqual(['Missing question', "Answer doesn't match a choice", 'Needs at least 2 different choices', 'Missing answer'])
  })

  it('explains when there is no JSON at all', () => {
    expect(parseAiDeck('I cannot help with that.').error).toMatch(/Couldn't find/)
    expect(parseAiDeck('{"deck":"x"}').error).toMatch(/no "cards"/)
  })

  it('tells the AI format apart from term/definition lines', () => {
    expect(looksLikeAiFormat(reply)).toBe(true)
    expect(looksLikeAiFormat('[{"q":1}]')).toBe(true)
    expect(looksLikeAiFormat('perro\tdog\ngato\tcat')).toBe(false)
  })

  it('builds a prompt for a topic or a job description, avoiding existing questions', () => {
    const p = buildPrompt({ topic: 'system design', count: 20, recall: 0.25, avoid: ['What is sharding?'] })
    expect(p).toContain('this topic: system design')
    expect(p).toContain('15 multiple-choice cards and 5 open "recall" cards')
    expect(p).toContain('- What is sharding?')
    const job = buildPrompt({ topic: 'Senior Backend Engineer\nWe use Go, Postgres and Kafka...', count: 10, recall: 0.5 })
    expect(job).toContain('Job description:')
  })

  it('turns AI cards into quiz cards with their own choices, and recall cards with none', () => {
    const r = parseAiDeck(reply)
    const deck: UserDeck = { id: 'sd', name: 'System design', scene: 'meadow', createdAt: 0, cards: r.cards }
    const [mcq, recall] = deckFeedCards(deck)
    expect(mcq.choices).toHaveLength(4)
    expect(mcq.choices[mcq.answerIndex]).toBe('Spreads traffic across servers')
    expect(mcq.explain).toMatch(/distributes requests/)
    expect(recall.choices).toEqual([])
    expect(recall.q).toMatchObject({ kind: 'recall' })
    expect(minCards(r.cards)).toBe(1)
  })

  it('survives a save round trip, keeping kind, wrong answers and explanation', () => {
    const r = parseAiDeck(reply)
    const s = { ...initialState(), decks: [{ id: 'sd', name: 'SD', scene: 'meadow', createdAt: 0, cards: r.cards }] }
    const back = parseStoredSave(JSON.stringify(s))!
    expect(back.decks[0].cards).toEqual(r.cards)
  })
})
