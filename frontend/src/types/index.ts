// ── Users Collection ──────────────────────────────────────
export interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'staff'
  createdAt: string
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
export type ActionType = 'used-today' | 'restock' | 'add-item' | 'edit-item' | 'delete-item' | 'add-user' | 'edit-user' | 'delete-user' | 'login' | 'logout' | 'edit-role'
export type LogType = 'inventory' | 'accounts' | 'auth'

export interface Log {
  _id: string
  userId: string
  logType: LogType
  userName: string
  userTarget: string
  userTargetName: string  //only when userTarget is a user, otherwise empty string
  itemId: string
  actionType: ActionType
  quantityChanged: number
  previousStock: number
  newStock: number
  measurementUnit: string
  notes: string
  actionTime: string
}
