// items_text on a participant is JSON: [{ name, price, qty }]
export type RawItem = { name?: string; price?: number | string; qty?: number | string }
export type CartLine = { key: string; name: string; qty: number }

export function parseItems(itemsText: string | null | undefined): RawItem[] {
  if (!itemsText) return []
  try {
    const v = JSON.parse(itemsText)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

// group the same item from different members: "Amul Milk 1L" x2 + x2 -> x4
export function aggregateItems(itemsTexts: (string | null | undefined)[]): CartLine[] {
  const map = new Map<string, CartLine>()
  for (const t of itemsTexts) {
    for (const it of parseItems(t)) {
      const name = String(it.name ?? '').trim()
      const qty = Math.max(0, Math.floor(Number(it.qty ?? 1)) || 0)
      if (!name || !qty) continue
      const key = name.toLowerCase().replace(/\s+/g, ' ')
      const cur = map.get(key)
      if (cur) cur.qty += qty
      else map.set(key, { key, name, qty })
    }
  }
  return [...map.values()]
}

export function formatCartText(lines: CartLine[], store?: string): string {
  return [`${store ?? 'Cart'} - KartMeto pool`, ...lines.map((l, i) => `${i + 1}. ${l.name} x${l.qty}`)].join('\n')
}