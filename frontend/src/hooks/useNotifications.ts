import { useState, useEffect, useCallback } from 'react'
import { useUser } from '../context/UserContext'
import { getInventory } from '../services/inventory.service'
import { getAllUsers } from '../services/user.service'
import type { InventoryItem, User, StockStatus } from '../types'

export type NotificationItem =
  | { kind: 'stock'; id: string; title: string; subtitle: string; status: StockStatus }
  | { kind: 'locked-account'; id: string; title: string; subtitle: string }

function getStockStatus(item: InventoryItem): StockStatus {
  if (item.currentStock === 0) return 'out-of-stock'
  if (item.currentStock <= item.lowStockThreshold) return 'low-stock'
  return 'in-stock'
}

/**
 * Single source of truth for the notification bell. Every page renders the
 * same combined feed for the logged-in user — low/out-of-stock items for
 * everyone, plus locked accounts for Admin/Owner — rather than each page
 * computing its own different alert set.
 */
export function useNotifications() {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const results: NotificationItem[] = []

    try {
      const items: InventoryItem[] = await getInventory()
      items
        .filter(i => getStockStatus(i) !== 'in-stock')
        .forEach(i => {
          results.push({
            kind: 'stock',
            id: i._id,
            title: i.itemName,
            subtitle: `${i.currentStock} ${i.measurementUnit} remaining`,
            status: getStockStatus(i)
          })
        })
    } catch (err) {
      console.error('Failed to load stock notifications:', err)
    }

    // Locked accounts are Admin/Owner-only data — skip entirely for Staff
    // rather than firing a request that will just 403.
    if (user?.role === 'admin') {
      try {
        const users: User[] = await getAllUsers()
        users
          .filter(u => u.lockedUntil && new Date(u.lockedUntil) > new Date())
          .forEach(u => {
            results.push({
              kind: 'locked-account',
              id: u._id,
              title: `${u.firstName} ${u.lastName}`,
              subtitle: u.email
            })
          })
      } catch (err) {
        console.error('Failed to load account notifications:', err)
      }
    }

    setNotifications(results)
    setLoading(false)
  }, [user?.role])

  useEffect(() => {
    load()
  }, [load])

  return { notifications, loading, reload: load }
}
