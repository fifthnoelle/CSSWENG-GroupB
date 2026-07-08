import { useState, useEffect } from 'react'
import type { InventoryItem, StockStatus, ActionType } from '../types'
import StockUpdateModal from '../components/StockUpdateModal'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import { getInventory, updateStock as updateStockApi } from '../services/inventory.service'
import { useUser } from '../context/UserContext'

const staffNavItems = [
  { label: 'Inventory', icon: '/assets/icon-inventory.svg', path: '/inventory' },
]

const statusConfig: Record<StockStatus, { label: string; bg: string; border: string; text: string }> = {
  'in-stock':     { label: 'IN STOCK',     bg: 'bg-[#D1FAE5]', border: 'border-[#A7F3D0]', text: 'text-[#047857]' },
  'low-stock':    { label: 'LOW STOCK',    bg: 'bg-[#FEF3C7]', border: 'border-[#FDE68A]', text: 'text-[#B45309]' },
  'out-of-stock': { label: 'OUT OF STOCK', bg: 'bg-[#FFE4E6]', border: 'border-[#FECDD3]', text: 'text-[#BE123C]' },
}

function getStatus(item: InventoryItem): StockStatus {
  if (item.currentStock === 0) return 'out-of-stock'
  if (item.currentStock <= item.lowStockThreshold) return 'low-stock'
  return 'in-stock'
}

