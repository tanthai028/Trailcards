// The Supabase connection. It loads after the first paint (supabase-js is not small), and is
// null when the app was built without a project, so everything keeps working on-device.
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

let client: Promise<SupabaseClient | null> | null = null

export const online = !!(url && key)

export function getClient(): Promise<SupabaseClient | null> {
  if (!client) {
    client = online
      ? import('@supabase/supabase-js').then(({ createClient }) =>
          createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }),
        )
      : Promise.resolve(null)
  }
  return client
}

/** A readable message from a Supabase error (or anything thrown). */
export const errorText = (e: unknown) =>
  (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' ? e.message : null) ?? 'Something went wrong. Try again.'
