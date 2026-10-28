// Painterly SVG landscapes in a shared 400×300 space. Used for card headers,
// the van home, and profile banners so the whole app feels like one world.
import { useId, type ReactNode } from 'react'

export type SceneId = 'meadow' | 'night' | 'peaks' | 'coast' | 'forest' | 'pasture'


function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

const STARS = (() => {
  const r = rng(7)
  return Array.from({ length: 70 }, () => ({ x: r() * 400, y: r() * 170, s: r() * 1.3 + 0.3, o: r() * 0.6 + 0.4 }))
})()

function Sky({ id, stops }: { id: string; stops: [number, string][] }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id})`} />
    </>
  )
}

function Glow({ id, x, y, r, color }: { id: string; x: number; y: number; r: number; color: string }) {
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity="0.9" />
          <stop offset="0.25" stopColor={color} stopOpacity="0.45" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </>
  )
}

// Clouds drift slowly side to side; each one at its own pace so they never move in step.
const Cloud = ({ x, y, s = 1, o = 0.85, c = '#fff' }: { x: number; y: number; s?: number; o?: number; c?: string }) => (
  <g className="cq-drift" style={{ animationDuration: `${16 + ((x * 7) % 11)}s`, animationDelay: `-${(x % 9)}s` }}>
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o} fill={c}>
      <ellipse cx="0" cy="0" rx="28" ry="9" />
      <ellipse cx="-12" cy="-6" rx="13" ry="10" />
      <ellipse cx="8" cy="-9" rx="15" ry="12" />
      <ellipse cx="24" cy="-2" rx="10" ry="7" />
    </g>
  </g>
)

const FIREFLIES = (() => {
  const r = rng(13)
  return Array.from({ length: 12 }, () => ({ x: 20 + r() * 360, y: 150 + r() * 120, d: 3 + r() * 4, delay: r() * 4 }))
})()

function Pine({ x, y, h, c }: { x: number; y: number; h: number; c: string }) {
  const w = h * 0.42
  return (
    <path
      d={`M${x},${y - h} L${x + w * 0.55},${y - h * 0.55} L${x + w * 0.3},${y - h * 0.55} L${x + w},${y - h * 0.08} L${x - w},${y - h * 0.08} L${x - w * 0.3},${y - h * 0.55} L${x - w * 0.55},${y - h * 0.55}Z M${x - 1.5},${y - h * 0.1} h3 v${h * 0.12} h-3Z`}
      fill={c}
    />
  )
}

const pines = (seed: number, n: number, y0: number, hMin: number, hMax: number, c: string) => {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => (
    <Pine key={i} x={(i / n) * 420 - 10 + r() * 14} y={y0 + r() * 6} h={hMin + r() * (hMax - hMin)} c={c} />
  ))
}

function Landscape({ scene, children }: { scene: SceneId; children?: ReactNode }) {
  const u = useId().replace(/:/g, '')
  switch (scene) {
    case 'night':
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#0b0f2e'], [0.5, '#272463'], [0.8, '#5b3f86'], [1, '#a2678f']]} />
          <ellipse cx="220" cy="90" rx="260" ry="26" fill="#c9b6ff" opacity="0.13" transform="rotate(-18 220 90)" />
          <ellipse cx="220" cy="90" rx="180" ry="12" fill="#fff" opacity="0.08" transform="rotate(-18 220 90)" />
          {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} className={i % 4 === 0 ? 'cq-twinkle' : undefined} style={i % 4 === 0 ? { animationDelay: `-${(i % 7) * 0.4}s` } : undefined} />)}
          <Glow id={`m${u}`} x={318} y={58} r={50} color="#fff6d8" />
          <circle cx="318" cy="58" r="14" fill="#fff6d8" />
          <circle cx="325" cy="53" r="12.5" fill="#1a1a4a" />
          <path d="M0,214 L30,214 L40,170 L96,168 L104,214 L150,214 L160,190 L196,188 L204,214 L400,214 L400,300 L0,300Z" fill="#3a2a5c" />
          <path d="M250,214 L262,150 L330,146 L342,214Z" fill="#33244f" />
          <path d="M0,232 Q100,220 200,230 T400,226 L400,300 L0,300Z" fill="#4c3466" />
          <path d="M0,256 Q120,244 240,254 T400,250 L400,300 L0,300Z" fill="#5d3f6e" />
          {children}
        </g>
      )
    case 'coast':
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#3d3a8c'], [0.38, '#c9719a'], [0.62, '#ffad8a'], [0.72, '#ffd89a']]} />
          <Cloud x={80} y={70} s={1.6} o={0.35} c="#ffd0d8" />
          <Cloud x={300} y={50} s={1.2} o={0.3} c="#ffd0d8" />
          <Glow id={`g${u}`} x={250} y={196} r={110} color="#ffe2a0" />
          <circle cx="250" cy="196" r="22" fill="#fff0c4" />
          <rect y="196" width="400" height="104" fill="#3f5f9e" />
          <rect y="196" width="400" height="30" fill="#5a6fae" opacity="0.6" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={250 - 30 + i * 3 - i * i} y={202 + i * 7} width={60 - i * 6 + i * i} height="2" rx="1" fill="#ffe2a0" opacity={0.8 - i * 0.1} className="cq-glint" style={{ animationDelay: `-${i * 0.35}s` }} />
          ))}
          <path d="M0,150 L40,146 L70,162 L96,170 L120,200 L140,240 L0,240Z" fill="#43305e" />
          <path d="M0,176 L50,172 L88,190 L110,236 L0,236Z" fill="#35264d" />
          <path d="M0,232 Q120,222 240,236 T400,232 L400,300 L0,300Z" fill="#5b7a5a" />
          <path d="M0,252 Q140,240 260,254 T400,250 L400,300 L0,300Z" fill="#4a6a4c" />
          {children}
        </g>
      )
    case 'peaks':
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#8fb8ff'], [0.6, '#d8e4ff'], [1, '#ffe6d2']]} />
          <Glow id={`g${u}`} x={90} y={70} r={70} color="#fff5d8" />
          <Cloud x={300} y={60} s={1.3} />
          <path d="M0,200 L60,120 L90,150 L150,60 L200,130 L240,96 L300,160 L350,110 L400,150 L400,300 L0,300Z" fill="#9aa2d6" />
          <path d="M150,60 L132,86 L144,82 L152,92 L162,80 L172,88Z M240,96 L228,114 L240,110 L250,116Z M60,120 L50,134 L62,130 L70,136Z" fill="#f4f2ff" />
          <path d="M0,230 L50,170 L100,200 L160,140 L230,210 L290,160 L360,214 L400,190 L400,300 L0,300Z" fill="#6c72b0" />
          <path d="M160,140 L146,160 L160,156 L170,164 L178,154Z" fill="#e8e6fb" />
          <path d="M0,250 Q90,232 200,246 T400,240 L400,300 L0,300Z" fill="#7f8e6e" />
          {pines(11, 14, 256, 18, 30, '#4b6a5a')}
          <path d="M0,270 Q120,258 240,270 T400,266 L400,300 L0,300Z" fill="#5f7a5c" />
          {children}
        </g>
      )
    case 'forest':
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#bfe0cf'], [0.6, '#f2f1d6'], [1, '#ffe6b8']]} />
          <path d="M240,0 L300,0 L180,300 L120,300Z" fill="#fff8d8" opacity="0.35" />
          <path d="M320,0 L350,0 L260,300 L230,300Z" fill="#fff8d8" opacity="0.25" />
          {pines(3, 16, 210, 60, 90, '#a6cdb3')}
          {pines(5, 12, 240, 80, 120, '#6fa286')}
          {pines(9, 9, 280, 110, 160, '#3f7560')}
          <path d="M0,270 Q100,258 200,268 T400,264 L400,300 L0,300Z" fill="#3b6a4f" />
          {FIREFLIES.map((f, i) => (
            <circle key={i} cx={f.x} cy={f.y} r="2.2" fill="#fff6b0" className="cq-firefly" style={{ animationDuration: `${f.d}s`, animationDelay: `-${f.delay}s` }} />
          ))}
          {children}
        </g>
      )
    case 'pasture':
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#ffc7d6'], [0.6, '#ffe6d0'], [1, '#fff4dc']]} />
          <Glow id={`g${u}`} x={300} y={110} r={80} color="#fff2c4" />
          <Cloud x={90} y={60} s={1.3} />
          <Cloud x={250} y={40} s={0.9} o={0.7} />
          <path d="M0,200 Q100,170 200,196 T400,186 L400,300 L0,300Z" fill="#b9dca2" />
          <path d="M0,232 Q140,206 260,230 T400,222 L400,300 L0,300Z" fill="#94c788" />
          <g transform="translate(300,214)">
            <rect x="-3" y="-40" width="6" height="40" fill="#8a6248" />
            <circle cx="0" cy="-50" r="22" fill="#6fb07a" />
            <circle cx="-14" cy="-40" r="14" fill="#5ea36c" />
            <circle cx="14" cy="-42" r="15" fill="#7dbd85" />
          </g>
          {[30, 70, 110, 150].map((x) => <rect key={x} x={x} y="236" width="4" height="22" fill="#d8b48a" />)}
          <rect x="26" y="242" width="132" height="3" fill="#d8b48a" />
          <rect x="26" y="250" width="132" height="3" fill="#d8b48a" />
          <path d="M0,266 Q120,252 240,264 T400,260 L400,300 L0,300Z" fill="#7cb877" />
          {children}
        </g>
      )
    default: // meadow
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#77a6f5'], [0.55, '#bcd6ff'], [0.82, '#ffe0c6'], [1, '#ffd2b0']]} />
          <Glow id={`g${u}`} x={310} y={120} r={90} color="#fff1c8" />
          <circle cx="310" cy="120" r="16" fill="#fff6dc" />
          <Cloud x={70} y={60} s={1.4} />
          <Cloud x={220} y={42} s={1} o={0.7} />
          <path d="M0,190 L50,140 L80,160 L140,96 L190,150 L230,120 L290,176 L340,136 L400,180 L400,300 L0,300Z" fill="#a9b4ea" />
          <path d="M140,96 L124,118 L138,112 L146,122 L156,110 L164,116Z M340,136 L330,150 L342,146 L350,152Z" fill="#f5f3ff" />
          <path d="M0,214 L60,176 L120,200 L190,160 L260,206 L330,180 L400,204 L400,300 L0,300Z" fill="#7c8ccc" />
          <rect y="212" width="400" height="14" fill="#a8c6f2" />
          <rect y="216" width="400" height="2" fill="#e8f0ff" opacity="0.7" />
          {pines(21, 18, 216, 16, 28, '#4e7d72')}
          <path d="M0,232 Q100,222 200,230 T400,226 L400,300 L0,300Z" fill="#9fd39a" />
          <path d="M0,258 Q120,246 240,256 T400,252 L400,300 L0,300Z" fill="#7dbd80" />
          {(() => {
            const r = rng(4)
            return Array.from({ length: 26 }, (_, i) => (
              <circle key={i} cx={r() * 400} cy={240 + r() * 55} r={1.6 + r()} fill={['#fff4e6', '#ffb3c1', '#ffd27a', '#b49cff'][i % 4]} />
            ))
          })()}
          {children}
        </g>
      )
  }
}

/** Standalone scene that fills its container. `still` pauses its ambient animation (off-screen cards, thumbnails). */
export function SceneSvg({ scene, className = '', still = false, children }: { scene: SceneId; className?: string; still?: boolean; children?: ReactNode }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={`${className} ${still ? 'cq-still' : ''}`} aria-hidden="true">
      <Landscape scene={scene}>{children}</Landscape>
    </svg>
  )
}
