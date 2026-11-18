import type { Trust } from '../lib/useTrust'
import './host.css'

type Props = {
  open: boolean
  onClose: () => void
  name: string
  avatarUrl?: string | null
  joinedAt?: string
  loading?: boolean
  trust: Trust | null
}

const R = 52
const C = 2 * Math.PI * R

export default function TrustScoreModal({ open, onClose, name, avatarUrl, joinedAt, loading, trust }: Props) {
  if (!open) return null
  const rate = trust?.payRate ?? null
  const verdict =
    rate === null ? { t: 'New member', d: 'No payment history yet', tone: 'new' }
    : rate >= 90 ? { t: 'Pays on time', d: 'A reliable member of the pool', tone: 'good' }
    : rate >= 70 ? { t: 'Mostly on time', d: 'Has paid late a few times', tone: 'mid' }
    : { t: 'Often late to pay', d: 'Has been removed for non-payment', tone: 'bad' }
  const time = joinedAt ? new Date(joinedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''

  return (
    <div className="tsm-back" onClick={onClose}>
      <div className="tsm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="tsm-x" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className="tsm-av">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{(name[0] ?? '?').toUpperCase()}</span>}</div>
        <h3>{name}</h3>
        {time && <p className="tsm-join"><i />Joined • {time}</p>}

        <div className="tsm-mid">
          <div className="tsm-ring">
            <svg width="132" height="132" viewBox="0 0 132 132">
              <circle cx="66" cy="66" r={R} fill="none" stroke="#2a2d35" strokeWidth="9" />
              {rate !== null && (
                <circle cx="66" cy="66" r={R} fill="none" stroke="#f97810" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${(C * rate) / 100} ${C}`} transform="rotate(-90 66 66)" />
              )}
            </svg>
            <div><b>{loading ? '…' : rate === null ? '—' : `${rate}%`}</b><small>Trust Score</small></div>
          </div>
          <div className="tsm-verdict">
            <span className={`tsm-shield ${verdict.tone}`}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5l8-3z" /><path d="M8 12l3 3 5-6" fill="none" stroke="#0a0e11" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div><b>{verdict.t}</b><small>{verdict.d}</small></div>
          </div>
        </div>

        <div className="tsm-stats">
          <div><b>{trust?.poolsJoined ?? '—'}</b><small>Total Pools</small></div>
          <div><b className="g">{trust?.savedEst ? `₹${trust.savedEst}` : '—'}</b><small>Est. Saved</small></div>
          <div><b>{trust?.daysActive ?? '—'}</b><small>Days Active</small></div>
        </div>
        {trust && trust.removedUnpaid > 0 && <p className="tsm-warn">Removed for non-payment: {trust.removedUnpaid}</p>}

        <button className="tsm-close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
