import { useState } from 'react'
import { Link } from 'react-router-dom'

// ⚠️ TEMPORARY — hardcoded dummy data sirf visual check ke liye.
// Real version (useActivity hook se DB data) baad me wapas lagayenge.

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6M20 4L10 14M6 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1" />
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}
function WalletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" />
    </svg>
  )
}

const DUMMY_AVATARS = ['/avatars/rohan.png', '/avatars/aman.png', '/avatars/vikas.png', '/avatars/sahil.png']

export default function Activity() {
  const [tab, setTab] = useState<'ongoing' | 'past'>('ongoing')

  return (
    <div style={{ paddingTop: 4 }}>
      <h2 className="ap-title">Activity</h2>

      <div className="act-tabs">
        <button className={`act-tab ${tab === 'ongoing' ? 'on' : ''}`} onClick={() => setTab('ongoing')}>Ongoing (1)</button>
        <button className={`act-tab ${tab === 'past' ? 'on' : ''}`} onClick={() => setTab('past')}>Past Pools</button>
      </div>

      {tab === 'ongoing' && (
        <>
          <div className="card live-pool">
            <div className="live-head">
              <span className="live-dot" />
              <span className="live-label">LIVE ORDER POOL</span>
              <span className="live-sep">|</span>
              <span className="live-platform">Blinkit</span>
              <Link to="/pool/dummy" className="live-link" aria-label="Open pool room"><ExternalIcon /></Link>
            </div>
            <h3 className="live-title">Block A - Room 302 Group</h3>
            <div className="avatars">
              {DUMMY_AVATARS.map((src) => <img key={src} className="avatar" src={src} alt="" />)}
              <span className="avatar more">+0</span>
            </div>
            <ol className="timeline">
              <li className="tl-step done">
                <span className="tl-dot"><CheckIcon /></span>
                <div className="tl-text">
                  <div className="tl-title">Pool Locked & Order Placed</div>
                  <div className="tl-sub">Today, 09:10 PM</div>
                </div>
              </li>
              <li className="tl-step active">
                <span className="tl-dot"><span className="tl-pip" /></span>
                <div className="tl-text">
                  <div className="tl-title">Out for Delivery by Blinkit rider</div>
                  <div className="tl-sub ending">Estimated: 10–15 min</div>
                </div>
              </li>
              <li className="tl-step pending">
                <span className="tl-dot" />
                <div className="tl-text">
                  <div className="tl-title">Arriving at Hostel Main Gate</div>
                </div>
              </li>
            </ol>
            <hr className="live-hr" />
            <div className="live-fee">
              <WalletIcon />
              <span>Your item split: ₹120 • You saved <b className="save">₹35</b> on delivery fee</span>
            </div>
            <Link to="/pool/dummy" className="cta-sm outline">View Items & Code</Link>
          </div>

          <h3 className="sec">Completed Pools</h3>
          <div className="done-list">
            <Link to="/pool/dummy2" className="done-pool">
              <img className="card-logo" src="/logos/blinkit-tile.png" alt="Blinkit" />
              <div className="done-text">
                <div className="done-when">Completed yesterday at 11:20 PM</div>
                <div className="done-saved">Saved ₹40</div>
              </div>
              <span className="done-badge"><CheckIcon /> Delivered</span>
              <ChevronIcon />
            </Link>
          </div>
        </>
      )}

      {tab === 'past' && (
        <div className="done-list" style={{ marginTop: 4 }}>
          <Link to="/pool/dummy2" className="done-pool">
            <img className="card-logo" src="/logos/blinkit-tile.png" alt="Blinkit" />
            <div className="done-text">
              <div className="done-when">Completed yesterday at 11:20 PM</div>
              <div className="done-saved">Saved ₹40</div>
            </div>
            <span className="done-badge"><CheckIcon /> Delivered</span>
            <ChevronIcon />
          </Link>
        </div>
      )}
    </div>
  )
}
