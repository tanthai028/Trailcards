// A profile picture: your photo or an icon, with an optional frame around it. Every layer is
// absolutely positioned to fill the box the caller gives (by size class or inset), so a photo
// of any shape always sits exactly inside the circle and the frame.
import { useId } from 'react'
import { AVATAR_BY_ID, DEFAULT_AVATAR, FRAME_BY_ID, isColorFrame, type Frame } from '../data/avatars'
import { Icon } from './Icon'

/** `fx`: an unlockable effect around the picture, behind and/or in front of it. */
export function ProfilePic({ avatar, photo, frame = 'none', fx = 'none', className = '' }: { avatar: string; photo: string | null; frame?: Frame; fx?: string; className?: string }) {
  const framed = frame !== 'none' && (isColorFrame(frame) || frame in FRAME_BY_ID)
  const icon = AVATAR_BY_ID[avatar] ?? AVATAR_BY_ID[DEFAULT_AVATAR]
  const positioned = /\b(absolute|fixed)\b/.test(className)
  return (
    <span className={`${positioned ? '' : 'relative'} block shrink-0 select-none ${className}`} aria-hidden="true">
      <IconFx fx={fx} back />
      {/* the picture sits a little inside when there's a frame around it */}
      <span className={`absolute overflow-hidden rounded-full ${framed ? 'inset-[9%]' : 'inset-0'}`}>
        {photo ? (
          <img src={photo} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center overflow-hidden" style={{ background: `linear-gradient(145deg, ${icon.from}, ${icon.to})` }}>
            <Icon name={icon.glyph} className="relative h-[54%] w-[54%] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.35)]" strokeWidth={2.2} />
          </span>
        )}
      </span>
      {framed && <FrameRing frame={frame} />}
      <IconFx fx={fx} />
    </span>
  )
}

// x%, y%, delay s: spots around the edge of the picture
const RIM: [number, number, number][] = [[8, 22, 0], [88, 14, 0.7], [96, 62, 1.4], [70, 94, 0.4], [4, 74, 1.1]]

/**
 * The picture's effect, sized from the picture so it fits a 44px leaderboard row and the big
 * profile banner alike. `back` draws what glows behind the picture; the rest goes in front.
 */
function IconFx({ fx, back = false }: { fx: string; back?: boolean }) {
  if (fx === 'none') return null
  if (back) {
    if (fx === 'glow') return <span className="fx-glow-pulse pointer-events-none absolute -inset-[10%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,220,140,.9) 45%, rgba(255,200,110,0) 70%)' }} />
    if (fx === 'flame') return <span className="fx-flame-aura pointer-events-none absolute -inset-[12%] rounded-full" style={{ background: 'radial-gradient(circle at 50% 60%, rgba(255,150,60,.95) 40%, rgba(232,87,63,.5) 58%, rgba(232,87,63,0) 72%)' }} />
    if (fx === 'rainbow') return (
      <span className="pointer-events-none absolute -inset-[8%] rounded-full [mask:radial-gradient(circle,transparent_58%,#000_60%)]">
        <span className="fx-orbit absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#f08a80, #f5cd6a, #8dcfa1, #9cc8f2, #b9a7f2, #f08a80)', animationDuration: '6s' }} />
      </span>
    )
    return null
  }
  const star = 'M0,-6 C1,-1 1,-1 6,0 C1,1 1,1 0,6 C-1,1 -1,1 -6,0 C-1,-1 -1,-1 0,-6Z'
  if (fx === 'sparkle') return (
    <span className="pointer-events-none absolute -inset-[8%]">
      {RIM.map(([x, y, d], i) => (
        <svg key={i} viewBox="-7 -7 14 14" className="cq-twinkle absolute size-[18%]" style={{ left: `${x}%`, top: `${y}%`, translate: '-50% -50%', animationDelay: `-${d}s` }}>
          <path d={star} fill="#fff6c9" stroke="#f5b942" strokeWidth=".6" />
        </svg>
      ))}
    </span>
  )
  if (fx === 'orbit') return (
    <span className="fx-orbit pointer-events-none absolute -inset-[10%]" style={{ animationDuration: '4s' }}>
      <svg viewBox="-7 -7 14 14" className="absolute left-1/2 top-0 size-[20%] -translate-x-1/2"><path d={star} fill="#fff" stroke="#b9a7f2" strokeWidth=".8" /></svg>
      <span className="absolute bottom-[4%] left-1/2 size-[7%] -translate-x-1/2 rounded-full bg-[#9cc8f2]" />
    </span>
  )
  if (fx === 'bubbles' || fx === 'snow') return (
    <span className="pointer-events-none absolute -inset-[6%] overflow-hidden rounded-full">
      {RIM.map(([x, , d], i) => (
        <span key={i} className={`absolute rounded-full ${fx === 'snow' ? 'fx-icon-fall bg-white' : 'fx-icon-rise border border-white/80 bg-white/25'}`}
          style={{ left: `${(x * 0.8 + 10) % 92}%`, width: `${fx === 'snow' ? 6 + (i % 2) * 3 : 9 + (i % 3) * 4}%`, aspectRatio: '1', animationDelay: `-${d * 1.6}s`, animationDuration: `${2.6 + (i % 3) * 0.7}s` }} />
      ))}
    </span>
  )
  if (fx === 'flame') return (
    <span className="pointer-events-none absolute -inset-[6%]">
      {[[18, 0], [50, 0.3], [82, 0.15]].map(([x, d]) => (
        <svg key={x} viewBox="-6 -11 12 16" className="fx-flicker absolute bottom-0 size-[22%]" style={{ left: `${x}%`, translate: '-50% 20%', animationDelay: `${d}s` }}>
          <path d="M0,-10 C4,-4 5,1 0,5 C-5,1 -4,-4 0,-10Z" fill="#f97316" /><path d="M0,-4 C2,-1 2,2 0,4 C-2,2 -2,-1 0,-4Z" fill="#fde047" />
        </svg>
      ))}
    </span>
  )
  return null
}

