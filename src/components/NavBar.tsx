import { motion } from 'framer-motion'
import { Icon } from './Icon'

export type Tab = 'feed' | 'closet' | 'van' | 'profile'

const ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed', label: 'Learn', icon: 'feed' },
  { id: 'closet', label: 'Closet', icon: 'closet' },
  { id: 'van', label: 'Van', icon: 'van' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
]

export function NavBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="relative z-20 border-t border-white/8 bg-ink/80 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Main">
      <ul className="grid grid-cols-4 gap-1">
        {ITEMS.map((it) => {
          const active = tab === it.id
          return (
            <li key={it.id}>
              <button
                onClick={() => onTab(it.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex w-full flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition ${active ? 'text-ink' : 'text-cream/60 hover:text-cream'}`}
              >
                {active && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-2xl bg-gradient-to-b from-gold to-peach" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <Icon name={it.icon} size={21} className="relative" />
                <span className="relative">{it.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
