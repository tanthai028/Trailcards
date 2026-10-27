import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { TOPICS, TOPIC_ORDER, CARDS } from '../data/cards'
import { ACHIEVEMENTS, ACH_BY_ID } from '../data/achievements'
import { ITEMS, RARITY_STYLE, type Slot } from '../data/items'
import { levelInfo, masteryCounts, stats, type Mastery } from '../state/game'
import { Character } from '../art/Character'
import { SceneSvg, DESTINATION_SCENE } from '../art/Landscape'
import { Icon } from '../components/Icon'
import { Trophy } from '../components/Trophy'
import type { Tab } from '../components/NavBar'
import type { FeedMode } from './FeedScreen'

const MASTERY_COLORS: Record<Mastery, string> = { mastered: '#ffd27a', familiar: '#8fc9a3', learning: '#ff9f8a', new: 'rgba(255,255,255,.12)' }

export function ProfileScreen({ go }: { go: (t: Tab, m?: FeedMode) => void }) {
  const { state, setName, setTitle, reset } = useGame()
  const lv = levelInfo(state.xp)
  const s = stats(state)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(state.name)
  const [confirmReset, setConfirmReset] = useState(false)
  const titles = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).map((a) => a.title)

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pb-8">
      {/* Showcase banner */}
      <div className="grain relative overflow-hidden rounded-[30px] ring-1 ring-white/10">
        <SceneSvg scene={DESTINATION_SCENE[state.destination] ?? 'meadow'} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="relative flex items-end gap-3 px-4 pb-4 pt-24">
          <Character look={state.look} idle className="-mb-2 h-40 shrink-0 drop-shadow-xl" />
          <div className="min-w-0 flex-1 pb-2">
            {editing ? (
              <form
                onSubmit={(e) => { e.preventDefault(); setName(draft); setEditing(false) }}
                className="flex gap-1.5"
              >
                <input
                  autoFocus value={draft} maxLength={20} onChange={(e) => setDraft(e.target.value)}
                  aria-label="Display name"
                  className="min-w-0 flex-1 rounded-xl bg-white/15 px-2 py-1 font-display text-xl font-bold outline-none ring-1 ring-white/30 focus:ring-gold"
                />
                <button className="rounded-xl bg-gold px-2.5 text-sm font-black text-ink">Save</button>
              </form>
            ) : (
              <button onClick={() => { setDraft(state.name); setEditing(true) }} className="group flex max-w-full items-center gap-1.5 text-left" aria-label="Edit display name">
                <h1 className="truncate font-display text-3xl font-bold leading-tight">{state.name}</h1>
                <Icon name="edit" size={15} className="shrink-0 opacity-50 group-hover:opacity-100" />
              </button>
            )}
            <label className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-xs font-extrabold text-gold backdrop-blur">
              <Icon name="crown" size={12} />
              <select
                value={state.title ?? ''}
                onChange={(e) => setTitle(e.target.value || null)}
                className="cursor-pointer bg-transparent outline-none [&>option]:text-ink"
                aria-label="Displayed title"
              >
                <option value="">Wanderer</option>
                {titles.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <div className="mt-3">
              <div className="flex items-baseline justify-between text-xs font-bold">
                <span className="text-cream">Level {lv.level}</span>
                <span className="tabular-nums text-cream/60">{state.xp} XP total</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/15">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-peach to-gold" initial={{ width: 0 }} animate={{ width: `${lv.pct * 100}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-cream/50">{lv.span - lv.into} XP to level {lv.level + 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          ['Explored', `${s.explored}/${CARDS.length}`],
          ['Accuracy', s.attempts ? `${s.accuracy}%` : '—'],
          ['Mastered', s.mastered],
          ['Answers', s.attempts],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white/6 px-2 py-3 text-center ring-1 ring-white/8">
            <p className="font-display text-xl font-bold tabular-nums">{v}</p>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-cream/50">{k}</p>
          </div>
        ))}
      </div>

      {/* Mastery tracker */}
      <Section title="Mastery" action={s.learning + s.familiar > 0 ? { label: `Review ${s.learning + s.familiar}`, onClick: () => go('feed', 'review') } : undefined}>
        <div className="space-y-2.5 rounded-3xl bg-white/6 p-4 ring-1 ring-white/8">
          {TOPIC_ORDER.map((t) => {
            const m = masteryCounts(state, t)
            const total = m.new + m.learning + m.familiar + m.mastered
            return (
              <div key={t}>
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span>{TOPICS[t].name}</span>
                  <span className="text-cream/50 tabular-nums">{m.mastered} mastered · {m.familiar + m.mastered}/{total} known</span>
                </div>
                <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-label={`${TOPICS[t].name}: ${m.mastered} mastered, ${m.familiar} familiar, ${m.learning} learning, ${m.new} new`}>
                  {(['mastered', 'familiar', 'learning', 'new'] as Mastery[]).map((k) =>
                    m[k] ? <motion.span key={k} className="h-full" style={{ background: MASTERY_COLORS[k] }} initial={{ flexGrow: 0 }} animate={{ flexGrow: m[k] }} /> : null,
                  )}
                </div>
              </div>
            )
          })}
          <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-bold text-cream/60">
            {(['mastered', 'familiar', 'learning', 'new'] as Mastery[]).map((k) => (
              <span key={k} className="flex items-center gap-1 capitalize"><span className="size-2.5 rounded-full" style={{ background: MASTERY_COLORS[k] }} />{k}</span>
            ))}
          </div>
          <p className="text-[11px] leading-snug text-cream/45">Right once → familiar. Right again in Review → mastered. Misses come back for another try.</p>
        </div>
      </Section>

      {/* Collection */}
      <Section title="Collection" action={{ label: 'Open closet', onClick: () => go('closet') }}>
        <div className="grid grid-cols-2 gap-2">
          {([['outfit', 'Outfits'], ['hair', 'Hairstyles'], ['accessory', 'Extras'], ['decor', 'Van decor']] as [Slot, string][]).map(([slot, label]) => {
            const all = ITEMS.filter((i) => i.slot === slot && i.id !== 'acc-none')
            const own = all.filter((i) => state.owned.includes(i.id))
            return (
              <div key={slot} className="rounded-2xl bg-white/6 p-3 ring-1 ring-white/8">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-extrabold">{label}</p>
                  <p className="text-xs font-bold tabular-nums text-cream/50">{own.length}/{all.length}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {all.map((i) => (
                    <span
                      key={i.id}
                      title={i.name}
                      className="size-3.5 rounded-full"
                      style={{ background: state.owned.includes(i.id) ? RARITY_STYLE[i.rarity].color : 'rgba(255,255,255,.1)' }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Achievements */}
      <Section title="Achievements">
        <ul className="grid grid-cols-1 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const at = state.achievements[a.id]
            return (
              <li key={a.id} className={`flex items-center gap-3 rounded-2xl p-2.5 pr-3 ring-1 ${at ? 'bg-gold/10 ring-gold/30' : 'bg-white/4 ring-white/8'}`}>
                <Trophy a={ACH_BY_ID[a.id]} earned={!!at} size={36} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-extrabold ${at ? '' : 'text-cream/60'}`}>{a.name}</p>
                  <p className="text-xs text-cream/50">{a.desc}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-bold ${at ? 'text-gold' : 'text-cream/35'}`}>{at ? `“${a.title}”` : `+${a.coins} coins`}</span>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Settings */}
      <div className="mt-8 text-center">
        {confirmReset ? (
          <div className="rounded-2xl bg-coral/15 p-3 ring-1 ring-coral/40">
            <p className="text-sm font-bold">Erase all progress on this device? This can’t be undone.</p>
            <div className="mt-2 flex justify-center gap-2">
              <button onClick={() => setConfirmReset(false)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-extrabold">Keep it</button>
              <button onClick={() => { reset(); setConfirmReset(false); go('feed', 'discover') }} className="rounded-xl bg-coral px-4 py-2 text-sm font-extrabold text-ink">Erase</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1.5 text-xs font-bold text-cream/40 hover:text-cream/70">
            <Icon name="refresh" size={13} /> Reset progress
          </button>
        )}
        <p className="mt-2 text-[11px] text-cream/30">Progress saves automatically on this device.</p>
      </div>
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: { label: string; onClick: () => void }; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {action && (
          <button onClick={action.onClick} className="rounded-full bg-white/8 px-3 py-1 text-xs font-extrabold hover:bg-white/14">{action.label}</button>
        )}
      </div>
      {children}
    </section>
  )
}
