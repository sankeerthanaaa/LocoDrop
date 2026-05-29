import { useState, useEffect } from 'react'
import { getAllOrders } from '../../api/orders'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import NotificationBell from '../../components/common/NotificationBell'
import { formatPrice, formatTime, getInitials } from '../../utils/formatters'
import { useNavigate } from 'react-router-dom'

const FILTERS = ['All', 'posted', 'accepted', 'picked_up', 'delivered', 'cancelled']

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
          <button className="tb-btn">📥 Export</button>
          <NotificationBell />
        </div>
      </div>

      <div className="page-scroll">
        <div className="stats-grid">
          {[
            { label:'Total Orders', val: stats.total,     icon:'📦', bg:'var(--accent-light)',  color:'var(--accent)',  change:'↑ 12% this week' },
            { label:'Delivered',    val: stats.delivered, icon:'✅', bg:'var(--green-light)',   color:'var(--green)',   change:'↑ 8% this week' },
            { label:'Active Now',   val: stats.active,    icon:'🛵', bg:'var(--amber-light)',   color:'var(--amber)',   change:'Live count' },
            { label:'Pending',      val: stats.posted,    icon:'⏳', bg:'var(--purple-light)',  color:'var(--purple)',  change:'Awaiting agent' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>
                <span style={{ fontSize:17 }}>{s.icon}</span>
              </div>
              <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-change stat-up">{s.change}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:'0 18px 18px' }}>
          <div className="section-header">
            <div className="section-title">All Orders</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {FILTERS.map(f => (
                <div key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'All' ? 'All' : f.replace('_',' ')}
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
                    <tr key={order._id} style={{ cursor:'pointer' }}>
                      <td className="td-id">#{order._id?.slice(-6).toUpperCase()}</td>
                      <td>
                        <div className="td-agent-wrap">
                          <div className="td-av" style={{ background:'var(--accent-light)', color:'var(--accent)' }}>
                            {getInitials(order.sender?.name || 'SN')}
                          </div>
                          <span className="td-name">{order.sender?.name || '—'}</span>
                        </div>
                      </td>
                      <td>
                        {order.agent ? (
                          <div className="td-agent-wrap">
                            <div className="td-av" style={{ background:'var(--green-light)', color:'var(--green-dark)' }}>
                              {getInitials(order.agent?.name || 'AG')}
                            </div>
                            <span className="td-name">{order.agent?.name}</span>
                          </div>
                        ) : <span style={{ color:'var(--text-3)', fontSize:11 }}>Unassigned</span>}
                      </td>
                      <td style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {order.pickupAddress}
                      </td>
                      <td><StatusBadge status={order.status} /></td>
                      <td style={{ fontWeight:600, color:'var(--green)' }}>{formatPrice(order.price)}</td>
                      <td style={{ color:'var(--text-2)' }}>{formatTime(order.createdAt)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-3)', padding:24 }}>No orders found</td></tr>
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