import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import StaffInventory from './pages/StaffInventory'
import AdminInventory from './pages/AdminInventory'
import AccountManager from './pages/AccountManager'
import LogsPage from './pages/LogsPage'
import ReportsPage from './pages/ReportsPage'
import NotFound from './pages/NotFound'
import ServerError from './pages/ServerError'

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <StaffInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminRoute>
                  <AdminInventory />
                </AdminRoute>
              }
            />
            {/* Bug fix (#5): this was <ProtectedRoute> (any authenticated
                user), inconsistent with every other admin-only page below.
                Account management is admin-only server-side (every
                /register, /update-user, /delete-user, /load-users,
                /search-users route requires requireAdmin) — a staff member
                landing here used to get a broken page (every API call
                403s) instead of the clean redirect AdminRoute gives. */}
            <Route
              path="/accounts"
              element={
                <AdminRoute>
                  <AccountManager />
                </AdminRoute>
              }
            />
            {/* Logs & Reports are Admin/Owner-only per the master doc permissions table */}
            <Route
              path="/logs"
              element={
                <AdminRoute>
                  <LogsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <AdminRoute>
                  <ReportsPage />
                </AdminRoute>
              }
            />
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Direct link/navigation target for a 500-style failure */}
            <Route path="/server-error" element={<ServerError />} />

            {/* Catch-all — any unknown path renders a proper 404 instead of a blank screen */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