function InventoryCard({ item, onAddClick }: { item: InventoryItem; onAddClick: () => void }) {
  const s = statusConfig[getStatus(item)]
  return (
    <div className="bg-white dark:bg-[#1f2128] rounded-2xl border border-[#dee1e6] dark:border-white/10 shadow-[0px_1px_2.5px_0px_#171a1f12,_0px_0px_2px_0px_#171a1f14] flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb] leading-5 truncate">{item.itemName}</p>
            <p className="font-[Archivo] text-[10px] text-[#9095a0] dark:text-[#6b7280] leading-4">{item.itemType}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-semibold font-[Archivo] px-2.5 py-1 rounded-full border ${s.bg} ${s.border} ${s.text} whitespace-nowrap`}>
            {s.label}
          </span>
        </div>
        <div className="mt-3">
          <p className="font-[Archivo] text-xs font-semibold text-[#171a1f] dark:text-[#e5e7eb]">Starting Stock</p>
          <p className="font-[Archivo] text-xs text-[#323842] dark:text-[#9095a0] mt-0.5">{item.startingStock} {item.measurementUnit}</p>
        </div>
        <div className="border-t border-[#dee1e6] dark:border-white/10 my-3" />
        <div>
          <p className="font-[Archivo] text-xs font-semibold text-[#171a1f] dark:text-[#e5e7eb]">Current Stock</p>
          <p className="font-[Archivo] text-xs text-[#323842] dark:text-[#9095a0] mt-0.5">{item.currentStock} {item.measurementUnit}</p>
        </div>
      </div>
      <div className="border-t border-[#dee1e6] dark:border-white/10 px-4 py-2 flex items-center justify-center">
        <button id={`btn-add-stock-${item._id}`} onClick={onAddClick} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10">
          <img className="w-5 h-5 dark:invert" src="/assets/icon-add-circle.svg" alt="add stock" />
        </button>
      </div>
    </div>
  )
}

function Inventory() {
  const { user } = useUser()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showAlert, setShowAlert] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const filterLabels: Record<'all' | StockStatus, string> = {
    all: 'All',
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock',
  }

  const visibleItems = items.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    const matchesStatus = statusFilter === 'all' || getStatus(item) === statusFilter
    return matchesSearch && matchesStatus
  })

  const lowCount = items.filter(i => getStatus(i) !== 'in-stock').length

  async function loadItems() {
    setLoading(true)
    setLoadError('')
    try {
      const data = await getInventory()
      setItems(data)
    } catch (err) {
      console.error('Failed to load inventory:', err)
      setLoadError('Failed to load inventory. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  // Feature: forwards the new optional `notes` field through to the API
  // (see StockUpdateModal.tsx / inventory.service.ts).
  async function handleSave(actionType: ActionType, quantityChanged: number, notes: string) {
    if (!selectedItem) return
    try {
      const result = await updateStockApi(selectedItem._id, actionType as 'used-today' | 'restock', quantityChanged, notes)
      setItems(prev => prev.map(i => (i._id === selectedItem._id ? result.item : i)))
    } catch (err) {
      console.error('Failed to update stock:', err)
      alert(err instanceof Error ? err.message : 'Failed to update stock. Please try again.')
    }
  }

  if (!user) return null

  return (
    <div className="h-screen bg-white dark:bg-[#14151a] flex overflow-hidden">

      <Sidebar user={user} navItems={staffNavItems} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      {/* ── Main ── */}
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
          <div className="flex-1 flex items-center gap-2 px-3 h-9 bg-[#f3f4f6]/50 dark:bg-white/5 rounded-md">
            <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-search.svg" alt="search" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ingredient..."
              className="flex-1 text-sm font-[Archivo] text-[#565e6c] dark:text-[#d1d5db] placeholder:text-[#565e6c] dark:placeholder:text-[#6b7280] outline-none bg-transparent"
            />
          </div>
          <NotificationBell />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 pb-6 overflow-y-auto min-h-0">

          {/* Alert banner */}
          {showAlert && lowCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-[#FFFBEB] dark:bg-[#3f2d08] border border-[#FDE68A] dark:border-[#78350F] rounded-xl mb-6">
              <div className="w-9 h-9 bg-[#FEF3C7] dark:bg-[#78350F] rounded-full flex items-center justify-center shrink-0">
                <img className="w-5 h-5" src="/assets/icon-alert.svg" alt="alert" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-[Archivo] text-sm font-bold text-[#78350F] dark:text-[#FDE68A]">Attention Required</p>
                <p className="font-[Archivo] text-xs text-[#B45309] dark:text-[#FDE68A] mt-1 leading-4">
                  There are <span className="font-bold">{lowCount} items</span> that are currently Low or Out of Stock. Please check the inventory levels.
                </p>
              </div>
              <button className="shrink-0 p-1" onClick={() => setShowAlert(false)}>
                <img className="w-4 h-4 dark:invert" src="/assets/icon-close.svg" alt="close" />
              </button>
            </div>
          )}

          {/* Title + filter */}
          <div className="flex flex-col gap-3 mb-6">
            <div>
              <h1 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] dark:text-[#f3f4f6] tracking-tight">Inventory Management</h1>
              <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] mt-1">Manage and track your supplies and ingredients.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setFilterOpen(o => !o)}
                  className="flex items-center gap-2 px-3 h-10 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-sm cursor-pointer w-full md:w-auto"
                >
                  <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-filter.svg" alt="filter" />
                  <span className="font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb] flex-1">Filter: {filterLabels[statusFilter]}</span>
                  <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-chevron-down.svg" alt="chevron" />
                </button>
                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                    <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-lg z-20 py-1">
                      {(['all', 'in-stock', 'low-stock', 'out-of-stock'] as const).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setStatusFilter(opt); setFilterOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-sm font-[Archivo] hover:bg-gray-100 dark:hover:bg-white/10 ${statusFilter === opt ? 'font-semibold text-[#636AE8]' : 'text-[#171a1f] dark:text-[#e5e7eb]'}`}
                        >
                          {filterLabels[opt]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Loading / error states */}
          {loading && (
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">Loading inventory...</p>
          )}
          {!loading && loadError && (
            <p className="font-[Archivo] text-sm text-[#BE123C] dark:text-[#fca5a5]">{loadError}</p>
          )}

          {/* Grid */}
          {!loading && !loadError && visibleItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleItems.map(item => (
                <InventoryCard key={item._id} item={item} onAddClick={() => setSelectedItem(item)} />
              ))}
            </div>
          )}
          {!loading && !loadError && visibleItems.length === 0 && (
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">No items match your search or filter.</p>
          )}
        </main>
      </div>

      {/* ── Stock Update Modal ── */}
      {selectedItem && (
        <StockUpdateModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default Inventory
