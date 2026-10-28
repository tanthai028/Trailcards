// The player as a rendered figurine: one render per body × hairstyle × outfit.
// Hair colour is recoloured at runtime from a hair mask, and extras are rendered
// props fitted to the face/hair anchors the art pipeline measured on each render.
import { useEffect, useState, type CSSProperties } from 'react'
import { art } from './assets'
import anchorsJson from '../assets/art/anchors.json'
import { Character } from '../art/Character'
import { HAIR_COLORS, type Look } from '../data/items'

type Box = [number, number, number, number]
interface Anchor { face: Box; hair: Box; aspect: number }
const ANCHORS = anchorsJson as unknown as Record<string, Anchor>

const key = (id: string) => id.split('-').slice(1).join('-') // 'hair-bob' → 'bob'
const baseName = (look: Look) => `fig-${look.body}-${key(look.hair)}-${key(look.outfit)}`
/** Extras are baked into their own render; until one exists, the plain render + overlay is used. */
export const figurineName = (look: Look) => {
  const baked = look.accessory !== 'acc-none' ? `${baseName(look)}-${key(look.accessory)}` : null
  return baked && art(baked) && ANCHORS[baked] ? baked : baseName(look)
}

// ── Hair recolouring ────────────────────────────────────────────
const cache = new Map<string, Promise<string>>()
const load = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

function recolor(src: string, maskSrc: string, colorId: string): Promise<string> {
  const id = `${src}|${colorId}`
  if (!cache.has(id)) {
    cache.set(
      id,
      (async () => {
        const hc = HAIR_COLORS.find((c) => c.id === colorId)!
        const [shade, base, shine] = [hc.shade, hc.base, hc.shine].map(hex)
        const [img, mask] = await Promise.all([load(src), load(maskSrc)])
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(mask, 0, 0, c.width, c.height)
        const m = ctx.getImageData(0, 0, c.width, c.height).data
        ctx.clearRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0)
        const out = ctx.getImageData(0, 0, c.width, c.height)
        const d = out.data
        const lumAt = (i: number) => (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255
        // Keep the render's shading: stretch this render's own hair lightness range (3rd to
        // 97th percentile) over deep shadow -> shade -> base -> shine. A fixed range flattened
        // light colours, so strands and shadows disappeared.
        const ls: number[] = []
        for (let i = 0; i < d.length; i += 4) if (m[i] > 128) ls.push(lumAt(i))
        ls.sort((a, b) => a - b)
        const lo = ls[Math.floor(ls.length * 0.03)] ?? 0.05
        const hi = Math.max(lo + 0.05, ls[Math.floor(ls.length * 0.97)] ?? 0.5)
        const stops: [number, number[]][] = [[0, shade.map((v) => v * 0.45)], [0.38, shade], [0.72, base], [1, shine]]
        const ramp = (lum: number) => {
          const t = Math.min(1, Math.max(0, (lum - lo) / (hi - lo)))
          for (let j = 1; j < stops.length; j++) {
            if (t > stops[j][0]) continue
            const [t0, a] = stops[j - 1]
            const [t1, b] = stops[j]
            const u = (t - t0) / (t1 - t0)
            return a.map((v, ch) => v + (b[ch] - v) * u)
          }
          return shine
        }
        for (let i = 0; i < d.length; i += 4) {
          const k = m[i] / 255
          if (k < 0.02) continue
          const col = ramp(lumAt(i))
          for (let ch = 0; ch < 3; ch++) d[i + ch] = d[i + ch] * (1 - k) + col[ch] * k
        }
        ctx.putImageData(out, 0, 0)
        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.9))
        return blob ? URL.createObjectURL(blob) : src
      })(),
    )
  }
  return cache.get(id)!
}

function useHairColored(src: string | undefined, name: string, colorId: string) {
  const mask = art(`${name}-hair`)
  const plain = !src || !mask || colorId === 'ink'
  const [url, setUrl] = useState<string | undefined>(plain ? src : undefined)
  useEffect(() => {
    if (plain) return setUrl(src)
    let live = true
    recolor(src!, mask!, colorId).then((u) => live && setUrl(u))
    return () => {
      live = false
    }
  }, [src, mask, colorId, plain])
  return url
}

