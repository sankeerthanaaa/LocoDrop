import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllAgents } from '../../api/agents'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { getInitials } from '../../utils/formatters'
import useSocketEvent from '../../hooks/useSocket'
import { useSocket } from '../../context/SocketContext'

const AV_COLORS = [
  { bg:'var(--accent-light)', color:'var(--accent)' },
  { bg:'var(--green-light)',  color:'var(--green-dark)' },
  { bg:'var(--purple-light)', color:'var(--purple-dark)' },
  { bg:'var(--amber-light)',  color:'var(--amber-dark)' },
]

export default function AgentsList() {
  const [agents,  setAgents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const navigate = useNavigate()
  const socket = useSocket()

  useEffect(() => {
    getAllAgents().then(r => { setAgents(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  // Join admin room for real-time broadcasts
  useEffect(() => {
    if (socket) {
      socket.emit('join:admin')
    }
  }, [socket])

  // Socket: Agent toggles online/offline
  useSocketEvent('agent:toggle', useCallback((data) => {
    setAgents(prev => prev.map(a => {
      const matchId = a.user?._id || a.user || '';
      if (matchId === data.agentId) {
        return { ...a, isOnline: data.isOnline }
      }
      return a
    }))
  }, []))

  // Socket: Agent rating gets updated
  useSocketEvent('agent:rating', useCallback((data) => {
    setAgents(prev => prev.map(a => {
      const matchId = a.user?._id || a.user || '';
      if (matchId === data.agentId) {
        return { ...a, rating: data.rating }
      }
      return a
    }))
  }, []))

  // Socket: Order completed (status = delivered), increment delivery count
  useSocketEvent('order:status', useCallback((data) => {
    if (data.status === 'delivered') {
      setAgents(prev => prev.map(a => {
        const matchId = a.user?._id || a.user || '';
        if (matchId === data.agentId) {
          return { ...a, totalDeliveries: (a.totalDeliveries || 0) + 1 }
        }
        return a
      }))
    }
  }, []))

  // Socket: Agent profile updated (phone / vehicleType)
  useSocketEvent('agent:profile_update', useCallback((data) => {
    setAgents(prev => prev.map(a => {
      const matchId = a.user?._id || a.user || '';
      if (matchId === data.agentId) {
        const updatedUser = a.user && typeof a.user === 'object' ? { ...a.user, phone: data.phone } : a.user
        return { ...a, user: updatedUser, vehicleType: data.vehicleType }
      }
      return a
    }))
  }, []))

  const online  = agents.filter(a => a.isOnline || a.profile?.isOnline)
  const offline = agents.filter(a => !(a.isOnline || a.profile?.isOnline))

  const filtered = filter === 'all'    ? agents
                 : filter === 'online' ? online
                 : offline

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Agents</div>
        <div className="topbar-actions">
          <button className="tb-btn">🔽 Filter</button>
        </div>
      </div>

      <div className="page-scroll">
        {/* Mini stats */}
        <div className="stats-grid stats-grid-3" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
          {[
            { label:'Total Agents', val: agents.length,  color:'var(--text-1)' },
            { label:'Online Now',   val: online.length,  color:'var(--green)' },
            { label:'On Delivery',  val: agents.filter(a => a.activeOrder || a.stats?.active > 0).length, color:'var(--amber)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:'0 18px 18px' }}>
          <div className="section-header">
            <div className="section-title">All Agents</div>
            <div style={{ display:'flex', gap:6 }}>
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
                    const vehicleEmoji = { bike:'🛵', cycle:'🚲', walk:'🚶' }[agent.vehicleType || profile.vehicleType] || '🛵'
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
                        <td>{vehicleEmoji} {agent.vehicleType || profile.vehicleType || 'Bike'}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center' }}>
                            <span className={isOnline ? 'online-dot' : 'offline-dot'} />
                            <span style={{ fontSize:11, color: isOnline ? 'var(--green)' : 'var(--text-2)' }}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize:11, color:'var(--text-2)' }}>
                          {(agent.currentLocation || profile.currentLocation) ? `${(agent.currentLocation || profile.currentLocation).lat?.toFixed(4)}, ${(agent.currentLocation || profile.currentLocation).lng?.toFixed(4)}` : 'Not sharing'}
                        </td>
                        <td style={{ fontWeight:600 }}>{agent.totalDeliveries || profile.totalDeliveries || 0}</td>
                        <td>⭐ {(agent.rating || profile.rating || 5.0).toFixed(1)}</td>
                        <td><button className="view-btn" onClick={() => navigate(`/admin/agents/${userId}`)}>View</button></td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-3)', padding:24 }}>No agents found</td></tr>
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