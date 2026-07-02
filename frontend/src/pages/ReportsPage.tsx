import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import { getMonthlySummary, getInactiveItems, getAccountActivity } from '../services/reports.service'
import type { MonthlySummaryItem, InactiveItem, AccountActivityResponse } from '../services/reports.service'
import { useUser } from '../context/UserContext'

const adminNavItems = [
  { label: 'Inventory', icon: '/assets/icon-inventory.svg', path: '/admin/inventory' },
  { label: 'Logs',      icon: '/assets/icon-document.svg',  path: '/logs'            },
  { label: 'Reports',   icon: '/assets/icon-chart.svg',     path: '/reports'         },
  { label: 'Accounts',  icon: '/assets/icon-account.svg',   path: '/accounts'        },
]

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatLastUsed(value: string | null) {
  if (!value) return 'Never used'
  const d = new Date(value)
  return `Last used ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function todayValue() {
  return new Date().toISOString().slice(0, 10)
}

const accountChangeLabels: Record<string, { label: string; bg: string; text: string }> = {
  'create-user': { label: 'Account Created', bg: 'bg-[#D1FAE5]', text: 'text-[#047857]' },
  'delete-user': { label: 'Account Deleted', bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
  'edit-role':   { label: 'Role Changed',    bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
}

function formatEventTime(value: string) {
  const d = new Date(value)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function ReportsPage() {
  const { user } = useUser()
  const [rangeMode, setRangeMode] = useState<'month' | 'custom'>('month')
  const [month, setMonth] = useState(currentMonthValue())
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(todayValue())

  const [resolvedRange, setResolvedRange] = useState<{ startDate: string; endDate: string } | null>(null)
  const [items, setItems] = useState<MonthlySummaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [inactiveItems, setInactiveItems] = useState<InactiveItem[]>([])
  const [inactiveLoading, setInactiveLoading] = useState(true)
  const [inactiveError, setInactiveError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [accountActivity, setAccountActivity] = useState<AccountActivityResponse | null>(null)
  const [accountLoading, setAccountLoading] = useState(true)
  const [accountError, setAccountError] = useState('')

  const loadAccountActivity = useCallback(async () => {
    setAccountLoading(true)
    setAccountError('')
    try {
      const res = rangeMode === 'custom'
        ? await getAccountActivity({ startDate, endDate })
        : await getAccountActivity({ month })
      setAccountActivity(res)
    } catch (err) {
      console.error('Failed to load account activity:', err)
      setAccountError(err instanceof Error ? err.message : 'Failed to load account activity.')
    } finally {
      setAccountLoading(false)
    }
  }, [rangeMode, month, startDate, endDate])

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = rangeMode === 'custom'
        ? await getMonthlySummary({ startDate, endDate })
        : await getMonthlySummary({ month })
      setItems(res.items)
      setResolvedRange({ startDate: res.startDate, endDate: res.endDate })
    } catch (err) {
      console.error('Failed to load summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to load summary.')
    } finally {
      setLoading(false)
    }
  }, [rangeMode, month, startDate, endDate])

  const loadInactive = useCallback(async () => {
    setInactiveLoading(true)
    setInactiveError('')
    try {
      const res = await getInactiveItems(30)
      setInactiveItems(res)
    } catch (err) {
      console.error('Failed to load inactive items:', err)
      setInactiveError(err instanceof Error ? err.message : 'Failed to load inactive items.')
    } finally {
      setInactiveLoading(false)
    }
  }, [])

  useEffect(() => { loadSummary() }, [loadSummary])
  useEffect(() => { loadInactive() }, [loadInactive])
  useEffect(() => { loadAccountActivity() }, [loadAccountActivity])

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
            <h1 className="font-[Archivo] text-lg font-bold text-[#171a1f] dark:text-[#f3f4f6]">Reports</h1>
          </div>
          <NotificationBell />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">

          {/* Inactive items panel — US-A8 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-[Archivo] text-base font-bold text-[#171a1f] dark:text-[#f3f4f6]">Unused Items</h2>
                <p className="font-[Archivo] text-xs text-[#565e6c] dark:text-[#9095a0] mt-0.5">
                  Items with no recorded usage in the last 30 days.
                </p>
              </div>
            </div>

            {inactiveLoading && (
              <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">Checking item activity...</p>
            )}
            {!inactiveLoading && inactiveError && (
              <p className="font-[Archivo] text-sm text-[#BE123C]">{inactiveError}</p>
            )}
            {!inactiveLoading && !inactiveError && inactiveItems.length === 0 && (
              <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">Every item has seen activity in the last 30 days.</p>
            )}
            {!inactiveLoading && !inactiveError && inactiveItems.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {inactiveItems.map(item => (
                  <div
                    key={item.itemId}
                    className="flex items-start gap-3 p-3 bg-[#FFFBEB] dark:bg-[#3f2d08] border border-[#FDE68A] dark:border-[#78350F] rounded-xl min-w-[220px]"
                  >
                    <div className="w-8 h-8 bg-[#FEF3C7] rounded-full flex items-center justify-center shrink-0">
                      <img className="w-4 h-4" src="/assets/icon-alert.svg" alt="alert" />
                    </div>
                    <div>
                      <p className="font-[Archivo] text-sm font-semibold text-[#78350F] dark:text-[#FDE68A]">{item.itemName}</p>
                      <p className="font-[Archivo] text-xs text-[#B45309] dark:text-[#FDE68A] mt-0.5">{formatLastUsed(item.lastUsedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#dee1e6] dark:border-white/10 mb-6" />

          {/* Monthly summary — US-A5 */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div>
              <h2 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] dark:text-[#f3f4f6] tracking-tight">Stock Summary</h2>
              <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] mt-1">
                Beginning inventory, purchases, usage, and ending stock
                {resolvedRange ? ` for ${resolvedRange.startDate} to ${resolvedRange.endDate}.` : '.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-[#f3f4f6] dark:bg-white/5 rounded-md p-1 gap-1">
                <button
                  onClick={() => setRangeMode('month')}
                  className={`px-3 h-8 rounded text-sm font-bold font-[Inter] transition-colors ${
                    rangeMode === 'month' ? 'bg-white dark:bg-[#1f2128] text-[#323842] dark:text-[#e5e7eb] shadow-sm' : 'text-[#9095a0]'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setRangeMode('custom')}
                  className={`px-3 h-8 rounded text-sm font-bold font-[Inter] transition-colors ${
                    rangeMode === 'custom' ? 'bg-white dark:bg-[#1f2128] text-[#323842] dark:text-[#e5e7eb] shadow-sm' : 'text-[#9095a0]'
                  }`}
                >
                  Custom Range
                </button>
              </div>

              {rangeMode === 'month' ? (
                <input
                  type="month"
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="h-10 px-3 border border-[#dee1e6] dark:border-white/10 dark:bg-[#1f2128] rounded-md font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="h-10 px-3 border border-[#dee1e6] dark:border-white/10 dark:bg-[#1f2128] rounded-md font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none"
                  />
                  <span className="font-[Archivo] text-sm text-[#9095a0]">to</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={todayValue()}
                    onChange={e => setEndDate(e.target.value)}
                    className="h-10 px-3 border border-[#dee1e6] dark:border-white/10 dark:bg-[#1f2128] rounded-md font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {loading && (
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">Loading summary...</p>
          )}
          {!loading && error && (
            <p className="font-[Archivo] text-sm text-[#BE123C]">{error}</p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">No inventory items to summarize yet.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="border border-[#dee1e6] dark:border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-[#f3f4f6]/60 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Item</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Beginning Stock</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Purchases</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Usage</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Ending Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.itemId} className="border-t border-[#dee1e6] dark:border-white/10">
                      <td className="px-4 py-3 font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">{item.itemName}</td>
                      <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f] dark:text-[#d1d5db]">{item.beginningStock} {item.measurementUnit}</td>
                      <td className="px-4 py-3 font-[Archivo] text-sm text-[#047857] dark:text-[#34d399]">+{item.purchases} {item.measurementUnit}</td>
                      <td className="px-4 py-3 font-[Archivo] text-sm text-[#BE123C] dark:text-[#fca5a5]">-{item.usage} {item.measurementUnit}</td>
                      <td className="px-4 py-3 font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">{item.endingStock} {item.measurementUnit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-[#dee1e6] dark:border-white/10 my-8" />

          {/* Account Activity — login trends, lockouts, and account changes.
              Reuses the same Month / Custom Range controls set above. */}
          <div className="mb-5">
            <h2 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] dark:text-[#f3f4f6] tracking-tight">Account Activity</h2>
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] mt-1">
              Login activity and account changes
              {accountActivity ? ` for ${accountActivity.startDate} to ${accountActivity.endDate}.` : '.'}
            </p>
          </div>

          {accountLoading && (
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">Loading account activity...</p>
          )}
          {!accountLoading && accountError && (
            <p className="font-[Archivo] text-sm text-[#BE123C]">{accountError}</p>
          )}

          {!accountLoading && !accountError && accountActivity && (
            <>
              {/* Login activity stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="p-4 border border-[#dee1e6] dark:border-white/10 rounded-xl">
                  <p className="font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0] uppercase tracking-wide">Successful Logins</p>
                  <p className="font-[Archivo] text-2xl font-bold text-[#047857] dark:text-[#34d399] mt-1">{accountActivity.loginActivity.totalSuccess}</p>
                </div>
                <div className="p-4 border border-[#dee1e6] dark:border-white/10 rounded-xl">
                  <p className="font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0] uppercase tracking-wide">Failed Logins</p>
                  <p className="font-[Archivo] text-2xl font-bold text-[#BE123C] dark:text-[#fca5a5] mt-1">{accountActivity.loginActivity.totalFailed}</p>
                </div>
                <div className="p-4 border border-[#dee1e6] dark:border-white/10 rounded-xl">
                  <p className="font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0] uppercase tracking-wide">Account Lockouts</p>
                  <p className="font-[Archivo] text-2xl font-bold text-[#B45309] dark:text-[#fbbf24] mt-1">{accountActivity.loginActivity.totalLockouts}</p>
                </div>
              </div>

              {/* Simple day-by-day login trend — no charting lib in this project,
                  so this is a lightweight CSS bar chart. */}
              {accountActivity.loginActivity.byDay.length > 0 && (
                <div className="border border-[#dee1e6] dark:border-white/10 rounded-xl p-4 mb-8">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="flex items-center gap-1.5 font-[Archivo] text-xs text-[#565e6c] dark:text-[#9095a0]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#047857]" /> Success
                    </span>
                    <span className="flex items-center gap-1.5 font-[Archivo] text-xs text-[#565e6c] dark:text-[#9095a0]">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#BE123C]" /> Failed
                    </span>
                  </div>
                  <div className="flex items-end gap-2 h-32 overflow-x-auto">
                    {(() => {
                      const maxCount = Math.max(1, ...accountActivity.loginActivity.byDay.map(d => d.success + d.failed))
                      return accountActivity.loginActivity.byDay.map(day => (
                        <div key={day.date} className="flex flex-col items-center gap-1 shrink-0 w-9">
                          <div className="flex flex-col-reverse w-full h-24 justify-start rounded-sm overflow-hidden bg-[#f3f4f6] dark:bg-white/5">
                            <div
                              className="w-full bg-[#047857]"
                              style={{ height: `${(day.success / maxCount) * 100}%` }}
                              title={`${day.success} successful`}
                            />
                            <div
                              className="w-full bg-[#BE123C]"
                              style={{ height: `${(day.failed / maxCount) * 100}%` }}
                              title={`${day.failed} failed`}
                            />
                          </div>
                          <span className="font-[Archivo] text-[10px] text-[#9095a0] whitespace-nowrap">
                            {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              )}

              {/* Account change stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="p-4 border border-[#dee1e6] dark:border-white/10 rounded-xl">
                  <p className="font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0] uppercase tracking-wide">Accounts Created</p>
                  <p className="font-[Archivo] text-2xl font-bold text-[#171a1f] dark:text-[#e5e7eb] mt-1">{accountActivity.accountChanges.created}</p>
                </div>
                <div className="p-4 border border-[#dee1e6] dark:border-white/10 rounded-xl">
                  <p className="font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0] uppercase tracking-wide">Accounts Deleted</p>
                  <p className="font-[Archivo] text-2xl font-bold text-[#171a1f] dark:text-[#e5e7eb] mt-1">{accountActivity.accountChanges.deleted}</p>
                </div>
                <div className="p-4 border border-[#dee1e6] dark:border-white/10 rounded-xl">
                  <p className="font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0] uppercase tracking-wide">Role Changes</p>
                  <p className="font-[Archivo] text-2xl font-bold text-[#171a1f] dark:text-[#e5e7eb] mt-1">{accountActivity.accountChanges.roleChanges}</p>
                </div>
              </div>

              {accountActivity.accountChanges.events.length === 0 ? (
                <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">No account changes in this range.</p>
              ) : (
                <div className="border border-[#dee1e6] dark:border-white/10 rounded-xl overflow-x-auto">
                  <table className="w-full text-left min-w-[560px]">
                    <thead className="bg-[#f3f4f6]/60 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Date</th>
                        <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Change</th>
                        <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">By</th>
                        <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Account</th>
                        <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c] dark:text-[#9095a0]">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountActivity.accountChanges.events.map((event, i) => {
                        const badge = accountChangeLabels[event.actionType] || { label: event.actionType, bg: 'bg-[#f3f4f6]', text: 'text-[#565e6c]' }
                        return (
                          <tr key={`${event.actionTime}-${i}`} className="border-t border-[#dee1e6] dark:border-white/10">
                            <td className="px-4 py-3 font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] whitespace-nowrap">{formatEventTime(event.actionTime)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold font-[Archivo] px-2.5 py-1 rounded-full ${badge.bg} ${badge.text} whitespace-nowrap`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb]">{event.userName}</td>
                            <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f] dark:text-[#e5e7eb]">{event.userTargetName || '—'}</td>
                            <td className="px-4 py-3 font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">{event.notes || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default ReportsPage
