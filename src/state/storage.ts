import type { GameState } from './game'
import { looksLikeSave, sanitize } from './sanitize'

/** Swap this adapter for a Supabase-backed one later; the rest of the app won't change. */
export interface SaveAdapter {
  load(): GameState | null
  save(state: GameState): void
  clear(): void
}

const KEY = 'wayfarer.save.v1'

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
    return sanitize(parsed)
  } catch {
    return null
  }
}

/** The save already in storage is ours, so any object is repaired rather than rejected. */
export function parseStoredSave(raw: string): GameState | null {
  try {
    const data: unknown = JSON.parse(raw)
    return typeof data === 'object' && data !== null && !Array.isArray(data) ? sanitize(data as Record<string, unknown>) : null
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
