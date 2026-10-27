// Cosmetics and decorations. Every item is a layer in a slot, so the closet
// is already mix-and-match: outfit + hair + hair color + accessory.
// Adding a new slot (shoes, held item…) = add a Slot, items, and a render layer.

export type Slot = 'outfit' | 'hair' | 'accessory' | 'decor'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Item {
  id: string
  slot: Slot
  name: string
  blurb: string
  cost: number
  rarity: Rarity
  /** Owned from the start. */
  starter?: boolean
}

export const ITEMS: Item[] = [
  // Outfits — complete looks
  { id: 'outfit-trailhead', slot: 'outfit', name: 'Trailhead Hoodie', blurb: 'Oversized sage hoodie, roll-up shorts, chunky sneakers. Ready for anywhere.', cost: 0, rarity: 'common', starter: true },
  { id: 'outfit-courier', slot: 'outfit', name: 'Night Courier', blurb: 'Cropped bomber with neon trim, cargo pants, and a messenger strap.', cost: 120, rarity: 'rare' },
  { id: 'outfit-tidecaller', slot: 'outfit', name: 'Tidecaller', blurb: 'Sailor-collar coat with a coral ribbon. Smells faintly of sea spray.', cost: 150, rarity: 'rare' },
  { id: 'outfit-keeper', slot: 'outfit', name: 'Forest Keeper', blurb: 'Moss-green ranger tunic with a leaf capelet and a pouch of seeds.', cost: 200, rarity: 'epic' },
  { id: 'outfit-starlit', slot: 'outfit', name: 'Starlit Wanderer', blurb: 'A midnight cloak embroidered with constellations you have learned.', cost: 240, rarity: 'epic' },
  { id: 'outfit-nocturne', slot: 'outfit', name: 'Velvet Nocturne', blurb: 'Plum tailcoat, cream cravat, gold buttons. For very formal stargazing.', cost: 320, rarity: 'legendary' },

  // Hair
  { id: 'hair-bob', slot: 'hair', name: 'Soft Bob', blurb: 'Rounded, easy, a little windswept.', cost: 0, rarity: 'common', starter: true },
  { id: 'hair-wolf', slot: 'hair', name: 'Wolf Cut', blurb: 'Choppy layers with attitude.', cost: 60, rarity: 'rare' },
  { id: 'hair-ponytail', slot: 'hair', name: 'High Ponytail', blurb: 'Swishes when you get an answer right.', cost: 70, rarity: 'rare' },
  { id: 'hair-buns', slot: 'hair', name: 'Twin Buns', blurb: 'Two buns, zero compromises.', cost: 80, rarity: 'epic' },

  // Accessories
  { id: 'acc-none', slot: 'accessory', name: 'Bare', blurb: 'Nothing extra.', cost: 0, rarity: 'common', starter: true },
  { id: 'acc-clip', slot: 'accessory', name: 'Star Clip', blurb: 'A tiny gold star tucked in your hair.', cost: 30, rarity: 'common' },
  { id: 'acc-glasses', slot: 'accessory', name: 'Round Specs', blurb: 'Studious, but make it cute.', cost: 45, rarity: 'common' },
  { id: 'acc-headphones', slot: 'accessory', name: 'Cat-Ear Phones', blurb: 'Lo-fi road trip playlist included.', cost: 90, rarity: 'rare' },
  { id: 'acc-hat', slot: 'accessory', name: 'Ranger Hat', blurb: 'Wide brim for sunny trails.', cost: 80, rarity: 'rare' },

  // Van decorations
  { id: 'decor-bunting', slot: 'decor', name: 'Flag Bunting', blurb: 'Faded triangle flags from every stop.', cost: 30, rarity: 'common' },
  { id: 'decor-lights', slot: 'decor', name: 'Fairy Lights', blurb: 'Warm string lights for the awning.', cost: 50, rarity: 'common' },
  { id: 'decor-chair', slot: 'decor', name: 'Camp Chair', blurb: 'Striped canvas. Perfect sunset seat.', cost: 60, rarity: 'common' },
  { id: 'decor-fire', slot: 'decor', name: 'Campfire', blurb: 'Crackles softly. Mochi approves.', cost: 80, rarity: 'rare' },
  { id: 'decor-surfboard', slot: 'decor', name: 'Roof Surfboard', blurb: 'Strapped to the rack, waiting for swell.', cost: 100, rarity: 'rare' },
  { id: 'decor-telescope', slot: 'decor', name: 'Telescope', blurb: 'For the North Star and beyond.', cost: 140, rarity: 'epic' },
]

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]))

export const HAIR_COLORS = [
  { id: 'ink', name: 'Ink', base: '#34305a', shade: '#221f40', shine: '#6d68a8' },
  { id: 'chestnut', name: 'Chestnut', base: '#7b4a36', shade: '#5a3325', shine: '#b07a5d' },
  { id: 'lilac', name: 'Lilac', base: '#b49cf2', shade: '#8a72d4', shine: '#e2d6ff' },
  { id: 'mint', name: 'Mint', base: '#7ccfb8', shade: '#55a893', shine: '#c4f1e4' },
  { id: 'rose', name: 'Rose', base: '#f39bb6', shade: '#d4718f', shine: '#ffd3e0' },
  { id: 'snow', name: 'Snow', base: '#eceef7', shade: '#c3c6dc', shine: '#ffffff' },
] as const

export type HairColorId = (typeof HAIR_COLORS)[number]['id']

export interface Look {
  outfit: string
  hair: string
  hairColor: HairColorId
  accessory: string
}

export const DEFAULT_LOOK: Look = { outfit: 'outfit-trailhead', hair: 'hair-bob', hairColor: 'ink', accessory: 'acc-none' }

export const RARITY_STYLE: Record<Rarity, { label: string; color: string; glow: string }> = {
  common: { label: 'Common', color: '#8fc9a3', glow: 'rgba(143,201,163,.35)' },
  rare: { label: 'Rare', color: '#7fb8ff', glow: 'rgba(127,184,255,.4)' },
  epic: { label: 'Epic', color: '#b49cff', glow: 'rgba(180,156,255,.45)' },
  legendary: { label: 'Legendary', color: '#ffd27a', glow: 'rgba(255,210,122,.5)' },
}

// Destinations unlock by level — the van-life sense of exploration.
export interface Destination {
  id: 'lake' | 'coast' | 'desert'
  name: string
  blurb: string
  level: number
}

export const DESTINATIONS: Destination[] = [
  { id: 'lake', name: 'Lupine Lake', blurb: 'Alpine meadow, still water, golden hour.', level: 1 },
  { id: 'coast', name: 'Saltwind Cliffs', blurb: 'A sunset pull-out above the sea.', level: 2 },
  { id: 'desert', name: 'Starfall Mesa', blurb: 'Dark skies, a crescent moon, the Milky Way.', level: 4 },
]
