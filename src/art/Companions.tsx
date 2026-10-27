// Mochi the cat, the growing plant, and small decor props.
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

export function Plant({ stage, ...rest }: { stage: number } & SVGProps<SVGSVGElement>) {
  const leaf = (x: number, y: number, angle: number, s = 1, fill = '#6fbf7a') => (
    <path
      key={`${x}-${y}-${angle}`}
      d="M0,0 C6,-8 18,-8 22,0 C18,6 6,6 0,0Z"
      fill={fill}
      transform={`translate(${x},${y}) rotate(${angle}) scale(${s})`}
    />
  )
  return (
    <svg viewBox="0 0 80 100" role="img" aria-label={`Plant, growth stage ${stage + 1} of 5`} {...rest}>
      <ellipse cx="40" cy="96" rx="24" ry="3.5" fill="#1b1f3b" opacity="0.18" />
      <g className="cq-sway">
        {stage === 0 && <ellipse cx="40" cy="66" rx="4" ry="3" fill="#a77a52" />}
        {stage >= 1 && <path d={`M40,68 Q${stage >= 3 ? 38 : 40},${68 - [0, 12, 26, 38, 44][stage]} 40,${68 - [0, 14, 28, 40, 46][stage]}`} stroke="#4f9a5f" strokeWidth="3" fill="none" strokeLinecap="round" />}
        {stage === 1 && <>{leaf(40, 56, -150, 0.6)}{leaf(40, 56, -30, 0.6)}</>}
        {stage >= 2 && <>{leaf(40, 54, -160, 0.8)}{leaf(40, 50, -20, 0.8)}{leaf(40, 44, -140, 0.7, '#86d18f')}{leaf(40, 42, -40, 0.7, '#86d18f')}</>}
        {stage >= 3 && <>{leaf(40, 36, -170, 0.9)}{leaf(40, 32, -10, 0.9)}{leaf(40, 30, -120, 0.7, '#86d18f')}{leaf(40, 28, -60, 0.7, '#86d18f')}{leaf(40, 60, -175, 0.75, '#5aa868')}{leaf(40, 60, -5, 0.75, '#5aa868')}</>}
        {stage >= 4 && (
          <>
            {[[40, 20, '#ff9fb8'], [26, 34, '#ffd27a'], [55, 32, '#ff9fb8'], [30, 48, '#fff4e6'], [52, 46, '#ffd27a']].map(([x, y, c]) => (
              <g key={`${x}${y}`} transform={`translate(${x},${y})`}>
                {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-4" rx="3" ry="4" fill={c as string} transform={`rotate(${a})`} />)}
                <circle r="2.4" fill="#f2a564" />
              </g>
            ))}
          </>
        )}
      </g>
      <path d="M16,66 L64,66 L58,94 L22,94Z" fill="#e5895e" />
      <rect x="13" y="62" width="54" height="9" rx="3" fill="#f2a27a" />
      <path d="M24,80 Q40,84 56,80" stroke="#cf7550" strokeWidth="2" fill="none" />
    </svg>
  )
}
