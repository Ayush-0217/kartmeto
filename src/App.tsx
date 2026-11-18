import PoolRoom from './pages/PoolRoom'
import HostDemo from "./HostDemo";
import CreateOrder from './pages/CreateOrder'
import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import JoinCommunity from './pages/JoinCommunity'
import Profile from './pages/Profile'
import ActivePools from './pages/ActivePools'
import Activity from './pages/Activity'
import Placeholder from './pages/Placeholder'

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted" style={{ padding: 16 }}>Loading…</p>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
  <Route path="/login" element={<Login />} />

  {/* Host Demo - Visual Testing */}
  <Route path="/demo/host" element={<HostDemo />} />

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
