// Lightweight inline SVG icons — no external icon library.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
}

export const ChevronLeft = (p) => (
  <svg {...base} {...p}><path d="M15 18l-6-6 6-6" /></svg>
)
export const ChevronRight = (p) => (
  <svg {...base} {...p}><path d="M9 18l6-6-6-6" /></svg>
)
export const Academic = (p) => (
  <svg {...base} {...p}><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" /></svg>
)
export const Book = (p) => (
  <svg {...base} {...p}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
)
export const Cube = (p) => (
  <svg {...base} {...p}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path d="M3.27 6.96L12 12l8.73-5.04M12 22V12" /></svg>
)
export const Spark = (p) => (
  <svg {...base} {...p}><path d="M13 2L4.5 12.5h6L11 22l8.5-10.5h-6L13 2z" /></svg>
)
export const Mail = (p) => (
  <svg {...base} {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></svg>
)
export const Phone = (p) => (
  <svg {...base} {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
)
export const LinkedIn = (p) => (
  <svg {...base} {...p}><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
)
export const Pin = (p) => (
  <svg {...base} {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
)
export const Menu = (p) => (
  <svg {...base} {...p}><path d="M3 12h18M3 6h18M3 18h18" /></svg>
)
export const Close = (p) => (
  <svg {...base} {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>
)
export const Check = (p) => (
  <svg {...base} {...p}><path d="M20 6L9 17l-5-5" /></svg>
)
export const Arrow = (p) => (
  <svg {...base} {...p}><path d="M5 12h14M13 5l7 7-7 7" /></svg>
)
export const Calendar = (p) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
)
export const User = (p) => (
  <svg {...base} {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
)
export const Building = (p) => (
  <svg {...base} {...p}><path d="M3 21h18M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1" /></svg>
)

export const iconMap = {
  academic: Academic,
  book: Book,
  cube: Cube,
  spark: Spark,
  mail: Mail,
  phone: Phone,
  linkedin: LinkedIn,
  pin: Pin,
  user: User,
  building: Building,
  calendar: Calendar,
}
