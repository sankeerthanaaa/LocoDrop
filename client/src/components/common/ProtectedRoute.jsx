import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ roles }) => {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    // Redirect to their correct home
    const home = {
      sender: '/sender/dashboard',
      agent:  '/agent/dashboard',
      admin:  '/admin/dashboard',
    }
    return <Navigate to={home[user.role] || '/login'} replace />
  }

  return <Outlet />
}

export default ProtectedRoute