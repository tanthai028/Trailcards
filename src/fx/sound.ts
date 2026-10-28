// Tiny synthesized sound effects (Web Audio). No audio files: each sound is a few
// oscillators or a noise burst, so it adds almost nothing to the bundle.
// iOS only lets audio start inside a user gesture; every sound here is played from a tap,
// and the context is also resumed on the first touch anywhere.

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
    master.gain.value = 0.6
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Wake the audio context on the first touch so the first answer isn't silent.
if (typeof window !== 'undefined') {
  const wake = () => {
    audio()
    window.removeEventListener('pointerdown', wake)
  }
  window.addEventListener('pointerdown', wake)
}

/** One enveloped oscillator note. */
function tone(freq: number, { at = 0, dur = 0.3, type = 'sine' as OscillatorType, gain = 0.2, slideTo }: { at?: number; dur?: number; type?: OscillatorType; gain?: number; slideTo?: number } = {}) {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime + at
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(env).connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

/** Right answer: a bright two-note chime that climbs a semitone per answer in the streak. */
export function playCorrect(streak = 1) {
  const step = Math.min(Math.max(streak - 1, 0), 12)
  const base = 660 * 2 ** (step / 12)
  tone(base, { dur: 0.32, gain: 0.16 })
  tone(base * 1.5, { at: 0.07, dur: 0.38, gain: 0.12 })
  tone(base * 3, { at: 0.07, dur: 0.18, type: 'triangle', gain: 0.03 })
}

/** Wrong answer: a soft low thud, not a buzzer. */
export function playWrong() {
  tone(170, { dur: 0.22, gain: 0.22, slideTo: 80 })
  tone(120, { at: 0.02, dur: 0.18, type: 'triangle', gain: 0.06, slideTo: 70 })
}

/** A coin landing in the counter. */
export function playCoin(i = 0) {
  tone(1320 + i * 60, { dur: 0.09, type: 'triangle', gain: 0.07, slideTo: 1760 + i * 60 })
}

/** Moving to another card: a very quiet airy swish. */
export function playSwipe() {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime
  const len = Math.floor(c.sampleRate * 0.2)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const band = c.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = 0.8
  band.frequency.setValueAtTime(500, t)
  band.frequency.exponentialRampToValueAtTime(1800, t + 0.18)
  const env = c.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(0.05, t + 0.04)
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
  src.connect(band).connect(env).connect(master)
  src.start(t)
  src.stop(t + 0.22)
}

/** Level up: a quick rising four-note fanfare with a shimmer on top. */
export function playLevelUp() {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) => {
    tone(f, { at: i * 0.09, dur: 0.4, gain: 0.14 })
    tone(f * 2, { at: i * 0.09, dur: 0.22, type: 'triangle', gain: 0.03 })
  })
  tone(1046.5, { at: 0.36, dur: 0.9, gain: 0.1 })
  tone(1567.98, { at: 0.42, dur: 0.8, gain: 0.06 })
}

/** Unlocking something: a short sparkly rise. */
export function playUnlock() {
  ;[880, 1108.73, 1318.51, 1760].forEach((f, i) => tone(f, { at: i * 0.055, dur: 0.28, type: 'triangle', gain: 0.07 }))
  tone(659.25, { dur: 0.5, gain: 0.08 })
}

/** Achievement toast: two soft bells. */
export function playAchievement() {
  tone(987.77, { dur: 0.5, gain: 0.08 })
  tone(1318.51, { at: 0.12, dur: 0.6, gain: 0.07 })
}
