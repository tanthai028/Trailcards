// Turns raw AI renders in art-src/raw/ (WebP or PNG) into game-ready WebP sprites in src/assets/art/.
// The generator can't output transparency, so we key out the flat studio backdrop:
// flood-fill from the image border through low-saturation pixels near the backdrop
// color, and turn darker backdrop pixels (contact shadows) into soft black alpha.
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
  // Room props are rendered at the room's high three-quarter camera with warm light.
  'cat': { width: 260, key: 'chroma', screen: 'green' },
  'acc-glasses': { width: 320, key: 'chroma' },
  'acc-hat': { width: 360, key: 'chroma' },
  'acc-clip': { width: 120, key: 'chroma' },
  'acc-headphones': { width: 340, key: 'chroma', screen: 'green' },
  // Figurines: body × hairstyle × outfit. Analysed for hair masks + face anchors.
  // Extras are baked into their own renders ('' = none): body × hair × outfit × extra.
  ...Object.fromEntries(
    [['girl', 'bob'], ['girl', 'ponytail'], ['guy', 'crop'], ['guy', 'wolf']].flatMap(([body, hair]) =>
      ['trailhead', 'courier', 'tidecaller', 'keeper', 'starlit', 'nocturne'].flatMap((outfit) =>
        ['', '-glasses', '-clip', '-headphones', '-hat'].map((extra) => [
          `fig-${body}-${hair}-${outfit}${extra}`,
          // plum velvet matches magenta's hue, so the Nocturne renders use a green screen
          { height: 720, key: 'chroma', figurine: true, ...(outfit === 'nocturne' ? { screen: 'green' } : {}) },
        ]),
      ),
    ),
  ),
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

function keyBackdrop(data, w, h) {
  const px = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]
  const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b
  const sat = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b)

  // Backdrop color = median-ish of border samples.
  const border = []
  for (let x = 0; x < w; x += 8) border.push(px(x), px((h - 1) * w + x))
  for (let y = 0; y < h; y += 8) border.push(px(y * w), px(y * w + w - 1))
  const bgL = border.map(lum).sort((a, b) => a - b)[border.length >> 1]

  const isBackdrop = (i) => {
    const p = px(i)
    const l = lum(p)
    return sat(p) <= 16 && l <= bgL + 40 && l >= bgL - 90 // studio floor glows lighter than the border sample
  }

  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const i = stack.pop()
    if (seen[i] || !isBackdrop(i)) continue
    seen[i] = 1
    const x = i % w
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (i >= w) stack.push(i - w)
    if (i < w * (h - 1)) stack.push(i + w)
  }

  for (let i = 0; i < w * h; i++) {
    if (!seen[i]) continue
    const shadow = Math.min(0.6, Math.max(0, ((bgL - lum(px(i))) / bgL) * 2.4))
    data[i * 4] = 24
    data[i * 4 + 1] = 20
    data[i * 4 + 2] = 48
    data[i * 4 + 3] = Math.round(shadow * 255)
  }
  // Soften the 1px fringe where the object meets the keyed backdrop.
  for (let i = w; i < w * (h - 1); i++) {
    if (seen[i]) continue
    const n = seen[i - 1] + seen[i + 1] + seen[i - w] + seen[i + w]
    if (n >= 2) data[i * 4 + 3] = Math.round(data[i * 4 + 3] * (n >= 3 ? 0.45 : 0.75))
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
    if (cfg.key === 'chroma') keyChroma(data, info.width, info.height, cfg.screen, cfg.rimOnly)
    else keyBackdrop(data, info.width, info.height)
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
  if (cfg.figurine) await analyseFigurine(name, sized.data, w, h)
}

// ── Figurine analysis: hair mask (for runtime recolouring) + face/hair anchors ──
const ANCHORS = path.join(OUT, 'anchors.json')
const anchors = fs.existsSync(ANCHORS) ? JSON.parse(fs.readFileSync(ANCHORS, 'utf8')) : {}

function components(w, h, test, region) {
  // label connected regions of pixels passing `test`, limited to region [x0,y0,x1,y1]
  const [rx0, ry0, rx1, ry1] = region
  const label = new Int32Array(w * h).fill(-1)
  const comps = []
  for (let y = ry0; y < ry1; y++) for (let x = rx0; x < rx1; x++) {
    const i = y * w + x
    if (label[i] !== -1 || !test(i)) continue
    const c = { px: [], x0: x, y0: y, x1: x, y1: y }
    const st = [i]
    label[i] = comps.length
    while (st.length) {
      const j = st.pop()
      c.px.push(j)
      const jx = j % w, jy = (j / w) | 0
      if (jx < c.x0) c.x0 = jx; if (jx > c.x1) c.x1 = jx
      if (jy < c.y0) c.y0 = jy; if (jy > c.y1) c.y1 = jy
      for (const k of [jx > rx0 ? j - 1 : -1, jx < rx1 - 1 ? j + 1 : -1, jy > ry0 ? j - w : -1, jy < ry1 - 1 ? j + w : -1]) {
        if (k < 0 || label[k] !== -1 || !test(k)) continue
        label[k] = comps.length
        st.push(k)
      }
    }
    comps.push(c)
  }
  return comps.sort((a, b) => b.px.length - a.px.length)
}

