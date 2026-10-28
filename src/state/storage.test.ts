import { describe, expect, it } from 'vitest'
import { backupText, parseSave, parseStoredSave } from './storage'
import { initialState, answerCard, findCard, type GameState } from './game'
import { CARDS } from '../data/cards'

const real = (): GameState => {
  let s: GameState = { ...initialState(), name: 'Tan', onboarded: true, xp: 430 }
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
    expect(s.name).toBe(base.name)
    expect(s.title).toBeNull()
    expect(s.onboarded).toBe(false)
    expect(s.tips).toEqual([])
    expect(s.decks).toEqual([])
    expect(s.activeDeck).toBeNull()
    expect(s.cards).toEqual({})
    expect(s.bookmarks).toEqual([])
    expect(s.avatar).toBe(base.avatar)
    expect(s.frame).toBe('none')
    expect(s.photo).toBeNull()
    expect(s.daily).toEqual({ day: '', count: 0 })
    expect(s.streak).toEqual({ days: 0, lastDay: null })
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
      avatar: 'dragon', frame: 'color:red',
      photo: 'javascript:alert(1)',
      streak: { days: 3, lastDay: '2026-10-01', freezes: 99 },
    }))!
    expect(Object.keys(s.cards)).toEqual(['ok'])
    expect(s.decks).toHaveLength(1)
    expect(s.decks[0]).toMatchObject({ id: 'd1', name: 'My deck', cards: [{ id: 'a', term: 'perro', definition: 'dog' }] })
    expect(s.activeDeck).toBeNull() // pointed at a deck that was dropped
    expect(s.avatar).toBe('paw') // unknown icon
    expect(s.frame).toBe('none') // not a known frame
    expect(s.photo).toBeNull()
    expect(s.streak).toEqual({ days: 3, lastDay: '2026-10-01' })
    exercise(s)
  })

  it('drops what the app no longer has: coins, items, the van, freezes and their trophies', () => {
    const old = {
      ...real(), coins: 300, owned: ['outfit-courier', 'van-cozy'], destination: 'coast', cardShuffle: true, van3d: [],
      streak: { days: 4, lastDay: '2026-10-01', freezes: 2 },
      achievements: { 'first-card': 5, stylist: 6, homemaker: 7 }, title: 'Trendsetter',
    }
    const s = parseSave(JSON.stringify(old))! as GameState & Record<string, unknown>
    for (const k of ['coins', 'owned', 'destination', 'cardShuffle', 'van3d']) expect(s[k]).toBeUndefined()
    expect(s.streak).toEqual({ days: 4, lastDay: '2026-10-01' })
    expect(s.achievements).toEqual({ 'first-card': 5 })
    expect(s.title).toBeNull() // that title came from a trophy that's gone
    expect(parseSave(JSON.stringify({ ...old, title: 'Fresh Wanderer' }))!.title).toBe('Fresh Wanderer')
  })

  it('keeps a known icon and frame; old character looks fall back to the default icon', () => {
    expect(parseSave(JSON.stringify({ ...real(), avatar: 'moon', frame: 'color:#b9a7f2' }))).toMatchObject({ avatar: 'moon', frame: 'color:#b9a7f2' })
    expect(parseSave(JSON.stringify({ ...real(), frame: 'gold' }))!.frame).toBe('gold')
    const old = { ...real(), look: { body: 'girl', hair: 'hair-bob' } } as Record<string, unknown>
    delete old.avatar
    expect(parseSave(JSON.stringify(old))!.avatar).toBe('paw')
  })

  it('drops topic trophies from the old built-in topics', () => {
    const s = parseSave(JSON.stringify({ ...real(), achievements: { 'first-card': 1, 'topic-sky': 2 }, title: 'Cloud Reader' }))!
    expect(s.achievements).toEqual({ 'first-card': 1 })
    expect(s.title).toBeNull()
  })

  it('keeps an uploaded picture', () => {
    const photo = 'data:image/webp;base64,UklGRg=='
    expect(parseSave(JSON.stringify({ ...real(), photo }))!.photo).toBe(photo)
  })

  it('treats saves from before deck choice as already studying; new players must choose', () => {
    const old = { ...real() } as Partial<GameState>
    delete old.deckChosen
    expect(parseSave(JSON.stringify(old))!.deckChosen).toBe(true)
    expect(parseStoredSave(JSON.stringify(initialState()))!.deckChosen).toBe(false)
  })

  it('treats non-finite numbers as missing', () => {
    const s = parseSave('{"xp": 1e999, "cards": {}}')!
    expect(s.xp).toBe(initialState().xp)
  })

  it('repairs any stored object but gives up on non-objects', () => {
    expect(parseStoredSave('{"hello":1}')?.name).toBe(initialState().name)
    for (const text of ['nope', 'null', '[]', '42']) expect(parseStoredSave(text)).toBeNull()
  })
})