/** The frame, drawn in a 100×100 box over the whole picture. */
export function FrameRing({ frame }: { frame: Frame }) {
  const id = useId().replace(/:/g, '')
  const ring = (stroke: string, width = 7) => <circle cx="50" cy="50" r={50 - width / 2} fill="none" stroke={stroke} strokeWidth={width} />
  const around = (n: number, r: number, draw: (x: number, y: number, deg: number, i: number) => JSX.Element) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2
      return draw(50 + Math.cos(a) * r, 50 + Math.sin(a) * r, (a * 180) / Math.PI + 90, i)
    })
  let art: JSX.Element
  if (isColorFrame(frame)) art = ring(frame.slice(6))
  else if (frame === 'gold') {
    art = (
      <>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2b8" /><stop offset=".5" stopColor="#f5b942" /><stop offset="1" stopColor="#b97a1c" /></linearGradient>
        </defs>
        {ring(`url(#g${id})`, 8)}
        <circle cx="50" cy="50" r="45.5" fill="none" stroke="#fff6d6" strokeWidth="1" opacity=".7" />
      </>
    )
  } else if (frame === 'leaf') {
    art = (
      <>
        {ring('#6fae68', 5)}
        {around(14, 46, (x, y, deg, i) => <ellipse key={i} cx={x} cy={y} rx="3.6" ry="7" fill={i % 2 ? '#8dcfa1' : '#5aa868'} transform={`rotate(${deg + 35} ${x} ${y})`} />)}
      </>
    )
  } else if (frame === 'flame') {
    art = (
      <>
        <defs>
          <linearGradient id={`f${id}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#e8573f" /><stop offset="1" stopColor="#ffc54a" /></linearGradient>
        </defs>
        {ring(`url(#f${id})`, 7)}
        {around(10, 46.5, (x, y, deg, i) => <path key={i} d="M0,-8 C3,-3 4,1 0,4 C-4,1 -3,-3 0,-8Z" fill={i % 2 ? '#ffc54a' : '#f7934c'} transform={`translate(${x} ${y}) rotate(${deg}) scale(.9)`} />)}
      </>
    )
  } else if (frame === 'stars') {
    art = (
      <>
        {ring('#2a2550', 8)}
        {around(12, 46, (x, y, _d, i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.1 : 1.9} fill="#ffe7a3" />)}
      </>
    )
  } else if (frame === 'rainbow') {
    const colors = ['#f08a80', '#f7b48f', '#f5cd6a', '#8dcfa1', '#9cc8f2', '#b9a7f2']
    const r = 46.5, c = 2 * Math.PI * r
    art = <>{colors.map((col, i) => <circle key={col} cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="7" strokeDasharray={`${c / colors.length + 0.5} ${c}`} strokeDashoffset={-(c / colors.length) * i} transform="rotate(-90 50 50)" />)}</>
  } else if (frame === 'crown') {
    art = (
      <>
        {ring('#f5b942', 6)}
        <path d="M34,12 L38,0 L44,8 L50,-2 L56,8 L62,0 L66,12 Z" fill="#f5cd6a" stroke="#b97a1c" strokeWidth="1.5" strokeLinejoin="round" transform="translate(0 2)" />
        <circle cx="50" cy="1" r="2" fill="#f08a80" />
      </>
    )
  } else if (frame === 'neon') {
    return <span className="fx-frame-neon pointer-events-none absolute inset-[3%]" />
  } else if (frame === 'prism') {
    return <span className="fx-frame-prism pointer-events-none absolute inset-0" />
  } else if (frame === 'sparkle') {
    const star = 'M0,-6 C1,-1 1,-1 6,0 C1,1 1,1 0,6 C-1,1 -1,1 -6,0 C-1,-1 -1,-1 0,-6Z'
    art = (
      <>
        <circle cx="50" cy="50" r="47" fill="none" stroke="#fff3c4" strokeWidth="2.5" opacity=".9" />
        <circle cx="50" cy="50" r="47" fill="none" stroke="#f5cd6a" strokeWidth="6" opacity=".35" className="fx-glow-pulse" />
        <g className="fx-orbit" style={{ transformBox: 'view-box', transformOrigin: '50% 50%' }}>
          {around(6, 47, (x, y, _d, i) => <path key={i} d={star} fill="#fff6c9" stroke="#f5b942" strokeWidth=".8" transform={`translate(${x} ${y}) scale(${i % 2 ? 1.1 : 1.7})`} style={{ filter: 'drop-shadow(0 0 3px #ffd27a)' }} />)}
        </g>
      </>
    )
  } else if (frame === 'inferno') {
    art = (
      <>
        <defs>
          <linearGradient id={`i${id}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#b91c1c" /><stop offset=".6" stopColor="#f97316" /><stop offset="1" stopColor="#fde047" /></linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="none" stroke="#f97316" strokeWidth="10" opacity=".35" className="fx-glow-pulse" />
        {ring(`url(#i${id})`, 7)}
        {around(12, 47, (x, y, deg, i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${deg})`}>
            <path d="M0,-10 C4,-4 5,1 0,5 C-5,1 -4,-4 0,-10Z" fill={i % 2 ? '#fde047' : '#f97316'} className="fx-flicker" style={{ animationDelay: `${(i % 4) * 0.15}s` }} />
          </g>
        ))}
      </>
    )
  } else return null
  return (
    <svg viewBox="0 0 100 100" overflow="visible" className="pointer-events-none absolute inset-0 h-full w-full">
      {art}
    </svg>
  )
}
