// Haptic taps. Android: the Vibration API. iPhone: Safari has no vibration API, but toggling a
// native switch (<input type="checkbox" switch>, iOS 18+) plays the system tick, so a hidden
// one is toggled from inside the tap. Elsewhere this does nothing.

export type Haptic = 'light' | 'success' | 'error' | 'heavy'

let enabled = true
export function setHapticsEnabled(on: boolean) {
  enabled = on
}

const PATTERN: Record<Haptic, number | number[]> = { light: 8, success: [10, 50, 16], error: [24, 60, 24, 60, 24], heavy: 28 }
// iPhone taps per kind, and the gap between them
const TICKS: Record<Haptic, number> = { light: 1, success: 2, error: 3, heavy: 1 }

let label: HTMLLabelElement | null = null
function iosTick() {
  if (!label) {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = 'cq-haptic'
    input.setAttribute('switch', '')
    label = document.createElement('label')
    label.htmlFor = input.id
    for (const el of [input, label]) {
      el.setAttribute('aria-hidden', 'true')
      el.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none'
      document.body.appendChild(el)
    }
  }
  label.click()
}

export function haptic(kind: Haptic) {
  if (!enabled || typeof navigator === 'undefined') return
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(PATTERN[kind])
    return
  }
  for (let i = 0; i < TICKS[kind]; i++) setTimeout(iosTick, i * 90)
}
