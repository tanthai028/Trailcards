// The home: your van parked at a destination, with you, Mochi, the plant, and decor.
import { useId } from 'react'
import { Landscape, DESTINATION_SCENE } from './Landscape'
import { Character, type Expression } from './Character'
import { Cat, Plant } from './Companions'
import type { Look } from '../data/items'

export function Van({ x, y, w }: { x: number; y: number; w: number }) {
  const u = useId().replace(/:/g, '')
  return (
    <svg x={x} y={y} width={w} height={w * (140 / 240)} viewBox="0 0 240 140" overflow="visible">
      <defs>
        <clipPath id={`body${u}`}>
          <path d="M14,64 Q14,30 44,28 L176,28 Q196,28 206,44 L224,74 Q230,80 230,90 L230,104 Q230,114 220,114 L24,114 Q14,114 14,104Z" />
        </clipPath>
        <linearGradient id={`glass${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d6ecff" />
          <stop offset="1" stopColor="#7fa6dc" />
        </linearGradient>
        <linearGradient id={`warm${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe1a8" />
          <stop offset="1" stopColor="#ff9f72" />
        </linearGradient>
      </defs>
      <ellipse cx="122" cy="130" rx="112" ry="7" fill="#1b1f3b" opacity="0.22" />
      {/* roof rack */}
      <path d="M44,22 L172,22" stroke="#4a4466" strokeWidth="3" strokeLinecap="round" />
      {[56, 108, 160].map((px) => <path key={px} d={`M${px},22 L${px},29`} stroke="#4a4466" strokeWidth="3" />)}
      <g clipPath={`url(#body${u})`}>
        <rect x="0" y="0" width="240" height="140" fill="#fff4e6" />
        <rect x="0" y="80" width="240" height="40" fill="#ff8f7a" />
        <rect x="0" y="78" width="240" height="4" fill="#ffd27a" />
        <rect x="0" y="104" width="240" height="12" fill="#e5735f" />
      </g>
      {/* wheel arches */}
      <circle cx="58" cy="114" r="20" fill="#c95b4b" />
      <circle cx="186" cy="114" r="20" fill="#c95b4b" />
      {/* windows */}
      <rect x="26" y="38" width="40" height="28" rx="9" fill={`url(#glass${u})`} />
      <rect x="128" y="38" width="40" height="28" rx="9" fill={`url(#glass${u})`} />
      <path d="M178,38 L196,38 Q204,40 210,52 L219,70 L178,70Z" fill={`url(#glass${u})`} />
      <path d="M32,60 L46,42 M134,60 L148,42 M186,62 L198,42" stroke="#fff" strokeWidth="3" opacity="0.55" strokeLinecap="round" />
      {/* open door with warm interior */}
      <rect x="76" y="36" width="44" height="76" rx="5" fill={`url(#warm${u})`} />
      <rect x="80" y="52" width="36" height="3" fill="#c97a4a" />
      <circle cx="98" cy="44" r="3.5" fill="#fff7d0" />
      <path d="M98,36 L98,41" stroke="#8a5a3a" strokeWidth="1" />
      <rect x="84" y="46" width="6" height="6" rx="1" fill="#6fbf7a" />
      <rect x="104" y="47" width="9" height="5" rx="1" fill="#7f8fd0" />
      <rect x="80" y="88" width="36" height="24" rx="4" fill="#b98ad6" opacity="0.65" />
      <rect x="120" y="36" width="4" height="76" fill="#e8dccb" />
      {/* awning valance */}
      <g>
        <rect x="70" y="28" width="56" height="7" fill="#7f8fd0" />
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M${70 + i * 8},35 q4,7 8,0Z`} fill={i % 2 ? '#fff4e6' : '#7f8fd0'} />
        ))}
      </g>
      {/* lights & bumper */}
      <circle cx="224" cy="90" r="5" fill="#fff2b3" />
      <rect x="208" y="104" width="26" height="6" rx="3" fill="#d9d4e8" />
      <rect x="10" y="104" width="16" height="6" rx="3" fill="#d9d4e8" />
      <rect x="18" y="86" width="5" height="9" rx="2" fill="#ff5b6b" />
      {/* wheels */}
      {[58, 186].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="114" r="15" fill="#2b2d42" />
          <circle cx={cx} cy="114" r="7" fill="#d9d4e8" />
          <circle cx={cx} cy="114" r="2.5" fill="#8a85a3" />
        </g>
      ))}
    </svg>
  )
}

const Bulbs = ({ d, n, colors }: { d: [number, number][]; n: number; colors: string[] }) => {
  // quadratic bezier p0 → p1 (control) → p2
  const [p0, p1, p2] = d
  return (
    <g>
      <path d={`M${p0[0]},${p0[1]} Q${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} stroke="#3a3350" strokeWidth="0.8" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n
        const bx = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        const by = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        return <circle key={i} cx={bx} cy={by + 2} r="2.4" fill={colors[i % colors.length]} className="cq-twinkle" style={{ animationDelay: `${i * 0.3}s` }} />
      })}
    </g>
  )
}

