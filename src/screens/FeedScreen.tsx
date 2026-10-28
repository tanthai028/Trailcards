import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { TOPICS, type Card } from '../data/cards'
import type { DeckFeedCard } from '../data/decks'
import { DeckImport, DeckPicker } from '../components/Decks'
import { createPortal } from 'react-dom'
import { AvatarLevel } from '../components/Hud'
import { findCard, isDue, nextDueAt, practiceBatch, reviewQueue, sourceCards, statusOf, studyQueue, type AnswerResult, type GameState, type Mastery } from '../state/game'
import { SceneSvg } from '../art/Landscape'
import { Cat } from '../art/Companions'
import { Icon } from '../components/Icon'
import { burst } from '../fx/FxLayer'
import { playChime, playCorrect, playSwipe, playWrong } from '../fx/sound'
import type { Tab } from '../components/NavBar'

export type FeedMode = 'discover' | 'review' | 'saved'

type Tag = 'New' | 'Review' | 'Practice'
const tagFor = (s: GameState, id: string): Tag => (statusOf(s, id) === 'new' ? 'New' : isDue(s, id) ? 'Review' : 'Practice')

/** Set before opening Learn to land on a specific card (e.g. from the Saved list in Profile). */
export const feedFocus: { id: string | null } = { id: null }
/** Set from Profile > Replay tour to show the Learn tour again next time Learn opens. */
export const tourReplay = { on: false }

const idsFor = (s: GameState, mode: FeedMode) =>
  mode === 'discover'
    ? studyQueue(s)
    : mode === 'review'
      ? reviewQueue(s).map((c) => c.id)
      : s.bookmarks.filter((id) => findCard(s, id))

export const MASTERY_LABEL: Record<Mastery, string> = { new: 'New', learning: 'Learning', familiar: 'Familiar', mastered: 'Mastered' }

type FeedProps = { mode: FeedMode; setMode: (m: FeedMode) => void; go: (t: Tab, m?: FeedMode) => void }

/**
 * New players pick what to study before the feed appears. The feed is its own component so
 * it mounts fresh once a deck is chosen: its swipe and scroll listeners attach to the card
 * scroller on mount, which doesn't exist while the chooser is showing.
 */
export function FeedScreen(props: FeedProps) {
  const { state } = useGame()
  return state.deckChosen ? <Feed {...props} /> : <StudyChooser />
}

