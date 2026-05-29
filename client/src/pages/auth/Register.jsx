import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const [role, setRole]   = useState('sender')
  const [form, setForm]   = useState({ name:'', email:'', phone:'', password:'', vehicleType: 'bike' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
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
          <div className="auth-left-brand-icon">🚀</div>
          <div className="auth-left-brand-name">DispatchX</div>
        </div>
        <div className="auth-illustration">
          <svg width="240" height="200" viewBox="0 0 240 200" fill="none">
            <circle cx="120" cy="100" r="70" fill="rgba(255,255,255,0.08)"/>
            <circle cx="120" cy="100" r="50" fill="rgba(255,255,255,0.08)"/>
            <text x="120" y="115" textAnchor="middle" fontSize="52">🛵</text>
            <circle cx="60" cy="60" r="16" fill="rgba(255,255,255,0.15)"/>
            <text x="60" y="66" textAnchor="middle" fontSize="14">📦</text>
            <circle cx="180" cy="140" r="16" fill="rgba(255,255,255,0.15)"/>
            <text x="180" y="146" textAnchor="middle" fontSize="14">📍</text>
            <circle cx="170" cy="55" r="12" fill="rgba(255,255,255,0.15)"/>
            <text x="170" y="61" textAnchor="middle" fontSize="11">⚡</text>
          </svg>
        </div>
        <div className="auth-left-tagline">Join the network.<br />Start delivering.</div>
        <div className="auth-left-sub">Trusted by 500+ agents across Hyderabad</div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-title">Create account</div>
          <div className="auth-form-sub">Join DispatchX as a sender or delivery agent</div>

          {error && <div className="auth-err">{error}</div>}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>I am a</div>
            <div className="auth-role-tabs">
              <div className={`auth-role-tab ${role === 'sender' ? 'active' : ''}`} onClick={() => setRole('sender')}>
                📦 Sender
              </div>
              <div className={`auth-role-tab ${role === 'agent' ? 'active' : ''}`} onClick={() => setRole('agent')}>
                🛵 Delivery Agent
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