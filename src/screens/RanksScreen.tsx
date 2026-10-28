// The group leaderboard: XP this week (resets Monday) or all time.
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAccount, type Member } from '../net/account'
import { errorText } from '../net/client'
import { cleanAvatar, cleanFrame } from '../state/sanitize'
import { ProfilePic } from '../components/ProfilePic'
import { JoinPrompt, JoinSheet } from '../components/JoinSheet'
import { Icon } from '../components/Icon'

type Period = 'week' | 'all'
type Row = Pick<Member, 'name' | 'title' | 'avatar' | 'photo_url'> & { user_id: string; xp: number }

const MEDALS = ['#f5cd6a', '#d9dbe6', '#e3a77a']

export function RanksScreen() {
  const { status, client, me } = useAccount()
  const [period, setPeriod] = useState<Period>('week')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const load = useCallback(async () => {
    if (!client || status !== 'member') return
    setError(null)
    const { data, error } = await client.rpc('leaderboard', { period })
    if (error) setError(errorText(error))
    else setRows(data as Row[])
  }, [client, status, period])

  useEffect(() => { setRows(null); void load() }, [load])
  // fresh numbers when you come back to the app
  useEffect(() => {
    const onShow = () => document.visibilityState === 'visible' && void load()
    document.addEventListener('visibilitychange', onShow)
    return () => document.removeEventListener('visibilitychange', onShow)
  }, [load])

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain px-4 pb-8">
      <div className="mb-4 flex items-end justify-between">
        <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
        {status === 'member' && (
          <div role="tablist" aria-label="Period" className="flex rounded-full clay p-1">
            {([['week', 'This week'], ['all', 'All time']] as [Period, string][]).map(([p, label]) => (
              <button key={p} role="tab" aria-selected={period === p} onClick={() => setPeriod(p)}
                className={`relative min-h-8 rounded-full px-3 text-xs font-extrabold ${period === p ? 'text-ink' : 'text-cream/60'}`}>
                {period === p && <motion.span layoutId="ranks-period" className="absolute inset-0 rounded-full bg-cream" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {status !== 'member' ? (
        <JoinPrompt what="how you rank against your friends" onJoin={() => setJoining(true)} />
      ) : error ? (
        <div className="clay rounded-3xl p-5 text-center">
          <p className="text-sm text-cream/70">{error}</p>
          <button onClick={() => void load()} className="clay-btn clay-cream mt-3 min-h-11 px-5 text-sm">Try again</button>
        </div>
      ) : !rows ? (
        <ul className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <li key={i} className="clay h-16 animate-pulse rounded-2xl" />)}</ul>
      ) : (
        <>
          {period === 'week' && <p className="mb-3 text-xs font-bold text-cream/50">XP earned since Monday. Resets every week.</p>}
          <ol className="space-y-2">
            {rows.map((r, i) => {
              const mine = r.user_id === me?.id
              return (
                <li key={r.user_id} className={`flex items-center gap-3 rounded-2xl p-2.5 pr-4 ${mine ? 'bg-gold/15 ring-1 ring-gold/40' : 'clay'}`}>
                  <span className="grid w-7 shrink-0 place-items-center font-display text-lg font-bold tabular-nums" style={{ color: MEDALS[i] }}>
                    {i < 3 && r.xp > 0 ? <Icon name="crown" size={18} /> : i + 1}
                  </span>
                  <ProfilePic avatar={cleanAvatar(r.avatar?.icon)} frame={cleanFrame(r.avatar?.frame)} photo={r.photo_url} className="size-11" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-extrabold">{r.name}{mine && <span className="text-cream/50"> (you)</span>}</span>
                    {r.title && <span className="block truncate text-xs font-bold text-gold/80">{r.title}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-display text-lg font-bold tabular-nums">{r.xp.toLocaleString()}</span>
                    <span className="block text-[10px] font-extrabold text-cream/45">XP</span>
                  </span>
                </li>
              )
            })}
          </ol>
          {rows.length === 1 && <p className="mt-4 text-center text-sm text-cream/55">Just you so far. Share your invite code with friends to get them on the board.</p>}
        </>
      )}
      <AnimatePresence>{joining && <JoinSheet onClose={() => setJoining(false)} />}</AnimatePresence>
    </div>
  )
}
