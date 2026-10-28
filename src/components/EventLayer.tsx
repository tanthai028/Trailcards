import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame, type GameEvent } from '../state/store'
import { ACH_BY_ID } from '../data/achievements'
import { Figurine } from '../scene/Figurine'
import { ProfilePic } from './ProfilePic'
import { Icon } from './Icon'
import { celebrate } from '../fx/FxLayer'
import { playAchievement, playLevelUp } from '../fx/sound'

/** Toasts (achievements, streaks, small notes) and the level-up celebration. */
export function EventLayer() {
  const { events, dismiss, state } = useGame()
  const toasts = events.filter((e) => e.kind !== 'levelUp').slice(0, 3)
  const levelUp = events.find((e) => e.kind === 'levelUp') as Extract<GameEvent, { kind: 'levelUp' }> | undefined

  useEffect(() => {
    if (!levelUp) return
    playLevelUp()
    celebrate()
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
            className="absolute inset-0 z-50 grid place-items-center bg-ink/80 p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-modal="true" aria-label={`Level ${levelUp.level} reached`}
          >
            <motion.div
              className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-gradient-to-b from-[#ffe6c9] to-paper p-6 text-center text-ink shadow-2xl"
              initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_70%,rgba(255,210,122,.8),transparent_65%)]" />
              {/* a happy double hop once the card lands */}
              <motion.div className="relative" animate={{ y: [0, 0, -22, 0, -10, 0] }} transition={{ duration: 1.1, times: [0, 0.25, 0.45, 0.65, 0.8, 1], ease: 'easeOut' }}>
                {state.photo ? (
                  <ProfilePic look={state.look} photo={state.photo} className="mx-auto mb-3 size-32 ring-4 ring-white shadow-xl" />
                ) : (
                  <Figurine look={state.look} className="mx-auto -mb-1 h-48 drop-shadow-[0_10px_14px_rgba(0,0,0,.25)]" />
                )}
              </motion.div>
              <p className="relative text-xs font-black text-coral">Level up</p>
              <h2 className="relative font-display text-5xl font-bold">Level {levelUp.level}</h2>
              <p className="relative mt-3 text-sm text-ink/70">Your curiosity is paying off.</p>
              <div className="relative mt-5 flex gap-2">
                <button autoFocus onClick={() => dismiss(levelUp.id)} className="clay-btn clay-ink flex-1 py-3">Keep learning</button>
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
    if (e.kind === 'achievement' || e.kind === 'streak') playAchievement()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
      </>
    )
  } else if (e.kind === 'streak') {
    body = (
      <>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-peach to-gold text-[#5a3208]">
          <Icon name="flame" size={20} filled />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-extrabold text-gold">Daily goal done</span>
          <span className="block font-extrabold">{e.days === 1 ? 'Day 1 of your streak' : `${e.days}-day streak!`}</span>
          <span className="block truncate text-xs text-cream/70">Come back tomorrow to keep it going.</span>
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
