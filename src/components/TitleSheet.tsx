// Title picker: a chip that opens a bottom sheet. A native <select> renders OS
// chrome and would be clipped by the profile banner, so this is our own.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'

export function TitlePicker({ value, titles, onChange }: { value: string | null; titles: string[]; onChange: (t: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const options: { label: string; value: string | null }[] = [{ label: 'Wanderer', value: null }, ...titles.map((t) => ({ label: t, value: t }))]

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Title: ${value ?? 'Wanderer'}. Change title`}
        className="mt-1 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-ink/55 py-1 pl-2.5 pr-2 text-xs font-extrabold text-gold backdrop-blur transition hover:bg-ink/70"
      >
        <Icon name="crown" size={13} />
        <span className="max-w-[9rem] truncate">{value ?? 'Wanderer'}</span>
        <Icon name="chevron" size={13} strokeWidth={3} className="opacity-70" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Choose a title"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="clay w-full max-w-[480px] rounded-t-[28px] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3"
            >
              <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-white/20" aria-hidden="true" />
              <h2 className="px-1 font-display text-xl font-bold text-cream">Your title</h2>
              <p className="px-1 pb-3 text-[13px] text-cream/55">Earn more by unlocking achievements.</p>
              <ul className="no-scrollbar max-h-[50vh] space-y-1.5 overflow-y-auto">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
