import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/formatters'

// SVG Icon set — no emojis
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconTruck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconLogOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const IconDispatch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="18" r="2.5" />
    <circle cx="19" cy="18" r="2.5" />
    <path d="M5 18l4.5-6h5.5l3 6M10 12l1.5-4.5h4" />
    <circle cx="14" cy="3" r="1.2" fill="currentColor" stroke="none" />
    <path d="M12 7.5L13.5 4h2l2 3.5" />
    <rect x="7" y="4.5" width="3.5" height="4.5" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
)

const SENDER_LINKS = [
  { label: 'Dashboard',  path: '/sender/dashboard', Icon: IconGrid },
  { label: 'Post Order', path: '/sender/post',       Icon: IconPlus },
]
const AGENT_LINKS = [
  { label: 'Dashboard',       path: '/agent/dashboard', Icon: IconGrid },
  { label: 'Active Delivery', path: '/agent/active',    Icon: IconTruck },
  { label: 'Profile',         path: '/agent/profile',   Icon: IconUser },
]
const ADMIN_LINKS = [
  { label: 'Dashboard', path: '/admin/dashboard', Icon: IconBarChart },
  { label: 'Agents',    path: '/admin/agents',    Icon: IconUsers },
]
const LINKS_BY_ROLE = { sender: SENDER_LINKS, agent: AGENT_LINKS, admin: ADMIN_LINKS }

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  if (!user) return null

  const links = LINKS_BY_ROLE[user.role] || []

  return (
    <>
      <div className="sidebar">
        {/* Brand */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <IconDispatch />
          </div>
          <div>
            <div className="sidebar-logo-name">LocoDrop</div>
            <div className="sidebar-logo-email" style={{ textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="nav-label">Menu</span>
          {links.map(({ label, path, Icon }) => (
            <div
              key={path}
              className={`nav-item ${pathname === path ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <span className="nav-icon"><Icon /></span>
              {label}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="sidebar-user">
          <div className="sidebar-user-av">{getInitials(user.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 'var(--radius-sm)', transition: 'color var(--transition)' }}
            onClick={() => { logout(); navigate('/login') }}
            title="Logout"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            <IconLogOut />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-nav">
        {links.map(({ label, path, Icon }) => (
          <div
            key={path}
            className={`mobile-nav-item ${pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <span className="mobile-nav-icon"><Icon /></span>
            <span className="mobile-nav-label">{label}</span>
          </div>
        ))}
        <div
          className="mobile-nav-item"
          onClick={() => { logout(); navigate('/login') }}
        >
          <span className="mobile-nav-icon" style={{ color: 'var(--red)' }}><IconLogOut /></span>
          <span className="mobile-nav-label" style={{ color: 'var(--red)' }}>Logout</span>
        </div>
      </div>
    </>
  )
}