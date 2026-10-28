// One-time nudge to install on iPhone: from the home screen Safari's bars disappear.
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { Icon } from './Icon'

const isIOSSafari = () => {
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return ios && !/CriOS|FxiOS|EdgiOS/.test(ua)
}
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const shouldShowInstallHint = (tips: string[]) => isIOSSafari() && !isStandalone() && !tips.includes('install')

export function InstallHint() {
  const { dismissTip } = useGame()
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      className="absolute inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-3xl bg-paper p-3 pl-4 text-ink shadow-xl"
      role="status"
    >
      <Icon name="spark" size={18} className="shrink-0 text-[#b0576a]" />
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="font-extrabold">Go full screen:</span> tap Share, then “Add to Home Screen”.
      </p>
      <button onClick={() => dismissTip('install')} aria-label="Dismiss" className="grid size-10 shrink-0 place-items-center rounded-full text-ink/50 hover:text-ink">
        <Icon name="x" size={16} />
      </button>
    </motion.div>
  )
}
