import { useState } from 'react'
import type { InventoryItem } from '../types'

interface Props {
  item?: InventoryItem | null
  onClose: () => void
  onSave: (data: {
    itemName: string
    itemType: string
    measurementUnit: string
    startingStock: number
    lowStockThreshold: number
  }) => void
}

// Predefined option sets, drawn from the item types/units already seen in
// inventory data. Selection is strictly limited to these — no manual typing.
const ITEM_TYPE_OPTIONS = ['Packaging', 'Condiment', 'Ingredient', 'Utensil']
const MEASUREMENT_UNIT_OPTIONS = ['PCS', 'PACKS', 'BOTTLES', 'GALLONS', 'KGS', 'BOXES']

function ItemFormModal({ item, onClose, onSave }: Props) {
  const isEdit = !!item

  const [itemName, setItemName] = useState(item?.itemName ?? '')
  const [itemType, setItemType] = useState(item?.itemType ?? '')
  const [measurementUnit, setMeasurementUnit] = useState(item?.measurementUnit ?? '')
  const [startingStock, setStartingStock] = useState(String(item?.startingStock ?? ''))
  const [lowStockThreshold, setLowStockThreshold] = useState(String(item?.lowStockThreshold ?? ''))
  const [error, setError] = useState('')

  function handleSave() {
    const resolvedItemType = itemType.trim()
    const resolvedMeasurementUnit = measurementUnit.trim()

    if (!itemName.trim() || !resolvedItemType || !resolvedMeasurementUnit) {
      setError('All fields are required')
      return
    }
    const startingNum = Number(startingStock)
    const thresholdNum = Number(lowStockThreshold)
    if (isNaN(startingNum) || startingNum < 0) {
      setError('Starting stock must be a valid number')
      return
    }
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      setError('Low stock threshold must be a valid number')
      return
    }

    onSave({
      itemName: itemName.trim(),
      itemType: resolvedItemType,
      measurementUnit: resolvedMeasurementUnit.toUpperCase(),
      startingStock: startingNum,
      lowStockThreshold: thresholdNum,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-[480px] md:max-w-[560px] sm:mx-6 bg-white sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden">

        {/* Header */}
        <div className="bg-[#f3f4f6]/20 px-5 py-4 border-b border-[#dee1e6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#636AE8]/10 rounded-full flex items-center justify-center shrink-0">
              <img className="w-6 h-6" src={isEdit ? '/assets/icon-pen.svg' : '/assets/icon-plus.svg'} alt="item" />
            </div>
            <div>
              <p className="font-[Archivo] text-lg font-semibold text-[#171a1f] tracking-tight">
                {isEdit ? 'Edit Ingredient' : 'Add Ingredient'}
              </p>
              <p className="font-[Archivo] text-sm text-[#565e6c]">
                {isEdit ? 'Update the details for this item' : 'Add a new item to your inventory'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">

          {error && (
            <div className="bg-[#FFE4E6] border border-[#FECDD3] text-[#BE123C] text-sm font-[Archivo] rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block font-[Archivo] text-sm font-semibold text-[#171a1f] mb-2">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              className="w-full h-11 px-3 border border-[#dee1e6] rounded-md text-sm font-[Archivo] text-[#171a1f] outline-none focus:border-[#636AE8]"
              placeholder="e.g. Wooden Toothpicks"
            />
          </div>

          <div>
            <label className="block font-[Archivo] text-sm font-semibold text-[#171a1f] mb-2">Item Type</label>
            <select
              value={itemType}
              onChange={e => setItemType(e.target.value)}
              className="w-full h-11 px-3 border border-[#dee1e6] rounded-md text-sm font-[Archivo] text-[#171a1f] outline-none focus:border-[#636AE8] bg-white"
            >
              <option value="" disabled>Select a type...</option>
              {ITEM_TYPE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-[Archivo] text-sm font-semibold text-[#171a1f] mb-2">Measurement Unit</label>
            <select
              value={measurementUnit}
              onChange={e => setMeasurementUnit(e.target.value)}
              className="w-full h-11 px-3 border border-[#dee1e6] rounded-md text-sm font-[Archivo] text-[#171a1f] outline-none focus:border-[#636AE8] bg-white"
            >
              <option value="" disabled>Select a unit...</option>
              {MEASUREMENT_UNIT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-[Archivo] text-sm font-semibold text-[#171a1f] mb-2">Starting Stock</label>
              <input
                type="number"
                value={startingStock}
                onChange={e => setStartingStock(e.target.value)}
                className="w-full h-11 px-3 border border-[#dee1e6] rounded-md text-sm font-[Archivo] text-[#171a1f] outline-none focus:border-[#636AE8]"
                min={0}
              />
            </div>
            <div>
              <label className="block font-[Archivo] text-sm font-semibold text-[#171a1f] mb-2">Low Stock Threshold</label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(e.target.value)}
                className="w-full h-11 px-3 border border-[#dee1e6] rounded-md text-sm font-[Archivo] text-[#171a1f] outline-none focus:border-[#636AE8]"
                min={0}
              />
            </div>
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
            {isEdit ? 'Save Changes' : 'Add Ingredient'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ItemFormModal
