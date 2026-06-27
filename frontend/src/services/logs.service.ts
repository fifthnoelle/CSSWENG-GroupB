// Logs service — all API calls for the audit trail (Admin/Owner only)
// Do NOT query MongoDB directly from UI components — use these functions only

import { BASE_URL } from './auth.service'
import type { Log } from '../types'

export interface LogsQuery {
  logType?: 'inventory' | 'accounts'
  itemId?: string
  userId?: string
  actionType?: string
  startDate?: string
  endDate?: string
  sort?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface LogsResponse {
  logs: Log[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function parseError(res: Response, fallback: string) {
  try {
    const body = await res.json()
    return body?.error || body?.message || fallback
  } catch {
    return fallback
  }
}

export async function getLogs(query: LogsQuery = {}): Promise<LogsResponse> {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })

  const res = await fetch(`${BASE_URL}/logs?${params.toString()}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to fetch logs'))
  return res.json()
}

export async function getLogsByItem(itemId: string): Promise<Log[]> {
  const res = await fetch(`${BASE_URL}/logs/item/${itemId}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await parseError(res, 'Failed to fetch item logs'))
  return res.json()
}
