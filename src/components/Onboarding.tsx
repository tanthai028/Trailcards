import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { useAccount } from '../net/account'
import { SceneSvg } from '../art/Landscape'
import { Cat } from '../art/Companions'
import { AVATARS } from '../data/avatars'
import { ProfilePic } from './ProfilePic'

/** First run: your name and picture, then sign in to join your group, or carry on as a guest. */
export function Onboarding({ onSignIn }: { onSignIn: () => void }) {
  const { state, finishOnboarding } = useGame()
  const { status } = useAccount()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(state.avatar)
  const canSignIn = status !== 'offline'
  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col overflow-y-auto bg-ink"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.35 }}
      role="dialog" aria-modal="true" aria-labelledby="welcome-title"
    >
      <div className="relative h-[30%] min-h-[180px] shrink-0 overflow-hidden">
        <SceneSvg scene="meadow" className="absolute inset-0 h-full w-full" />
        <Cat sleeping className="absolute bottom-7 left-[12%] h-[30%] drop-shadow-[0_8px_10px_rgba(0,0,0,.25)]" />
        <ProfilePic avatar={avatar} photo={null} frame={state.frame} className="absolute bottom-8 right-[14%] size-24 drop-shadow-[0_10px_12px_rgba(0,0,0,.35)]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink to-transparent" />
      </div>
      <form
        className="relative -mt-4 flex flex-1 flex-col px-6 pb-8"
        onSubmit={(e) => { e.preventDefault(); finishOnboarding(name, avatar) }}
      >
        <p className="text-xs font-black text-peach">Study anything, one card at a time</p>
        <h1 id="welcome-title" className="mt-1 font-display text-5xl font-bold leading-none">Wayfarer</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-cream/80">
          Scroll bite-sized cards on whatever you're learning. Build a daily streak, climb your group's leaderboard, and Mochi keeps you company.
        </p>

        <p className="mt-5 text-sm font-bold text-cream/80">Pick your picture</p>
        <p className="text-xs text-cream/50">Change it any time, or upload a photo, on your profile.</p>
        <div role="radiogroup" aria-label="Picture" className="mt-2 grid grid-cols-8 gap-1.5">
          {AVATARS.map((a) => (
            <button key={a.id} type="button" role="radio" aria-checked={avatar === a.id} aria-label={`${a.id} icon`} onClick={() => setAvatar(a.id)}
              className={`rounded-full p-0.5 ring-2 ${avatar === a.id ? 'ring-gold' : 'ring-transparent'}`}>
              <ProfilePic avatar={a.id} photo={null} className="aspect-square w-full" />
            </button>
          ))}
        </div>

        <label htmlFor="name" className="mt-4 block text-sm font-bold text-cream/80">What should we call you?</label>
        <input
          id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Wanderer" autoComplete="off"
          className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3.5 text-lg font-bold text-cream placeholder:text-cream/35 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <div className="mt-auto pt-5">
          {canSignIn ? (
            <>
              <button type="button" onClick={() => { finishOnboarding(name, avatar); onSignIn() }} className="w-full clay-btn clay-butter py-4 text-lg">
                Sign in and join your group
              </button>
              <button type="submit" className="mt-2 w-full clay-btn clay-plum py-3.5 text-[15px]">Continue as guest</button>
              <p className="mt-2 text-center text-[11px] leading-snug text-cream/45">Guests study on this device only: no leaderboard or shared decks, but you can still import and export decks. Sign in any time from your profile.</p>
            </>
          ) : (
            <button type="submit" className="w-full clay-btn clay-butter py-4 text-lg">Start learning</button>
          )}
        </div>
      </form>
    </motion.div>
  )
}
