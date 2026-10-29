// Decks your group has shared: search them, preview one, and add a copy to your own decks.
// Lives inside the Friends tab, which handles the title and signing in.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAccount } from '../net/account'
import { errorText } from '../net/client'
import { useGame } from '../state/store'
import { cleanDeck } from '../state/sanitize'
import { DECK_SCENES } from '../data/decks'
import { SceneSvg, type SceneId } from '../art/Landscape'
import { Icon } from '../components/Icon'
import type { Tab } from '../components/NavBar'

interface Listing {
  id: string
  name: string
  topic: string | null
  scene: string
  card_count: number
  copies: number
  owner: string
  created_at: string
  profiles: { name: string } | null
}

type Sort = 'popular' | 'new'
const sceneOf = (s: string): SceneId => (DECK_SCENES.includes(s as SceneId) ? (s as SceneId) : 'meadow')

export function ExploreScreen({ go }: { go: (t: Tab) => void }) {
  const { status, client } = useAccount()
  const [rows, setRows] = useState<Listing[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('popular')
  const [open, setOpen] = useState<Listing | null>(null)

  const load = useCallback(async () => {
    if (!client || status !== 'member') return
    setError(null)
    const { data, error } = await client
      .from('shared_decks')
      .select('id, name, topic, scene, card_count, copies, owner, created_at, profiles!shared_decks_owner_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(300)
    if (error) setError(errorText(error))
    else setRows(data as unknown as Listing[])
  }, [client, status])
  useEffect(() => { void load() }, [load])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = (rows ?? []).filter((r) => !q || `${r.name} ${r.topic ?? ''} ${r.profiles?.name ?? ''}`.toLowerCase().includes(q))
    return sort === 'popular' ? [...list].sort((a, b) => b.copies - a.copies || b.created_at.localeCompare(a.created_at)) : list
  }, [rows, query, sort])

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain px-4 pb-8">
      {status === 'member' && (
        <>
          <div className="flex gap-2">
            <label className="clay flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl px-3">
              <Icon name="spark" size={15} className="shrink-0 text-cream/40" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search decks or people" aria-label="Search decks"
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-cream placeholder:text-cream/35 focus:outline-none" />
            </label>
            <button onClick={() => setSort(sort === 'popular' ? 'new' : 'popular')} className="clay min-h-11 shrink-0 rounded-2xl px-3 text-xs font-extrabold text-cream/80" aria-label={`Sorted by ${sort === 'popular' ? 'most added' : 'newest'}. Change`}>
              {sort === 'popular' ? 'Most added' : 'Newest'}
            </button>
          </div>
          <p className="mt-2 text-xs text-cream/45">Share your own from a deck's edit page.</p>

          {error ? (
            <div className="clay mt-4 rounded-3xl p-5 text-center">
              <p className="text-sm text-cream/70">{error}</p>
              <button onClick={() => void load()} className="clay-btn clay-cream mt-3 min-h-11 px-5 text-sm">Try again</button>
            </div>
          ) : !rows ? (
            <ul className="mt-4 space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <li key={i} className="clay h-20 animate-pulse rounded-2xl" />)}</ul>
          ) : shown.length === 0 ? (
            <p className="clay mt-4 rounded-3xl p-5 text-center text-sm text-cream/60">{rows.length ? 'No decks match that search.' : 'No shared decks yet. Be the first: open one of your decks and tap Share with your group.'}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {shown.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setOpen(r)} className="clay flex w-full items-stretch gap-3 overflow-hidden rounded-2xl text-left">
                    <SceneSvg scene={sceneOf(r.scene)} still className="h-auto w-16 shrink-0" />
                    <span className="min-w-0 flex-1 py-2.5 pr-3">
                      <span className="block font-extrabold leading-tight">{r.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-cream/55">by {r.profiles?.name ?? 'someone'} · {r.card_count} cards</span>
                      {r.copies > 0 && <span className="mt-1 inline-block rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-extrabold text-cream/60">Added {r.copies}×</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <AnimatePresence>
        {open && <DeckPreview key={open.id} listing={open} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); void load() }} go={go} />}
      </AnimatePresence>
    </div>
  )
}

function DeckPreview({ listing, onClose, onChanged, go }: { listing: Listing; onClose: () => void; onChanged: () => void; go: (t: Tab) => void }) {
  const { client, me } = useAccount()
  const { state, importDeck, updateDeck } = useGame()
  const [deck, setDeck] = useState<ReturnType<typeof cleanDeck> | undefined>(undefined)
  const [note, setNote] = useState<string | null>(null)
  const [confirmReport, setConfirmReport] = useState(false)
  const mine = listing.owner === me?.id

  useEffect(() => {
    void client!.from('shared_decks').select('id, name, topic, scene, reverse, cards').eq('id', listing.id).maybeSingle().then(({ data }) => {
      // shared decks come from other people's devices: check them like any save
      setDeck(data ? cleanDeck({ ...data, createdAt: 0 }) : null)
    })
  }, [client, listing.id])

  const add = async () => {
    if (!deck) return
    importDeck(deck.name, deck.cards, { topic: deck.topic, scene: deck.scene, reverse: deck.reverse, origin: 'explore' })
    void client!.rpc('count_copy', { deck: listing.id })
    onClose()
    go('feed')
  }
  const unshare = async () => {
    const { error } = await client!.from('shared_decks').delete().eq('id', listing.id)
    if (error) return setNote(errorText(error))
    for (const d of state.decks) if (d.sharedId === listing.id) updateDeck(d.id, { sharedId: undefined })
    onChanged()
  }
  const report = async () => {
    const { error } = await client!.rpc('report_deck', { deck: listing.id })
    setNote(error ? errorText(error) : 'Thanks. Decks reported by two people are hidden.')
    setConfirmReport(false)
  }

  return createPortal(
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog" aria-modal="true" aria-label={listing.name}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className="clay flex max-h-[86vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] text-cream"
      >
        <div className="relative h-24 shrink-0">
          <SceneSvg scene={sceneOf(listing.scene)} still className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-2 to-transparent" />
        </div>
        <div className="-mt-6 px-5">
          <h2 className="relative font-display text-2xl font-bold leading-tight">{listing.name}</h2>
          <p className="mt-1 text-xs text-cream/55">by {mine ? 'you' : listing.profiles?.name ?? 'someone'} · {listing.card_count} cards{listing.copies ? ` · added ${listing.copies}×` : ''}</p>
        </div>
        <div className="no-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto px-5">
          {deck === undefined ? (
            <p className="py-6 text-center text-sm text-cream/50">Loading cards…</p>
          ) : deck === null ? (
            <p className="py-6 text-center text-sm text-cream/50">This deck isn't available any more.</p>
          ) : (
            <ul className="space-y-1.5">
              {deck.cards.slice(0, 8).map((c) => (
                <li key={c.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <span className="font-extrabold">{c.term}</span> <span className="text-cream/55">· {c.definition}</span>
                </li>
              ))}
              {deck.cards.length > 8 && <li className="px-1 py-1 text-xs font-bold text-cream/45">and {deck.cards.length - 8} more</li>}
            </ul>
          )}
        </div>
        <div className="shrink-0 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          {note && <p role="status" className="mb-2 text-center text-xs font-bold text-cream/70">{note}</p>}
          {mine ? (
            <button onClick={() => void unshare()} className="clay-btn clay-plum min-h-12 w-full text-[15px]">Stop sharing</button>
          ) : (
            <>
              <button onClick={() => void add()} disabled={!deck} className="clay-btn clay-butter min-h-12 w-full text-[15px] disabled:opacity-50">Add to my decks and study</button>
              <button onClick={() => (confirmReport ? void report() : setConfirmReport(true))} className={`mt-2 w-full text-xs font-bold ${confirmReport ? 'text-coral' : 'text-cream/45'}`}>
                {confirmReport ? 'Tap again to report this deck' : 'Report this deck'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
