import { useState } from 'react'

interface Props {
  onClose: () => void
  onSave: (data: {
    firstName: string
    middleName: string
    lastName: string
    email: string
    userId: string
    password: string
    role: 'admin' | 'staff'
  }) => void
}

function CreateAccountModal({ onClose, onSave }: Props) {
  const [firstName, setFirstName]   = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName]     = useState('')
  const [email, setEmail]           = useState('')
  const [userId, setUserId]         = useState('')
  const [password, setPassword]     = useState('')
  const [role, setRole]             = useState<'admin' | 'staff'>('staff')

  function handleCreate() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !userId.trim() || !password.trim()) return
    onSave({
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      userId: userId.trim(),
      password: password.trim(),
      role,
    })
    onClose()
  }

  const inputClass = "w-full h-10 px-3 border border-[#dee1e6] rounded-md text-sm font-[Archivo] text-[#171a1f] placeholder:text-[#565e6c] outline-none bg-[#f3f4f6]/10 focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20 transition"
  const labelClass = "block font-[Inter] text-sm font-semibold text-[#171a1f] mb-2"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-[480px] md:max-w-[560px] sm:mx-6 bg-white sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dee1e6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#636AE8]/10 rounded-md flex items-center justify-center shrink-0">
              <img className="w-6 h-6" src="/assets/icon-add-square.svg" alt="create account" />
            </div>
            <p className="font-[Archivo] text-lg font-bold text-[#171a1f] tracking-tight">Create Account</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 cursor-pointer">
            <img className="w-4 h-4" src="/assets/icon-close.svg" alt="close" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">

          {/* First Name */}
          <div>
            <label className={labelClass}>First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Janine"
              className={inputClass}
            />
          </div>

          {/* Middle Name + Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Middle Name</label>
              <input
                id="middleName"
                name="middleName"
                type="text"
                value={middleName}
                onChange={e => setMiddleName(e.target.value)}
                placeholder="Lim"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Uy"
                className={inputClass}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="janine.uy@gmail.com"
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {/* User ID + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>User ID</label>
              <input
                id="userId"
                name="userId"
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="USR-0008"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={e => setRole(e.target.value as 'admin' | 'staff')}
                  className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <img
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  src="/assets/icon-arrow-down.svg"
                  alt="chevron"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#dee1e6] flex justify-end gap-3 bg-[#f3f4f6]/10">
          <button
            onClick={onClose}
            className="h-10 px-5 border border-[#dee1e6] rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !userId.trim() || !password.trim()}
            className="h-10 px-6 bg-[#636AE8] rounded-md font-[Archivo] text-sm font-semibold text-white shadow-sm hover:bg-[#4f56d4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Create
          </button>
        </div>

      </div>
    </div>
  )
}

export default CreateAccountModal
