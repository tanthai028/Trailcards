// The van parked at the current destination: one rendered diorama per destination.
import { art } from './assets'
import { FEATHER } from './stage'
import { VanScene } from '../art/VanScene'
import { DEFAULT_LOOK, DESTINATIONS } from '../data/items'

export function VanExterior({ destination }: { destination: string }) {
  const src = art(`exterior-${destination}`)
  const name = DESTINATIONS.find((d) => d.id === destination)?.name ?? 'camp'
  if (!src) {
    // Fallback to the flat SVG scene until the render exists.
    return <VanScene look={DEFAULT_LOOK} destination={destination} decor={[]} plantStage={0} className="aspect-square w-full" />
  }
  return (
    <div className="relative aspect-square w-full select-none">
      <img
        src={src}
        alt={`Your camper van parked at ${name}`}
        draggable={false}
        className="absolute inset-0 h-full w-full"
        style={FEATHER}
      />
    </div>
  )
}
