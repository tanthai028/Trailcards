import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { VanExterior } from '../scene/VanExterior'
import { Avatar, Figurine } from '../scene/Figurine'
import { art } from '../scene/assets'
import { DEFAULT_HAIR, type Body } from '../data/items'

export function Onboarding() {
  const { state, finishOnboarding } = useGame()
  const [name, setName] = useState('')
  const [body, setBody] = useState<Body>('girl')
  const look = { ...state.look, body, hair: DEFAULT_HAIR[body] }
  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col overflow-y-auto bg-ink"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.35 }}
      role="dialog" aria-modal="true" aria-labelledby="welcome-title"
    >
      <div className="relative h-[36%] min-h-[210px] shrink-0 overflow-hidden" style={{ background: 'radial-gradient(70% 80% at 50% 45%, #463764 0%, #221a33 75%)' }}>
        {art('exterior-lake-cut') ? (
          <img src={art('exterior-lake-cut')} alt="Your camper van parked by a lake" className="absolute left-1/2 top-[54%] h-[96%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_18px_24px_rgba(10,4,24,.55)]" />
        ) : (
          <div className="absolute left-1/2 top-1/2 aspect-square h-[118%] -translate-x-1/2 -translate-y-[47%]">
            <VanExterior destination="lake" />
          </div>
        )}
        <Figurine look={look} className="absolute bottom-6 right-[10%] h-[58%] drop-shadow-[0_10px_12px_rgba(0,0,0,.35)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />
      </div>
      <div className="relative -mt-6 flex flex-1 flex-col px-6 pb-8">
        <p className="text-xs font-black text-peach">Field notes from the road</p>
        <h1 id="welcome-title" className="mt-1 font-display text-5xl font-bold leading-none">Wayfarer</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-cream/80">
          Scroll bite-sized cards about the natural world. Every right answer earns coins for new outfits and van upgrades.
        </p>
        <form
          className="mt-auto pt-5"
          onSubmit={(e) => {
            e.preventDefault()
            finishOnboarding(name, body)
          }}
        >
          <p className="text-sm font-bold text-cream/80">Who's traveling?</p>
          <div role="radiogroup" aria-label="Character" className="mt-2 grid grid-cols-2 gap-2">
            {(['girl', 'guy'] as Body[]).map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={body === b}
                onClick={() => setBody(b)}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl text-base font-extrabold capitalize transition ${body === b ? 'bg-cream text-ink' : 'clay text-cream/70 ring-1 ring-white/12'}`}
              >
                <Avatar look={{ ...look, body: b, hair: DEFAULT_HAIR[b] }} className="size-8 rounded-full bg-[#e9d9cf]" />
                {b}
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
            Start exploring
          </button>
        </form>
      </div>
    </motion.div>
  )
}
