import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  'restore-item':     { label: 'Item Restored',     bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' },
  'create-user':      { label: 'Account Created',   bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' },
  'edit-user':        { label: 'Account Edited',    bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]' },
  'edit-role':        { label: 'Role Changed',      bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  'delete-user':      { label: 'Account Deleted',   bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'account-locked':   { label: 'Account Locked',    bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'login-success':    { label: 'Login Success',     bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' },
  'login-failed':     { label: 'Login Failed',      bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'change-password':  { label: 'Password Changed',  bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]' },
  'forgot-password':  { label: 'Password Reset',    bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  'access-control-failure': { label: 'Access Denied',      bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'validation-failure':     { label: 'Validation Failed',  bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
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
  const [searchParams] = useSearchParams()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logType, setLogType] = useState<'' | 'inventory' | 'accounts'>(() => {
    const fromUrl = searchParams.get('logType')
    return fromUrl === 'inventory' || fromUrl === 'accounts' ? fromUrl : ''
  })
  // Feature: the backend's getLogs already supported filtering by
  // actionType/startDate/endDate — this page just never exposed controls
  // for them, only the Inventory/Accounts toggle above.
  const [actionType, setActionType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [detailLog, setDetailLog] = useState<Log | null>(null)

  const hasExtraFilters = !!(actionType || startDate || endDate)
  // Today as YYYY-MM-DD, matching a <input type="date"> value — used to
  // cap both filters so nobody can pick a date that hasn't happened yet
  // (there can never be a log entry for the future).
  const today = new Date().toISOString().slice(0, 10)
  // Bug fixes: two problems with the raw date inputs —
  // 1) nothing stopped "From" from being picked later than "To" — the
  //    query would silently just come back empty (the backend applies
  //    $gte/$lte independently, so start > end simply never matches
  //    anything), which read as "no activity happened" rather than "the
  //    filter itself doesn't make sense."
  // 2) nothing stopped either date from being set in the future, even
  //    though a log entry for a date that hasn't happened yet is
  //    impossible by definition.
  // The min/max attributes on the inputs below handle this for the
  // calendar picker; this message is the fallback for manual typing,
  // which can slip past min/max in some browsers.
  const dateRangeError =
    (startDate && startDate > today) || (endDate && endDate > today)
      ? "Dates can't be in the future"
      : startDate && endDate && startDate > endDate
      ? '"From" date is after "To" date'
      : ''
  const invalidRange = !!dateRangeError

  const loadLogs = useCallback(async () => {
    if (invalidRange) {
      setLogs([])
      setTotalPages(1)
      setTotal(0)
      setLoading(false)
      setError('')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await getLogs({
        logType: logType || undefined,
        actionType: actionType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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
  }, [logType, actionType, startDate, endDate, sort, page])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  function handleFilterChange(next: '' | 'inventory' | 'accounts') {
    setLogType(next)
    setPage(1)
  }

  function handleActionTypeChange(next: string) {
    setActionType(next)
    setPage(1)
  }

  function handleDateChange(which: 'start' | 'end', value: string) {
    if (which === 'start') setStartDate(value)
    else setEndDate(value)
    setPage(1)
  }

  function handleClearExtraFilters() {
    setActionType('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  async function handleExportExcel() {
    if (invalidRange) {
      alert(`${dateRangeError} — fix the date range before exporting.`)
      return
    }
    setExporting(true)
    try {
      const allLogs: Log[] = []
      let currentPage = 1
      const maxPages = 50 // safety cap — 50 * 200 = 10,000 rows
      while (currentPage <= maxPages) {
        const res = await getLogs({
          logType: logType || undefined,
          actionType: actionType || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
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
          <div className="flex flex-wrap items-center gap-2 mb-2">
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

            {/* Feature: action-type filter */}
            <div className="relative">
              <select
                value={actionType}
                onChange={e => handleActionTypeChange(e.target.value)}
                className="h-9 pl-3 pr-8 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-sm font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none cursor-pointer appearance-none"
              >
                <option value="">All Actions</option>
                {Object.entries(actionLabels).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
              <img
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none dark:invert"
                src="/assets/icon-chevron-down.svg"
                alt="chevron"
              />
            </div>

            {/* Feature: date-range filter — same idea as the Reports page's
                Month/Custom Range picker, just simplified to two date
                inputs since Logs needs day-level, not month-level, precision.
                Bug fixes: each input's min/max is tied to the other (so
                "From" can't be picked after "To" and vice versa) AND capped
                at today (so neither can be a future date — logs can't exist
                for something that hasn't happened yet). */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={e => handleDateChange('start', e.target.value)}
                max={endDate || today}
                aria-label="From date"
                className={`h-9 px-2 bg-white dark:bg-[#1f2128] border rounded-md shadow-sm font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none ${
                  invalidRange ? 'border-[#FECDD3] dark:border-[#991b1b]' : 'border-[#dee1e6] dark:border-white/10'
                }`}
              />
              <span className="font-[Archivo] text-xs text-[#9095a0] dark:text-[#6b7280]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => handleDateChange('end', e.target.value)}
                min={startDate || undefined}
                max={today}
                aria-label="To date"
                className={`h-9 px-2 bg-white dark:bg-[#1f2128] border rounded-md shadow-sm font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none ${
                  invalidRange ? 'border-[#FECDD3] dark:border-[#991b1b]' : 'border-[#dee1e6] dark:border-white/10'
                }`}
              />
            </div>

            {invalidRange && (
              <span className="font-[Archivo] text-xs text-[#BE123C] dark:text-[#fca5a5]">
                {dateRangeError}
              </span>
            )}

            {hasExtraFilters && (
              <button
                onClick={handleClearExtraFilters}
                className="font-[Archivo] text-xs font-semibold text-[#636AE8] hover:underline"
              >
                Clear filters
              </button>
            )}

            <button
              onClick={() => setSort(s => (s === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-2 px-3 h-9 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors sm:ml-auto"
            >
              <span className="font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb]">
                {sort === 'desc' ? 'Newest first' : 'Oldest first'}
              </span>
            </button>
          </div>

          <div className="mb-3">
            <span className="font-[Archivo] text-xs text-[#9095a0] dark:text-[#6b7280]">
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
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">
              {invalidRange ? 'Fix the date range above to see results.' : 'No activity recorded for these filters.'}
            </p>
          )}

          {/* Table */}
          {!loading && !error && logs.length > 0 && (
            <>
            <p className="font-[Archivo] text-xs text-[#9095a0] dark:text-[#6b7280] mb-2">Click a row to see the full entry, including the complete notes.</p>
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
                      <tr
                        key={log._id}
                        onClick={() => setDetailLog(log)}
                        className="border-t border-[#dee1e6] dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                      >
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
                        <td className="px-4 py-3 font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] max-w-[200px] truncate">
                          {log.notes || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </>
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

      {/* Full log detail — opened by clicking a row. Every field gets its
          own full-width line here, so long notes are always fully readable
          regardless of screen size, instead of depending on table column
          width or a cramped inline "show more". */}
      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetailLog(null)}>
          <div
            className="w-full sm:max-w-[520px] sm:mx-6 max-h-[90vh] bg-white dark:bg-[#1f2128] sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#dee1e6] dark:border-white/10 shrink-0">
              <p className="font-[Archivo] text-lg font-bold text-[#171a1f] dark:text-[#f3f4f6]">Log Entry</p>
              <button onClick={() => setDetailLog(null)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10">
                <img className="w-4 h-4 dark:invert" src="/assets/icon-close.svg" alt="close" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-5 flex flex-col gap-4">
              {(() => {
                const badge = actionBadge(detailLog.actionType)
                const target = detailLog.logType === 'accounts'
                  ? detailLog.userTargetName
                  : (detailLog.itemName || detailLog.itemId || '—')
                const hasStockChange = detailLog.logType === 'inventory' &&
                  (detailLog.actionType === 'used-today' || detailLog.actionType === 'restock')
                return (
                  <>
                    <div>
                      <p className="font-[Archivo] text-xs font-semibold text-[#9095a0] uppercase tracking-wide mb-1">Date</p>
                      <p className="font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb]">{formatDate(detailLog.actionTime)}</p>
                    </div>
                    <div>
                      <p className="font-[Archivo] text-xs font-semibold text-[#9095a0] uppercase tracking-wide mb-1">User</p>
                      <p className="font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb]">{detailLog.userName}</p>
                    </div>
                    <div>
                      <p className="font-[Archivo] text-xs font-semibold text-[#9095a0] uppercase tracking-wide mb-1">Action</p>
                      <span className={`inline-block text-xs font-semibold font-[Archivo] px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div>
                      <p className="font-[Archivo] text-xs font-semibold text-[#9095a0] uppercase tracking-wide mb-1">Target</p>
                      <p className="font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb]">{target || '—'}</p>
                    </div>
                    {hasStockChange && (
                      <div>
                        <p className="font-[Archivo] text-xs font-semibold text-[#9095a0] uppercase tracking-wide mb-1">Change</p>
                        <p className="font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb]">
                          {detailLog.previousStock} → {detailLog.newStock} {detailLog.measurementUnit}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="font-[Archivo] text-xs font-semibold text-[#9095a0] uppercase tracking-wide mb-1">Notes</p>
                      <p className="font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb] whitespace-pre-wrap break-words">
                        {detailLog.notes || '—'}
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LogsPage
