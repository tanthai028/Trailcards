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

/** Read a saved game (from storage or a backup file). Merges onto defaults so saves from older builds pick up new fields. */
export function parseSave(raw: string): GameState | null {
  try {
    const data = JSON.parse(raw) as Partial<GameState> & { app?: string; state?: Partial<GameState> }
    // backup files wrap the state: { app: 'wayfarer', exportedAt, state }
    const parsed = data.app === 'wayfarer' && data.state ? data.state : data
    if (typeof parsed !== 'object' || parsed == null || typeof parsed.cards !== 'object' || typeof parsed.xp !== 'number') return null
    const base = initialState()
    return migrate({ ...base, ...parsed, look: { ...base.look, ...parsed.look } })
  } catch {
    return null
  }
}

/** A backup file's contents. */
export const backupText = (state: GameState) => JSON.stringify({ app: 'wayfarer', exportedAt: Date.now(), state })

const BACKUP_KEY = 'wayfarer.lastBackup'
export const lastBackupAt = (): number | null => {
  try {
    const v = Number(localStorage.getItem(BACKUP_KEY))
    return v > 0 ? v : null
  } catch {
    return null
  }
}
export const markBackedUp = () => {
  try {
    localStorage.setItem(BACKUP_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

// Ask the browser to keep this site's storage; iOS Safari otherwise may clear it after a
// week without visits. Granted automatically for apps added to the Home Screen.
if (typeof navigator !== 'undefined') void navigator.storage?.persist?.().catch(() => {})

export const localSave: SaveAdapter = {
  load() {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? parseSave(raw) : null
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
