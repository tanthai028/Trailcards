// Study decks: a picker for what Learn shows, and a Quizlet-style paste import.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { CARDS } from '../data/cards'
import { MIN_DECK_CARDS, detectOptions, parseDeck, type ParseOptions, type RowSep, type TermSep } from '../data/decks'
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
        className="clay flex h-9 max-w-[11rem] items-center gap-1.5 rounded-full pl-3 pr-2 text-xs font-extrabold text-cream/85"
      >
        <Icon name="book" size={13} className="shrink-0 text-lav" />
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
    </>
  )
}

function SourceRow({ label, detail, on, onClick, onDelete, confirming }: { label: string; detail: string; on: boolean; onClick: () => void; onDelete?: () => void; confirming?: boolean }) {
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

const TERM_SEPS: { id: TermSep; label: string }[] = [
  { id: 'tab', label: 'Tab' },
  { id: 'comma', label: 'Comma' },
  { id: 'dash', label: ' - ' },
  { id: 'custom', label: 'Custom' },
]
const ROW_SEPS: { id: RowSep; label: string }[] = [
  { id: 'newline', label: 'New line' },
  { id: 'semicolon', label: 'Semicolon' },
  { id: 'custom', label: 'Custom' },
]

const EXAMPLE = 'mitosis\tcell division that makes two identical cells\nosmosis\twater moving across a membrane toward more solute\n…'

/** Paste exported flashcards, pick separators, check the preview, import. */
function DeckImport({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { importDeck } = useGame()
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [opts, setOpts] = useState<ParseOptions>({ termSep: 'tab', rowSep: 'newline' })
  const [touchedSep, setTouchedSep] = useState(false)
  useEscape(onClose)

  // Until someone picks a separator themselves, follow whatever the pasted text looks like.
  const effective = touchedSep || !text ? opts : detectOptions(text)
  const result = useMemo(() => parseDeck(text, effective), [text, effective])
  const ok = result.cards.length >= MIN_DECK_CARDS
  const setSep = (o: Partial<ParseOptions>) => { setTouchedSep(true); setOpts({ ...effective, ...o }) }

  return (
    <motion.div
      className="fixed inset-0 z-[75] flex justify-center bg-ink"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
      role="dialog" aria-modal="true" aria-labelledby="import-title"
    >
      <div className="flex h-full w-full max-w-[480px] flex-col">
        <header className="flex items-center gap-2 px-4 pb-2 pt-[max(12px,calc(env(safe-area-inset-top)+14px))]">
          <button onClick={onClose} aria-label="Close import" className="grid size-10 place-items-center rounded-full text-cream/70 hover:text-cream">
            <Icon name="x" size={20} />
          </button>
          <h1 id="import-title" className="font-display text-xl font-bold">Import a deck</h1>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <p className="text-[13px] leading-relaxed text-cream/60">
            Export your set from Quizlet, Anki or a spreadsheet as text, then paste it here. One card per line: the term, a separator, then the definition.
          </p>

          <label htmlFor="deck-name" className="mt-4 block text-sm font-bold text-cream/80">Deck name</label>
          <input
            id="deck-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Bio 101 midterm"
            className="mt-1.5 w-full rounded-2xl bg-white/8 px-4 py-3 font-bold text-cream ring-1 ring-white/12 placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold"
          />

          <label htmlFor="deck-text" className="mt-4 block text-sm font-bold text-cream/80">Flashcards</label>
          <textarea
            id="deck-text" value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder={EXAMPLE} spellCheck={false}
            className="mt-1.5 w-full resize-y rounded-2xl bg-white/8 px-4 py-3 font-mono text-[13px] leading-relaxed text-cream ring-1 ring-white/12 placeholder:text-cream/25 focus:outline-none focus:ring-2 focus:ring-gold"
          />

          <SepPicker
            label="Between term and definition" options={TERM_SEPS} value={effective.termSep} onChange={(termSep) => setSep({ termSep })}
            custom={effective.customTerm} onCustom={(customTerm) => setSep({ termSep: 'custom', customTerm })}
          />
          <SepPicker
            label="Between cards" options={ROW_SEPS} value={effective.rowSep} onChange={(rowSep) => setSep({ rowSep })}
            custom={effective.customRow} onCustom={(customRow) => setSep({ rowSep: 'custom', customRow })}
          />

          {text.trim() && (
            <section className="mt-5" aria-live="polite">
              <h2 className="text-sm font-bold text-cream/80">
                Preview: {result.cards.length} card{result.cards.length === 1 ? '' : 's'}
                {result.duplicates > 0 && <span className="font-semibold text-cream/50">, {result.duplicates} duplicate{result.duplicates === 1 ? '' : 's'} skipped</span>}
              </h2>
              {result.problems.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-2xl bg-coral/12 p-3 text-xs ring-1 ring-coral/30">
                  {result.problems.slice(0, 5).map((p) => (
                    <li key={p.row} className="text-cream/80">
                      <span className="font-extrabold text-coral">Row {p.row}:</span> {p.reason}. <span className="text-cream/45">“{p.text.slice(0, 40)}”</span>
                    </li>
                  ))}
                  {result.problems.length > 5 && <li className="text-cream/50">and {result.problems.length - 5} more rows skipped</li>}
                </ul>
              )}
              <ul className="mt-2 divide-y divide-white/8 overflow-hidden rounded-2xl clay">
                {result.cards.slice(0, 30).map((c) => (
                  <li key={c.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-3.5 py-2.5 text-[13px]">
                    <span className="font-extrabold text-cream">{c.term}</span>
                    <span className="text-cream/70">{c.definition}</span>
                  </li>
                ))}
                {result.cards.length > 30 && <li className="px-3.5 py-2.5 text-xs text-cream/50">and {result.cards.length - 30} more</li>}
              </ul>
            </section>
          )}
        </div>

        <footer className="border-t border-white/8 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          {!ok && text.trim() && <p className="mb-2 text-center text-xs font-semibold text-cream/55">A deck needs at least {MIN_DECK_CARDS} cards for multiple choice.</p>}
          <button
            disabled={!ok}
            onClick={() => { importDeck(name || 'My deck', result.cards); onClose(); onImported() }}
            className="clay-btn clay-butter min-h-12 w-full text-[15px] disabled:bg-white/10 disabled:text-cream/40"
          >
            {ok ? `Import ${result.cards.length} cards` : 'Import'}
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
    <fieldset className="mt-4">
      <legend className="text-sm font-bold text-cream/80">{label}</legend>
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
