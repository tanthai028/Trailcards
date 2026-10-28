import type { SVGProps } from 'react'

const PATHS: Record<string, string> = {
  feed: 'M5 4h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm0 11h14M5 19h9',
  closet: 'M9 3l3 2 3-2 5 3-2 4-2-1v11H8V9L6 10 4 6l5-3Z',
  van: 'M3 16V9a3 3 0 0 1 3-3h9l4 4 2 2v4h-2M3 16h2m4 0h6M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM14 6v5h6',
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
  shirt: 'M9 3l3 2 3-2 5 3-2 4-2-1v11H8V9L6 10 4 6l5-3Z',
  home: 'M4 11l8-7 8 7v9H4v-9Zm6 9v-5h4v5',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8Z',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Z',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6Zm6-2v14m6-12v14',
  flame: 'M12 21c-4 0-7-2.7-7-6.5 0-3 2-5 3.5-6.5.3 2 1.3 3 2.5 3.5C11 8 12 5 15 3c-.5 3 1 5 2.5 6.5S19 12.5 19 14.5C19 18.3 16 21 12 21Z',
}

export function Icon({ name, size = 20, filled = false, ...rest }: { name: keyof typeof PATHS | string; size?: number; filled?: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={PATHS[name] ?? PATHS.spark} />
    </svg>
  )
}

export function Coin({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#f5b942" />
      <circle cx="12" cy="12" r="7.5" fill="#ffd27a" />
      <path d="M12 7.5l1.3 2.9 3.1.3-2.4 2 .8 3.1L12 14.2l-2.8 1.6.8-3.1-2.4-2 3.1-.3L12 7.5Z" fill="#f5b942" />
    </svg>
  )
}
