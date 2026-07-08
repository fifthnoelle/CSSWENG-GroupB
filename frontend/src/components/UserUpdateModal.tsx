import { useState, FormEvent } from 'react'
import type { User } from '../types'

// Small reusable eye / eye-off toggle button, positioned inside a password
// field — same component used in CreateAccountModal.tsx.
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

interface Props {
    user: User
    /** True when `user` is currently the only Admin account — the Staff
     *  option is disabled outright rather than letting the person pick it
     *  and only finding out it's rejected after clicking Save. */
    isLastAdmin: boolean
    onClose: () => void
    // Bug fix (#3): password is a new, OPTIONAL fifth argument. The backend
    // already supported an admin resetting a user's password on this same
    // endpoint — this modal just never had a field to send one. Leave it
    // blank to keep the user's current password unchanged.
    onSave: (email: string, firstName: string, lastName: string, role: 'admin' | 'staff', password?: string) => Promise<void>
}

function UserUpdateModal({ user, isLastAdmin, onClose, onSave }: Props) {
    const [email, setEmail] = useState(user.email)
    const [firstName, setFirstName] = useState(user.firstName)
    const [lastName, setLastName] = useState(user.lastName)
    const [role, setRole] = useState<'admin' | 'staff'>(user.role)
    const [error, setError] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Bug fix (#3): optional password reset. Blank = "don't change it".
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [passwordTouched, setPasswordTouched] = useState(false)
    const [confirmTouched, setConfirmTouched] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const isChangingPassword = newPassword.length > 0
    // Mirrors the backend policy in utils/auth.js, same as CreateAccountModal.
    const passwordRules = [
        { label: 'At least 12 characters', met: newPassword.length >= 12 },
        { label: 'A lowercase letter',      met: /[a-z]/.test(newPassword) },
        { label: 'An uppercase letter',     met: /[A-Z]/.test(newPassword) },
        { label: 'A number',                met: /[0-9]/.test(newPassword) },
        { label: 'A special character',     met: /[^A-Za-z0-9]/.test(newPassword) },
    ]
    const passwordValid = !isChangingPassword || passwordRules.every(r => r.met)
    const passwordsMatch = !isChangingPassword || (confirmNewPassword.length > 0 && newPassword === confirmNewPassword)

    async function handleSave(event?: FormEvent) {
        event?.preventDefault()
        if (!user) return

        setPasswordTouched(true)
        setConfirmTouched(true)
        if (!passwordValid || !passwordsMatch) return

        setError('')
        setIsSaving(true)
        try {
            await onSave(
                email.trim(),
                firstName.trim(),
                lastName.trim(),
                role,
                isChangingPassword ? newPassword : undefined
            )
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const inputClass = "mt-2 w-full rounded-md border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
    const labelClass = "font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-[480px] md:max-w-[560px] sm:mx-6 max-h-[92vh] bg-white dark:bg-[#1f2128] sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden flex flex-col">

        <div className="bg-[#f3f4f6]/20 dark:bg-white/5 px-5 py-4 border-b border-[#dee1e6] dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#636AE8]/10 rounded-full flex items-center justify-center shrink-0">
              <img className="w-6 h-6 dark:invert" src="/assets/icon-add-circle.svg" alt="edit user" />
            </div>
            <div>
              <p className="font-[Archivo] text-lg font-semibold text-[#171a1f] dark:text-[#f3f4f6] tracking-tight">Edit User</p>
              <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0]">
                Update details for <span className="font-semibold text-[#171a1f] dark:text-[#e5e7eb]">{user.firstName} {user.lastName}</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
        <div className="overflow-y-auto flex-1 min-h-0">
        <div className="p-5 flex flex-col gap-4">

          {error && (
            <div className="bg-[#FFE4E6] dark:bg-[#7f1d1d] border border-[#FECDD3] dark:border-[#991b1b] text-[#BE123C] dark:text-[#fca5a5] text-sm font-[Archivo] rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="firstName" className={labelClass}>First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="lastName" className={labelClass}>Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="role" className={labelClass}>Role</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'staff')}
              className={`${inputClass} dark:bg-[#1f2128]`}
            >
              <option value="admin">Admin</option>
              <option value="staff" disabled={isLastAdmin}>Staff</option>
            </select>
            {isLastAdmin && (
              <p className="mt-1.5 text-xs font-[Archivo] text-[#9095a0] dark:text-[#6b7280]">
                This is the only Admin account, so it can't be demoted to Staff. Promote another account to Admin first.
              </p>
            )}
          </div>

          {/* Bug fix (#3): optional password reset. There was previously no
              way at all for an admin to get a user back into their account
              if that user forgot both their password and their security
              answer — the backend already supported this, it just had no
              field here to send it from. */}
          <div className="border-t border-[#dee1e6] dark:border-white/10 pt-4">
            <p className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">Reset Password</p>
            <p className="mt-0.5 text-xs font-[Archivo] text-[#9095a0] dark:text-[#6b7280]">
              Optional — leave both fields blank to keep the current password. Setting a new one also clears any active lockout on this account.
            </p>

            <div className="mt-3">
              <label htmlFor="newPassword" className={labelClass}>New Password</label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="Leave blank to keep current password"
                  className={`${inputClass} pr-10 ${passwordTouched && !passwordValid ? 'border-[#FECDD3]' : ''}`}
                />
                <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
              {(passwordTouched || isChangingPassword) && isChangingPassword && (
                <ul className="mt-2 flex flex-col gap-0.5">
                  {passwordRules.map(rule => (
                    <li
                      key={rule.label}
                      className={`text-xs font-[Archivo] flex items-center gap-1.5 ${
                        rule.met ? 'text-[#047857] dark:text-[#34d399]' : 'text-[#9095a0] dark:text-[#6b7280]'
                      }`}
                    >
                      <span>{rule.met ? '✓' : '○'}</span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isChangingPassword && (
              <div className="mt-3">
                <label htmlFor="confirmNewPassword" className={labelClass}>Confirm New Password</label>
                <div className="relative">
                  <input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    onBlur={() => setConfirmTouched(true)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-10 ${confirmTouched && !passwordsMatch ? 'border-[#FECDD3]' : ''}`}
                  />
                  <PasswordVisibilityToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                </div>
                {confirmTouched && !passwordsMatch && (
                  <p className="mt-1 text-xs font-[Archivo] text-[#BE123C] dark:text-[#fca5a5]">
                    Passwords do not match.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        <div className="px-5 py-4 border-t border-[#dee1e6] dark:border-white/10 flex justify-end gap-3 bg-[#f3f4f6]/10 dark:bg-white/5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-10 px-5 border border-[#dee1e6] dark:border-white/10 rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] dark:text-[#e5e7eb] bg-white dark:bg-[#1f2128] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !passwordValid || !passwordsMatch}
            className="h-10 px-5 bg-[#636AE8] rounded-md font-[Archivo] text-sm font-medium text-white shadow-sm hover:bg-[#4f56d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        </form>

      </div>
    </div>
  )
}

export default UserUpdateModal
