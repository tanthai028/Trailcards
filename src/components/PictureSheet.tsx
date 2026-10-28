// Choose your picture: upload a photo (squared and shrunk on the device) or pick an icon,
// then a frame: a ring in any colour, or a special one you've unlocked.
import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useGame } from '../state/store'
import { frameUnlocked, isUnlocked } from '../state/game'
import { AVATARS, FRAME_COLORS, FRAMES, type Frame, type FrameUnlock } from '../data/avatars'
import { ACH_BY_ID } from '../data/achievements'
import { CARD_FX, PIC_BGS, TITLE_FX, type Cosmetic } from '../data/cosmetics'
import { SceneSvg } from '../art/Landscape'
import { CardFx } from './CardFx'
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

const unlockText = (u: FrameUnlock) => ('level' in u ? `Reach level ${u.level}` : `Earn “${ACH_BY_ID[u.trophy]?.name ?? 'a trophy'}”`)

export function PictureSheet({ onClose }: { onClose: () => void }) {
  const { state, setAvatar, setFrame, setPhoto, setCosmetics } = useGame()
  const file = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = async (f: File | undefined) => {
    if (!f) return
    setError(null)
    try {
      setPhoto(await squarePhoto(f))
    } catch {
      setError("That file couldn't be read as a picture. Try a JPEG or PNG.")
    }
  }
  const pick = (frame: Frame) => frameUnlocked(state, frame) && setFrame(frame)

  return createPortal(
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog" aria-modal="true" aria-label="Customize"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className="clay no-scrollbar max-h-[88vh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 text-cream"
      >
        <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-white/20" aria-hidden="true" />
        <div className="flex items-center gap-4">
          <ProfilePic avatar={state.avatar} frame={state.frame} bg={state.cosmetics.bg} photo={state.photo} className="size-20" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold">Customize</h2>
            <p className="text-xs text-cream/55">Your picture, frame, title and Learn cards. Study to unlock more.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => file.current?.click()} className="clay-btn clay-butter flex min-h-12 items-center justify-center gap-2 text-sm">
            <Icon name="profile" size={16} /> Upload photo
          </button>
          <button onClick={() => setPhoto(null)} disabled={!state.photo} className="clay-btn clay-plum min-h-12 text-sm disabled:opacity-40">Remove photo</button>
        </div>
        <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
        {error && <p role="alert" className="mt-2 text-xs font-bold text-coral">{error}</p>}

        <Section label="Icon">
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => {
              const on = !state.photo && state.avatar === a.id
              return (
                <button key={a.id} onClick={() => setAvatar(a.id)} aria-label={`${a.id} icon`} aria-pressed={on}
                  className={`rounded-full p-0.5 ring-2 ${on ? 'ring-gold' : 'ring-transparent'}`}>
                  <ProfilePic avatar={a.id} photo={null} className="aspect-square w-full" />
                </button>
              )
            })}
          </div>
        </Section>

        <Section label={state.photo ? 'Icon background (shows when you use an icon)' : 'Icon background'}>
          <CosmeticGrid list={PIC_BGS} value={state.cosmetics.bg} onPick={(bg) => setCosmetics({ bg })}
            preview={(c) => <ProfilePic avatar={state.avatar} photo={null} bg={c.id} className="size-14" />} />
        </Section>

        <Section label="Frame">
          <div className="flex flex-wrap gap-2">
            <FrameChoice label="No frame" on={state.frame === 'none'} onClick={() => pick('none')}>
              <span className="absolute inset-[9%] rounded-full border-2 border-dashed border-white/25" />
            </FrameChoice>
            {FRAME_COLORS.map((c) => (
              <FrameChoice key={c} label={`Ring ${c}`} on={state.frame === `color:${c}`} onClick={() => pick(`color:${c}`)}>
                <span className="absolute inset-[6%] rounded-full border-[5px]" style={{ borderColor: c }} />
              </FrameChoice>
            ))}
          </div>
          <p className="mb-2 mt-4 text-xs font-extrabold text-cream/60">Special frames</p>
          <div className="grid grid-cols-3 gap-2">
            {FRAMES.map((f) => {
              const open = frameUnlocked(state, f.id)
              const on = state.frame === f.id
              return (
                <button key={f.id} onClick={() => pick(f.id)} disabled={!open} aria-pressed={on}
                  className={`flex flex-col items-center gap-1 rounded-2xl p-2 ring-2 ${on ? 'bg-gold/10 ring-gold' : 'bg-white/5 ring-transparent'} disabled:cursor-not-allowed`}>
                  <span className={`relative ${open ? '' : 'opacity-40 grayscale'}`}>
                    <ProfilePic avatar={state.avatar} frame={f.id} bg={state.cosmetics.bg} photo={state.photo} className="size-14" />
                    {!open && <span className="absolute inset-0 grid place-items-center"><span className="grid size-7 place-items-center rounded-full bg-ink/80"><Icon name="lock" size={13} /></span></span>}
                  </span>
                  <span className="text-xs font-extrabold">{f.name}</span>
                  {!open && <span className="text-center text-[10px] leading-tight text-cream/50">{unlockText(f.unlock)}</span>}
                </button>
              )
            })}
          </div>
        </Section>

        <Section label="Title effect">
          <CosmeticGrid list={TITLE_FX} value={state.cosmetics.title} onPick={(title) => setCosmetics({ title })}
            preview={(c) => <span className="grid h-14 w-full place-items-center rounded-xl bg-ink/70 px-1"><span className={`truncate text-sm font-extrabold ${c.id === 'none' ? 'text-gold' : `fx-title-${c.id}`}`}>{state.title ?? 'Wanderer'}</span></span>} />
        </Section>

        <Section label="Learn card theme">
          <CosmeticGrid list={CARD_FX} value={state.cosmetics.card} onPick={(card) => setCosmetics({ card })}
            preview={(c) => (
              <span className="relative block h-14 w-full overflow-hidden rounded-xl">
                <SceneSvg scene={c.id === 'starfall' || c.id === 'aurora' ? 'night' : c.id === 'snow' ? 'peaks' : 'meadow'} still className="absolute inset-0 h-full w-full" />
                <CardFx fx={c.id} />
              </span>
            )} />
        </Section>
        <button onClick={onClose} className="clay-btn clay-cream mt-5 min-h-12 w-full text-[15px]">Done</button>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

