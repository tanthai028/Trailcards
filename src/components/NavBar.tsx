import { motion } from 'framer-motion'
import { Icon } from './Icon'

export type Tab = 'feed' | 'closet' | 'van' | 'profile'

const ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed', label: 'Learn', icon: 'feed' },
  { id: 'closet', label: 'Closet', icon: 'closet' },
  { id: 'van', label: 'Van', icon: 'van' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
]

/** The home-indicator strip can't hold buttons, so it's a little road with two pines. */
function Road() {
  return (
    <div className="relative -mx-3 mt-1.5 h-[max(12px,calc(env(safe-area-inset-bottom)-4px))] overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 opacity-30"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, var(--color-gold) 0 14px, transparent 14px 26px)' }}
      />
      {[{ x: 'left-4', s: 1 }, { x: 'right-5', s: 0.8 }].map(({ x, s }) => (
        <svg key={x} className={`absolute bottom-0 ${x} h-full max-h-6 text-sage opacity-40`} viewBox="0 0 20 24" style={{ transform: `scale(${s})`, transformOrigin: 'bottom' }}>
          <path d="M10 1 L16 10 H13 L18 18 H11.5 V23 H8.5 V18 H2 L7 10 H4 Z" fill="currentColor" />
        </svg>
      ))}
    </div>
  )
}

export function NavBar({ tab, onTab, dots = {} }: { tab: Tab; onTab: (t: Tab) => void; dots?: Partial<Record<Tab, boolean>> }) {
  return (
    <nav className="relative z-20 border-t border-white/8 bg-ink px-3 pt-2" aria-label="Main">
      <ul className="grid grid-cols-4 gap-1">
        {ITEMS.map((it) => {
          const active = tab === it.id
          return (
            <li key={it.id}>
              <button
                onClick={() => onTab(it.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex w-full flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition-colors duration-200 ${active ? 'text-ink' : 'text-cream/60 hover:text-cream'}`}
              >
                {active && (
                  <motion.span layoutId="nav-pill" className="clay-pill absolute inset-0 rounded-2xl" transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.8 }} />
                )}
                <span className="relative">
                  <Icon name={it.icon} size={21} />
                  {dots[it.id] && !active && (
                    <span className="absolute -right-1.5 -top-1 size-2.5 rounded-full bg-gold ring-2 ring-ink" aria-hidden="true" />
                  )}
                </span>
                <span className="relative">{it.label}</span>
                {dots[it.id] && !active && <span className="sr-only">, something you can buy</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <Road />
    </nav>
  )
}
