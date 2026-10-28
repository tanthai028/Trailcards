import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../state/store'
import { HAIR_COLORS, ITEMS, ITEM_BY_ID, RARITY_STYLE, type Body, type Item, type Look, type Slot } from '../data/items'
import { Avatar, Figurine } from '../scene/Figurine'
import { Coin, Icon } from '../components/Icon'
import { CoinsPill } from '../components/Hud'
import { SceneSvg } from '../art/Landscape'
import { sparkle } from '../fx/FxLayer'
import { playUnlock } from '../fx/sound'

type ClosetTab = Exclude<Slot, 'van'>
const TABS: { id: ClosetTab; label: string }[] = [
  { id: 'outfit', label: 'Outfits' },
  { id: 'hair', label: 'Hair' },
  { id: 'accessory', label: 'Extras' },
  { id: 'card', label: 'Cards' },
]

const withItem = (look: Look, item: Item): Look => ({ ...look, [item.slot]: item.id })

export function ClosetScreen() {
  const { state, buy, equip, setHairColor, setBody, setCardShuffle } = useGame()
  const [tab, setTab] = useState<ClosetTab>('outfit')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const preview = previewId ? ITEM_BY_ID[previewId] : null
  const look = preview ? withItem(state.look, preview) : state.look
  const items = ITEMS.filter((i) => i.slot === tab && (!i.body || i.body === state.look.body))
  const owned = (id: string) => state.owned.includes(id)
  const equipped = (it: Item) => state.look[it.slot as ClosetTab] === it.id
  const ownedCards = ITEMS.filter((i) => i.slot === 'card' && owned(i.id)).length
  const mixing = state.cardShuffle && ownedCards > 1

  // One tap: owned pieces are worn straight away; locked ones are previewed with an unlock button.
  const tapItem = (it: Item) => {
    if (owned(it.id)) {
      setPreviewId(null)
      if (!equipped(it)) equip(it.id)
      if (it.slot === 'card') setCardShuffle(false)
    } else setPreviewId(previewId === it.id ? null : it.id)
  }
  const short = preview ? preview.cost - state.coins : 0
  const stage = useRef<HTMLDivElement>(null)
  const unlock = (it: Item) => {
    if (!buy(it.id)) return
    equip(it.id)
    if (it.slot === 'card') setCardShuffle(false)
    setPreviewId(null)
    playUnlock()
    const r = stage.current?.getBoundingClientRect()
    if (r) sparkle(r.left + r.width / 2, r.top + r.height * 0.45)
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-contain px-4 pb-6">
      {/* Stage */}
      <div
        ref={stage}
        className="relative h-[330px] overflow-hidden rounded-[30px] bg-[#e9d9cf]"
      >
        {/* your card background (or the one you're trying) as the backdrop, with a soft floor glow */}
        <SceneSvg scene={ITEM_BY_ID[look.card]?.scene ?? 'meadow'} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute bottom-[26px] left-1/2 h-9 w-48 -translate-x-1/2 rounded-[50%] bg-[#6b4f6e]/30 blur-md" />
        <div className="absolute left-4 top-4 z-10"><CoinsPill /></div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${look.body}${look.outfit}${look.hair}${look.accessory}${look.hairColor}`}
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="absolute inset-x-0 bottom-8 flex justify-center"
          >
            <Figurine look={look} className="cq-idle h-[255px]" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute right-4 top-4">
          <BodySwitch body={state.look.body} onChange={(b) => { setPreviewId(null); setBody(b) }} />
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="mt-3 flex gap-1 rounded-2xl clay p-1">
        {TABS.map((t) => {
          const n = ITEMS.filter((i) => i.slot === t.id && (!i.body || i.body === state.look.body))
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => { setTab(t.id); setPreviewId(null) }}
              className={`relative min-h-11 flex-1 rounded-xl text-sm font-extrabold transition ${tab === t.id ? 'text-ink' : 'text-cream/60'}`}
            >
              {tab === t.id && <motion.span layoutId="closet-tab" className="absolute inset-0 rounded-xl bg-cream" />}
              <span className="relative">{t.label} <span className="text-xs opacity-50">{n.filter((i) => owned(i.id)).length}/{n.length}</span></span>
            </button>
          )
        })}
      </div>

      {tab === 'hair' && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-extrabold text-cream/50">Hair color · free</p>
          <div className="flex flex-wrap gap-2.5">
            {HAIR_COLORS.map((h) => (
              <button
                key={h.id}
                onClick={() => setHairColor(h.id)}
                aria-label={`${h.name} hair`}
                aria-pressed={state.look.hairColor === h.id}
                className={`size-11 rounded-full ring-2 transition ${state.look.hairColor === h.id ? 'scale-110 ring-gold' : 'ring-white/15 hover:ring-white/40'}`}
                style={{ background: `linear-gradient(135deg, ${h.shine}, ${h.base} 45%, ${h.shade})` }}
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'card' && (
        <button
          onClick={() => setCardShuffle(!state.cardShuffle)}
          disabled={ownedCards < 2}
          role="switch"
          aria-checked={mixing}
          className="clay mt-4 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left disabled:opacity-60"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">Mix it up</span>
            <span className="block text-xs text-cream/55">{ownedCards < 2 ? 'Unlock a second background to mix them' : 'A different background on every card'}</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${mixing ? 'bg-gold' : 'bg-white/15'}`}>
            <span className={`absolute top-1 size-5 rounded-full bg-cream shadow transition-transform ${mixing ? 'translate-x-6' : 'translate-x-1'}`} />
          </span>
        </button>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-3">
        {items.map((it) => (
          <li key={it.id}>
            <ItemCard
              item={it}
              look={withItem(state.look, it)}
              owned={owned(it.id)}
              equipped={it.slot === 'card' && mixing ? false : equipped(it)}
              mixed={it.slot === 'card' && mixing && owned(it.id)}
              selected={previewId === it.id}
              affordable={state.coins >= it.cost}
              onClick={() => tapItem(it)}
            />
          </li>
        ))}
      </ul>

      {/* Unlock bar: stuck to the bottom of the screen, right where you tapped, with a small
          try-on preview so you never scroll back up to see or buy it. */}
      <AnimatePresence initial={false}>
        {preview && (
          <motion.div
            key={preview.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            className="sticky bottom-3 z-20 mt-3 flex items-center gap-3 rounded-3xl bg-paper p-2 text-ink shadow-[0_12px_30px_-8px_rgba(0,0,0,.55)]"
          >
            <span className="relative size-12 shrink-0 overflow-hidden rounded-2xl bg-[#e9d9cf]">
              {preview.slot === 'card'
                ? <SceneSvg scene={preview.scene ?? 'meadow'} still className="absolute inset-0 h-full w-full" />
                : <Avatar look={look} className="absolute inset-0" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold leading-tight">{preview.name}</p>
              <p className="truncate text-[12px] leading-snug text-ink/60">{preview.blurb}</p>
            </div>
            <button
              onClick={() => unlock(preview)}
              disabled={short > 0}
              className="flex min-h-11 w-[118px] shrink-0 items-center justify-center gap-1.5 clay-btn clay-ink text-sm tabular-nums disabled:bg-ink/15 disabled:text-ink/50"
            >
              <Coin size={16} />
              {short > 0 ? `Need ${short}` : `Unlock · ${preview.cost}`}
            </button>
            <button onClick={() => setPreviewId(null)} aria-label="Stop trying on" className="grid size-9 shrink-0 place-items-center rounded-full text-ink/45 hover:text-ink">
              <Icon name="x" size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BodySwitch({ body, onChange }: { body: Body; onChange: (b: Body) => void }) {
  return (
    <div role="radiogroup" aria-label="Character" className="flex shrink-0 rounded-full bg-ink/80 p-1 backdrop-blur">
      {(['girl', 'guy'] as Body[]).map((b) => (
        <button
          key={b}
          role="radio"
          aria-checked={body === b}
          onClick={() => onChange(b)}
          className={`relative min-h-9 rounded-full px-3.5 text-xs font-extrabold capitalize transition ${body === b ? 'text-ink' : 'text-cream/70'}`}
        >
          {body === b && <motion.span layoutId="body-pill" className="absolute inset-0 rounded-full bg-gold" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
          <span className="relative">{b}</span>
        </button>
      ))}
    </div>
  )
}

function ItemCard({ item, look, owned, equipped, mixed, selected, affordable, onClick }: {
  item: Item; look: Look; owned: boolean; equipped: boolean; mixed?: boolean; selected: boolean; affordable: boolean; onClick: () => void
}) {
  const r = RARITY_STYLE[item.rarity]
  const isCard = item.slot === 'card'
  const using = isCard ? 'Using' : 'Wearing'
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      aria-pressed={equipped || selected}
      aria-label={`${item.name}: ${equipped ? using.toLowerCase() : mixed ? 'in the mix' : owned ? (isCard ? 'tap to use' : 'tap to wear') : `${item.cost} coins, tap to try on`}`}
      className={`group relative w-full overflow-hidden rounded-3xl p-2 text-left transition ${selected ? 'bg-white/14' : 'clay hover:brightness-110'}`}
      style={{ boxShadow: selected || equipped ? `0 0 0 2px ${r.color}, 0 10px 30px -8px ${r.glow}` : `inset 0 0 0 1px ${r.color}33` }}
    >
      <div className="relative h-36 overflow-hidden rounded-2xl" style={{ background: `radial-gradient(circle at 50% 75%, ${r.glow}, transparent 70%), linear-gradient(180deg, #f3e6dc, #d9c7d0)` }}>
        {isCard ? (
          <SceneSvg scene={item.scene ?? 'meadow'} still className={`absolute inset-0 h-full w-full ${owned ? '' : 'opacity-85 saturate-[.85]'}`} />
        ) : item.slot === 'outfit' ? (
          <Figurine look={look} className={`absolute bottom-1.5 left-1/2 h-[132px] -translate-x-1/2 ${owned ? '' : 'opacity-85 saturate-[.85]'}`} />
        ) : (
          <Avatar look={look} className={`absolute inset-x-2 bottom-0 top-1 ${owned ? '' : 'opacity-85 saturate-[.85]'}`} />
        )}
        <AnimatePresence initial={false}>
          {!owned && (
            <motion.span
              exit={{ scale: 1.7, rotate: 25, opacity: 0, transition: { duration: 0.35 } }}
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-ink/70 text-cream/80"
            >
              <Icon name="lock" size={14} />
            </motion.span>
          )}
        </AnimatePresence>
        {equipped && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-xs font-extrabold text-ink"><Icon name="check" size={11} strokeWidth={3.5} />{using}</span>
        )}
      </div>
      <div className="px-1 pb-0.5 pt-2">
        <p className="truncate text-sm font-extrabold">{item.name}</p>
        <div className="mt-0.5 flex items-center justify-between text-[11px] font-bold">
          <span style={{ color: r.color }}>{r.label}</span>
          {owned ? (
            <span className="text-cream/50">{equipped ? using : mixed ? 'In the mix' : isCard ? 'Tap to use' : 'Tap to wear'}</span>
          ) : (
            <span className={`flex items-center gap-1 ${affordable ? 'text-gold' : 'text-cream/40'}`}><Coin size={13} />{item.cost}</span>
          )}
        </div>
      </div>
    </motion.button>
  )
}
