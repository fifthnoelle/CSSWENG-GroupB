import { useState } from 'react'
import type { User } from '../types'

interface Props {
  user: User
  /** True when `user` is currently the only Admin account — deletion is
   *  blocked outright rather than letting the person confirm and only
   *  finding out it's rejected after clicking Remove. */
  isLastAdmin: boolean
  /** True when `user` is the currently logged-in account — you can't
   *  delete your own active session account. */
  isSelf: boolean
  onClose: () => void
  onConfirm: (userId: string) => Promise<void>
}


function RemoveAccountModal({ user, isLastAdmin, isSelf, onClose, onConfirm }: Props) {
  const [confirmed, setConfirmed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleRemoveClick = async () => {
    setError('')
    setIsDeleting(true)
    try {
      await onConfirm(user._id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dee1e6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FFE4E6] rounded-lg flex items-center justify-center shrink-0">
              <img className="w-5 h-5" src="/assets/icon-trash.svg" alt="remove" />
            </div>
            <p className="font-[Archivo] text-lg font-semibold text-[#171a1f]">Remove Account</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <img className="w-4 h-4" src="/assets/icon-close.svg" alt="close" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">

          {error && (
            <div className="bg-[#FFE4E6] border border-[#FECDD3] text-[#BE123C] text-sm font-[Archivo] rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {isSelf ? (
            /* Blocked outright — you can't remove your own active session account */
            <div className="flex items-start gap-3 p-4 bg-[#FFE4E6] rounded-lg border border-[#FECDD3]">
              <img className="w-5 h-5 shrink-0 mt-0.5" src="/assets/icon-warning-triangle.svg" alt="warning" />
              <div>
                <p className="font-[Archivo] text-sm font-bold text-[#93191d] uppercase tracking-wide">Can't remove this account</p>
                <p className="font-[Archivo] text-sm text-[#171a1f] mt-1">
                  You can't remove your own account while logged in. Ask another Admin to do this instead.
                </p>
              </div>
            </div>
          ) : isLastAdmin ? (
            /* Blocked outright — this is the system's only Admin account */
            <div className="flex items-start gap-3 p-4 bg-[#FFE4E6] rounded-lg border border-[#FECDD3]">
              <img className="w-5 h-5 shrink-0 mt-0.5" src="/assets/icon-warning-triangle.svg" alt="warning" />
              <div>
                <p className="font-[Archivo] text-sm font-bold text-[#93191d] uppercase tracking-wide">Can't remove this account</p>
                <p className="font-[Archivo] text-sm text-[#171a1f] mt-1">
                  <span className="font-semibold">{user.firstName} {user.lastName}</span> is the only Admin account.
                  Promote another account to Admin before removing this one.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Warning box */}
              <div className="flex items-start gap-3 p-4 bg-[#FFE4E6] rounded-lg border border-[#FECDD3]">
                <img className="w-5 h-5 shrink-0 mt-0.5" src="/assets/icon-warning-triangle.svg" alt="warning" />
                <div>
                  <p className="font-[Archivo] text-sm font-bold text-[#93191d] uppercase tracking-wide">Warning</p>
                  <p className="font-[Archivo] text-sm text-[#171a1f] mt-1">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold">{user.firstName} {user.lastName}</span>?
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-3 p-4 border border-[#dee1e6] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#93191d] shrink-0"
                />
                <div>
                  <p className="font-[Archivo] text-sm font-medium text-[#171a1f]">
                    I understand this action will remove this account
                  </p>
                  <p className="font-[Archivo] text-xs text-[#9095a0] mt-0.5">
                    The user will lose access to the system immediately.
                  </p>
                </div>
              </label>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#dee1e6] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="h-10 px-5 border border-[#dee1e6] rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] bg-white hover:bg-gray-50 transition-colors"
          >
            {isLastAdmin || isSelf ? 'Close' : 'Cancel'}
          </button>
          {!isLastAdmin && !isSelf && (
            <button
              id={`btn-remove-user-${user._id}`}
              onClick={handleRemoveClick}
              disabled={!confirmed || isDeleting}
              className="h-10 px-5 bg-[#93191d] rounded-md font-[Archivo] text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[#7a1518]"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default RemoveAccountModal