function Feed({ mode, setMode, go }: FeedProps) {
  const { state, answer, dismissTip } = useGame()
  // Snapshot the list when the mode opens, so answering a card doesn't yank it out from under you.
  const [ids, setIds] = useState(() => idsFor(state, mode))
  const [active, setActive] = useState(0)
  // a replay requested from Profile shows the tour once more
  const [tour, setTour] = useState(() => tourReplay.on)
  useEffect(() => {
    // cleared a moment later so a Strict Mode remount still sees the request
    const t = setTimeout(() => (tourReplay.on = false), 400)
    return () => clearTimeout(t)
  }, [])
  const scroller = useRef<HTMLDivElement>(null)
  // Answers for this stack, kept here (not in each card) because cards far from view are unmounted.
  // Keyed by position, not card id: the endless Study feed can bring a card back later.
  const [answers, setAnswers] = useState<Record<number, Answered>>({})
  // Correct answers in a row this session; a wrong answer resets it.
  const [streak, setStreak] = useState(0)
  // New / Review / Practice for each position, fixed when it joins the stack
  const tags = useRef<Tag[]>([])
  // Rebuild the stack (mode or deck change, or picking the same mode again)
  const restack = (m: FeedMode) => {
    const next = idsFor(state, m)
    tags.current = next.map((id) => tagFor(state, id))
    setAnswers({})
    setIds(next)
  }
  const pickFor = (i: number, choice: number) => {
    const id = ids[i]
    const card = id ? findCard(state, id) : undefined
    // recall cards have no choices: choice is the self-rating (0-2)
    if (!card || answers[i] || choice >= (card.q.kind === 'recall' ? 3 : card.choices.length)) return
    const result = answer(id, choice)
    const run = result.correct ? streak + 1 : result.partial ? streak : 0
    setStreak(run)
    setAnswers((a) => ({ ...a, [i]: { choice, result, streak: run } }))
    // celebrate from the button that was picked (tap or keyboard)
    const btn = scroller.current?.querySelector(`[data-index="${i}"] [data-choice="${choice}"]`)
    if (result.correct) {
      playCorrect(run)
      const r = btn?.getBoundingClientRect()
      if (r) burst(r.left + r.width / 2, r.top + r.height / 2)
    } else if (result.partial) playChime(0)
    else playWrong()
  }

  // Jump back to the first card once a new stack has rendered. Scrolling before that lands
  // on the old layout, and the browser then keeps the end card in view as cards are added.
  const toTop = useRef(false)
  useLayoutEffect(() => {
    if (!toTop.current) return
    toTop.current = false
    const at = feedFocus.id ? ids.indexOf(feedFocus.id) : -1
    // cleared a moment later, not now: a remount right after (React Strict Mode) must still find it
    if (feedFocus.id) setTimeout(() => (feedFocus.id = null), 400)
    const el = scroller.current
    if (el) el.scrollTo({ top: Math.max(0, at) * el.clientHeight, behavior: 'instant' })
    if (at > 0) setActive(at)
  }, [ids])

  useEffect(() => {
    restack(mode)
    setActive(0)
    toTop.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Switching or importing a deck re-snapshots the stack for the current mode.
  useEffect(() => {
    restack(mode)
    setActive(0)
    toTop.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeDeck, state.decks.length])

  // Study never runs dry: near the end, top the stack up with practice cards,
  // skipping the ones seen most recently (as many as the deck allows).
  useEffect(() => {
    if (mode !== 'discover' || ids.length - active > 3) return
    const deckSize = sourceCards(state).length
    const avoid = new Set(ids.slice(-Math.max(0, Math.min(8, deckSize - 1))))
    const more = practiceBatch(state, avoid, 10, undefined, ids[ids.length - 1])
    if (!more.length) return
    tags.current = [...tags.current, ...more.map(() => 'Practice' as Tag)]
    setIds((cur) => [...cur, ...more])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, active, ids.length, state])

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

  // Paging: one swipe moves exactly one card and settles in about 0.2s. Native momentum
  // plus snapping coasts for a while before you can tap an answer.
  const anim = useRef(0)
  const scrollTo = useCallback((i: number) => {
    const el = scroller.current
    if (!el) return
    cancelAnimationFrame(anim.current)
    const to = i * el.clientHeight
    if (i !== Math.round(el.scrollTop / el.clientHeight)) playSwipe()
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-reduce-motion')) { el.scrollTop = to; return }
    const from = el.scrollTop
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 220)
      el.scrollTop = from + (to - from) * (1 - (1 - t) ** 3)
      if (t < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const last = () => el.querySelectorAll('[data-index]').length - 1
    const at = () => Math.round(el.scrollTop / el.clientHeight)
    const go = (i: number) => scrollTo(Math.max(0, Math.min(last(), i)))

    // Touch: the card follows your finger, then a flick or a drag past 60px moves one card.
    let y0 = 0
    let top0 = 0
    let from = 0
    let samples: { y: number; t: number }[] = []
    const onStart = (e: TouchEvent) => {
      cancelAnimationFrame(anim.current)
      y0 = e.touches[0].clientY
      top0 = el.scrollTop
      from = at()
      samples = [{ y: y0, t: e.timeStamp }]
    }
    const onMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY
      el.scrollTop = top0 - (y - y0)
      samples.push({ y, t: e.timeStamp })
      if (samples.length > 5) samples.shift()
    }
    const onEnd = () => {
      const dragged = el.scrollTop - top0
      const a = samples[0]
      const b = samples[samples.length - 1]
      const speed = b.t > a.t ? (a.y - b.y) / (b.t - a.t) : 0 // px per ms, positive = toward the next card
      if (dragged > 60 || speed > 0.35) go(from + 1)
      else if (dragged < -60 || speed < -0.35) go(from - 1)
      else go(from)
    }

    // Wheel and trackpad: one card per gesture; trackpad inertia is ignored until it goes quiet.
    let lock = 0
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.timeStamp < lock) { lock = e.timeStamp + 180; return }
      if (Math.abs(e.deltaY) < 4) return
      lock = e.timeStamp + 400
      go(at() + Math.sign(e.deltaY))
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: true })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    el.addEventListener('wheel', onWheel, { passive: false })
    // Scroll position in cards, read by each card's scene to drift slower than the card (depth).
    const onScroll = () => el.style.setProperty('--p', String(el.scrollTop / el.clientHeight))
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', onScroll)
    }
  }, [scrollTo])

  // Keyboard: 1–4 answers the visible card, J/K or arrows move between cards.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return
      if (/^[1-4]$/.test(e.key)) pickFor(active, Number(e.key) - 1)
      else if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); scrollTo(Math.min(active + 1, ids.length)) }
      else if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); scrollTo(Math.max(active - 1, 0)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Recount only when the game state changes, not on every swipe.
  const counts = useMemo(
    () => ({ discover: idsFor(state, 'discover').length, review: reviewQueue(state).length, saved: state.bookmarks.length }),
    [state],
  )

  return (
    <div className="relative flex h-full flex-col">
      {/* What you're studying, in full, with how you're studying it underneath; you on the right. */}
      <header className="relative z-20 flex shrink-0 touch-none items-start gap-3 px-5 pb-2.5">
        <div className="min-w-0 flex-1">
          <div data-tour="deck"><DeckPicker onSourceChange={() => scroller.current?.scrollTo({ top: 0 })} /></div>
          <SubLine mode={mode} counts={counts} setMode={setMode} />
        </div>
        <div data-tour="goal" className="shrink-0"><AvatarLevel onClick={() => go('profile')} size={40} /></div>
      </header>

      {state.onboarded && state.deckChosen && (tour || !state.tips.includes('tour-learn')) && <LearnTour active={active} onDone={() => { setTour(false); dismissTip('tour-learn') }} />}
      <Coach
        tips={state.tips}
        answered={Object.keys(state.cards).length}
        active={active}
        reviewDue={counts.review}
        mode={mode}
        dismiss={dismissTip}
        onReview={() => setMode('review')}
      />
      <div ref={scroller} className="no-scrollbar min-h-0 flex-1 touch-none overflow-hidden overscroll-contain [overflow-anchor:none]">
        {ids.map((id, i) => {
          // Deleting the deck you're on leaves stale ids for one render, until the effect above re-snapshots.
          const card = findCard(state, id)
          // Only the current card and two on each side are drawn; the rest are empty pages that keep the scroll length.
          const near = Math.abs(i - active) <= 2
          return card && (
          <section key={`${mode}-${i}-${id}`} data-index={i} className="h-full px-4 pb-2" aria-label={mode === 'discover' ? `Card ${i + 1}` : `Card ${i + 1} of ${ids.length}`}>
            {near && (
              <FeedCard
                card={card}
                mode={mode}
                index={i}
                live={i === active}
                total={ids.length}
                tag={mode === 'discover' ? tags.current[i] ?? tagFor(state, id) : undefined}
                answered={answers[i]}
                onPick={(choice) => pickFor(i, choice)}
              />
            )}
          </section>
          )
        })}
        <section data-index={ids.length} className="h-full px-4 pb-2">
          <EndCard mode={mode} empty={ids.length === 0} counts={counts} setMode={setMode} go={go} />
        </section>
      </div>
    </div>
  )
}

