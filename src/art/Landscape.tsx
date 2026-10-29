// Painterly SVG landscapes in a shared 400×300 space. Used for card headers,
// the van home, and profile banners so the whole app feels like one world.
import { useId, type ReactNode } from 'react'

export type SceneId = 'meadow' | 'night' | 'peaks' | 'coast' | 'forest' | 'pasture'
  | 'campground' | 'room' | 'beach' | 'city' | 'cabin'


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

// city towers as [x, top, width]: a hazy back row, and a front row with lit windows
const CITY_BACK = [[0, 150, 40], [36, 120, 34], [66, 160, 44], [106, 100, 30], [132, 140, 46], [174, 110, 36], [206, 150, 40], [242, 90, 30], [268, 130, 44], [308, 150, 34], [338, 116, 40], [374, 140, 30]]
const CITY_FRONT = [[10, 176, 52], [56, 150, 40], [92, 190, 56], [144, 160, 44], [184, 140, 50], [230, 176, 44], [270, 156, 52], [318, 186, 46], [360, 166, 44]]

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
    case 'campground':
      // dusk at camp: two tents around a crackling fire under the first stars
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#1d1b4a'], [0.45, '#4a3a7a'], [0.75, '#c46a6a'], [0.88, '#f2a35e']]} />
          {/* the band on a card shows the middle of the scene, so the scene sits up there */}
          <rect y="240" width="400" height="60" fill="#3a2f4c" />
          <g transform="translate(0,-40)">
          {STARS.slice(0, 30).map((s, i) => <circle key={i} cx={s.x} cy={s.y * 0.7} r={s.s * 0.9} fill="#fff" opacity={s.o * 0.8} className={i % 5 === 0 ? 'cq-twinkle' : undefined} style={i % 5 === 0 ? { animationDelay: `-${(i % 7) * 0.4}s` } : undefined} />)}
          <path d="M0,200 Q90,170 180,190 T400,180 L400,300 L0,300Z" fill="#3b2f5c" />
          {pines(31, 14, 214, 40, 70, '#2a2346')}
          <path d="M0,214 Q120,204 240,212 T400,208 L400,300 L0,300Z" fill="#4a3d5e" />
          <Glow id={`f${u}`} x={200} y={226} r={95} color="#ffb35c" />
          {/* tents */}
          <path d="M70,232 L112,170 L154,232Z" fill="#e8814f" />
          <path d="M112,170 L104,232 L120,232Z" fill="#8a3f2f" />
          <path d="M254,232 L288,180 L322,232Z" fill="#5fa3a0" />
          <path d="M288,180 L282,232 L294,232Z" fill="#2f5f63" />
          {/* logs and fire */}
          <rect x="182" y="230" width="36" height="6" rx="3" fill="#6b4630" transform="rotate(-12 200 233)" />
          <rect x="182" y="230" width="36" height="6" rx="3" fill="#7d5338" transform="rotate(12 200 233)" />
          <g className="cq-flicker">
            <path d="M200,186 C214,206 216,218 208,230 L192,230 C184,218 188,204 200,186Z" fill="#ff8a3d" />
            <path d="M200,202 C208,214 208,222 204,230 L196,230 C192,222 194,212 200,202Z" fill="#ffd56b" />
          </g>
          {[0, 1, 2].map((i) => <circle key={i} cx={196 + i * 5} cy={178 - i * 8} r="1.4" fill="#ffd56b" className="cq-firefly" style={{ animationDuration: `${2 + i}s`, animationDelay: `-${i}s` }} />)}
          <path d="M0,244 Q130,236 260,244 T400,240 L400,300 L0,300Z" fill="#3a2f4c" />
          </g>
          {children}
        </g>
      )
    case 'room':
      // a cosy living room on a rainy evening: window, lamp, couch, plant
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#6b4f7a'], [0.6, '#8a6584'], [1, '#a77a7c']]} />
          {/* the band on a card shows the middle of the scene, so the scene sits up there */}
          <rect y="240" width="400" height="60" fill="#5a3d4f" />
          <g transform="translate(0,-26)">
          {/* wallpaper stripes */}
          {Array.from({ length: 14 }, (_, i) => <rect key={i} x={i * 30} y="0" width="12" height="300" fill="#fff" opacity="0.04" />)}
          {/* window with rain and the moon */}
          <rect x="40" y="70" width="120" height="120" rx="6" fill="#2b2b5c" />
          <circle cx="128" cy="100" r="12" fill="#fff6d8" opacity="0.9" />
          {Array.from({ length: 12 }, (_, i) => <rect key={i} x={50 + ((i * 37) % 100)} y={78 + ((i * 53) % 90)} width="1.5" height="10" rx="1" fill="#c9d8ff" opacity="0.6" className="cq-glint" style={{ animationDelay: `-${(i % 5) * 0.3}s` }} />)}
          <rect x="40" y="70" width="120" height="120" rx="6" fill="none" stroke="#e9cfa8" strokeWidth="7" />
          <rect x="97" y="70" width="6" height="120" fill="#e9cfa8" />
          <rect x="40" y="127" width="120" height="6" fill="#e9cfa8" />
          {/* picture on the wall */}
          <rect x="205" y="92" width="44" height="34" rx="3" fill="#f5d48a" />
          <rect x="210" y="97" width="34" height="24" rx="2" fill="#7fb3a6" />
          {/* floor lamp and its glow */}
          <Glow id={`l${u}`} x={330} y={110} r={90} color="#ffd59a" />
          <rect x="328" y="118" width="4" height="110" fill="#3d2c3f" />
          <path d="M310,118 L350,118 L342,92 L318,92Z" fill="#ffcf7d" />
          {/* floor, rug, couch, plant */}
          <rect y="226" width="400" height="74" fill="#5a3d4f" />
          <ellipse cx="200" cy="252" rx="150" ry="14" fill="#c27a6a" opacity="0.7" />
          <rect x="150" y="176" width="150" height="40" rx="14" fill="#d9775f" />
          <rect x="140" y="196" width="170" height="36" rx="12" fill="#e68a6f" />
          <rect x="166" y="190" width="56" height="18" rx="8" fill="#f2a98a" />
          <rect x="228" y="190" width="56" height="18" rx="8" fill="#f2a98a" />
          <rect x="34" y="208" width="26" height="22" rx="4" fill="#c46a4f" />
          <path d="M47,208 C30,186 40,170 47,160 C54,170 64,186 47,208Z M47,208 C34,196 26,192 22,184 C36,184 44,196 47,208Z M47,208 C60,196 68,192 72,184 C58,184 50,196 47,208Z" fill="#6fae7a" />
          </g>
          {children}
        </g>
      )
    case 'beach':
      // a bright beach day: palm, striped umbrella, glinting sea
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#5fb6f0'], [0.6, '#a9dcff'], [1, '#e4f5ff']]} />
          {/* the band on a card shows the middle of the scene, so the scene sits up there */}
          <rect y="240" width="400" height="60" fill="#f5d9a0" />
          <g transform="translate(0,-40)">
          <Glow id={`g${u}`} x={90} y={80} r={70} color="#fff6c8" />
          <circle cx="90" cy="80" r="18" fill="#fff4c2" />
          <Cloud x={260} y={64} s={1.2} />
          <rect y="168" width="400" height="56" fill="#2f9bc4" />
          <rect y="168" width="400" height="16" fill="#58b9da" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={20 + i * 55} y={180 + (i % 3) * 11} width="26" height="2" rx="1" fill="#e9fbff" className="cq-glint" style={{ animationDelay: `-${i * 0.4}s` }} />)}
          <path d="M0,222 Q60,214 120,222 T240,220 T400,218 L400,232 L0,232Z" fill="#e9fbff" opacity="0.8" />
          <path d="M0,226 Q140,216 260,226 T400,222 L400,300 L0,300Z" fill="#f5d9a0" />
          {/* umbrella */}
          <rect x="98" y="168" width="3" height="66" fill="#8a6248" />
          <path d="M60,176 Q100,140 140,176Z" fill="#ff7b6b" />
          <path d="M80,176 Q100,140 100,176Z M100,176 Q100,140 120,176Z" fill="#fff4e6" />
          {/* palm */}
          <path d="M318,236 C322,200 330,170 344,140 L350,142 C338,172 330,202 326,236Z" fill="#a0703f" />
          <path d="M346,140 C320,126 298,132 284,146 C306,136 324,138 346,144Z M346,140 C368,124 390,128 400,140 C380,134 364,138 348,146Z M346,140 C340,116 326,104 312,100 C330,112 338,124 344,142Z M346,140 C356,118 372,108 388,106 C370,116 360,126 350,144Z" fill="#3f9a5c" />
          <circle cx="342" cy="148" r="5" fill="#7a5230" />
          <circle cx="351" cy="147" r="5" fill="#6a4628" />
          </g>
          {children}
        </g>
      )
    case 'city':
      // a city at dusk: lit windows across two rows of towers
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#1e1b47'], [0.5, '#4b3a86'], [0.85, '#e07a8a'], [1, '#ffb08a']]} />
          {/* the band on a card shows the middle of the scene, so the scene sits up there */}
          <rect y="240" width="400" height="60" fill="#1b1638" />
          <g transform="translate(0,-36)">
          <circle cx="318" cy="70" r="14" fill="#fff0d0" opacity="0.95" />
          {CITY_BACK.map(([x, y, w], i) => <rect key={`b${i}`} x={x} y={y} width={w} height={300 - y} fill="#3b2f6b" />)}
          {CITY_FRONT.map(([x, y, w], i) => (
            <g key={`f${i}`}>
              <rect x={x} y={y} width={w} height={300 - y} fill="#271f4d" />
              {Array.from({ length: Math.floor((240 - y) / 14) }, (_, r) => Array.from({ length: Math.floor(w / 12) }, (_, c) => (
                (r * 7 + c * 3 + i) % 3 !== 0 && <rect key={`${r}-${c}`} x={x + 4 + c * 12} y={y + 6 + r * 14} width="6" height="7" rx="1" fill="#ffd98a" opacity={(r + c + i) % 4 === 0 ? 0.35 : 0.85} className={(r + c + i) % 9 === 0 ? 'cq-twinkle' : undefined} />
              )))}
            </g>
          ))}
          <rect y="236" width="400" height="64" fill="#1b1638" />
          </g>
          {children}
        </g>
      )
    case 'cabin':
      // a snowy evening: a log cabin with a warm window and chimney smoke among snowy pines
      return (
        <g>
          <Sky id={`s${u}`} stops={[[0, '#7f97c9'], [0.6, '#c7d3ef'], [1, '#f1e6f2']]} />
          {/* the band on a card shows the middle of the scene, so the scene sits up there */}
          <rect y="240" width="400" height="60" fill="#ffffff" />
          <g transform="translate(0,-40)">
          <path d="M0,190 Q100,160 200,182 T400,170 L400,300 L0,300Z" fill="#e6ecf8" />
          {pines(41, 10, 206, 40, 64, '#4c6a78')}
          <path d="M0,206 Q140,192 260,204 T400,198 L400,300 L0,300Z" fill="#f4f6fc" />
          <g transform="translate(150,0)">
            <Cloud x={84} y={128} s={0.5} o={0.7} />
            <Cloud x={96} y={112} s={0.4} o={0.55} />
            <rect x="74" y="140" width="12" height="30" fill="#6b4a3a" />
            <rect x="10" y="176" width="96" height="56" fill="#8a5a3f" />
            {[0, 1, 2, 3].map((i) => <rect key={i} x="10" y={180 + i * 13} width="96" height="3" fill="#6b4430" />)}
            <path d="M0,180 L58,138 L116,180Z" fill="#f7f9ff" />
            <path d="M6,182 L58,144 L110,182 L110,186 L6,186Z" fill="#6b4a3a" />
            <rect x="24" y="196" width="22" height="18" rx="2" fill="#ffd27a" />
            <rect x="34" y="196" width="2" height="18" fill="#8a5a3f" />
            <rect x="66" y="198" width="22" height="34" rx="2" fill="#5a3a2b" />
          </g>
          <Glow id={`w${u}`} x={185} y={205} r={40} color="#ffd27a" />
          <path d="M0,236 Q120,226 240,236 T400,232 L400,300 L0,300Z" fill="#ffffff" />
          </g>
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
