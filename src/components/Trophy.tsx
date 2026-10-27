import { Icon } from './Icon'
import type { Achievement } from '../data/achievements'

/** A little cup with the achievement's icon; a dusty silhouette while locked. */
export function Trophy({ a, earned, size = 56 }: { a: Achievement; earned: boolean; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size * 1.15 }} title={earned ? `${a.name} — ${a.desc}` : `Locked: ${a.desc}`}>
      <svg viewBox="0 0 60 70" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="cup-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1b8" />
            <stop offset="0.5" stopColor="#ffd27a" />
            <stop offset="1" stopColor="#e9a33a" />
          </linearGradient>
        </defs>
        <g fill={earned ? 'url(#cup-gold)' : '#ffffff'} opacity={earned ? 1 : 0.1}>
          <path d="M14,6 L46,6 L44,30 Q40,42 30,42 Q20,42 16,30Z" />
          <path d="M14,10 Q4,10 6,20 Q8,28 16,28" fill="none" stroke={earned ? '#e9a33a' : '#fff'} strokeWidth="3.5" />
          <path d="M46,10 Q56,10 54,20 Q52,28 44,28" fill="none" stroke={earned ? '#e9a33a' : '#fff'} strokeWidth="3.5" />
          <rect x="26" y="42" width="8" height="10" />
          <rect x="16" y="52" width="28" height="8" rx="2" fill={earned ? '#7a5136' : '#fff'} />
        </g>
      </svg>
      <span className={`absolute left-1/2 top-[14%] -translate-x-1/2 ${earned ? 'text-[#8a5a14]' : 'text-white/25'}`}>
        <Icon name={a.icon} size={size * 0.32} strokeWidth={2.4} />
      </span>
    </div>
  )
}