interface Answered { choice: number; result: AnswerResult; streak: number }

function FeedCard({
  card, mode, index, live, total, tag, answered, onPick,
}: {
  card: Card
  mode: FeedMode
  index: number
  /** The card on screen; only it runs ambient scene animation. */
  live: boolean
  total: number
  /** Study feed: what this card is here for. */
  tag?: Tag
  answered?: Answered
  onPick: (choice: number) => void
}) {
  const { state, toggleBookmark } = useGame()
  const deck = (card as DeckFeedCard).deck
  const topic = deck ? { name: deck.name, accent: '#b9a7f2', scene: deck.scene } : TOPICS[card.topic]
  const choice = answered?.choice ?? null
  const result = answered?.result ?? null
  const status = statusOf(state, card.id)
  const saved = state.bookmarks.includes(card.id)
  const isReview = mode !== 'discover' && (result?.from ?? status) !== 'new'

  const pick = (i: number) => {
    if (!result) onPick(i)
  }
  const recall = card.q.kind === 'recall'
  const [revealed, setRevealed] = useState(false)

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
  }, [result, revealed])

  const visibleChoices = card.choices
    .map((c, i) => ({ c, i }))
    .filter(({ i }) => !result || i === card.answerIndex || i === choice)

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-paper text-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)]">
      <div className="grain relative h-[23%] min-h-[116px] shrink-0 overflow-hidden">
        {/* drifts at a fraction of the card's speed while swiping, so the scene feels deeper than the card */}
        <div className="parallax absolute inset-0" style={{ transform: `translateY(calc((var(--p, ${index}) - ${index}) * 46px)) scale(1.25)` }}>
          <SceneSvg scene={topic.scene} still={!live} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-paper to-transparent" />
        <div className="absolute inset-x-3 top-3 flex items-start gap-2">
          {isReview && (
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-extrabold text-gold">
              Review · {MASTERY_LABEL[result?.from ?? status]}
            </span>
          )}
          <button
            onClick={() => toggleBookmark(card.id)}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from saved' : 'Save for later'}
            className={`ml-auto grid size-9 place-items-center rounded-full transition active:scale-90 ${saved ? 'bg-gold text-ink' : 'bg-white/85 text-ink/70 hover:bg-white'}`}
          >
            <Icon name="bookmark" size={17} filled={saved} />
          </button>
        </div>
      </div>

      <div ref={fitRef} className="relative -mt-2 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-3" style={{ fontSize: 16 }}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="line-clamp-2 text-[0.68em] font-black" style={{ color: shade(topic.accent) }}>{card.hook}</p>
          {tag ? (
            <span className={`shrink-0 rounded-full px-2 py-px text-[0.62em] font-extrabold ${tag === 'New' ? 'bg-sky/30 text-[#2f5f8f]' : tag === 'Review' ? 'bg-gold/35 text-[#7a5410]' : 'bg-lav/25 text-[#5b47a8]'}`}>{tag}</span>
          ) : (
            <span className="shrink-0 text-[0.68em] font-bold tabular-nums text-ink/40">{index + 1} / {total}</span>
          )}
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
                <p className="text-[0.95em] font-extrabold">{result.correct ? pickLine(card.id, RIGHT) : result.partial ? 'Nearly there. It’s back tomorrow.' : recall ? 'It’ll come back soon for another go.' : 'Not quite — here’s the idea'}</p>
                {card.explain && <p className="mt-[0.25em] text-[0.88em] leading-[1.45] text-ink/75">{card.explain}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-[0.75em]">
          <div data-tour="quiz" className="relative rounded-3xl bg-white/70 p-[0.6em] ring-1 ring-ink/5">
            {result?.correct && (answered?.streak ?? 0) >= 2 && (
              <motion.span
                initial={{ scale: 0.4, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 16 }}
                className="absolute -top-3 right-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-peach to-gold px-2.5 py-1 text-[11px] font-extrabold text-[#5a3208] shadow-md"
              >
                <Icon name="flame" size={13} filled /> {answered!.streak} in a row
              </motion.span>
            )}
            <p className="px-1 pb-[0.5em] text-[0.92em] font-extrabold leading-snug">{card.prompt}</p>
            {recall ? (
              <Recall answer={card.q.kind === 'recall' ? card.q.answer : ''} shown={revealed || !!result} onReveal={() => setRevealed(true)} grade={result ? choice : null} onGrade={pick} />
            ) : (
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
                      data-choice={i}
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
            )}
          </div>

        </div>
      </div>
    </article>
  )
}

