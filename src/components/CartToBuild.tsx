import { useState } from 'react'
import { formatCartText, type CartLine } from '../lib/cart'

// Photo + subtitle (+ optional unit) per product, keyed by the lowercase item name.
// Put the PNGs in  public/products/  (or change the paths). Missing photo => letter tile.
export type ProductMeta = { image?: string; subtitle?: string; unit?: string }

export const DEFAULT_CATALOG: Record<string, ProductMeta> = {
  'amul milk 1l': { image: '/products/amul-milk.png', subtitle: 'Fresh & Pure' },
  'brown bread': { image: '/products/brown-bread.png', subtitle: 'Healthy Choice' },
  'maggi 2-minute noodles': { image: '/products/maggi.png', subtitle: 'Masala' },
  banana: { image: '/products/banana.png', subtitle: 'Fresh Fruits', unit: 'kg' },
  'nestle dahi': { image: '/products/nestle-dahi.png', subtitle: 'Creamy & Thick' },
  'yoga bar oats': { image: '/products/yoga-bar-oats.png', subtitle: 'High Protein' },
}

type Props = {
  lines: CartLine[]
  memberCount: number
  store?: string
  storeUrl?: string // kept so existing callers don't break; not shown
  savedEst?: number
  catalog?: Record<string, ProductMeta>
  logoSrc?: string // your logo.png
  hostel?: string // text inside the top-right pill
  onBack?: () => void
}

function Thumb({ line, meta }: { line: CartLine; meta?: ProductMeta }) {
  const [failed, setFailed] = useState(false)
  if (meta?.image && !failed) {
    return (
      <div style={{ width: 64, height: 64, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={meta.image}
          alt={line.name}
          onError={() => setFailed(true)}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>
    )
  }
  return (
    <div className="ctb-tile" style={{ width: 64, height: 64, background: 'rgba(255,255,255,.06)', color: '#f97810' }}>
      {line.name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function CartToBuild({
  lines = [],
  memberCount = 0,
  store,
  savedEst = 0,
  catalog = DEFAULT_CATALOG,
  logoSrc = '/logo.png',
  hostel = 'Hostl Block A',
  onBack,
}: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatCartText(lines, store))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="ctb" style={{ paddingTop: 6 }}>
      {/* Top bar: back, logo, hostel pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button
            onClick={onBack ?? (() => window.history.back())}
            aria-label="Back"
            style={{ background: 'none', border: 0, padding: 4, color: '#fff', display: 'flex' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <img src={logoSrc} alt="KartMeto" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        </div>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', whiteSpace: 'nowrap',
            background: '#14171c', border: '1px solid #2a2d35', borderRadius: 14, fontSize: 12.5, fontWeight: 500,
          }}
        >
          <i style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          {hostel} • Active
        </div>
      </div>

      {/* Title */}
      <div className="hcc-title" style={{ gap: 18, marginBottom: 14 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97810" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h2.5l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20 7H5.4" />
          <circle cx="9" cy="19.5" r="1.4" />
          <circle cx="17" cy="19.5" r="1.4" />
        </svg>
        <div>
          <h2 style={{ fontSize: 26 }}>Cart to Build</h2>
          <p style={{ fontSize: 15 }}>Consolidated list from your pool</p>
        </div>
      </div>

      {/* Summary */}
      <div className="ctb-sum" style={{ padding: '12px 16px', gap: 12, marginBottom: 16 }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="#f97810" style={{ flex: 'none' }}>
          <circle cx="12" cy="8" r="3" />
          <circle cx="5.5" cy="9.5" r="2.2" />
          <circle cx="18.5" cy="9.5" r="2.2" />
          <path d="M12 12.5c-3 0-5.5 1.6-5.5 4V18h11v-1.5c0-2.4-2.5-4-5.5-4Z" />
          <path d="M5.5 12.8C3.5 12.8 2 14 2 15.6V17h3.5v-.6c0-1.3.6-2.4 1.6-3.3-.5-.2-1-.3-1.6-.3Z" />
          <path d="M18.5 12.8c-.6 0-1.1.1-1.6.3 1 .9 1.6 2 1.6 3.3v.6H22v-1.4c0-1.6-1.5-2.8-3.5-2.8Z" />
        </svg>
        <div style={{ minWidth: 0 }}>
          <b style={{ fontSize: 14.5, whiteSpace: 'nowrap' }}>{memberCount} members • 1 shared cart</b>
          <small style={{ fontSize: 12.5 }}>Save more together!</small>
        </div>
        {savedEst > 0 && (
          <span className="ctb-saved" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4C9 4 4 9 4 15c0 1.5.4 2.8 1 4 1-4 4-8 9-10-4 3-6 6-7 11 1 .6 2.3 1 3.8 1C17 21 20 14 20 4Z" />
            </svg>
            ₹{savedEst}+ Saved
          </span>
        )}
      </div>

      {/* Items */}
      <div className="ctb-list">
        {lines.map((l) => {
          const meta = catalog[l.key]
          return (
            <div key={l.key} className="ctb-row" style={{ gap: 16, padding: '8px 16px 8px 14px' }}>
              <Thumb line={l} meta={meta} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block', fontSize: 16.5 }}>{l.name}</b>
                {meta?.subtitle && <small style={{ color: '#9aa0a6', fontSize: 13 }}>{meta.subtitle}</small>}
              </div>
              <span className="ctb-qty" style={{ padding: '10px 18px', fontSize: 16, whiteSpace: 'nowrap', background: '#1f2228' }}>
                x{l.qty}
                {meta?.unit ? ` ${meta.unit}` : ''}
              </span>
            </div>
          )
        })}
        {lines.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#9aa0a6' }}>No items in the pool yet</div>
        )}
      </div>

      {/* Sticky Copy button */}
      <div className="hcc-dock">
        <button className="hcc-share" onClick={copy} disabled={lines.length === 0} style={{ height: 52, fontSize: 17 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V6a2 2 0 0 1 2-2h9" />
          </svg>
          {copied ? 'Copied!' : 'Copy Full List'}
        </button>
      </div>
    </div>
  )
}
