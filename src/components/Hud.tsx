import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { levelInfo } from '../state/game'
import { ProfilePic } from './ProfilePic'

/** Each increase of `value` since mount, kept for a moment so it can float up next to the counter. */
function useGains(value: number) {
  const prev = useRef(value)
  const [gains, setGains] = useState<{ id: number; amount: number }[]>([])
  useEffect(() => {
    const amount = value - prev.current
    prev.current = value
    if (amount <= 0) return
    const id = performance.now()
    setGains((g) => [...g, { id, amount }])
    const t = setTimeout(() => setGains((g) => g.filter((x) => x.id !== id)), 1100)
    return () => clearTimeout(t)
  }, [value])
  return gains
}

/** "+10" chips that pop in under a counter and drift down as they fade. */
function GainFloats({ gains, className, children }: { gains: { id: number; amount: number }[]; className: string; children: (amount: number) => React.ReactNode }) {
  return (
    <AnimatePresence>
      {gains.map((g) => (
        <motion.span
          key={g.id}
          initial={{ opacity: 0, y: -6, scale: 0.7 }}
          animate={{ opacity: 1, y: 4, scale: 1 }}
          exit={{ opacity: 0, y: 12, transition: { duration: 0.3 } }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className={`pointer-events-none absolute left-1/2 top-full z-30 -ml-6 flex w-12 justify-center ${className}`}
          aria-hidden="true"
        >
          <span className="flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-extrabold shadow-md">{children(g.amount)}</span>
        </motion.span>
      ))}
    </AnimatePresence>
  )
}

/** Your picture with a level badge whose ring fills with XP toward the next level. */
export function AvatarLevel({ onClick, size = 40 }: { onClick: () => void; size?: number }) {
  const { state } = useGame()
  const lv = levelInfo(state.xp)
  const gains = useGains(state.xp)
  // remember the level we last showed, so only a real level-up pulses (not the first render)
  const shown = useRef(lv.level)
  const [pulse, setPulse] = useState(0)
  useEffect(() => {
    if (lv.level > shown.current) setPulse((p) => p + 1)
    shown.current = lv.level
  }, [lv.level])
  const c = 2 * Math.PI * 10
  return (
    <button onClick={onClick} className="relative shrink-0 rounded-full" style={{ width: size + 8, height: size + 8 }} aria-label={`Profile: ${state.name}, level ${lv.level}, ${lv.span - lv.into} XP to level ${lv.level + 1}`}>
      <ProfilePic avatar={state.avatar} frame={state.frame} bg={state.cosmetics.bg} photo={state.photo} className="absolute inset-1" />
      {/* the level badge: its ring fills with XP toward the next level */}
      <span className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-full bg-ink">
        <svg viewBox="0 0 24 24" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="2.6" />
          <motion.circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-gold)" strokeWidth="2.6" strokeLinecap="round"
            strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - lv.pct) }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        </svg>
        <span className="relative text-[10px] font-extrabold tabular-nums text-gold">{lv.level}</span>
      </span>
      <GainFloats gains={gains} className="[&>span]:bg-lav [&>span]:text-[#22183a]">{(n) => `+${n} XP`}</GainFloats>
      <AnimatePresence>
        {pulse > 0 && (
          <motion.span
            key={pulse}
            className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-gold"
            initial={{ scale: 1, opacity: 0.95 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}
            onAnimationComplete={() => setPulse(0)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </button>
  )
}
