// ── Users Collection ──────────────────────────────────────
export interface User {
  _id: string
  email: string
  firstName: string
  middleName?: string
  lastName: string
  role: 'admin' | 'staff'
  lockedUntil?: string | null
  createdAt: string
  // 2.1.11 — last use (successful or failed) of this account
  lastLoginAt?: string | null
  lastLoginStatus?: 'success' | 'failed' | null
  lastLoginIp?: string
}

// Bug fix (#6): the login response includes a `previousLogin` snapshot —
// the login/failure state from BEFORE the login that just happened, meant
// to flag things like "a failed attempt happened before you got in." This
// was being computed by the backend but never read or shown by the
// frontend. See UserContext.tsx / Sidebar.tsx / Login.tsx.
export interface PreviousLogin {
  lastLoginAt: string | null
  lastLoginStatus: 'success' | 'failed' | null
  lastLoginIp?: string
}

export interface UserContextType {
  user: User | null
  loading: boolean
  previousLogin: PreviousLogin | null
  refreshUser: () => Promise<void>
  clearUser: () => void
  setPreviousLogin: (previousLogin: PreviousLogin | null) => void
}

export interface ProtectedRouteProps {
  children: React.ReactNode
}

export interface AdminRouteProps {
  children: React.ReactNode
}

// ── Inventory Collection ───────────────────────────────────
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export interface InventoryItem {
  _id: string
  itemName: string
  itemType: string
  measurementUnit: string
  startingStock: number
  currentStock: number
  lowStockThreshold: number
  createdBy: string
  createdAt: string
}

// ── Logs Collection ────────────────────────────────────────
export type LogType = 'inventory' | 'accounts'

export type ActionType =
  | 'used-today'
  | 'restock'
  | 'create-item'
  | 'edit-item'
  | 'delete-item'
  | 'create-user'
  | 'edit-user'
  | 'edit-role'
  | 'delete-user'
  | 'account-locked'

export interface Log {
  _id: string
  userId: string
  logType: LogType
  userName: string
  userTarget: string
  userTargetName: string  // only when target is a user, otherwise empty string
  itemId: string
  itemName?: string        // snapshot of item name at log time — inventory logs only, omitted for account logs
  actionType: ActionType
  quantityChanged: number
  previousStock: number
  newStock: number
  measurementUnit: string
  notes: string
  actionTime: string
}
