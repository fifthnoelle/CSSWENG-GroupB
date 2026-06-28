import { useState } from 'react'
import { changePassword } from '../services/auth.service'

interface Props {
  onClose: () => void
}

function ChangePasswordModal({ onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password')
      return
    }

    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-[480px] md:max-w-[560px] sm:mx-6 bg-white sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden">

        {/* Header */}
        <div className="bg-[#f3f4f6]/20 px-5 py-4 border-b border-[#dee1e6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#636AE8]/10 rounded-full flex items-center justify-center shrink-0">
              <img className="w-6 h-6" src="/assets/icon-lock.svg" alt="change password" />
            </div>
            <div>
              <p className="font-[Archivo] text-lg font-semibold text-[#171a1f] tracking-tight">Change Password</p>
              <p className="font-[Archivo] text-sm text-[#565e6c]">
                You'll need to confirm your current password
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {success ? (
            <div className="bg-[#d3f9e0] border border-[#9ae6b4] text-[#073517] text-sm font-[Archivo] rounded-md px-3 py-2">
              Password changed successfully.
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-[#FFE4E6] border border-[#FECDD3] text-[#BE123C] text-sm font-[Archivo] rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="font-[Archivo] text-sm font-semibold text-[#171a1f]">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="mt-2 w-full rounded-md border border-[#dee1e6] px-3 py-2 text-sm text-[#171a1f] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="font-[Archivo] text-sm font-semibold text-[#171a1f]">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="mt-2 w-full rounded-md border border-[#dee1e6] px-3 py-2 text-sm text-[#171a1f] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
                />
                <p className="mt-1 text-xs font-[Archivo] text-[#9095a0]">
                  At least 12 characters, with uppercase, lowercase, a number, and a special character.
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="font-[Archivo] text-sm font-semibold text-[#171a1f]">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-md border border-[#dee1e6] px-3 py-2 text-sm text-[#171a1f] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#dee1e6] flex justify-end gap-3 bg-[#f3f4f6]/10">
          <button
            onClick={onClose}
            className="h-10 px-5 border border-[#dee1e6] rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] bg-white hover:bg-gray-50 transition-colors"
          >
            {success ? 'Close' : 'Cancel'}
          </button>
          {!success && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="h-10 px-5 bg-[#636AE8] rounded-md font-[Archivo] text-sm font-medium text-white shadow-sm hover:bg-[#4f56d4] transition-colors disabled:opacity-70"
            >
              {loading ? 'Saving…' : 'Change Password'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default ChangePasswordModal
