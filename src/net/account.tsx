// Your account for the friend group: sign in with an emailed code, join with an invite code,
// and keep this device's progress, XP and picture in sync with the server.
//
// The app stays local-first: the game state lives on the device and is pushed up a few
// seconds after it changes. On sign-in the copy with more XP wins, so a new phone picks up
// where you left off and an old phone never overwrites newer progress.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useGame } from '../state/store'
import { parseStoredSave } from '../state/storage'
import type { GameState } from '../state/game'
import { errorText, getClient, online } from './client'

export type AccountStatus = 'offline' | 'loading' | 'signedOut' | 'needsInvite' | 'member'

export interface Member {
  id: string
  name: string
  title: string | null
  /** { icon, frame } */
  avatar: { icon?: string; frame?: string } | null
  photo_url: string | null
}

interface Account {
  status: AccountStatus
  email: string | null
  me: Member | null
  client: SupabaseClient | null
  sendCode: (email: string) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<void>
  join: (invite: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<Account | null>(null)
const PUSH_DELAY = 3000

// Per account, on this device: the XP already sent to the leaderboard, and the picture already uploaded.
const memo = {
  get: (uid: string, k: string) => { try { return localStorage.getItem(`wayfarer.sync.${uid}.${k}`) } catch { return null } },
  set: (uid: string, k: string, v: string) => { try { localStorage.setItem(`wayfarer.sync.${uid}.${k}`, v) } catch { /* ignore */ } },
}
/** A short fingerprint of a picture, so the same one isn't uploaded twice. */
const fingerprint = (s: string) => { let h = 0; for (let i = 0; i < s.length; i += 7) h = (h * 31 + s.charCodeAt(i)) | 0; return `${s.length}:${h}` }
/** What's synced: everything but the picture, which lives in storage. */
const forServer = (s: GameState) => ({ ...s, photo: null })

async function blobToDataUrl(b: Blob) {
  return new Promise<string>((ok, fail) => { const r = new FileReader(); r.onload = () => ok(r.result as string); r.onerror = fail; r.readAsDataURL(b) })
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { state, restore, setPhoto } = useGame()
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [status, setStatus] = useState<AccountStatus>(online ? 'loading' : 'offline')
  const [uid, setUid] = useStateRef<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [me, setMe] = useState<Member | null>(null)
  const latest = useRef(state)
  latest.current = state
  const ready = useRef(false) // the first sign-in reconcile has finished
  const pushing = useRef<Promise<void> | null>(null)

  const loadMember = useCallback(async (sb: SupabaseClient, id: string) => {
    const { data } = await sb.from('profiles').select('id, name, title, avatar, photo_url').eq('id', id).maybeSingle()
    setMe(data as Member | null)
    setStatus(data ? 'member' : 'needsInvite')
  }, [])

  // connect, and follow sign-ins and sign-outs
  useEffect(() => {
    let live = true
    getClient().then(async (sb) => {
      if (!sb || !live) return
      setClient(sb)
      const apply = (session: { user: { id: string; email?: string } } | null) => {
        ready.current = false
        setUid(session?.user.id ?? null)
        setEmail(session?.user.email ?? null)
        if (!session) { setMe(null); setStatus('signedOut') } else void loadMember(sb, session.user.id)
      }
      const { data } = await sb.auth.getSession()
      if (live) apply(data.session)
      sb.auth.onAuthStateChange((event, session) => {
        if (live && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) apply(session)
      })
    })
    return () => { live = false }
  }, [loadMember, setUid])

  /** Send what changed: the game state, new XP, your name, title, look and picture. */
  const push = useCallback(async () => {
    const sb = client, id = uid.current
    if (!sb || !id || !ready.current) return
    const s = latest.current
    await sb.from('progress').upsert({ user_id: id, state: forServer(s), updated_at: new Date().toISOString() })
    // XP since the last send goes to the board (the server caps it)
    const sent = Number(memo.get(id, 'xp') ?? s.xp)
    let gain = s.xp - sent
    while (gain > 0) {
      const chunk = Math.min(gain, 400)
      const { error } = await sb.rpc('add_xp', { amount: chunk })
      if (error) break
      gain -= chunk
    }
    memo.set(id, 'xp', String(s.xp - Math.max(0, gain)))
    // picture: upload a new photo, or clear it
    const pic = s.photo ? fingerprint(s.photo) : ''
    let photo_url: string | null | undefined
    if (pic !== (memo.get(id, 'photo') ?? '')) {
      if (s.photo) {
        const blob = await (await fetch(s.photo)).blob()
        const path = `${id}/picture`
        const { error } = await sb.storage.from('avatars').upload(path, blob, { upsert: true, contentType: blob.type })
        if (!error) photo_url = `${sb.storage.from('avatars').getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
      } else {
        await sb.storage.from('avatars').remove([`${id}/picture`])
        photo_url = null
      }
      if (photo_url !== undefined) memo.set(id, 'photo', pic)
    }
    const patch: Partial<Member> = { name: s.name, title: s.title, avatar: { icon: s.avatar, frame: s.frame }, ...(photo_url !== undefined ? { photo_url } : {}) }
    const { data } = await sb.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('id, name, title, avatar, photo_url').maybeSingle()
    if (data) setMe(data as Member)
  }, [client, uid])

  const flush = useCallback(() => {
    if (!pushing.current) pushing.current = push().catch(() => {}).finally(() => { pushing.current = null })
    return pushing.current
  }, [push])

  // On joining, or signing in on this device: take whichever copy of your progress has more XP.
  useEffect(() => {
    const sb = client, id = uid.current
    if (status !== 'member' || !sb || !id || ready.current) return
    let live = true
    ;(async () => {
      const { data: row } = await sb.from('progress').select('state').eq('user_id', id).maybeSingle()
      if (!live) return
      const local = latest.current
      const remote = row ? parseStoredSave(JSON.stringify(row.state)) : null
      const firstTimeHere = memo.get(id, 'xp') == null
      if (remote && remote.xp >= local.xp) {
        restore({ ...remote, photo: local.photo })
        memo.set(id, 'xp', String(remote.xp))
      } else if (!remote) {
        // a brand-new account: XP earned before signing up goes on the all-time board once
        await sb.rpc('import_xp', { total: local.xp })
        memo.set(id, 'xp', String(local.xp))
      } else if (firstTimeHere) {
        // this device got further than the server: send the difference as new XP
        memo.set(id, 'xp', String(remote.xp))
      }
      // a new device: bring your picture down instead of clearing it
      if (me?.photo_url && !latest.current.photo && memo.get(id, 'photo') == null) {
        try {
          const data = await blobToDataUrl(await (await fetch(me.photo_url)).blob())
          setPhoto(data)
          memo.set(id, 'photo', fingerprint(data))
        } catch { /* keep the character */ }
      }
      ready.current = true
      void flush()
    })()
    return () => { live = false }
  }, [status, client, uid, me?.photo_url, restore, setPhoto, flush])

  // push a few seconds after anything changes, and right away when the app is hidden
  useEffect(() => {
    if (status !== 'member') return
    const t = setTimeout(() => void flush(), PUSH_DELAY)
    return () => clearTimeout(t)
  }, [state, status, flush])
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && void flush()
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [flush])

  const value = useMemo<Account>(() => ({
    status, email, me, client,
    sendCode: async (address) => {
      const { error } = await client!.auth.signInWithOtp({ email: address.trim(), options: { shouldCreateUser: true, emailRedirectTo: location.origin } })
      if (error) throw new Error(errorText(error))
    },
    verifyCode: async (address, code) => {
      const { error } = await client!.auth.verifyOtp({ email: address.trim(), token: code.trim(), type: 'email' })
      if (error) throw new Error(errorText(error))
    },
    join: async (invite) => {
      const { error } = await client!.rpc('join_group', { invite_code: invite, display_name: latest.current.name })
      if (error) throw new Error(errorText(error))
      await loadMember(client!, uid.current!)
    },
    signOut: async () => {
      await flush()
      await client?.auth.signOut()
    },
  }), [status, email, me, client, loadMember, uid, flush])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAccount() {
  const a = useContext(Ctx)
  if (!a) throw new Error('useAccount must be used inside AccountProvider')
  return a
}

/** State that callbacks can also read synchronously through `.current`. */
function useStateRef<T>(initial: T) {
  const ref = useRef(initial)
  const [, force] = useState(0)
  const set = useCallback((v: T) => { if (ref.current !== v) { ref.current = v; force((n) => n + 1) } }, [])
  return [ref, set] as const
}
