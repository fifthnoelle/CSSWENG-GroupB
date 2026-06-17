import {useState} from 'react'
import type {User, Log} from '../types'
import { updateUser } from '../services/user.service'//NEW
interface Props {
    user: User
    userId: string
    onClose: () => void
    onSave: (email: string, firstName: string, lastName: string, role: 'admin' | 'staff') => void
}

function UserUpdateModal({ user, userId, onClose, onSave }: Props) {
    const [email, setEmail] = useState(user.email)
    const [firstName, setFirstName] = useState(user.firstName)
    const [lastName, setLastName] = useState(user.lastName)
    const [role, setRole] = useState<'admin' | 'staff'>(user.role)

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

    function handleSave() {
        if (!user) return
        
        const auditLog = createAuditLog()
        console.log('Audit Log:', auditLog)
        //updateUser(user._id, { email, firstName, lastName, role })
        await updateUser(user._id, { email, firstName, lastName, role }) //NEW
        //TODO: Send audit log to backend
        
        onSave(email.trim(), firstName.trim(), lastName.trim(), role)
        onClose()
    }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-[480px] md:max-w-[560px] sm:mx-6 bg-white sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden">

        <div className="bg-[#f3f4f6]/20 px-5 py-4 border-b border-[#dee1e6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#636AE8]/10 rounded-full flex items-center justify-center shrink-0">
              <img className="w-6 h-6" src="/assets/icon-add-circle.svg" alt="edit user" />
            </div>
            <div>
              <p className="font-[Archivo] text-lg font-semibold text-[#171a1f] tracking-tight">Edit User</p>
              <p className="font-[Archivo] text-sm text-[#565e6c]">
                Update details for <span className="font-semibold text-[#171a1f]">{user.firstName} {user.lastName}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="font-[Archivo] text-sm font-semibold text-[#171a1f]">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-[#dee1e6] px-3 py-2 text-sm text-[#171a1f] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
            />
          </div>

          <div>
            <label htmlFor="firstName" className="font-[Archivo] text-sm font-semibold text-[#171a1f]">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="mt-2 w-full rounded-md border border-[#dee1e6] px-3 py-2 text-sm text-[#171a1f] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="font-[Archivo] text-sm font-semibold text-[#171a1f]">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="mt-2 w-full rounded-md border border-[#dee1e6] px-3 py-2 text-sm text-[#171a1f] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
            />
          </div>

          <div>
            <label htmlFor="role" className="font-[Archivo] text-sm font-semibold text-[#171a1f]">Role</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'staff')}
              className="mt-2 w-full rounded-md border border-[#dee1e6] bg-white px-3 py-2 text-sm text-[#171a1f] outline-none transition focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

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

export default UserUpdateModal
