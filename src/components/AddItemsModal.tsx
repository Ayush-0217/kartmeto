import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Item = { id: string; name: string; price: string; qty: number }
type Props = {
  orderId: string
  platformName: string
  communityName: string
  initialItems?: { name: string; price: number; qty: number }[]
  onClose: () => void
  onDone: () => void
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

let seq = 0
const newId = () => `i${++seq}-${Date.now()}`

export default function AddItemsModal({ orderId, platformName, communityName, initialItems, onClose, onDone }: Props) {
  const [tab, setTab] = useState<'link' | 'manual'>('manual')
  // Editing starts from the member's existing items so a re-submit never wipes them.
  const [items, setItems] = useState<Item[]>(() =>
    initialItems && initialItems.length > 0
      ? initialItems.map((it) => ({ id: newId(), name: it.name, price: String(it.price), qty: it.qty }))
      : [{ id: newId(), name: '', price: '', qty: 1 }],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (id: string, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id: string) => setItems((arr) => (arr.length > 1 ? arr.filter((it) => it.id !== id) : arr))
  const addRow = () => setItems((arr) => [...arr, { id: newId(), name: '', price: '', qty: 1 }])

  const valid = items.filter((it) => it.name.trim() && Number(it.price) > 0)
  const totalQty = valid.reduce((s, it) => s + it.qty, 0)
  const subtotal = valid.reduce((s, it) => s + Number(it.price) * it.qty, 0)

  async function confirm() {
    if (valid.length === 0) { setError('Kam se kam ek item add karo (naam + price).'); return }
    setSaving(true)
    setError(null)
    const payload = valid.map((it) => ({ name: it.name.trim(), price: Number(it.price), qty: it.qty }))
    const { error: rpcErr } = await supabase.rpc('submit_my_items', {
      p_order_id: orderId,
      p_items_json: JSON.stringify(payload),
    })
    setSaving(false)
    if (rpcErr) { setError(rpcErr.message); return }
    onDone()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <h2 className="sheet-title">Add Your Items</h2>
            <p className="sheet-sub">{platformName} Pool ({communityName})</p>
          </div>
          <button className="sheet-x" onClick={onClose} aria-label="Close"><XIcon /></button>
        </div>

        <div className="act-tabs" style={{ margin: '16px 0' }}>
          <button className={`act-tab ${tab === 'link' ? 'on' : ''}`} onClick={() => setTab('link')}>Paste Item Link</button>
          <button className={`act-tab ${tab === 'manual' ? 'on' : ''}`} onClick={() => setTab('manual')}>Quick Manual Add</button>
        </div>

        {tab === 'link' && (
          <div className="link-disabled">
            <input className="paste-input" placeholder="Paste Blinkit/Zepto product link here…" disabled />
            <p className="muted" style={{ marginTop: 10 }}>
              Coming soon — auto-fetching product name/price needs a backend scraper jo abhi nahi bana. Filhaal "Quick Manual Add" use karo.
            </p>
          </div>
        )}

        {tab === 'manual' && (
          <>
            {items.map((it) => (
              <div className="item-card" key={it.id}>
                <div className="item-row">
                  <label className="item-label">Item Name</label>
                  <button className="item-remove" onClick={() => remove(it.id)} aria-label="Remove item"><XIcon /></button>
                </div>
                <input className="item-input" value={it.name} onChange={(e) => update(it.id, { name: e.target.value })} placeholder="e.g. Amul Milk 1L" />
                <div className="item-row" style={{ marginTop: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label className="item-label">Estimated Price (₹)</label>
                    <input className="item-input" type="number" min="0" value={it.price} onChange={(e) => update(it.id, { price: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <label className="item-label">Quantity</label>
                    <div className="qty-stepper">
                      <button onClick={() => update(it.id, { qty: Math.max(1, it.qty - 1) })}>−</button>
                      <span>{it.qty}</span>
                      <button onClick={() => update(it.id, { qty: it.qty + 1 })}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button className="add-item-btn" onClick={addRow}>+ Add Another Item</button>

            <div className="order-summary">
              <h3 className="sum-title">Order Summary</h3>
              <div className="sum-row"><span>Total Products</span><b>{valid.length}</b></div>
              <div className="sum-row"><span>Total Quantity</span><b>{totalQty}</b></div>
              <div className="sum-row"><span>Items Subtotal</span><b>₹{subtotal}</b></div>
            </div>

            {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}

            <button className="cta" style={{ marginTop: 16 }} disabled={saving} onClick={confirm}>
              {saving ? 'Saving…' : `Confirm & Add ${valid.length} Item${valid.length === 1 ? '' : 's'}`}
            </button>
            <p className="muted" style={{ textAlign: 'center', marginTop: 8 }}>All items will be added to your shared pool.</p>
          </>
        )}
      </div>
    </div>
  )
}
