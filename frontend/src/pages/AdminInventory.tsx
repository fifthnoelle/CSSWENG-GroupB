import { useState, useEffect } from 'react'
import type { InventoryItem, StockStatus, ActionType } from '../types'
import StockUpdateModal from '../components/StockUpdateModal'
import ItemFormModal from '../components/ItemFormModal'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import { getInventory, createItem, updateItem, updateStock as updateStockApi, deleteItem as deleteItemApi } from '../services/inventory.service'

const adminNavItems = [
  { label: 'Inventory', icon: '/assets/icon-inventory.svg', path: '/admin/inventory' },
  { label: 'Logs',      icon: '/assets/icon-document.svg',  path: '/logs'            },
  { label: 'Reports',   icon: '/assets/icon-chart.svg',     path: '/reports'         },
  { label: 'Accounts',  icon: '/assets/icon-account.svg',   path: '/accounts'        },
]

const adminUser = { firstName: 'John', lastName: 'Doe', role: 'Admin' }

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

function InventoryCard({
  item,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: {
  item: InventoryItem
  onAddClick: () => void
  onEditClick: () => void
  onDeleteClick: () => void
}) {
  const s = statusConfig[getStatus(item)]
  return (
    <div className="bg-white rounded-2xl border border-[#dee1e6] shadow-[0px_1px_2.5px_0px_#171a1f12,_0px_0px_2px_0px_#171a1f14] flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p className="font-[Archivo] text-sm font-semibold text-[#171a1f] leading-5 truncate">{item.itemName}</p>
            <p className="font-[Archivo] text-[10px] text-[#9095a0] leading-4">{item.itemType}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-semibold font-[Archivo] px-2.5 py-1 rounded-full border ${s.bg} ${s.border} ${s.text} whitespace-nowrap`}>
            {s.label}
          </span>
        </div>
        <div className="mt-3">
          <p className="font-[Archivo] text-xs font-semibold text-[#171a1f]">Starting Stock</p>
          <p className="font-[Archivo] text-xs text-[#323842] mt-0.5">{item.startingStock} {item.measurementUnit}</p>
        </div>
        <div className="border-t border-[#dee1e6] my-3" />
        <div>
          <p className="font-[Archivo] text-xs font-semibold text-[#171a1f]">Current Stock</p>
          <p className="font-[Archivo] text-xs text-[#323842] mt-0.5">{item.currentStock} {item.measurementUnit}</p>
        </div>
      </div>

      {/* Admin action buttons: add stock | edit | delete */}
      <div className="border-t border-[#dee1e6] px-4 py-2 flex items-center">
        <button
          id={`btn-add-stock-${item._id}`}
          onClick={onAddClick}
          className="flex-1 flex justify-center p-1.5 rounded-md hover:bg-gray-100"
        >
          <img className="w-5 h-5" src="/assets/icon-add-circle.svg" alt="add stock" />
        </button>
        <div className="w-px h-5 bg-[#dee1e6]" />
        <button
          id={`btn-edit-${item._id}`}
          onClick={onEditClick}
          className="flex-1 flex justify-center p-1.5 rounded-md hover:bg-gray-100"
        >
          <img className="w-4 h-4" src="/assets/icon-pen.svg" alt="edit" />
        </button>
        <div className="w-px h-5 bg-[#dee1e6]" />
        <button
          id={`btn-delete-${item._id}`}
          onClick={onDeleteClick}
          className="flex-1 flex justify-center p-1.5 rounded-md hover:bg-gray-100"
        >
          <img className="w-4 h-4" src="/assets/icon-trash.svg" alt="delete" />
        </button>
      </div>
    </div>
  )
}

function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [showAlert, setShowAlert] = useState(true)

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

  async function handleStockSave(actionType: ActionType, quantityChanged: number) {
    if (!selectedItem) return
    try {
      const result = await updateStockApi(selectedItem._id, actionType as 'used-today' | 'restock', quantityChanged)
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

  async function handleDeleteConfirm() {
    if (!deletingItem) return
    try {
      await deleteItemApi(deletingItem._id)
      setItems(prev => prev.filter(i => i._id !== deletingItem._id))
      setDeletingItem(null)
    } catch (err) {
      console.error('Failed to delete item:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete item. Please try again.')
    }
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">

      <Sidebar user={adminUser} navItems={adminNavItems} />

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-16 border-b border-[#dee1e6] flex items-center px-4 gap-3 shrink-0 bg-white z-10">
          <div className="flex-1 flex items-center gap-2 px-3 h-9 bg-[#f3f4f6]/50 rounded-md">
            <img className="w-4 h-4 shrink-0" src="/assets/icon-search.svg" alt="search" />
            <input
              type="text"
              placeholder="Search ingredient..."
              className="flex-1 text-sm font-[Archivo] text-[#565e6c] placeholder:text-[#565e6c] outline-none bg-transparent"
            />
          </div>
          <NotificationBell />
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">

          {/* Alert banner */}
          {showAlert && lowCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl mb-6">
              <div className="w-9 h-9 bg-[#FEF3C7] rounded-full flex items-center justify-center shrink-0">
                <img className="w-5 h-5" src="/assets/icon-alert.svg" alt="alert" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-[Archivo] text-sm font-bold text-[#78350F]">Attention Required</p>
                <p className="font-[Archivo] text-xs text-[#B45309] mt-1 leading-4">
                  There are <span className="font-bold">{lowCount} items</span> that are currently Low or Out of Stock. Please check the inventory levels.
                </p>
              </div>
              <button className="shrink-0 p-1" onClick={() => setShowAlert(false)}>
                <img className="w-4 h-4" src="/assets/icon-close.svg" alt="close" />
              </button>
            </div>
          )}

          {/* Title + controls */}
          <div className="flex flex-col gap-3 mb-6">
            <div>
              <h1 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] tracking-tight">Inventory Management</h1>
              <p className="font-[Archivo] text-sm text-[#565e6c] mt-1">Manage and track your supplies and ingredients.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 h-10 bg-white border border-[#dee1e6] rounded-md shadow-sm cursor-pointer">
                <img className="w-4 h-4 shrink-0" src="/assets/icon-filter.svg" alt="filter" />
                <span className="font-[Archivo] text-sm font-medium text-[#171a1f]">Filter: All</span>
                <img className="w-4 h-4 shrink-0" src="/assets/icon-chevron-down.svg" alt="chevron" />
              </div>
              {/* Add Ingredient — admin only */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 h-10 bg-[#636AE8] rounded-md shadow-sm hover:bg-[#4f56d4] transition-colors ml-auto"
              >
                <img className="w-4 h-4" src="/assets/icon-plus.svg" alt="plus" />
                <span className="font-[Archivo] text-sm font-medium text-white whitespace-nowrap">Add Ingredient</span>
              </button>
            </div>
          </div>

          {/* Loading / error states */}
          {loading && (
            <p className="font-[Archivo] text-sm text-[#565e6c]">Loading inventory...</p>
          )}
          {!loading && loadError && (
            <p className="font-[Archivo] text-sm text-[#BE123C]">{loadError}</p>
          )}

          {/* Grid */}
          {!loading && !loadError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map(item => (
                <InventoryCard
                  key={item._id}
                  item={item}
                  onAddClick={() => setSelectedItem(item)}
                  onEditClick={() => setEditingItem(item)}
                  onDeleteClick={() => setDeletingItem(item)}
                />
              ))}
            </div>
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

      {/* Delete Confirmation */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-[400px] mx-6 bg-white rounded-xl shadow-lg p-5">
            <p className="font-[Archivo] text-lg font-semibold text-[#171a1f] mb-2">Delete Ingredient</p>
            <p className="font-[Archivo] text-sm text-[#565e6c] mb-5">
              Are you sure you want to delete <span className="font-semibold text-[#171a1f]">{deletingItem.itemName}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingItem(null)}
                className="h-10 px-5 border border-[#dee1e6] rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="h-10 px-5 bg-[#BE123C] rounded-md font-[Archivo] text-sm font-medium text-white shadow-sm hover:bg-[#9f0f33] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInventory
