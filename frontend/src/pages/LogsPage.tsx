import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import { getLogs } from '../services/logs.service'
import type { Log } from '../types'

const adminNavItems = [
  { label: 'Inventory', icon: '/assets/icon-inventory.svg', path: '/admin/inventory' },
  { label: 'Logs',      icon: '/assets/icon-document.svg',  path: '/logs'            },
  { label: 'Reports',   icon: '/assets/icon-chart.svg',     path: '/reports'         },
  { label: 'Accounts',  icon: '/assets/icon-account.svg',   path: '/accounts'        },
]

const adminUser = { firstName: 'John', lastName: 'Doe', role: 'Admin' }

const actionLabels: Record<string, { label: string; bg: string; text: string }> = {
  'used-today':   { label: 'Used Today',    bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  'restock':      { label: 'Restock',       bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' },
  'create-item':  { label: 'Item Created',  bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]' },
  'edit-item':    { label: 'Item Edited',   bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]' },
  'delete-item':  { label: 'Item Deleted',  bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'create-user':  { label: 'Account Created', bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' },
  'edit-user':    { label: 'Account Edited',   bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]' },
  'edit-role':    { label: 'Role Changed',     bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  'delete-user':  { label: 'Account Deleted',  bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'account-locked': { label: 'Account Locked', bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
}

function actionBadge(actionType: string) {
  return actionLabels[actionType] || { label: actionType, bg: 'bg-[#f3f4f6]', text: 'text-[#565e6c]' }
}

function formatDate(value: string) {
  const d = new Date(value)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  })
}

function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logType, setLogType] = useState<'' | 'inventory' | 'accounts'>('')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getLogs({
        logType: logType || undefined,
        sort,
        page,
        limit: 25,
      })
      setLogs(res.logs)
      setTotalPages(res.pagination.totalPages || 1)
      setTotal(res.pagination.total || 0)
    } catch (err) {
      console.error('Failed to load logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load logs.')
    } finally {
      setLoading(false)
    }
  }, [logType, sort, page])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  function handleFilterChange(next: '' | 'inventory' | 'accounts') {
    setLogType(next)
    setPage(1)
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">

      <Sidebar user={adminUser} navItems={adminNavItems} />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-16 border-b border-[#dee1e6] flex items-center px-4 gap-3 shrink-0 bg-white z-10">
          <div className="flex-1">
            <h1 className="font-[Archivo] text-lg font-bold text-[#171a1f]">Activity Logs</h1>
          </div>
          <NotificationBell />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">

          <div className="mb-6">
            <h2 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] tracking-tight">Audit Trail</h2>
            <p className="font-[Archivo] text-sm text-[#565e6c] mt-1">
              Every inventory and account change, tied to who made it and when.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="flex bg-[#f3f4f6] rounded-md p-1 gap-1">
              {(['', 'inventory', 'accounts'] as const).map(opt => (
                <button
                  key={opt || 'all'}
                  onClick={() => handleFilterChange(opt)}
                  className={`px-3 h-8 rounded text-sm font-bold font-[Inter] transition-colors ${
                    logType === opt ? 'bg-white text-[#323842] shadow-sm' : 'text-[#9095a0]'
                  }`}
                >
                  {opt === '' ? 'All' : opt === 'inventory' ? 'Inventory' : 'Accounts'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSort(s => (s === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-2 px-3 h-9 bg-white border border-[#dee1e6] rounded-md shadow-sm hover:bg-gray-50 transition-colors"
            >
              <span className="font-[Archivo] text-sm font-medium text-[#171a1f]">
                {sort === 'desc' ? 'Newest first' : 'Oldest first'}
              </span>
            </button>

            <span className="font-[Archivo] text-xs text-[#9095a0] ml-auto">
              {total} {total === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Loading / error states */}
          {loading && (
            <p className="font-[Archivo] text-sm text-[#565e6c]">Loading logs...</p>
          )}
          {!loading && error && (
            <p className="font-[Archivo] text-sm text-[#BE123C]">{error}</p>
          )}
          {!loading && !error && logs.length === 0 && (
            <p className="font-[Archivo] text-sm text-[#565e6c]">No activity recorded yet.</p>
          )}

          {/* Table */}
          {!loading && !error && logs.length > 0 && (
            <div className="border border-[#dee1e6] rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#f3f4f6]/60">
                  <tr>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Date</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">User</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Action</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Target</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Change</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const badge = actionBadge(log.actionType)
                    const target = log.logType === 'accounts'
                      ? log.userTargetName
                      : (log.itemName || log.itemId || '—')
                    const hasStockChange = log.logType === 'inventory' &&
                      (log.actionType === 'used-today' || log.actionType === 'restock')
                    return (
                      <tr key={log._id} className="border-t border-[#dee1e6]">
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#565e6c] whitespace-nowrap">
                          {formatDate(log.actionTime)}
                        </td>
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f]">{log.userName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold font-[Archivo] px-2.5 py-1 rounded-full ${badge.bg} ${badge.text} whitespace-nowrap`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f]">{target || '—'}</td>
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f] whitespace-nowrap">
                          {hasStockChange
                            ? `${log.previousStock} → ${log.newStock} ${log.measurementUnit}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#565e6c] max-w-[260px] truncate">
                          {log.notes || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="h-9 px-3 border border-[#dee1e6] rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="font-[Archivo] text-sm text-[#565e6c]">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="h-9 px-3 border border-[#dee1e6] rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default LogsPage
