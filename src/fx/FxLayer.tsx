// One full-screen layer for celebration effects, so bursts never add elements to the cards.
// Confetti is drawn on a single canvas that only animates while pieces are alive.
import { useEffect, useRef } from 'react'

const COLORS = ['#f5cd6a', '#b9a7f2', '#8dcfa1', '#f7b48f', '#9cc8f2', '#fbf3e6']

interface Piece { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; color: string; life: number; g: number }

interface Spray { count: number; speed: number; spread: number; colors: string[]; gravity: number; size: number }
let burstImpl: ((x: number, y: number, o?: Partial<Spray>) => void) | null = null

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

export function FxLayer() {
  const canvas = useRef<HTMLCanvasElement>(null)

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

    return () => {
      window.removeEventListener('resize', size)
      cancelAnimationFrame(raf)
      burstImpl = null
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden="true">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
