import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllAgents } from '../../api/agents'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getInitials } from '../../utils/formatters'
import useSocketEvent from '../../hooks/useSocket'
import { useSocket } from '../../context/SocketContext'

const AV_COLORS = [
  { bg: 'var(--accent-light)',  color: 'var(--brand)' },
  { bg: 'var(--green-light)',   color: 'var(--green-dark)' },
  { bg: 'var(--purple-light)',  color: 'var(--purple-dark)' },
  { bg: 'var(--amber-light)',   color: 'var(--amber-dark)' },
]

// Icons
const IconFilter = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)
const IconUsers = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconTruck = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)

export default function AgentsList() {
  const [agents,  setAgents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const navigate = useNavigate()
  const socket = useSocket()

  useEffect(() => {
    getAllAgents().then(r => { setAgents(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (socket) socket.emit('join:admin')
  }, [socket])

  useSocketEvent('agent:toggle', useCallback(data => {
    setAgents(prev => prev.map(a => {
      const matchId = a.user?._id || a.user || ''
      return matchId === data.agentId ? { ...a, isOnline: data.isOnline } : a
    }))
  }, []))

  useSocketEvent('agent:rating', useCallback(data => {
    setAgents(prev => prev.map(a => {
      const matchId = a.user?._id || a.user || ''
      return matchId === data.agentId ? { ...a, rating: data.rating } : a
    }))
  }, []))

  useSocketEvent('order:status', useCallback(data => {
    if (data.status === 'delivered') {
      setAgents(prev => prev.map(a => {
        const matchId = a.user?._id || a.user || ''
        return matchId === data.agentId ? { ...a, totalDeliveries: (a.totalDeliveries || 0) + 1 } : a
      }))
    }
  }, []))

  useSocketEvent('agent:profile_update', useCallback(data => {
    setAgents(prev => prev.map(a => {
      const matchId = a.user?._id || a.user || ''
      if (matchId === data.agentId) {
        const updatedUser = a.user && typeof a.user === 'object' ? { ...a.user, phone: data.phone } : a.user
        return { ...a, user: updatedUser, vehicleType: data.vehicleType }
      }
      return a
    }))
  }, []))

  const online  = agents.filter(a => a.isOnline || a.profile?.isOnline)
  const offline = agents.filter(a => !(a.isOnline || a.profile?.isOnline))
  const filtered = filter === 'all' ? agents : filter === 'online' ? online : offline

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Agents</div>
        <div className="topbar-actions">
          <button className="tb-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconFilter /> Filter
          </button>
        </div>
      </div>

      <div className="page-scroll">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { label: 'Total Agents',  val: agents.length,  Icon: IconUsers, color: 'var(--text-primary)' },
            { label: 'Online Now',    val: online.length,   Icon: IconUsers, color: 'var(--green)' },
            { label: 'On Delivery',   val: agents.filter(a => a.activeOrder || a.stats?.active > 0).length, Icon: IconTruck, color: 'var(--amber)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--bg-input)', color: s.color }}>
                <s.Icon />
              </div>
              <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="section-header">
            <div className="section-title">All Agents</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all','All'],['online','Online'],['offline','Offline']].map(([v,l]) => (
                <div key={v} className={`filter-chip ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</div>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            {loading ? <LoadingSpinner /> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Deliveries</th>
                    <th>Rating</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((agent, i) => {
                    const av = AV_COLORS[i % AV_COLORS.length]
                    const profile = agent.profile || agent || {}
                    const isOnline = agent.isOnline || profile.isOnline
                    const user = agent.user || {}
                    const vehicleLabel = { bike: 'Bike', cycle: 'Cycle', walk: 'Walk' }[agent.vehicleType || profile.vehicleType] || 'Bike'
                    const userId = user._id || agent.user || agent._id
                    return (
                      <tr key={agent._id}>
                        <td>
                          <div className="td-agent-wrap">
                            <div className="td-av" style={{ background: av.bg, color: av.color }}>
                              {getInitials(user.name || '')}
                            </div>
                            <div>
                              <div className="td-name">{user.name || '—'}</div>
                              <div className="td-sub">{user.email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{vehicleLabel}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? 'var(--green)' : 'var(--text-tertiary)', display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: isOnline ? 'var(--green)' : 'var(--text-secondary)' }}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {(agent.currentLocation || profile.currentLocation)
                            ? `${(agent.currentLocation || profile.currentLocation).lat?.toFixed(4)}, ${(agent.currentLocation || profile.currentLocation).lng?.toFixed(4)}`
                            : 'Not sharing'}
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: 'Orbitron, sans-serif', fontSize: 11 }}>
                          {agent.totalDeliveries || profile.totalDeliveries || 0}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            {(agent.rating || profile.rating || 5.0).toFixed(1)}
                          </span>
                        </td>
                        <td>
                          <button className="view-btn" onClick={() => navigate(`/admin/agents/${userId}`)}>View</button>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 28 }}>No agents found</td></tr>
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