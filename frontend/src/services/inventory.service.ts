// Inventory service — all API calls for inventory management
// Do NOT query MongoDB directly from UI components — use these functions only

const BASE_URL = 'http://localhost:3000'

export async function getInventory() {
  const res = await fetch(`${BASE_URL}/inventory`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch inventory')
  return res.json()
}

export async function updateStock(id: string, actionType: 'used-today' | 'restock', quantityChanged: number) {
  const res = await fetch(`${BASE_URL}/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType, quantityChanged }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to update stock')
  return res.json()
}

export async function deleteItem(id: string) {
  const res = await fetch(`${BASE_URL}/inventory/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete item')
}
