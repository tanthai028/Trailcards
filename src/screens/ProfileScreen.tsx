import { useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { TOPICS, TOPIC_ORDER } from '../data/cards'
import { ACHIEVEMENTS, ACH_BY_ID } from '../data/achievements'
import { RARITY_STYLE, type Slot } from '../data/items'
import { collectionItems, currentStreak, DAILY_GOAL, FREEZE_COST, levelInfo, masteryCounts, MAX_FREEZES, stats, todayCount, type GameState, type Mastery } from '../state/game'
import { backupText, lastBackupAt, markBackedUp, parseSave } from '../state/storage'
import { Figurine } from '../scene/Figurine'
import { SceneSvg, DESTINATION_SCENE } from '../art/Landscape'
import { Icon } from '../components/Icon'
import { Trophy } from '../components/Trophy'
import { TitlePicker } from '../components/TitleSheet'
import type { Tab } from '../components/NavBar'
import type { FeedMode } from './FeedScreen'

const MASTERY_COLORS: Record<Mastery, string> = { mastered: '#ffd27a', familiar: '#8fc9a3', learning: '#ff9f8a', new: 'rgba(255,255,255,.12)' }

export function ProfileScreen({ go }: { go: (t: Tab, m?: FeedMode) => void }) {
  const { state, setName, setTitle, reset, setReduceMotion, setSound, restore, buyFreeze } = useGame()
  const lv = levelInfo(state.xp)
  const s = stats(state)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(state.name)
  const [confirmReset, setConfirmReset] = useState(false)
  const titles = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).map((a) => a.title)

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain px-4 pb-8">
      {/* Showcase banner */}
      <div className="grain relative overflow-hidden rounded-[30px]">
        <SceneSvg scene={DESTINATION_SCENE[state.destination] ?? 'meadow'} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="relative flex items-end gap-3 px-4 pb-4 pt-24">
          <Figurine look={state.look} className="cq-idle -mb-1 h-44 shrink-0 drop-shadow-[0_10px_14px_rgba(0,0,0,.45)]" />
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
            <TitlePicker value={state.title} titles={titles} onChange={setTitle} />
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

      <Daily state={state} onBuyFreeze={buyFreeze} />

      {/* Stats */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          ['Explored', `${s.explored}/${s.total}`],
          ['Accuracy', s.attempts ? `${s.accuracy}%` : '—'],
          ['Mastered', s.mastered],
          ['Answers', s.attempts],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl clay px-2 py-3 text-center">
            <p className="font-display text-xl font-bold tabular-nums">{v}</p>
            <p className="text-[10px] font-extrabold text-cream/50">{k}</p>
          </div>
        ))}
      </div>

      {/* Mastery tracker */}
      <Section title="Mastery" action={s.learning + s.familiar > 0 ? { label: `Review ${s.learning + s.familiar}`, onClick: () => go('feed', 'review') } : undefined}>
        <div className="space-y-2.5 rounded-3xl clay p-4">
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
          <p className="text-[11px] leading-snug text-cream/45">Right once → familiar. Right again when it comes back in Review, spaced over days → mastered. Misses come back for another try.</p>
        </div>
      </Section>

      {/* Collection */}
      <Section title="Collection" action={{ label: 'Open closet', onClick: () => go('closet') }}>
        <div className="grid grid-cols-2 gap-2">
          {([['outfit', 'Outfits'], ['hair', 'Hairstyles'], ['accessory', 'Extras'], ['card', 'Card backgrounds'], ['van', 'Van upgrades']] as [Slot, string][]).map(([slot, label]) => {
            const all = collectionItems(state, slot)
            const own = all.filter((i) => state.owned.includes(i.id))
            return (
              <div key={slot} className="rounded-2xl clay p-3">
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
              <li key={a.id} className={`flex items-center gap-3 rounded-2xl p-2.5 pr-3 ring-1 ${at ? 'bg-gold/10 ring-gold/30' : 'clay ring-white/8'}`}>
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
      <Toggle label="Sound" hint="Chimes on answers and a soft swish between cards." on={state.sound} onChange={setSound} className="mt-8" />
      <button
        onClick={() => setReduceMotion(!state.reduceMotion)}
        role="switch"
        aria-checked={state.reduceMotion}
        className="clay mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">Reduce motion</span>
          <span className="block text-xs text-cream/55">Fewer animations. Your phone's own setting is always followed too.</span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${state.reduceMotion ? 'bg-gold' : 'bg-white/15'}`}>
          <span className={`absolute top-1 size-5 rounded-full bg-cream shadow transition-transform ${state.reduceMotion ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </button>

      <Backup state={state} onRestore={restore} />

      <div className="mt-6 text-center">
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

/** Save progress to a file (Files on iPhone) and restore it, since progress otherwise lives only in this browser. */
function Backup({ state, onRestore }: { state: GameState; onRestore: (s: GameState) => void }) {
  const [last, setLast] = useState(lastBackupAt)
  const [pending, setPending] = useState<GameState | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const save = async () => {
    const name = `wayfarer-backup-${new Date().toISOString().slice(0, 10)}.json`
    const blob = new Blob([backupText(state)], { type: 'application/json' })
    const f = new File([blob], name, { type: 'application/json' })
    try {
      // iPhone: the share sheet offers "Save to Files"; elsewhere fall back to a download
      if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: 'Wayfarer backup' })
      else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = name
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      }
      markBackedUp()
      setLast(Date.now())
      setMsg('Backup saved.')
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setMsg('Couldn’t save the backup. Try again.')
    }
  }

  const pick = async (f: File | undefined) => {
    if (!f) return
    const s = parseSave(await f.text())
    if (s) { setPending(s); setMsg(null) } else setMsg('That file isn’t a Wayfarer backup.')
    if (file.current) file.current.value = ''
  }

  const days = last ? Math.floor((Date.now() - last) / 86_400_000) : null
  return (
    <section className="clay mt-2 rounded-2xl px-4 py-3">
      <p className="text-sm font-extrabold">Backup</p>
      <p className="text-xs text-cream/55">
        Progress is saved only on this device. {last ? `Last backup ${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}.` : 'No backup yet.'}
      </p>
      {pending ? (
        <div className="mt-2 rounded-xl bg-coral/15 p-3 ring-1 ring-coral/40">
          <p className="text-sm font-bold">Replace your current progress with this backup ({pending.name}, level {levelInfo(pending.xp).level})?</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => setPending(null)} className="flex-1 rounded-xl bg-white/10 py-2 text-sm font-extrabold">Keep current</button>
            <button onClick={() => { onRestore(pending); setPending(null); setMsg('Backup restored.') }} className="flex-1 rounded-xl bg-coral py-2 text-sm font-extrabold text-ink">Restore</button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex gap-2">
          <button onClick={save} className="clay-btn clay-butter min-h-11 flex-1 text-sm">Save backup</button>
          <button onClick={() => file.current?.click()} className="clay-btn clay-plum min-h-11 flex-1 text-sm">Restore…</button>
        </div>
      )}
      {msg && <p className="mt-2 text-xs font-bold text-cream/70" role="status">{msg}</p>}
      <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </section>
  )
}

/** Today's goal, the day streak and streak freezes (a lasting use for coins). */
function Daily({ state, onBuyFreeze }: { state: GameState; onBuyFreeze: () => boolean }) {
  const today = Math.min(todayCount(state), DAILY_GOAL)
  const streak = currentStreak(state)
  const { freezes } = state.streak
  const canBuy = freezes < MAX_FREEZES && state.coins >= FREEZE_COST
  return (
    <section className="clay mt-4 rounded-2xl p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-peach to-gold text-[#5a3208]"><Icon name="flame" size={22} filled /></span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-tight">{streak ? `${streak}-day streak` : 'No streak yet'}</p>
          <p className="text-xs text-cream/60">Today {today}/{DAILY_GOAL} answers{today >= DAILY_GOAL ? ' · goal done' : ''}</p>
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/12">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-peach to-gold" initial={false} animate={{ width: `${(today / DAILY_GOAL) * 100}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <p className="min-w-0 flex-1 text-xs text-cream/60">Streak freezes: <span className="font-extrabold text-cream">{freezes}/{MAX_FREEZES}</span>. Each saves your streak on one missed day.</p>
        <button onClick={onBuyFreeze} disabled={!canBuy} className="clay-btn clay-ink min-h-10 shrink-0 px-3 text-xs tabular-nums disabled:opacity-50">
          {freezes >= MAX_FREEZES ? 'Full' : `Buy · ${FREEZE_COST}`}
        </button>
      </div>
    </section>
  )
}

function Toggle({ label, hint, on, onChange, className = '' }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on} className={`clay flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ${className}`}>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{label}</span>
        <span className="block text-xs text-cream/55">{hint}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-gold' : 'bg-white/15'}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-cream shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </button>
  )
}

function Section({ title, action, children }: { title: string; action?: { label: string; onClick: () => void }; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {action && (
          <button onClick={action.onClick} className="rounded-full clay px-3 py-1 text-xs font-extrabold hover:brightness-110">{action.label}</button>
        )}
      </div>
      {children}
    </section>
  )
}
