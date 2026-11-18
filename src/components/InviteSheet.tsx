import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { platformOf } from '../lib/platforms'
import PlatformLogo from './PlatformLogo'

type Props = {
  orderId: string
  platformName: string
  communityName: string
  onClose: () => void
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9cbd0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  )
}
function LinkIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c9cbd0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
    </svg>
  )
}
function DotsIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  )
}
function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  )
}

// Real logo image only; renders nothing if the file is missing (no fake icon)
function ShareImg({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return <img className="inv-app-img" src={src} alt={alt} onError={() => setOk(false)} />
}

export default function InviteSheet({ orderId, platformName, communityName, onClose }: Props) {
  const plat = platformOf(platformName)
  const [windowEnd, setWindowEnd] = useState<number | null>(null)
  const [maxMembers, setMaxMembers] = useState<number | null>(null)
  const [joined, setJoined] = useState(1)
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState<'' | 'link' | 'code'>('')

  // Load timer end, max members and current participant count from DB
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: o } = await supabase
        .from('order_requests').select('window_end, max_members').eq('id', orderId).maybeSingle()
      const { count } = await supabase
        .from('group_order_participants').select('user_id', { count: 'exact', head: true }).eq('order_request_id', orderId)
      if (!alive) return
      if (o) { setWindowEnd(new Date(o.window_end).getTime()); setMaxMembers(o.max_members ?? null) }
      if (count) setJoined(count)
    })()
    return () => { alive = false }
  }, [orderId])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const left = windowEnd ? Math.max(0, windowEnd - now) : 0
  const mm = String(Math.floor(left / 60000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')

  const code = `KM-${orderId.slice(0, 4).toUpperCase()}`
  const link = `${window.location.origin}/pool/${orderId}`
  const spots = maxMembers ? Math.max(0, maxMembers - joined) : null
  const shareText = `Join my ${platformName} Pool at ${communityName}! ${link}`

  async function copy(text: string, which: 'link' | 'code') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      window.prompt('Copy this:', text)
    }
  }
  function openWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }
  function openTelegram() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Join my ${platformName} Pool at ${communityName}!`)}`, '_blank')
  }
  async function moreApps() {
    if (navigator.share) {
      try { await navigator.share({ title: `${platformName} Pool`, text: shareText, url: link }) } catch { /* cancelled */ }
    } else {
      copy(link, 'link')
    }
  }

  return (
    <div className="inv-backdrop" onClick={onClose}>
      <div className="inv-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="inv-handle" />
        <h2 className="inv-title">Invite Hostel Mates to Save Delivery Fee</h2>

        <div className="inv-card">
          <div className="inv-logo"><PlatformLogo p={plat} kind="tile" /></div>
          <div className="inv-card-text">
            <div className="inv-line">
              Join my {platformName} Pool at {communityName}!{' '}
              {spots !== null
                ? <>{spots} spot{spots === 1 ? '' : 's'} left to get <b className="inv-free">FREE</b> delivery.</>
                : <>Spots open to get <b className="inv-free">FREE</b> delivery.</>}
            </div>
            <div className="inv-timer"><ClockIcon /><span>Timer: <b>{mm}:{ss} mins left.</b></span></div>
          </div>
        </div>

        <div className="inv-apps">
          <button className="inv-app" onClick={openWhatsApp}>
            <span className="inv-app-tile"><ShareImg src="/logos/whatsapp.png" alt="WhatsApp" /></span>
            <span className="inv-app-label">{communityName} WhatsApp Group</span>
          </button>
          <button className="inv-app" onClick={openTelegram}>
            <span className="inv-app-tile"><ShareImg src="/logos/telegram.png" alt="Telegram" /></span>
            <span className="inv-app-label">Hostel Telegram</span>
          </button>
          <button className="inv-app" onClick={() => copy(link, 'link')}>
            <span className="inv-app-tile"><LinkIcon /></span>
            <span className="inv-app-label">{copied === 'link' ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button className="inv-app" onClick={moreApps}>
            <span className="inv-app-tile"><DotsIcon /></span>
            <span className="inv-app-label">More Apps</span>
          </button>
        </div>

        <div className="inv-code-box">
          <div>
            <div className="inv-code-label">Pool Code:</div>
            <div className="inv-code">{code}</div>
          </div>
          <button className="inv-copy" onClick={() => copy(code, 'code')}>
            <CopyIcon />
            <span>{copied === 'code' ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <button className="inv-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
