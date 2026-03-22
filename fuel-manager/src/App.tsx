import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { Dashboard }         from './pages/Dashboard'
import { RequestsPage }      from './pages/RequestsPage'
import { RequestDetailPage } from './pages/RequestDetailPage'
import { RobotsPage }        from './pages/RobotsPage'
import { SignInPage }        from './pages/SignInPage'
import { SignUpPage }        from './pages/SignUpPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute }    from './navigation/ProtectedRoute'
import './manager.css'

const NAV_ITEMS = [
  {
    to: '/', end: true, label: 'Dashboard',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: '/requests', end: false, label: 'Fuel Requests',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    ),
  },
  {
    to: '/robots', end: false, label: 'Robots',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="8" width="18" height="13" rx="2"/>
        <path strokeLinecap="round" d="M8 8V6a4 4 0 018 0v2"/>
        <circle cx="9" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="14" r="1.5" fill="currentColor"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6"/>
      </svg>
    ),
  },
]

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/sign-in', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="#fb923c" strokeWidth="1.5" fill="rgba(251,146,60,0.15)"/>
              <circle cx="12" cy="12" r="3" fill="#fb923c"/>
            </svg>
          </div>
          {sidebarOpen && <span className="logo-text">FuelStation</span>}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={!sidebarOpen ? item.label : undefined}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User profile + sign out */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">M</div>
          {sidebarOpen && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Manager</div>
              <div className="sidebar-user-role">
                {session ? 'Authenticated' : ''}
              </div>
            </div>
          )}
          {sidebarOpen && (
            <button
              className="sidebar-signout"
              onClick={handleSignOut}
              title="Sign out"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          )}
        </div>

        <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
          <svg
            width="16" height="16" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2"
            style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.3s' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </aside>

      <main className="main-area">
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/requests"     element={<RequestsPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
          <Route path="/robots"       element={<RobotsPage />} />
          <Route path="*"             element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="empty-state" style={{ height: '100%' }}>
      <div className="empty-icon">🔍</div>
      <div className="empty-text">Page not found</div>
      <button className="btn btn-secondary" onClick={() => navigate('/')}>Go to Dashboard</button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes */}
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* Protected app routes — wrapped in Layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<Layout />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}