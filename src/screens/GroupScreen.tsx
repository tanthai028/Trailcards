// The Friends tab, your study group: the leaderboard and the decks friends shared, behind one sign-in.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAccount } from '../net/account'
import { JoinPrompt, JoinSheet } from '../components/JoinSheet'
import type { Tab } from '../components/NavBar'
import { RanksScreen } from './RanksScreen'
import { ExploreScreen } from './ExploreScreen'

type Part = 'ranks' | 'decks'
const PARTS: [Part, string][] = [['ranks', 'Leaderboard'], ['decks', 'Shared decks']]

export function GroupScreen({ go }: { go: (t: Tab) => void }) {
  const { status } = useAccount()
  const [part, setPart] = useState<Part>('ranks')
  const [joining, setJoining] = useState(false)
  const member = status === 'member'

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 px-4">
        <h1 className="font-display text-3xl font-bold">Friends</h1>
        {member && (
          <div role="tablist" aria-label="Friends" className="flex rounded-full clay p-1">
            {PARTS.map(([p, label]) => (
              <button key={p} role="tab" aria-selected={part === p} onClick={() => setPart(p)}
                className={`relative min-h-8 rounded-full px-3 text-xs font-extrabold ${part === p ? 'text-ink' : 'text-cream/60'}`}>
                {part === p && <motion.span layoutId="group-part" className="absolute inset-0 rounded-full bg-cream" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1">
        {!member ? (
          <div className="px-4">
            <JoinPrompt what="your group's leaderboard and the decks friends share" onJoin={() => setJoining(true)} />
          </div>
        ) : part === 'ranks' ? <RanksScreen /> : <ExploreScreen go={go} />}
      </div>
      <AnimatePresence>{joining && <JoinSheet onClose={() => setJoining(false)} />}</AnimatePresence>
    </div>
  )
}
