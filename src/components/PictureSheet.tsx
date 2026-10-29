// Choose your picture: upload a photo (squared and shrunk on the device) or pick an icon,
// then a frame: a ring in any colour, or a special one you've unlocked.
import { useRef, useState, type ReactNode } from 'react'
import { Sheet } from './Sheet'
import { useGame } from '../state/store'
import { frameUnlocked, isUnlocked } from '../state/game'
import { AVATARS, FRAME_COLORS, FRAMES, type Frame, type FrameUnlock } from '../data/avatars'
import { ACH_BY_ID } from '../data/achievements'
import { CARD_FX, CARD_SCENES, PIC_BGS, TITLE_FX, type Cosmetic } from '../data/cosmetics'
import { SceneSvg, type SceneId } from '../art/Landscape'
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
  // one row of each to start; "Show all" opens the rest (already open if your pick is further down)
  const [icons, iconsMore] = useMore(AVATARS, 6, (a) => !state.photo && state.avatar === a.id)
  const rings = ['none', ...FRAME_COLORS.map((c) => `color:${c}`)]
  const [ringList, ringsMore] = useMore(rings, 6, (r) => state.frame === r)
  const [frames, framesMore] = useMore(FRAMES, 3, (f) => state.frame === f.id)
  const cardShuffle = state.cosmetics.cardShuffle ?? []
  const sceneShuffle = state.cosmetics.sceneShuffle ?? []

  return (
    <Sheet
      label="Customize"
      onClose={onClose}
      header={
        <div className="flex items-center gap-4">
          <ProfilePic avatar={state.avatar} frame={state.frame} bg={state.cosmetics.bg} photo={state.photo} className="size-20" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold">Customize</h2>
            <p className="text-xs text-cream/55">Your picture, frame, title and card theme. Study to unlock more.</p>
          </div>
        </div>
      }
    >
        {/* Remove only shows once there's a photo to remove */}
        <div className={`grid gap-2 ${state.photo ? 'grid-cols-2' : ''}`}>
          <button onClick={() => file.current?.click()} className="clay-btn clay-butter flex min-h-12 items-center justify-center gap-2 text-sm">
            <Icon name="profile" size={16} /> Upload photo
          </button>
          {state.photo && <button onClick={() => setPhoto(null)} className="clay-btn clay-plum min-h-12 text-sm">Remove photo</button>}
        </div>
        <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
        {error && <p role="alert" className="mt-2 text-xs font-bold text-coral">{error}</p>}

        <Section label="Icon">
          <div className="grid grid-cols-6 gap-2">
            {icons.map((a) => {
              const on = !state.photo && state.avatar === a.id
              return (
                <button key={a.id} onClick={() => setAvatar(a.id)} aria-label={`${a.id} icon`} aria-pressed={on}
                  className={`rounded-full p-0.5 ring-2 ${on ? 'ring-gold' : 'ring-transparent'}`}>
                  <ProfilePic avatar={a.id} photo={null} className="aspect-square w-full" />
                </button>
              )
            })}
          </div>
          {iconsMore}
        </Section>

        <Section label={state.photo ? 'Icon background (shows when you use an icon)' : 'Icon background'}>
          <CosmeticGrid list={PIC_BGS} value={state.cosmetics.bg} onPick={(bg) => setCosmetics({ bg })}
            preview={(c) => <ProfilePic avatar={state.avatar} photo={null} bg={c.id} className="size-14" />} />
        </Section>

        <Section label="Frame">
          <div className="flex flex-wrap gap-2">
            {ringList.map((r) => r === 'none' ? (
              <FrameChoice key={r} label="No frame" on={state.frame === 'none'} onClick={() => pick('none')}>
                <span className="absolute inset-[9%] rounded-full border-2 border-dashed border-white/25" />
              </FrameChoice>
            ) : (
              <FrameChoice key={r} label={`Ring ${r.slice(6)}`} on={state.frame === r} onClick={() => pick(r)}>
                <span className="absolute inset-[6%] rounded-full border-[5px]" style={{ borderColor: r.slice(6) }} />
              </FrameChoice>
            ))}
          </div>
          {ringsMore}
          <p className="mb-2 mt-4 text-xs font-extrabold text-cream/60">Special frames</p>
          <div className="grid grid-cols-3 gap-2">
            {frames.map((f) => {
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
          {framesMore}
        </Section>

        <Section label="Title effect">
          <CosmeticGrid list={TITLE_FX} value={state.cosmetics.title} onPick={(title) => setCosmetics({ title })}
            preview={(c) => <span className="grid h-14 w-full place-items-center rounded-xl bg-ink/70 px-1"><span className={`truncate text-sm font-extrabold ${c.id === 'none' ? 'text-gold' : `fx-title-${c.id}`}`}>{state.title ?? 'Wanderer'}</span></span>} />
        </Section>

        <Section label="Theme">
          <ShuffleSwitch picks={sceneShuffle} onToggle={() => setCosmetics({ sceneShuffle: sceneShuffle.length ? [] : [state.cosmetics.scene] })} />
          <CosmeticGrid list={CARD_SCENES} value={state.cosmetics.scene} picked={sceneShuffle.length ? sceneShuffle : undefined}
            onPick={(scene) => {
              if (!sceneShuffle.length) return setCosmetics({ scene })
              const [picks, shown] = togglePick(sceneShuffle, scene, state.cosmetics.scene)
              setCosmetics({ sceneShuffle: picks, scene: shown })
            }}
            preview={(c) => (
              <span className="relative block h-14 w-full overflow-hidden rounded-xl">
                {c.id === 'auto'
                  ? <span className="grid h-full grid-cols-3"><SceneSvg scene="meadow" still className="h-full w-full" /><SceneSvg scene="coast" still className="h-full w-full" /><SceneSvg scene="forest" still className="h-full w-full" /></span>
                  : <SceneSvg scene={c.id as SceneId} still className="absolute inset-0 h-full w-full" />}
              </span>
            )} />
        </Section>

        <Section label="Effects">
          <ShuffleSwitch picks={cardShuffle} onToggle={() => setCosmetics({ cardShuffle: cardShuffle.length ? [] : [state.cosmetics.card] })} />
          <CosmeticGrid list={CARD_FX} value={state.cosmetics.card} picked={cardShuffle.length ? cardShuffle : undefined}
            onPick={(card) => {
              if (!cardShuffle.length) return setCosmetics({ card })
              const [picks, shown] = togglePick(cardShuffle, card, state.cosmetics.card)
              setCosmetics({ cardShuffle: picks, card: shown })
            }}
            preview={(c) => (
              <span className="relative block h-14 w-full overflow-hidden rounded-xl">
                {/* over your chosen scene, so you see the pair you'll get */}
                <SceneSvg scene={state.cosmetics.scene !== 'auto' ? (state.cosmetics.scene as SceneId) : c.id === 'starfall' || c.id === 'aurora' ? 'night' : c.id === 'snow' ? 'peaks' : 'meadow'} still className="absolute inset-0 h-full w-full" />
                <CardFx fx={c.id} />
              </span>
            )} />
        </Section>
        <button onClick={onClose} className="clay-btn clay-cream mt-5 min-h-12 w-full text-[15px]">Done</button>
    </Sheet>
  )
}

/** Shuffle: pick several, and each time the app opens one of them is used. */
function ShuffleSwitch({ picks, onToggle }: { picks: string[]; onToggle: () => void }) {
  const on = picks.length > 0
  return (
    <button role="switch" aria-checked={on} onClick={onToggle} className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">Shuffle</span>
        <span className="block text-[11px] leading-snug text-cream/55">
          {!on ? 'A different one of your picks each time you open the app.' : picks.length < 2 ? 'Tap two or more to shuffle between.' : `Shuffling ${picks.length}. Tap to add or remove.`}
        </span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-gold' : 'bg-white/15'}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-cream shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </button>
  )
}

/**
 * Add or remove one shuffle pick. Returns the new picks and what to show now: the one just added,
 * or another pick when the one on show is removed. The last pick stays (turn Shuffle off instead).
 */
function togglePick(picks: string[], id: string, current: string): [string[], string] {
  const has = picks.includes(id)
  const next = has ? picks.filter((x) => x !== id) : [...picks, id]
  if (!next.length) return [[id], id]
  return [next, has ? (id === current ? next[0] : current) : id]
}

function FrameChoice({ label, on, onClick, children }: { label: string; on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={on} className={`relative size-11 rounded-full bg-white/5 ring-2 ${on ? 'ring-gold' : 'ring-transparent'}`}>
      {children}
    </button>
  )
}

/**
 * A grid of unlockable looks: the preview, its name, and what unlocks it while locked.
 * `picked`: several can be chosen (the background shuffle); each shows a check.
 */
function CosmeticGrid({ list, value, picked, onPick, preview }: { list: Cosmetic[]; value: string; picked?: string[]; onPick: (id: string) => void; preview: (c: Cosmetic) => ReactNode }) {
  const { state } = useGame()
  const isOn = (id: string) => (picked ? picked.includes(id) : value === id)
  const [shown, more] = useMore(list, 3, (c) => isOn(c.id))
  return (
    <>
    <div className="grid grid-cols-3 gap-2">
      {shown.map((c) => {
        const open = isUnlocked(state, c.unlock)
        const on = isOn(c.id)
        return (
          <button key={c.id} onClick={() => open && onPick(c.id)} disabled={!open} aria-pressed={on}
            className={`flex flex-col items-center gap-1 rounded-2xl p-2 ring-2 ${on ? 'bg-gold/10 ring-gold' : 'bg-white/5 ring-transparent'} disabled:cursor-not-allowed`}>
            <span className={`relative grid w-full place-items-center ${open ? '' : 'opacity-40 grayscale'}`}>
              {preview(c)}
              {picked && on && <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-gold text-ink"><Icon name="check" size={12} strokeWidth={3} /></span>}
              {!open && <span className="absolute inset-0 grid place-items-center"><span className="grid size-7 place-items-center rounded-full bg-ink/80"><Icon name="lock" size={13} /></span></span>}
            </span>
            <span className="text-xs font-extrabold">{c.name}</span>
            {!open && c.unlock && <span className="text-center text-[10px] leading-tight text-cream/50">{unlockText(c.unlock)}</span>}
          </button>
        )
      })}
    </div>
    {more}
    </>
  )
}

/**
 * The first `n` items, and a Show all / Show less toggle when there are more. Always starts
 * collapsed; a chosen item past the first row is pulled into it so you still see your pick.
 */
function useMore<T>(items: T[], n: number, isOn: (t: T) => boolean) {
  const [open, setOpen] = useState(false)
  if (items.length <= n) return [items, null] as const
  const toggle = (
    <button onClick={() => setOpen(!open)} className="mt-2 flex min-h-9 w-full items-center justify-center gap-1 rounded-xl text-xs font-extrabold text-cream/60 hover:text-cream">
      {open ? 'Show less' : `Show all ${items.length}`}
      <Icon name="chevron" size={12} strokeWidth={3} className={open ? 'rotate-180' : ''} />
    </button>
  )
  const first = items.slice(0, n)
  const hidden = items.slice(n).filter(isOn)
  return [open ? items : hidden.length ? [...hidden, ...first].slice(0, n) : first, toggle] as const
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-extrabold text-cream/60">{label}</p>
      {children}
    </div>
  )
}
