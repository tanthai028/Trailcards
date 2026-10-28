// Choose your picture: upload a photo (squared and shrunk on the device), or style your
// character's face.
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { ACCESSORIES, HAIR_COLORS, HAIRS, bodyOfHair, type Look } from '../data/look'
import { Avatar } from '../scene/Figurine'
import { ProfilePic } from './ProfilePic'
import { Icon } from './Icon'

/** Centre-crop to a square and shrink, so the picture stays small enough to save. */
async function squarePhoto(file: File, size = 256): Promise<string> {
  const bmp = await createImageBitmap(file)
  const side = Math.min(bmp.width, bmp.height)
  const c = document.createElement('canvas')
  c.width = c.height = size
  c.getContext('2d')!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size)
  bmp.close()
  const webp = c.toDataURL('image/webp', 0.85)
  // browsers that can't write WebP hand back a PNG, which is much bigger
  return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', 0.85)
}

export function PictureSheet({ onClose }: { onClose: () => void }) {
  const { state, setLook, setPhoto } = useGame()
  const file = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const look = state.look
  const update = (patch: Partial<Look>) => {
    setLook({ ...look, ...patch, ...(patch.hair ? { body: bodyOfHair(patch.hair)! } : {}) })
    setPhoto(null)
  }

  const upload = async (f: File | undefined) => {
    if (!f) return
    setError(null)
    try {
      setPhoto(await squarePhoto(f))
    } catch {
      setError("That file couldn't be read as a picture.")
    }
  }

  return createPortal(
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog" aria-modal="true" aria-label="Your picture"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className="clay no-scrollbar max-h-[88vh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3"
      >
        <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-white/20" aria-hidden="true" />
        <div className="flex items-center gap-4">
          <ProfilePic look={look} photo={state.photo} className="size-20 shrink-0 ring-2 ring-gold" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold text-cream">Your picture</h2>
            <p className="text-xs text-cream/55">Upload a photo, or pick a character below.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => file.current?.click()} className="clay-btn clay-butter flex min-h-12 items-center justify-center gap-2 text-sm">
            <Icon name="profile" size={16} /> Upload photo
          </button>
          <button onClick={() => setPhoto(null)} disabled={!state.photo} className="clay-btn clay-plum min-h-12 text-sm disabled:opacity-40">
            Use character
          </button>
        </div>
        <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />
        {error && <p role="alert" className="mt-2 text-xs font-bold text-coral">{error}</p>}

        <Picker label="Character">
          <div className="grid grid-cols-4 gap-2">
            {HAIRS.map((h) => (
              <button key={h.id} onClick={() => update({ hair: h.id })} aria-label={h.name} aria-pressed={!state.photo && look.hair === h.id}
                className={`grid aspect-square place-items-center rounded-2xl ${!state.photo && look.hair === h.id ? 'bg-cream ring-2 ring-gold' : 'bg-white/5 ring-1 ring-white/10'}`}>
                <Avatar look={{ ...look, hair: h.id, body: h.body }} className="size-[80%] rounded-full bg-[#e9d9cf]" />
              </button>
            ))}
          </div>
        </Picker>
        <Picker label="Hair colour">
          <div className="flex flex-wrap gap-2">
            {HAIR_COLORS.map((c) => (
              <button key={c.id} onClick={() => update({ hairColor: c.id })} aria-label={c.name} aria-pressed={look.hairColor === c.id}
                className={`size-10 rounded-full ring-2 ring-offset-2 ring-offset-ink-2 ${look.hairColor === c.id ? 'ring-gold' : 'ring-transparent'}`}
                style={{ background: `linear-gradient(135deg, ${c.shine}, ${c.base} 55%, ${c.shade})` }} />
            ))}
          </div>
        </Picker>
        <Picker label="Extra">
          <div className="flex flex-wrap gap-2">
            {ACCESSORIES.map((a) => (
              <button key={a.id} onClick={() => update({ accessory: a.id })} aria-pressed={look.accessory === a.id}
                className={`min-h-10 rounded-full px-3.5 text-xs font-extrabold ${look.accessory === a.id ? 'bg-cream text-ink' : 'bg-white/8 text-cream/75'}`}>
                {a.name}
              </button>
            ))}
          </div>
        </Picker>
        <button onClick={onClose} className="clay-btn clay-cream mt-5 min-h-12 w-full text-[15px]">Done</button>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

function Picker({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-extrabold text-cream/60">{label}</p>
      {children}
    </div>
  )
}
