import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../../api/auth'
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
const IconPackage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
)
const IconAgent = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="2.5"/>
    <circle cx="18.5" cy="17.5" r="2.5"/>
    <path d="M5.5 17.5l5.5-6.5h5.5l2 6.5"/>
    <path d="M11 11l1.5-4.5h4.5"/>
  </svg>
)

const NetworkIllustration = () => (
  <svg width="260" height="220" viewBox="0 0 260 220" fill="none">
    {/* Central hub */}
    <circle cx="130" cy="110" r="32" fill="rgba(205,242,2,0.1)" stroke="rgba(205,242,2,0.3)" strokeWidth="1.5"/>
    <circle cx="130" cy="110" r="18" fill="rgba(205,242,2,0.15)" stroke="#CDF202" strokeWidth="1"/>
    {/* Spokes */}
    <line x1="130" y1="78" x2="130" y2="40" stroke="rgba(205,242,2,0.3)" strokeWidth="1" strokeDasharray="4 3"/>
    <line x1="130" y1="142" x2="130" y2="180" stroke="rgba(205,242,2,0.3)" strokeWidth="1" strokeDasharray="4 3"/>
    <line x1="98" y1="110" x2="55" y2="90" stroke="rgba(205,242,2,0.3)" strokeWidth="1" strokeDasharray="4 3"/>
    <line x1="162" y1="110" x2="205" y2="90" stroke="rgba(205,242,2,0.3)" strokeWidth="1" strokeDasharray="4 3"/>
    <line x1="108" y1="88" x2="75" y2="55" stroke="rgba(135,142,136,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
    <line x1="152" y1="88" x2="185" y2="55" stroke="rgba(135,142,136,0.2)" strokeWidth="1" strokeDasharray="4 3"/>
    {/* Outer nodes */}
    <circle cx="130" cy="36" r="12" fill="#242729" stroke="rgba(205,242,2,0.4)" strokeWidth="1.5"/>
    <circle cx="130" cy="184" r="12" fill="#242729" stroke="rgba(135,142,136,0.3)" strokeWidth="1.5"/>
    <circle cx="48" cy="86" r="12" fill="#242729" stroke="rgba(74,222,128,0.4)" strokeWidth="1.5"/>
    <circle cx="212" cy="86" r="12" fill="#242729" stroke="rgba(74,222,128,0.4)" strokeWidth="1.5"/>
    <circle cx="70" cy="50" r="8" fill="#242729" stroke="rgba(135,142,136,0.2)" strokeWidth="1"/>
    <circle cx="190" cy="50" r="8" fill="#242729" stroke="rgba(135,142,136,0.2)" strokeWidth="1"/>
    {/* Node icons (simple dots) */}
    <circle cx="130" cy="36" r="4" fill="#CDF202"/>
    <circle cx="48" cy="86" r="4" fill="#4ADE80"/>
    <circle cx="212" cy="86" r="4" fill="#4ADE80"/>
    <circle cx="130" cy="184" r="4" fill="#878E88"/>
    {/* Center icon — dispatch symbol */}
    <path d="M124 108 L130 102 L136 108 L130 114 Z" fill="#CDF202"/>
    {/* Labels */}
    <text x="130" y="20" textAnchor="middle" fill="#CDF202" fontSize="8" fontFamily="Orbitron,sans-serif">SENDER</text>
    <text x="22" y="88" fill="#4ADE80" fontSize="8" fontFamily="Orbitron,sans-serif">AGENT</text>
    <text x="218" y="88" fill="#4ADE80" fontSize="8" fontFamily="Orbitron,sans-serif">AGENT</text>
    <text x="130" y="202" textAnchor="middle" fill="#878E88" fontSize="8" fontFamily="system-ui">DELIVERY</text>
  </svg>
)

export default function Register() {
  const [role, setRole]   = useState('sender')
  const [form, setForm]   = useState({ name: '', email: '', phone: '', password: '', vehicleType: 'bike' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await registerUser({ ...form, role })
      login(res.data.user, res.data.token)
      navigate(role === 'sender' ? '/sender/dashboard' : '/agent/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-bg-circle-1" />
        <div className="auth-bg-circle-2" />
        <div className="auth-left-brand">
          <div className="auth-left-brand-icon"><IconDispatch /></div>
          <div className="auth-left-brand-name">LocoDrop</div>
        </div>
        <div className="auth-illustration">
          <NetworkIllustration />
        </div>
        <div className="auth-left-tagline">Join the network.<br /><span>Start delivering.</span></div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-logo">
            <div className="auth-logo-icon"><IconDispatch /></div>
            <div className="auth-logo-text">LocoDrop</div>
          </div>
          <div className="auth-form-title">Create account</div>
          <div className="auth-form-sub">Join as a sender or delivery agent</div>

          {error && <div className="auth-err">{error}</div>}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>I am a</div>
            <div className="auth-role-tabs">
              <div className={`auth-role-tab ${role === 'sender' ? 'active' : ''}`} onClick={() => setRole('sender')}>
                <IconPackage /> Sender
              </div>
              <div className={`auth-role-tab ${role === 'agent' ? 'active' : ''}`} onClick={() => setRole('agent')}>
                <IconAgent /> Delivery Agent
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Full name</label>
              <input required placeholder="Arjun Mehta" value={form.name} onChange={set('name')} />
            </div>
            <div className="auth-field">
              <label>Email address</label>
              <input type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} />
            </div>
            <div className="auth-field">
              <label>Phone number</label>
              <input placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input type="password" required minLength={8} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <span className="auth-link" onClick={() => navigate('/login')}>Sign in</span>
          </div>
        </div>
      </div>
    </div>
  )
}