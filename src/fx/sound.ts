// Tiny synthesized sound effects (Web Audio). No audio files: each sound is a few
// oscillators or a noise burst through a soft echo, so it adds almost nothing to the bundle.
// iOS only lets audio start inside a tap, and mutes web audio when the phone's ring/silent
// switch is on silent; haptics (haptics.ts) carry the feedback then.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

function audio() {
  if (!enabled) return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.7
    master.connect(ctx.destination)
    // a short, dark echo makes the chimes ring a little instead of stopping dead
    const echo = ctx.createDelay(0.5)
    echo.delayTime.value = 0.13
    const feedback = ctx.createGain()
    feedback.gain.value = 0.28
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 2600
    const wet = ctx.createGain()
    wet.gain.value = 0.22
    master.connect(echo).connect(tone).connect(feedback).connect(echo)
    tone.connect(wet).connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Wake audio on taps until it's actually running (iOS ignores the first touch-down).
if (typeof window !== 'undefined') {
  const wake = () => {
    const c = audio()
    if (c?.state === 'running') for (const e of ['pointerup', 'touchend', 'keydown'] as const) window.removeEventListener(e, wake)
  }
  for (const e of ['pointerup', 'touchend', 'keydown'] as const) window.addEventListener(e, wake, { passive: true })
}

/** One enveloped oscillator note. */
function tone(freq: number, { at = 0, dur = 0.3, type = 'sine' as OscillatorType, gain = 0.2, slideTo, attack = 0.008 }: { at?: number; dur?: number; type?: OscillatorType; gain?: number; slideTo?: number; attack?: number } = {}) {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime + at
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(env).connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

/** A mallet note: a round body, a bright overtone that fades fast, and a soft knock. */
function mallet(freq: number, at = 0, gain = 0.16) {
  tone(freq, { at, dur: 0.55, gain })
  tone(freq * 4, { at, dur: 0.09, type: 'triangle', gain: gain * 0.25 })
  tone(freq * 2, { at, dur: 0.25, gain: gain * 0.3 })
}

/** Right answer: a quick rising arpeggio that climbs a semitone per answer in the streak, with sparkles on a long run. */
export function playCorrect(streak = 1) {
  const step = Math.min(Math.max(streak - 1, 0), 12)
  const base = 523.25 * 2 ** (step / 12)
  mallet(base, 0, 0.15)
  mallet(base * 1.25, 0.055, 0.13)
  mallet(base * 1.5, 0.11, 0.14)
  if (streak >= 5) [2, 2.5, 3].forEach((m, i) => tone(base * m, { at: 0.18 + i * 0.05, dur: 0.22, type: 'triangle', gain: 0.035 }))
}

/** Wrong answer: two soft falling notes, gentle rather than a buzzer. */
export function playWrong() {
  tone(311.13, { dur: 0.18, type: 'triangle', gain: 0.12, slideTo: 293.66 })
  tone(246.94, { at: 0.12, dur: 0.32, type: 'triangle', gain: 0.12, slideTo: 233.08 })
  tone(110, { dur: 0.16, gain: 0.12, slideTo: 70 })
}

/** A light chime: a recall card rated "Partly", or taking an answer back. */
export function playChime(i = 0) {
  mallet(880 + i * 60, 0, 0.09)
}

/**
 * A card sliding off the deck: grainy high noise that rises and fades (the paper sliding,
 * its grain a little rough so it crinkles rather than hisses), then a crisp snap as it lands.
 * Each one is a little different. Built on any context, so it can also be rendered offline.
 */
export function cardFlick(c: BaseAudioContext, out: AudioNode, t: number, level = 1) {
  const sr = c.sampleRate
  const slide = 0.11
  const len = Math.floor(sr * (slide + 0.03))
  const buf = c.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)
  const snapAt = Math.floor(sr * slide)
  let grain = 1
  for (let i = 0; i < len; i++) {
    // the crinkle: loudness jumps every couple of milliseconds
    if (i % Math.floor(sr * 0.0018) === 0) grain = 0.45 + Math.random() * 0.55
    const n = Math.random() * 2 - 1
    if (i < snapAt) {
      const p = i / snapAt
      data[i] = n * grain * Math.sin(Math.PI * p ** 0.7) * 0.55
    } else {
      // the snap: a short, sharp burst
      const k = (i - snapAt) / (sr * 0.006)
      data[i] = n * Math.exp(-k)
    }
  }
  const src = c.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = 0.94 + Math.random() * 0.12
  // paper lives up high: no rumble under it, and the top softened so it isn't fizzy
  const low = c.createBiquadFilter()
  low.type = 'highpass'
  low.frequency.value = 1400
  const top = c.createBiquadFilter()
  top.type = 'lowpass'
  top.frequency.value = 7500
  const peak = c.createBiquadFilter()
  peak.type = 'peaking'
  peak.frequency.value = 3800
  peak.gain.value = 4
  const env = c.createGain()
  env.gain.value = 0.11 * level
  src.connect(low).connect(top).connect(peak).connect(env).connect(out)
  src.start(t)
}

/** Moving to another card: a card or page being flicked. Dry, no echo: paper doesn't ring. */
export function playSwipe() {
  const c = audio()
  if (!c) return
  cardFlick(c, c.destination, c.currentTime, 0.7)
}

/** Level up: a rising fanfare that lands on a ringing chord. */
export function playLevelUp() {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => mallet(f, i * 0.085, 0.13))
  ;[1046.5, 1318.51, 1567.98].forEach((f, i) => tone(f, { at: 0.36 + i * 0.02, dur: 1.1, gain: 0.07, attack: 0.03 }))
}

/** Achievement or streak toast: two bells. */
export function playAchievement() {
  mallet(987.77, 0, 0.1)
  mallet(1318.51, 0.12, 0.1)
}
