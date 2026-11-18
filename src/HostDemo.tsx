import { useState } from 'react'

import HostCommandCenter, { type HostMember } from './components/HostCommandCenter'
import CartToBuild from './components/CartToBuild'
import SmartHandover, { type HandoverRoom } from './components/SmartHandover'
import TrustScoreModal from './components/TrustScoreModal'

import { aggregateItems } from './lib/cart'
// Visual check only (sample data). Open /demo/host. Delete this page once the real screens are wired.
const MEMBERS: HostMember[] = [
  { userId: 'a1', name: 'Ayush S.', joinedAt: '2026-11-10T21:12:00', status: 'confirmed', isHost: true },
  { userId: 'a2', name: 'Rohan S.', joinedAt: '2026-11-10T21:14:00', status: 'confirmed' },
  { userId: 'a3', name: 'Isha V.', joinedAt: '2026-11-10T21:16:00', status: 'unpaid' },
  { userId: 'a4', name: 'Devansh S.', joinedAt: '2026-11-10T21:18:00', status: 'marked_paid' },
]
const ITEMS = [
  JSON.stringify([{ name: 'Amul Milk 1L', qty: 2 }, { name: 'Brown Bread', qty: 1 }]),
  JSON.stringify([{ name: 'amul milk 1L', qty: 2 }, { name: 'Maggi 2-Minute Noodles', qty: 3 }, { name: 'Banana', qty: 1 }]),
]
const ROOMS: HandoverRoom[] = [
  { userId: 'a2', room: 'A-101', name: 'Rohan', summary: 'Milk, Bread, Maggi...', delivered: true },
  { userId: 'a3', room: 'A-104', name: 'Isha', summary: 'Milk, Bread...', delivered: false },
  { userId: 'a4', room: 'A-105', name: 'Devansh', summary: 'Snacks, Biscuits...', delivered: false },
]

export default function HostDemo() {
  const [tab, setTab] = useState<'host' | 'cart' | 'hand'>('host')
  const [modal, setModal] = useState(false)
  return (
    <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 25px' }}>
      <div style={{ display: 'flex', gap: 8, padding: '14px 0' }}>
        {(['host', 'cart', 'hand'] as const).map((t) => <button key={t} className="chip" onClick={() => setTab(t)}>{t}</button>)}
      </div>
      {tab === 'host' && <HostCommandCenter members={MEMBERS} finalFee={14} saved={26} threshold={199} cartTotal={150} onRemove={() => {}} onConfirm={() => {}} onOpenProfile={() => setModal(true)} onShare={() => {}} onCancelPool={() => {}} />}
      {tab === 'cart' && <CartToBuild lines={aggregateItems(ITEMS)} memberCount={3} store="Blinkit" storeUrl="https://blinkit.com" savedEst={26} />}
      {tab === 'hand' && <SmartHandover rooms={ROOMS} ready onConfirm={async (_u, pin) => (pin === '1234' ? null : 'Wrong PIN (demo PIN is 1234)')} />}
      <TrustScoreModal open={modal} onClose={() => setModal(false)} name="Ayush Solanki" joinedAt="2026-11-10T21:12:00" trust={{ payRate: 98, poolsJoined: 5, savedEst: 420, daysActive: 12, removedUnpaid: 0 }} />
    </div>
  )
}
