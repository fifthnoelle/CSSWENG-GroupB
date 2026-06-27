// Inventory service — all API calls for inventory management
// Do NOT query MongoDB directly from UI components — use these functions only

import { BASE_URL } from './auth.service'

async function parseError(res: Response, fallback: string) {
  try {
    const body = await res.json()
    return body?.error || body?.message || fallback
  } catch {
    return fallback
  }
}

export async function getInventory() {
  const res = await fetch(`${BASE_URL}/inventory`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to fetch inventory'))
  return res.json()
}

export async function createItem(data: {
  itemName: string
  itemType: string
  measurementUnit: string
  startingStock: number
  lowStockThreshold: number
}) {
  const res = await fetch(`${BASE_URL}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to create item'))
  return res.json()
}

export async function updateItem(id: string, data: {
  itemName?: string
  itemType?: string
  measurementUnit?: string
  startingStock?: number
  lowStockThreshold?: number
}) {
  const res = await fetch(`${BASE_URL}/inventory/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to update item'))
  return res.json()
}

export async function updateStock(id: string, actionType: 'used-today' | 'restock', quantityChanged: number) {
  const res = await fetch(`${BASE_URL}/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType, quantityChanged }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to update stock'))
  return res.json()
}

export async function deleteItem(id: string) {
  const res = await fetch(`${BASE_URL}/inventory/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to delete item'))
}
