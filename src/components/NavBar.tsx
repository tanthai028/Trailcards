import { motion } from 'framer-motion'
import { Icon } from './Icon'

export type Tab = 'feed' | 'closet' | 'van' | 'profile'

const ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed', label: 'Learn', icon: 'feed' },
  { id: 'closet', label: 'Closet', icon: 'closet' },
  { id: 'van', label: 'Van', icon: 'van' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
]

export function NavBar({ tab, onTab, dots = {} }: { tab: Tab; onTab: (t: Tab) => void; dots?: Partial<Record<Tab, boolean>> }) {
  return (
    <nav className="relative z-20 border-t border-white/8 bg-ink px-3 pb-[max(8px,calc(env(safe-area-inset-bottom)-16px))] pt-2" aria-label="Main">
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
    </nav>
  )
}
