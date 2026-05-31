import { useState } from 'react'
import type { InventoryItem, ActionType } from '../types'

interface Props {
  item: InventoryItem
  onClose: () => void
  onSave: (actionType: ActionType, quantityChanged: number) => void
}

function StockUpdateModal({ item, onClose, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<ActionType>('used-today')
  const [quantity, setQuantity] = useState('0')

  const isDeduct = activeTab === 'used-today'
  const projected = isDeduct
    ? item.currentStock - Number(quantity || 0)
    : item.currentStock + Number(quantity || 0)

  function handleSave() {
    const qty = Number(quantity)
    if (!qty || qty <= 0) return
    onSave(activeTab, qty)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-[480px] md:max-w-[560px] sm:mx-6 bg-white sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden">

        {/* Header */}
        <div className="bg-[#f3f4f6]/20 px-5 py-4 border-b border-[#dee1e6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#636AE8]/10 rounded-full flex items-center justify-center shrink-0">
              <img className="w-6 h-6" src="/assets/icon-add-circle.svg" alt="stock" />
            </div>
            <div>
              <p className="font-[Archivo] text-lg font-semibold text-[#171a1f] tracking-tight">Stock Update</p>
              <p className="font-[Archivo] text-sm text-[#565e6c]">
                Update levels for <span className="font-semibold text-[#171a1f]">{item.itemName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-5">

          {/* Tab toggle */}
          <div className="flex bg-[#f3f4f6] rounded-md p-1 gap-1">
            <button
              onClick={() => setActiveTab('used-today')}
              className={`flex-1 flex items-center justify-center gap-2 h-8 rounded text-sm font-bold font-[Inter] transition-colors ${
                activeTab === 'used-today' ? 'bg-white text-[#323842] shadow-sm' : 'text-[#9095a0]'
              }`}
            >
              <img className="w-4 h-4" src="/assets/icon-minus-circle.svg" alt="minus" />
              Used Today
            </button>
            <button
              onClick={() => setActiveTab('restock')}
              className={`flex-1 flex items-center justify-center gap-2 h-8 rounded text-sm font-bold font-[Inter] transition-colors ${
                activeTab === 'restock' ? 'bg-white text-[#323842] shadow-sm' : 'text-[#9095a0]'
              }`}
            >
              <img className="w-4 h-4" src="/assets/icon-add-circle.svg" alt="plus" />
              Restock
            </button>
          </div>

          {/* Quantity input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="quantity" className="font-[Archivo] text-sm font-semibold text-[#171a1f]">
                {isDeduct ? 'Quantity to Deduct' : 'Quantity to Add'}
              </label>
              <span className="text-xs text-[#565e6c] bg-[#f3f4f6] rounded-full px-3 py-0.5">
                Current: {item.currentStock} {item.measurementUnit}
              </span>
            </div>
            <div className="flex items-center border border-[#dee1e6] rounded-md overflow-hidden h-11">
              <input
                id="quantity"
                name="quantityChanged"
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="flex-1 px-3 h-full text-sm font-[Archivo] text-[#171a1f] outline-none bg-white"
                min={0}
              />
              <div className="h-full flex items-center px-3 border-l border-[#dee1e6] text-sm text-[#565e6c] font-[Archivo] bg-white shrink-0">
                {item.measurementUnit}
              </div>
            </div>
          </div>

          {/* Projected stock */}
          <div className="bg-[#f2f2fd] border border-[#636AE8]/10 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-[Archivo] text-xs font-bold text-[#636AE8] uppercase tracking-wide">
                Projected Stock Level
              </p>
              <p className="font-[Archivo] text-sm text-[#19191F] mt-1">After this update</p>
            </div>
            <p className="font-[Archivo] font-black text-2xl text-[#636AE8] whitespace-nowrap shrink-0">
              {projected} <span className="text-sm font-medium">{item.measurementUnit}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#dee1e6] flex justify-end gap-3 bg-[#f3f4f6]/10">
          <button
            onClick={onClose}
            className="h-10 px-5 border border-[#dee1e6] rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-10 px-5 bg-[#636AE8] rounded-md font-[Archivo] text-sm font-medium text-white shadow-sm hover:bg-[#4f56d4] transition-colors"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  )
}

export default StockUpdateModal
