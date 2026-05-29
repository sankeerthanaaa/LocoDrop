import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(localStorage.getItem('dx_token') || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('dx_user')
    if (stored && token) {
      try { setUser(JSON.parse(stored)) }
      catch { logout() }
    }
    setLoading(false)
  }, [])

  const login = (userData, jwt) => {
    setUser(userData)
    setToken(jwt)
    localStorage.setItem('dx_token', jwt)
    localStorage.setItem('dx_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('dx_token')
    localStorage.removeItem('dx_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {loading ? null : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)