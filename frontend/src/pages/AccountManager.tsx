import { useState, useEffect } from 'react'
import type { User } from '../types'
import Sidebar from '../components/Sidebar'
import RemoveAccountModal from '../components/RemoveAccountModal'
import UserUpdateModal from '../components/UserUpdateModal'
import CreateAccountModal from '../components/CreateAccountModal'
import { getAllUsers, searchUsers, deleteUser, createUser, updateUser } from '../services/user.service'

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
    <div className="bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_0px_#171a1f12,_0px_0px_2px_0px_#171a1f14] p-4 relative">

      {/* Name row */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
          <span className={`font-[Archivo] text-sm font-bold ${color.text}`}>{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-[Archivo] text-sm font-bold text-[#171a1f] truncate">
            {user.firstName} {user.lastName}
          </p>
          <span className={`inline-block text-[10px] font-semibold font-[Archivo] px-2.5 py-0.5 rounded-full mt-1 ${
            isAdmin ? 'bg-[#FFE4E6] text-[#93191d]' : 'bg-[#D1FAE5] text-[#047857]'
          }`}>
            {isAdmin ? 'Admin' : 'Staff'}
          </span>
        </div>

        {/* Three dots menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="p-1 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <img className="w-5 h-5" src="/assets/icon-dots-vertical.svg" alt="menu" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-36 bg-white border border-[#dee1e6] rounded-lg shadow-md z-10 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEditClick() }}
                className="w-full text-left px-4 py-2.5 text-sm font-[Archivo] text-[#171a1f] hover:bg-gray-50 cursor-pointer"
              >
                Edit Account
              </button>
              <button
                onClick={() => { setMenuOpen(false); onRemoveClick(); }}
                className="w-full text-left px-4 py-2.5 text-sm font-[Archivo] text-[#93191d] hover:bg-[#fff5f5] cursor-pointer"
              >
                Remove Account
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#dee1e6] mb-3" />

      {/* User details */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <img className="w-4 h-4 shrink-0 opacity-40" src="/assets/icon-account.svg" alt="user" />
          <div>
            <p className="font-[Archivo] text-[10px] text-[#9095a0]">User ID</p>
            <p className="font-[Archivo] text-xs font-medium text-[#171a1f]">{user._id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <img className="w-4 h-4 shrink-0 opacity-40" src="/assets/icon-mail.svg" alt="email" />
          <div>
            <p className="font-[Archivo] text-[10px] text-[#9095a0]">Email</p>
            <p className="font-[Archivo] text-xs font-medium text-[#171a1f] truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <img className="w-4 h-4 shrink-0 opacity-40" src="/assets/icon-calendar.svg" alt="date" />
          <div>
            <p className="font-[Archivo] text-[10px] text-[#9095a0]">Created At</p>
            <p className="font-[Archivo] text-xs font-medium text-[#171a1f]">{user.createdAt}</p>
          </div>
        </div>
      </div>

    </div>
  )
}

const adminUser = { firstName: 'John', lastName: 'Doe', role: 'Admin' }

function AccountManager() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userToRemove, setUserToRemove] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    setIsLoading(true)

    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim() === '') {
        getAllUsers()
          .then(setUsers)
          .catch(err => console.error('Failed to load users:', err))
          .finally(() => setIsLoading(false))
      } else {
        searchUsers(searchQuery)
          .then(setUsers)
          .catch(err => console.error('Failed to load users:', err))
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
      alert('Failed to delete user. Please try again.')
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
  }) {
    try {
      await createUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        role: data.role,
      })
      // Refresh the list from the backend so we get the real _id and createdAt
      const refreshed = await getAllUsers()
      setUsers(refreshed)
    } catch (err) {
      console.error('Failed to create user:', err)
      alert('Failed to create user. The email may already be in use.')
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
      alert('Failed to update user. The email may already be in use.')
    }
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">

      <Sidebar user={adminUser} navItems={adminNavItems} />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-16 border-b border-[#dee1e6] flex items-center px-4 gap-3 shrink-0 bg-white z-10">
          <div className="flex-1 flex items-center gap-2 px-3 h-9 bg-[#f3f4f6]/50 rounded-md">
            <img className="w-4 h-4 shrink-0" src="/assets/icon-search.svg" alt="search" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 text-sm font-[Archivo] text-[#565e6c] placeholder:text-[#565e6c] outline-none bg-transparent"
            />
            {isLoading && (
              <div className="w-4 h-4 border-2 border-[#636AE8] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <div className="relative shrink-0">
            <img className="w-5 h-5" src="/assets/icon-bell.svg" alt="notifications" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#de3b40] rounded-full flex items-center justify-center">
              <span className="font-[Archivo] text-white text-[10px]">5</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 md:pb-6 overflow-y-auto min-h-0">

          {/* Title + controls */}
          <div className="flex flex-col gap-3 mb-6">
            <div>
              <h1 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] tracking-tight">Accounts Management</h1>
              <p className="font-[Archivo] text-sm text-[#565e6c] mt-1">Create, edit, and manage user accounts.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 h-10 bg-white border border-[#dee1e6] rounded-md shadow-sm cursor-pointer">
                <img className="w-4 h-4 shrink-0" src="/assets/icon-filter.svg" alt="filter" />
                <span className="font-[Archivo] text-sm font-medium text-[#171a1f]">Filter: All</span>
                <img className="w-4 h-4 shrink-0" src="/assets/icon-chevron-down.svg" alt="chevron" />
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

          {/* User cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {users.map((user, i) => (
              <UserCard
                key={user._id}
                user={user}
                colorIndex={i}
                onEditClick={() => setUserToEdit(user)}
                onRemoveClick={() => setUserToRemove(user)}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#dee1e6] flex items-center justify-around z-20">
        <div className="flex flex-col items-center gap-0.5 px-4 py-2">
          <img className="w-5 h-5" src="/assets/icon-inventory.svg" alt="inventory" />
          <span className="font-[Archivo] text-[10px] text-[#565e6c]">Inventory</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-4 py-2">
          <img className="w-5 h-5" src="/assets/icon-account.svg" alt="accounts" />
          <span className="font-[Archivo] text-[10px] font-bold text-[#93191d]">Accounts</span>
        </div>
      </nav>

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
          userId={adminUser.firstName[0] + adminUser.lastName[0]}
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