export function VanScene({
  look, destination, decor, plantStage, catAwake, expression = 'smile', onCat, className,
}: {
  look: Look
  destination: string
  decor: string[]
  plantStage: number
  catAwake?: boolean
  expression?: Expression
  onCat?: () => void
  className?: string
}) {
  const has = (id: string) => decor.includes(id)
  const night = destination === 'desert'
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className={className} role="img" aria-label="Your van at camp">
      <Landscape scene={DESTINATION_SCENE[destination] ?? 'meadow'}>
        {has('decor-telescope') && (
          <g transform="translate(26,206)">
            <path d="M10,48 L18,20 L26,48 M18,20 L18,48" stroke="#4a4466" strokeWidth="2.4" strokeLinecap="round" />
            <rect x="0" y="6" width="34" height="9" rx="4" fill="#e8dccb" transform="rotate(-28 18 12)" />
            <rect x="26" y="-2" width="8" height="12" rx="2" fill="#7f8fd0" transform="rotate(-28 18 12)" />
          </g>
        )}
        <Van x={36} y={150} w={200} />
        {has('decor-surfboard') && (
          <g transform="translate(80,153) rotate(-2)">
            <path d="M0,6 Q60,-6 124,4 Q60,14 0,6Z" fill="#6fd3d0" />
            <path d="M6,6 Q60,0 118,4" stroke="#fff4e6" strokeWidth="2" fill="none" />
          </g>
        )}
        {has('decor-lights') && (
          <Bulbs d={[[60, 172], [140, 196], [226, 176]]} n={12} colors={['#ffd27a', '#ffb3c1', '#b6f0d6', '#fff4e6']} />
        )}
        {has('decor-bunting') && (
          <g>
            <path d="M226,176 Q290,198 352,188" stroke="#3a3350" strokeWidth="0.8" fill="none" />
            {Array.from({ length: 8 }, (_, i) => {
              const t = (i + 0.5) / 8
              const bx = (1 - t) ** 2 * 226 + 2 * (1 - t) * t * 290 + t * t * 352
              const by = (1 - t) ** 2 * 176 + 2 * (1 - t) * t * 198 + t * t * 188
              return <path key={i} d={`M${bx - 5},${by} L${bx + 5},${by} L${bx},${by + 11}Z`} fill={['#ff8f7a', '#ffd27a', '#7f8fd0', '#8fc9a3'][i % 4]} />
            })}
            <path d="M352,188 L354,262" stroke="#8a6248" strokeWidth="3" />
          </g>
        )}
        {has('decor-fire') && (
          <g transform="translate(318,250)">
            <circle r="34" fill="#ffb35a" opacity="0.15" className="cq-flicker" />
            <path d="M-14,6 L14,-2 M-14,-2 L14,6" stroke="#7a5136" strokeWidth="5" strokeLinecap="round" />
            <path d="M0,-26 C10,-12 12,-4 6,4 C2,-4 -2,-4 -6,4 C-12,-4 -8,-14 0,-26Z" fill="#ff8a4a" className="cq-flicker" />
            <path d="M0,-14 C5,-6 5,-1 2,3 C0,-1 -2,-1 -3,3 C-6,-2 -4,-8 0,-14Z" fill="#ffe08a" className="cq-flicker" />
          </g>
        )}
        {has('decor-chair') && (
          <g transform="translate(272,232)">
            <path d="M0,28 L18,0 M18,28 L0,0" stroke="#4a4466" strokeWidth="2.2" />
            <path d="M-2,4 L22,4 L20,16 L0,16Z" fill="#ff8f7a" />
            <path d="M2,4 L2,16 M8,4 L8,16 M14,4 L14,16" stroke="#fff4e6" strokeWidth="2.4" />
          </g>
        )}
        {/* the plant sits by the van door */}
        <Plant stage={plantStage} x={196} y={214} width={42} height={52} />
        <Character look={look} expression={expression} idle x={228} y={152} width={90} height={117} />
        <g onClick={onCat} style={{ cursor: onCat ? 'pointer' : undefined }}>
          <Cat sleeping={!catAwake} x={has('decor-chair') ? 262 : 150} y={has('decor-chair') ? 210 : 132} width={has('decor-chair') ? 40 : 44} height={has('decor-chair') ? 34 : 37} />
        </g>
        {night && <rect width="400" height="300" fill="#1a1440" opacity="0.18" pointerEvents="none" />}
      </Landscape>
    </svg>
  )
}
