// Stage colours sampled from the studio backdrop baked into each rendered diorama,
// so the image edges (also feathered with a mask) vanish into the panel.
const radial = (center: string, edge: string) => `radial-gradient(120% 95% at 50% 42%, ${center} 0%, ${edge} 62%, ${edge} 100%)`

export const STAGE_BG = {
  interior: radial('#d2d2d6', '#bcbdc0'),
  lake: radial('#dcd9d6', '#c4c2c1'),
  coast: radial('#dedde1', '#c9c9cc'),
  desert: radial('#c3c7d1', '#aab0bd'),
} as const

export const stageBackground = (view: 'interior' | 'exterior', destination: string) =>
  view === 'interior' ? STAGE_BG.interior : STAGE_BG[destination as keyof typeof STAGE_BG] ?? STAGE_BG.interior

export const FEATHER = {
  maskImage: 'radial-gradient(closest-side, #000 84%, transparent 100%)',
  WebkitMaskImage: 'radial-gradient(closest-side, #000 84%, transparent 100%)',
}
