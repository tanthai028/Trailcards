// A bottom sheet: tap outside, the X, Escape, or pull it down by its top to close.
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, useDragControls } from 'framer-motion'
import { Icon } from './Icon'

export function Sheet({ label, header, onClose, children }: {
  label: string
  /** The top of the sheet next to the X; the sheet is pulled down by this area. */
  header: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  const drag = useDragControls()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog" aria-modal="true" aria-label={label}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: '100%', transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        // only the top area starts a pull, so the list inside still scrolls normally
        drag="y" dragListener={false} dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.8 }}
        onDragEnd={(_, i) => { if (i.offset.y > 90 || i.velocity.y > 500) onClose() }}
        className="clay flex max-h-[88vh] w-full max-w-[480px] flex-col rounded-t-[28px] text-cream"
      >
        <div onPointerDown={(e) => drag.start(e)} className="shrink-0 cursor-grab touch-none px-4 pt-3 active:cursor-grabbing">
          <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-white/25" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">{header}</div>
            <button onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label={`Close ${label.toLowerCase()}`} className="grid size-10 shrink-0 place-items-center rounded-full text-cream/60 hover:text-cream">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          {children}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
