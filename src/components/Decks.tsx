// Study decks: a picker for what Learn shows, and a Quizlet-style paste import.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { CARDS } from '../data/cards'
import { MIN_DECK_CARDS, cardId, detectOptions, parseDeck, type DeckCard, type ParseOptions, type RowSep, type TermSep, type UserDeck } from '../data/decks'
import { isDue, statusOf, type Mastery } from '../state/game'
import { Icon } from './Icon'

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}

/** The "Studying: …" chip in Learn and the sheet it opens. */
export function DeckPicker({ onSourceChange }: { onSourceChange: () => void }) {
  const { state, setActiveDeck, deleteDeck } = useGame()
  const [editingDeck, setEditingDeck] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const active = state.decks.find((d) => d.id === state.activeDeck)
  const close = () => { setOpen(false); setConfirmDelete(null) }
  useEscape(close)

  const choose = (id: string | null) => {
    setActiveDeck(id)
    close()
    onSourceChange()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Studying ${active?.name ?? 'Field notes'}. Change deck`}
        className="clay flex h-9 min-w-0 max-w-[11rem] items-center gap-1.5 rounded-full pl-3 pr-2 text-xs font-extrabold text-cream/85"
      >
        <Icon name="book" size={13} className="shrink-0 text-lav max-[400px]:hidden" />
        <span className="truncate">{active?.name ?? 'Field notes'}</span>
        <Icon name="chevron" size={12} strokeWidth={3} className="shrink-0 opacity-60" />
      </button>

      {/* portal: inside the Learn header the nav bar would paint over the sheet */}
      {createPortal(<AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
            <motion.div
              role="dialog" aria-modal="true" aria-label="Choose what to study"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="clay w-full max-w-[480px] rounded-t-[28px] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3"
            >
              <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-white/20" aria-hidden="true" />
              <h2 className="px-1 font-display text-xl font-bold text-cream">What do you want to study?</h2>
              <ul className="no-scrollbar mt-3 max-h-[46vh] space-y-1.5 overflow-y-auto">
                <SourceRow label="Field notes" detail={`${CARDS.length} cards · built in`} on={!active} onClick={() => choose(null)} />
                {state.decks.map((d) => (
                  <SourceRow
                    key={d.id}
                    label={d.name}
                    detail={`${d.cards.length} cards · imported`}
                    on={active?.id === d.id}
                    onClick={() => choose(d.id)}
                    onEdit={() => { close(); setEditingDeck(d.id) }}
                    onDelete={() => (confirmDelete === d.id ? (deleteDeck(d.id), setConfirmDelete(null)) : setConfirmDelete(d.id))}
                    confirming={confirmDelete === d.id}
                  />
                ))}
              </ul>
              <button onClick={() => { close(); setImporting(true) }} className="clay-btn clay-butter mt-3 flex min-h-12 w-full items-center justify-center gap-2 text-[15px]">
                <Icon name="spark" size={16} /> Import a deck
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}

      {createPortal(<AnimatePresence>{importing && <DeckImport onClose={() => setImporting(false)} onImported={onSourceChange} />}</AnimatePresence>, document.body)}
      {createPortal(
        <AnimatePresence>
          {editingDeck && state.decks.some((d) => d.id === editingDeck) && (
            <DeckPage deck={state.decks.find((d) => d.id === editingDeck)!} onClose={() => setEditingDeck(null)} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

function SourceRow({ label, detail, on, onClick, onEdit, onDelete, confirming }: {
  label: string; detail: string; on: boolean; onClick: () => void; onEdit?: () => void; onDelete?: () => void; confirming?: boolean
}) {
  return (
    <li className={`flex items-center gap-1 rounded-2xl ${on ? 'bg-gold/15' : ''}`}>
      <button onClick={onClick} aria-pressed={on} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl px-3.5 text-left">
        <Icon name="book" size={17} className={on ? 'text-gold' : 'text-cream/40'} />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[15px] font-bold ${on ? 'text-gold' : 'text-cream/90'}`}>{label}</span>
          <span className="block text-xs text-cream/50">{detail}</span>
        </span>
        {on && <Icon name="check" size={16} strokeWidth={3} className="text-gold" />}
      </button>
      {onEdit && !confirming && (
        <button
          onClick={onEdit}
          aria-label={`Edit ${label}`}
          className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-xl text-cream/45 hover:text-cream"
        >
          <Icon name="edit" size={15} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={confirming ? `Confirm deleting ${label}` : `Delete ${label}`}
          className={`mr-1.5 min-h-10 shrink-0 rounded-xl px-3 text-xs font-extrabold transition-colors ${confirming ? 'bg-coral text-ink' : 'text-cream/45 hover:text-cream'}`}
        >
          {confirming ? 'Delete?' : <Icon name="x" size={15} />}
        </button>
      )}
    </li>
  )
}

