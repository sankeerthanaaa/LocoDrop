import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

const IconDispatch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="18" r="2.5" />
    <circle cx="19" cy="18" r="2.5" />
    <path d="M5 18l4.5-6h5.5l3 6M10 12l1.5-4.5h4" />
    <circle cx="14" cy="3" r="1.2" fill="currentColor" stroke="none" />
    <path d="M12 7.5L13.5 4h2l2 3.5" />
    <rect x="7" y="4.5" width="3.5" height="4.5" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
)

const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const DeliveryIllustration = () => (
  <svg width="280" height="240" viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Map background */}
    <rect x="20" y="20" width="240" height="170" rx="14" fill="rgba(205,242,2,0.05)" stroke="rgba(205,242,2,0.15)" strokeWidth="1"/>
    {/* Grid lines */}
    <line x1="20" y1="80" x2="260" y2="80" stroke="rgba(135,142,136,0.15)" strokeWidth="1"/>
    <line x1="20" y1="130" x2="260" y2="130" stroke="rgba(135,142,136,0.15)" strokeWidth="1"/>
    <line x1="90" y1="20" x2="90" y2="190" stroke="rgba(135,142,136,0.15)" strokeWidth="1"/>
    <line x1="170" y1="20" x2="170" y2="190" stroke="rgba(135,142,136,0.15)" strokeWidth="1"/>
    {/* Route path */}
    <path d="M60 65 L90 65 L90 105 L190 105 L190 160" stroke="#CDF202" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    {/* Pickup marker */}
    <circle cx="60" cy="65" r="10" fill="rgba(205,242,2,0.2)" stroke="#CDF202" strokeWidth="1.5"/>
    <circle cx="60" cy="65" r="4" fill="#CDF202"/>
    {/* Drop marker */}
    <circle cx="190" cy="160" r="10" fill="rgba(248,113,113,0.2)" stroke="#F87171" strokeWidth="1.5"/>
    <circle cx="190" cy="160" r="4" fill="#F87171"/>
    {/* Delivery vehicle (abstract bike delivery man with parcel) */}
    <g stroke="#CDF202" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Bike Wheels */}
      <circle cx="127" cy="112" r="6" fill="#191B1D" stroke="rgba(135,142,136,0.5)" strokeWidth="1.5" />
      <circle cx="151" cy="112" r="6" fill="#191B1D" stroke="rgba(135,142,136,0.5)" strokeWidth="1.5" />
      {/* Frame */}
      <path d="M127 112 L138 112 L135 97 L127 112 M138 112 L146 97 L135 97 M146 97 L151 112" />
      {/* Handlebars */}
      <path d="M146 97 L146 91 L149 91" />
      {/* Rider Torso */}
      <path d="M135 97 L142 83" />
      {/* Rider Head */}
      <circle cx="144" cy="78" r="3" fill="#CDF202" stroke="none" />
      {/* Rider Arms */}
      <path d="M142 83 L146 91" />
      {/* Rider Legs */}
      <path d="M135 97 L139 104 L138 112" />
      {/* Parcel Backpack */}
      <rect x="127" y="81" width="7" height="11" rx="1.5" fill="#242729" stroke="#CDF202" strokeWidth="1.5" />
    </g>
    {/* Labels */}
    <rect x="38" y="46" width="44" height="14" rx="4" fill="#242729" stroke="rgba(205,242,2,0.3)" strokeWidth="1"/>
    <text x="60" y="56" textAnchor="middle" fill="#CDF202" fontSize="8" fontFamily="system-ui">PICKUP</text>
    <rect x="170" y="166" width="40" height="14" rx="4" fill="#242729" stroke="rgba(248,113,113,0.3)" strokeWidth="1"/>
    <text x="190" y="176" textAnchor="middle" fill="#F87171" fontSize="8" fontFamily="system-ui">DROP</text>
    {/* Stats chips */}
  </svg>
)

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginUser(form)
      login(res.data.user, res.data.token)
      const dest = { sender: '/sender/dashboard', agent: '/agent/dashboard', admin: '/admin/dashboard' }
      navigate(dest[res.data.user.role] || '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      {/* LEFT */}
      <div className="auth-left">
        <div className="auth-bg-circle-1" />
        <div className="auth-bg-circle-2" />
        <div className="auth-left-brand">
          <div className="auth-left-brand-icon"><IconDispatch /></div>
          <div className="auth-left-brand-name">LocoDrop</div>
        </div>
        <div className="auth-illustration">
          <DeliveryIllustration />
        </div>
        <div className="auth-left-tagline">Deliver faster,<br /><span>smarter</span>, together</div>
        <div className="auth-left-sub">Hyperlocal delivery platform built for speed and reliability</div>
      </div>

      {/* RIGHT */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-logo">
            <div className="auth-logo-icon"><IconDispatch /></div>
            <div className="auth-logo-text">LocoDrop</div>
          </div>
          <div className="auth-form-title">Welcome back</div>
          <div className="auth-form-sub">Sign in to your LocoDrop account to continue</div>

          {error && <div className="auth-err">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Email address</label>
              <input type="email" required placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: '40px' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color var(--transition)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            <div className="auth-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" /> Remember me
              </label>
              <span className="auth-link">Forgot password?</span>
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <span className="auth-link" onClick={() => navigate('/register')}>Register</span>
          </div>
        </div>
      </div>
    </div>
  )
}