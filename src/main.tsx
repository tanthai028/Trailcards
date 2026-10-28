import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import { GameProvider } from './state/store'
import { AccountProvider } from './net/account'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

// The app never zooms: Safari ignores user-scalable=no for pinches, so cancel its pinch gesture,
// and stop double-tap zoom (touch-action in index.css covers most browsers).
for (const e of ['gesturestart', 'gesturechange'] as const) document.addEventListener(e, (ev) => ev.preventDefault(), { passive: false })
document.addEventListener('dblclick', (ev) => ev.preventDefault(), { passive: false })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* outermost, so a crash while loading the save still shows the recovery screen */}
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <GameProvider>
          <AccountProvider>
            <App />
          </AccountProvider>
        </GameProvider>
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>,
)
