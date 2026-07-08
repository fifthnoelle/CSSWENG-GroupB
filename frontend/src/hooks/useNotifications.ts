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

// Bug fix (#7): the bell used to only ever load once per mount (or when
// the user's role changed) — e.g. restocking an item that was flagged
// "low stock" wouldn't clear it from the bell until the page was fully
// reloaded, since the bell keeps its own separate copy of this data rather
// than sharing state with whichever page triggered the change. Polling on
// a modest interval keeps it reasonably fresh without having to wire a
// manual "reload" call into every single mutation across every page.
const POLL_INTERVAL_MS = 60_000

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
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  return { notifications, loading, reload: load }
}
