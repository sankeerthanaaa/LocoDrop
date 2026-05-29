import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/formatters'

const SENDER_LINKS = [
  { label: 'Dashboard',  path: '/sender/dashboard', icon: '🗂️' },
  { label: 'Post Order', path: '/sender/post',       icon: '➕' },
]

const AGENT_LINKS = [
  { label: 'Dashboard',       path: '/agent/dashboard', icon: '🗺️' },
  { label: 'Active Delivery', path: '/agent/active',    icon: '🛵' },
  { label: 'Profile',         path: '/agent/profile',   icon: '👤' },
]

const ADMIN_LINKS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
  { label: 'Agents',    path: '/admin/agents',    icon: '👥' },
]

const LINKS_BY_ROLE = { sender: SENDER_LINKS, agent: AGENT_LINKS, admin: ADMIN_LINKS }

const roleColor = { sender: '#EEF1FE', agent: '#DCFCE7', admin: '#EDE9FE' }
const roleBg    = { sender: '#4F6EF7', agent: '#22C55E', admin: '#8B5CF6' }

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  if (!user) return null

  const links = LINKS_BY_ROLE[user.role] || []

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-brand-icon"></div>
        <div>
          <div className="sb-brand-name">LocoDrop</div>
          <div className="sb-brand-role">{user.role}</div>
        </div>
      </div>

      {/* Search */}
      <div className="sb-search">
        <div className="sb-search-wrap">
          <span className="sb-search-icon">🔍</span>
          <input placeholder="Search..." />
        </div>
      </div>

      {/* Nav links */}
      <div className="sb-nav">
        <div className="sb-section-label">Menu</div>
        {links.map(({ label, path, icon }) => (
          <div
            key={path}
            className={`sb-nav-item ${pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div className="sb-footer">
        <div className="sb-user">
          <div
            className="sb-user-av"
            style={{ background: roleColor[user.role], color: roleBg[user.role] }}
          >
            {getInitials(user.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sb-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div className="sb-user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
          <button
            className="sb-logout-btn"
            onClick={() => { logout(); navigate('/login') }}
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </div>
  )
}