// Profile pictures: a simple icon on a colour (or your own photo), inside an optional frame.
// Frames are either a ring in a colour you pick, or a special one you unlock by studying.

export interface AvatarIcon {
  id: string
  /** An Icon name. */
  glyph: string
  /** Background gradient, light to dark. */
  from: string
  to: string
}

export const AVATARS: AvatarIcon[] = [
  { id: 'paw', glyph: 'paw', from: '#ffc79e', to: '#f08a80' },
  { id: 'leaf', glyph: 'leaf', from: '#b8ebc6', to: '#5fae78' },
  { id: 'star', glyph: 'star', from: '#ffe7a3', to: '#f0b13c' },
  { id: 'wave', glyph: 'wave', from: '#bfe3ff', to: '#5a9fe0' },
  { id: 'peak', glyph: 'peak', from: '#ddd3fb', to: '#8a72d4' },
  { id: 'cloud', glyph: 'cloud', from: '#e6f3ff', to: '#8fb3da' },
  { id: 'moon', glyph: 'moon', from: '#6d68a8', to: '#2a2550' },
  { id: 'sun', glyph: 'sun', from: '#ffe08a', to: '#f7934c' },
  { id: 'flame', glyph: 'flame', from: '#ffc48a', to: '#e8573f' },
  { id: 'book', glyph: 'book', from: '#f6d6b8', to: '#b27b52' },
  { id: 'spark', glyph: 'spark', from: '#ffd3e0', to: '#d4718f' },
  { id: 'heart', glyph: 'heart', from: '#ffb3c1', to: '#e0485a' },
  { id: 'music', glyph: 'music', from: '#c4f1e4', to: '#3f9f88' },
  { id: 'bolt', glyph: 'bolt', from: '#fff2a8', to: '#d9a81c' },
  { id: 'planet', glyph: 'planet', from: '#c9b8ff', to: '#5b4bb3' },
  { id: 'compass', glyph: 'compass', from: '#d8e7d0', to: '#6f8f5e' },
]
export const AVATAR_BY_ID: Record<string, AvatarIcon> = Object.fromEntries(AVATARS.map((a) => [a.id, a]))
export const DEFAULT_AVATAR = 'paw'

/** Ring colours for a custom frame. */
export const FRAME_COLORS = ['#fbf3e6', '#f5cd6a', '#f7b48f', '#f08a80', '#b9a7f2', '#9cc8f2', '#8dcfa1', '#f2a3c4']

export type FrameUnlock = { level: number } | { trophy: string }

/** Special frames and what unlocks them. */
export const FRAMES: { id: string; name: string; unlock: FrameUnlock }[] = [
  { id: 'gold', name: 'Gold', unlock: { level: 3 } },
  { id: 'leaf', name: 'Leafy', unlock: { level: 5 } },
  { id: 'flame', name: 'Flame', unlock: { trophy: 'streak-7' } },
  { id: 'stars', name: 'Starry', unlock: { trophy: 'mastery-10' } },
  { id: 'rainbow', name: 'Rainbow', unlock: { level: 10 } },
  { id: 'crown', name: 'Crown', unlock: { trophy: 'streak-30' } },
]
export const FRAME_BY_ID = Object.fromEntries(FRAMES.map((f) => [f.id, f]))

/** 'none', a custom ring ('color:#rrggbb'), or a special frame's id. */
export type Frame = string
export const isColorFrame = (f: Frame) => /^color:#[0-9a-f]{6}$/i.test(f)
export const isKnownFrame = (f: unknown): f is Frame => typeof f === 'string' && (f === 'none' || isColorFrame(f) || f in FRAME_BY_ID)
