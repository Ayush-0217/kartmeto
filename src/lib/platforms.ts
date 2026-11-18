export type Platform = {
  name: string
  chip: string        // short label for filter chips
  short: string
  bg: string
  fg: string
  tile: string        // square logo (Home tiles)
  card?: string       // square logo used on Active Pools cards
  wordmark?: string   // wide logo (Home pool card, top-right)
}

export const PLATFORMS: Platform[] = [
  { name: 'Blinkit', chip: 'Blinkit', short: 'blinkit', bg: '#f8cb46', fg: '#111', tile: '/logos/blinkit-tile.png', card: '/logos/blinkit-card.png', wordmark: '/logos/blinkit-wordmark.png' },
  { name: 'Zepto', chip: 'Zepto', short: 'zepto', bg: '#4b1a8c', fg: '#fff', tile: '/logos/zepto-tile.png', card: '/logos/zepto-card.png', wordmark: '/logos/zepto-wordmark.png' },
  { name: 'Swiggy Instamart', chip: 'Instamart', short: 'Instamart', bg: '#fc8019', fg: '#fff', tile: '/logos/instamart-tile.png', card: '/logos/instamart-card.png' },
  { name: 'Zomato', chip: 'Zomato', short: 'zomato', bg: '#e23744', fg: '#fff', tile: '/logos/zomato-tile.png' },
]

const OTHER: Platform = { name: 'Other', chip: 'Other', short: 'Other', bg: '#3a4150', fg: '#fff', tile: '' }

export const platformOf = (name: string): Platform => PLATFORMS.find((p) => p.name === name) ?? OTHER
