// Last line of defence: if anything throws while rendering, show a recovery screen instead
// of a blank page. It sits outside the game state (and uses no game code), so it still works
// when loading the save is what failed.
import { Component, type ErrorInfo, type ReactNode } from 'react'

const KEY = 'wayfarer.save.v1'
/** Where a reset keeps the save it replaced, so nothing is lost for good. */
const BROKEN_KEY = 'wayfarer.save.broken'

interface State { error: Error | null; confirming: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, confirming: false }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Wayfarer crashed:', error, info.componentStack)
  }

  /** Save the stored data exactly as it is, without trying to read it. */
  download = () => {
    let raw = ''
    try {
      raw = localStorage.getItem(KEY) ?? ''
    } catch {
      /* storage blocked */
    }
    const blob = new Blob([raw || '{}'], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `wayfarer-save-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  reset = () => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) localStorage.setItem(BROKEN_KEY, raw)
      localStorage.removeItem(KEY)
    } catch {
      /* storage blocked */
    }
    location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    const btn = 'min-h-12 w-full rounded-2xl px-4 text-[15px] font-extrabold'
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#221a33] p-6 text-[#fbf3e6]" role="alert">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#fbf3e6]/70">
            Wayfarer hit an error and couldn’t open. Your progress is still saved on this device. Try again, or download a copy of your save before resetting.
          </p>
          <div className="mt-6 space-y-2">
            <button onClick={() => location.reload()} className={`${btn} bg-[#f5cd6a] text-[#3a2a12]`}>Try again</button>
            <button onClick={this.download} className={`${btn} bg-white/10`}>Download my save</button>
            {this.state.confirming ? (
              <div className="rounded-2xl bg-[#f08a80]/15 p-3 ring-1 ring-[#f08a80]/40">
                <p className="text-sm font-bold">Start over with a fresh save? A copy of the current one is kept on this device.</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => this.setState({ confirming: false })} className="min-h-11 flex-1 rounded-xl bg-white/10 text-sm font-extrabold">Cancel</button>
                  <button onClick={this.reset} className="min-h-11 flex-1 rounded-xl bg-[#f08a80] text-sm font-extrabold text-[#221a33]">Reset</button>
                </div>
              </div>
            ) : (
              <button onClick={() => this.setState({ confirming: true })} className={`${btn} text-[#fbf3e6]/60`}>Reset and start over</button>
            )}
          </div>
          <p className="mt-6 break-words text-[11px] text-[#fbf3e6]/35">{this.state.error.message}</p>
        </div>
      </div>
    )
  }
}
