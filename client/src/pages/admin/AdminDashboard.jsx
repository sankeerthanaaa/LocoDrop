import { useState, useEffect } from 'react'
import { getAllOrders } from '../../api/orders'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import NotificationBell from '../../components/common/NotificationBell'
import { formatPrice, formatTime, getInitials } from '../../utils/formatters'
import { useNavigate } from 'react-router-dom'

const FILTERS = ['All', 'posted', 'accepted', 'picked_up', 'delivered', 'cancelled']

// Icons
const IconDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const IconPackage = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
)
const IconCheckCircle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconActivity = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const IconClock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

export default function AdminDashboard() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    getAllOrders().then(r => { setOrders(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const stats = {
    total:     orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    active:    orders.filter(o => ['accepted','picked_up'].includes(o.status)).length,
    posted:    orders.filter(o => o.status === 'posted').length,
  }

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter)

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Admin Dashboard</div>
        <div className="topbar-actions">
          <NotificationBell />
        </div>
      </div>

      <div className="page-scroll">
        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Orders',  val: stats.total,     Icon: IconPackage,     bg: 'var(--accent-light)',  color: 'var(--brand)',  change: '+12% this week' },
            { label: 'Delivered',     val: stats.delivered, Icon: IconCheckCircle, bg: 'var(--green-light)',   color: 'var(--green)',  change: '+8% this week' },
            { label: 'Active Now',    val: stats.active,    Icon: IconActivity,    bg: 'var(--amber-light)',   color: 'var(--amber)',  change: 'Live count' },
            { label: 'Pending',       val: stats.posted,    Icon: IconClock,       bg: 'var(--purple-light)',  color: 'var(--purple)', change: 'Awaiting agent' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <s.Icon />
              </div>
              <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-change stat-up">{s.change}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="section-header">
            <div className="section-title">All Orders</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <div key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'All' ? 'All' : f.replace('_', ' ')}
                </div>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            {loading ? <LoadingSpinner /> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Sender</th>
                    <th>Agent</th>
                    <th>Pickup</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => (
                    <tr key={order._id} style={{ cursor: 'pointer' }}>
                      <td className="td-id">#{order._id?.slice(-6).toUpperCase()}</td>
                      <td>
                        <div className="td-agent-wrap">
                          <div className="td-av" style={{ background: 'var(--accent-light)', color: 'var(--brand)' }}>
                            {getInitials(order.sender?.name || 'SN')}
                          </div>
                          <span className="td-name">{order.sender?.name || '—'}</span>
                        </div>
                      </td>
                      <td>
                        {order.agent ? (
                          <div className="td-agent-wrap">
                            <div className="td-av" style={{ background: 'var(--green-light)', color: 'var(--green-dark)' }}>
                              {getInitials(order.agent?.name || 'AG')}
                            </div>
                            <span className="td-name">{order.agent?.name}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>Unassigned</span>}
                      </td>
                      <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.pickupAddress}
                      </td>
                      <td><StatusBadge status={order.status} /></td>
                      <td style={{ fontWeight: 700, color: 'var(--green)', fontFamily: 'Orbitron, sans-serif', fontSize: 11 }}>{formatPrice(order.price)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{formatTime(order.createdAt)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 28 }}>No orders found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}