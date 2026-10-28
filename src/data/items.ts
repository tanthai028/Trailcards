// Cosmetics and decorations. Every item is a layer in a slot, so the closet
// is already mix-and-match: outfit + hair + hair color + accessory.
// Adding a new slot (shoes, held item…) = add a Slot, items, and a render layer.

import type { SceneId } from '../art/Landscape'

/** 'card' = the scene behind your Learn cards. */
export type Slot = 'outfit' | 'hair' | 'accessory' | 'card' | 'van'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type Body = 'girl' | 'guy'

export interface Item {
  id: string
  slot: Slot
  name: string
  blurb: string
  cost: number
  rarity: Rarity
  /** Owned from the start. */
  starter?: boolean
  /** Hairstyles belong to one body type; everything else fits both. */
  body?: Body
  /** Card backgrounds: which scene they paint. */
  scene?: SceneId
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
  { id: 'hair-bob', slot: 'hair', body: 'girl', name: 'Soft Bob', blurb: 'Rounded, easy, a little windswept.', cost: 0, rarity: 'common', starter: true },
  { id: 'hair-ponytail', slot: 'hair', body: 'girl', name: 'High Ponytail', blurb: 'Swishes when you get an answer right.', cost: 70, rarity: 'rare' },
  { id: 'hair-crop', slot: 'hair', body: 'guy', name: 'Messy Crop', blurb: 'Short, soft fringe, effortless.', cost: 0, rarity: 'common', starter: true },
  { id: 'hair-wolf', slot: 'hair', body: 'guy', name: 'Wolf Cut', blurb: 'Choppy layers with attitude.', cost: 60, rarity: 'rare' },

  // Accessories
  { id: 'acc-none', slot: 'accessory', name: 'Bare', blurb: 'Nothing extra.', cost: 0, rarity: 'common', starter: true },
  { id: 'acc-clip', slot: 'accessory', name: 'Star Clip', blurb: 'A tiny gold star tucked in your hair.', cost: 30, rarity: 'common' },
  { id: 'acc-glasses', slot: 'accessory', name: 'Round Specs', blurb: 'Studious, but make it cute.', cost: 45, rarity: 'common' },
  { id: 'acc-headphones', slot: 'accessory', name: 'Cat-Ear Phones', blurb: 'Lo-fi road trip playlist included.', cost: 90, rarity: 'rare' },
  { id: 'acc-hat', slot: 'accessory', name: 'Ranger Hat', blurb: 'Wide brim for sunny trails.', cost: 80, rarity: 'rare' },

  // Card backgrounds — the scene at the top of every Learn card
  { id: 'card-meadow', slot: 'card', scene: 'meadow', name: 'Lupine Meadow', blurb: 'Rolling hills and wildflowers under a soft sun.', cost: 0, rarity: 'common', starter: true },
  { id: 'card-forest', slot: 'card', scene: 'forest', name: 'Pine Forest', blurb: 'Tall pines and light falling through the canopy.', cost: 30, rarity: 'common' },
  { id: 'card-pasture', slot: 'card', scene: 'pasture', name: 'Green Pasture', blurb: 'Open fields, a fence line and drifting clouds.', cost: 40, rarity: 'common' },
  { id: 'card-peaks', slot: 'card', scene: 'peaks', name: 'Snowy Peaks', blurb: 'Lavender mountains with snow on top.', cost: 60, rarity: 'rare' },
  { id: 'card-coast', slot: 'card', scene: 'coast', name: 'Sunset Coast', blurb: 'Warm sky, calm sea, a long horizon.', cost: 80, rarity: 'rare' },
  { id: 'card-night', slot: 'card', scene: 'night', name: 'Starry Night', blurb: 'A dark sky full of stars and a crescent moon.', cost: 120, rarity: 'epic' },

  // Van upgrades — each is a whole new room render, unlocked in order
  { id: 'van-cozy', slot: 'van', name: 'Cozy Nest', blurb: 'String lights, a woven rug, pastel pillows and bunting.', cost: 40, rarity: 'common' },
  { id: 'van-livedin', slot: 'van', name: 'Lived-in', blurb: 'Books, a reading chair, paper lanterns and a telescope by the window.', cost: 180, rarity: 'rare' },
  { id: 'van-dream', slot: 'van', name: 'Dream Van', blurb: 'A tiny wood stove, surfboards, maps on the walls and plants everywhere.', cost: 320, rarity: 'epic' },
]

/** Van upgrades in order; the room render shown is the number owned in sequence. */
export const VAN_TIERS = ['van-cozy', 'van-livedin', 'van-dream'] as const
export const VAN_TIER_NAMES = ['Bare Van', 'Cozy Nest', 'Lived-in', 'Dream Van']

/** Retired decor (before rooms became whole renders) and what it cost, for refunds. */
export const RETIRED_DECOR: Record<string, number> = {
  'decor-bunting': 30, 'decor-lights': 50, 'decor-chair': 60, 'decor-fire': 80, 'decor-surfboard': 100, 'decor-telescope': 140,
}

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
  body: Body
  outfit: string
  hair: string
  hairColor: HairColorId
  accessory: string
  /** Card background item id. */
  card: string
}

export const DEFAULT_LOOK: Look = { body: 'girl', outfit: 'outfit-trailhead', hair: 'hair-bob', hairColor: 'ink', accessory: 'acc-none', card: 'card-meadow' }

/** The free hairstyle each body type starts with. */
export const DEFAULT_HAIR: Record<Body, string> = { girl: 'hair-bob', guy: 'hair-crop' }

export const hairFits = (hairId: string, body: Body) => ITEM_BY_ID[hairId]?.body === body

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
