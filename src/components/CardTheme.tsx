// Card themes beyond the scene: each one recolours the whole Learn card (through the colour
// variables in index.css, scoped by data-card-theme), gives titles their own font, and puts a
// small ornament in the bottom-left corner, clear of the text and the save button. Ornaments are
// a pointer-events-none overlay, so they never take space or catch a tap. No borders or outlines
// around the card: those read as a frame fighting the card's own edge.
import { useEffect, type ReactNode } from 'react'

/** Title fonts the themes bring, fetched only once a card uses that theme. */
const FONTS: Record<string, string> = {
  campground: 'Bree+Serif',
  room: 'Fraunces:opsz,wght@9..144,600',
  beach: 'Baloo+2:wght@700',
  city: 'Space+Grotesk:wght@600;700',
  cabin: 'Lora:wght@600',
}

const loaded = new Set<string>()
export function useThemeFont(theme: string) {
  useEffect(() => {
    const family = FONTS[theme]
    if (!family || loaded.has(family)) return
    loaded.add(family)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`
    document.head.appendChild(link)
  }, [theme])
}

const Corner = ({ children, band }: { children: ReactNode; band?: ReactNode }) => (
  <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
    {band}
    <div className="absolute bottom-2 left-2 h-11 w-20">{children}</div>
  </div>
)

/** The overlay for a theme; nothing for "By topic". */
export function CardOrnaments({ theme }: { theme: string }) {
  switch (theme) {
    case 'campground':
      // pine sprigs, over a buffalo-plaid band along the very bottom
      return (
        <Corner band={<div className="absolute inset-x-0 bottom-0 h-[7px] [background:repeating-linear-gradient(90deg,#b83a2c_0_10px,#2a1d18_10px_20px),repeating-linear-gradient(0deg,rgba(0,0,0,.25)_0_3px,transparent_3px_6px)] [background-blend-mode:multiply] opacity-90" />}>
          <svg viewBox="0 0 80 44" className="h-full w-full">
            {[[4, 40, 1, 0.9], [30, 42, 0.75, 0.7]].map(([x, y, s, o], k) => (
              <g key={k} transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
                <path d="M0,0 C8,-10 16,-20 28,-30" stroke="#6b4a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
                {[0, 1, 2, 3, 4].map((i) => {
                  const t = 0.15 + i * 0.17, px = 28 * t, py = -30 * t
                  return (
                    <g key={i}>
                      <path d={`M${px},${py} l-7,-3`} stroke="#4f7a4a" strokeWidth="2.4" strokeLinecap="round" />
                      <path d={`M${px},${py} l3,7`} stroke="#5f8f57" strokeWidth="2.4" strokeLinecap="round" />
                    </g>
                  )
                })}
              </g>
            ))}
          </svg>
        </Corner>
      )
    case 'room':
      // a little potted plant and a steaming mug
      return (
        <Corner>
          <svg viewBox="0 0 80 44" className="h-full w-full">
            <path d="M10,26 C2,16 6,6 12,2 C14,10 14,18 12,26Z M12,26 C10,14 18,8 24,8 C22,16 18,22 12,26Z M12,26 C6,22 0,20 -2,14 C6,14 10,20 12,26Z" fill="#6fae7a" />
            <path d="M4,26 H22 L19,42 H7Z" fill="#c46a4f" />
            <rect x="3" y="25" width="20" height="4" rx="2" fill="#a8553f" />
            <rect x="36" y="26" width="18" height="16" rx="4" fill="#e9cfa8" />
            <path d="M54,30 h4 a4,4 0 0 1 0,8 h-4" stroke="#e9cfa8" strokeWidth="3" fill="none" />
            <path className="cq-drift" d="M41,22 c-3,-4 3,-6 0,-10 M49,22 c-3,-4 3,-6 0,-10" stroke="#c9a98a" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".7" />
          </svg>
        </Corner>
      )
    case 'beach':
      // a starfish and a scallop shell in the sand
      return (
        <Corner>
          <svg viewBox="0 0 80 44" className="h-full w-full">
            <path d="M18,8 L21,19 L32,19 L23,26 L27,37 L18,30 L9,37 L13,26 L4,19 L15,19Z" fill="#f2946b" stroke="#d8704c" strokeWidth="1.2" strokeLinejoin="round" />
            {[[18, 18], [14, 24], [22, 24], [18, 29]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1" fill="#fbd3bd" />)}
            <path d="M40,40 C38,30 44,22 52,22 C60,22 66,30 64,40Z" fill="#fde2d0" stroke="#e7b79a" strokeWidth="1.2" />
            {[44, 48, 52, 56, 60].map((x) => <path key={x} d={`M52,40 L${x},${x === 52 ? 23 : 25}`} stroke="#e7b79a" strokeWidth="1" />)}
          </svg>
        </Corner>
      )
    case 'city':
      // a small neon crescent and two stars
      return (
        <Corner>
          <svg viewBox="0 0 80 44" className="h-full w-full overflow-visible" style={{ filter: 'drop-shadow(0 0 4px rgba(255,122,217,.8))' }}>
            <path d="M20,6 A14,14 0 1 0 32,30 A11,11 0 1 1 20,6Z" fill="none" stroke="#ff8ad9" strokeWidth="2.2" className="fx-neon-soft" />
            <path d="M46,14 l2,5 5,2 -5,2 -2,5 -2,-5 -5,-2 5,-2Z" fill="#7ad7ff" />
            <path d="M60,28 l1.4,3.4 3.4,1.4 -3.4,1.4 -1.4,3.4 -1.4,-3.4 -3.4,-1.4 3.4,-1.4Z" fill="#ffd98a" />
          </svg>
        </Corner>
      )
    case 'cabin':
      // three snowflakes drifting in the corner
      return (
        <Corner>
          <svg viewBox="0 0 80 44" className="h-full w-full">
            {[[14, 24, 11], [38, 30, 7], [56, 16, 5]].map(([x, y, r], k) => (
              <g key={k} transform={`translate(${x} ${y})`} stroke="#8fb0d8" strokeWidth={r > 8 ? 1.8 : 1.4} strokeLinecap="round" className="cq-twinkle" style={{ animationDelay: `-${k * 0.7}s` }}>
                {[0, 60, 120].map((a) => (
                  <g key={a} transform={`rotate(${a})`}>
                    <path d={`M0,${-r} V${r}`} />
                    <path d={`M0,${-r * 0.6} l${r * 0.25},${-r * 0.25} M0,${-r * 0.6} l${-r * 0.25},${-r * 0.25} M0,${r * 0.6} l${r * 0.25},${r * 0.25} M0,${r * 0.6} l${-r * 0.25},${r * 0.25}`} />
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </Corner>
      )
    default:
      return null
  }
}
