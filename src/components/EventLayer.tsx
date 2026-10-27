import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame, type GameEvent } from '../state/store'
import { ACH_BY_ID } from '../data/achievements'
import { DESTINATIONS } from '../data/items'
import { PLANT_STAGES } from '../state/game'
import { Figurine } from '../scene/Figurine'
import { Plant } from '../art/Companions'
import { Coin, Icon } from './Icon'
import type { Tab } from './NavBar'

/** Toasts (achievements, plant growth, small notes) and the level-up celebration. */
export function EventLayer({ go }: { go: (t: Tab) => void }) {
  const { events, dismiss, state } = useGame()
  const toasts = events.filter((e) => e.kind !== 'levelUp').slice(0, 3)
  const levelUp = events.find((e) => e.kind === 'levelUp') as Extract<GameEvent, { kind: 'levelUp' }> | undefined

  useEffect(() => {
    if (!levelUp) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss(levelUp.id)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [levelUp, dismiss])

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence>
          {toasts.map((e) => <Toast key={e.id} e={e} onDone={() => dismiss(e.id)} />)}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {levelUp && (
          <motion.div
            className="absolute inset-0 z-50 grid place-items-center bg-ink/70 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-modal="true" aria-label={`Level ${levelUp.level} reached`}
          >
            <Confetti />
            <motion.div
              className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-gradient-to-b from-[#ffe6c9] to-paper p-6 text-center text-ink shadow-2xl"
              initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_70%,rgba(255,210,122,.8),transparent_65%)]" />
              <Figurine look={state.look} className="relative mx-auto -mb-1 h-48 drop-shadow-[0_10px_14px_rgba(0,0,0,.25)]" />
              <p className="relative text-xs font-black text-coral">Level up</p>
              <h2 className="relative font-display text-5xl font-bold">Level {levelUp.level}</h2>
              {DESTINATIONS.filter((d) => d.level === levelUp.level).map((d) => (
                <p key={d.id} className="relative mt-3 rounded-2xl bg-white/70 px-4 py-2 text-sm font-bold">
                  <Icon name="map" size={16} className="mr-1 inline align-[-3px]" /> New destination: {d.name}
                </p>
              ))}
              <p className="relative mt-3 text-sm text-ink/70">Your curiosity is taking you places.</p>
              <div className="relative mt-5 flex gap-2">
                {DESTINATIONS.some((d) => d.level === levelUp.level) && (
                  <button onClick={() => { dismiss(levelUp.id); go('van') }} className="clay-btn clay-cream flex-1 py-3">Visit van</button>
                )}
                <button autoFocus onClick={() => dismiss(levelUp.id)} className="clay-btn clay-ink flex-1 py-3">Keep exploring</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Toast({ e, onDone }: { e: GameEvent; onDone: () => void }) {
  useEffect(() => {
    // short confirmations vanish fast; longer hints stay long enough to read
    const t = setTimeout(onDone, e.kind === 'toast' ? (e.text.length > 40 ? 4200 : 1600) : 3600)
    return () => clearTimeout(t)
    // onDone only removes this event by id, so the first closure is fine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e.id])

  let body
  if (e.kind === 'achievement') {
    const a = ACH_BY_ID[e.achId]
    body = (
      <>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-gold to-peach text-ink">
          <Icon name={a.icon} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-extrabold text-gold">Achievement</span>
          <span className="block truncate font-extrabold">{a.name}</span>
          <span className="block truncate text-xs text-cream/70">Title unlocked: “{a.title}”</span>
        </span>
        <span className="flex items-center gap-1 text-sm font-extrabold text-gold"><Coin size={16} />+{a.coins}</span>
      </>
    )
  } else if (e.kind === 'plant') {
    body = (
      <>
        <Plant stage={e.stage} className="h-11 w-9 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-extrabold text-sage">Your plant grew</span>
          <span className="block font-extrabold">It's now a {PLANT_STAGES[e.stage].name}!</span>
        </span>
      </>
    )
  } else if (e.kind === 'toast') {
    body = <span className="px-1 text-sm font-bold">{e.text}</span>
  }
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-3xl bg-ink-2/95 px-3 py-2.5 text-cream shadow-xl ring-1 ring-white/15 backdrop-blur"
      onClick={onDone}
    >
      {body}
    </motion.div>
  )
}

function Confetti() {
  const colors = ['#ffd27a', '#ff7f8a', '#8fc9a3', '#8ec5ff', '#b49cff']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-1/3 block h-3 w-2 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length] }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: [0, -140 - (i % 5) * 30, 420], x: ((i % 7) - 3) * 22, opacity: [1, 1, 0], rotate: 360 + i * 40 }}
          transition={{ duration: 2.2, ease: 'easeOut', delay: (i % 6) * 0.04 }}
        />
      ))}
    </div>
  )
}
