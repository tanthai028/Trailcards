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
 * Moving to another card: a soft card flick. A short, low wooden thock for the card landing and
 * a faint papery tick on top, nudged a little in pitch each time so a run of swipes doesn't
 * sound like the same sample on repeat. (A filtered-noise whoosh sounded cheap.)
 */
export function playSwipe() {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime
  const vary = 2 ** ((Math.random() - 0.5) / 12)
  tone(210 * vary, { dur: 0.11, gain: 0.08, slideTo: 150 * vary, attack: 0.004 })
  tone(630 * vary, { dur: 0.045, type: 'triangle', gain: 0.018, attack: 0.002 })
  // the tick: 20ms of noise, kept to the papery middle-high band
  const len = Math.floor(c.sampleRate * 0.02)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const band = c.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 3200
  band.Q.value = 1.2
  const env = c.createGain()
  env.gain.value = 0.035
  src.connect(band).connect(env).connect(master)
  src.start(t)
  src.stop(t + 0.03)
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
