// Joining the group: your email, the 6-digit code it receives, then the invite code from a
// friend. Whatever step you're on follows the account status, so a reload resumes it.
import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useAccount } from '../net/account'
import { Icon } from './Icon'

const FIELD = 'mt-2 w-full rounded-2xl bg-white/10 px-4 py-3.5 text-lg font-bold text-cream placeholder:text-cream/35 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-gold'

export function JoinSheet({ onClose }: { onClose: () => void }) {
  const { status, email: signedInAs, sendCode, verifyCode, join, signOut } = useAccount()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [invite, setInvite] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<void>) => async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try { await fn() } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  let body
  if (status === 'member') {
    body = (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-sage text-ink"><Icon name="check" size={28} strokeWidth={3} /></span>
        <h2 className="mt-3 font-display text-2xl font-bold">You're in</h2>
        <p className="mt-1 text-sm text-cream/65">Your progress now syncs, and you're on the leaderboard.</p>
        <button onClick={onClose} className="clay-btn clay-butter mt-5 min-h-12 w-full text-[15px]">Let's go</button>
      </div>
    )
  } else if (status === 'needsInvite') {
    body = (
      <form onSubmit={run(() => join(invite))}>
        <h2 className="font-display text-2xl font-bold">Got an invite code?</h2>
        <p className="mt-1 text-sm text-cream/65">Ask a friend in the group for it. Signed in as {signedInAs}.</p>
        <input value={invite} onChange={(e) => setInvite(e.target.value.toUpperCase())} placeholder="TRAIL-XXXXXX" autoCapitalize="characters" autoComplete="off" aria-label="Invite code" className={`${FIELD} tracking-wider`} />
        <button disabled={busy || invite.trim().length < 6} className="clay-btn clay-butter mt-3 min-h-12 w-full text-[15px] disabled:opacity-50">{busy ? 'Joining…' : 'Join the group'}</button>
        <button type="button" onClick={() => void signOut()} className="mt-3 w-full text-xs font-bold text-cream/50">Use a different email</button>
      </form>
    )
  } else if (!sent) {
    body = (
      <form onSubmit={run(async () => { await sendCode(email); setSent(true) })}>
        <h2 className="font-display text-2xl font-bold">Join your study group</h2>
        <p className="mt-1 text-sm text-cream/65">Sync your progress across devices, climb the leaderboard and share decks with friends. We'll email you a sign-in code.</p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" aria-label="Email" className={FIELD} />
        <button disabled={busy || !/\S+@\S+\.\S+/.test(email)} className="clay-btn clay-butter mt-3 min-h-12 w-full text-[15px] disabled:opacity-50">{busy ? 'Sending…' : 'Email me a code'}</button>
      </form>
    )
  } else {
    body = (
      <form onSubmit={run(() => verifyCode(email, code))}>
        <h2 className="font-display text-2xl font-bold">Check your email</h2>
        <p className="mt-1 text-sm text-cream/65">
          Enter the code we emailed to {email}. If you're in the home-screen app, stay here: don't tap the email's link, it opens Safari instead.
        </p>
        <div className="relative">
          <input value={code} onChange={(e) => setCode(e.target.value.trim())} placeholder="Sign-in code" inputMode="numeric" autoComplete="one-time-code" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Sign-in link or code" className={`${FIELD} pr-24 tracking-[0.2em]`} />
          <button type="button" onClick={() => void navigator.clipboard?.readText().then((t) => t && setCode(t.trim())).catch(() => {})}
            className="clay-btn clay-lav absolute right-2 top-1/2 mt-1 min-h-9 -translate-y-1/2 px-3.5 text-xs">Paste</button>
        </div>
        <button disabled={busy || code.length < 6} className="clay-btn clay-butter mt-3 min-h-12 w-full text-[15px] disabled:opacity-50">{busy ? 'Checking…' : 'Sign in'}</button>
        <button type="button" onClick={() => { setSent(false); setCode('') }} className="mt-3 w-full text-xs font-bold text-cream/50">Use a different email</button>
      </form>
    )
  }

  // z-80: above the deck page (z-75), which can open this
  return createPortal(
    <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog" aria-modal="true" aria-label="Join your study group"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className="clay w-full max-w-[480px] rounded-t-[28px] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 text-cream"
      >
        <span className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-white/20" aria-hidden="true" />
        {body}
        {error && <p role="alert" className="mt-3 text-center text-sm font-bold text-coral">{error}</p>}
      </motion.div>
    </motion.div>,
    document.body,
  )
}

/** Shown on Explore and Ranks before you've joined. */
export function JoinPrompt({ what, onJoin }: { what: string; onJoin: () => void }) {
  const { status } = useAccount()
  if (status === 'offline') {
    return <p className="clay rounded-3xl p-5 text-center text-sm text-cream/65">This build isn't connected to a server, so {what} isn't available.</p>
  }
  return (
    <div className="clay rounded-3xl p-5 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-gold/20 text-gold"><Icon name="profile" size={22} /></span>
      <h2 className="mt-3 font-display text-xl font-bold">Join your study group</h2>
      <p className="mt-1 text-sm text-cream/65">Sign in with your email and a friend's invite code to see {what}.</p>
      <button onClick={onJoin} disabled={status === 'loading'} className="clay-btn clay-butter mt-4 min-h-12 w-full text-[15px] disabled:opacity-50">
        {status === 'needsInvite' ? 'Enter your invite code' : 'Sign in'}
      </button>
    </div>
  )
}
