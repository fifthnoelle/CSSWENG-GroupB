import { useState } from 'react'
import type { InventoryItem, StockStatus, ActionType } from '../types'
import StockUpdateModal from '../components/StockUpdateModal'

// ── Static seed data (replace with getInventory() call from inventory.service.ts) ──
const seedItems: InventoryItem[] = [
  { _id: '1',  itemName: 'Wooden Toothpicks', itemType: 'Packaging',  measurementUnit: 'PACKS',   startingStock: 50,   currentStock: 44,  lowStockThreshold: 10,  createdBy: '', createdAt: '' },
  { _id: '2',  itemName: 'Tupperwares',        itemType: 'Packaging',  measurementUnit: 'PCS',     startingStock: 200,  currentStock: 53,  lowStockThreshold: 60,  createdBy: '', createdAt: '' },
  { _id: '3',  itemName: 'Bottle Sauces',      itemType: 'Condiment',  measurementUnit: 'BOTTLES', startingStock: 100,  currentStock: 0,   lowStockThreshold: 10,  createdBy: '', createdAt: '' },
  { _id: '4',  itemName: 'Burger Boxes',       itemType: 'Packaging',  measurementUnit: 'PCS',     startingStock: 500,  currentStock: 320, lowStockThreshold: 50,  createdBy: '', createdAt: '' },
  { _id: '5',  itemName: 'Napkins',            itemType: 'Packaging',  measurementUnit: 'PACKS',   startingStock: 50,   currentStock: 20,  lowStockThreshold: 25,  createdBy: '', createdAt: '' },
  { _id: '6',  itemName: 'Soy Sauce',          itemType: 'Condiment',  measurementUnit: 'GALLONS', startingStock: 10,   currentStock: 8,   lowStockThreshold: 2,   createdBy: '', createdAt: '' },
  { _id: '7',  itemName: 'Chopsticks',         itemType: 'Utensil',    measurementUnit: 'PCS',     startingStock: 1000, currentStock: 0,   lowStockThreshold: 100, createdBy: '', createdAt: '' },
  { _id: '8',  itemName: 'Chicken',            itemType: 'Ingredient', measurementUnit: 'KGS',     startingStock: 15,   currentStock: 10,  lowStockThreshold: 3,   createdBy: '', createdAt: '' },
  { _id: '9',  itemName: 'Orange Sauce',       itemType: 'Condiment',  measurementUnit: 'BOTTLES', startingStock: 10,   currentStock: 7,   lowStockThreshold: 2,   createdBy: '', createdAt: '' },
  { _id: '10', itemName: 'Buffalo Sauce',      itemType: 'Condiment',  measurementUnit: 'BOTTLES', startingStock: 7,    currentStock: 5,   lowStockThreshold: 2,   createdBy: '', createdAt: '' },
  { _id: '11', itemName: 'Barbeque Sauce',     itemType: 'Condiment',  measurementUnit: 'BOTTLES', startingStock: 5,    currentStock: 4,   lowStockThreshold: 2,   createdBy: '', createdAt: '' },
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
      <div className="border-t border-[#dee1e6] px-4 py-2 flex items-center justify-center">
        <button id={`btn-add-stock-${item._id}`} onClick={onAddClick} className="p-1.5 rounded-md hover:bg-gray-100">
          <img className="w-5 h-5" src="/assets/icon-add-circle.svg" alt="add stock" />
        </button>
      </div>
    </div>
  )
}

