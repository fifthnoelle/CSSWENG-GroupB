import { useState, FormEvent } from 'react'
import type { InventoryItem, ActionType } from '../types'

interface Props {
  item: InventoryItem
  onClose: () => void
  // Feature: `notes` is a new third argument. The Logs schema and the Logs
  // page both already fully support a free-text reason on every stock
  // change (shown in the table, the detail view, and Excel exports — see
  // logs.model.js's comment calling out "Sold" / "Waste" / "Restock" as the
  // intended examples) but there was previously no way to type one in here,
  // even though this is the single most common action in the app.
  onSave: (actionType: ActionType, quantityChanged: number, notes: string) => void
}

function StockUpdateModal({ item, onClose, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<ActionType>('used-today')
  const [quantity, setQuantity] = useState('0')
  const [notes, setNotes] = useState('')

  const isDeduct = activeTab === 'used-today'
  const qtyNum = Number(quantity || 0)
  const projected = isDeduct
    ? item.currentStock - qtyNum
    : item.currentStock + qtyNum

  const exceedsStock = isDeduct && qtyNum > item.currentStock
  const isInvalid = !qtyNum || qtyNum <= 0 || exceedsStock

  const notesPlaceholder = isDeduct
    ? 'e.g. Sold, Waste/spoilage, Staff meal…'
    : 'e.g. Supplier delivery, Correction…'

  function handleSave(event?: FormEvent) {
    event?.preventDefault()
    if (isInvalid) return
    onSave(activeTab, qtyNum, notes.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-[480px] md:max-w-[560px] sm:mx-6 bg-white dark:bg-[#1f2128] sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden">

        {/* Header */}
        <div className="bg-[#f3f4f6]/20 dark:bg-white/5 px-5 py-4 border-b border-[#dee1e6] dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#636AE8]/10 rounded-full flex items-center justify-center shrink-0">
              <img className="w-6 h-6 dark:invert" src="/assets/icon-add-circle.svg" alt="stock" />
            </div>
            <div>
              <p className="font-[Archivo] text-lg font-semibold text-[#171a1f] dark:text-[#f3f4f6] tracking-tight">Stock Update</p>
              <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">
                Update levels for <span className="font-semibold text-[#171a1f] dark:text-[#e5e7eb]">{item.itemName}</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Body */}
          <div className="p-5 flex flex-col gap-5">

            {/* Tab toggle */}
            <div className="flex bg-[#f3f4f6] dark:bg-white/5 rounded-md p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('used-today')}
                className={`flex-1 flex items-center justify-center gap-2 h-8 rounded text-sm font-bold font-[Inter] transition-colors ${
                  activeTab === 'used-today' ? 'bg-white dark:bg-[#1f2128] text-[#323842] dark:text-[#e5e7eb] shadow-sm' : 'text-[#9095a0] dark:text-[#6b7280]'
                }`}
              >
                <img className="w-4 h-4 dark:invert" src="/assets/icon-minus-circle.svg" alt="minus" />
                Used Today
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('restock')}
                className={`flex-1 flex items-center justify-center gap-2 h-8 rounded text-sm font-bold font-[Inter] transition-colors ${
                  activeTab === 'restock' ? 'bg-white dark:bg-[#1f2128] text-[#323842] dark:text-[#e5e7eb] shadow-sm' : 'text-[#9095a0] dark:text-[#6b7280]'
                }`}
              >
                <img className="w-4 h-4 dark:invert" src="/assets/icon-add-circle.svg" alt="plus" />
                Restock
              </button>
            </div>

            {/* Quantity input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="quantity" className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">
                  {isDeduct ? 'Quantity to Deduct' : 'Quantity to Add'}
                </label>
                <span className="text-xs text-[#565e6c] dark:text-[#9095a0] bg-[#f3f4f6] dark:bg-white/5 rounded-full px-3 py-0.5">
                  Current: {item.currentStock} {item.measurementUnit}
                </span>
              </div>
              <div className={`flex items-center border rounded-md overflow-hidden h-11 ${
                exceedsStock ? 'border-red-400' : 'border-[#dee1e6] dark:border-white/10'
              }`}>
                <input
                  id="quantity"
                  name="quantityChanged"
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="flex-1 px-3 h-full text-sm font-[Archivo] text-[#171a1f] dark:text-[#e5e7eb] outline-none bg-white dark:bg-[#1f2128]"
                  min={0}
                  max={isDeduct ? item.currentStock : undefined}
                />
                <div className="h-full flex items-center px-3 border-l border-[#dee1e6] dark:border-white/10 text-sm text-[#565e6c] dark:text-[#9095a0] font-[Archivo] bg-white dark:bg-[#1f2128] shrink-0">
                  {item.measurementUnit}
                </div>
              </div>
              {exceedsStock && (
                <p className="text-xs text-red-500 dark:text-red-400 font-[Archivo] mt-1.5">
                  Cannot deduct more than current stock ({item.currentStock} {item.measurementUnit}).
                </p>
              )}
            </div>

            {/* Reason / notes — optional, feeds the audit log's notes field */}
            <div>
              <label htmlFor="notes" className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">
                Reason <span className="font-normal text-[#9095a0] dark:text-[#6b7280]">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={notesPlaceholder}
                rows={2}
                maxLength={280}
                className="mt-2 w-full px-3 py-2 border border-[#dee1e6] dark:border-white/10 rounded-md text-sm font-[Archivo] text-[#171a1f] dark:text-[#e5e7eb] placeholder:text-[#9095a0] dark:placeholder:text-[#6b7280] outline-none bg-white dark:bg-[#1f2128] focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20 transition resize-none"
              />
            </div>

            {/* Projected stock */}
            <div className={`border rounded-xl p-4 flex items-center justify-between gap-4 ${
              exceedsStock ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900' : 'bg-[#f2f2fd] dark:bg-[#636AE8]/10 border-[#636AE8]/10 dark:border-[#636AE8]/20'
            }`}>
              <div>
                <p className={`font-[Archivo] text-xs font-bold uppercase tracking-wide ${
                  exceedsStock ? 'text-red-500 dark:text-red-400' : 'text-[#636AE8]'
                }`}>
                  Projected Stock Level
                </p>
                <p className="font-[Archivo] text-sm text-[#19191F] dark:text-[#d1d5db] mt-1">After this update</p>
              </div>
              <p className={`font-[Archivo] font-black text-2xl whitespace-nowrap shrink-0 ${
                exceedsStock ? 'text-red-500 dark:text-red-400' : 'text-[#636AE8]'
              }`}>
                {Math.max(projected, 0)} <span className="text-sm font-medium">{item.measurementUnit}</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[#dee1e6] dark:border-white/10 flex justify-end gap-3 bg-[#f3f4f6]/10 dark:bg-white/5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 border border-[#dee1e6] dark:border-white/10 rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb] bg-white dark:bg-[#1f2128] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInvalid}
              className="h-10 px-5 bg-[#636AE8] rounded-md font-[Archivo] text-sm font-medium text-white shadow-sm hover:bg-[#4f56d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#636AE8]"
            >
              Save
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default StockUpdateModal
