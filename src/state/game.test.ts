import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  answerCard, currentStreak, DAILY_GOAL, findCard, initialState, INTERVALS, isDue, levelInfo,
  reviewQueue, sourceCards, todayCount, studyQueue, practiceBatch, type GameState,
} from './game'
import { CARDS } from '../data/cards'
import { deckFeedCards, parseDeck, type UserDeck } from '../data/decks'

const DAY = 86_400_000
const card = CARDS[0]
const right = card.answerIndex
const wrong = (card.answerIndex + 1) % card.choices.length

afterEach(() => vi.useRealTimers())
const at = (t: number) => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(t)
}

describe('answering and spaced review', () => {
  it('a new card answered right becomes familiar and is due in a day', () => {
    at(new Date(2026, 9, 1, 12).getTime())
    const { state, result } = answerCard(initialState(), card.id, right)
    expect(result).toMatchObject({ correct: true, from: 'new', to: 'familiar', xp: 20 })
    expect(state.cards[card.id].due).toBe(Date.now() + INTERVALS[0])
    expect(isDue(state, card.id)).toBe(false)
  })

  it('climbs 1, 3, 7 days and is mastered from the 7-day step', () => {
    let t = new Date(2026, 9, 1, 12).getTime()
    at(t)
    let s = answerCard(initialState(), card.id, right).state
    t += DAY + 1; at(t)
    expect(reviewQueue(s).map((c) => c.id)).toContain(card.id)
    s = answerCard(s, card.id, right).state
    expect(s.cards[card.id]).toMatchObject({ status: 'familiar', step: 1 })
    t += 3 * DAY + 1; at(t)
    s = answerCard(s, card.id, right).state
    expect(s.cards[card.id]).toMatchObject({ status: 'mastered', step: 2 })
    expect(s.cards[card.id].due).toBe(t + INTERVALS[2])
  })

  it('answering before it is due is practice: little XP, schedule unchanged', () => {
    at(new Date(2026, 9, 1, 12).getTime())
    const s = answerCard(initialState(), card.id, right).state
    const { state, result } = answerCard(s, card.id, right)
    expect(result.xp).toBe(2)
    expect(state.cards[card.id].due).toBe(s.cards[card.id].due)
  })

  it('a miss starts over: learning, due again in 10 minutes', () => {
    const t = new Date(2026, 9, 1, 12).getTime()
    at(t)
    const { state, result } = answerCard(initialState(), card.id, wrong)
    expect(result).toMatchObject({ correct: false, to: 'learning' })
    expect(state.cards[card.id]).toMatchObject({ step: 0, due: t + 10 * 60_000 })
  })

  it('older saves without due dates are scheduled from their last answer', () => {
    const now = Date.now()
    const s: GameState = { ...initialState(), cards: { [card.id]: { status: 'familiar', attempts: 1, correct: 1, lastChoice: 0, lastAt: now - 2 * DAY } } }
    expect(isDue(s, card.id, now)).toBe(true)
  })
})

describe('levels', () => {
  it('starts at level 1 and moves up with XP', () => {
    expect(levelInfo(0).level).toBe(1)
    expect(levelInfo(10_000).level).toBeGreaterThan(1)
  })
})

describe('daily goal and streak', () => {
  const day = (s: GameState, n: number) => {
    for (let i = 0; i < n; i++) s = answerCard(s, CARDS[i % CARDS.length].id, CARDS[i % CARDS.length].answerIndex).state
    return s
  }

  it('meets the goal, extends day by day, and restarts after a missed day', () => {
    let t = new Date(2026, 9, 1, 12).getTime()
    at(t)
    let s = day(initialState(), DAILY_GOAL)
    expect(todayCount(s)).toBe(DAILY_GOAL)
    expect(currentStreak(s)).toBe(1)
    t += DAY; at(t)
    s = day(s, DAILY_GOAL)
    expect(currentStreak(s)).toBe(2)
    t += 2 * DAY; at(t) // skipped a day
    expect(currentStreak(s)).toBe(0)
    s = day(s, DAILY_GOAL)
    expect(currentStreak(s)).toBe(1)
  })

  it('a missed day ends the streak', () => {
    let t = new Date(2026, 9, 1, 12).getTime()
    at(t)
    let s = day(initialState(), DAILY_GOAL)
    t += 2 * DAY; at(t)
    expect(currentStreak(s)).toBe(0)
    s = day(s, DAILY_GOAL)
    expect(s.streak).toEqual({ days: 1, lastDay: s.daily.day })
  })
})