/** First time in Learn: pick what to study. The nature deck is one option, not the default. */
function StudyChooser() {
  const { setActiveDeck } = useGame()
  const [importing, setImporting] = useState<'ai' | 'paste' | null>(null)
  const options = [
    { title: 'Create with AI', text: 'Type a topic like "system design", or paste a job description. ChatGPT or Claude writes the cards.', icon: 'spark', run: () => setImporting('ai'), main: true },
    { title: 'Paste flashcards', text: 'Bring a set from Quizlet, Anki, Knowt or your notes.', icon: 'book', run: () => setImporting('paste') },
    { title: 'Try the nature deck', text: '72 built-in cards about the sky, oceans, forests and animals.', icon: 'leaf', run: () => setActiveDeck(null) },
  ]
  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto px-4 pb-6">
      <h1 className="mt-6 font-display text-3xl font-bold">What do you want to study?</h1>
      <p className="mt-2 text-[15px] text-cream/65">Learn turns it into an endless feed of cards, with reviews spaced out so it sticks.</p>
      <ul className="mt-6 space-y-2.5">
        {options.map((o) => (
          <li key={o.title}>
            <button onClick={o.run} className={`flex w-full items-start gap-3 rounded-3xl p-4 text-left transition active:scale-[.98] ${o.main ? 'bg-gold text-ink' : 'clay'}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${o.main ? 'bg-ink/10' : 'bg-white/8 text-gold'}`}><Icon name={o.icon} size={19} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold leading-tight">{o.title}</span>
                <span className={`mt-0.5 block text-[13px] leading-snug ${o.main ? 'text-ink/70' : 'text-cream/60'}`}>{o.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {createPortal(
        <AnimatePresence>{importing && <DeckImport initialMode={importing} onClose={() => setImporting(null)} onImported={() => {}} />}</AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

const GRADES = [
  { label: 'Missed it', cls: 'bg-coral/20 ring-coral/60' },
  { label: 'Partly', cls: 'bg-gold/30 ring-[#c99a34]/60' },
  { label: 'Got it', cls: 'bg-sage/35 ring-[#4f9a6a]/70' },
]

/** Recall: think of your answer, reveal the model answer, then rate yourself honestly. */
function Recall({ answer, shown, onReveal, grade, onGrade }: {
  answer: string; shown: boolean; onReveal: () => void; grade: number | null; onGrade: (g: number) => void
}) {
  if (!shown) {
    return <button onClick={onReveal} className="clay-btn clay-ink min-h-12 w-full text-[0.9em]">Reveal answer</button>
  }
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-2xl bg-paper px-3 py-[0.6em] text-[0.88em] leading-[1.45] text-ink/85 ring-1 ring-ink/10">
        {answer}
      </motion.div>
      {grade == null ? (
        <>
          <p className="mt-[0.55em] px-1 text-[0.78em] font-extrabold text-ink/55">How did you do?</p>
          <div className="mt-[0.35em] grid grid-cols-3 gap-[0.4em]">
            {GRADES.map((g, i) => (
              <button key={g.label} data-choice={i} onClick={() => onGrade(i)} className={`min-h-11 rounded-2xl px-1 text-[0.82em] font-extrabold ring-1 transition active:scale-95 ${g.cls}`}>
                {g.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-[0.45em] px-1 text-[0.78em] font-extrabold text-ink/55">You said: {GRADES[grade].label}</p>
      )}
    </div>
  )
}

const firstSentence = (text: string) => (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim()

/** Under the deck name: what this stack is, and a way back from Saved. */
function SubLine({ mode, counts, setMode }: { mode: FeedMode; counts: Record<FeedMode, number>; setMode: (m: FeedMode) => void }) {
  const chip = 'flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-extrabold'
  if (mode === 'saved') {
    return (
      <div className="mt-1 flex">
        <button onClick={() => setMode('discover')} className={`${chip} bg-white/10 text-cream/85`} aria-label="Leave saved cards">
          Saved cards <span className="tabular-nums text-cream/50">{counts.saved}</span><Icon name="x" size={11} strokeWidth={3} className="opacity-60" />
        </button>
      </div>
    )
  }
  if (mode === 'review') return <p className="mt-1 text-xs font-extrabold text-cream/55">Review · {counts.review ? `${counts.review} due` : 'all caught up'}</p>
  return null
}

const RIGHT = ['Nailed it!', 'Exactly right!', 'Sharp eyes!', 'You got it!', 'Mochi is impressed!']
const pickLine = (id: string, lines: string[]) => lines[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % lines.length]

/** Darken a pastel accent so it reads as text on paper. */
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.round(v * 0.55)
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

const TOUR: { target: string; title: string; text: string; swipe?: boolean }[] = [
  { target: 'text', title: 'One card, one idea', text: 'Each card teaches one thing. Read it first.' },
  { target: 'quiz', title: 'Answer the question', text: 'Right answers earn XP. Misses come back later.' },
  { target: 'card', title: 'Swipe for the next card', text: 'Swipe up to move on, down to go back.', swipe: true },
  { target: 'deck', title: 'What you study', text: 'Tap the deck name to switch decks, or make a new one with AI or your flashcards.' },
  { target: 'review', title: 'Review tab', text: 'Cards you learned come back here on a schedule. The number shows how many are due.' },
  { target: 'goal', title: 'Daily goal', text: 'The ring fills as you answer: 10 a day builds a streak.' },
]

/**
 * A one-time spotlight tour of Learn. Everything but the explained part is dimmed, and the
 * explanation is a small dark bubble with a pointer, so it never reads as part of a card.
 */
function LearnTour({ active, onDone }: { active: number; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const s = TOUR[step]
  useLayoutEffect(() => {
    const measure = () => {
      const art = document.querySelector(`main section[data-index="${active}"] article`)
      let r: DOMRect | null = null
      if (s.target === 'card') r = art?.getBoundingClientRect() ?? null
      else if (s.target === 'text') {
        // the hook line, title and body: from the top of the hook row to the end of the text
        const h2 = art?.querySelector('h2')
        const body = h2?.nextElementSibling
        const top = h2?.previousElementSibling ?? h2
        if (top && body) {
          const a = top.getBoundingClientRect()
          const b = body.getBoundingClientRect()
          r = new DOMRect(Math.min(a.left, b.left), a.top, Math.max(a.right, b.right) - Math.min(a.left, b.left), b.bottom - a.top)
        }
      } else r = document.querySelector(`main [data-tour="${s.target}"], nav [data-tour="${s.target}"]`)?.getBoundingClientRect() ?? null
      setRect(r && { top: r.top, left: r.left, width: r.width, height: r.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [s.target, active])

  const last = step === TOUR.length - 1
  const next = () => (last ? onDone() : setStep(step + 1))
  const pad = 6
  const box = rect && { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }

  // Bubble: 340px wide at most, under the highlight if there's room, else above, else low on screen.
  const vw = innerWidth
  const vh = innerHeight
  const w = Math.min(340, vw - 32)
  const h = 150
  const place: 'below' | 'above' | 'inside' = !box ? 'inside' : vh - (box.top + box.height) >= h + 24 ? 'below' : box.top >= h + 24 ? 'above' : 'inside'
  const cx = box ? box.left + box.width / 2 : vw / 2
  const left = Math.max(16, Math.min(vw - 16 - w, cx - w / 2))
  const pos = place === 'below' ? { top: box!.top + box!.height + 12 } : place === 'above' ? { bottom: vh - box!.top + 12 } : { bottom: 110 }
  const arrowX = Math.max(18, Math.min(w - 18, cx - left))

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Learn tour">
      {box ? (
        <motion.div
          className="pointer-events-none absolute rounded-[22px] ring-2 ring-gold"
          style={{ boxShadow: '0 0 0 9999px rgba(18, 12, 30, .74)' }}
          initial={false}
          animate={box}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(18,12,30,.74)]" />
      )}
      {s.swipe && box && (
        <motion.span
          className="pointer-events-none absolute left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-full bg-gold text-ink shadow-lg"
          style={{ top: box.top + box.height * 0.42 }}
          animate={{ y: [30, -40], opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          aria-hidden="true"
        >
          <Icon name="down" size={20} strokeWidth={3} className="rotate-180" />
        </motion.span>
      )}
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
        className="absolute rounded-2xl bg-ink-2 p-4 text-cream shadow-[0_14px_34px_-10px_rgba(0,0,0,.7)] ring-2 ring-gold/80"
        style={{ left, width: w, ...pos }}
      >
        {place !== 'inside' && (
          <span
            className={`absolute size-3 rotate-45 bg-ink-2 ${place === 'below' ? '-top-[7px] border-l-2 border-t-2' : '-bottom-[7px] border-b-2 border-r-2'} border-gold/80`}
            style={{ left: arrowX - 6 }}
            aria-hidden="true"
          />
        )}
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[11px] font-extrabold text-ink">Tour {step + 1}/{TOUR.length}</span>
          <p className="min-w-0 truncate font-display text-[17px] font-bold leading-tight">{s.title}</p>
        </div>
        <p className="mt-1.5 text-[14px] leading-snug text-cream/80">{s.text}</p>
        <div className="mt-3 flex items-center gap-2">
          {!last && <button onClick={onDone} className="min-h-10 rounded-lg px-2 text-sm font-extrabold text-cream/55 hover:text-cream">Skip tour</button>}
          {step > 0 && <button onClick={() => setStep(step - 1)} className="ml-auto min-h-10 rounded-xl bg-white/10 px-4 text-sm font-extrabold text-cream/85 hover:bg-white/15">Back</button>}
          <button onClick={next} autoFocus className={`clay-btn clay-butter min-h-10 px-5 text-sm ${step > 0 ? '' : 'ml-auto'}`}>{last ? 'Start learning' : 'Next'}</button>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * First-run coaching, one bubble at a time: how to answer, how to move on, what the header
 * controls do, and what Review is the first time something is due. Each is shown once.
 */
function Coach({ tips, answered, active, reviewDue, mode, dismiss, onReview }: {
  tips: string[]; answered: number; active: number; reviewDue: number; mode: FeedMode
  dismiss: (id: string) => void; onReview: () => void
}) {
  const seen = (id: string) => tips.includes(id)
  // answering and swiping teach themselves: the tip goes away once you've done it
  useEffect(() => {
    if (answered > 0 && !seen('coach-answer')) dismiss('coach-answer')
    if (active > 0 && !seen('coach-swipe')) dismiss('coach-swipe')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, active])

  let tip: { id: string; text: string; action?: { label: string; run: () => void } } | null = null
  // the first-run basics are taught by the Learn tour; what's left is the first time reviews come due
  if (!seen('tour-learn')) tip = null
  else if (reviewDue > 0 && mode !== 'review' && !seen('coach-review')) tip = { id: 'coach-review', text: `${reviewDue} card${reviewDue === 1 ? ' is' : 's are'} due for review. Cards come back after a day, then 3 days, a week and longer, so they stick.`, action: { label: 'Review now', run: onReview } }

  return (
    <AnimatePresence>
      {tip && (
        <motion.div
          key={tip.id}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
          className="pointer-events-auto absolute inset-x-6 bottom-5 z-30 flex items-center gap-3 rounded-3xl bg-ink-2 p-3 pl-4 text-cream shadow-[0_12px_30px_-8px_rgba(0,0,0,.6)] ring-1 ring-white/10"
          role="status"
        >
          {tip.id === 'coach-swipe' && (
            <motion.span animate={{ y: [3, -3, 3] }} transition={{ repeat: Infinity, duration: 1.2 }} className="shrink-0 text-gold" aria-hidden="true">
              <Icon name="down" size={18} strokeWidth={3} className="rotate-180" />
            </motion.span>
          )}
          <p className="min-w-0 flex-1 text-[13px] leading-snug">{tip.text}</p>
          {tip.action ? (
            <button onClick={() => { dismiss(tip!.id); tip!.action!.run() }} className="clay-btn clay-butter min-h-10 shrink-0 px-3 text-xs">{tip.action.label}</button>
          ) : null}
          <button onClick={() => dismiss(tip!.id)} className="min-h-10 shrink-0 rounded-xl px-2 text-xs font-extrabold text-cream/60 hover:text-cream">Got it</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function NextReview() {
  const { state } = useGame()
  const at = nextDueAt(state)
  if (at == null) return null
  const ms = at - Date.now()
  const h = Math.round(ms / 3_600_000)
  const when = ms <= 0 ? 'now' : ms < 3_600_000 ? `in ${Math.max(1, Math.round(ms / 60_000))} min` : h < 24 ? `in ${h} h` : `in ${Math.round(h / 24)} day${Math.round(h / 24) === 1 ? '' : 's'}`
  return <p className="mt-3 rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-cream/65">Next review {when}</p>
}

function EndCard({ mode, empty, counts, setMode, go }: { mode: FeedMode; empty: boolean; counts: Record<FeedMode, number>; setMode: (m: FeedMode) => void; go: (t: Tab, m?: FeedMode) => void }) {
  const copy = {
    discover: empty
      ? ['Nothing to study yet', 'This deck has no cards. Tap the deck name up top to pick another, or make one with AI.']
      : ['Keep going', 'More practice cards are on the way.'],
    review: empty
      ? ['Nothing due right now', 'Cards come back here on a schedule: a day after you learn them, then 3 days, a week and longer.']
      : ['Review done', 'Nice. Each card you got right comes back later, spaced further out every time.'],
    saved: empty
      ? ['No saved cards', 'Tap the bookmark on any card to keep it here for later.']
      : ['End of your saved cards', 'Saved cards stay here until you unsave them.'],
  }[mode]
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-ink-3 to-ink-2 p-8 text-center">
      <Cat sleeping={mode !== 'review'} className="h-24 w-28" />
      <h2 className="mt-3 font-display text-3xl font-bold">{copy[0]}</h2>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-cream/70">{copy[1]}</p>
      {counts.review === 0 && <NextReview />}
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        {mode !== 'review' && counts.review > 0 && (
          <button onClick={() => setMode('review')} className="rounded-2xl clay-btn clay-butter py-3 font-extrabold text-ink">
            Review {counts.review} concept{counts.review === 1 ? '' : 's'}
          </button>
        )}
        {mode !== 'discover' && counts.discover > 0 && (
          <button onClick={() => setMode('discover')} className="clay-btn clay-cream py-3">
            Study {counts.discover} card{counts.discover === 1 ? '' : 's'}
          </button>
        )}
        <button onClick={() => go('profile')} className="clay-btn clay-plum py-3">See your progress</button>
      </div>
    </div>
  )
}
