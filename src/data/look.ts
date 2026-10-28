// The character you can use as your picture: one rendered figurine per body × hairstyle ×
// outfit, with hair recoloured at runtime and an optional extra (glasses, hat…).

export type Body = 'girl' | 'guy'

/** Hairstyles belong to one body type. */
export const HAIRS = [
  { id: 'hair-bob', body: 'girl', name: 'Soft Bob' },
  { id: 'hair-ponytail', body: 'girl', name: 'High Ponytail' },
  { id: 'hair-crop', body: 'guy', name: 'Messy Crop' },
  { id: 'hair-wolf', body: 'guy', name: 'Wolf Cut' },
] as const satisfies readonly { id: string; body: Body; name: string }[]

export const OUTFITS = [
  { id: 'outfit-trailhead', name: 'Trailhead Hoodie' },
  { id: 'outfit-courier', name: 'Night Courier' },
  { id: 'outfit-tidecaller', name: 'Tidecaller' },
  { id: 'outfit-keeper', name: 'Forest Keeper' },
  { id: 'outfit-starlit', name: 'Starlit Wanderer' },
  { id: 'outfit-nocturne', name: 'Velvet Nocturne' },
] as const

export const ACCESSORIES = [
  { id: 'acc-none', name: 'None' },
  { id: 'acc-clip', name: 'Star Clip' },
  { id: 'acc-glasses', name: 'Round Specs' },
  { id: 'acc-headphones', name: 'Cat-Ear Phones' },
  { id: 'acc-hat', name: 'Ranger Hat' },
] as const

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
}

export const DEFAULT_LOOK: Look = { body: 'girl', outfit: 'outfit-trailhead', hair: 'hair-bob', hairColor: 'ink', accessory: 'acc-none' }

export const bodyOfHair = (hair: string): Body | undefined => HAIRS.find((h) => h.id === hair)?.body
