import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import { getMonthlySummary, getInactiveItems } from '../services/reports.service'
import type { MonthlySummaryItem, InactiveItem } from '../services/reports.service'

const adminNavItems = [
  { label: 'Inventory', icon: '/assets/icon-inventory.svg', path: '/admin/inventory' },
  { label: 'Logs',      icon: '/assets/icon-document.svg',  path: '/logs'            },
  { label: 'Reports',   icon: '/assets/icon-chart.svg',     path: '/reports'         },
  { label: 'Accounts',  icon: '/assets/icon-account.svg',   path: '/accounts'        },
]

const adminUser = { firstName: 'John', lastName: 'Doe', role: 'Admin' }

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

function ReportsPage() {
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

  return (
    <div className="h-screen bg-white dark:bg-[#14151a] flex overflow-hidden">

      <Sidebar user={adminUser} navItems={adminNavItems} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

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
        </main>
      </div>
    </div>
  )
}

export default ReportsPage
