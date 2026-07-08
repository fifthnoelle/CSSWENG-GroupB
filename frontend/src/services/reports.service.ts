// Reports service — all API calls for monthly summaries & inactive-item alerts (Admin/Owner only)

// Bug fix (#8): local parseError (identical to this) replaced with the
// shared version from auth.service.ts, so user.service.ts and
// inventory.service.ts now behave the same way on a 401 as this file
// already did.
import { BASE_URL, parseApiError as parseError } from './auth.service'

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
  startDate: string
  endDate: string
  items: MonthlySummaryItem[]
}

export interface InactiveItem {
  itemId: string
  itemName: string
  measurementUnit: string
  lastUsedAt: string | null
  isInactive: boolean
}

export interface AccountActivityDay {
  date: string
  success: number
  failed: number
}

export interface AccountChangeEvent {
  actionTime: string
  actionType: string
  userName: string
  userTargetName: string
  notes: string
}

export interface AccountActivityResponse {
  startDate: string
  endDate: string
  loginActivity: {
    totalSuccess: number
    totalFailed: number
    totalLockouts: number
    byDay: AccountActivityDay[]
  }
  accountChanges: {
    created: number
    deleted: number
    roleChanges: number
    events: AccountChangeEvent[]
  }
}

export async function getMonthlySummary(
  params: { month?: string; startDate?: string; endDate?: string } = {}
): Promise<MonthlySummaryResponse> {
  const query = new URLSearchParams()
  if (params.startDate && params.endDate) {
    query.set('startDate', params.startDate)
    query.set('endDate', params.endDate)
  } else if (params.month) {
    query.set('month', params.month)
  }
  const res = await fetch(`${BASE_URL}/reports/monthly-summary?${query.toString()}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to fetch summary'))
  return res.json()
}

export async function getInactiveItems(days = 30): Promise<InactiveItem[]> {
  const res = await fetch(`${BASE_URL}/reports/inactive-items?days=${days}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to fetch inactive items'))
  return res.json()
}

export async function getAccountActivity(
  params: { month?: string; startDate?: string; endDate?: string } = {}
): Promise<AccountActivityResponse> {
  const query = new URLSearchParams()
  if (params.startDate && params.endDate) {
    query.set('startDate', params.startDate)
    query.set('endDate', params.endDate)
  } else if (params.month) {
    query.set('month', params.month)
  }
  const res = await fetch(`${BASE_URL}/reports/account-activity?${query.toString()}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to fetch account activity'))
  return res.json()
}
