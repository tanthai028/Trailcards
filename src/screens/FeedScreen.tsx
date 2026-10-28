import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { TOPICS, type Card } from '../data/cards'
import type { DeckFeedCard } from '../data/decks'
import { DeckPicker } from '../components/Decks'
import { AvatarLevel, CoinsPill } from '../components/Hud'
import { findCard, reviewQueue, sourceCards, statusOf, type AnswerResult, type GameState, type Mastery } from '../state/game'
import { SceneSvg } from '../art/Landscape'
import { Cat } from '../art/Companions'
import { Coin, Icon } from '../components/Icon'
import type { Tab } from '../components/NavBar'

export type FeedMode = 'discover' | 'review' | 'saved'

const idsFor = (s: GameState, mode: FeedMode) =>
  mode === 'discover'
    ? sourceCards(s).filter((c) => statusOf(s, c.id) === 'new').map((c) => c.id)
    : mode === 'review'
      ? reviewQueue(s).map((c) => c.id)
      : s.bookmarks.filter((id) => findCard(s, id))

export const MASTERY_LABEL: Record<Mastery, string> = { new: 'New', learning: 'Learning', familiar: 'Familiar', mastered: 'Mastered' }

export function FeedScreen({ mode, setMode, go, immersive, setImmersive }: {
  mode: FeedMode
  setMode: (m: FeedMode) => void
  go: (t: Tab, m?: FeedMode) => void
  immersive: boolean
  setImmersive: (v: boolean) => void
}) {
  const { state, answer } = useGame()
  // Snapshot the list when the mode opens, so answering a card doesn't yank it out from under you.
  const [ids, setIds] = useState(() => idsFor(state, mode))
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const answerFns = useRef<Record<number, (i: number) => void>>({})

  useEffect(() => {
    setIds(idsFor(state, mode))
    setActive(0)
    scroller.current?.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Switching or importing a deck re-snapshots the stack for the current mode.
  useEffect(() => {
    setIds(idsFor(state, mode))
    setActive(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeDeck, state.decks.length])

  // Swipe forward: hide the chrome so the card gets the screen. Swipe back or reach the end: show it.
  const lastActive = useRef(0)
  useEffect(() => {
    if (active > lastActive.current && active < ids.length) setImmersive(true)
    else if (active < lastActive.current || active >= ids.length) setImmersive(false)
    lastActive.current = active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
  useEffect(() => setImmersive(false), [mode, setImmersive])
  // The scroller changes height as chrome collapses; re-seat the current card once it settles.
  useEffect(() => {
    const t = setTimeout(() => scroller.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'start' }), 320)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immersive])

  // Track which card is on screen.
  useEffect(() => {
    const root = scroller.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.index))),
      { root, threshold: 0.6 },
    )
    root.querySelectorAll('[data-index]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ids])

  const scrollTo = useCallback((i: number) => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-index="${i}"]`)
    el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [])

  // Keyboard: 1–4 answers the visible card, J/K or arrows move between cards.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return
      if (/^[1-4]$/.test(e.key)) answerFns.current[active]?.(Number(e.key) - 1)
      else if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); scrollTo(Math.min(active + 1, ids.length)) }
      else if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); scrollTo(Math.max(active - 1, 0)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, ids.length, scrollTo])

  const counts = { discover: idsFor(state, 'discover').length, review: reviewQueue(state).length, saved: state.bookmarks.length }

  return (
    <div className="flex h-full flex-col">
      {/* status-bar spacer stays; the header row itself collapses while swiping */}
      <div className="relative z-20 pt-[env(safe-area-inset-top)]">
        <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: immersive ? '0fr' : '1fr' }}>
          <div className={`min-h-0 ${menuOpen ? '' : 'overflow-hidden'}`}>
            <header className="flex items-center gap-2 px-3 pb-1.5 pt-2">
              <AvatarLevel onClick={() => go('profile')} size={34} />
              <ModeMenu
                mode={mode}
                counts={counts}
                open={menuOpen}
                setOpen={setMenuOpen}
                onPick={(m) => (m === mode ? (setIds(idsFor(state, m)), scroller.current?.scrollTo({ top: 0 })) : setMode(m))}
              />
              <DeckPicker onSourceChange={() => scroller.current?.scrollTo({ top: 0 })} />
              <div className="ml-auto"><CoinsPill /></div>
            </header>
          </div>
        </div>
      </div>

      <div ref={scroller} className="no-scrollbar min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto scroll-smooth">
        {ids.map((id, i) => (
          <section key={`${mode}-${id}`} data-index={i} className="h-full snap-start snap-always px-3 py-2" aria-label={`Card ${i + 1} of ${ids.length}`}>
            <FeedCard
              card={findCard(state, id)!}
              mode={mode}
              index={i}
              total={ids.length}
              registerAnswer={(fn) => (answerFns.current[i] = fn)}
              onAnswer={(choice) => answer(id, choice)}
              onNext={() => scrollTo(i + 1)}
            />
          </section>
        ))}
        <section data-index={ids.length} className="h-full snap-start px-3 py-2">
          <EndCard mode={mode} empty={ids.length === 0} counts={counts} setMode={setMode} go={go} />
        </section>
      </div>
    </div>
  )
}

function FeedCard({
  card, mode, index, total, onAnswer, onNext, registerAnswer,
}: {
  card: Card
  mode: FeedMode
  index: number
  total: number
  onAnswer: (choice: number) => AnswerResult
  onNext: () => void
  registerAnswer: (fn: (i: number) => void) => void
}) {
  const { state, toggleBookmark } = useGame()
  const deck = (card as DeckFeedCard).deck
  const topic = deck ? { name: deck.name, accent: '#b9a7f2', scene: deck.scene } : TOPICS[card.topic]
  const [choice, setChoice] = useState<number | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const status = statusOf(state, card.id)
  const saved = state.bookmarks.includes(card.id)
  const isReview = mode !== 'discover' && (result?.from ?? status) !== 'new'

  const pick = (i: number) => {
    if (result || i >= card.choices.length) return
    setChoice(i)
    setResult(onAnswer(i))
  }
  registerAnswer(pick)

  // One scroll = one card: the card never scrolls inside. If its content is taller
  // than the screen allows, text scales down a little (to a floor) instead.
  const fitRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = fitRef.current
    if (!el) return
    const fit = () => {
      let scale = 1
      el.style.fontSize = '16px'
      while (el.scrollHeight > el.clientHeight + 1 && scale > 0.74) {
        scale -= 0.03
        el.style.fontSize = `${16 * scale}px`
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [result])

  const visibleChoices = card.choices
    .map((c, i) => ({ c, i }))
    .filter(({ i }) => !result || i === card.answerIndex || i === choice)

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-paper text-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)]">
      <div className="grain relative h-[15%] min-h-[54px] shrink-0 overflow-hidden">
        <SceneSvg scene={topic.scene} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-paper to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-start gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-extrabold text-ink backdrop-blur">
            <span className="size-2 rounded-full" style={{ background: topic.accent }} />
            {topic.name}
          </span>
          {isReview && (
            <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-extrabold text-gold backdrop-blur">
              Review · {MASTERY_LABEL[result?.from ?? status]}
            </span>
          )}
          <button
            onClick={() => toggleBookmark(card.id)}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from saved' : 'Save for later'}
            className={`ml-auto grid size-9 place-items-center rounded-full backdrop-blur transition active:scale-90 ${saved ? 'bg-gold text-ink' : 'bg-white/70 text-ink/70 hover:bg-white'}`}
          >
            <Icon name="bookmark" size={17} filled={saved} />
          </button>
        </div>
      </div>

      <div ref={fitRef} className="relative -mt-2 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-3" style={{ fontSize: 16 }}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="line-clamp-2 text-[0.68em] font-black" style={{ color: shade(topic.accent) }}>{card.hook}</p>
          <span className="shrink-0 text-[0.68em] font-bold tabular-nums text-ink/40">{index + 1} / {total}</span>
        </div>
        <h2 className="mt-0.5 font-display text-[1.55em] font-bold leading-[1.1] text-ink">{card.title}</h2>

        {/* Reading text before answering; the explanation takes its place after. */}
        <AnimatePresence mode="wait" initial={false}>
          {!result ? (
            <motion.p key="body" exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="mt-[0.5em] text-[0.92em] leading-[1.5] text-ink/75">
              {card.body}
            </motion.p>
          ) : (
            <motion.div
              key="explain"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`mt-[0.6em] flex gap-3 rounded-3xl p-[0.8em] ${result.correct ? 'bg-sage/20' : 'bg-peach/25'}`}
              role="status"
            >
              <Cat sleeping={!result.correct} className="h-[2.8em] w-[3.2em] shrink-0" />
              <div className="min-w-0">
                {/* keep a reminder of what the card said, so the explanation has context */}
                {card.body && <p className="mb-[0.35em] line-clamp-2 text-[0.8em] italic leading-snug text-ink/50">{firstSentence(card.body)}</p>}
                <p className="text-[0.95em] font-extrabold">{result.correct ? pickLine(card.id, RIGHT) : 'Not quite — here’s the idea'}</p>
                <p className="mt-[0.25em] text-[0.88em] leading-[1.45] text-ink/75">{card.explain}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto pt-[0.75em]">
          <div className="rounded-3xl bg-white/70 p-[0.6em] ring-1 ring-ink/5">
            <p className="px-1 pb-[0.5em] text-[0.92em] font-extrabold leading-snug">{card.prompt}</p>
            <div className={`grid gap-[0.45em] ${card.choices.length === 2 && !result ? 'grid-cols-2' : ''}`}>
              <AnimatePresence initial={false}>
                {visibleChoices.map(({ c, i }) => {
                  const isAnswer = i === card.answerIndex
                  const st = !result ? 'idle' : isAnswer ? 'right' : 'wrong'
                  return (
                    <motion.button
                      key={i}
                      layout
                      onClick={() => pick(i)}
                      disabled={!!result}
                      whileTap={result ? undefined : { scale: 0.97 }}
                      initial={false}
                      animate={st === 'wrong' ? { x: [0, -6, 6, -4, 4, 0], opacity: 1 } : st === 'right' && i === choice ? { scale: [1, 1.04, 1], opacity: 1 } : { opacity: 1 }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
                      transition={{ duration: 0.3 }}
                      className={`relative flex min-h-11 items-center gap-2.5 rounded-2xl px-3 py-[0.5em] text-left text-[0.86em] font-bold leading-snug transition-colors ${
                        st === 'idle' ? 'bg-paper ring-1 ring-ink/10 hover:bg-white hover:ring-ink/20'
                        : st === 'right' ? 'bg-sage/35 ring-2 ring-[#4f9a6a]'
                        : 'bg-coral/20 ring-2 ring-coral'
                      }`}
                    >
                      <span className={`grid size-6 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${st === 'right' ? 'bg-[#4f9a6a] text-white' : st === 'wrong' ? 'bg-coral text-white' : 'bg-ink/8 text-ink/60'}`}>
                        {st === 'right' ? <Icon name="check" size={14} strokeWidth={3} /> : st === 'wrong' ? <Icon name="x" size={13} strokeWidth={3} /> : i + 1}
                      </span>
                      <span>{c}</span>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-[0.55em] flex min-h-6 flex-wrap items-center justify-center gap-1.5 text-[11px] font-extrabold">
            {result ? (
              <>
                {/* the one place rewards show: pops in once, never over the question */}
                <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} className="flex items-center gap-1.5">
                  <span className="rounded-full bg-lav/20 px-2 py-0.5 text-[#6a55c2]">+{result.xp} XP</span>
                  {result.coins > 0 && <span className="flex items-center gap-1 rounded-full bg-gold/30 px-2 py-0.5 text-[#8a5e0c]"><Coin size={12} />+{result.coins}</span>}
                </motion.span>
                {progressNote(result) && <span className="font-bold text-ink/55">{progressNote(result)}</span>}
                <button onClick={onNext} className="flex items-center gap-1 px-1.5 py-0.5 text-ink/45 hover:text-ink/70" aria-label="Next card">
                  Scroll for next <Icon name="down" size={12} strokeWidth={3} />
                </button>
              </>
            ) : (
              <span className="font-semibold text-ink/35">Tap an answer · scroll to skip</span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

const firstSentence = (text: string) => (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim()

/** Mastery change in plain words for a newcomer. */
function progressNote(r: AnswerResult) {
  if (r.from === r.to) return r.to === 'mastered' ? 'Still mastered' : null
  if (r.to === 'mastered') return 'Mastered!'
  if (r.to === 'learning') return 'It’ll come back in Review'
  if (r.from === 'new') return 'Review it later to master it'
  return r.from === 'learning' ? 'Getting there' : 'Needs a refresh'
}

const MODE_LABEL: Record<FeedMode, string> = { discover: 'Discover', review: 'Review', saved: 'Saved' }

/** Discover / Review / Saved in one compact menu instead of a row of chips. */
function ModeMenu({ mode, counts, open, setOpen, onPick }: {
  mode: FeedMode; counts: Record<FeedMode, number>; open: boolean; setOpen: (v: boolean) => void; onPick: (m: FeedMode) => void
}) {
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', onKey) }
  }, [open, setOpen])
  return (
    <div className="relative shrink-0" onPointerDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-9 items-center gap-1.5 rounded-full bg-cream py-1 pl-3 pr-2 text-xs font-extrabold text-ink"
      >
        {MODE_LABEL[mode]} <span className="tabular-nums text-ink/50">{counts[mode]}</span>
        <Icon name="chevron" size={12} strokeWidth={3} className={`opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
            transition={{ duration: 0.14 }}
            className="clay absolute left-0 top-[calc(100%+6px)] z-30 w-48 origin-top-left rounded-2xl p-1.5"
          >
            {(['discover', 'review', 'saved'] as FeedMode[]).map((m) => (
              <li key={m}>
                <button
                  role="menuitemradio"
                  aria-checked={mode === m}
                  onClick={() => { onPick(m); setOpen(false) }}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold ${mode === m ? 'bg-gold/15 text-gold' : 'text-cream/85 hover:bg-white/5'}`}
                >
                  <span className="flex-1">{MODE_LABEL[m]}</span>
                  <span className="tabular-nums text-xs opacity-60">{counts[m]}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

const RIGHT = ['Nailed it!', 'Exactly right!', 'Sharp eyes!', 'You got it!', 'Mochi is impressed!']
const pickLine = (id: string, lines: string[]) => lines[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % lines.length]

/** Darken a pastel accent so it reads as text on paper. */
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.round(v * 0.55)
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

function EndCard({ mode, empty, counts, setMode, go }: { mode: FeedMode; empty: boolean; counts: Record<FeedMode, number>; setMode: (m: FeedMode) => void; go: (t: Tab, m?: FeedMode) => void }) {
  const copy = {
    discover: empty
      ? ['Every card explored', 'You’ve seen all the field notes for now. Review keeps them fresh — and grows your plant.']
      : ['You’re all caught up', 'That’s the end of this stack. Revisit shaky concepts in Review to master them.'],
    review: empty
      ? ['Nothing to review yet', 'Answer cards in Discover. Ones you miss — or get right once — come back here for mastery.']
      : ['Review done', 'Nice. Concepts you got right twice are now mastered. Check how your plant is doing.'],
    saved: empty
      ? ['No saved cards', 'Tap the bookmark on any card to keep it here for later.']
      : ['End of your saved cards', 'Saved cards stay here until you unsave them.'],
  }[mode]
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-ink-3 to-ink-2 p-8 text-center">
      <Cat sleeping={mode !== 'review'} className="h-24 w-28" />
      <h2 className="mt-3 font-display text-3xl font-bold">{copy[0]}</h2>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-cream/70">{copy[1]}</p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        {mode !== 'review' && counts.review > 0 && (
          <button onClick={() => setMode('review')} className="rounded-2xl clay-btn clay-butter py-3 font-extrabold text-ink">
            Review {counts.review} concept{counts.review === 1 ? '' : 's'}
          </button>
        )}
        {mode !== 'discover' && counts.discover > 0 && (
          <button onClick={() => setMode('discover')} className="clay-btn clay-cream py-3">
            Discover {counts.discover} new card{counts.discover === 1 ? '' : 's'}
          </button>
        )}
        <button onClick={() => go('van')} className="clay-btn clay-plum py-3">Visit your van</button>
      </div>
    </div>
  )
}
