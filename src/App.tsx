import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useGame } from './state/store'
import { NavBar, type Tab } from './components/NavBar'
import { reviewQueue } from './state/game'
import { EventLayer } from './components/EventLayer'
import { InstallHint, shouldShowInstallHint } from './components/InstallHint'
import { FxLayer } from './fx/FxLayer'
import { setSoundEnabled } from './fx/sound'
import { setHapticsEnabled } from './fx/haptics'
import { FeedScreen, type FeedMode } from './screens/FeedScreen'
import { JoinSheet } from './components/JoinSheet'

// Learn ships in the main bundle; the other tabs and onboarding load on demand, and are
// fetched in the background right after the first paint so switching tabs never waits.
const loadProfile = () => import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen }))
const loadGroup = () => import('./screens/GroupScreen').then((m) => ({ default: m.GroupScreen }))
const loadOnboarding = () => import('./components/Onboarding').then((m) => ({ default: m.Onboarding }))
const ProfileScreen = lazy(loadProfile)
const GroupScreen = lazy(loadGroup)
const Onboarding = lazy(loadOnboarding)

const TABS: Tab[] = ['feed', 'review', 'group', 'profile']
const readHash = (): Tab => {
  const h = location.hash.replace('#', '')
  // Explore and Ranks were merged into the Friends tab; old links still land there
  if (h === 'explore' || h === 'ranks') return 'group'
  return TABS.includes(h as Tab) ? (h as Tab) : 'feed'
}

export default function App() {
  const { state } = useGame()
  const [tab, setTab] = useState<Tab>(readHash)
  const [feedMode, setFeedMode] = useState<FeedMode>('discover')
  // sign-in chosen during onboarding
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { loadGroup(); loadProfile() }, 1200)
    return () => clearTimeout(t)
  }, [])

  // The app's own switch, on top of the phone's setting; the pager and CSS read the attribute.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduce-motion', state.reduceMotion)
  }, [state.reduceMotion])
  useEffect(() => setSoundEnabled(state.sound), [state.sound])
  useEffect(() => setHapticsEnabled(state.haptics), [state.haptics])

  useEffect(() => {
    const onHash = () => setTab(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Review has its own tab; Learn shows Study, or your Saved cards when you open them from Profile
  const go = (t: Tab, mode?: FeedMode) => {
    if (mode === 'review') t = 'review'
    else if (mode) setFeedMode(mode)
    history.replaceState(null, '', `#${t}`)
    setTab(t)
  }
  const setMode = (m: FeedMode) => go(m === 'review' ? 'review' : 'feed', m)

  return (
    <MotionConfig reducedMotion={state.reduceMotion ? 'always' : 'user'}>
    {/* fixed inset-0 fills the whole screen in iOS standalone, where 100dvh can leave a gap at the bottom */}
    <div className="fixed inset-0 mx-auto flex max-w-[480px] flex-col sm:py-3">
      {/* one top inset for every tab, so nothing shifts when you switch; the extra 20px clears the blur iOS puts under the status bar */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-ink pt-[calc(env(safe-area-inset-top)+20px)] sm:rounded-[34px]">
        <main className="relative min-h-0 flex-1">
          {/* Enter-only transition: an exit + mode="wait" could stall and leave the tab blank. */}
            <motion.div
              key={tab}
              className="absolute inset-0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {tab === 'feed' && <FeedScreen mode={feedMode} setMode={setMode} go={go} />}
              {tab === 'review' && <FeedScreen mode="review" setMode={setMode} go={go} />}
              <Suspense fallback={null}>
                {tab === 'group' && <GroupScreen go={go} />}
                {tab === 'profile' && <ProfileScreen go={go} />}
              </Suspense>
            </motion.div>
        </main>
        <NavBar tab={tab} onTab={(t) => go(t, t === 'feed' ? 'discover' : undefined)} due={reviewQueue(state).length} />
        <AnimatePresence>{state.onboarded && shouldShowInstallHint(state.tips) && <InstallHint />}</AnimatePresence>
        <EventLayer />
        <FxLayer />
        <Suspense fallback={null}>
          <AnimatePresence>{!state.onboarded && <Onboarding onSignIn={() => setJoining(true)} />}</AnimatePresence>
          <AnimatePresence>{joining && <JoinSheet onClose={() => setJoining(false)} />}</AnimatePresence>
        </Suspense>
      </div>
    </div>
    </MotionConfig>
  )
}
