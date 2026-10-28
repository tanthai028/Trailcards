import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { DESTINATIONS, ITEM_BY_ID, VAN_TIERS, VAN_TIER_NAMES } from '../data/items'
import { ACHIEVEMENTS } from '../data/achievements'
import { levelInfo, plantInfo, reviewQueue, stats, unlockedDestinations, vanTier, PLANT_STAGES } from '../state/game'
import { VanExterior } from '../scene/VanExterior'
import { Figurine } from '../scene/Figurine'
import { art } from '../scene/assets'
import { FEATHER, stageBackground } from '../scene/stage'
import { SceneSvg, DESTINATION_SCENE } from '../art/Landscape'
import { Cat, Plant } from '../art/Companions'
import { Coin, Icon } from '../components/Icon'
import { CoinsPill } from '../components/Hud'
import { Trophy } from '../components/Trophy'
import { sparkle } from '../fx/FxLayer'
import { playUnlock } from '../fx/sound'
import type { Tab } from '../components/NavBar'
import type { FeedMode } from './FeedScreen'

type View = 'interior' | 'exterior'

const MOCHI_LINES = [
  'Mochi slow-blinks at you. That means trust.',
  'Mochi kneads the blanket. Very important work.',
  'Mochi watches a moth with great scientific interest.',
  'Mochi purrs. (Not always happiness — but this time, yes.)',
  'Mochi’s whiskers twitch. Measuring the doorway, probably.',
]

