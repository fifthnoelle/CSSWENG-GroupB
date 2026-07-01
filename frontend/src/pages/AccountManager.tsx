import { useState, useEffect } from 'react'
import type { User } from '../types'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import RemoveAccountModal from '../components/RemoveAccountModal'
import UserUpdateModal from '../components/UserUpdateModal'
import CreateAccountModal from '../components/CreateAccountModal'
import { getAllUsers, searchUsers, deleteUser, createUser, updateUser } from '../services/user.service'
import { useUser } from '../context/UserContext'

const adminNavItems = [
  { label: 'Inventory', icon: '/assets/icon-inventory.svg', path: '/admin/inventory' },
  { label: 'Logs',      icon: '/assets/icon-document.svg',  path: '/logs'            },
  { label: 'Reports',   icon: '/assets/icon-chart.svg',     path: '/reports'         },
  { label: 'Accounts',  icon: '/assets/icon-account.svg',   path: '/accounts'        },
]

// Avatar background colors cycled per user
const avatarColors = [
  { bg: 'bg-[#fecaca]', text: 'text-[#93191d]' },
  { bg: 'bg-[#fed7aa]', text: 'text-[#c2410c]' },
  { bg: 'bg-[#d3f9e0]', text: 'text-[#073517]' },
  { bg: 'bg-[#ddd6fe]', text: 'text-[#4c1d95]' },
  { bg: 'bg-[#bfdbfe]', text: 'text-[#1e3a8a]' },
  { bg: 'bg-[#fde68a]', text: 'text-[#78350f]' },
]

