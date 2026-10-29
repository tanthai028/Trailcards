import type { SVGProps } from 'react'

const PATHS: Record<string, string> = {
  feed: 'M5 4h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm0 11h14M5 19h9',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H5v1a3 3 0 0 0 3 3m8-4h3v1a3 3 0 0 1-3 3m-4 3v4m-4 3h8m-6 0 1-3h2l1 3',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-13v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z',
  music: 'M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  bolt: 'M13 2 5 14h6l-1 8 8-12h-6l1-8Z',
  planet: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-7.5 1.5c-1.6-1.6 1.6-5.8 7-9.5s10-5 11-3.5-1.6 5.8-7 9.5-9.5 5-11 3.5Z',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c1-4 4-6 7-6s6 2 7 6',
  bookmark: 'M6 3h12v18l-6-4-6 4V3Z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  down: 'M12 5v14m-6-6 6 6 6-6',
  chevron: 'M6 9l6 6 6-6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Z',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  book: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1V5Zm8 1v14',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z',
  leaf: 'M5 19C5 10 10 5 20 4c-1 10-6 15-15 15Zm0 0 8-8',
  wave: 'M2 14c3 0 3-3 6-3s3 3 6 3 3-3 6-3M2 19c3 0 3-3 6-3s3 3 6 3 3-3 6-3',
  peak: 'M2 20 9 8l4 6 3-4 6 10H2Z',
  cloud: 'M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9H7Z',
  paw: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-7 7c-3 0-5-1-5-3s2-5 5-5 5 3 5 5-2 3-5 3Z',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8Z',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3c0-.4 0-.8-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  flame: 'M12 21c-4 0-7-2.7-7-6.5 0-3 2-5 3.5-6.5.3 2 1.3 3 2.5 3.5C11 8 12 5 15 3c-.5 3 1 5 2.5 6.5S19 12.5 19 14.5C19 18.3 16 21 12 21Z',
}

export function Icon({ name, size = 20, filled = false, ...rest }: { name: keyof typeof PATHS | string; size?: number; filled?: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={PATHS[name] ?? PATHS.spark} />
    </svg>
  )
}
