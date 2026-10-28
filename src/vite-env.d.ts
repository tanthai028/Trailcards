/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL; without it the app runs on this device only. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase publishable (public) key. */
  readonly VITE_SUPABASE_KEY?: string
}
