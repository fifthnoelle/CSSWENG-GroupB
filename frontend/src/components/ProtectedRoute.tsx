import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import type {ProtectedRouteProps} from '../types'

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
