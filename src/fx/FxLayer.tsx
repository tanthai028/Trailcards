// One full-screen layer for celebration effects, so bursts never add elements to the cards.
// Confetti is drawn on a single canvas that only animates while pieces are alive; flying
// coins are a handful of pooled elements moved with the Web Animations API (transform only).
import { useEffect, useRef } from 'react'
import { playCoin } from './sound'

const COLORS = ['#f5cd6a', '#b9a7f2', '#8dcfa1', '#f7b48f', '#9cc8f2', '#fbf3e6']
const GOLDS = ['#f5cd6a', '#ffe7a3', '#fbf3e6', '#f7b48f']

interface Piece { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; color: string; life: number; g: number }

interface Spray { count: number; speed: number; spread: number; colors: string[]; gravity: number; size: number }
let burstImpl: ((x: number, y: number, o?: Partial<Spray>) => void) | null = null
let coinsImpl: ((from: DOMRect, count: number) => void) | null = null

const reduced = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-reduce-motion')

/** Confetti from a point on screen (viewport coordinates). */
export function burst(x: number, y: number) {
  if (!reduced()) burstImpl?.(x, y)
}

/** Level up: bursts across the screen plus confetti falling from the top. */
export function celebrate() {
  if (reduced() || !burstImpl) return
  const w = innerWidth
  const h = innerHeight
  ;[[0.5, 0.32], [0.22, 0.45], [0.78, 0.45]].forEach(([x, y], i) => setTimeout(() => burstImpl?.(w * x, h * y, { count: 34, speed: 9 }), i * 140))
  for (let i = 0; i < 8; i++) setTimeout(() => burstImpl?.(Math.random() * w, -10, { count: 6, speed: 2, spread: 0.6, gravity: 0.12 }), 200 + i * 90)
}

/** Unlock: a small ring of gold sparkles that floats rather than falls. */
export function sparkle(x: number, y: number) {
  if (!reduced()) burstImpl?.(x, y, { count: 22, speed: 4.5, spread: Math.PI * 2, colors: GOLDS, gravity: 0.05, size: 0.7 })
}

/** Coins fly from a rectangle to the coin counter, chiming as each lands. */
export function flyCoins(from: DOMRect, count: number) {
  if (reduced()) return
  coinsImpl?.(from, count)
}

const COIN_SVG =
  '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f5b942"/><circle cx="12" cy="12" r="7.5" fill="#ffd27a"/><path d="M12 7.5l1.3 2.9 3.1.3-2.4 2 .8 3.1L12 14.2l-2.8 1.6.8-3.1-2.4-2 3.1-.3L12 7.5Z" fill="#f5b942"/></svg>'

export function FxLayer() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const coinLayer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cv = canvas.current!
    const g = cv.getContext('2d')!
    let pieces: Piece[] = []
    let raf = 0
    let last = 0

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = innerWidth * dpr
      cv.height = innerHeight * dpr
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    window.addEventListener('resize', size)

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.7, 3)
      last = now
      g.clearRect(0, 0, innerWidth, innerHeight)
      for (const p of pieces) {
        p.vy += p.g * dt
        p.vx *= 0.985
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        p.life -= dt
        g.save()
        g.globalAlpha = Math.max(0, Math.min(1, p.life / 20))
        g.translate(p.x, p.y)
        g.rotate(p.rot)
        g.fillStyle = p.color
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        g.restore()
      }
      pieces = pieces.filter((p) => p.life > 0 && p.y < innerHeight + 20)
      if (pieces.length) raf = requestAnimationFrame(frame)
      else { raf = 0; g.clearRect(0, 0, innerWidth, innerHeight) }
    }

    burstImpl = (x, y, o = {}) => {
      const { count = 26, speed = 5, spread = 2.2, colors = COLORS, gravity = 0.32, size = 1 } = o
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * spread
        const v = speed + Math.random() * speed * 1.2
        pieces.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          w: (5 + Math.random() * 4) * size, h: (3 + Math.random() * 3) * size, color: colors[i % colors.length], life: 45 + Math.random() * 25, g: gravity,
        })
      }
      if (pieces.length > 260) pieces = pieces.slice(-260)
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) }
    }

    coinsImpl = (from, count) => {
      const target = document.querySelector('[data-coin-target]')?.getBoundingClientRect()
      const layer = coinLayer.current
      if (!target || !layer) return
      const tx = target.left + 18
      const ty = target.top + target.height / 2
      const n = Math.min(count, 6)
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div')
        el.innerHTML = COIN_SVG
        el.style.cssText = 'position:absolute;left:0;top:0;will-change:transform'
        layer.appendChild(el)
        const sx = from.left + from.width * (0.3 + Math.random() * 0.4) - 9
        const sy = from.top + from.height / 2 - 9
        // arc: pop up from the answer, then sweep to the counter
        const mx = sx + (tx - sx) * 0.35 + (Math.random() - 0.5) * 60
        const my = Math.min(sy, ty) - 40 - Math.random() * 40
        const anim = el.animate(
          [
            { transform: `translate(${sx}px, ${sy}px) scale(0.6)`, opacity: 0 },
            { transform: `translate(${sx}px, ${sy - 24}px) scale(1.1)`, opacity: 1, offset: 0.18 },
            { transform: `translate(${mx}px, ${my}px) scale(1)`, offset: 0.55 },
            { transform: `translate(${tx - 9}px, ${ty - 9}px) scale(0.7)`, opacity: 0.9 },
          ],
          { duration: 720, delay: i * 70, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'backwards' },
        )
        anim.onfinish = () => {
          el.remove()
          playCoin(i)
        }
      }
    }

    return () => {
      window.removeEventListener('resize', size)
      cancelAnimationFrame(raf)
      burstImpl = null
      coinsImpl = null
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden="true">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <div ref={coinLayer} className="absolute inset-0" />
    </div>
  )
}
