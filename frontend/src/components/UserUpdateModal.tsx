import { useState, FormEvent } from 'react'
import type { User, Log } from '../types'

interface Props {
    user: User
    userId: string
    /** True when `user` is currently the only Admin account — the Staff
     *  option is disabled outright rather than letting the person pick it
     *  and only finding out it's rejected after clicking Save. */
    isLastAdmin: boolean
    onClose: () => void
    onSave: (email: string, firstName: string, lastName: string, role: 'admin' | 'staff') => Promise<void>
}

function UserUpdateModal({ user, userId, isLastAdmin, onClose, onSave }: Props) {
    const [email, setEmail] = useState(user.email)
    const [firstName, setFirstName] = useState(user.firstName)
    const [lastName, setLastName] = useState(user.lastName)
    const [role, setRole] = useState<'admin' | 'staff'>(user.role)
    const [error, setError] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    function createAuditLog(): Log {
        //Detect changes for audit log
        const hasEmailChange = email !== user.email
        const hasFirstNameChange = firstName !== user.firstName
        const hasLastNameChange = lastName !== user.lastName
        const hasRoleChange = role !== user.role

        const changes: string[] = []
        if (hasEmailChange) changes.push(`email: ${user.email} → ${email}`)
        if (hasFirstNameChange) changes.push(`firstName: ${user.firstName} → ${firstName}`)
        if (hasLastNameChange) changes.push(`lastName: ${user.lastName} → ${lastName}`)
        if (hasRoleChange) changes.push(`role: ${user.role} → ${role}`)

        return {
            _id: '', 
            userId,
            logType: 'accounts',
            userName: `${user.firstName} ${user.lastName}`,
            userTarget: user._id,
            userTargetName: `${firstName} ${lastName}`,
            itemId: '',
            actionType: hasRoleChange ? 'edit-role' : 'edit-user',
            quantityChanged: 0,
            previousStock: 0,
            newStock: 0,
            measurementUnit: '',
            notes: changes.join('; '),
            actionTime: new Date().toISOString()
        }
    }
    /*export interface Log {
      _id: string
      userId: string
      logType: LogType
      userName: string
      userTarget: string
      userTargetName: string  //only when userTarget is a user, otherwise empty string
      itemId: string
      actionType: ActionType
      quantityChanged: number
      previousStock: number
      newStock: number
      notes: string
      actionTime: string
    }
}*/

    async function handleSave(event?: FormEvent) {
        event?.preventDefault()
        if (!user) return

        const auditLog = createAuditLog()
        console.log('Audit Log:', auditLog)
        //TODO: Send audit log to backend

        setError('')
        setIsSaving(true)
        try {
            await onSave(email.trim(), firstName.trim(), lastName.trim(), role)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

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
            <label htmlFor="email" className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
            />
          </div>

          <div>
            <label htmlFor="firstName" className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="mt-2 w-full rounded-md border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="mt-2 w-full rounded-md border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
            />
          </div>

          <div>
            <label htmlFor="role" className="font-[Archivo] text-sm font-semibold text-[#171a1f] dark:text-[#e5e7eb]">Role</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'staff')}
              className="mt-2 w-full rounded-md border border-[#dee1e6] dark:border-white/10 bg-white dark:bg-[#1f2128] px-3 py-2 text-sm text-[#171a1f] dark:text-[#e5e7eb] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
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
            disabled={isSaving}
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
