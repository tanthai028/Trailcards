import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { VanScene } from '../art/VanScene'
import { Icon } from './Icon'

export function Onboarding() {
  const { state, finishOnboarding } = useGame()
  const [name, setName] = useState('')
  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col overflow-y-auto bg-ink"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.35 }}
      role="dialog" aria-modal="true" aria-labelledby="welcome-title"
    >
      <div className="relative h-[46%] min-h-[260px] shrink-0 overflow-hidden">
        <VanScene look={state.look} destination="lake" decor={['decor-bunting', 'decor-lights']} plantStage={1} catAwake className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />
      </div>
      <div className="relative -mt-6 flex flex-1 flex-col px-6 pb-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-peach">Field notes from the road</p>
        <h1 id="welcome-title" className="mt-1 font-display text-5xl font-bold leading-none">Wayfarer</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-cream/80">
          Scroll bite-sized cards about skies, stars, oceans, forests, and animals. Answer to earn XP and coins, dress up your traveler, and turn a little van into home.
        </p>
        <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-bold">
          {[
            ['book', 'Learn', 'from-sky/30'],
            ['closet', 'Collect', 'from-lav/30'],
            ['home', 'Make it home', 'from-peach/30'],
          ].map(([icon, label, from]) => (
            <li key={label} className={`rounded-2xl bg-gradient-to-b ${from} to-transparent px-2 py-3 ring-1 ring-white/10`}>
              <Icon name={icon} size={22} className="mx-auto mb-1" />
              {label}
            </li>
          ))}
        </ul>
        <form
          className="mt-auto pt-6"
          onSubmit={(e) => {
            e.preventDefault()
            finishOnboarding(name)
          }}
        >
          <label htmlFor="name" className="text-sm font-bold text-cream/80">What should we call you?</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="Wanderer"
            autoComplete="off"
            className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3.5 text-lg font-bold text-cream placeholder:text-cream/35 ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <button type="submit" className="mt-3 w-full rounded-2xl bg-gradient-to-r from-gold to-peach py-4 text-lg font-black text-ink shadow-lg shadow-peach/20 transition active:scale-[.98]">
            Start exploring
          </button>
        </form>
      </div>
    </motion.div>
  )
}
