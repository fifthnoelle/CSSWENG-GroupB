import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import StaffInventory from './pages/StaffInventory'
import AdminInventory from './pages/AdminInventory'
import AccountManager from './pages/AccountManager'
import LogsPage from './pages/LogsPage'
import ReportsPage from './pages/ReportsPage'

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
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
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AccountManager />
              </ProtectedRoute>
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
        </Routes>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
