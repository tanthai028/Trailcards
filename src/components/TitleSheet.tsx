// Title picker: a chip that opens a bottom sheet. A native <select> renders OS
// chrome and would be clipped by the profile banner, so this is our own. The sheet is portaled
// to the page (Sheet), since the banner clips everything inside it, fixed overlays included.
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

/** `fx`: an unlocked title effect (glow, neon…), or 'none'. */
export function TitlePicker({ value, titles, onChange, fx = 'none' }: { value: string | null; titles: string[]; onChange: (t: string | null) => void; fx?: string }) {
  const [open, setOpen] = useState(false)
  const options: { label: string; value: string | null }[] = [{ label: 'Wanderer', value: null }, ...titles.map((t) => ({ label: t, value: t }))]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Title: ${value ?? 'Wanderer'}. Change title`}
        className="mt-1 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-ink/55 py-1 pl-2.5 pr-2 text-xs font-extrabold text-gold transition hover:bg-ink/70"
      >
        <Icon name="crown" size={13} />
        <span className={`max-w-[9rem] truncate ${fx !== 'none' ? `fx-title-${fx}` : ''}`}>{value ?? 'Wanderer'}</span>
        <Icon name="chevron" size={13} strokeWidth={3} className="opacity-70" />
      </button>

      <AnimatePresence>
        {open && (
          <Sheet
            label="Choose a title"
            onClose={() => setOpen(false)}
            header={
              <>
                <h2 className="font-display text-xl font-bold text-cream">Your title</h2>
                <p className="text-[13px] text-cream/55">Earn more by unlocking achievements.</p>
              </>
            }
          >
            <ul className="space-y-1.5">
              {options.map((o) => {
                const on = o.value === value
                return (
                  <li key={o.label}>
                    <button
                      autoFocus={on}
                      onClick={() => { onChange(o.value); setOpen(false) }}
                      aria-pressed={on}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3.5 text-left text-[15px] font-bold transition-colors ${on ? 'bg-gold/15 text-gold' : 'text-cream/85 hover:bg-white/5'}`}
                    >
                      <Icon name="crown" size={16} className={on ? '' : 'opacity-40'} />
                      <span className="flex-1">{o.label}</span>
                      {on && <Icon name="check" size={16} strokeWidth={3} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  )
}
