// Reports service — all API calls for monthly summaries & inactive-item alerts (Admin/Owner only)

import { BASE_URL } from './auth.service'

export interface MonthlySummaryItem {
  itemId: string
  itemName: string
  itemType: string
  measurementUnit: string
  beginningStock: number
  purchases: number
  usage: number
  endingStock: number
}

export interface MonthlySummaryResponse {
  month: string
  items: MonthlySummaryItem[]
}

export interface InactiveItem {
  itemId: string
  itemName: string
  measurementUnit: string
  lastUsedAt: string | null
  isInactive: boolean
}

async function parseError(res: Response, fallback: string) {
  try {
    const body = await res.json()
    return body?.error || body?.message || fallback
  } catch {
    return fallback
  }
}

export async function getMonthlySummary(month?: string): Promise<MonthlySummaryResponse> {
  const params = month ? `?month=${month}` : ''
  const res = await fetch(`${BASE_URL}/reports/monthly-summary${params}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to fetch monthly summary'))
  return res.json()
}

export async function getInactiveItems(days = 30): Promise<InactiveItem[]> {
  const res = await fetch(`${BASE_URL}/reports/inactive-items?days=${days}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to fetch inactive items'))
  return res.json()
}
