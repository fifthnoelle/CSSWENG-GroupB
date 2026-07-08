import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import type { InventoryItem, StockStatus, ActionType } from '../types'
import StockUpdateModal from '../components/StockUpdateModal'
import ItemFormModal from '../components/ItemFormModal'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import { getInventory, createItem, updateItem, updateStock as updateStockApi, deleteItem as deleteItemApi, restoreItem as restoreItemApi } from '../services/inventory.service'
import { useUser } from '../context/UserContext'

const adminNavItems = [
  { label: 'Inventory', icon: '/assets/icon-inventory.svg', path: '/admin/inventory' },
  { label: 'Logs',      icon: '/assets/icon-document.svg',  path: '/logs'            },
  { label: 'Reports',   icon: '/assets/icon-chart.svg',     path: '/reports'         },
  { label: 'Accounts',  icon: '/assets/icon-account.svg',   path: '/accounts'        },
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

// Small inline icons for the archive feature — inline SVG rather than
// /assets/... references, same reasoning as the password-visibility
// toggle elsewhere: it can never break on a missing asset file.
function ArchiveIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <line x1="10" y1="13" x2="14" y2="13" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <polyline points="3 4 3 9 8 9" />
    </svg>
  )
}

function InventoryCard({
  item,
  archived,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onRestoreClick,
}: {
  item: InventoryItem
  archived: boolean
  onAddClick: () => void
  onEditClick: () => void
  onDeleteClick: () => void
  onRestoreClick: () => void
}) {
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

      {/* Admin action buttons: add stock | edit | archive — or, for an
          already-archived item, just Restore. */}
      <div className="border-t border-[#dee1e6] dark:border-white/10 px-4 py-2 flex items-center">
        {archived ? (
          <button
            id={`btn-restore-${item._id}`}
            onClick={onRestoreClick}
            className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-[#636AE8]"
          >
            <RestoreIcon />
            <span className="font-[Archivo] text-xs font-semibold">Restore</span>
          </button>
        ) : (
          <>
            <button
              id={`btn-add-stock-${item._id}`}
              onClick={onAddClick}
              className="flex-1 flex justify-center p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <img className="w-5 h-5 dark:invert" src="/assets/icon-add-circle.svg" alt="add stock" />
            </button>
            <div className="w-px h-5 bg-[#dee1e6] dark:bg-white/10" />
            <button
              id={`btn-edit-${item._id}`}
              onClick={onEditClick}
              className="flex-1 flex justify-center p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <img className="w-4 h-4 dark:invert" src="/assets/icon-pen.svg" alt="edit" />
            </button>
            <div className="w-px h-5 bg-[#dee1e6] dark:bg-white/10" />
            <button
              id={`btn-delete-${item._id}`}
              onClick={onDeleteClick}
              className="flex-1 flex justify-center p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <img className="w-4 h-4 dark:invert" src="/assets/icon-trash.svg" alt="archive" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AdminInventory() {
  const { user } = useUser()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [showAlert, setShowAlert] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  // Feature: soft-delete/archive. "Delete Ingredient" now archives instead
  // of permanently removing the item — this toggles between the normal
  // active-inventory view and a separate view of archived items, from
  // which they can be restored.
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active')

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
      const data = await getInventory({ archived: viewMode === 'archived' })
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
    // Selections from the other view don't carry over — avoids e.g. a
    // stale "delete" confirmation referencing an item no longer in view.
    setSelectedItem(null)
    setEditingItem(null)
    setDeletingItem(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode])

  // Feature: forwards the new optional `notes` field through to the API
  // (see StockUpdateModal.tsx / inventory.service.ts).
  async function handleStockSave(actionType: ActionType, quantityChanged: number, notes: string) {
    if (!selectedItem) return
    try {
      const result = await updateStockApi(selectedItem._id, actionType as 'used-today' | 'restock', quantityChanged, notes)
      setItems(prev => prev.map(i => (i._id === selectedItem._id ? result.item : i)))
    } catch (err) {
      console.error('Failed to update stock:', err)
      alert(err instanceof Error ? err.message : 'Failed to update stock. Please try again.')
    }
  }

  async function handleAddSave(data: {
    itemName: string
    itemType: string
    measurementUnit: string
    startingStock: number
    lowStockThreshold: number
  }) {
    try {
      const result = await createItem(data)
      setItems(prev => [...prev, result.item])
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to create item:', err)
      alert(err instanceof Error ? err.message : 'Failed to create item. Please try again.')
    }
  }

  async function handleEditSave(data: {
    itemName: string
    itemType: string
    measurementUnit: string
    startingStock: number
    lowStockThreshold: number
  }) {
    if (!editingItem) return
    try {
      const result = await updateItem(editingItem._id, data)
      setItems(prev => prev.map(i => (i._id === editingItem._id ? result.item : i)))
      setEditingItem(null)
    } catch (err) {
      console.error('Failed to update item:', err)
      alert(err instanceof Error ? err.message : 'Failed to update item. Please try again.')
    }
  }

  // Feature: "delete" now archives — the item leaves the active view but
  // isn't gone, and can be brought back from the Archived view below.
  async function handleDeleteConfirm() {
    if (!deletingItem) return
    try {
      await deleteItemApi(deletingItem._id)
      setItems(prev => prev.filter(i => i._id !== deletingItem._id))
      setDeletingItem(null)
    } catch (err) {
      console.error('Failed to archive item:', err)
      alert(err instanceof Error ? err.message : 'Failed to archive item. Please try again.')
    }
  }

  // Feature: bring an archived item back into the active inventory.
  async function handleRestore(item: InventoryItem) {
    try {
      await restoreItemApi(item._id)
      setItems(prev => prev.filter(i => i._id !== item._id))
    } catch (err) {
      console.error('Failed to restore item:', err)
      alert(err instanceof Error ? err.message : 'Failed to restore item. Please try again.')
    }
  }

  // Exports whatever's currently on screen — so filtering to "Low Stock"
  // first and then exporting gives a ready-made restock/shopping list,
  // same idea as the Excel export already on Logs and Reports.
  function handleExportExcel() {
    setExporting(true)
    try {
      const rows = visibleItems.map(item => ({
        Item: item.itemName,
        Type: item.itemType,
        Status: statusConfig[getStatus(item)].label,
        'Current Stock': item.currentStock,
        'Starting Stock': item.startingStock,
        'Low Stock Threshold': item.lowStockThreshold,
        Unit: item.measurementUnit,
      }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), viewMode === 'archived' ? 'Archived' : 'Inventory')
      XLSX.writeFile(wb, `inventory_${viewMode === 'archived' ? 'archived_' : ''}${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) {
      console.error('Failed to export inventory:', err)
      alert(err instanceof Error ? err.message : 'Failed to export inventory.')
    } finally {
      setExporting(false)
    }
  }

  if (!user) return null

  const archivedView = viewMode === 'archived'

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
          <button
            onClick={handleExportExcel}
            disabled={exporting || visibleItems.length === 0}
            className="flex items-center gap-2 px-3 h-9 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Alert banner — active view only */}
          {!archivedView && showAlert && lowCount > 0 && (
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

          {/* Title + controls */}
          <div className="flex flex-col gap-3 mb-6">
            <div>
              <h1 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] dark:text-[#f3f4f6] tracking-tight">
                {archivedView ? 'Archived Ingredients' : 'Inventory Management'}
              </h1>
              <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] mt-1">
                {archivedView
                  ? 'Items removed from the active inventory. Restore one to bring it back.'
                  : 'Manage and track your supplies and ingredients.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen(o => !o)}
                  className="flex items-center gap-2 px-3 h-10 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-md shadow-sm cursor-pointer"
                >
                  <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-filter.svg" alt="filter" />
                  <span className="font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb]">Filter: {filterLabels[statusFilter]}</span>
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

              {/* Feature: toggle between active inventory and the archive */}
              <button
                type="button"
                onClick={() => setViewMode(v => v === 'active' ? 'archived' : 'active')}
                className={`flex items-center gap-2 px-3 h-10 border rounded-md shadow-sm transition-colors ${
                  archivedView
                    ? 'bg-[#636AE8]/10 border-[#636AE8]/30 text-[#636AE8]'
                    : 'bg-white dark:bg-[#1f2128] border-[#dee1e6] dark:border-white/10 text-[#171a1f] dark:text-[#e5e7eb] hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
              >
                <ArchiveIcon />
                <span className="font-[Archivo] text-sm font-medium whitespace-nowrap">
                  {archivedView ? 'View Active' : 'View Archived'}
                </span>
              </button>

              {/* Add Ingredient — active view only */}
              {!archivedView && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 h-10 bg-[#636AE8] rounded-md shadow-sm hover:bg-[#4f56d4] transition-colors ml-auto"
                >
                  <img className="w-4 h-4" src="/assets/icon-plus.svg" alt="plus" />
                  <span className="font-[Archivo] text-sm font-medium text-white whitespace-nowrap">Add Ingredient</span>
                </button>
              )}
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
                <InventoryCard
                  key={item._id}
                  item={item}
                  archived={archivedView}
                  onAddClick={() => setSelectedItem(item)}
                  onEditClick={() => setEditingItem(item)}
                  onDeleteClick={() => setDeletingItem(item)}
                  onRestoreClick={() => handleRestore(item)}
                />
              ))}
            </div>
          )}
          {!loading && !loadError && visibleItems.length === 0 && (
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">
              {archivedView ? 'No archived items.' : 'No items match your search or filter.'}
            </p>
          )}
        </main>
      </div>

      {/* Stock Update Modal */}
      {selectedItem && (
        <StockUpdateModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleStockSave}
        />
      )}

      {/* Add Ingredient Modal */}
      {showAddModal && (
        <ItemFormModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
        />
      )}

      {/* Edit Ingredient Modal */}
      {editingItem && (
        <ItemFormModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Archive Confirmation */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-[400px] mx-6 bg-white dark:bg-[#1f2128] rounded-xl shadow-lg p-5">
            <p className="font-[Archivo] text-lg font-semibold text-[#171a1f] dark:text-[#f3f4f6] mb-2">Archive Ingredient</p>
            <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] mb-5">
              Remove <span className="font-semibold text-[#171a1f] dark:text-[#f3f4f6]">{deletingItem.itemName}</span> from the active inventory? It'll move to the Archived view, where it can be restored later.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingItem(null)}
                className="h-10 px-5 border border-[#dee1e6] dark:border-white/10 rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb] bg-white dark:bg-[#1f2128] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="h-10 px-5 bg-[#BE123C] rounded-md font-[Archivo] text-sm font-medium text-white shadow-sm hover:bg-[#9f0f33] transition-colors"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInventory
