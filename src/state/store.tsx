import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as G from './game'
import { localSave } from './storage'
import { bodyOfHair, type Look } from '../data/look'
import { DECK_SCENES, minCards, type DeckCard, type UserDeck } from '../data/decks'

export type GameEvent =
  | { id: number; kind: 'achievement'; achId: string }
  | { id: number; kind: 'levelUp'; level: number }
  | { id: number; kind: 'streak'; days: number }
  | { id: number; kind: 'toast'; text: string }

type NewEvent = GameEvent extends infer E ? (E extends GameEvent ? Omit<E, 'id'> : never) : never

interface Store {
  state: G.GameState
  events: GameEvent[]
  dismiss: (id: number) => void
  answer: (cardId: string, choice: number) => G.AnswerResult
  toggleBookmark: (cardId: string) => void
  /** Your character picture. */
  setLook: (look: Look) => void
  /** Your uploaded picture (a small data URL), or null to use the character. */
  setPhoto: (photo: string | null) => void
  setReduceMotion: (on: boolean) => void
  setSound: (on: boolean) => void
  importDeck: (name: string, cards: DeckCard[], topic?: string) => void
  deleteDeck: (id: string) => void
  renameDeck: (id: string, name: string) => void
  /** Change a deck's cards or practice direction (rename has its own action). */
  updateDeck: (id: string, patch: Partial<Pick<UserDeck, 'cards' | 'reverse'>>) => void
  setActiveDeck: (id: string | null) => void
  dismissTip: (id: string) => void
  setName: (name: string) => void
  setTitle: (title: string | null) => void
  finishOnboarding: (name: string, look: Look) => void
  reset: () => void
  /** Replace all progress with a restored backup. */
  restore: (s: G.GameState) => void
}

const Ctx = createContext<Store | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<G.GameState>(() => localSave.load() ?? G.initialState())
  const [events, setEvents] = useState<GameEvent[]>([])
  const stateRef = useRef(state)
  stateRef.current = state
  const nextId = useRef(1)

  useEffect(() => localSave.save(state), [state])

  const commit = useCallback((s: G.GameState) => {
    stateRef.current = s
    setState(s)
  }, [])

  const push = useCallback((evs: NewEvent[]) => {
    if (!evs.length) return
    setEvents((cur) => [...cur, ...evs.map((e) => ({ ...e, id: nextId.current++ }) as GameEvent)])
  }, [])

  const pushAch = useCallback((ids: string[]) => push(ids.map((achId) => ({ kind: 'achievement' as const, achId }))), [push])

  const store = useMemo<Store>(
    () => ({
      state,
      events,
      dismiss: (id) => setEvents((cur) => cur.filter((e) => e.id !== id)),
      answer: (cardId, choice) => {
        const { state: s, result } = G.answerCard(stateRef.current, cardId, choice)
        commit(s)
        const evs: NewEvent[] = result.achievements.map((achId) => ({ kind: 'achievement' as const, achId }))
        if (result.levelUp != null) evs.push({ kind: 'levelUp', level: result.levelUp })
        if (result.goalStreak != null) evs.push({ kind: 'streak', days: result.goalStreak })
        push(evs)
        return result
      },
      toggleBookmark: (cardId) => {
        const s = stateRef.current
        const has = s.bookmarks.includes(cardId)
        commit({ ...s, bookmarks: has ? s.bookmarks.filter((b) => b !== cardId) : [...s.bookmarks, cardId] })
        push([{ kind: 'toast', text: has ? 'Removed from saved' : 'Saved for later' }])
      },
      setLook: (look) => commit({ ...stateRef.current, look: { ...look, body: bodyOfHair(look.hair) ?? look.body } }),
      setPhoto: (photo) => commit({ ...stateRef.current, photo }),
      importDeck: (name, cards, topic) => {
        const s = stateRef.current
        const id = `deck-${Date.now().toString(36)}`
        const deck: UserDeck = { id, name: name.trim().slice(0, 40) || 'My deck', scene: DECK_SCENES[s.decks.length % DECK_SCENES.length], createdAt: Date.now(), cards, ...(topic?.trim() ? { topic: topic.trim() } : {}) }
        commit({ ...s, decks: [...s.decks, deck], activeDeck: id, deckChosen: true })
        push([{ kind: 'toast', text: `Imported ${cards.length} cards into “${deck.name}”` }])
      },
      renameDeck: (id, name) => {
        const s = stateRef.current
        const clean = name.trim().slice(0, 40)
        if (!clean) return
        commit({ ...s, decks: s.decks.map((d) => (d.id === id ? { ...d, name: clean } : d)) })
      },
      updateDeck: (id, patch) => {
        const s = stateRef.current
        if (patch.cards && patch.cards.length < minCards(patch.cards)) return
        commit({ ...s, decks: s.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)) })
      },
      deleteDeck: (id) => {
        const s = stateRef.current
        commit({ ...s, decks: s.decks.filter((d) => d.id !== id), activeDeck: s.activeDeck === id ? null : s.activeDeck })
      },
      dismissTip: (id) => {
        const s = stateRef.current
        if (!s.tips.includes(id)) commit({ ...s, tips: [...s.tips, id] })
      },
      setActiveDeck: (id) => commit({ ...stateRef.current, activeDeck: id, deckChosen: true }),
      setReduceMotion: (on) => commit({ ...stateRef.current, reduceMotion: on }),
      setSound: (on) => commit({ ...stateRef.current, sound: on }),
      setName: (name) => commit({ ...stateRef.current, name: name.trim().slice(0, 20) || 'Wanderer' }),
      setTitle: (title) => commit({ ...stateRef.current, title }),
      finishOnboarding: (name, look) =>
        commit({ ...stateRef.current, look, onboarded: true, name: name.trim().slice(0, 20) || 'Wanderer' }),
      reset: () => {
        localSave.clear()
        commit(G.initialState())
        setEvents([])
      },
      restore: (s) => {
        commit(s)
        setEvents([])
      },
    }),
    [state, events, commit, push, pushAch],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useGame() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useGame must be used inside GameProvider')
  return s
}