export function HomeScreen({ go }: { go: (t: Tab, m?: FeedMode) => void }) {
  const { state, buy, setDestination } = useGame()
  const stageRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState(0)
  const upgrade = (id: string) => {
    setView('interior')
    if (!buy(id)) return
    playUnlock()
    setGlow((g) => g + 1)
    const r = stageRef.current?.getBoundingClientRect()
    if (r) sparkle(r.left + r.width / 2, r.top + r.height / 2)
  }
  const [view, setView] = useState<View>('interior')
  const [line, setLine] = useState<string | null>(null)
  const [pets, setPets] = useState(0)
  const plant = plantInfo(state)
  const lv = levelInfo(state.xp).level
  const unlocked = unlockedDestinations(state)
  const dest = DESTINATIONS.find((d) => d.id === state.destination) ?? DESTINATIONS[0]
  const s = stats(state)
  const review = reviewQueue(state).length
  const tier = vanTier(state)
  const next = tier < VAN_TIERS.length ? ITEM_BY_ID[VAN_TIERS[tier]] : null

  const petMochi = () => {
    setPets((p) => p + 1)
    setLine(MOCHI_LINES[pets % MOCHI_LINES.length])
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain px-4 pb-8">
      {/* View switch */}
      <div className="mb-3 flex items-center justify-between">
      <div role="tablist" aria-label="Van view" className="flex w-fit rounded-full clay p-1">
        {(['interior', 'exterior'] as View[]).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`relative min-h-9 rounded-full px-4 text-xs font-extrabold capitalize transition ${view === v ? 'text-ink' : 'text-cream/60 hover:text-cream'}`}
          >
            {view === v && <motion.span layoutId="van-view" className="absolute inset-0 rounded-full bg-cream" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{v}</span>
          </button>
        ))}
      </div>
      <CoinsPill />
      </div>

      {/* The stage: one complete room render per upgrade tier, with you standing beside it */}
      <div ref={stageRef} className="relative aspect-square overflow-hidden rounded-[30px]" style={{ background: stageBackground(view, state.destination), transition: 'background .4s' }}>
        {/* warm flash behind the new room when an upgrade lands */}
        <AnimatePresence>
          {glow > 0 && (
            <motion.div
              key={glow}
              className="pointer-events-none absolute inset-0 z-10"
              style={{ background: 'radial-gradient(circle at 50% 55%, rgba(255,214,130,.85), rgba(255,214,130,0) 65%)' }}
              initial={{ opacity: 0.95 }} animate={{ opacity: 0 }} transition={{ duration: 1.3, ease: 'easeOut' }}
              onAnimationComplete={() => setGlow(0)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view === 'interior' ? `room-${tier}` : `ext-${state.destination}`}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.3, 0.7, 0.2, 1] }}
          >
            {view === 'interior' ? <Room tier={tier} /> : <VanExterior destination={state.destination} />}
          </motion.div>
        </AnimatePresence>

        {/* Your figurine stands on the stage floor, like a collectible beside a dollhouse. */}
        <button onClick={() => go('closet')} aria-label="Change your look" className="absolute bottom-[3%] right-[4%] w-[17%]">
          <span className="absolute -bottom-[2%] left-1/2 w-[110%] -translate-x-1/2" style={{ aspectRatio: '3.4', background: 'radial-gradient(closest-side, rgba(40,30,50,.35), transparent)' }} />
          <Figurine look={state.look} className="cq-idle relative w-full" />
        </button>

        <div className="pointer-events-none absolute left-3 top-3 rounded-2xl bg-ink/75 px-3 py-1.5 text-cream">
          <p className="text-xs font-extrabold text-gold">{view === 'interior' ? VAN_TIER_NAMES[tier] : 'Parked at'}</p>
          <p className="font-display text-lg font-bold leading-tight">{view === 'interior' ? `${state.name}’s van` : dest.name}</p>
        </div>
      </div>

      {/* Next upgrade: one tap */}
      <div className="relative z-10 -mt-6 px-3">
        {next ? (
          <div className="flex items-center gap-3 rounded-3xl bg-paper p-2 text-ink shadow-xl">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl" style={{ background: stageBackground('interior', '') }}>
              {art(`van-${tier + 1}`) && <img src={art(`van-${tier + 1}`)} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[#b0576a]">Next upgrade</p>
              <p className="truncate text-sm font-extrabold">{next.name}</p>
              <p className="truncate text-[12px] text-ink/60">{next.blurb}</p>
            </div>
            <button
              onClick={() => upgrade(next.id)}
              disabled={state.coins < next.cost}
              className="flex min-h-11 shrink-0 items-center gap-1.5 clay-btn clay-ink px-3.5 text-sm disabled:bg-ink/15 disabled:text-ink/50"
            >
              <Coin size={15} />
              {state.coins < next.cost ? `Need ${next.cost - state.coins}` : next.cost}
            </button>
          </div>
        ) : (
          <p className="rounded-3xl bg-paper px-4 py-3 text-center text-[13px] font-bold text-ink shadow-xl">Dream van complete. Mochi approves.</p>
        )}
      </div>

      {/* Plant + Mochi */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => go('feed', 'review')} className="rounded-3xl bg-gradient-to-b from-sage/20 to-white/5 p-3 text-left">
          <div className="flex items-end gap-2">
            <Sprite name={`plant-${plant.stage}`} className="h-16 w-12 shrink-0">{(cls) => <Plant stage={plant.stage} className={cls} />}</Sprite>
            <div className="min-w-0 pb-1">
              <p className="text-xs font-extrabold text-sage">Field plant</p>
              <p className="font-display text-lg font-bold leading-tight">{plant.name}</p>
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Plant growth" aria-valuenow={Math.round(plant.pct * 100)} aria-valuemin={0} aria-valuemax={100}>
            <motion.div className="h-full rounded-full bg-gradient-to-r from-sage to-[#c6f0a0]" animate={{ width: `${plant.pct * 100}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-cream/60">
            {plant.nextAt ? `${plant.points}/${plant.nextAt} growth to ${PLANT_STAGES[plant.stage + 1].name}` : 'Fully bloomed!'} · grows with right answers and Review.
          </p>
        </button>
        <button onClick={petMochi} className="flex flex-col rounded-3xl bg-gradient-to-b from-peach/20 to-white/5 p-3 text-left" aria-label="Pet Mochi">
          <div className="flex items-end gap-2">
            <Sprite name="cat" className="h-14 w-16 shrink-0">{(cls) => <Cat sleeping className={cls} />}</Sprite>
            <div className="min-w-0 pb-1">
              <p className="text-xs font-extrabold text-peach">Companion</p>
              <p className="font-display text-lg font-bold leading-tight">Mochi</p>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.p key={line ?? 'idle'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-[11px] leading-snug text-cream/70" role="status">
              {line ?? (review > 0 ? `${review} concept${review === 1 ? '' : 's'} to review. Tap to say hi.` : s.explored === 0 ? 'Waiting for your first field note. Tap to say hi.' : 'All caught up. Tap to say hi.')}
            </motion.p>
          </AnimatePresence>
        </button>
      </div>

      {/* Destinations */}
      <Section title="Destinations" hint={`Level ${lv}`}>
        <div className="grid grid-cols-3 gap-2">
          {DESTINATIONS.map((d) => {
            const open = unlocked.includes(d.id)
            const here = state.destination === d.id
            return (
              <button
                key={d.id}
                disabled={!open}
                onClick={() => { setDestination(d.id); setView('exterior') }}
                aria-pressed={here}
                className={`relative overflow-hidden rounded-2xl text-left ring-2 transition ${here ? 'ring-gold' : 'ring-transparent hover:ring-white/30'} disabled:cursor-not-allowed`}
              >
                <SceneSvg scene={DESTINATION_SCENE[d.id]} still className={`h-20 w-full ${open ? '' : 'blur-[1.5px] grayscale-[.6]'}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
                <div className="absolute inset-x-2 bottom-1.5">
                  <p className="truncate text-[12px] font-extrabold leading-tight">{d.name}</p>
                  {!open && <p className="flex items-center gap-1 text-[10px] font-bold text-cream/70"><Icon name="lock" size={10} /> Level {d.level}</p>}
                </div>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Trophy shelf */}
      <Section title="Trophy shelf" hint={`${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length}`}>
        <div className="rounded-3xl bg-gradient-to-b from-[#3b2d4f] to-[#2c2340] p-3 pb-0">
          <div className="grid grid-cols-6 gap-1">
            {ACHIEVEMENTS.slice(0, 12).map((a) => (
              <div key={a.id} className="flex justify-center"><Trophy a={a} earned={!!state.achievements[a.id]} size={42} /></div>
            ))}
          </div>
          <div className="-mx-3 mt-1 h-3 rounded-b-3xl bg-gradient-to-b from-[#a8744e] to-[#7a5136]" />
        </div>
      </Section>
    </div>
  )
}

/** The van interior for an upgrade tier: one complete render, everything painted in place. */
function Room({ tier }: { tier: number }) {
  const src = art(`van-${tier}`)
  if (!src) return null
  return <img src={src} alt={`Inside your van: ${VAN_TIER_NAMES[tier]}`} draggable={false} className="h-full w-full select-none" style={FEATHER} />
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        {hint && <span className="text-xs font-bold text-cream/45">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

/** A rendered sprite by name, falling back to its SVG version. */
function Sprite({ name, className, children }: { name: string; className: string; children: (cls: string) => ReactNode }) {
  const src = art(name)
  return src ? <img src={src} alt="" className={`object-contain object-bottom ${className}`} /> : <>{children(className)}</>
}
