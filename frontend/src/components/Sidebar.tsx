import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../services/auth.service'
import ChangePasswordModal from './ChangePasswordModal'
import { useTheme } from '../context/ThemeContext'

export interface NavItem {
  label: string
  icon: string
  path: string
}

interface SidebarProps {
  user: { firstName: string; lastName: string; role: string; lastLoginAt?: string | null; lastLoginStatus?: 'success' | 'failed' | null }
  navItems: NavItem[]
  /** Controls the slide-in drawer on mobile/tablet. Ignored on desktop (lg+), where the sidebar is always visible. */
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function Sidebar({ user, navItems, mobileOpen = false, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const { theme, toggleTheme } = useTheme()

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

  const handleNavigate = (path: string) => {
    navigate(path)
    onMobileClose?.()
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 lg:px-5 h-16 shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
          <img src="/assets/logo.jpg" className="w-full h-full object-cover" alt="logo" />
        </div>
        <div className="block overflow-hidden">
          <p className="font-[Archivo] text-[#93191d] dark:text-[#f87171] text-lg font-bold leading-tight truncate">Rice 'N' Roll</p>
          <p className="font-[Archivo] text-[#171a1f] dark:text-[#e5e7eb] text-base font-bold leading-tight truncate">Inventory</p>
        </div>
        {/* Close button — mobile drawer only */}
        <button
          onClick={onMobileClose}
          className="ml-auto lg:hidden p-2 -mr-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          aria-label="Close menu"
        >
          <img className="w-5 h-5 dark:invert" src="/assets/icon-close.svg" alt="close" />
        </button>
      </div>

      <div className="border-t border-[#dee1e6] dark:border-white/10" />

      {/* Nav items */}
      <nav className="flex-1 p-2 pt-4 flex flex-col gap-1">
        {navItems.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`flex items-center gap-3 px-2 lg:px-3 py-3 rounded-md w-full text-left transition-colors cursor-pointer ${
                active ? 'bg-[#fdf2f2] dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <img className="w-5 h-5 shrink-0 dark:invert" src={item.icon} alt={item.label} />
              <span className={`block lg:block font-[Archivo] text-sm font-bold ${
                active ? 'text-[#93191d] dark:text-[#f87171]' : 'text-[#323842] dark:text-[#d1d5db]'
              }`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-2 lg:px-3 pb-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-md w-full text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5 shrink-0 text-[#323842] dark:text-[#d1d5db]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          ) : (
            <svg className="w-5 h-5 shrink-0 text-[#323842] dark:text-[#d1d5db]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
          <span className="block font-[Archivo] text-sm font-bold text-[#323842] dark:text-[#d1d5db]">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        </button>
      </div>

      {/* User profile */}
      <div className="relative p-2 lg:p-3 border-t border-[#dee1e6] dark:border-white/10">
        {menuOpen && (
          <div className="absolute bottom-full left-2 right-2 lg:left-3 lg:right-3 mb-1 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-lg overflow-hidden">
            {/* 2.1.11 — report the last use of this account to the user themself */}
            {user.lastLoginAt && (
              <div className="px-3 py-2 text-[11px] font-[Archivo] text-[#9095a0] dark:text-[#9095a0] border-b border-[#dee1e6] dark:border-white/10">
                Last {user.lastLoginStatus === 'failed' ? 'attempt' : 'login'}: {new Date(user.lastLoginAt).toLocaleString()}
              </div>
            )}
            <button
              onClick={() => { setMenuOpen(false); setShowChangePassword(true) }}
              className="w-full text-left px-3 py-2 text-sm font-[Archivo] font-medium text-[#171a1f] dark:text-[#e5e7eb] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm font-[Archivo] font-medium text-[#93191d] dark:text-[#f87171] hover:bg-[#fdf2f2] dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Log out
            </button>
          </div>
        )}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-3 p-2 border border-[#bcc1ca] dark:border-white/15 rounded-md w-full text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isAdmin ? 'bg-[#fecaca] dark:bg-[#7f1d1d]' : 'bg-[#d3f9e0] dark:bg-[#064e3b]'
          }`}>
            <span className={`font-[Archivo] text-xs font-bold ${
              isAdmin ? 'text-[#93191d] dark:text-[#fca5a5]' : 'text-[#073517] dark:text-[#6ee7b7]'
            }`}>
              {initials}
            </span>
          </div>
          <div className="block flex-1 min-w-0">
            <p className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb] truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="font-[Archivo] text-sm text-[#9095a0]">{user.role}</p>
          </div>
          <img
            className={`block w-4 h-4 shrink-0 transition-transform dark:invert ${menuOpen ? 'rotate-180' : ''}`}
            src="/assets/icon-arrow-down.svg"
            alt="expand"
          />
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — icon-only on md, full on lg+ */}
      <aside className="hidden lg:flex flex-col border-r border-[#dee1e6] dark:border-white/10 dark:bg-[#1a1b22] h-full shrink-0 w-64">
        {sidebarContent}
      </aside>

      {/* Mobile/tablet drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onMobileClose}
        />
        {/* Panel */}
        <aside
          className={`absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-white dark:bg-[#1a1b22] flex flex-col shadow-xl transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  )
}

export default Sidebar
