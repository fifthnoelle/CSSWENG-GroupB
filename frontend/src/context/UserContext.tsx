import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { getUser } from '../services/auth.service'
import type { User, UserContextType, PreviousLogin } from '../types'

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Bug fix (#6): holds the "previous login" snapshot returned by the
  // login API for the current browser session only (it's not persisted —
  // there's nowhere sensible to persist it, and it's only meaningful right
  // after a fresh login). Sidebar prefers this over user.lastLoginAt when
  // it's available, since user.lastLoginAt reflects the CURRENT session by
  // the time it's fetched, not the one before it.
  const [previousLogin, setPreviousLogin] = useState<PreviousLogin | null>(null)

  const refreshUser = useCallback(async () => {
    try {
      const userData = await getUser()
      setUser(userData)
    } catch {
      setUser(null)
    }
  }, [])

  const clearUser = useCallback(() => {
    setUser(null)
    setPreviousLogin(null)
  }, [])

  useEffect(() => {
    // Try to fetch current user on app load
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  return (
    <UserContext.Provider value={{ user, loading, previousLogin, refreshUser, clearUser, setPreviousLogin }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
