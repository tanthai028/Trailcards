// A profile picture: your photo or an icon, with an optional frame around it. Every layer is
// absolutely positioned to fill the box the caller gives (by size class or inset), so a photo
// of any shape always sits exactly inside the circle and the frame.
import { useId } from 'react'
import { AVATAR_BY_ID, DEFAULT_AVATAR, FRAME_BY_ID, isColorFrame, type Frame } from '../data/avatars'
import { Icon } from './Icon'

/** `bg`: an unlockable background behind the icon ('none' = the icon's own colour). */
export function ProfilePic({ avatar, photo, frame = 'none', bg = 'none', className = '' }: { avatar: string; photo: string | null; frame?: Frame; bg?: string; className?: string }) {
  const framed = frame !== 'none' && (isColorFrame(frame) || frame in FRAME_BY_ID)
  const icon = AVATAR_BY_ID[avatar] ?? AVATAR_BY_ID[DEFAULT_AVATAR]
  const positioned = /\b(absolute|fixed)\b/.test(className)
  return (
    <span className={`${positioned ? '' : 'relative'} block shrink-0 select-none ${className}`} aria-hidden="true">
      {/* the picture sits a little inside when there's a frame around it */}
      <span className={`absolute overflow-hidden rounded-full ${framed ? 'inset-[9%]' : 'inset-0'}`}>
        {photo ? (
          <img src={photo} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className={`absolute inset-0 grid place-items-center overflow-hidden ${bg !== 'none' ? `fx-bg-${bg}` : ''}`} style={bg === 'none' ? { background: `linear-gradient(145deg, ${icon.from}, ${icon.to})` } : undefined}>
            {bg === 'galaxy' && [[22, 30, 0], [70, 22, 0.6], [30, 72, 1.1], [78, 64, 0.3], [52, 48, 1.6]].map(([x, y, d]) => (
              <span key={`${x}${y}`} className="cq-twinkle absolute size-[5%] rounded-full bg-white" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
            ))}
            <Icon name={icon.glyph} className="relative h-[54%] w-[54%] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.35)]" strokeWidth={2.2} />
          </span>
        )}
      </span>
      {framed && <FrameRing frame={frame} />}
    </span>
  )
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
