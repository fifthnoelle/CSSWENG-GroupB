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
    securityQuestion: string
    securityAnswer: string
  }) => void
}

function CreateAccountModal({ onClose, onSave }: Props) {
  const [firstName, setFirstName]   = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName]     = useState('')
  const [email, setEmail]           = useState('')
  const [userId, setUserId]         = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole]             = useState<'admin' | 'staff'>('staff')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer]     = useState('')
  const [passwordTouched, setPasswordTouched]   = useState(false)
  const [confirmTouched, setConfirmTouched]     = useState(false)
  const [answerTouched, setAnswerTouched]       = useState(false)

  // Mirrors the backend policy in utils/auth.js — checked live so the user
  // never has to round-trip to the server to find out a rule was unmet.
  const passwordRules = [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'A lowercase letter',      met: /[a-z]/.test(password) },
    { label: 'An uppercase letter',     met: /[A-Z]/.test(password) },
    { label: 'A number',                met: /[0-9]/.test(password) },
    { label: 'A special character',     met: /[^A-Za-z0-9]/.test(password) },
  ]
  const passwordValid = passwordRules.every(r => r.met)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const answerValid = securityAnswer.trim().length >= 4

  function handleCreate() {
    setPasswordTouched(true)
    setConfirmTouched(true)
    setAnswerTouched(true)
    if (
      !firstName.trim() || !lastName.trim() || !email.trim() || !userId.trim() ||
      !passwordValid || !passwordsMatch || !securityQuestion.trim() || !answerValid
    ) return
    onSave({
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      userId: userId.trim(),
      password: password.trim(),
      role,
      securityQuestion: securityQuestion.trim(),
      securityAnswer: securityAnswer.trim(),
    })
    onClose()
  }

  const inputClass = "w-full h-10 px-3 border border-[#dee1e6] rounded-md text-sm font-[Archivo] text-[#171a1f] placeholder:text-[#565e6c] outline-none bg-[#f3f4f6]/10 focus:border-[#636AE8] focus:ring-2 focus:ring-[#636AE8]/20 transition"
  const labelClass = "block font-[Inter] text-sm font-semibold text-[#171a1f] mb-2"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-[480px] md:max-w-[560px] sm:mx-6 max-h-[92vh] bg-white sm:rounded-xl rounded-t-2xl shadow-[0px_8.5px_13.75px_0px_#171a1f38,_0px_0px_2px_0px_#171a1f14] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dee1e6] shrink-0">
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

        {/* Scrollable body — header/footer stay fixed, everything else scrolls
            so it's reachable no matter how short the viewport is (this is
            what was cutting off the Create button on desktop). */}
        <div className="overflow-y-auto flex-1 min-h-0">

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
              onBlur={() => setPasswordTouched(true)}
              placeholder="••••••••"
              className={`${inputClass} ${passwordTouched && !passwordValid ? 'border-[#FECDD3]' : ''}`}
            />
            {(passwordTouched || password.length > 0) && (
              <ul className="mt-2 flex flex-col gap-0.5">
                {passwordRules.map(rule => (
                  <li
                    key={rule.label}
                    className={`text-xs font-[Archivo] flex items-center gap-1.5 ${
                      rule.met ? 'text-[#047857]' : 'text-[#9095a0]'
                    }`}
                  >
                    <span>{rule.met ? '✓' : '○'}</span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className={labelClass}>Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmTouched(true)}
              placeholder="••••••••"
              className={`${inputClass} ${confirmTouched && !passwordsMatch ? 'border-[#FECDD3]' : ''}`}
            />
            {confirmTouched && !passwordsMatch && (
              <p className="mt-1 text-xs font-[Archivo] text-[#BE123C]">
                Passwords do not match.
              </p>
            )}
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

        {/* Security Question — used for self-service password recovery (2.1.8) */}
        <div className="px-5 pb-5 flex flex-col gap-4">
          <div>
            <label className={labelClass}>Security Question</label>
            <input
              id="securityQuestion"
              name="securityQuestion"
              type="text"
              value={securityQuestion}
              onChange={e => setSecurityQuestion(e.target.value)}
              placeholder="e.g. What is the name of the first restaurant you worked at?"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Security Answer</label>
            <input
              id="securityAnswer"
              name="securityAnswer"
              type="text"
              value={securityAnswer}
              onChange={e => setSecurityAnswer(e.target.value)}
              onBlur={() => setAnswerTouched(true)}
              placeholder="Only this user should know the answer"
              className={`${inputClass} ${answerTouched && !answerValid ? 'border-[#FECDD3]' : ''}`}
            />
            {answerTouched && !answerValid ? (
              <p className="mt-1 text-xs font-[Archivo] text-[#BE123C]">
                Security answer must be at least 4 characters long.
              </p>
            ) : (
              <p className="mt-1 text-xs font-[Archivo] text-[#9095a0]">
                Pick a question with a unique, hard-to-guess answer — avoid common ones like "favorite color."
              </p>
            )}
          </div>
        </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#dee1e6] flex justify-end gap-3 bg-[#f3f4f6]/10 shrink-0">
          <button
            onClick={onClose}
            className="h-10 px-5 border border-[#dee1e6] rounded-md font-[Archivo] text-sm font-medium text-[#171a1f] bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={
              !firstName.trim() || !lastName.trim() || !email.trim() || !userId.trim() ||
              !passwordValid || !passwordsMatch || !securityQuestion.trim() || !answerValid
            }
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
