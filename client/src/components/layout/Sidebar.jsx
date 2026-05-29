// import { NavLink, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext.jsx';
// import NotificationBell from '../common/NotificationBell.jsx';

// const NAV_LINKS = {
//   sender: [
//     { to: '/sender/dashboard', icon: '⊞', label: 'Dashboard' },
//     { to: '/sender/post',      icon: '＋', label: 'New Delivery' },
//   ],
//   agent: [
//     { to: '/agent/dashboard', icon: '⊞', label: 'Dashboard' },
//     { to: '/agent/active',    icon: '🛵', label: 'Active Delivery' },
//   ],
//   admin: [
//     { to: '/admin/dashboard', icon: '⊞', label: 'Dashboard' },
//     { to: '/admin/agents',    icon: '👥', label: 'Agents' },
//   ],
// };

// const ROLE_LABELS = { sender: 'Sender', agent: 'Agent', admin: 'Admin' };

// const Sidebar = ({ isOnline, onToggleOnline, togglingOnline }) => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const links = NAV_LINKS[user?.role] || [];

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   return (
//     <aside className="sidebar">
//       {/* Logo / User */}
//       <div className="sidebar-logo">
//         <div className="sidebar-logo-icon">L</div>
//         <div>
//           <div className="sidebar-logo-name">{user?.name || 'LocoDrop'}</div>
//           <div className="sidebar-logo-email">{user?.email}</div>
//         </div>
//       </div>

//       {/* Search bar */}
//       <div className="sidebar-search">
//         <span className="sidebar-search-icon">🔍</span>
//         <input placeholder="Search..." readOnly />
//         <span className="sidebar-search-kbd">⌘K</span>
//       </div>

//       {/* Agent online toggle */}
//       {user?.role === 'agent' && (
//         <button
//           className="online-toggle"
//           onClick={onToggleOnline}
//           disabled={togglingOnline}
//           style={{ cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
//         >
//           <span className="online-toggle-label">
//             {isOnline ? '🟢 Online' : '⚫ Offline'}
//           </span>
//           <div className={`toggle-switch ${isOnline ? 'on' : ''}`} />
//         </button>
//       )}

//       {/* Nav links */}
//       <nav className="sidebar-nav">
//         <span className="nav-label">{ROLE_LABELS[user?.role] || 'Menu'}</span>
//         {links.map((link) => (
//           <NavLink
//             key={link.to}
//             to={link.to}
//             className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
//           >
//             <span className="nav-icon">{link.icon}</span>
//             {link.label}
//             {link.badge != null && (
//               <span className="nav-badge">{link.badge}</span>
//             )}
//           </NavLink>
//         ))}

//         <span className="nav-label" style={{ marginTop: 12 }}>Account</span>
//         <NavLink to="/help" className="nav-item">
//           <span className="nav-icon">ⓘ</span>
//           Help &amp; Support
//         </NavLink>
//         <button
//           onClick={handleLogout}
//           className="nav-item"
//           style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
//         >
//           <span className="nav-icon">↩</span>
//           Logout
//         </button>
//       </nav>

//       {/* Upgrade / Info card */}
//       <div className="sidebar-upgrade">
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <span className="sidebar-upgrade-title">LocoDrop</span>
//           <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>
//             {ROLE_LABELS[user?.role]}
//           </span>
//         </div>
//         <p className="sidebar-upgrade-sub">
//           {user?.role === 'sender' && 'Post deliveries and track them in real-time.'}
//           {user?.role === 'agent'  && 'Accept nearby orders and earn on every delivery.'}
//           {user?.role === 'admin'  && 'Monitor all deliveries and manage agents.'}
//         </p>
//         <div className="sidebar-upgrade-bar">
//           <div className="sidebar-upgrade-bar-fill" style={{ width: '60%' }} />
//         </div>
//         <button className="sidebar-upgrade-btn">View Profile</button>
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;