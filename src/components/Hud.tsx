import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { levelInfo } from '../state/game'
import { Avatar } from '../scene/Figurine'
import { Coin } from './Icon'

/** Avatar wrapped in a level-progress ring, with the level number as a badge. */
export function AvatarLevel({ onClick, size = 40 }: { onClick: () => void; size?: number }) {
  const { state } = useGame()
  const lv = levelInfo(state.xp)
  const r = size / 2 + 2.5
  const c = 2 * Math.PI * r
  return (
    <button onClick={onClick} className="relative shrink-0 rounded-full" style={{ width: size + 8, height: size + 8 }} aria-label={`Profile: ${state.name}, level ${lv.level}, ${lv.into} of ${lv.span} XP to next level`}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size + 8} ${size + 8}`} aria-hidden="true">
        <circle cx={size / 2 + 4} cy={size / 2 + 4} r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="3" />
        <motion.circle
          cx={size / 2 + 4} cy={size / 2 + 4} r={r} fill="none" stroke="var(--color-gold)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - lv.pct) }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      <Avatar look={state.look} className="absolute inset-1 rounded-full bg-gradient-to-b from-[#fff3e2] to-[#d9c7d0]" />
      <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-extrabold text-ink ring-2 ring-ink">{lv.level}</span>
    </button>
  )
}

export function CoinsPill() {
  const { state } = useGame()
  return (
    <motion.div key={state.coins} initial={{ scale: 1.18 }} animate={{ scale: 1 }} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full clay pl-1.5 pr-3" aria-label={`${state.coins} coins`}>
      <Coin />
      <span className="text-sm font-extrabold tabular-nums">{state.coins}</span>
    </motion.div>
  )
}
