import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { useAccount } from '../net/account'
import { SceneSvg } from '../art/Landscape'
import { Cat } from '../art/Companions'
import { AVATARS } from '../data/avatars'
import { ProfilePic } from './ProfilePic'

// One row to start with; the rest, frames and photos are on the profile.
const STARTERS = ['paw', 'leaf', 'star', 'wave', 'peak', 'flame', 'heart', 'planet']

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
      {/* the whole page fits one screen, down to 360×640: the scene gives way first */}
      <div className="relative h-[27%] min-h-[130px] max-h-[240px] shrink-0 overflow-hidden">
        <SceneSvg scene="meadow" className="absolute inset-0 h-full w-full" />
        <Cat sleeping className="absolute bottom-7 left-[12%] h-[30%] drop-shadow-[0_8px_10px_rgba(0,0,0,.25)]" />
        <ProfilePic avatar={avatar} photo={null} frame={state.frame} className="absolute bottom-7 right-[14%] size-20 drop-shadow-[0_10px_12px_rgba(0,0,0,.35)]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink to-transparent" />
      </div>
      <form
        className="relative -mt-4 flex flex-1 flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
        onSubmit={(e) => { e.preventDefault(); finishOnboarding(name, avatar) }}
      >
        <p className="text-xs font-black text-peach">Study anything, one card at a time</p>
        <h1 id="welcome-title" className="mt-1 font-display text-5xl font-bold leading-none">Trailcards</h1>
        <p className="mt-2 text-[15px] leading-snug text-cream/80 [@media(max-height:600px)]:hidden">
          Bite-sized cards on whatever you're learning, with a daily streak and Mochi for company.
        </p>

        <p className="mt-4 text-sm font-bold text-cream/80">Pick your picture <span className="font-normal text-cream/50">· more on your profile</span></p>
        <div role="radiogroup" aria-label="Picture" className="mt-2 grid grid-cols-8 gap-1.5">
          {AVATARS.filter((a) => STARTERS.includes(a.id)).map((a) => (
            <button key={a.id} type="button" role="radio" aria-checked={avatar === a.id} aria-label={`${a.id} icon`} onClick={() => setAvatar(a.id)}
              className={`rounded-full p-0.5 ring-2 ${avatar === a.id ? 'ring-gold' : 'ring-transparent'}`}>
              <ProfilePic avatar={a.id} photo={null} className="aspect-square w-full" />
            </button>
          ))}
        </div>

        <label htmlFor="name" className="mt-4 block text-sm font-bold text-cream/80">What should we call you?</label>
        <input
          id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Wanderer" autoComplete="off"
          className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-lg font-bold text-cream placeholder:text-cream/35 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <div className="mt-auto pt-4">
          {canSignIn ? (
            <>
              <button type="button" onClick={() => { finishOnboarding(name, avatar); onSignIn() }} className="w-full clay-btn clay-butter py-3.5 text-base">
                Sign in and join your group
              </button>
              <button type="submit" className="mt-1 min-h-11 w-full rounded-xl text-[15px] font-extrabold text-cream/80 hover:text-cream">Continue as guest</button>
              <p className="text-center text-[11px] leading-snug text-cream/45">Guests save on this device only, with no leaderboard. Sign in any time from Profile.</p>
            </>
          ) : (
            <button type="submit" className="w-full clay-btn clay-butter py-3.5 text-base">Start learning</button>
          )}
        </div>
      </form>
    </motion.div>
  )
}
