import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from './state/store'
import { Hud } from './components/Hud'
import { NavBar, type Tab } from './components/NavBar'
import { affordable } from './state/game'
import { EventLayer } from './components/EventLayer'
import { InstallHint, shouldShowInstallHint } from './components/InstallHint'
import { Onboarding } from './components/Onboarding'
import { FeedScreen, type FeedMode } from './screens/FeedScreen'
import { ClosetScreen } from './screens/ClosetScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ProfileScreen } from './screens/ProfileScreen'

const TABS: Tab[] = ['feed', 'closet', 'van', 'profile']
const readHash = (): Tab => {
  const h = location.hash.replace('#', '') as Tab
  return TABS.includes(h) ? h : 'feed'
}

export default function App() {
  const { state } = useGame()
  const [tab, setTab] = useState<Tab>(readHash)
  const [feedMode, setFeedMode] = useState<FeedMode>('discover')
  // Learn hides its header and the nav while you swipe forward through cards.
  const [immersive, setImmersive] = useState(false)
  useEffect(() => setImmersive(false), [tab])

  useEffect(() => {
    const onHash = () => setTab(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (t: Tab, mode?: FeedMode) => {
    if (mode) setFeedMode(mode)
    history.replaceState(null, '', `#${t}`)
    setTab(t)
  }

  return (
    <div className="mx-auto flex h-dvh max-w-[480px] flex-col sm:py-3">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-ink/40 sm:rounded-[34px] sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,.6)] sm:ring-1 sm:ring-white/10">
        {tab !== 'feed' && <Hud onProfile={() => go('profile')} />}
        <main className="relative min-h-0 flex-1" style={{ paddingBottom: immersive ? 'env(safe-area-inset-bottom)' : 0 }}>
          {/* Enter-only transition: an exit + mode="wait" could stall and leave the tab blank. */}
            <motion.div
              key={tab}
              className="absolute inset-0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {tab === 'feed' && <FeedScreen mode={feedMode} setMode={setFeedMode} go={go} immersive={immersive} setImmersive={setImmersive} />}
              {tab === 'closet' && <ClosetScreen />}
              {tab === 'van' && <HomeScreen go={go} />}
              {tab === 'profile' && <ProfileScreen go={go} />}
            </motion.div>
        </main>
        {/* grid-rows 1fr -> 0fr collapses the nav smoothly without measuring its height */}
        <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: immersive ? '0fr' : '1fr' }}>
          <div className="min-h-0 overflow-hidden">
            <NavBar tab={tab} onTab={(t) => go(t)} dots={affordable(state)} />
          </div>
        </div>
        <AnimatePresence>{state.onboarded && !immersive && shouldShowInstallHint(state.tips) && <InstallHint />}</AnimatePresence>
        <EventLayer go={go} />
        <AnimatePresence>{!state.onboarded && <Onboarding />}</AnimatePresence>
      </div>
    </div>
  )
}
