import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as G from './game'
import { localSave } from './storage'
import { ITEM_BY_ID, type Body, type HairColorId } from '../data/items'
import { DECK_SCENES, type DeckCard, type UserDeck } from '../data/decks'

export type GameEvent =
  | { id: number; kind: 'achievement'; achId: string }
  | { id: number; kind: 'levelUp'; level: number }
  | { id: number; kind: 'plant'; stage: number }
  | { id: number; kind: 'toast'; text: string }

type NewEvent = GameEvent extends infer E ? (E extends GameEvent ? Omit<E, 'id'> : never) : never

interface Store {
  state: G.GameState
  events: GameEvent[]
  dismiss: (id: number) => void
  answer: (cardId: string, choice: number) => G.AnswerResult
  toggleBookmark: (cardId: string) => void
  buy: (itemId: string) => boolean
  equip: (itemId: string) => void
  setHairColor: (c: HairColorId) => void
  setCardShuffle: (on: boolean) => void
  setReduceMotion: (on: boolean) => void
  setSound: (on: boolean) => void
  setBody: (b: Body) => void
  importDeck: (name: string, cards: DeckCard[]) => void
  deleteDeck: (id: string) => void
  renameDeck: (id: string, name: string) => void
  setActiveDeck: (id: string | null) => void
  dismissTip: (id: string) => void
  setName: (name: string) => void
  setTitle: (title: string | null) => void
  setDestination: (id: string) => void
  finishOnboarding: (name: string, body: Body) => void
  reset: () => void
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
        if (result.plantUp != null) evs.push({ kind: 'plant', stage: result.plantUp })
        if (result.levelUp != null) evs.push({ kind: 'levelUp', level: result.levelUp })
        // First coins ever: point at where they're spent, once.
        if (result.coins > 0 && !s.tips.includes('first-coins')) {
          commit({ ...s, tips: [...s.tips, 'first-coins'] })
          evs.push({ kind: 'toast', text: 'You earned coins! Spend them on outfits in the Closet or upgrades in the Van.' })
        }
        push(evs)
        return result
      },
      toggleBookmark: (cardId) => {
        const s = stateRef.current
        const has = s.bookmarks.includes(cardId)
        commit({ ...s, bookmarks: has ? s.bookmarks.filter((b) => b !== cardId) : [...s.bookmarks, cardId] })
        push([{ kind: 'toast', text: has ? 'Removed from saved' : 'Saved for later' }])
      },
      buy: (itemId) => {
        const r = G.buyItem(stateRef.current, itemId)
        if (r.ok) {
          commit(r.state)
          if (ITEM_BY_ID[itemId]?.slot === 'van') push([{ kind: 'toast', text: `Your van is now: ${ITEM_BY_ID[itemId].name}` }])
          pushAch(r.achievements)
        }
        return r.ok
      },
      equip: (itemId) => {
        const r = G.equipItem(stateRef.current, itemId)
        commit(r.state)
        pushAch(r.achievements)
      },
      importDeck: (name, cards) => {
        const s = stateRef.current
        const id = `deck-${Date.now().toString(36)}`
        const deck: UserDeck = { id, name: name.trim().slice(0, 40) || 'My deck', scene: DECK_SCENES[s.decks.length % DECK_SCENES.length], createdAt: Date.now(), cards }
        commit({ ...s, decks: [...s.decks, deck], activeDeck: id })
        push([{ kind: 'toast', text: `Imported ${cards.length} cards into “${deck.name}”` }])
      },
      renameDeck: (id, name) => {
        const s = stateRef.current
        const clean = name.trim().slice(0, 40)
        if (!clean) return
        commit({ ...s, decks: s.decks.map((d) => (d.id === id ? { ...d, name: clean } : d)) })
      },
      deleteDeck: (id) => {
        const s = stateRef.current
        commit({ ...s, decks: s.decks.filter((d) => d.id !== id), activeDeck: s.activeDeck === id ? null : s.activeDeck })
      },
      dismissTip: (id) => {
        const s = stateRef.current
        if (!s.tips.includes(id)) commit({ ...s, tips: [...s.tips, id] })
      },
      setActiveDeck: (id) => commit({ ...stateRef.current, activeDeck: id }),
      setBody: (b) => commit(G.setBody(stateRef.current, b)),
      setCardShuffle: (on) => commit({ ...stateRef.current, cardShuffle: on }),
      setReduceMotion: (on) => commit({ ...stateRef.current, reduceMotion: on }),
      setSound: (on) => commit({ ...stateRef.current, sound: on }),
      setHairColor: (c) => commit({ ...stateRef.current, look: { ...stateRef.current.look, hairColor: c } }),
      setName: (name) => commit({ ...stateRef.current, name: name.trim().slice(0, 20) || 'Wanderer' }),
      setTitle: (title) => commit({ ...stateRef.current, title }),
      setDestination: (id) => commit({ ...stateRef.current, destination: id }),
      finishOnboarding: (name, body) =>
        commit({ ...G.setBody(stateRef.current, body), onboarded: true, name: name.trim().slice(0, 20) || 'Wanderer' }),
      reset: () => {
        localSave.clear()
        commit(G.initialState())
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
