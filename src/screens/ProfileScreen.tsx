import { useRef, useState, type ReactNode } from 'react'
import { Sheet } from '../components/Sheet'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { ACHIEVEMENTS, ACH_BY_ID } from '../data/achievements'
import { achievementProgress, currentStreak, deckProgress, findCard, statusOf, DAILY_GOAL, levelInfo, stats, todayCount, type GameState, type Mastery } from '../state/game'
import { backupText, lastBackupAt, markBackedUp, parseSave } from '../state/storage'
import { SceneSvg } from '../art/Landscape'
import { ProfilePic } from '../components/ProfilePic'
import { PictureSheet } from '../components/PictureSheet'
import { JoinSheet } from '../components/JoinSheet'
import { useAccount } from '../net/account'
import { Icon } from '../components/Icon'
import { Trophy } from '../components/Trophy'
import { TitlePicker } from '../components/TitleSheet'
import type { Tab } from '../components/NavBar'
import { feedFocus, MASTERY_LABEL, tourReplay, type FeedMode } from './FeedScreen'

const MASTERY_COLORS: Record<Mastery, string> = { mastered: '#ffd27a', familiar: '#8fc9a3', learning: '#ff9f8a', new: 'rgba(255,255,255,.12)' }

export function ProfileScreen({ go }: { go: (t: Tab, m?: FeedMode) => void }) {
  const { state, setName, setTitle, toggleBookmark, setActiveDeck } = useGame()
  const lv = levelInfo(state.xp)
  const s = stats(state)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(state.name)
  const [picture, setPicture] = useState(false)
  const [settings, setSettings] = useState(false)
  const [allAch, setAllAch] = useState(false)
  const titles = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).map((a) => a.title)

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain px-4 pb-8">
      {/* Showcase banner */}
      {/* clip-path clips the banner once, as a whole. With overflow-hidden each layer (scene,
          shade, grain) is rounded on its own and their soft edges add up to a light line
          along the bottom corners. */}
      <div className="grain relative rounded-[30px] [clip-path:inset(0_round_30px)]">
        <SceneSvg scene="meadow" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="relative flex items-end gap-4 px-4 pb-4 pt-14">
          <button onClick={() => setPicture(true)} aria-label="Customize your picture" className="relative shrink-0">
            <ProfilePic avatar={state.avatar} frame={state.frame} bg={state.cosmetics.bg} photo={state.photo} className="size-28 drop-shadow-xl" />
          </button>
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
            <TitlePicker value={state.title} titles={titles} onChange={setTitle} fx={state.cosmetics.title} />
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
        <button onClick={() => setSettings(true)} aria-label="Settings" className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-ink/45 text-cream/80 hover:text-cream">
          <Icon name="gear" size={19} />
        </button>
      </div>

      <button onClick={() => setPicture(true)} className="clay mt-3 flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left">
        <Icon name="spark" size={16} className="text-gold" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">Customize</span>
          <span className="block truncate text-xs text-cream/55">Picture, frame, title, card theme and effects</span>
        </span>
        <Icon name="chevron" size={14} className="-rotate-90 text-cream/40" />
      </button>

      <StatTiles state={state} />

      {/* Mastery, for each deck you have: tap one to study it */}
      <Section title="Mastery" hint={`${s.mastered} mastered`}>
        <ul className="space-y-2">
          {deckProgress(state).map((d) => {
            const total = d.counts.new + d.counts.learning + d.counts.familiar + d.counts.mastered
            const known = d.counts.familiar + d.counts.mastered
            const on = (state.activeDeck ?? null) === d.id
            return (
              <li key={d.id ?? 'nature'}>
                <button onClick={() => { setActiveDeck(d.id); go('feed', 'discover') }} className={`clay w-full rounded-2xl p-3 text-left ring-1 ${on ? 'ring-gold/40' : 'ring-transparent'}`}>
                  <span className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-extrabold">{d.name}</span>
                    {d.due > 0 && <span className="shrink-0 rounded-full bg-coral/25 px-2 py-0.5 text-[10px] font-extrabold text-coral">{d.due} due</span>}
                    <span className="shrink-0 text-xs font-bold tabular-nums text-cream/50">{total ? Math.round((known / total) * 100) : 0}% known</span>
                  </span>
                  <span className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/8" aria-label={`${d.name}: ${d.counts.mastered} mastered, ${d.counts.familiar} familiar, ${d.counts.learning} learning, ${d.counts.new} new`}>
                    {(['mastered', 'familiar', 'learning'] as Mastery[]).map((k) =>
                      d.counts[k] ? <motion.span key={k} className="h-full rounded-full" style={{ background: MASTERY_COLORS[k] }} initial={{ width: 0 }} animate={{ width: `${(d.counts[k] / total) * 100}%` }} /> : null,
                    )}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-bold tabular-nums text-cream/45">
                    {d.counts.mastered} mastered · {d.counts.familiar} familiar · {d.counts.learning} learning · {d.counts.new} new
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-2 flex flex-wrap gap-3 px-1 text-[11px] font-bold text-cream/55">
          {(['mastered', 'familiar', 'learning'] as Mastery[]).map((k) => (
            <span key={k} className="flex items-center gap-1 capitalize"><span className="size-2.5 rounded-full" style={{ background: MASTERY_COLORS[k] }} />{k}</span>
          ))}
        </div>
        <p className="mt-1 px-1 text-[11px] leading-snug text-cream/40">Right once: familiar. Right again each time it comes back in Review, spaced over days: mastered.</p>
      </Section>

      {/* Saved cards: a list instead of swiping through them */}
      {state.bookmarks.length > 0 && (
        <Section title="Saved cards" action={{ label: 'Study all', onClick: () => go('feed', 'saved') }}>
          <ul className="space-y-1.5">
            {state.bookmarks.map((id) => findCard(state, id)).filter((c) => !!c).map((c) => (
              <li key={c!.id} className="clay flex items-center gap-1 rounded-2xl">
                <button onClick={() => { feedFocus.id = c!.id; go('feed', 'saved') }} className="min-h-12 min-w-0 flex-1 px-3.5 py-2 text-left">
                  <span className="block truncate text-sm font-extrabold">{c!.title}</span>
                  <span className="block text-[11px] text-cream/50">{MASTERY_LABEL[statusOf(state, c!.id)]}</span>
                </button>
                <button onClick={() => toggleBookmark(c!.id)} aria-label={`Unsave ${c!.title}`} className="mr-1.5 grid size-10 shrink-0 place-items-center rounded-xl text-cream/45 hover:text-cream"><Icon name="x" size={14} /></button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Achievements: earned first, then the ones you're closest to */}
      {/* the earned ones and the closest few; the full list on request */}
      <Section
        title="Achievements"
        hint={`${ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length}/${ACHIEVEMENTS.length}`}
        action={{ label: allAch ? 'Show less' : 'See all', onClick: () => setAllAch(!allAch) }}
      >
        <ul className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS
            .map((a) => ({ a, at: state.achievements[a.id], p: achievementProgress(state, a.id) }))
            .sort((x, y) => (x.at ? 0 : 1) - (y.at ? 0 : 1) || (y.p ? y.p[0] / y.p[1] : 0) - (x.p ? x.p[0] / x.p[1] : 0))
            .slice(0, allAch ? undefined : 3)
            .map(({ a, at, p }) => (
              <li key={a.id} className={`flex flex-col items-center rounded-2xl px-2 pb-2.5 pt-3 text-center ring-1 ${at ? 'bg-gold/10 ring-gold/30' : 'clay ring-white/8'}`}>
                <Trophy a={ACH_BY_ID[a.id]} earned={!!at} size={40} />
                <p className={`mt-1 line-clamp-1 text-[12px] font-extrabold ${at ? '' : 'text-cream/70'}`}>{a.name}</p>
                <p className="mt-0.5 line-clamp-3 min-h-[3.6em] text-[10px] leading-tight text-cream/45">{at ? `Title: “${a.title}”` : a.desc}</p>
                {!at && p && (
                  <span className="mt-1.5 flex w-full items-center gap-1.5" aria-label={`${p[0]} of ${p[1]}`}>
                    <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-gold/70" style={{ width: `${(p[0] / p[1]) * 100}%` }} />
                    </span>
                    <span className="text-[9px] font-extrabold tabular-nums text-cream/45">{p[0]}/{p[1]}</span>
                  </span>
                )}
              </li>
            ))}
        </ul>
      </Section>

      <AnimatePresence>{picture && <PictureSheet onClose={() => setPicture(false)} />}</AnimatePresence>

      <AccountRow go={go} />
      <AnimatePresence>{settings && <SettingsSheet onClose={() => setSettings(false)} go={go} />}</AnimatePresence>

    </div>
  )
}

/** Sound, motion, the tour, backup and reset: things you set once, kept off the main page. */
function SettingsSheet({ onClose, go }: { onClose: () => void; go: (t: Tab, m?: FeedMode) => void }) {
  const { state, reset, setReduceMotion, setSound, restore } = useGame()
  const [confirmReset, setConfirmReset] = useState(false)
  return (
    <Sheet label="Settings" onClose={onClose} header={<h2 className="font-display text-2xl font-bold">Settings</h2>}>
          <button onClick={() => { tourReplay.on = true; go('feed') }} className="clay flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left">
            <Icon name="spark" size={16} className="text-gold" />
            <span className="flex-1 text-sm font-extrabold">Replay the Learn tour</span>
            <Icon name="chevron" size={14} className="-rotate-90 text-cream/40" />
          </button>
          <Toggle label="Sound" hint="Chimes on answers and a soft swish between cards. On iPhone, the silent switch mutes them." on={state.sound} onChange={setSound} className="mt-2" />
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
          <button onClick={onClose} className="clay-btn clay-cream mt-5 min-h-12 w-full text-[15px]">Done</button>
    </Sheet>
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

/** Signed in or not: sign in to sync and join the board, or sign out. */
function AccountRow({ go }: { go: (t: Tab, m?: FeedMode) => void }) {
  const { status, email, signOut } = useAccount()
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (status === 'offline' || status === 'loading') return null
  return (
    <div className="clay mt-8 flex min-h-12 flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
      <Icon name="profile" size={16} className="shrink-0 text-gold" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{status === 'member' ? 'Synced with your group' : status === 'needsInvite' ? 'Waiting for an invite code' : 'Not signed in'}</span>
        <span className="block truncate text-xs text-cream/55">{email ?? 'Your progress is only on this device.'}</span>
      </span>
      {status === 'signedOut' || status === 'needsInvite' ? (
        <button onClick={() => setJoining(true)} className="clay-btn clay-butter min-h-10 shrink-0 px-3 text-xs">{status === 'signedOut' ? 'Sign in' : 'Enter code'}</button>
      ) : (
        <button
          disabled={leaving}
          onClick={() => {
            setLeaving(true); setError(null)
            // back to the start: the welcome screen shows over Learn
            signOut().then(() => go('feed', 'discover'), (e: Error) => setError(e.message)).finally(() => setLeaving(false))
          }}
          className="clay-btn clay-plum min-h-10 shrink-0 px-3 text-xs disabled:opacity-50"
        >
          {leaving ? 'Saving…' : 'Sign out'}
        </button>
      )}
      {error && <p role="alert" className="basis-full text-xs font-bold text-coral">{error}</p>}
      <AnimatePresence>{joining && <JoinSheet onClose={() => setJoining(false)} />}</AnimatePresence>
    </div>
  )
}

/** Streak, today's goal, accuracy and answers at a glance. */
function StatTiles({ state }: { state: GameState }) {
  const today = Math.min(todayCount(state), DAILY_GOAL)
  const streak = currentStreak(state)
  const s = stats(state)
  const tile = 'clay flex flex-col items-center justify-center rounded-2xl px-1 py-3 text-center'
  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      <div className={tile}>
        <span className={`grid size-8 place-items-center rounded-full ${streak ? 'bg-gradient-to-br from-peach to-gold text-[#5a3208]' : 'bg-white/8 text-cream/40'}`}><Icon name="flame" size={16} filled={!!streak} /></span>
        <p className="mt-1.5 font-display text-lg font-bold leading-none tabular-nums">{streak}</p>
        <p className="mt-0.5 text-[10px] font-extrabold text-cream/50">day streak</p>
      </div>
      <div className={tile}>
        <svg viewBox="0 0 36 36" className="size-8 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="4" />
          <motion.circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-gold)" strokeWidth="4" strokeLinecap="round" strokeDasharray={94.2} initial={false} animate={{ strokeDashoffset: 94.2 * (1 - today / DAILY_GOAL) }} />
        </svg>
        <p className="mt-1.5 font-display text-lg font-bold leading-none tabular-nums">{today}/{DAILY_GOAL}</p>
        <p className="mt-0.5 text-[10px] font-extrabold text-cream/50">today</p>
      </div>
      <div className={tile}>
        <span className="grid size-8 place-items-center rounded-full bg-sage/20 text-sage"><Icon name="check" size={16} strokeWidth={3} /></span>
        <p className="mt-1.5 font-display text-lg font-bold leading-none tabular-nums">{s.attempts ? `${s.accuracy}%` : '—'}</p>
        <p className="mt-0.5 text-[10px] font-extrabold text-cream/50">accuracy</p>
      </div>
      <div className={tile}>
        <span className="grid size-8 place-items-center rounded-full bg-lav/20 text-lav"><Icon name="book" size={16} /></span>
        <p className="mt-1.5 font-display text-lg font-bold leading-none tabular-nums">{s.attempts}</p>
        <p className="mt-0.5 text-[10px] font-extrabold text-cream/50">answers</p>
      </div>
    </div>
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

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: { label: string; onClick: () => void }; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <span className="flex items-center gap-2">
          {hint && <span className="text-xs font-bold text-cream/45">{hint}</span>}
          {action && (
            <button onClick={action.onClick} className="rounded-full clay px-3 py-1 text-xs font-extrabold hover:brightness-110">{action.label}</button>
          )}
        </span>
      </div>
      {children}
    </section>
  )
}
