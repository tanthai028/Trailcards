import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame, type GameEvent } from '../state/store'
import { ACH_BY_ID } from '../data/achievements'
import { ProfilePic } from './ProfilePic'
import { Icon } from './Icon'
import { celebrate } from '../fx/FxLayer'
import { playAchievement, playLevelUp } from '../fx/sound'
import { haptic } from '../fx/haptics'

/** Toasts (achievements, streaks, small notes) and the level-up celebration. */
export function EventLayer() {
  const { events, dismiss, shown, state } = useGame()
  // one at a time; the rest wait their turn
  const toasts = events.filter((e) => e.kind !== 'levelUp').slice(0, 1)
  const levelUp = events.find((e) => e.kind === 'levelUp') as Extract<GameEvent, { kind: 'levelUp' }> | undefined

  useEffect(() => {
    if (!levelUp) return
    shown(levelUp.id)
    playLevelUp()
    haptic('heavy')
    celebrate()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss(levelUp.id)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [levelUp, dismiss, shown])

  return (
    <>
      {/* every toast sits in the same grid cell, so one fading out overlaps the next instead of stacking */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-40 grid justify-items-center px-4 [&>*]:col-start-1 [&>*]:row-start-1" aria-live="polite">
        <AnimatePresence>
          {toasts.map((e) => <Toast key={e.id} e={e} onShow={() => shown(e.id)} onDone={() => dismiss(e.id)} />)}
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
                <ProfilePic avatar={state.avatar} frame={state.frame} bg={state.cosmetics.bg} photo={state.photo} className="mx-auto mb-3 size-32 drop-shadow-xl" />
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

function Toast({ e, onShow, onDone }: { e: GameEvent; onShow: () => void; onDone: () => void }) {
  // Achievements and streaks wait a beat, so the answer's own XP and feedback land first
  // instead of being covered by the toast over the Learn header.
  const wait = e.kind === 'toast' ? 0 : 1100
  const [shown, setShown] = useState(wait === 0)
  useEffect(() => {
    const t = setTimeout(() => {
      setShown(true)
      onShow()
      if (e.kind === 'achievement' || e.kind === 'streak') playAchievement()
    }, wait)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    // short confirmations vanish fast; longer hints stay long enough to read
    const t = setTimeout(onDone, wait + (e.kind === 'toast' ? (e.text.length > 40 ? 4200 : 1600) : 3600))
    return () => clearTimeout(t)
    // onDone only removes this event by id, so the first closure is fine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e.id])
  if (!shown) return null

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
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
      className="pointer-events-auto flex w-fit max-w-[19rem] items-center gap-3 rounded-3xl bg-ink-2/95 px-3 py-2.5 text-cream shadow-xl ring-1 ring-white/15 backdrop-blur"
      onClick={onDone}
    >
      {body}
    </motion.div>
  )
}