// ── Extras, fitted to each render's measured face + hair ───────
function extraStyle(id: string, a: Anchor): CSSProperties | null {
  const [fx0, fy0, fx1, fy1] = a.face
  const fw = fx1 - fx0, fh = fy1 - fy0
  const fcx = (fx0 + fx1) / 2
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`
  // widths are fractions of the figurine width; tops of its height
  const box = (cx: number, w: number, top: number) => ({ left: pct(cx - w / 2), width: pct(w), top: pct(top) })
  const tall = (w: number, ratio: number) => w * a.aspect * ratio // image height as fraction of figurine height
  switch (id) {
    case 'acc-glasses': {
      const w = fw * 1.02
      return box(fcx, w, fy0 + fh * 0.37 - tall(w, 131 / 320) / 2)
    }
    // Sized/centred from the face box: hair boxes vary too much (ponytails, wolf cuts).
    case 'acc-headphones': {
      const w = fw * 1.62
      return box(fcx, w, fy0 + fh * 0.38 - tall(w, 300 / 340) * 0.72)
    }
    case 'acc-hat': {
      const w = fw * 1.75
      // the brim's centre line sits ~74% down the hat image; seat it at the hairline
      return box(fcx, w, fy0 - fh * 0.12 - tall(w, 228 / 360) * 0.74)
    }
    case 'acc-clip': {
      const w = fw * 0.24
      return box(fx1 - fw * 0.05, w, fy0 - fh * 0.2)
    }
    default:
      return null
  }
}

export function Figurine({ look, className, style }: { look: Look; className?: string; style?: CSSProperties }) {
  const name = figurineName(look)
  const src = art(name)
  const anchor = ANCHORS[name]
  const url = useHairColored(src, name, look.hairColor)
  if (!src || !anchor) return <Character look={look} className={className} style={style} />
  // overlay fallback only when this extra hasn't been baked into a render yet
  const baked = name !== baseName(look)
  const extra = look.accessory !== 'acc-none' && !baked ? art(look.accessory) : undefined
  const extraPos = extra ? extraStyle(look.accessory, anchor) : null
  return (
    <span
      // callers may position it absolutely; otherwise it's its own positioning context
      className={`${/\b(absolute|fixed)\b/.test(className ?? '') || style?.position ? '' : 'relative'} inline-block select-none ${className ?? ''}`}
      style={{ aspectRatio: anchor.aspect, ...style }}
      role="img"
      aria-label="Your character"
    >
      {url && <img src={url} alt="" draggable={false} className="absolute inset-0 h-full w-full" />}
      {extra && extraPos && <img src={extra} alt="" draggable={false} className="absolute max-w-none" style={extraPos} />}
    </span>
  )
}

/** Head-and-shoulders crop of the same figurine, for avatars and the top bar. */
export function Avatar({ look, className }: { look: Look; className?: string }) {
  const anchor = ANCHORS[figurineName(look)]
  if (!anchor) return <Character look={look} portrait className={className} />
  // Framed from the face box: hats and ponytails make the hair box unreliable.
  const [fx0, fy0, fx1, fy1] = anchor.face
  const fw = fx1 - fx0
  const scale = 0.6 / fw // face spans ~60% of the circle
  const headCx = (fx0 + fx1) / 2
  const headCy = (fy0 + fy1) / 2 - (fy1 - fy0) * 0.15
  const figH = scale / anchor.aspect // figurine height in units of circle width
  return (
    <span className={`${/\b(absolute|fixed)\b/.test(className ?? '') ? '' : 'relative'} block overflow-hidden ${className ?? ''}`}>
      {/* square frame centred in whatever box the caller gives, so % offsets stay in one unit */}
      <span className="absolute left-1/2 top-1/2 aspect-square h-full max-w-full -translate-x-1/2 -translate-y-1/2">
        <Figurine
          look={look}
          style={{
            position: 'absolute',
            width: `${scale * 100}%`,
            left: `${(0.5 - headCx * scale) * 100}%`,
            top: `${(0.5 - headCy * figH) * 100}%`,
          }}
        />
      </span>
    </span>
  )
}
