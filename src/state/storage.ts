import type { GameState } from './game'
import { looksLikeSave, sanitize } from './sanitize'
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

/**
 * Read a saved game (from storage or a backup file). Every field is checked and anything
 * missing or malformed falls back to its default (see sanitize.ts), so older or damaged saves
 * load instead of crashing. Returns null only for text that isn't a Wayfarer save at all.
 */
export function parseSave(raw: string): GameState | null {
  try {
    const data: unknown = JSON.parse(raw)
    // backup files wrap the state: { app: 'wayfarer', exportedAt, state }
    const parsed = typeof data === 'object' && data !== null && (data as { app?: unknown }).app === 'wayfarer' ? (data as { state?: unknown }).state : data
    if (!looksLikeSave(parsed)) return null
    return migrate(sanitize(parsed))
  } catch {
    return null
  }
}

/** The save already in storage is ours, so any object is repaired rather than rejected. */
export function parseStoredSave(raw: string): GameState | null {
  try {
    const data: unknown = JSON.parse(raw)
    return typeof data === 'object' && data !== null && !Array.isArray(data) ? migrate(sanitize(data as Record<string, unknown>)) : null
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
      return raw ? parseStoredSave(raw) : null
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
