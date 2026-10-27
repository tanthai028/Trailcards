import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import { GameProvider } from './state/store'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <GameProvider>
        <App />
      </GameProvider>
    </MotionConfig>
  </StrictMode>,
)
