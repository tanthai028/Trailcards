import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { DESTINATIONS, ITEMS, RARITY_STYLE } from '../data/items'
import { ACHIEVEMENTS } from '../data/achievements'
import { levelInfo, plantInfo, reviewQueue, stats, unlockedDestinations, PLANT_STAGES } from '../state/game'
import { VanScene } from '../art/VanScene'
import { SceneSvg, DESTINATION_SCENE } from '../art/Landscape'
import { Cat, Plant } from '../art/Companions'
import { Coin, Icon } from '../components/Icon'
import { Trophy } from '../components/Trophy'
import type { Tab } from '../components/NavBar'
import type { FeedMode } from './FeedScreen'

const MOCHI_LINES = [
  'Mochi slow-blinks at you. That means trust.',
  'Mochi kneads the blanket. Very important work.',
  'Mochi watches a moth with great scientific interest.',
  'Mochi purrs. (Not always happiness — but this time, yes.)',
  'Mochi’s whiskers twitch. Measuring the doorway, probably.',
]

export function HomeScreen({ go }: { go: (t: Tab, m?: FeedMode) => void }) {
  const { state, buy, toggleDecor, setDestination } = useGame()
  const [catAwake, setCatAwake] = useState(false)
  const [line, setLine] = useState<string | null>(null)
  const [hearts, setHearts] = useState(0)
  const plant = plantInfo(state)
  const lv = levelInfo(state.xp).level
  const unlocked = unlockedDestinations(state)
  const decor = ITEMS.filter((i) => i.slot === 'decor')
  const shown = state.owned.filter((id) => id.startsWith('decor-') && !state.hiddenDecor.includes(id))
  const dest = DESTINATIONS.find((d) => d.id === state.destination) ?? DESTINATIONS[0]
  const s = stats(state)
  const review = reviewQueue(state).length

  const petCat = () => {
    setCatAwake(true)
    setHearts((h) => h + 1)
    setLine(MOCHI_LINES[hearts % MOCHI_LINES.length])
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pb-8">
      {/* The scene */}
      <div className="grain relative aspect-[4/3.3] overflow-hidden rounded-[30px] ring-1 ring-white/10">
        <VanScene
          look={state.look}
          destination={state.destination}
          decor={shown}
          plantStage={plant.stage}
          catAwake={catAwake}
          onCat={petCat}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute left-3 top-3 rounded-2xl bg-ink/55 px-3 py-1.5 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">Parked at</p>
          <p className="font-display text-lg font-bold leading-tight">{dest.name}</p>
        </div>
        <AnimatePresence>
          {Array.from({ length: hearts }, (_, i) => i).slice(-3).map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute text-coral"
              style={{ left: state.owned.includes('decor-chair') && shown.includes('decor-chair') ? '70%' : '42%', top: state.owned.includes('decor-chair') && shown.includes('decor-chair') ? '68%' : '42%' }}
              initial={{ opacity: 1, y: 0, scale: 0.6 }}
              animate={{ opacity: 0, y: -50, scale: 1.2 }}
              transition={{ duration: 1.2 }}
              aria-hidden="true"
            >
              <Icon name="heart" size={22} filled />
            </motion.span>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {line && (
            <motion.button
              key={line}
              onClick={() => setLine(null)}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute inset-x-3 bottom-3 rounded-2xl bg-paper/95 px-4 py-2.5 text-left text-[13px] font-bold text-ink shadow-lg"
              role="status"
            >
              {line}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {!line && <p className="mt-2 text-center text-[11px] font-semibold text-cream/40">Tap Mochi to say hi</p>}

      {/* Plant + Mochi */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-gradient-to-b from-sage/20 to-white/5 p-3 ring-1 ring-white/10">
          <div className="flex items-end gap-2">
            <Plant stage={plant.stage} className="h-16 w-12 shrink-0" />
            <div className="min-w-0 pb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-sage">Field plant</p>
              <p className="font-display text-lg font-bold leading-tight">{plant.name}</p>
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Plant growth" aria-valuenow={Math.round(plant.pct * 100)} aria-valuemin={0} aria-valuemax={100}>
            <motion.div className="h-full rounded-full bg-gradient-to-r from-sage to-[#c6f0a0]" animate={{ width: `${plant.pct * 100}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-cream/60">
            {plant.nextAt ? `${plant.points}/${plant.nextAt} growth to ${PLANT_STAGES[plant.stage + 1].name}` : 'Fully bloomed!'} · grows with right answers and mastery.
          </p>
        </div>
        <div className="flex flex-col rounded-3xl bg-gradient-to-b from-peach/20 to-white/5 p-3 ring-1 ring-white/10">
          <div className="flex items-end gap-2">
            <Cat sleeping={!catAwake} className="h-14 w-16 shrink-0" />
            <div className="min-w-0 pb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-peach">Companion</p>
              <p className="font-display text-lg font-bold leading-tight">Mochi</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-cream/60">
            {review > 0 ? `${review} concept${review === 1 ? '' : 's'} to review. Mochi will supervise.` : s.explored === 0 ? 'Mochi is waiting for your first field note.' : 'All caught up. Mochi is very proud.'}
          </p>
          {review > 0 && (
            <button onClick={() => go('feed', 'review')} className="mt-auto rounded-xl bg-white/10 py-1.5 text-xs font-extrabold hover:bg-white/15">Start review</button>
          )}
        </div>
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
                onClick={() => setDestination(d.id)}
                aria-pressed={here}
                className={`relative overflow-hidden rounded-2xl text-left ring-2 transition ${here ? 'ring-gold' : 'ring-transparent hover:ring-white/30'} disabled:cursor-not-allowed`}
              >
                <SceneSvg scene={DESTINATION_SCENE[d.id]} className={`h-20 w-full ${open ? '' : 'blur-[1.5px] grayscale-[.6]'}`} />
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

      {/* Decor */}
      <Section title="Decorate" hint={`${shown.length} out`}>
        <ul className="grid grid-cols-2 gap-2">
          {decor.map((it) => {
            const own = state.owned.includes(it.id)
            const out = own && !state.hiddenDecor.includes(it.id)
            const r = RARITY_STYLE[it.rarity]
            return (
              <li key={it.id}>
                <button
                  onClick={() => (own ? toggleDecor(it.id) : buy(it.id))}
                  disabled={!own && state.coins < it.cost}
                  className="flex w-full items-center gap-2.5 rounded-2xl bg-white/6 p-2 text-left ring-1 ring-white/8 transition hover:bg-white/10 disabled:opacity-60"
                  aria-label={own ? `${out ? 'Put away' : 'Set out'} ${it.name}` : `Buy ${it.name} for ${it.cost} coins`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: `${r.color}26` }}>
                    <DecorThumb id={it.id} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-extrabold">{it.name}</span>
                    {own ? (
                      <span className={`text-[11px] font-bold ${out ? 'text-sage' : 'text-cream/45'}`}>{out ? 'Out at camp' : 'Packed away'}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-gold"><Coin size={12} />{it.cost}</span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Trophy shelf */}
      <Section title="Trophy shelf" hint={`${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length}`}>
        <div className="rounded-3xl bg-gradient-to-b from-[#3b2d4f] to-[#2c2340] p-3 pb-0 ring-1 ring-white/10">
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

function DecorThumb({ id }: { id: string }) {
  const common = { width: 30, height: 30, viewBox: '0 0 30 30', 'aria-hidden': true } as const
  switch (id) {
    case 'decor-bunting':
      return <svg {...common}><path d="M2,8 Q15,14 28,8" stroke="#ccc" fill="none" />{[6, 12, 18, 24].map((x, i) => <path key={x} d={`M${x - 3},${9 + (i % 2)} L${x + 3},${9 + (i % 2)} L${x},${18}Z`} fill={['#ff8f7a', '#ffd27a', '#7f8fd0', '#8fc9a3'][i]} />)}</svg>
    case 'decor-lights':
      return <svg {...common}><path d="M2,8 Q15,20 28,8" stroke="#888" fill="none" />{[6, 11, 16, 21, 25].map((x, i) => <circle key={x} cx={x} cy={[11, 14, 15, 14, 11][i]} r="2.4" fill={['#ffd27a', '#ffb3c1', '#b6f0d6', '#ffd27a', '#fff4e6'][i]} />)}</svg>
    case 'decor-chair':
      return <svg {...common}><path d="M6,26 L22,6 M22,26 L6,6" stroke="#9a96b8" strokeWidth="2" /><path d="M4,9 L26,9 L24,18 L6,18Z" fill="#ff8f7a" /><path d="M9,9 V18 M15,9 V18 M21,9 V18" stroke="#fff4e6" strokeWidth="2" /></svg>
    case 'decor-fire':
      return <svg {...common}><path d="M6,26 L24,22 M6,22 L24,26" stroke="#7a5136" strokeWidth="3" strokeLinecap="round" /><path d="M15,4 C21,11 22,16 18,22 C16,18 14,18 12,22 C8,17 10,10 15,4Z" fill="#ff8a4a" /><path d="M15,12 C18,16 18,19 16,22 C15,20 14,20 13,22 C11,19 12,15 15,12Z" fill="#ffe08a" /></svg>
    case 'decor-surfboard':
      return <svg {...common}><path d="M4,24 Q12,2 26,4 Q22,18 4,24Z" fill="#6fd3d0" /><path d="M6,22 Q14,8 24,6" stroke="#fff4e6" strokeWidth="1.6" fill="none" /></svg>
    default:
      return <svg {...common}><path d="M8,28 L14,14 L20,28 M14,14 V28" stroke="#9a96b8" strokeWidth="2" strokeLinecap="round" /><rect x="3" y="7" width="22" height="7" rx="3" fill="#e8dccb" transform="rotate(-28 14 10)" /><rect x="20" y="3" width="6" height="9" rx="2" fill="#7f8fd0" transform="rotate(-28 14 10)" /></svg>
  }
}
