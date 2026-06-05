import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { getUser } from '../services/auth.service'
import type { User, UserContextType } from '../types'

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
  }, [])

  useEffect(() => {
    // Try to fetch current user on app load
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, clearUser }}>
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
