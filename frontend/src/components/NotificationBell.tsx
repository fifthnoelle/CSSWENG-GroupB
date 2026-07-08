import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import { useUser } from '../context/UserContext'
import type { StockStatus } from '../types'

const statusBadge: Record<StockStatus, { bg: string; text: string; label: string }> = {
  'low-stock':    { bg: 'bg-[#FEF3C7] dark:bg-[#78350f]', text: 'text-[#B45309] dark:text-[#fbbf24]', label: 'LOW STOCK' },
  'out-of-stock': { bg: 'bg-[#FFE4E6] dark:bg-[#7f1d1d]', text: 'text-[#BE123C] dark:text-[#fca5a5]', label: 'OUT OF STOCK' },
  'in-stock':     { bg: 'bg-[#D1FAE5] dark:bg-[#064e3b]', text: 'text-[#047857] dark:text-[#6ee7b7]', label: 'IN STOCK' },
}

function NotificationBell() {
  // Bug fix (#7): `reload` was already returned by the hook but never
  // called anywhere — the bell only ever refreshed on mount/role-change,
  // so it could show stale data (e.g. an item restocked from "low stock"
  // would still show up here until a full page reload). Combined with the
  // polling interval added in useNotifications.ts, opening the bell now
  // also forces an immediate refresh.
  const { notifications, reload } = useNotifications()
  const { user } = useUser()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const count = notifications.length

  function toggleOpen() {
    setOpen(o => {
      const next = !o
      if (next) reload()
      return next
    })
  }

  function goTo(item: typeof notifications[number]) {
    setOpen(false)
    if (item.kind === 'locked-account') {
      navigate('/accounts')
    } else {
      navigate(user?.role === 'admin' ? '/admin/inventory' : '/inventory')
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={toggleOpen}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <img className="w-5 h-5 dark:invert" src="/assets/icon-bell.svg" alt="notifications" />
      </button>
      {count > 0 && (
        <div className="absolute top-0 right-0 w-4 h-4 bg-[#de3b40] rounded-full flex items-center justify-center pointer-events-none">
          <span className="font-[Archivo] text-white text-[10px]">{count}</span>
        </div>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#dee1e6] dark:border-white/10">
              <p className="font-[Archivo] text-sm font-bold text-[#171a1f] dark:text-[#f3f4f6]">Notifications</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {count === 0 && (
                <p className="px-4 py-6 text-center font-[Archivo] text-sm text-[#9095a0] dark:text-[#6b7280]">
                  You're all caught up.
                </p>
              )}
              {notifications.map(item => (
                <button
                  key={`${item.kind}-${item.id}`}
                  onClick={() => goTo(item)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b border-[#dee1e6] dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb] truncate">{item.title}</p>
                    <p className="font-[Archivo] text-xs text-[#565e6c] dark:text-[#9095a0] mt-0.5">{item.subtitle}</p>
                  </div>
                  {item.kind === 'stock' ? (
                    <span className={`shrink-0 text-[10px] font-semibold font-[Archivo] px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadge[item.status].bg} ${statusBadge[item.status].text}`}>
                      {statusBadge[item.status].label}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-semibold font-[Archivo] px-2.5 py-1 rounded-full bg-[#FFE4E6] dark:bg-[#7f1d1d] text-[#BE123C] dark:text-[#fca5a5] whitespace-nowrap">
                      Locked
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
