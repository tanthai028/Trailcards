// Mochi the cat, your study buddy.
import type { SVGProps } from 'react'

export function Cat({ sleeping = false, ...rest }: { sleeping?: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 100" role="img" aria-label="Mochi the cat" {...rest}>
      <ellipse cx="60" cy="94" rx="34" ry="4" fill="#1b1f3b" opacity="0.18" />
      <path d="M80,88 C106,90 112,66 98,54" stroke="#f2a564" strokeWidth="9" fill="none" strokeLinecap="round" className={sleeping ? undefined : 'cq-tail'} />
      <path d="M36,90 C32,66 44,52 60,52 C76,52 88,66 84,90Z" fill="#ffeedd" />
      <path d="M40,74 C42,62 50,56 56,56 C50,64 46,72 40,74Z" fill="#f2a564" />
      <ellipse cx="60" cy="78" rx="12" ry="11" fill="#fffaf2" />
      <ellipse cx="49" cy="90" rx="8" ry="4.5" fill="#fffaf2" />
      <ellipse cx="71" cy="90" rx="8" ry="4.5" fill="#fffaf2" />
      <path d="M36,36 L39,10 L58,26Z" fill="#ffeedd" />
      <path d="M84,36 L81,10 L62,26Z" fill="#f2a564" />
      <path d="M41,30 L42,17 L52,26Z" fill="#ffb8c6" />
      <path d="M79,30 L78,17 L68,26Z" fill="#ffc9b0" />
      <ellipse cx="60" cy="44" rx="27" ry="22" fill="#ffeedd" />
      <path d="M68,24 C78,26 86,34 87,44 C80,38 72,34 66,34Z" fill="#f2a564" />
      <path d="M56,25 L57,32 M60,24 L60,32 M64,25 L63,32" stroke="#f2a564" strokeWidth="2.4" strokeLinecap="round" />
      {sleeping ? (
        <>
          <path d="M44,46 Q50,51 56,46" stroke="#3a2b3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M64,46 Q70,51 76,46" stroke="#3a2b3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <g className="cq-blink">
          <ellipse cx="50" cy="45" rx="4.2" ry="5.2" fill="#3a2b3a" />
          <ellipse cx="70" cy="45" rx="4.2" ry="5.2" fill="#3a2b3a" />
          <circle cx="48.6" cy="43" r="1.6" fill="#fff" />
          <circle cx="68.6" cy="43" r="1.6" fill="#fff" />
        </g>
      )}
      <ellipse cx="42" cy="54" rx="5" ry="3" fill="#ff9fb2" opacity="0.5" />
      <ellipse cx="78" cy="54" rx="5" ry="3" fill="#ff9fb2" opacity="0.5" />
      <path d="M58,51 L62,51 L60,53.5Z" fill="#ff8fa6" />
      <path d="M56,55 Q58,58 60,55 Q62,58 64,55" stroke="#3a2b3a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M34,50 L22,48 M34,54 L22,56 M86,50 L98,48 M86,54 L98,56" stroke="#c8b6a6" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
