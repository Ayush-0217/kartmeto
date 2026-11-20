import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import JoinCommunity from './pages/JoinCommunity'
import Profile from './pages/Profile'
import ActivePools from './pages/ActivePools'
import Activity from './pages/Activity'
import CreateOrder from './pages/CreateOrder'
import PoolRoom from './pages/PoolRoom'

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p className="muted" style={{ padding: 16 }}>Loading…</p>
  // remember the page the user wanted (e.g. a shared /pool/:id link) so Login can return there
  return user
    ? children
    : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<JoinCommunity />} />
            <Route path="/pools" element={<ActivePools />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/create" element={<CreateOrder />} />
            <Route path="/pool/:id" element={<PoolRoom />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
