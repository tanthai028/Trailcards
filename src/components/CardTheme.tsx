// Card themes beyond the scene: each one recolours the whole Learn card (through the colour
// variables in index.css, scoped by data-card-theme) and lays ornaments over it. Ornaments are a
// pointer-events-none overlay along the edges, so they never take space from the card's text.
import { useEffect } from 'react'

/** Title fonts some themes bring, fetched only once a card uses that theme. */
const FONTS: Record<string, string> = {
  campground: 'Bree+Serif',
  city: 'Space+Grotesk:wght@600;700',
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

/** The overlay for a theme; nothing for themes that are only a scene. */
export function CardOrnaments({ theme }: { theme: string }) {
  if (theme === 'campground') return <Campground />
  if (theme === 'city') return <City />
  return null
}

/** Canvas stitching around the card, a buffalo-plaid band along the bottom, pine sprigs in a corner. */
function Campground() {
  const sprig = (
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <path d="M6,36 C14,26 22,16 34,6" stroke="#6b4a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => {
        const t = 0.15 + i * 0.17, x = 6 + 28 * t, y = 36 - 30 * t
        return (
          <g key={i}>
            <path d={`M${x},${y} l-7,-3`} stroke="#4f7a4a" strokeWidth="2.4" strokeLinecap="round" />
            <path d={`M${x},${y} l3,7`} stroke="#5f8f57" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        )
      })}
    </svg>
  )
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
      <div className="absolute inset-[7px] rounded-[22px] border-[1.5px] border-dashed border-[#a07a4e]/45" />
      <div className="absolute inset-x-0 bottom-0 h-[7px] [background:repeating-linear-gradient(90deg,#b83a2c_0_10px,#2a1d18_10px_20px),repeating-linear-gradient(0deg,rgba(0,0,0,.25)_0_3px,transparent_3px_6px)] [background-blend-mode:multiply] opacity-90" />
      {/* bottom-left: clear of the text above and the save button on the right */}
      <div className="absolute bottom-2 left-2 size-10 opacity-85">{sprig}</div>
      <div className="absolute bottom-2 left-8 size-7 rotate-12 opacity-70">{sprig}</div>
    </div>
  )
}

/** A neon edge that hums, and a strip of skyline along the bottom. */
function City() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
      <div className="fx-neon-edge absolute inset-[5px] rounded-[24px]" />
      <svg viewBox="0 0 400 24" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-5 w-full opacity-70">
        <path d="M0,24 V14 h18 V8 h14 V16 h10 V4 h16 V12 h12 V18 h20 V6 h10 V2 h8 V10 h18 V16 h14 V8 h20 V14 h12 V5 h16 V12 h22 V17 h10 V9 h18 V3 h12 V13 h16 V7 h14 V15 h20 V24Z" fill="#120e26" />
        {[30, 92, 150, 214, 268, 330, 372].map((x, i) => <rect key={x} x={x} y={10 + (i % 3) * 3} width="3" height="3" fill="#ffd98a" opacity={i % 2 ? 0.9 : 0.6} />)}
      </svg>
    </div>
  )
}
