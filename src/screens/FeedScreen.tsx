import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { CARDS, CARD_BY_ID, TOPICS, type Card } from '../data/cards'
import { reviewQueue, statusOf, type AnswerResult, type GameState, type Mastery } from '../state/game'
import { SceneSvg } from '../art/Landscape'
import { Cat } from '../art/Companions'
import { Coin, Icon } from '../components/Icon'
import type { Tab } from '../components/NavBar'

export type FeedMode = 'discover' | 'review' | 'saved'

const idsFor = (s: GameState, mode: FeedMode) =>
  mode === 'discover'
    ? CARDS.filter((c) => statusOf(s, c.id) === 'new').map((c) => c.id)
    : mode === 'review'
      ? reviewQueue(s).map((c) => c.id)
      : s.bookmarks.filter((id) => CARD_BY_ID[id])

export const MASTERY_LABEL: Record<Mastery, string> = { new: 'New', learning: 'Learning', familiar: 'Familiar', mastered: 'Mastered' }

export function FeedScreen({ mode, setMode, go }: { mode: FeedMode; setMode: (m: FeedMode) => void; go: (t: Tab, m?: FeedMode) => void }) {
  const { state, answer } = useGame()
  // Snapshot the list when the mode opens, so answering a card doesn't yank it out from under you.
  const [ids, setIds] = useState(() => idsFor(state, mode))
  const [active, setActive] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)
  const answerFns = useRef<Record<number, (i: number) => void>>({})

  useEffect(() => {
    setIds(idsFor(state, mode))
    setActive(0)
    scroller.current?.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

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
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (/^[1-4]$/.test(e.key)) answerFns.current[active]?.(Number(e.key) - 1)
      else if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); scrollTo(Math.min(active + 1, ids.length)) }
      else if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); scrollTo(Math.max(active - 1, 0)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, ids.length, scrollTo])

  const counts = { discover: idsFor(state, 'discover').length, review: reviewQueue(state).length, saved: state.bookmarks.length }
  const explored = Object.keys(state.cards).length

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pb-2">
        <div role="tablist" aria-label="Feed" className="flex gap-1.5">
          {(['discover', 'review', 'saved'] as FeedMode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => (mode === m ? (setIds(idsFor(state, m)), scroller.current?.scrollTo({ top: 0 })) : setMode(m))}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold capitalize transition ${mode === m ? 'bg-cream text-ink' : 'bg-white/8 text-cream/70 hover:bg-white/12'}`}
            >
              {m} <span className={mode === m ? 'text-ink/50' : 'text-cream/40'}>{counts[m]}</span>
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] font-bold tabular-nums text-cream/50" aria-label="Concepts explored">
          {explored}/{CARDS.length} explored
        </span>
      </div>

      {/* thin progress through the current stack */}
      <div className="mx-4 mb-1 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-sky via-lav to-peach" animate={{ width: `${ids.length ? (Math.min(active + 1, ids.length) / ids.length) * 100 : 100}%` }} />
      </div>

      <div ref={scroller} className="no-scrollbar min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto scroll-smooth">
        {ids.map((id, i) => (
          <section key={`${mode}-${id}`} data-index={i} className="h-full snap-start snap-always px-3 py-2" aria-label={`Card ${i + 1} of ${ids.length}`}>
            <FeedCard
              card={CARD_BY_ID[id]}
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
  const topic = TOPICS[card.topic]
  const [choice, setChoice] = useState<number | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const feedback = useRef<HTMLDivElement>(null)
  const status = statusOf(state, card.id)
  const saved = state.bookmarks.includes(card.id)
  const isReview = mode !== 'discover' && (result?.from ?? status) !== 'new'

  const pick = (i: number) => {
    if (result || i >= card.choices.length) return
    setChoice(i)
    setResult(onAnswer(i))
  }
  registerAnswer(pick)

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-paper text-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)]">
      <div className="grain relative h-[27%] min-h-[128px] shrink-0 overflow-hidden">
        <SceneSvg scene={topic.scene} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent" />
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
        <span className="absolute bottom-6 right-4 text-[11px] font-bold text-ink/45 tabular-nums">{index + 1} / {total}</span>
      </div>

      <div className="no-scrollbar relative -mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: shade(topic.accent) }}>{card.hook}</p>
        <h2 className="mt-1 font-display text-[26px] font-bold leading-[1.1] text-ink">{card.title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/75">{card.body}</p>

        <div className="mt-4 rounded-3xl bg-white/70 p-3 ring-1 ring-ink/5">
          <p className="px-1 pb-2.5 text-[15px] font-extrabold leading-snug">{card.prompt}</p>
          <div className={`grid gap-2 ${card.choices.length === 2 ? 'grid-cols-2' : ''}`}>
            {card.choices.map((c, i) => {
              const isAnswer = i === card.answerIndex
              const st = !result ? 'idle' : isAnswer ? 'right' : i === choice ? 'wrong' : 'dim'
              return (
                <motion.button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={!!result}
                  whileTap={result ? undefined : { scale: 0.97 }}
                  animate={st === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : st === 'right' && i === choice ? { scale: [1, 1.04, 1] } : {}}
                  transition={{ duration: 0.35 }}
                  className={`relative flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-[14px] font-bold leading-snug transition ${
                    st === 'idle' ? 'bg-paper ring-1 ring-ink/10 hover:bg-white hover:ring-ink/20'
                    : st === 'right' ? 'bg-sage/35 ring-2 ring-[#4f9a6a]'
                    : st === 'wrong' ? 'bg-coral/20 ring-2 ring-coral'
                    : 'bg-paper/60 text-ink/40 ring-1 ring-ink/5'
                  }`}
                >
                  <span className={`grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-black ${st === 'right' ? 'bg-[#4f9a6a] text-white' : st === 'wrong' ? 'bg-coral text-white' : 'bg-ink/8 text-ink/60'}`}>
                    {st === 'right' ? <Icon name="check" size={14} strokeWidth={3} /> : st === 'wrong' ? <Icon name="x" size={13} strokeWidth={3} /> : i + 1}
                  </span>
                  <span>{c}</span>
                  {st === 'right' && i === choice && <RewardBurst xp={result!.xp} coins={result!.coins} />}
                </motion.button>
              )
            })}
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div ref={feedback} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onAnimationStart={() => setTimeout(() => feedback.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 60)} className="mt-3 scroll-mb-4" role="status">
              <div className={`flex gap-3 rounded-3xl p-3.5 ${result.correct ? 'bg-sage/20' : 'bg-peach/20'}`}>
                <Cat sleeping={!result.correct} className="h-12 w-14 shrink-0" />
                <div className="min-w-0">
                  <p className="font-extrabold">{result.correct ? pickLine(card.id, RIGHT) : 'Not quite — here’s the idea'}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink/75">{card.explain}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] font-extrabold">
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-lav">+{result.xp} XP</span>
                    {result.coins > 0 && <span className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[#c48a1a]"><Coin size={13} />+{result.coins}</span>}
                    {result.from !== result.to && (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-cream">{MASTERY_LABEL[result.from]} → {MASTERY_LABEL[result.to]}</span>
                    )}
                    {!result.correct && <span className="text-ink/55">It'll come back in Review.</span>}
                  </div>
                </div>
              </div>
              <button onClick={onNext} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3 font-extrabold text-cream transition active:scale-[.98]">
                Next card <Icon name="down" size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {!result && <p className="mt-auto pt-3 text-center text-[11px] font-semibold text-ink/35">Tap an answer · keys 1–{card.choices.length} · scroll for the next card</p>}
      </div>
    </article>
  )
}

const RIGHT = ['Nailed it!', 'Exactly right!', 'Sharp eyes!', 'You got it!', 'Mochi is impressed!']
const pickLine = (id: string, lines: string[]) => lines[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % lines.length]

function RewardBurst({ xp, coins }: { xp: number; coins: number }) {
  return (
    <motion.span
      className="pointer-events-none absolute -top-2 right-3 flex gap-1 text-sm font-black"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: [0, 1, 1, 0], y: -34 }}
      transition={{ duration: 1.3, ease: 'easeOut' }}
      aria-hidden="true"
    >
      <span className="rounded-full bg-lav px-2 py-0.5 text-white shadow">+{xp} XP</span>
      {coins > 0 && <span className="flex items-center gap-0.5 rounded-full bg-gold px-2 py-0.5 text-ink shadow"><Coin size={13} />+{coins}</span>}
    </motion.span>
  )
}

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
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-ink-3 to-ink-2 p-8 text-center ring-1 ring-white/10">
      <Cat sleeping={mode !== 'review'} className="h-24 w-28" />
      <h2 className="mt-3 font-display text-3xl font-bold">{copy[0]}</h2>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-cream/70">{copy[1]}</p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        {mode !== 'review' && counts.review > 0 && (
          <button onClick={() => setMode('review')} className="rounded-2xl bg-gradient-to-r from-gold to-peach py-3 font-extrabold text-ink">
            Review {counts.review} concept{counts.review === 1 ? '' : 's'}
          </button>
        )}
        {mode !== 'discover' && counts.discover > 0 && (
          <button onClick={() => setMode('discover')} className="rounded-2xl bg-cream py-3 font-extrabold text-ink">
            Discover {counts.discover} new card{counts.discover === 1 ? '' : 's'}
          </button>
        )}
        <button onClick={() => go('van')} className="rounded-2xl bg-white/10 py-3 font-extrabold">Visit your van</button>
      </div>
    </div>
  )
}
