// Original chibi character, drawn as layered SVG so every slot is swappable.
// Layer order: shadow → hair back → outfit back → body/outfit → head → face → hair front → accessory.
import { useId, type SVGProps } from 'react'
import { HAIR_COLORS, type Look } from '../data/look'

const SKIN = '#ffe4d4'
const SKIN_SHADE = '#f3c2ad'
const INK = '#2a2140'

export type Expression = 'smile' | 'happy' | 'wow'

interface Props extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  look: Look
  expression?: Expression
  idle?: boolean
  /** Crop to the head and shoulders. */
  portrait?: boolean
}

export function Character({ look, expression = 'smile', idle = false, portrait = false, className, ...rest }: Props) {
  const uid = useId().replace(/:/g, '')
  const hc = HAIR_COLORS.find((h) => h.id === look.hairColor) ?? HAIR_COLORS[0]
  return (
    <svg
      viewBox={portrait ? '28 8 144 160' : '0 0 200 260'}
      className={className}
      role="img"
      aria-label="Your character"
      {...rest}
    >
      <defs>
        <linearGradient id={`iris-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2150" />
          <stop offset="0.55" stopColor="#6a4fc4" />
          <stop offset="1" stopColor="#c4a8ff" />
        </linearGradient>
        <radialGradient id={`cheek-${uid}`}>
          <stop offset="0" stopColor="#ff8fa6" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ff8fa6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className={idle ? 'cq-idle' : undefined}>
        {!portrait && <ellipse cx="100" cy="246" rx="44" ry="7" fill="#1b1f3b" opacity="0.18" />}
        <HairBack style={look.hair} c={hc} />
        <OutfitBack id={look.outfit} />
        <Body outfit={look.outfit} />
        <rect x="93" y="134" width="14" height="20" rx="6" fill={SKIN_SHADE} />
        <OutfitCollar id={look.outfit} />
        <Head />
        <Face expression={expression} iris={`url(#iris-${uid})`} cheek={`url(#cheek-${uid})`} />
        <HairFront style={look.hair} c={hc} />
        <Accessory id={look.accessory} />
      </g>
    </svg>
  )
}

type HC = (typeof HAIR_COLORS)[number]

// ── Head & face ─────────────────────────────────────────────────
function Head() {
  return (
    <>
      <ellipse cx="46" cy="104" rx="6" ry="9" fill={SKIN_SHADE} />
      <ellipse cx="154" cy="104" rx="6" ry="9" fill={SKIN_SHADE} />
      <path d="M46,92 C46,56 70,40 100,40 C130,40 154,56 154,92 C154,124 130,146 100,146 C70,146 46,124 46,92Z" fill={SKIN} />
    </>
  )
}

function Face({ expression, iris, cheek }: { expression: Expression; iris: string; cheek: string }) {
  const happy = expression === 'happy'
  return (
    <g>
      <ellipse cx="66" cy="120" rx="11" ry="7" fill={cheek} />
      <ellipse cx="134" cy="120" rx="11" ry="7" fill={cheek} />
      {happy ? (
        <>
          <path d="M68,106 Q79,94 90,106" stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />
          <path d="M110,106 Q121,94 132,106" stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <g className="cq-blink">
          {[79, 121].map((x, i) => (
            <g key={x}>
              <ellipse cx={x} cy="106" rx="9.5" ry="12" fill={iris} />
              <ellipse cx={x} cy="108" rx="4.2" ry="6" fill="#1d1638" opacity="0.8" />
              <circle cx={x - 3.5} cy="100" r="3.4" fill="#fff" />
              <circle cx={x + 3.5} cy="112" r="1.6" fill="#fff" opacity="0.9" />
              <path
                d={i === 0 ? 'M67,98 Q79,88 92,97' : 'M108,97 Q121,88 133,98'}
                stroke={INK} strokeWidth="3.4" fill="none" strokeLinecap="round"
              />
              <path d={i === 0 ? 'M67,98 L62,95' : 'M133,98 L138,95'} stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}
      {expression === 'wow' ? (
        <ellipse cx="100" cy="126" rx="4" ry="5" fill="#b8466a" />
      ) : happy ? (
        <path d="M92,122 Q100,133 108,122 Z" fill="#c4506e" stroke="#9c3a56" strokeWidth="1" strokeLinejoin="round" />
      ) : (
        <path d="M94,124 Q97,127 100,124 Q103,127 106,124" stroke="#8a3f55" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
    </g>
  )
}

// ── Hair ────────────────────────────────────────────────────────
function HairBack({ style, c }: { style: string; c: HC }) {
  switch (style) {
    case 'hair-wolf':
      return <path d="M36,96 C32,50 66,26 100,26 C134,26 168,50 164,96 L170,130 L156,122 L160,152 L144,138 L140,162 L124,146 L100,154 L76,146 L60,162 L56,138 L40,152 L44,122 L30,130Z" fill={c.shade} />
    case 'hair-ponytail':
      return (
        <>
          <path d="M138,44 C176,30 192,74 182,114 C176,140 162,156 150,166 C158,134 160,104 150,80 C146,66 142,56 138,44Z" fill={c.shade} />
          <path d="M150,60 C168,64 174,92 166,120" stroke={c.base} strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
          <path d="M40,98 C38,52 66,30 100,30 C134,30 162,52 160,98 C160,118 156,134 150,142 L50,142 C44,134 40,118 40,98Z" fill={c.shade} />
        </>
      )
    case 'hair-buns':
      return (
        <>
          {[56, 144].map((x) => (
            <g key={x}>
              <circle cx={x} cy="42" r="21" fill={c.shade} />
              <path d={`M${x - 12},38 Q${x},26 ${x + 12},40`} stroke={c.base} strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
          ))}
          <path d="M40,98 C38,52 66,30 100,30 C134,30 162,52 160,98 C160,120 156,136 150,144 L50,144 C44,136 40,120 40,98Z" fill={c.shade} />
        </>
      )
    default:
      return <path d="M38,100 C34,52 66,28 100,28 C134,28 166,52 162,100 C164,126 158,146 148,156 Q124,150 100,152 Q76,150 52,156 C42,146 36,126 38,100Z" fill={c.shade} />
  }
}

const BOB_BANGS =
  'M40,96 C38,54 66,30 100,30 C134,30 162,54 160,96 C156,84 150,76 144,70 C142,82 136,88 128,93 C128,80 124,72 118,66 C112,80 102,86 89,89 C93,80 93,72 91,66 C84,78 74,86 62,91 C64,80 62,74 60,70 C52,78 46,88 40,96Z'

function HairFront({ style, c }: { style: string; c: HC }) {
  const shine = <path d="M66,50 Q84,38 104,38" stroke={c.shine} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.55" />
  switch (style) {
    case 'hair-wolf':
      return (
        <g>
          <path d="M96,32 Q100,12 116,8 Q108,20 112,32Z" fill={c.base} />
          <path d="M38,98 C36,52 66,28 100,28 C134,28 164,52 162,98 L150,78 L146,98 L132,74 L124,95 L112,70 L100,93 L90,68 L80,93 L70,72 L62,98 L52,78Z" fill={c.base} />
          <path d="M40,92 L34,142 L46,126 L50,152 L60,100Z" fill={c.base} />
          <path d="M160,92 L166,142 L154,126 L150,152 L140,100Z" fill={c.base} />
          {shine}
        </g>
      )
    case 'hair-ponytail':
      return (
        <g>
          <path d="M40,98 C38,52 66,30 100,30 C134,30 162,52 160,98 C152,80 140,70 126,66 C120,78 104,86 84,91 C96,80 100,72 100,64 C84,76 66,86 46,95Z" fill={c.base} />
          <path d="M44,92 C42,110 46,128 52,140 C52,120 54,106 58,94Z" fill={c.base} />
          <path d="M156,90 C158,106 156,120 152,130 C150,116 148,104 146,96Z" fill={c.base} />
          <circle cx="140" cy="44" r="6.5" fill="#ff8f8f" />
          {shine}
        </g>
      )
    case 'hair-buns':
      return (
        <g>
          <path d={BOB_BANGS} fill={c.base} />
          <path d="M44,92 C42,108 44,122 50,132 C50,116 52,104 56,96Z" fill={c.base} />
          <path d="M156,92 C158,108 156,122 150,132 C150,116 148,104 144,96Z" fill={c.base} />
          {shine}
        </g>
      )
    default:
      return (
        <g>
          <path d={BOB_BANGS} fill={c.base} />
          <path d="M42,90 C40,112 44,132 54,148 C54,128 56,110 60,96Z" fill={c.base} />
          <path d="M158,90 C160,112 156,132 146,148 C146,128 144,110 140,96Z" fill={c.base} />
          {shine}
        </g>
      )
  }
}

// ── Outfits ─────────────────────────────────────────────────────
const TORSO = 'M72,152 Q100,144 128,152 L134,208 Q100,216 66,208 Z'
const ARM_L = 'M77,158 Q65,174 63,194'
const ARM_R = 'M123,158 Q135,174 137,194'

function Arms({ sleeve, cuff }: { sleeve: string; cuff?: string }) {
  return (
    <g>
      <path d={ARM_L} stroke={sleeve} strokeWidth="15" fill="none" strokeLinecap="round" />
      <path d={ARM_R} stroke={sleeve} strokeWidth="15" fill="none" strokeLinecap="round" />
      {cuff && (
        <>
          <circle cx="63" cy="193" r="7.5" fill={cuff} />
          <circle cx="137" cy="193" r="7.5" fill={cuff} />
        </>
      )}
      <circle cx="63" cy="199" r="6.5" fill={SKIN} />
      <circle cx="137" cy="199" r="6.5" fill={SKIN} />
    </g>
  )
}

function Legs({ color, from = 206, width = 13 }: { color: string; from?: number; width?: number }) {
  return (
    <g>
      <path d={`M91,${from} L90,236`} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d={`M109,${from} L110,236`} stroke={color} strokeWidth={width} strokeLinecap="round" />
    </g>
  )
}

function Shoes({ color, sole = '#fff' }: { color: string; sole?: string }) {
  return (
    <g>
      {[87, 113].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="241" rx="11" ry="6.5" fill={color} />
          <path d={`M${x - 11},243 Q${x},248 ${x + 11},243`} stroke={sole} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  )
}

function star(cx: number, cy: number, r: number) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const rr = i % 2 ? r * 0.45 : r
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`)
  }
  return pts.join(' ')
}

function OutfitBack({ id }: { id: string }) {
  switch (id) {
    case 'outfit-trailhead':
      return <path d="M64,158 Q66,130 100,130 Q134,130 136,158 Z" fill="#6aa883" />
    case 'outfit-starlit':
      return (
        <g>
          <path d="M66,152 Q100,138 134,152 L154,240 Q100,250 46,240Z" fill="#232758" />
          <path d="M60,236 Q100,246 140,236" stroke="#ffd27a" strokeWidth="2" fill="none" opacity="0.8" />
          {[[58, 210], [146, 214], [52, 228], [150, 196]].map(([x, y]) => (
            <polygon key={`${x}${y}`} points={star(x, y, 3.6)} fill="#ffd27a" />
          ))}
        </g>
      )
    case 'outfit-nocturne':
      return <path d="M74,196 L126,196 L134,238 L114,232 L100,212 L86,232 L66,238Z" fill="#43203f" />
    default:
      return null
  }
}

function Body({ outfit }: { outfit: string }) {
  switch (outfit) {
    case 'outfit-courier':
      return (
        <g>
          <Legs color="#5c6378" width={15} />
          <rect x="80" y="214" width="9" height="8" rx="2" fill="#4a5064" />
          <rect x="111" y="214" width="9" height="8" rx="2" fill="#4a5064" />
          <Shoes color="#2a2d40" sole="#b49cff" />
          <path d={TORSO} fill="#7ccfb8" />
          <path d="M72,152 Q84,147 95,150 L93,200 L68,200 Z" fill="#2b2d42" />
          <path d="M128,152 Q116,147 105,150 L107,200 L132,200 Z" fill="#2b2d42" />
          <rect x="67" y="196" width="28" height="6" rx="3" fill="#b49cff" />
          <rect x="105" y="196" width="28" height="6" rx="3" fill="#b49cff" />
          <path d="M95,150 L93,198 M105,150 L107,198" stroke="#b49cff" strokeWidth="1.6" />
          <path d="M80,152 L128,206" stroke="#e8c27a" strokeWidth="5" strokeLinecap="round" />
          <rect x="120" y="196" width="22" height="16" rx="4" fill="#e8c27a" />
          <rect x="120" y="196" width="22" height="6" rx="3" fill="#d4a95c" />
          <Arms sleeve="#2b2d42" cuff="#b49cff" />
        </g>
      )
    case 'outfit-tidecaller':
      return (
        <g>
          <Legs color="#2f4a86" from={218} />
          <Shoes color="#8a5a44" sole="#c8957a" />
          <path d="M72,152 Q100,144 128,152 L138,224 Q100,232 62,224Z" fill="#f7f4ee" />
          <path d="M100,186 L100,226" stroke="#e2ddd2" strokeWidth="1.5" />
          <circle cx="92" cy="204" r="2.6" fill="#e5b04a" />
          <circle cx="108" cy="204" r="2.6" fill="#e5b04a" />
          <circle cx="92" cy="216" r="2.6" fill="#e5b04a" />
          <circle cx="108" cy="216" r="2.6" fill="#e5b04a" />
          <Arms sleeve="#f7f4ee" cuff="#2f4a86" />
        </g>
      )
    case 'outfit-keeper':
      return (
        <g>
          <Legs color="#3e4a3a" />
          <path d="M90,222 L90,238 M110,222 L110,238" stroke="#7a5136" strokeWidth="15" strokeLinecap="round" />
          <Shoes color="#6a4430" sole="#a87a5a" />
          <path d="M72,152 Q100,144 128,152 L136,214 Q100,222 64,214Z" fill="#7d9c57" />
          <rect x="66" y="192" width="68" height="8" rx="3" fill="#7a5136" />
          <rect x="95" y="191" width="10" height="10" rx="2" fill="#e5b04a" />
          <rect x="72" y="198" width="14" height="14" rx="4" fill="#9a6a46" />
          <Arms sleeve="#7d9c57" cuff="#5f7e40" />
        </g>
      )
    case 'outfit-starlit':
      return (
        <g>
          <Legs color="#33305a" />
          <Shoes color="#5a4a8a" sole="#b49cff" />
          <path d={TORSO} fill="#e9e3ff" />
          <rect x="68" y="190" width="64" height="6" rx="3" fill="#ffd27a" />
          <path d="M72,152 Q80,149 88,152 L80,238 L54,236 Z" fill="#2b2f66" />
          <path d="M128,152 Q120,149 112,152 L120,238 L146,236 Z" fill="#2b2f66" />
          <path d="M88,152 L80,238 M112,152 L120,238" stroke="#ffd27a" strokeWidth="1.6" />
          <polygon points={star(66, 206, 3.4)} fill="#ffd27a" />
          <polygon points={star(134, 182, 3)} fill="#ffd27a" />
          <Arms sleeve="#2b2f66" cuff="#ffd27a" />
        </g>
      )
    case 'outfit-nocturne':
      return (
        <g>
          <Legs color="#2b2340" />
          <Shoes color="#1d1828" sole="#6e5a8a" />
          <path d={TORSO} fill="#fbf4e6" />
          <path d="M78,154 L100,188 L122,154 L128,206 Q100,212 72,206Z" fill="#7a3470" />
          {[176, 188, 200].map((y) => <circle key={y} cx="100" cy={y + 6} r="2.4" fill="#ffd27a" />)}
          <path d="M72,152 L88,150 L96,186 L70,208Z" fill="#4e2249" />
          <path d="M128,152 L112,150 L104,186 L130,208Z" fill="#4e2249" />
          <Arms sleeve="#4e2249" cuff="#fbf4e6" />
        </g>
      )
    default: // trailhead
      return (
        <g>
          <path d="M91,216 L90,236 M109,216 L110,236" stroke={SKIN} strokeWidth="11" strokeLinecap="round" />
          <path d="M90,230 L90,236 M110,230 L110,236" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
          <Shoes color="#fff4e6" sole="#ff9f86" />
          <path d="M70,204 L130,204 L132,222 L102,224 L100,216 L98,224 L68,222Z" fill="#3d4470" />
          <path d="M70,152 Q100,143 130,152 L137,210 Q100,219 63,210 Z" fill="#8fc9a3" />
          <path d="M84,184 L116,184 L121,204 L79,204Z" fill="#7dbb93" />
          <path d="M64,206 Q100,215 136,206" stroke="#7dbb93" strokeWidth="5" fill="none" />
          <path d="M94,152 L93,172 M106,152 L107,172" stroke="#fff4e6" strokeWidth="2" strokeLinecap="round" />
          <circle cx="93" cy="174" r="2.2" fill="#fff4e6" />
          <circle cx="107" cy="174" r="2.2" fill="#fff4e6" />
          <Arms sleeve="#8fc9a3" cuff="#7dbb93" />
        </g>
      )
  }
}

/** Collars sit above the neck but below the head. */
function OutfitCollar({ id }: { id: string }) {
  switch (id) {
    case 'outfit-tidecaller':
      return (
        <g>
          <path d="M76,151 L100,186 L124,151 L114,148 L100,168 L86,148Z" fill="#2f4a86" />
          <path d="M80,153 L100,182 L120,153" stroke="#fff" strokeWidth="1.6" fill="none" />
          <path d="M100,182 L86,192 L88,178Z M100,182 L114,192 L112,178Z" fill="#ff7f8a" />
          <path d="M100,182 L92,204 M100,182 L108,204" stroke="#ff7f8a" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="182" r="4" fill="#e8606e" />
        </g>
      )
    case 'outfit-keeper':
      return (
        <g>
          <path d="M64,156 Q100,140 136,156 L140,172 Q133,179 127,172 Q120,181 113,172 Q106,181 100,172 Q94,181 87,172 Q80,181 73,172 Q67,179 60,172Z" fill="#4f8a5b" />
          <path d="M73,170 L76,160 M87,172 L88,160 M100,172 L100,158 M113,172 L112,160 M127,170 L124,160" stroke="#3b6e46" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )
    case 'outfit-starlit':
      return (
        <g>
          <path d="M82,152 Q100,160 118,152 L120,136 Q100,146 80,136Z" fill="#2b2f66" />
          <path d="M80,136 Q100,146 120,136" stroke="#ffd27a" strokeWidth="1.8" fill="none" />
          <polygon points={star(100, 156, 5.5)} fill="#ffd27a" stroke="#e0a94a" strokeWidth="1" />
        </g>
      )
    case 'outfit-nocturne':
      return (
        <g>
          <path d="M88,148 Q100,156 112,148 L108,166 Q100,172 92,166Z" fill="#fff8ea" stroke="#e7dcc4" strokeWidth="1" />
          <circle cx="100" cy="160" r="3" fill="#ffd27a" />
        </g>
      )
    case 'outfit-courier':
      return <path d="M84,150 Q100,158 116,150 L114,144 Q100,151 86,144Z" fill="#b49cff" />
    default:
      return null
  }
}

// ── Accessories ─────────────────────────────────────────────────
function Accessory({ id }: { id: string }) {
  switch (id) {
    case 'acc-clip':
      return <polygon points={star(138, 62, 9)} fill="#ffd27a" stroke="#e0a94a" strokeWidth="1.4" strokeLinejoin="round" />
    case 'acc-glasses':
      return (
        <g>
          <circle cx="79" cy="106" r="15" fill="#fff" fillOpacity="0.14" stroke="#3a2f52" strokeWidth="2.6" />
          <circle cx="121" cy="106" r="15" fill="#fff" fillOpacity="0.14" stroke="#3a2f52" strokeWidth="2.6" />
          <path d="M94,104 Q100,99 106,104" stroke="#3a2f52" strokeWidth="2.6" fill="none" />
        </g>
      )
    case 'acc-headphones':
      return (
        <g>
          <path d="M54,50 L60,22 L78,38Z" fill="#f6f1ff" />
          <path d="M146,50 L140,22 L122,38Z" fill="#f6f1ff" />
          <path d="M60,42 L62,30 L71,38Z M140,42 L138,30 L129,38Z" fill="#ffb3c8" />
          <path d="M42,94 C36,26 164,26 158,94" stroke="#f6f1ff" strokeWidth="9" fill="none" strokeLinecap="round" />
          <rect x="30" y="84" width="20" height="32" rx="9" fill="#b49cff" />
          <rect x="150" y="84" width="20" height="32" rx="9" fill="#b49cff" />
          <rect x="34" y="90" width="8" height="20" rx="4" fill="#d9ccff" />
          <rect x="158" y="90" width="8" height="20" rx="4" fill="#d9ccff" />
        </g>
      )
    case 'acc-hat':
      return (
        <g>
          <ellipse cx="100" cy="56" rx="76" ry="15" fill="#c9a46a" />
          <ellipse cx="100" cy="53" rx="70" ry="10" fill="#d8b47a" />
          <path d="M64,54 C62,16 138,16 136,54Z" fill="#c9a46a" />
          <path d="M65,44 Q100,50 135,44 L136,53 Q100,59 64,53Z" fill="#7a5a3a" />
          <path d="M96,26 Q100,20 104,26" stroke="#b08a52" strokeWidth="2" fill="none" />
          <polygon points={star(122, 48, 4)} fill="#ffd27a" />
        </g>
      )
    default:
      return null
  }
}
