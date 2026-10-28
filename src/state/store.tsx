import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as G from './game'
import { localSave } from './storage'
import type { Frame } from '../data/avatars'
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
  /** Your icon picture. */
  setAvatar: (id: string) => void
  /** The frame around your picture. */
  setFrame: (frame: Frame) => void
  /** Picture background, card theme or title effect. */
  setCosmetics: (patch: Partial<G.Cosmetics>) => void
  /** Your uploaded picture (a small data URL), or null to use the icon. */
  setPhoto: (photo: string | null) => void
  setReduceMotion: (on: boolean) => void
  setSound: (on: boolean) => void
  setHaptics: (on: boolean) => void
  importDeck: (name: string, cards: DeckCard[], opts?: Partial<Pick<UserDeck, 'topic' | 'scene' | 'reverse' | 'origin'>>) => void
  deleteDeck: (id: string) => void
  renameDeck: (id: string, name: string) => void
  /** Change a deck's cards, practice direction, scene or shared id (rename has its own action). */
  updateDeck: (id: string, patch: Partial<Pick<UserDeck, 'cards' | 'reverse' | 'scene' | 'sharedId'>>) => void
  setActiveDeck: (id: string | null) => void
  /** Filter and order for the deck being studied. */
  setStudyPrefs: (patch: Partial<G.StudyPrefs>) => void
  /** Take back an answer, given the state from just before it. */
  undoAnswer: (before: G.GameState) => void
  dismissTip: (id: string) => void
  setName: (name: string) => void
  setTitle: (title: string | null) => void
  finishOnboarding: (name: string, avatar: string) => void
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
      setAvatar: (avatar) => commit({ ...stateRef.current, avatar, photo: null }),
      setFrame: (frame) => commit({ ...stateRef.current, frame }),
      setCosmetics: (patch) => commit({ ...stateRef.current, cosmetics: { ...stateRef.current.cosmetics, ...patch } }),
      setPhoto: (photo) => commit({ ...stateRef.current, photo }),
      importDeck: (name, cards, opts = {}) => {
        const s = stateRef.current
        const id = `deck-${Date.now().toString(36)}`
        const deck: UserDeck = { id, name: name.trim().slice(0, 40) || 'My deck', scene: opts.scene ?? DECK_SCENES[s.decks.length % DECK_SCENES.length], createdAt: Date.now(), cards, ...(opts.topic?.trim() ? { topic: opts.topic.trim() } : {}), ...(opts.reverse ? { reverse: true } : {}), ...(opts.origin ? { origin: opts.origin } : {}) }
        // deck trophies (Deck Builder, Librarian, Explorer) are checked here, not only on answers
        const ach = G.checkAchievements({ ...s, decks: [...s.decks, deck], activeDeck: id, deckChosen: true })
        commit(ach.state)
        push([{ kind: 'toast', text: `Imported ${cards.length} cards into “${deck.name}”` }])
        pushAch(ach.unlocked)
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
        const ach = G.checkAchievements({ ...s, decks: s.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)) })
        commit(ach.state)
        pushAch(ach.unlocked)
      },
      deleteDeck: (id) => {
        const s = stateRef.current
        commit({ ...s, decks: s.decks.filter((d) => d.id !== id), activeDeck: s.activeDeck === id ? null : s.activeDeck })
      },
      dismissTip: (id) => {
        const s = stateRef.current
        if (!s.tips.includes(id)) commit({ ...s, tips: [...s.tips, id] })
      },
      setStudyPrefs: (patch) => {
        const s = stateRef.current
        commit({ ...s, studyPrefs: { ...s.studyPrefs, [G.prefsKey(s)]: { ...G.studyPrefs(s), ...patch } } })
      },
      undoAnswer: (before) => commit(G.undoAnswer(stateRef.current, before)),
      setActiveDeck: (id) => commit({ ...stateRef.current, activeDeck: id, deckChosen: true }),
      setReduceMotion: (on) => commit({ ...stateRef.current, reduceMotion: on }),
      setSound: (on) => commit({ ...stateRef.current, sound: on }),
      setHaptics: (on) => commit({ ...stateRef.current, haptics: on }),
      setName: (name) => commit({ ...stateRef.current, name: name.trim().slice(0, 20) || 'Wanderer' }),
      setTitle: (title) => commit({ ...stateRef.current, title }),
      finishOnboarding: (name, avatar) =>
        commit({ ...stateRef.current, avatar, onboarded: true, name: name.trim().slice(0, 20) || 'Wanderer' }),
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
