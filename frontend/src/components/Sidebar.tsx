import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../services/auth.service'

export interface NavItem {
  label: string
  icon: string
  path: string
}

interface SidebarProps {
  user: { firstName: string; lastName: string; role: string }
  navItems: NavItem[]
}

function Sidebar({ user, navItems }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = `${user.firstName[0]}${user.lastName[0]}`
  const isAdmin = user.role.toLowerCase() === 'admin'

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      navigate('/login')
    }
  }

  return (
    <aside className="hidden md:flex flex-col border-r border-[#dee1e6] h-full shrink-0 w-16 lg:w-64">

      {/* Logo */}
      <div className="flex items-center gap-3 px-3 lg:px-5 h-16 shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
          <img src="/assets/logo.png" className="w-full h-full object-cover" alt="logo" />
        </div>
        <div className="hidden lg:block overflow-hidden">
          <p className="font-[Archivo] text-[#93191d] text-lg font-bold leading-tight truncate">Rice 'N' Roll</p>
          <p className="font-[Archivo] text-[#171a1f] text-base font-bold leading-tight truncate">Inventory</p>
        </div>
      </div>

      <div className="border-t border-[#dee1e6]" />

      {/* Nav items */}
      <nav className="flex-1 p-2 pt-4 flex flex-col gap-1">
        {navItems.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-2 lg:px-3 py-3 rounded-md w-full text-left transition-colors cursor-pointer ${
                active ? 'bg-[#fdf2f2]' : 'hover:bg-gray-50'
              }`}
            >
              <img className="w-5 h-5 shrink-0" src={item.icon} alt={item.label} />
              <span className={`hidden lg:block font-[Archivo] text-sm font-bold ${
                active ? 'text-[#93191d]' : 'text-[#323842]'
              }`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="relative p-2 lg:p-3 border-t border-[#dee1e6]">
        {menuOpen && (
          <div className="absolute bottom-full left-2 right-2 lg:left-3 lg:right-3 mb-1 bg-white border border-[#dee1e6] rounded-md shadow-lg overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm font-[Archivo] font-medium text-[#93191d] hover:bg-[#fdf2f2] transition-colors cursor-pointer"
            >
              Log out
            </button>
          </div>
        )}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-3 p-2 border border-[#bcc1ca] rounded-md w-full text-left hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isAdmin ? 'bg-[#fecaca]' : 'bg-[#d3f9e0]'
          }`}>
            <span className={`font-[Archivo] text-xs font-bold ${
              isAdmin ? 'text-[#93191d]' : 'text-[#073517]'
            }`}>
              {initials}
            </span>
          </div>
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="font-[Archivo] text-sm font-semibold text-[#171a1f] truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="font-[Archivo] text-sm text-[#9095a0]">{user.role}</p>
          </div>
          <img
            className={`hidden lg:block w-4 h-4 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            src="/assets/icon-arrow-down.svg"
            alt="expand"
          />
        </button>
      </div>

    </aside>
  )
}

export default Sidebar
