// Mochi lives around the edge of the Learn card: every so often Mochi peeks up from behind the
// card's bottom edge, strolls along it, or leans in from the side, and pops up to cheer a run
// of right answers. Tap Mochi while peeking for a line. Hidden with Reduce motion.
import { useEffect, useRef, useState, type RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cat } from '../art/Companions'

const LINES = [
  'Mochi slow-blinks at you. That means trust.',
  'Mochi kneads the card. Very important work.',
  'Mochi watches a moth with great scientific interest.',
  'Mochi purrs. Keep going.',
  'Mochi’s whiskers twitch. Measuring the next card, probably.',
]
const CHEERS = ['Mochi is impressed!', 'Mochi’s tail is going wild.', 'Mochi does a tiny happy hop.']

type Act = { kind: 'peek' | 'walk' | 'side'; x: number; flip: boolean; cheer?: string; key: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/** `cheer` changes when there's something to celebrate (a run of right answers). `scroller` is the
 *  feed, so Mochi can ride along with the card Mochi appeared on. */
export function MochiPeek({ cheer, off, scroller }: { cheer: number; off: boolean; scroller: RefObject<HTMLElement> }) {
  const [act, setAct] = useState<Act | null>(null)
  const [line, setLine] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const layer = useRef<HTMLDivElement>(null)

  // the next visit, a while after the last one ends
  const later = (ms: number) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (document.visibilityState !== 'visible') return later(5000)
      const kind = pick(['peek', 'peek', 'walk', 'side'] as const)
      setAct({ kind, x: rand(12, 62), flip: Math.random() < 0.5, key: Date.now() })
    }, ms)
  }
  useEffect(() => {
    if (off) { setAct(null); return }
    later(rand(6000, 12000))
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [off])

  useEffect(() => {
    if (!cheer || off) return
    clearTimeout(timer.current)
    setAct({ kind: 'peek', x: rand(20, 55), flip: false, cheer: pick(CHEERS), key: Date.now() })
  }, [cheer, off])

  useEffect(() => {
    if (!line) return
    const t = setTimeout(() => setLine(null), 2600)
    return () => clearTimeout(t)
  }, [line])

  const done = () => { setAct(null); setLine(null); later(rand(18000, 40000)) }

  // Mochi sits on the card Mochi appeared on: when the feed scrolls, Mochi moves with that card
  // (set straight on the style, no re-render per frame) and leaves once the card is off screen.
  useEffect(() => {
    const el = scroller.current, box = layer.current
    if (!act || !el || !box) return
    const base = el.scrollTop
    const onScroll = () => {
      const d = el.scrollTop - base
      box.style.transform = d ? `translateY(${-d}px)` : ''
      if (Math.abs(d) >= el.clientHeight) done()
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); box.style.transform = '' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act?.key])

  if (off) return null

  // warm like the "in a row" badge, so it doesn't read as the dark Undo button beside it
  const bubble = (text: string) => (
    <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="absolute bottom-full left-1/2 mb-1 w-max max-w-[11rem] -translate-x-1/2 rounded-2xl bg-gradient-to-r from-peach to-gold px-2.5 py-1.5 text-center text-[11px] font-extrabold leading-snug text-[#5a3208] shadow-lg">
      {text}
    </motion.span>
  )

  return (
    // clipped to the feed, so Mochi riding a card down never lands on the tab bar
    <div ref={layer} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {/* bottom edge of the card: Mochi rises from behind it, or walks along it */}
      <div className="pointer-events-none absolute inset-x-4 bottom-2 z-20 h-32 overflow-hidden rounded-b-[28px]" aria-hidden={!act}>
        <AnimatePresence>
          {act && act.kind !== 'side' && (
            <motion.button
              key={act.key}
              type="button"
              aria-label="Pet Mochi"
              onClick={() => setLine(pick(LINES))}
              className={`absolute bottom-0 w-20 ${act.kind === 'peek' ? 'pointer-events-auto' : ''}`}
              style={{ left: act.kind === 'peek' ? `${act.x}%` : undefined }}
              initial={act.kind === 'peek' ? { y: '100%' } : { left: act.flip ? '105%' : '-25%', y: '12%' }}
              animate={act.kind === 'peek'
                ? { y: ['100%', '10%', '10%', '100%'], transition: { duration: act.cheer ? 3.2 : 4.5, times: [0, 0.14, 0.86, 1], ease: 'easeInOut' } }
                : { left: act.flip ? '-25%' : '105%', transition: { duration: 9, ease: 'linear' } }}
              onAnimationComplete={done}
            >
              <motion.span className="relative block" animate={act.kind === 'walk' ? { y: [0, -3, 0] } : act.cheer ? { y: [0, -8, 0, -4, 0] } : undefined}
                transition={act.kind === 'walk' ? { repeat: Infinity, duration: 0.45 } : { delay: 0.5, duration: 0.8 }}>
                <AnimatePresence>{(line || act.cheer) && bubble(line ?? act.cheer!)}</AnimatePresence>
                <Cat className={`block h-16 w-20 ${act.flip ? '-scale-x-100' : ''}`} />
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* left edge, around the middle of the card: Mochi leans in sideways */}
      <div className="pointer-events-none absolute left-4 top-[42%] z-20 h-24 w-24 overflow-hidden" aria-hidden="true">
        <AnimatePresence>
          {act?.kind === 'side' && (
            <motion.span
              key={act.key}
              className="absolute left-0 top-2 block w-20 origin-center"
              style={{ rotate: 90 }}
              initial={{ x: '-100%' }}
              animate={{ x: ['-100%', '-38%', '-38%', '-100%'], transition: { duration: 4, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' } }}
              onAnimationComplete={done}
            >
              <Cat className="block h-16 w-20" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
