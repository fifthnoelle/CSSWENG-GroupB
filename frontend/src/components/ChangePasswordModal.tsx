import { useState, FormEvent } from 'react'
import { changePassword } from '../services/auth.service'

interface Props {
  onClose: () => void
}

// Small reusable eye / eye-off toggle button, positioned inside a password
// field. Inline SVG (not an <img src="/assets/...">) so it can never break
// on a missing asset file — see the same fix on the Login page.
function PasswordVisibilityToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9095a0] hover:text-[#171a1f] dark:hover:text-[#e5e7eb] transition-colors"
    >
      {visible ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-3.22 4.34M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      )}
    </button>
  )
}

function ChangePasswordModal({ onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSave(event?: FormEvent) {
    event?.preventDefault()
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
      <div className="w-full sm:max-w-[480px] md:max-w-[560px] sm:mx-6 bg-white dark:bg-[#1f2128] sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden">

        {/* Header */}
        <div className="bg-[#f3f4f6]/20 dark:bg-white/5 px-5 py-4 border-b border-[#dee1e6] dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#636AE8]/10 rounded-full flex items-center justify-center shrink-0">
              <img className="w-6 h-6 dark:invert" src="/assets/icon-lock.svg" alt="change password" />
            </div>
            <div>
              <p className="font-[Archivo] text-lg font-semibold text-[#171a1f] dark:text-[#f3f4f6] tracking-tight">Change Password</p>
              <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">
                You'll need to confirm your current password
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Body */}
          <div className="p-5 flex flex-col gap-4">
            {success ? (
              <div className="bg-[#d3f9e0] dark:bg-[#064e3b] border border-[#9ae6b4] dark:border-[#065f46] text-[#073517] dark:text-[#6ee7b7] text-sm font-[Archivo] rounded-md px-3 py-2">
                Password changed successfully.
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-[#FFE4E6] dark:bg-[#7f1d1d] border border-[#FECDD3] dark:border-[#991b1b] text-[#BE123C] dark:text-[#fca5a5] text-sm font-[Archivo] rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="currentPassword" className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">
                    Current Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full rounded-md border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-white/5 pl-3 pr-10 py-2 text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
                    />
                    <PasswordVisibilityToggle visible={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">
                    New Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full rounded-md border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-white/5 pl-3 pr-10 py-2 text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
                    />
                    <PasswordVisibilityToggle visible={showNew} onToggle={() => setShowNew(!showNew)} />
                  </div>
                  <p className="mt-1 text-xs font-[Archivo] text-[#9095a0] dark:text-[#6b7280]">
                    At least 12 characters, with uppercase, lowercase, a number, and a special character.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">
                    Confirm New Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full rounded-md border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-white/5 pl-3 pr-10 py-2 text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
                    />
                    <PasswordVisibilityToggle visible={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[#dee1e6] dark:border-white/10 flex justify-end gap-3 bg-[#f3f4f6]/10 dark:bg-white/5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 border border-[#dee1e6] dark:border-white/10 rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb] bg-white dark:bg-[#1f2128] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              {success ? 'Close' : 'Cancel'}
            </button>
            {!success && (
              <button
                type="submit"
                disabled={loading}
                className="h-10 px-5 bg-[#636AE8] rounded-md font-[Archivo] text-sm font-medium text-white shadow-sm hover:bg-[#4f56d4] transition-colors disabled:opacity-70"
              >
                {loading ? 'Saving…' : 'Change Password'}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  )
}

export default ChangePasswordModal