function FrameChoice({ label, on, onClick, children }: { label: string; on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={on} className={`relative size-11 rounded-full bg-white/5 ring-2 ${on ? 'ring-gold' : 'ring-transparent'}`}>
      {children}
    </button>
  )
}

/** A grid of unlockable looks: the preview, its name, and what unlocks it while locked. */
function CosmeticGrid({ list, value, onPick, preview }: { list: Cosmetic[]; value: string; onPick: (id: string) => void; preview: (c: Cosmetic) => ReactNode }) {
  const { state } = useGame()
  return (
    <div className="grid grid-cols-3 gap-2">
      {list.map((c) => {
        const open = isUnlocked(state, c.unlock)
        const on = value === c.id
        return (
          <button key={c.id} onClick={() => open && onPick(c.id)} disabled={!open} aria-pressed={on}
            className={`flex flex-col items-center gap-1 rounded-2xl p-2 ring-2 ${on ? 'bg-gold/10 ring-gold' : 'bg-white/5 ring-transparent'} disabled:cursor-not-allowed`}>
            <span className={`relative grid w-full place-items-center ${open ? '' : 'opacity-40 grayscale'}`}>
              {preview(c)}
              {!open && <span className="absolute inset-0 grid place-items-center"><span className="grid size-7 place-items-center rounded-full bg-ink/80"><Icon name="lock" size={13} /></span></span>}
            </span>
            <span className="text-xs font-extrabold">{c.name}</span>
            {!open && c.unlock && <span className="text-center text-[10px] leading-tight text-cream/50">{unlockText(c.unlock)}</span>}
          </button>
        )
      })}
    </div>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-extrabold text-cream/60">{label}</p>
      {children}
    </div>
  )
}