function UserCard({
  user,
  colorIndex,
  onEditClick,
  onRemoveClick,
}: {
  user: User
  colorIndex: number
  onEditClick: () => void
  onRemoveClick: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const color = avatarColors[colorIndex % avatarColors.length]
  const initials = `${user.firstName[0]}${user.lastName[0]}`
  const isAdmin = user.role === 'admin'

  return (
    <div className="bg-white dark:bg-[#1f2128] rounded-2xl border border-[#dee1e6] dark:border-white/10 shadow-[0px_1px_2.5px_0px_#171a1f12,_0px_0px_2px_0px_#171a1f14] p-4 relative">

      {/* Name row */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
          <span className={`font-[Archivo] text-sm font-bold ${color.text}`}>{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-[Archivo] text-sm font-bold text-[#171a1f] dark:text-[#e5e7eb] truncate">
            {user.firstName} {user.lastName}
          </p>
          <span className={`inline-block text-[10px] font-semibold font-[Archivo] px-2.5 py-0.5 rounded-full mt-1 ${
            isAdmin ? 'bg-[#FFE4E6] dark:bg-[#7f1d1d] text-[#93191d] dark:text-[#fca5a5]' : 'bg-[#D1FAE5] dark:bg-[#064e3b] text-[#047857] dark:text-[#6ee7b7]'
          }`}>
            {isAdmin ? 'Admin' : 'Staff'}
          </span>
        </div>

        {/* Three dots menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <img className="w-5 h-5 dark:invert" src="/assets/icon-dots-vertical.svg" alt="menu" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-36 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-lg shadow-md z-10 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEditClick() }}
                className="w-full text-left px-4 py-2.5 text-sm font-[Archivo] text-[#171a1f] dark:text-[#e5e7eb] hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer"
              >
                Edit Account
              </button>
              <button
                onClick={() => { setMenuOpen(false); onRemoveClick(); }}
                className="w-full text-left px-4 py-2.5 text-sm font-[Archivo] text-[#93191d] dark:text-[#fca5a5] hover:bg-[#fff5f5] dark:hover:bg-white/10 cursor-pointer"
              >
                Remove Account
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#dee1e6] dark:border-white/10 mb-3" />

      {/* User details */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <img className="w-4 h-4 shrink-0 opacity-40 dark:invert" src="/assets/icon-account.svg" alt="user" />
          <div>
            <p className="font-[Archivo] text-[10px] text-[#9095a0] dark:text-[#6b7280]">User ID</p>
            <p className="font-[Archivo] text-xs font-medium text-[#171a1f] dark:text-[#d1d5db]">{user._id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <img className="w-4 h-4 shrink-0 opacity-40 dark:invert" src="/assets/icon-mail.svg" alt="email" />
          <div>
            <p className="font-[Archivo] text-[10px] text-[#9095a0] dark:text-[#6b7280]">Email</p>
            <p className="font-[Archivo] text-xs font-medium text-[#171a1f] dark:text-[#d1d5db] truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <img className="w-4 h-4 shrink-0 opacity-40 dark:invert" src="/assets/icon-calendar.svg" alt="date" />
          <div>
            <p className="font-[Archivo] text-[10px] text-[#9095a0] dark:text-[#6b7280]">Created At</p>
            <p className="font-[Archivo] text-xs font-medium text-[#171a1f] dark:text-[#d1d5db]">{user.createdAt}</p>
          </div>
        </div>
        {/* 2.1.11 — admins can see last login/attempt for every account */}
        <div className="flex items-center gap-2">
          <img className="w-4 h-4 shrink-0 opacity-40 dark:invert" src="/assets/icon-account.svg" alt="last login" />
          <div>
            <p className="font-[Archivo] text-[10px] text-[#9095a0] dark:text-[#6b7280]">Last Login</p>
            <p className="font-[Archivo] text-xs font-medium text-[#171a1f] dark:text-[#d1d5db]">
              {user.lastLoginAt
                ? `${new Date(user.lastLoginAt).toLocaleString()} (${user.lastLoginStatus === 'failed' ? 'failed attempt' : 'success'})`
                : 'Never logged in'}
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

function AccountManager() {
  const { user: currentUser } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [userToRemove, setUserToRemove] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const filterLabels: Record<'all' | 'admin' | 'staff', string> = {
    all: 'All',
    admin: 'Admin',
    staff: 'Staff',
  }

  const visibleUsers = users.filter(u => roleFilter === 'all' || u.role === roleFilter)

  useEffect(() => {
    setIsLoading(true)
    setLoadError('')

    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim() === '') {
        getAllUsers()
          .then(setUsers)
          .catch(err => {
            console.error('Failed to load users:', err)
            setLoadError(err instanceof Error ? err.message : 'Failed to load accounts. Please try refreshing.')
          })
          .finally(() => setIsLoading(false))
      } else {
        searchUsers(searchQuery)
          .then(setUsers)
          .catch(err => {
            console.error('Failed to search users:', err)
            setLoadError(err instanceof Error ? err.message : 'Search failed. Please try again.')
          })
          .finally(() => setIsLoading(false))
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  async function handleRemove(_id: string) {
    try {
      await deleteUser(_id)
      setUsers(prev => prev.filter(u => u._id !== _id))
      setUserToRemove(null)
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete user. Please try again.')
    }
  }

  async function handleCreate(data: {
    firstName: string
    middleName: string
    lastName: string
    email: string
    userId: string
    password: string
    role: 'admin' | 'staff'
    securityQuestion: string
    securityAnswer: string
  }) {
    try {
      await createUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        role: data.role,
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer,
      })
      // Refresh the list from the backend so we get the real _id and createdAt
      const refreshed = await getAllUsers()
      setUsers(refreshed)
    } catch (err) {
      console.error('Failed to create user:', err)
      alert(err instanceof Error ? err.message : 'Failed to create user. The email may already be in use.')
    }
  }

  async function handleEdit(email: string, firstName: string, lastName: string, role: 'admin' | 'staff') {
    if (!userToEdit) return
    try {
      const result = await updateUser(userToEdit._id, { email, firstName, lastName, role })
      setUsers(prev => prev.map(u => (u._id === userToEdit._id ? result.user : u)))
      setUserToEdit(null)
    } catch (err) {
      console.error('Failed to update user:', err)
      alert(err instanceof Error ? err.message : 'Failed to update user. The email may already be in use.')
    }
  }

  if (!currentUser) return null

  return (
    <div className="h-screen bg-white dark:bg-[#14151a] flex overflow-hidden">

      <Sidebar user={currentUser} navItems={adminNavItems} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-16 border-b border-[#dee1e6] dark:border-white/10 flex items-center px-4 gap-3 shrink-0 bg-white dark:bg-[#14151a] z-10">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-[#171a1f] dark:text-[#e5e7eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <div className="flex-1 flex items-center gap-2 px-3 h-9 bg-[#f3f4f6]/50 dark:bg-white/5 rounded-md">
            <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-search.svg" alt="search" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 text-sm font-[Archivo] text-[#565e6c] dark:text-[#d1d5db] placeholder:text-[#565e6c] dark:placeholder:text-[#6b7280] outline-none bg-transparent"
            />
            {isLoading && (
              <div className="w-4 h-4 border-2 border-[#636AE8] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <NotificationBell />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">

          {/* Title + controls */}
          <div className="flex flex-col gap-3 mb-6">
            <div>
              <h1 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] dark:text-[#f3f4f6] tracking-tight">Accounts Management</h1>
              <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] mt-1">Create, edit, and manage user accounts.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen(o => !o)}
                  className="flex items-center gap-2 px-3 h-10 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-sm cursor-pointer"
                >
                  <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-filter.svg" alt="filter" />
                  <span className="font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb]">Filter: {filterLabels[roleFilter]}</span>
                  <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-chevron-down.svg" alt="chevron" />
                </button>
                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                    <div className="absolute left-0 mt-1 w-40 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-lg z-20 py-1">
                      {(['all', 'admin', 'staff'] as const).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setRoleFilter(opt); setFilterOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-sm font-[Archivo] hover:bg-gray-100 dark:hover:bg-white/10 ${roleFilter === opt ? 'font-semibold text-[#636AE8]' : 'text-[#171a1f] dark:text-[#e5e7eb]'}`}
                        >
                          {filterLabels[opt]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 h-10 bg-[#636AE8] rounded-md shadow-sm hover:bg-[#4f56d4] transition-colors ml-auto"
              >
                <img className="w-4 h-4" src="/assets/icon-plus.svg" alt="plus" />
                <span className="font-[Archivo] text-sm font-medium text-white whitespace-nowrap">Create Account</span>
              </button>
            </div>
          </div>

          {/* Load / search error */}
          {loadError && (
            <p className="font-[Archivo] text-sm text-[#BE123C] dark:text-[#fca5a5] mb-4">{loadError}</p>
          )}

          {/* User cards grid */}
          {visibleUsers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleUsers.map((user, i) => (
                <UserCard
                  key={user._id}
                  user={user}
                  colorIndex={i}
                  onEditClick={() => setUserToEdit(user)}
                  onRemoveClick={() => setUserToRemove(user)}
                />
              ))}
            </div>
          )}
          {!loadError && visibleUsers.length === 0 && (
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">No accounts match your search or filter.</p>
          )}
        </main>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}

      {/* Edit Account Modal */}
      {userToEdit && (
        <UserUpdateModal
          user={userToEdit}
          userId={currentUser._id}
          onClose={() => setUserToEdit(null)}
          onSave={handleEdit}
        />
      )}

      {/* Remove Account Modal */}
      {userToRemove && (
        <RemoveAccountModal
          user={userToRemove}
          onClose={() => setUserToRemove(null)}
          onConfirm={handleRemove}
        />
      )}

    </div>
  )
}

export default AccountManager
