import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as G from './game'
import { localSave } from './storage'
import type { HairColorId } from '../data/items'

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
  setName: (name: string) => void
  setTitle: (title: string | null) => void
  setDestination: (id: string) => void
  toggleDecor: (id: string) => void
  finishOnboarding: (name: string) => void
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
          pushAch(r.achievements)
        }
        return r.ok
      },
      equip: (itemId) => {
        const r = G.equipItem(stateRef.current, itemId)
        commit(r.state)
        pushAch(r.achievements)
      },
      setHairColor: (c) => commit({ ...stateRef.current, look: { ...stateRef.current.look, hairColor: c } }),
      setName: (name) => commit({ ...stateRef.current, name: name.trim().slice(0, 20) || 'Wanderer' }),
      setTitle: (title) => commit({ ...stateRef.current, title }),
      setDestination: (id) => commit({ ...stateRef.current, destination: id }),
      toggleDecor: (id) => {
        const s = stateRef.current
        const hidden = s.hiddenDecor.includes(id)
        commit({ ...s, hiddenDecor: hidden ? s.hiddenDecor.filter((d) => d !== id) : [...s.hiddenDecor, id] })
      },
      finishOnboarding: (name) =>
        commit({ ...stateRef.current, onboarded: true, name: name.trim().slice(0, 20) || 'Wanderer' }),
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