function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>(seedItems)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showAlert, setShowAlert] = useState(true)

  const lowCount = items.filter(i => getStatus(i) !== 'in-stock').length

  function handleSave(actionType: ActionType, quantityChanged: number) {
    if (!selectedItem) return
    setItems(prev => prev.map(i => {
      if (i._id !== selectedItem._id) return i
      const newStock = actionType === 'used-today'
        ? i.currentStock - quantityChanged
        : i.currentStock + quantityChanged
      return { ...i, currentStock: Math.max(0, newStock) }
    }))
    // TODO: call updateStock(selectedItem._id, actionType, quantityChanged) from inventory.service.ts
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col border-r border-[#dee1e6] h-full shrink-0 w-16 lg:w-64">
        <div className="flex items-center gap-3 px-3 lg:px-5 h-16 shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <img src="/assets/logo.png" className="w-full h-full object-cover" alt="logo" />
          </div>
          <div className="hidden lg:block overflow-hidden">
            <p className="font-[Archivo] text-[#93191d] text-lg font-bold leading-tight truncate">Rice 'N' Roll</p>
            <p className="font-[Archivo] text-[#171a1f] text-base font-bold leading-tight truncate">Inventory</p>
          </div>
        </div>
        <div className="border-t border-[#dee1e6]" />
        <nav className="flex-1 p-2 pt-4">
          <div className="flex items-center gap-3 px-2 lg:px-3 py-3 bg-[#fdf2f2] rounded-md">
            <img className="w-5 h-5 shrink-0" src="/assets/icon-inventory.svg" alt="inventory" />
            <span className="hidden lg:block font-[Archivo] text-sm font-bold text-[#93191d]">Inventory</span>
          </div>
        </nav>
        <div className="p-2 lg:p-3 border-t border-[#dee1e6]">
          <div className="flex items-center gap-3 p-2 border border-[#bcc1ca] rounded-md">
            <div className="w-9 h-9 rounded-full bg-[#d3f9e0] flex items-center justify-center shrink-0">
              <span className="font-[Archivo] text-xs font-bold text-[#073517]">JR</span>
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="font-[Archivo] text-sm font-semibold text-[#171a1f] truncate">James Reyes</p>
              <p className="font-[Archivo] text-sm text-[#9095a0]">Staff</p>
            </div>
            <img className="hidden lg:block w-4 h-4 shrink-0" src="/assets/icon-arrow-down.svg" alt="expand" />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
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
          <div className="relative shrink-0">
            <img className="w-5 h-5" src="/assets/icon-bell.svg" alt="notifications" />
            {lowCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#de3b40] rounded-full flex items-center justify-center">
                <span className="font-[Archivo] text-white text-[10px]">{lowCount}</span>
              </div>
            )}
          </div>
          <div className="md:hidden w-8 h-8 rounded-full bg-[#d3f9e0] flex items-center justify-center shrink-0">
            <span className="font-[Archivo] text-xs font-bold text-[#073517]">JR</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 md:pb-6 overflow-y-auto min-h-0">

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

          {/* Title + filter */}
          <div className="flex flex-col gap-3 mb-6">
            <div>
              <h1 className="font-[Archivo] text-xl md:text-2xl font-bold text-[#171a1f] tracking-tight">Inventory Management</h1>
              <p className="font-[Archivo] text-sm text-[#565e6c] mt-1">Manage and track your supplies and ingredients.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 h-10 bg-white border border-[#dee1e6] rounded-md shadow-sm cursor-pointer w-full md:w-auto">
                <img className="w-4 h-4 shrink-0" src="/assets/icon-filter.svg" alt="filter" />
                <span className="font-[Archivo] text-sm font-medium text-[#171a1f] flex-1">Filter: All</span>
                <img className="w-4 h-4 shrink-0" src="/assets/icon-chevron-down.svg" alt="chevron" />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <InventoryCard key={item._id} item={item} onAddClick={() => setSelectedItem(item)} />
            ))}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#dee1e6] flex items-center justify-around z-20">
        <div className="flex flex-col items-center gap-0.5 px-6 py-2">
          <img className="w-5 h-5" src="/assets/icon-inventory.svg" alt="inventory" />
          <span className="font-[Archivo] text-[10px] font-bold text-[#93191d]">Inventory</span>
        </div>
      </nav>

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
