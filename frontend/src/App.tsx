import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import StaffInventory from './pages/StaffInventory'
import AdminInventory from './pages/AdminInventory'
import AccountManager from './pages/AccountManager'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"            element={<Login />} />
        <Route path="/inventory"        element={<StaffInventory />} />
        <Route path="/admin/inventory"  element={<AdminInventory />} />
        <Route path="/accounts"         element={<AccountManager />} />
        {/* Redirect root to login — backend will handle auth/role redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
