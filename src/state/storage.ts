import { initialState, type GameState } from './game'
import { ITEMS, DEFAULT_HAIR, RETIRED_DECOR, hairFits } from '../data/items'

/** Swap this adapter for a Supabase-backed one later; the rest of the app won't change. */
export interface SaveAdapter {
  load(): GameState | null
  save(state: GameState): void
  clear(): void
}

const KEY = 'wayfarer.save.v1'

/** Bring older saves up to date without losing anything the player paid for. */
function migrate(s: GameState): GameState {
  let { coins, owned } = s
  // Twin Buns was retired when hairstyles became per body type: refund it.
  if (owned.includes('hair-buns')) {
    owned = owned.filter((id) => id !== 'hair-buns')
    coins += 80
  }
  // Individual decorations became whole-room upgrades: refund every retired piece in full.
  const retired = owned.filter((id) => id in RETIRED_DECOR)
  if (retired.length) {
    coins += retired.reduce((sum, id) => sum + RETIRED_DECOR[id], 0)
    owned = owned.filter((id) => !(id in RETIRED_DECOR))
  }
  // New starter items (e.g. the guy's free hairstyle) are owned by everyone.
  for (const it of ITEMS) if (it.starter && !owned.includes(it.id)) owned = [...owned, it.id]
  const look = { ...s.look }
  if (!hairFits(look.hair, look.body)) look.hair = DEFAULT_HAIR[look.body]
  const { hiddenDecor: _retired, ...rest } = s as GameState & { hiddenDecor?: string[] }
  return { ...rest, coins, owned, look }
}

export const localSave: SaveAdapter = {
  load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      // Merge onto defaults so saves from older builds pick up new fields.
      const base = initialState()
      const parsed = JSON.parse(raw) as Partial<GameState>
      return migrate({ ...base, ...parsed, look: { ...base.look, ...parsed.look } })
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
