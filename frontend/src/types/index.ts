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
export type ActionType = 'used-today' | 'restock'

export interface Log {
  _id: string
  userId: string
  itemId: string
  actionType: ActionType
  quantityChanged: number
  previousStock: number
  newStock: number
  actionTime: string
}