async function analyseFigurine(name, data, w, h) {
  const rgb = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]]
  // Face: the biggest skin-tone region in the top half.
  const skin = (i) => {
    const [r, g, b, a] = rgb(i)
    return a > 200 && r > 180 && g > 135 && b > 110 && r >= g && g >= b - 12 && r - b > 18 && r - b < 110
  }
  const face = components(w, h, skin, [0, 0, w, Math.round(h * 0.5)])[0]
  if (!face) return console.warn(`  ! ${name}: no face found`)
  const faceH = face.y1 - face.y0

  // Hair: dark indigo, connected to the top of the head. Stops a little below the chin
  // for long styles so navy collars further down aren't swept in.
  const hsv = (i) => {
    const [r, g, b, a] = rgb(i)
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const d = max - min
    let hue = 0
    if (d) {
      if (max === b) hue = 60 * ((r - g) / d) + 240
      else if (max === g) hue = 60 * ((b - r) / d) + 120
      else hue = (60 * ((g - b) / d) + 360) % 360
    }
    return { a, v: max / 255, sat: max ? d / max : 0, hue }
  }
  // Below just under the chin only the strict indigo test applies: near-black outlines there
  // would bridge the hair into navy cloaks and collars.
  const cleanBottom = Math.min(h - 1, Math.round(face.y1 + faceH * 0.15))
  const hairy = (i) => {
    const { a, v, sat, hue } = hsv(i)
    if (a < 120 || v > 0.74) return false
    if (v < 0.24 && ((i / w) | 0) > cleanBottom) return false
    // Deep shadows (under the bangs, at the tips) are near-black and barely saturated, so
    // the hue test alone missed them and they stayed navy after recolouring.
    if (v < 0.24) return sat < 0.3 || (hue >= 200 && hue <= 290)
    return sat >= 0.14 && hue >= 205 && hue <= 255 // stops short of lavender (headphone cups, cuffs)
  }
  // The eyes and brows are dark purple too: nothing below the forehead line, inside the face, is hair.
  const fx0 = face.x0 + (face.x1 - face.x0) * 0.06, fx1 = face.x1 - (face.x1 - face.x0) * 0.06
  const fyTop = face.y0 + faceH * 0.3
  const inFace = (i) => { const x = i % w, y = (i / w) | 0; return x > fx0 && x < fx1 && y > fyTop && y < face.y1 }
  // Pixels the hair can grow into in a clean-up pass: dark or indigo-ish, never skin or face.
  const hairEdge = (i) => {
    const { a, v, sat, hue } = hsv(i)
    if (a < 60 || skin(i) || inFace(i)) return false
    return v < 0.45 || (hue >= 195 && hue <= 290 && sat > 0.08 && v < 0.85)
  }
  // Hats and headphones split the hair into pieces, and ponytails hang well below the
  // chin, so keep every indigo region that *starts* above the chin. Navy collars and
  // cloaks start below it, which keeps them out.
  const limit = Math.min(h, Math.round(face.y1 + faceH * 1.7))
  const hairComps = components(w, h, hairy, [0, 0, w, limit]).filter((c) => c.y0 < face.y1 - faceH * 0.1)
  const mask = Buffer.alloc(w * h)
  let hb = null
  for (const c of hairComps) {
    if (c.px.length < 200) continue
    for (const i of c.px) if (!inFace(i)) mask[i] = 255
    hb = hb ? [Math.min(hb[0], c.x0), Math.min(hb[1], c.y0), Math.max(hb[2], c.x1), Math.max(hb[3], c.y1)] : [c.x0, c.y0, c.x1, c.y1]
  }
  if (!hb) return console.warn(`  ! ${name}: no hair found`)
  // Clean-up: grow into neighbouring outline/shadow pixels (a few passes), then fill
  // enclosed holes (highlight streaks, specks) so the recolour has no navy islands.
  // Clean-up also stays above cleanBottom, so it never spreads into navy collars and cloaks.
  const [bx0, by0, bx1, by1] = [Math.max(0, hb[0] - 3), Math.max(0, hb[1] - 3), Math.min(w - 1, hb[2] + 3), Math.min(cleanBottom, hb[3] + 3)]
  for (let pass = 0; pass < 14; pass++) {
    const grow = []
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const i = y * w + x
      if (mask[i] || !hairEdge(i)) continue
      if ((x > 0 && mask[i - 1]) || (x < w - 1 && mask[i + 1]) || (y > 0 && mask[i - w]) || (y < h - 1 && mask[i + w])) grow.push(i)
    }
    for (const i of grow) mask[i] = 255
  }
  {
    const outside = new Uint8Array(w * h)
    const st = []
    for (let x = bx0; x <= bx1; x++) st.push(by0 * w + x, by1 * w + x)
    for (let y = by0; y <= by1; y++) st.push(y * w + bx0, y * w + bx1)
    while (st.length) {
      const i = st.pop()
      if (outside[i] || mask[i]) continue
      outside[i] = 1
      const x = i % w, y = (i / w) | 0
      if (x > bx0) st.push(i - 1)
      if (x < bx1) st.push(i + 1)
      if (y > by0) st.push(i - w)
      if (y < by1) st.push(i + w)
    }
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const i = y * w + x
      if (!mask[i] && !outside[i] && !skin(i) && !inFace(i) && rgb(i)[3] > 60) mask[i] = 255
    }
  }
  // soften the mask edge a touch so recoloured hair blends into its outline
  await sharp(mask, { raw: { width: w, height: h, channels: 1 } }).blur(0.8).webp({ quality: 80 }).toFile(path.join(OUT, `${name}-hair.webp`))

  const n = (v, total) => +(v / total).toFixed(4)
  anchors[name] = {
    face: [n(face.x0, w), n(face.y0, h), n(face.x1, w), n(face.y1, h)],
    hair: [n(hb[0], w), n(hb[1], h), n(hb[2], w), n(hb[3], h)],
    aspect: +(w / h).toFixed(4),
  }
}

const only = process.argv.slice(2)
for (const name of Object.keys(ASSETS)) {
  if (only.length && !only.includes(name)) continue
  if (!rawPath(ASSETS[name].src ?? name)) continue
  await processOne(name)
}
fs.writeFileSync(ANCHORS, JSON.stringify(anchors, null, 1))
