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

export function Hud({ onProfile }: { onProfile: () => void }) {
  const { state } = useGame()
  const lv = levelInfo(state.xp)
  return (
    <header className="relative z-20 flex items-center gap-3 bg-ink px-4 pb-2 pt-[max(12px,calc(env(safe-area-inset-top)+14px))]">
      <button
        onClick={onProfile}
        className="flex min-w-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-white/5"
        aria-label={`Profile: ${state.name}, level ${lv.level}`}
      >
        <Avatar look={state.look} className="size-10 shrink-0 rounded-full bg-gradient-to-b from-[#fff3e2] to-[#d9c7d0] ring-2 ring-white/25" />
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-extrabold leading-tight">{state.name}</span>
          <span className="block truncate text-[11px] font-semibold text-lav-soft/80">{state.title ?? 'Wanderer'}</span>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full clay py-1.5 pl-1.5 pr-3" title={`${lv.into} / ${lv.span} XP to next level`}>
          <span className="grid size-6 place-items-center rounded-full bg-gold text-xs font-extrabold text-ink">{lv.level}</span>
          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Level progress" aria-valuenow={Math.round(lv.pct * 100)} aria-valuemin={0} aria-valuemax={100}>
            <motion.span className="block h-full rounded-full bg-gradient-to-r from-peach to-gold" animate={{ width: `${lv.pct * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          </span>
        </div>
        <motion.div
          key={state.coins}
          initial={{ scale: 1.18 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 rounded-full clay py-1.5 pl-1.5 pr-3"
          aria-label={`${state.coins} coins`}
        >
          <Coin />
          <span className="text-sm font-extrabold tabular-nums">{state.coins}</span>
        </motion.div>
      </div>
    </header>
  )
}