describe('decks', () => {
  const text = 'perro\tdog\ngato\tcat\ncasa\thouse\nagua\twater\nlibro\tbook'
  const deck = (): UserDeck => ({ id: 'd', name: 'Spanish', scene: 'meadow', createdAt: 0, cards: parseDeck(text, { termSep: 'tab', rowSep: 'newline' }).cards })

  it('turns a deck into quiz cards with 3 wrong answers from the same deck', () => {
    const cards = deckFeedCards(deck())
    expect(cards).toHaveLength(5)
    for (const c of cards) {
      expect(c.choices).toHaveLength(4)
      expect(new Set(c.choices).size).toBe(4)
      expect(c.choices[c.answerIndex]).toBe(deck().cards.find((x) => x.id === c.id)!.definition)
    }
  })

  it('can practice definition to term', () => {
    const c = deckFeedCards({ ...deck(), reverse: true })[0]
    expect(c.title).toBe('dog')
    expect(c.choices[c.answerIndex]).toBe('perro')
  })

  it('finds deck cards and uses the active deck as the source', () => {
    const d = deck()
    const s: GameState = { ...initialState(), decks: [d], activeDeck: 'd' }
    expect(sourceCards(s)).toHaveLength(5)
    expect(findCard(s, d.cards[0].id)?.title).toBe('perro')
    expect(sourceCards({ ...s, activeDeck: 'gone' })).toBe(CARDS)
  })

  it('stays fast on a 10,000-card deck', () => {
    const big: UserDeck = { ...deck(), id: 'big', cards: Array.from({ length: 10_000 }, (_, i) => ({ id: `c${i}`, term: `t${i}`, definition: `d${i}` })) }
    const t0 = performance.now()
    deckFeedCards(big)
    expect(performance.now() - t0).toBeLessThan(500)
  })
})

describe('recall cards', () => {
  const recallDeck = (): UserDeck => ({
    id: 'r', name: 'Behavioral', scene: 'meadow', createdAt: 0,
    cards: [{ id: 'q1', term: 'Tell me about a conflict.', definition: 'Use STAR: situation, task, action, result.', kind: 'recall' }],
  })
  const base = (): GameState => ({ ...initialState(), decks: [recallDeck()], activeDeck: 'r' })

  it('Got it counts as right and climbs the schedule', () => {
    at(new Date(2026, 9, 1, 12).getTime())
    const { state, result } = answerCard(base(), 'q1', 2)
    expect(result).toMatchObject({ correct: true, partial: false, to: 'familiar', xp: 20 })
    expect(state.cards.q1.due).toBe(Date.now() + INTERVALS[0])
  })

  it('Missed it counts as wrong and comes back in 10 minutes', () => {
    const t = new Date(2026, 9, 1, 12).getTime()
    at(t)
    const { state, result } = answerCard(base(), 'q1', 0)
    expect(result).toMatchObject({ correct: false, partial: false, to: 'learning' })
    expect(state.cards.q1.due).toBe(t + 10 * 60_000)
  })

  it('Partly pays half the XP, comes back tomorrow and does not step up', () => {
    let t = new Date(2026, 9, 1, 12).getTime()
    at(t)
    let s = answerCard(base(), 'q1', 2).state // familiar, step 0
    t += DAY + 1; at(t)
    s = answerCard(s, 'q1', 2).state // step 1 (3 days)
    t += 3 * DAY + 1; at(t)
    const { state, result } = answerCard(s, 'q1', 1)
    expect(result).toMatchObject({ correct: false, partial: true, xp: 8 })
    expect(state.cards.q1).toMatchObject({ status: 'familiar', step: 1, due: t + INTERVALS[0] })
  })
})

describe('endless study feed', () => {
  it('mixes one due review after every 3 new cards', () => {
    let t = new Date(2026, 9, 1, 12).getTime()
    at(t)
    let s = initialState()
    for (const c of CARDS.slice(0, 2)) s = answerCard(s, c.id, c.answerIndex).state
    t += DAY + 1; at(t)
    const q = studyQueue(s)
    expect(q.slice(0, 4)).toEqual([CARDS[2].id, CARDS[3].id, CARDS[4].id, expect.stringMatching(new RegExp(`^(${CARDS[0].id}|${CARDS[1].id})$`))])
    expect(q).toHaveLength(CARDS.length) // 70 new + 2 due
  })

  it('keeps going with practice when nothing is new or due, weakest first', () => {
    at(new Date(2026, 9, 1, 12).getTime())
    const cards = CARDS.slice(0, 3)
    let s: GameState = initialState()
    s = answerCard(s, cards[0].id, cards[0].answerIndex).state // familiar
    s = answerCard(s, cards[1].id, (cards[1].answerIndex + 1) % cards[1].choices.length).state // learning
    s = answerCard(s, cards[2].id, cards[2].answerIndex).state // familiar
    expect(studyQueue(s, cards)).toEqual([]) // nothing new, nothing due yet
    const batch = practiceBatch(s, new Set(), 10, cards)
    expect(batch[0]).toBe(cards[1].id) // the miss first
    expect(practiceBatch(s, new Set([cards[1].id]), 10, cards)).not.toContain(cards[1].id) // skips recent
    expect(practiceBatch(s, new Set(cards.map((c) => c.id)), 10, cards, cards[2].id)).not.toContain(cards[2].id) // never the last card again
    const withSkipped = practiceBatch(s, new Set(), 10, CARDS.slice(0, 4))
    expect(withSkipped[1]).toBe(CARDS[3].id) // a card you scrolled past comes back right after misses
  })

  it('practice pays a little XP and leaves the schedule alone', () => {
    at(new Date(2026, 9, 1, 12).getTime())
    const s = answerCard(initialState(), card.id, wrong).state // learning, due in 10 min
    const { state, result } = answerCard(s, card.id, right) // retried right away
    expect(result.xp).toBeGreaterThan(0)
    expect(state.cards[card.id].due).toBe(s.cards[card.id].due)
  })
})
