import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

const DeliveryIllustration = () => (
  <svg width="260" height="220" viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Map background */}
    <rect x="20" y="30" width="220" height="160" rx="16" fill="rgba(255,255,255,0.1)"/>
    {/* Roads */}
    <rect x="20" y="100" width="220" height="10" rx="5" fill="rgba(255,255,255,0.15)"/>
    <rect x="120" y="30" width="10" height="160" rx="5" fill="rgba(255,255,255,0.15)"/>
    {/* Route dotted line */}
    <path d="M50 70 L80 70 L80 110 L180 110 L180 160" stroke="white" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" opacity="0.8"/>
    {/* Pickup pin */}
    <circle cx="50" cy="70" r="12" fill="white" opacity="0.9"/>
    <circle cx="50" cy="70" r="7" fill="#4F6EF7"/>
    <circle cx="50" cy="70" r="3" fill="white"/>
    {/* Drop pin */}
    <circle cx="180" cy="160" r="12" fill="white" opacity="0.9"/>
    <circle cx="180" cy="160" r="7" fill="#22C55E"/>
    <circle cx="180" cy="160" r="3" fill="white"/>
    {/* Scooter */}
    <circle cx="120" cy="98" r="18" fill="white" opacity="0.95"/>
    <text x="120" y="105" textAnchor="middle" fontSize="18">🛵</text>
    <circle cx="120" cy="98" r="24" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3"/>
    {/* Location tags */}
    <rect x="28" y="44" width="44" height="18" rx="5" fill="rgba(0,0,0,0.4)"/>
    <text x="50" y="56" textAnchor="middle" fill="white" fontSize="9" fontFamily="sans-serif">Pickup</text>
    <rect x="158" y="172" width="44" height="18" rx="5" fill="rgba(0,0,0,0.4)"/>
    <text x="180" y="184" textAnchor="middle" fill="white" fontSize="9" fontFamily="sans-serif">Drop</text>
    {/* Speed lines */}
    <line x1="88" y1="93" x2="76" y2="93" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <line x1="86" y1="99" x2="72" y2="99" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <line x1="84" y1="105" x2="74" y2="105" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    {/* Package */}
    <rect x="200" y="50" width="30" height="28" rx="5" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
    <text x="215" y="68" textAnchor="middle" fontSize="14">📦</text>
  </svg>
)

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' })
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
      const dest = {
        sender: '/sender/dashboard',
        agent:  '/agent/dashboard',
        admin:  '/admin/dashboard',
      }
      navigate(dest[res.data.user.role] || '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-bg-circle-1" />
        <div className="auth-bg-circle-2" />
        <div className="auth-left-brand">
          <div className="auth-left-brand-icon">🚀</div>
          <div className="auth-left-brand-name">DispatchX</div>
        </div>
        <div className="auth-illustration">
          <DeliveryIllustration />
        </div>
        <div className="auth-left-tagline">Deliver faster,<br />smarter, together</div>
        <div className="auth-left-sub">Hyperlocal delivery at your fingertips</div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-title">Welcome back 👋</div>
          <div className="auth-form-sub">Sign in to your DispatchX account</div>

          {error && <div className="auth-err">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Email address</label>
              <input
                type="email" required placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password" required placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="auth-row">
              <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
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