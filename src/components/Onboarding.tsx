import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { Avatar, Figurine } from '../scene/Figurine'
import { SceneSvg } from '../art/Landscape'
import { Cat } from '../art/Companions'
import { HAIRS, type Look } from '../data/look'

export function Onboarding() {
  const { state, finishOnboarding } = useGame()
  const [name, setName] = useState('')
  const [hair, setHair] = useState<string>(state.look.hair)
  const withHair = (id: string): Look => ({ ...state.look, hair: id, body: HAIRS.find((h) => h.id === id)!.body })
  const look = withHair(hair)
  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col overflow-y-auto bg-ink"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.35 }}
      role="dialog" aria-modal="true" aria-labelledby="welcome-title"
    >
      <div className="relative h-[36%] min-h-[210px] shrink-0 overflow-hidden">
        <SceneSvg scene="meadow" className="absolute inset-0 h-full w-full" />
        <Cat sleeping className="absolute bottom-8 left-[14%] h-[24%] drop-shadow-[0_8px_10px_rgba(0,0,0,.25)]" />
        <Figurine look={look} className="absolute bottom-6 right-[14%] h-[66%] drop-shadow-[0_10px_12px_rgba(0,0,0,.35)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />
      </div>
      <div className="relative -mt-6 flex flex-1 flex-col px-6 pb-8">
        <p className="text-xs font-black text-peach">Study anything, one card at a time</p>
        <h1 id="welcome-title" className="mt-1 font-display text-5xl font-bold leading-none">Wayfarer</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-cream/80">
          Scroll bite-sized cards on whatever you're learning, from interview prep to a class. Build a daily streak, earn trophies, and Mochi keeps you company.
        </p>
        <form
          className="mt-auto pt-5"
          onSubmit={(e) => {
            e.preventDefault()
            finishOnboarding(name, look)
          }}
        >
          <p className="text-sm font-bold text-cream/80">Pick your picture</p>
          <p className="text-xs text-cream/50">Change it any time, or upload a photo, on your profile.</p>
          <div role="radiogroup" aria-label="Picture" className="mt-2 grid grid-cols-4 gap-2">
            {HAIRS.map((h) => (
              <button
                key={h.id}
                type="button"
                role="radio"
                aria-checked={hair === h.id}
                aria-label={h.name}
                onClick={() => setHair(h.id)}
                className={`grid aspect-square place-items-center rounded-2xl transition ${hair === h.id ? 'bg-cream ring-2 ring-gold' : 'clay ring-1 ring-white/12'}`}
              >
                <Avatar look={withHair(h.id)} className="size-[78%] rounded-full bg-[#e9d9cf]" />
              </button>
            ))}
          </div>
          <label htmlFor="name" className="mt-4 block text-sm font-bold text-cream/80">What should we call you?</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Wanderer"
            autoComplete="off"
            className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3.5 text-lg font-bold text-cream placeholder:text-cream/35 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <button type="submit" className="mt-3 w-full clay-btn clay-butter py-4 text-lg">
            Start learning
          </button>
        </form>
      </div>
    </motion.div>
  )
}
