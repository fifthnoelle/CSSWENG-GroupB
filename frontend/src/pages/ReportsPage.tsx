import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
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

function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

function formatLastUsed(value: string | null) {
  if (!value) return 'Never used'
  const d = new Date(value)
  return `Last used ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function ReportsPage() {
  const [month, setMonth] = useState(currentMonthValue())
  const [items, setItems] = useState<MonthlySummaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [inactiveItems, setInactiveItems] = useState<InactiveItem[]>([])
  const [inactiveLoading, setInactiveLoading] = useState(true)
  const [inactiveError, setInactiveError] = useState('')

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getMonthlySummary(month)
      setItems(res.items)
    } catch (err) {
      console.error('Failed to load monthly summary:', err)
      setError(err instanceof Error ? err.message : 'Failed to load monthly summary.')
    } finally {
      setLoading(false)
    }
  }, [month])

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
    <div className="h-screen bg-white flex overflow-hidden">

      <Sidebar user={adminUser} navItems={adminNavItems} />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-16 border-b border-[#dee1e6] flex items-center px-4 gap-3 shrink-0 bg-white z-10">
          <div className="flex-1">
            <h1 className="font-[Archivo] text-lg font-bold text-[#171a1f]">Reports</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">

          {/* Inactive items panel — US-A8 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-[Archivo] text-base font-bold text-[#171a1f]">Unused Items</h2>
                <p className="font-[Archivo] text-xs text-[#565e6c] mt-0.5">
                  Items with no recorded usage in the last 30 days.
                </p>
              </div>
            </div>

            {inactiveLoading && (
              <p className="font-[Archivo] text-sm text-[#565e6c]">Checking item activity...</p>
            )}
            {!inactiveLoading && inactiveError && (
              <p className="font-[Archivo] text-sm text-[#BE123C]">{inactiveError}</p>
            )}
            {!inactiveLoading && !inactiveError && inactiveItems.length === 0 && (
              <p className="font-[Archivo] text-sm text-[#565e6c]">Every item has seen activity in the last 30 days.</p>
            )}
            {!inactiveLoading && !inactiveError && inactiveItems.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {inactiveItems.map(item => (
                  <div
                    key={item.itemId}
                    className="flex items-start gap-3 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl min-w-[220px]"
                  >
                    <div className="w-8 h-8 bg-[#FEF3C7] rounded-full flex items-center justify-center shrink-0">
                      <img className="w-4 h-4" src="/assets/icon-alert.svg" alt="alert" />
                    </div>
                    <div>
                      <p className="font-[Archivo] text-sm font-semibold text-[#78350F]">{item.itemName}</p>
                      <p className="font-[Archivo] text-xs text-[#B45309] mt-0.5">{formatLastUsed(item.lastUsedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#dee1e6] mb-6" />

          {/* Monthly summary — US-A5 */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div>
              <h2 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] tracking-tight">Monthly Summary</h2>
              <p className="font-[Archivo] text-sm text-[#565e6c] mt-1">
                Beginning inventory, purchases, usage, and ending stock for {monthLabel(month)}.
              </p>
            </div>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="h-10 px-3 border border-[#dee1e6] rounded-md font-[Archivo] text-sm text-[#171a1f] outline-none"
            />
          </div>

          {loading && (
            <p className="font-[Archivo] text-sm text-[#565e6c]">Loading summary...</p>
          )}
          {!loading && error && (
            <p className="font-[Archivo] text-sm text-[#BE123C]">{error}</p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="font-[Archivo] text-sm text-[#565e6c]">No inventory items to summarize yet.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="border border-[#dee1e6] rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#f3f4f6]/60">
                  <tr>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Item</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Beginning Stock</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Purchases</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Usage</th>
                    <th className="px-4 py-3 font-[Archivo] text-xs font-semibold text-[#565e6c]">Ending Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.itemId} className="border-t border-[#dee1e6]">
                      <td className="px-4 py-3 font-[Archivo] text-sm font-semibold text-[#171a1f]">{item.itemName}</td>
                      <td className="px-4 py-3 font-[Archivo] text-sm text-[#171a1f]">{item.beginningStock} {item.measurementUnit}</td>
                      <td className="px-4 py-3 font-[Archivo] text-sm text-[#047857]">+{item.purchases} {item.measurementUnit}</td>
                      <td className="px-4 py-3 font-[Archivo] text-sm text-[#BE123C]">-{item.usage} {item.measurementUnit}</td>
                      <td className="px-4 py-3 font-[Archivo] text-sm font-semibold text-[#171a1f]">{item.endingStock} {item.measurementUnit}</td>
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
