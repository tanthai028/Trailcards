import { describe, expect, it } from 'vitest'
import { backupText, parseSave, parseStoredSave } from './storage'
import { initialState, answerCard, findCard, type GameState } from './game'
import { CARDS } from '../data/cards'

const real = (): GameState => {
  let s: GameState = { ...initialState(), name: 'Tan', onboarded: true, coins: 155, xp: 430 }
  s = answerCard(s, CARDS[0].id, CARDS[0].answerIndex).state
  return s
}

/** A save that loaded must be usable: these are the calls that crashed on bad shapes. */
function exercise(s: GameState) {
  expect(() => findCard(s, 'anything')).not.toThrow()
  expect(() => answerCard(s, CARDS[1].id, 0)).not.toThrow()
}

describe('parseSave', () => {
  it('round-trips a real save and a backup file', () => {
    const s = real()
    for (const text of [JSON.stringify(s), backupText(s)]) {
      const back = parseSave(text)!
      expect(back.name).toBe('Tan')
      expect(back.xp).toBe(s.xp)
      expect(back.coins).toBe(s.coins)
      expect(back.cards[CARDS[0].id].status).toBe('familiar')
    }
  })

  it('rejects text that is not a Wayfarer save', () => {
    for (const text of ['', 'nope', '42', 'null', '[]', '{"hello":1}', '{"app":"wayfarer","state":"x"}']) expect(parseSave(text)).toBeNull()
  })

  it('repairs a save whose decks field is null (the white-screen bug)', () => {
    const s = parseSave(JSON.stringify({ ...real(), decks: null }))!
    expect(s.decks).toEqual([])
    expect(s.name).toBe('Tan')
    exercise(s)
  })

  it('falls back to defaults for every field with the wrong type', () => {
    const broken = {
      xp: 'lots', coins: -5, name: 42, title: 7, onboarded: 'yes', tips: 'x', decks: { a: 1 }, activeDeck: 5,
      cards: [1, 2], bookmarks: null, owned: 'all', look: 'cool', cardShuffle: 1, reduceMotion: null, sound: 'on',
      daily: 3, streak: [], destination: 'mars', achievements: 'none', createdAt: 'then', version: 9,
    }
    // the stored save is always repaired, even when nothing in it is recognizable
    const s = parseStoredSave(JSON.stringify(broken))!
    const base = initialState()
    expect(s.xp).toBe(0)
    expect(s.coins).toBe(0)
    expect(s.name).toBe(base.name)
    expect(s.title).toBeNull()
    expect(s.onboarded).toBe(false)
    expect(s.tips).toEqual([])
    expect(s.decks).toEqual([])
    expect(s.activeDeck).toBeNull()
    expect(s.cards).toEqual({})
    expect(s.bookmarks).toEqual([])
    expect(s.owned).toEqual(expect.arrayContaining(base.owned))
    expect(s.look).toEqual(base.look)
    expect(s.daily).toEqual({ day: '', count: 0 })
    expect(s.streak).toEqual({ days: 0, lastDay: null, freezes: 0 })
    expect(s.destination).toBe('lake')
    expect(s.achievements).toEqual({})
    expect(s.version).toBe(1)
    exercise(s)
  })

  it('drops bad entries inside otherwise good collections', () => {
    const s = parseSave(JSON.stringify({
      ...real(),
      cards: { ok: { status: 'mastered', attempts: 2, correct: 2, lastChoice: 0, lastAt: 1 }, bad: { status: 'wizard' }, worse: null },
      decks: [
        null,
        { id: 'd1', name: '', cards: [{ id: 'a', term: 'perro', definition: 'dog' }, { id: 'b', term: '', definition: 'x' }, 'junk', { id: 'a', term: 'dup', definition: 'dup' }] },
        { id: 'd2', name: 'Empty', cards: [] },
      ],
      activeDeck: 'd2',
      owned: ['outfit-trailhead', 12, 'not-a-real-item', 'decor-lights'],
      look: { body: 'guy', outfit: 'outfit-nocturne', hair: 'hair-crop', hairColor: 'neon', accessory: 'acc-none', card: 'card-night' },
      streak: { days: 3, lastDay: '2026-10-01', freezes: 99 },
    }))!
    expect(Object.keys(s.cards)).toEqual(['ok'])
    expect(s.decks).toHaveLength(1)
    expect(s.decks[0]).toMatchObject({ id: 'd1', name: 'My deck', cards: [{ id: 'a', term: 'perro', definition: 'dog' }] })
    expect(s.activeDeck).toBeNull() // pointed at a deck that was dropped
    expect(s.owned).not.toContain('not-a-real-item')
    expect(s.owned).not.toContain('decor-lights') // retired decor is refunded by the migration
    expect(s.look.outfit).toBe('outfit-trailhead') // Nocturne isn't owned
    expect(s.look.hairColor).toBe('ink')
    expect(s.look.card).toBe('card-meadow')
    expect(s.streak.freezes).toBe(2)
    exercise(s)
  })

  it('keeps refunds for retired items through the migration', () => {
    const s = parseSave(JSON.stringify({ ...real(), coins: 10, owned: ['decor-lights', 'hair-buns'] }))!
    expect(s.coins).toBe(10 + 50 + 80)
  })

  it('treats non-finite numbers as missing', () => {
    const s = parseSave('{"xp": 1e999, "coins": -1e999, "cards": {}}')!
    expect(s.xp).toBe(initialState().xp)
    expect(s.coins).toBe(initialState().coins)
  })

  it('repairs any stored object but gives up on non-objects', () => {
    expect(parseStoredSave('{"hello":1}')?.name).toBe(initialState().name)
    for (const text of ['nope', 'null', '[]', '42']) expect(parseStoredSave(text)).toBeNull()
  })
})