const STATUS_LABEL: Record<Mastery, string> = { new: 'New', learning: 'Learning', familiar: 'Known', mastered: 'Mastered' }

/** One imported deck: rename it, see progress, flip the practice direction, and view, edit, add or remove cards. */
function DeckPage({ deck, onClose }: { deck: UserDeck; onClose: () => void }) {
  const { state, renameDeck, updateDeck } = useGame()
  const [name, setName] = useState(deck.name)
  const [editing, setEditing] = useState<string | null>(null)
  const [term, setTerm] = useState('')
  const [def, setDef] = useState('')
  const [filter, setFilter] = useState('')
  useEscape(onClose)

  const counts = { new: 0, learning: 0, familiar: 0, mastered: 0 } as Record<Mastery, number>
  let due = 0
  for (const c of deck.cards) {
    counts[statusOf(state, c.id)]++
    if (isDue(state, c.id)) due++
  }
  const atMin = deck.cards.length <= MIN_DECK_CARDS
  const save = (cards: DeckCard[]) => updateDeck(deck.id, { cards })
  const add = () => {
    const t = term.trim(), d = def.trim()
    if (!t || !d) return
    const id = cardId(t, d)
    if (!deck.cards.some((c) => c.id === id)) save([...deck.cards, { id, term: t, definition: d }])
    setTerm('')
    setDef('')
  }
  const shown = filter.trim()
    ? deck.cards.filter((c) => (c.term + ' ' + c.definition).toLowerCase().includes(filter.trim().toLowerCase()))
    : deck.cards

  return (
    <motion.div
      className="fixed inset-0 z-[75] flex justify-center bg-ink"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
      role="dialog" aria-modal="true" aria-label={`Edit ${deck.name}`}
    >
      <div className="flex h-full w-full max-w-[480px] flex-col">
        <header className="flex items-center gap-2 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+20px)]">
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full text-cream/70 hover:text-cream">
            <Icon name="x" size={20} />
          </button>
          <input
            value={name} onChange={(e) => setName(e.target.value)} onBlur={() => renameDeck(deck.id, name)} maxLength={40} aria-label="Deck name"
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-1 font-display text-xl font-bold text-cream focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          {/* progress */}
          <div className="grid grid-cols-4 gap-1.5">
            {(['new', 'learning', 'familiar', 'mastered'] as Mastery[]).map((m) => (
              <div key={m} className="clay rounded-2xl px-1 py-2 text-center">
                <p className="font-display text-lg font-bold tabular-nums">{counts[m]}</p>
                <p className="text-[10px] font-extrabold text-cream/50">{STATUS_LABEL[m]}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-cream/55">{due ? `${due} card${due === 1 ? '' : 's'} due for review.` : 'Nothing due for review right now.'}</p>

          {/* direction */}
          <p className="mt-4 text-sm font-bold text-cream/80">Practice</p>
          <div role="radiogroup" aria-label="Practice direction" className="mt-1.5 grid grid-cols-2 gap-1 rounded-full bg-white/6 p-1">
            {[[false, 'Term → definition'], [true, 'Definition → term']].map(([rev, label]) => (
              <button
                key={String(rev)} role="radio" aria-checked={!!deck.reverse === rev}
                onClick={() => updateDeck(deck.id, { reverse: rev as boolean })}
                className={`min-h-9 rounded-full text-xs font-extrabold ${!!deck.reverse === rev ? 'bg-cream text-ink' : 'text-cream/65'}`}
              >
                {label as string}
              </button>
            ))}
          </div>

          {/* add a card */}
          <p className="mt-4 text-sm font-bold text-cream/80">Add a card</p>
          <form onSubmit={(e) => { e.preventDefault(); add() }} className="mt-1.5 space-y-1.5">
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Term" aria-label="New card term" className={FIELD} />
            <input value={def} onChange={(e) => setDef(e.target.value)} placeholder="Definition" aria-label="New card definition" className={FIELD} />
            <button type="submit" disabled={!term.trim() || !def.trim()} className={`clay-btn min-h-11 w-full text-sm ${term.trim() && def.trim() ? 'clay-butter' : 'bg-white/10 text-cream/40'}`}>Add card</button>
          </form>

          {/* cards */}
          <div className="mt-5 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-cream/80">{deck.cards.length} cards</p>
            {deck.cards.length > 8 && (
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search" aria-label="Search cards" className="min-h-9 w-36 rounded-full bg-white/8 px-3 text-xs font-bold text-cream ring-1 ring-white/12 placeholder:text-cream/35 focus:outline-none focus:ring-2 focus:ring-gold" />
            )}
          </div>
          {atMin && <p className="mt-1 text-xs text-cream/50">A deck needs at least {MIN_DECK_CARDS} cards, so cards can't be removed right now.</p>}
          <ul className="mt-2 space-y-2">
            {shown.slice(0, 300).map((c) => (
              <li key={c.id} className="clay rounded-2xl px-3.5 py-2.5">
                {editing === c.id ? (
                  <CardEditor
                    card={c}
                    onSave={(t, d) => { save(deck.cards.map((x) => (x.id === c.id ? { ...x, term: t, definition: d } : x))); setEditing(null) }}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold text-cream">{c.term}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-cream/65">{c.definition}</p>
                      <p className="mt-1 text-[10px] font-extrabold text-cream/40">{STATUS_LABEL[statusOf(state, c.id)]}</p>
                    </div>
                    <button onClick={() => setEditing(c.id)} aria-label={`Edit ${c.term}`} className="grid size-9 shrink-0 place-items-center rounded-xl text-cream/45 hover:text-cream"><Icon name="edit" size={14} /></button>
                    <button
                      onClick={() => save(deck.cards.filter((x) => x.id !== c.id))} disabled={atMin} aria-label={`Remove ${c.term}`}
                      className="grid size-9 shrink-0 place-items-center rounded-xl text-cream/45 hover:text-coral disabled:opacity-30"
                    ><Icon name="x" size={14} /></button>
                  </div>
                )}
              </li>
            ))}
            {shown.length > 300 && <li className="px-1 text-xs text-cream/50">Showing 300 of {shown.length}. Search to find others.</li>}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

const FIELD = 'min-h-11 w-full rounded-xl bg-white/8 px-3 text-sm font-bold text-cream ring-1 ring-white/12 placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold'

/** Edit a card in place. Its id (and so its progress) stays the same. */
function CardEditor({ card, onSave, onCancel }: { card: DeckCard; onSave: (term: string, def: string) => void; onCancel: () => void }) {
  const [t, setT] = useState(card.term)
  const [d, setD] = useState(card.definition)
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (t.trim() && d.trim()) onSave(t.trim(), d.trim()) }} className="space-y-1.5">
      <input autoFocus value={t} onChange={(e) => setT(e.target.value)} aria-label="Term" className={FIELD} />
      <textarea value={d} onChange={(e) => setD(e.target.value)} aria-label="Definition" rows={2} className={`${FIELD} resize-none py-2`} />
      <div className="flex gap-1.5">
        <button type="button" onClick={onCancel} className="min-h-10 flex-1 rounded-xl bg-white/10 text-xs font-extrabold">Cancel</button>
        <button type="submit" className="min-h-10 flex-1 rounded-xl bg-gold text-xs font-extrabold text-ink">Save</button>
      </div>
    </form>
  )
}

const TERM_SEPS: { id: TermSep; label: string }[] = [
  { id: 'tab', label: 'Tab' },
  { id: 'comma', label: 'Comma' },
  { id: 'dash', label: ' - ' },
  { id: 'line', label: 'Own line' },
  { id: 'custom', label: 'Custom' },
]
const ROW_SEPS: { id: RowSep; label: string }[] = [
  { id: 'newline', label: 'New line' },
  { id: 'semicolon', label: 'Semicolon' },
  { id: 'custom', label: 'Custom' },
]

/** The ? help: how to lay out pasted cards (works for Quizlet, Anki and Knowt exports too). */
const HELP_STEPS = ['Put one card per line: the term, then the definition.', 'Split them with a tab, a comma or " - ", or put each on its own line.', 'Paste it all below.']

/** Pick where the cards come from, paste, check the preview, import. */
function DeckImport({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { importDeck } = useGame()
  const [help, setHelp] = useState(false)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [opts, setOpts] = useState<ParseOptions>({ termSep: 'tab', rowSep: 'newline' })
  const [touchedSep, setTouchedSep] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [showAll, setShowAll] = useState(false)
  useEscape(onClose)

  // Until someone picks a separator themselves, follow whatever the pasted text looks like.
  const effective = touchedSep || !text ? opts : detectOptions(text)
  const result = useMemo(() => parseDeck(text, effective), [text, effective])
  const count = result.cards.length
  const ok = count >= MIN_DECK_CARDS
  const pasted = text.trim().length > 0
  const setSep = (o: Partial<ParseOptions>) => { setTouchedSep(true); setOpts({ ...effective, ...o }) }

  // Clipboard read can be refused (or prompt on iOS); then just focus the box for a manual paste.
  const paste = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (clip) setText(clip)
    } catch {
      document.getElementById('deck-text')?.focus()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[75] flex justify-center bg-ink"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
      role="dialog" aria-modal="true" aria-labelledby="import-title"
    >
      <div className="flex h-full w-full max-w-[480px] flex-col">
        <header className="flex items-center gap-2 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+20px)]">
          <button onClick={onClose} aria-label="Close import" className="grid size-10 place-items-center rounded-full text-cream/70 hover:text-cream">
            <Icon name="x" size={20} />
          </button>
          <h1 id="import-title" className="font-display text-xl font-bold">Import a deck</h1>
          <button
            onClick={() => setHelp(!help)} aria-expanded={help} aria-label="How to copy your cards"
            className={`ml-auto grid size-9 place-items-center rounded-full font-display text-base font-bold transition-colors ${help ? 'bg-cream text-ink' : 'clay text-cream/75'}`}
          >
            ?
          </button>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <p className="text-[13px] text-cream/60">Paste cards from Quizlet, Anki, Knowt or your notes.</p>
          <AnimatePresence initial={false}>
          {help && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }} className="overflow-hidden"
          >
          <ol className="mt-3 space-y-1.5">
            {HELP_STEPS.map((step, i) => (
              <li key={step} className="flex gap-2.5 text-[13px] leading-snug text-cream/75">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-lav/20 text-[11px] font-extrabold text-lav">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          </motion.div>
          )}
          </AnimatePresence>

          <div className="relative mt-4">
            <textarea
              id="deck-text" value={text} onChange={(e) => setText(e.target.value)} rows={pasted ? 4 : 6} spellCheck={false}
              placeholder="Paste your cards here" aria-label="Your cards"
              className="no-scrollbar block w-full resize-none rounded-2xl bg-white/8 py-3 pl-4 pr-24 text-[13px] leading-relaxed text-cream ring-1 ring-white/12 placeholder:text-cream/35 focus:outline-none focus:ring-2 focus:ring-gold"
            />
            {pasted ? (
              <button onClick={() => { setText(''); setTouchedSep(false); setShowAll(false) }} className="absolute right-2 top-2 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-extrabold text-cream/70 hover:text-cream">
                Clear
              </button>
            ) : (
              <button onClick={paste} className="clay-btn clay-lav absolute right-2 top-2 flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs">
                <Icon name="edit" size={13} /> Paste
              </button>
            )}
          </div>

          {pasted && (
            <section className="mt-4" aria-live="polite">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className={`font-display text-lg font-bold ${ok ? 'text-gold' : 'text-cream'}`}>
                  {count} card{count === 1 ? '' : 's'} found
                </h2>
                <button onClick={() => setFixing(!fixing)} aria-expanded={fixing} className="min-h-9 text-xs font-bold text-lav underline-offset-2 hover:underline">
                  Cards not splitting right?
                </button>
              </div>
              {(result.problems.length > 0 || result.duplicates > 0) && (
                <p className="text-xs text-cream/50">
                  {result.problems.length > 0 && `${result.problems.length} line${result.problems.length === 1 ? '' : 's'} skipped`}
                  {result.problems.length > 0 && result.duplicates > 0 && ', '}
                  {result.duplicates > 0 && `${result.duplicates} duplicate${result.duplicates === 1 ? '' : 's'} skipped`}
                </p>
              )}

              {fixing && (
                <div className="mt-2 space-y-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <SepPicker
                    label="Term and definition are split by" options={TERM_SEPS} value={effective.termSep} onChange={(termSep) => setSep({ termSep })}
                    custom={effective.customTerm} onCustom={(customTerm) => setSep({ termSep: 'custom', customTerm })}
                  />
                  {effective.termSep !== 'line' && (
                    <SepPicker
                      label="Each card ends with" options={ROW_SEPS} value={effective.rowSep} onChange={(rowSep) => setSep({ rowSep })}
                      custom={effective.customRow} onCustom={(customRow) => setSep({ rowSep: 'custom', customRow })}
                    />
                  )}
                  {result.problems.length > 0 && (
                    <ul className="space-y-1 text-xs">
                      {result.problems.slice(0, 4).map((p) => (
                        <li key={p.row} className="text-cream/70">
                          <span className="font-extrabold text-coral">Line {p.row}:</span> {p.reason}. <span className="text-cream/45">“{p.text.slice(0, 36)}”</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <ul className="mt-3 space-y-2">
                {result.cards.slice(0, showAll ? 200 : 3).map((c) => (
                  <li key={c.id} className="clay rounded-2xl px-3.5 py-2.5">
                    <p className="text-[14px] font-extrabold text-cream">{c.term}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-cream/65">{c.definition}</p>
                  </li>
                ))}
              </ul>
              {count > 3 && (
                <button onClick={() => setShowAll(!showAll)} className="mt-1 min-h-10 w-full text-xs font-bold text-cream/55 hover:text-cream">
                  {showAll ? 'Show fewer' : `Show all ${count}`}
                </button>
              )}

              <label htmlFor="deck-name" className="mt-3 block text-sm font-bold text-cream/80">Name this deck</label>
              <input
                id="deck-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Bio 101 midterm"
                className="mt-1.5 w-full rounded-2xl bg-white/8 px-4 py-3 font-bold text-cream ring-1 ring-white/12 placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </section>
          )}
        </div>

        <footer className="border-t border-white/8 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          {pasted && !ok && (
            <p className="mb-2 text-center text-xs font-semibold text-cream/55">
              {MIN_DECK_CARDS - count} more card{MIN_DECK_CARDS - count === 1 ? '' : 's'} needed. A quiz needs at least {MIN_DECK_CARDS}.
            </p>
          )}
          <button
            disabled={!ok}
            onClick={() => { importDeck(name || 'My deck', result.cards); onClose(); onImported() }}
            className={`clay-btn min-h-12 w-full text-[15px] ${ok ? 'clay-butter' : 'bg-white/10 text-cream/40'}`}
          >
            {ok ? `Import ${count} cards` : 'Import'}
          </button>
        </footer>
      </div>
    </motion.div>
  )
}

function SepPicker<T extends string>({ label, options, value, onChange, custom, onCustom }: {
  label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; custom?: string; onCustom: (v: string) => void
}) {
  return (
    <fieldset>
      <legend className="text-xs font-bold text-cream/70">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id} type="button" onClick={() => onChange(o.id)} aria-pressed={value === o.id}
            className={`min-h-9 rounded-full px-3.5 text-xs font-extrabold ${value === o.id ? 'bg-cream text-ink' : 'clay text-cream/70'}`}
          >
            {o.label}
          </button>
        ))}
        {value === ('custom' as T) && (
          <input
            value={custom ?? ''} onChange={(e) => onCustom(e.target.value)} placeholder="e.g. ::" aria-label={`${label}: custom separator`}
            className="min-h-9 w-24 rounded-full bg-white/8 px-3 text-xs font-bold text-cream ring-1 ring-white/15 focus:outline-none focus:ring-2 focus:ring-gold"
          />
        )}
      </div>
    </fieldset>
  )
}
