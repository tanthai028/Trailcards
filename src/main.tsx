import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import { GameProvider } from './state/store'
import { AccountProvider } from './net/account'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

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
