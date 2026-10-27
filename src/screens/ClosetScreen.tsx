import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { HAIR_COLORS, ITEMS, ITEM_BY_ID, RARITY_STYLE, type Item, type Look, type Slot } from '../data/items'
import { Character } from '../art/Character'
import { SceneSvg, DESTINATION_SCENE } from '../art/Landscape'
import { Coin, Icon } from '../components/Icon'

type ClosetTab = Exclude<Slot, 'decor'>
const TABS: { id: ClosetTab; label: string }[] = [
  { id: 'outfit', label: 'Outfits' },
  { id: 'hair', label: 'Hair' },
  { id: 'accessory', label: 'Extras' },
]

const withItem = (look: Look, item: Item): Look => ({ ...look, [item.slot]: item.id })

export function ClosetScreen() {
  const { state, buy, equip, setHairColor } = useGame()
  const [tab, setTab] = useState<ClosetTab>('outfit')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const preview = previewId ? ITEM_BY_ID[previewId] : null
  const look = preview ? withItem(state.look, preview) : state.look
  const items = ITEMS.filter((i) => i.slot === tab)
  const owned = (id: string) => state.owned.includes(id)
  const equipped = (it: Item) => state.look[it.slot as ClosetTab] === it.id

  const action = (() => {
    if (!preview) return null
    if (equipped(preview)) return { label: 'Equipped', disabled: true }
    if (owned(preview.id)) return { label: 'Wear this', onClick: () => { equip(preview.id); setPreviewId(null) } }
    const short = preview.cost - state.coins
    return short > 0
      ? { label: `${short} more coins needed`, disabled: true, cost: preview.cost }
      : { label: 'Unlock & wear', cost: preview.cost, onClick: () => { if (buy(preview.id)) { equip(preview.id); setPreviewId(null) } } }
  })()

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pb-6">
      {/* Stage */}
      <div className="grain relative h-[330px] overflow-hidden rounded-[30px] ring-1 ring-white/10">
        <SceneSvg scene={DESTINATION_SCENE[state.destination] ?? 'meadow'} className="absolute inset-0 h-full w-full scale-110 blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-ink/20 to-ink/70" />
        <div className="absolute bottom-10 left-1/2 h-10 w-56 -translate-x-1/2 rounded-[50%] bg-white/25 blur-md" />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${look.outfit}${look.hair}${look.accessory}${look.hairColor}`}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="absolute inset-x-0 bottom-6 flex justify-center"
          >
            <Character look={look} idle expression={preview && !owned(preview.id) ? 'wow' : 'smile'} className="h-[270px] drop-shadow-[0_12px_20px_rgba(0,0,0,.35)]" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-x-4 top-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gold">{preview ? (owned(preview.id) ? 'Previewing' : 'Trying on') : 'Wearing'}</p>
            <h2 className="font-display text-2xl font-bold leading-tight">{preview ? preview.name : ITEM_BY_ID[state.look.outfit].name}</h2>
          </div>
          {preview && (
            <button onClick={() => setPreviewId(null)} className="grid size-9 place-items-center rounded-full bg-ink/50 backdrop-blur" aria-label="Stop previewing">
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="relative z-10 -mt-7 px-3">
        <AnimatePresence mode="wait">
          {preview && action ? (
            <motion.div key={preview.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-3xl bg-paper p-2 pl-4 text-ink shadow-xl">
              <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink/70">{preview.blurb}</p>
              <button
                onClick={action.onClick}
                disabled={action.disabled}
                className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-ink px-4 py-3 text-sm font-extrabold text-cream transition enabled:active:scale-95 disabled:bg-ink/15 disabled:text-ink/50"
              >
                {action.cost != null && <><Coin size={16} />{action.cost} · </>}
                {action.label}
              </button>
            </motion.div>
          ) : (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl bg-ink-2/90 px-4 py-3 text-center text-[13px] font-semibold text-cream/70 ring-1 ring-white/10 backdrop-blur">
              Tap any piece to try it on. Earn coins by answering cards.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div role="tablist" className="mt-5 flex gap-1 rounded-2xl bg-white/6 p-1">
        {TABS.map((t) => {
          const n = ITEMS.filter((i) => i.slot === t.id)
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 rounded-xl py-2 text-sm font-extrabold transition ${tab === t.id ? 'text-ink' : 'text-cream/60'}`}
            >
              {tab === t.id && <motion.span layoutId="closet-tab" className="absolute inset-0 rounded-xl bg-cream" />}
              <span className="relative">{t.label} <span className="text-xs opacity-50">{n.filter((i) => owned(i.id)).length}/{n.length}</span></span>
            </button>
          )
        })}
      </div>

      {tab === 'hair' && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-cream/50">Hair color · free</p>
          <div className="flex flex-wrap gap-2">
            {HAIR_COLORS.map((h) => (
              <button
                key={h.id}
                onClick={() => setHairColor(h.id)}
                aria-label={`${h.name} hair`}
                aria-pressed={state.look.hairColor === h.id}
                className={`size-10 rounded-full ring-2 transition ${state.look.hairColor === h.id ? 'scale-110 ring-gold' : 'ring-white/15 hover:ring-white/40'}`}
                style={{ background: `linear-gradient(135deg, ${h.shine}, ${h.base} 45%, ${h.shade})` }}
              />
            ))}
          </div>
        </div>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <li key={it.id}>
            <ItemCard
              item={it}
              look={withItem(state.look, it)}
              owned={owned(it.id)}
              equipped={equipped(it)}
              selected={previewId === it.id}
              affordable={state.coins >= it.cost}
              onClick={() => setPreviewId(previewId === it.id ? null : it.id)}
            />
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-cream/40">Every piece is a separate layer, so outfits, hair and extras mix freely.</p>
    </div>
  )
}

