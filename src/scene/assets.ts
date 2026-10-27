// Every rendered sprite in src/assets/art/ is picked up automatically by name.
// Missing files just return undefined, so the scene can fall back to the SVG art.
const files = import.meta.glob<string>('../assets/art/*.webp', { eager: true, query: '?url', import: 'default' })

const byName: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url]),
)

export const art = (name: string): string | undefined => byName[name]
