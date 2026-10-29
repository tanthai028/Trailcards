// Haptic taps. Android: the Vibration API. iPhone: Safari has no vibration API, but toggling a
// native switch (<input type="checkbox" switch>, iOS 18+) plays the system tick, so a hidden
// one is toggled from inside the tap. The first tick has to run right inside the tap itself:
// Safari drops it if it comes from a timer. Elsewhere this does nothing.

export type Haptic = 'light' | 'success' | 'error' | 'heavy'

let enabled = true
export function setHapticsEnabled(on: boolean) {
  enabled = on
}

const PATTERN: Record<Haptic, number | number[]> = { light: 8, success: [10, 50, 16], error: [24, 60, 24, 60, 24], heavy: 28 }
// iPhone taps per kind, and the gap between them
const TICKS: Record<Haptic, number> = { light: 1, success: 2, error: 3, heavy: 1 }

// A fresh switch inside its label for every tick, clicked and removed, the way that's known to
// reach the iOS haptic engine (a reused, off-screen one can go quiet).
function iosTick() {
  const label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.head.appendChild(label)
  label.click()
  label.remove()
}

export function haptic(kind: Haptic) {
  if (!enabled || typeof navigator === 'undefined') return
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(PATTERN[kind])
    return
  }
  iosTick()
  for (let i = 1; i < TICKS[kind]; i++) setTimeout(iosTick, i * 90)
}
