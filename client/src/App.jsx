import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Navbar from './components/layout/Navbar'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import SenderDashboard from './pages/sender/SenderDashboard'
import PostOrder from './pages/sender/PostOrder'
import OrderDetail from './pages/sender/OrderDetail'
import AgentDashboard from './pages/agent/AgentDashboard'
import ActiveDelivery from './pages/agent/ActiveDelivery'
import AgentProfileView from './pages/agent/AgentProfileView'
import AdminDashboard from './pages/admin/AdminDashboard'
import AgentsList from './pages/admin/AgentsList'

const RoleRedirect = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'sender') return <Navigate to="/sender/dashboard" replace />
  if (user.role === 'agent')  return <Navigate to="/agent/dashboard" replace />
  if (user.role === 'admin')  return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/login" replace />
}

const AppLayout = ({ children }) => (
  <div className="app-shell">
    <Navbar />
    <div className="app-main">{children}</div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<RoleRedirect />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* SENDER */}
        <Route element={<ProtectedRoute roles={['sender']} />}>
          <Route path="/sender/dashboard"  element={<AppLayout><SenderDashboard /></AppLayout>} />
          <Route path="/sender/post"       element={<AppLayout><PostOrder /></AppLayout>} />
          <Route path="/sender/orders/:id" element={<AppLayout><OrderDetail /></AppLayout>} />
        </Route>

        {/* AGENT */}
        <Route element={<ProtectedRoute roles={['agent']} />}>
          <Route path="/agent/dashboard" element={<AppLayout><AgentDashboard /></AppLayout>} />
          <Route path="/agent/active"    element={<AppLayout><ActiveDelivery /></AppLayout>} />
          <Route path="/agent/profile"   element={<AppLayout><AgentProfileView /></AppLayout>} />
        </Route>

        {/* ADMIN */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin/dashboard"  element={<AppLayout><AdminDashboard /></AppLayout>} />
          <Route path="/admin/agents"     element={<AppLayout><AgentsList /></AppLayout>} />
          <Route path="/admin/agents/:id" element={<AppLayout><AgentProfileView /></AppLayout>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}