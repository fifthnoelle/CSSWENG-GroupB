// Inventory service — all API calls for inventory management
// Do NOT query MongoDB directly from UI components — use these functions only

// Bug fix (#8): shared parseApiError (see auth.service.ts) replaces the
// local parseError this file used to define — the local version never
// redirected to /login on a 401, unlike logs/reports.service.ts. Aliased
// to `parseError` so every call site below is unchanged.
import { BASE_URL, parseApiError as parseError } from './auth.service'

// Feature: `archived` lets the caller request the archived view instead of
// the active inventory (see AdminInventory.tsx's "View Archived" toggle).
export async function getInventory(options: { archived?: boolean } = {}) {
  const query = options.archived ? '?archived=true' : ''
  const res = await fetch(`${BASE_URL}/inventory${query}`, { credentials: 'include' })
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

// Feature: `notes` is a new optional fourth argument — the backend already
// accepted it (updateStock destructures `notes` from the request body),
// but nothing on the frontend ever sent one. See StockUpdateModal.tsx.
export async function updateStock(id: string, actionType: 'used-today' | 'restock', quantityChanged: number, notes = '') {
  const res = await fetch(`${BASE_URL}/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType, quantityChanged, notes }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to update stock'))
  return res.json()
}

// Feature: this now archives the item rather than permanently deleting it
// (see inventory.controller.js) — the HTTP call itself is unchanged.
export async function deleteItem(id: string) {
  const res = await fetch(`${BASE_URL}/inventory/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to archive item'))
}

// Feature: brings an archived item back into the active inventory.
export async function restoreItem(id: string) {
  const res = await fetch(`${BASE_URL}/inventory/${id}/restore`, {
    method: 'PATCH',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to restore item'))
  return res.json()
}
