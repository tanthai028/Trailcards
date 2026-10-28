// Turns raw AI renders in art-src/raw/ (WebP or PNG) into game-ready WebP sprites in src/assets/art/.
// The generator can't output transparency, so renders are made on a flat chroma screen
// (magenta or green) that is keyed out here.
//
//   npm run art                 # process everything in ASSETS
//   npm run art -- cat          # just one
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW = path.join(root, 'art-src/raw')
const OUT = path.join(root, 'src/assets/art')

/** name → output width, and whether to key out the backdrop. */
const ASSETS = {
  // Mochi, rendered with a warm room camera and light.
  'cat': { width: 260, key: 'chroma', screen: 'green' },
}

/**
 * Chroma screen (magenta by default, or green). A pixel is "screen" when the
 * off-screen channel is tiny relative to the screen channels, and only regions
 * connected to the image border are keyed, so lavender cuffs inside a figure
 * stay opaque even when their hue is close.
 */
function keyChroma(data, w, h, screenColor = 'magenta', rimOnly = false) {
  // Thresholds measured from the generator's actual magenta backdrops:
  // green/min(red,blue) ranges 0.12–0.31 and min(red,blue) stays above ~150.
  const green = screenColor === 'green'
  // green backdrops come with a brighter lime glow, so their window is wider
  // magenta window covers the pale pink floor glow under shoes (ratio ~0.4)
  // while staying below lavender cuffs (~0.7) and pink ear insides (~0.9)
  const [rFrom, rTo] = green ? [0.5, 0.72] : [0.42, 0.58]
  const channels = (i) => {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
    return green ? { lo: g, other: Math.max(r, b) } : { lo: Math.min(r, b), other: g }
  }
  const ramp = (v, from, to) => Math.min(1, Math.max(0, (v - from) / (to - from)))
  const screen = (i) => {
    const { lo, other } = channels(i)
    if (lo < 30) return 0
    const ratio = other / lo
    const bright = (1 - ramp(ratio, rFrom, rTo)) * ramp(lo, 100, 140)
    const deepShadow = ratio < Math.min(0.12, rFrom - 0.04) ? 1 : 0
    return Math.max(bright, deepShadow)
  }
  const amount = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) amount[i] = screen(i)

  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const i = stack.pop()
    if (seen[i] || amount[i] < 0.5) continue
    seen[i] = 1
    const x = i % w
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (i >= w) stack.push(i - w)
    if (i < w * (h - 1)) stack.push(i + w)
  }

  // Second pass: enclosed gaps (between an arm and the body) aren't reachable from the
  // border. Key any enclosed blob that is unmistakably screen and bigger than a speck.
  const blob = new Uint8Array(w * h)
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || blob[start] || amount[start] < 0.85) continue
    const members = []
    const st = [start]
    blob[start] = 1
    while (st.length) {
      const i = st.pop()
      members.push(i)
      const x = i % w
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= w * h || blob[j] || seen[j] || amount[j] < 0.5) continue
        blob[j] = 1
        st.push(j)
      }
    }
    if (members.length >= 40) for (const i of members) seen[i] = 1
  }

  // Distance (in px, up to 8) from the keyed screen. The renders bounce screen-coloured
  // rim light several pixels into the figure, so the cleanup band has to be that wide.
  const ring = new Uint8Array(w * h) // 0 = keyed or far, 1..8 = px from screen
  let frontier = seen
  for (let d = 1; d <= 8; d++) {
    const next = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) {
      if (!frontier[i]) continue
      const x = i % w
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= w * h || seen[j] || ring[j]) continue
        ring[j] = d
        next[j] = 1
      }
    }
    frontier = next
  }

  for (let i = 0; i < w * h; i++) {
    let a = 1
    if (seen[i]) a = 0
    else if (ring[i] === 1) a = Math.min(1, 1 - amount[i] * 0.9) * 0.8
    if (a > 0) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
      if (green && (!rimOnly || ring[i])) {
        // nothing in a green-screened figure is meant to be green: clamp it everywhere
        // (props with real greens/brass only get their rim cleaned)
        data[i * 4 + 1] = Math.min(g, (r + b) / 2)
      } else if (ring[i]) {
        // magenta: despill only the rim band, so real pinks and plums deeper inside are untouched
        const spill = Math.max(0, Math.min(r, b) - g) * (ring[i] <= 5 ? 1 : (9 - ring[i]) / 4)
        data[i * 4] = Math.max(0, r - spill)
        data[i * 4 + 2] = Math.max(0, b - spill)
      }
    }
    data[i * 4 + 3] = Math.round(a * data[i * 4 + 3])
    // fully keyed pixels become transparent black so trim() can find the bounds
    if (data[i * 4 + 3] === 0) data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0
  }
}

/** Raw renders are kept as high-quality WebP (or PNG straight from the generator). */
function rawPath(name) {
  for (const ext of ['webp', 'png']) {
    const p = path.join(RAW, `${name}.${ext}`)
    if (fs.existsSync(p)) return p
  }
  return null
}

async function processOne(name) {
  const cfg = ASSETS[name]
  const src = rawPath(cfg.src ?? name)
  // The generator leaves a 1–2px vignette on the canvas edge; shave it off first.
  const meta = await sharp(src).metadata()
  let img = sharp(src).extract({ left: 3, top: 3, width: meta.width - 6, height: meta.height - 6 }).ensureAlpha()
  if (cfg.key) {
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
    keyChroma(data, info.width, info.height, cfg.screen, cfg.rimOnly)
    img = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  }
  const out = path.join(OUT, `${name}.webp`)
  // trim() crops away the now-transparent margin so sprites anchor at their real bounds
  const keyed = await img.png().toBuffer()
  const sized = await sharp(keyed)
    .trim({ threshold: 1 })
    .resize(cfg.height ? { height: cfg.height, withoutEnlargement: true } : { width: cfg.width, withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = sized.info
  const info = await sharp(sized.data, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 86, alphaQuality: 90 }).toFile(out)
  console.log(`${name}.webp  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`)
}

const only = process.argv.slice(2)
for (const name of Object.keys(ASSETS)) {
  if (only.length && !only.includes(name)) continue
  if (!rawPath(ASSETS[name].src ?? name)) continue
  await processOne(name)
}
