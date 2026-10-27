import { initialState, type GameState } from './game'

/** Swap this adapter for a Supabase-backed one later; the rest of the app won't change. */
export interface SaveAdapter {
  load(): GameState | null
  save(state: GameState): void
  clear(): void
}

const KEY = 'wayfarer.save.v1'

export const localSave: SaveAdapter = {
  load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      // Merge onto defaults so saves from older builds pick up new fields.
      const base = initialState()
      const parsed = JSON.parse(raw) as Partial<GameState>
      return { ...base, ...parsed, look: { ...base.look, ...parsed.look } }
    } catch {
      return null
    }
  },
  save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked — play on without saving */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  },
}