function ItemCard({ item, look, owned, equipped, selected, affordable, onClick }: {
  item: Item; look: Look; owned: boolean; equipped: boolean; selected: boolean; affordable: boolean; onClick: () => void
}) {
  const r = RARITY_STYLE[item.rarity]
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      aria-pressed={selected}
      className={`group relative w-full overflow-hidden rounded-3xl p-2 text-left transition ${selected ? 'bg-white/14' : 'bg-white/6 hover:bg-white/10'}`}
      style={{ boxShadow: selected ? `0 0 0 2px ${r.color}, 0 10px 30px -8px ${r.glow}` : `inset 0 0 0 1px ${r.color}33` }}
    >
      <div className="relative h-32 overflow-hidden rounded-2xl" style={{ background: `radial-gradient(circle at 50% 80%, ${r.glow}, transparent 70%), linear-gradient(180deg, #2f3466, #232750)` }}>
        <Character look={look} portrait={item.slot !== 'outfit'} className={`absolute left-1/2 -translate-x-1/2 ${item.slot === 'outfit' ? 'bottom-0.5 h-[124px]' : 'bottom-0 h-[128px]'} ${owned ? '' : 'opacity-80 saturate-[.85]'}`} />
        {!owned && (
          <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-ink/70 text-cream/80 backdrop-blur"><Icon name="lock" size={14} /></span>
        )}
        {equipped && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-black text-ink"><Icon name="check" size={11} strokeWidth={3.5} />Wearing</span>
        )}
      </div>
      <div className="px-1 pb-0.5 pt-2">
        <p className="truncate text-sm font-extrabold">{item.name}</p>
        <div className="mt-0.5 flex items-center justify-between text-[11px] font-bold">
          <span style={{ color: r.color }}>{r.label}</span>
          {owned ? (
            <span className="text-cream/50">Owned</span>
          ) : (
            <span className={`flex items-center gap-1 ${affordable ? 'text-gold' : 'text-cream/40'}`}><Coin size={13} />{item.cost}</span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
