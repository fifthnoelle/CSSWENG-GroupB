import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import { getLogs } from '../services/logs.service'
import type { Log } from '../types'
import { useUser } from '../context/UserContext'

const adminNavItems = [
  { label: 'Inventory', icon: '/assets/icon-inventory.svg', path: '/admin/inventory' },
  { label: 'Logs',      icon: '/assets/icon-document.svg',  path: '/logs'            },
  { label: 'Reports',   icon: '/assets/icon-chart.svg',     path: '/reports'         },
  { label: 'Accounts',  icon: '/assets/icon-account.svg',   path: '/accounts'        },
]

const actionLabels: Record<string, { label: string; bg: string; text: string }> = {
  'used-today':       { label: 'Used Today',        bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  'restock':          { label: 'Restock',           bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' },
  'create-item':      { label: 'Item Created',      bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]' },
  'edit-item':        { label: 'Item Edited',       bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]' },
  'delete-item':      { label: 'Item Deleted',      bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'create-user':      { label: 'Account Created',   bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' },
  'edit-user':        { label: 'Account Edited',    bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]' },
  'edit-role':        { label: 'Role Changed',      bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  'delete-user':      { label: 'Account Deleted',   bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'account-locked':   { label: 'Account Locked',    bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'login-success':    { label: 'Login Success',     bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' },
  'login-failed':     { label: 'Login Failed',      bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'change-password':  { label: 'Password Changed',  bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]' },
  'forgot-password':  { label: 'Password Reset',    bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
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
  const { user } = useUser()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logType, setLogType] = useState<'' | 'inventory' | 'accounts'>('')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  function toggleNote(id: string) {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  async function handleExportExcel() {
    setExporting(true)
    try {
      const allLogs: Log[] = []
      let currentPage = 1
      const maxPages = 50 // safety cap — 50 * 200 = 10,000 rows
      while (currentPage <= maxPages) {
        const res = await getLogs({
          logType: logType || undefined,
          sort,
          page: currentPage,
          limit: 200,
        })
        allLogs.push(...res.logs)
        if (currentPage >= res.pagination.totalPages) break
        currentPage++
      }

      const rows = allLogs.map(log => {
        const badge = actionBadge(log.actionType)
        const target = log.logType === 'accounts'
          ? log.userTargetName
          : (log.itemName || log.itemId || '')
        const hasStockChange = log.logType === 'inventory' &&
          (log.actionType === 'used-today' || log.actionType === 'restock')
        return {
          Date: formatDate(log.actionTime),
          User: log.userName,
          Action: badge.label,
          Target: target,
          Change: hasStockChange ? `${log.previousStock} -> ${log.newStock} ${log.measurementUnit}` : '',
          Notes: log.notes,
        }
      })

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Activity Logs')
      XLSX.writeFile(wb, `activity_logs_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      console.error('Failed to export logs:', err)
      alert(err instanceof Error ? err.message : 'Failed to export logs.')
    } finally {
      setExporting(false)
    }
  }

  if (!user) return null

  return (
    <div className="h-screen bg-white dark:bg-[#14151a] flex overflow-hidden">

      <Sidebar user={user} navItems={adminNavItems} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-16 border-b border-[#dee1e6] dark:border-white/10 flex items-center px-4 gap-3 shrink-0 bg-white dark:bg-[#14151a] z-10">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-[#171a1f] dark:text-[#e5e7eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <div className="flex-1">
            <h1 className="font-[Archivo] text-lg font-bold text-[#171a1f] dark:text-[#f3f4f6]">Activity Logs</h1>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-3 h-9 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-document.svg" alt="export" />
            <span className="font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb] hidden sm:inline">
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </span>
          </button>
          <NotificationBell />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">

          <div className="mb-6">
            <h2 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] dark:text-[#f3f4f6] tracking-tight">Audit Trail</h2>
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] mt-1">
              Every inventory and account change, tied to who made it and when.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="flex bg-[#f3f4f6] dark:bg-white/5 rounded-md p-1 gap-1">
              {(['', 'inventory', 'accounts'] as const).map(opt => (
                <button
                  key={opt || 'all'}
                  onClick={() => handleFilterChange(opt)}
                  className={`px-3 h-8 rounded text-sm font-bold font-[Inter] transition-colors ${
                    logType === opt ? 'bg-white dark:bg-[#1f2128] text-[#323842] dark:text-[#e5e7eb] shadow-sm' : 'text-[#9095a0]'
                  }`}
                >
                  {opt === '' ? 'All' : opt === 'inventory' ? 'Inventory' : 'Accounts'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSort(s => (s === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-2 px-3 h-9 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              <span className="font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb]">
                {sort === 'desc' ? 'Newest first' : 'Oldest first'}
              </span>
            </button>

            <span className="font-[Archivo] text-xs text-[#9095a0] dark:text-[#6b7280] ml-auto">
              {total} {total === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Loading / error states */}
          {loading && (
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">Loading logs...</p>
          )}
          {!loading && error && (
            <p className="font-[Archivo] text-sm text-[#BE123C]">{error}</p>
          )}
          {!loading && !error && logs.length === 0 && (
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">No activity recorded yet.</p>
          )}

          {/* Table */}
          {!loading && !error && logs.length > 0 && (
            <div className="border border-[#dee1e6] dark:border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-[#f3f4f6]/60 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Date</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">User</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Action</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Target</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Change</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Notes</th>
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
                      <tr key={log._id} className="border-t border-[#dee1e6] dark:border-white/10">
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] whitespace-nowrap">
                          {formatDate(log.actionTime)}
                        </td>
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb]">{log.userName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold font-[Archivo] px-2.5 py-1 rounded-full ${badge.bg} ${badge.text} whitespace-nowrap`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb]">{target || '—'}</td>
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb] whitespace-nowrap">
                          {hasStockChange
                            ? `${log.previousStock} → ${log.newStock} ${log.measurementUnit}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] max-w-[280px]">
                          {log.notes ? (
                            <>
                              <span className={expandedNotes.has(log._id) ? 'block whitespace-normal break-words' : 'block truncate'}>
                                {log.notes}
                              </span>
                              {log.notes.length > 42 && (
                                <button
                                  type="button"
                                  onClick={() => toggleNote(log._id)}
                                  className="text-xs font-semibold text-[#636AE8] hover:underline mt-0.5"
                                >
                                  {expandedNotes.has(log._id) ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </>
                          ) : '—'}
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
                className="h-9 px-3 border border-[#dee1e6] dark:border-white/10 rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb] bg-white dark:bg-[#1f2128] hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="h-9 px-3 border border-[#dee1e6] dark:border-white/10 rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb] bg-white dark:bg-[#1f2128] hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
