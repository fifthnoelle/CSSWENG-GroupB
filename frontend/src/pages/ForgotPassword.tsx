import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getSecurityQuestion, resetPasswordWithAnswer } from '../services/auth.service'

function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleFindAccount() {
    setError(null)
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    setLoading(true)
    try {
      const result = await getSecurityQuestion(email.trim())
      setQuestion(result.question)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to find that account')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    setError(null)

    if (!securityAnswer.trim() || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }

    setLoading(true)
    try {
      await resetPasswordWithAnswer(email.trim(), securityAnswer.trim(), newPassword)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row items-center justify-center gap-10 p-6 overflow-x-hidden">

      {/* Branding */}
      <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-auto">
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden">
          <img src="/assets/logo.jpg" className="w-full h-full object-cover" alt="Rice N Roll logo" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-[#93191d] font-[Archivo] text-[clamp(1.75rem,9vw,5rem)] font-bold leading-tight">
            RICE 'N' ROLL
          </h1>
          <p className="font-[Archivo] text-[clamp(1rem,5vw,2.5rem)] text-[#171a1f] font-normal mt-1">
            Inventory Management
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-[0px_0px_2px_0px_#171a1f1f,_0px_17px_35px_0px_#171a1f3d] p-8 md:p-10">
        <div className="text-center mb-8">
          <h2 className="font-[Archivo] text-3xl font-bold text-[#171a1f]">Reset Password</h2>
          <p className="font-[Archivo] text-sm text-[#9095a0] mt-1">
            {step === 1 ? "Enter your email to get started" : "Answer your security question to continue"}
          </p>
        </div>

        {success ? (
          <div className="flex flex-col gap-6">
            <div className="bg-[#d3f9e0] border border-[#9ae6b4] text-[#073517] text-sm font-[Archivo] rounded-md px-4 py-3">
              Your password has been reset. You can now sign in with your new password.
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full h-14 bg-[#93191d] rounded-md text-white text-base font-[Inter] hover:bg-[#7a1518] transition-colors"
            >
              Back to Sign in
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {error && (
              <div className="text-sm text-[#93191d] font-[Inter]">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-sm font-[Inter] text-[#424955]">Email</label>
                  <div className="flex items-center gap-2 px-3 h-11 bg-[#f3f4f6] rounded-md">
                    <img className="w-4 h-4 shrink-0" src="/assets/icon-mail.svg" alt="mail" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="flex-1 text-sm font-[Inter] text-[#171a1f] placeholder:text-[#bcc1ca] outline-none bg-transparent"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFindAccount}
                  disabled={loading}
                  className="w-full h-14 bg-[#93191d] rounded-md text-white text-base font-[Inter] hover:bg-[#7a1518] transition-colors disabled:opacity-70"
                >
                  {loading ? 'Looking up account…' : 'Continue'}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-[Inter] text-[#424955]">Security Question</label>
                  <div className="px-3 py-2.5 bg-[#f3f4f6] rounded-md text-sm font-[Archivo] font-medium text-[#171a1f]">
                    {question}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="securityAnswer" className="text-sm font-[Inter] text-[#424955]">Your Answer</label>
                  <input
                    id="securityAnswer"
                    name="securityAnswer"
                    type="text"
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                    className="h-11 px-3 bg-[#f3f4f6] rounded-md text-sm font-[Inter] text-[#171a1f] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="newPassword" className="text-sm font-[Inter] text-[#424955]">New Password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="h-11 px-3 bg-[#f3f4f6] rounded-md text-sm font-[Inter] text-[#171a1f] outline-none"
                  />
                  <p className="text-xs font-[Archivo] text-[#9095a0]">
                    At least 12 characters, with uppercase, lowercase, a number, and a special character.
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="confirmPassword" className="text-sm font-[Inter] text-[#424955]">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="h-11 px-3 bg-[#f3f4f6] rounded-md text-sm font-[Inter] text-[#171a1f] outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full h-14 bg-[#93191d] rounded-md text-white text-base font-[Inter] hover:bg-[#7a1518] transition-colors disabled:opacity-70"
                >
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </>
            )}

            <div className="text-center">
              <Link to="/login" className="text-sm font-bold font-[Archivo] text-[#93191d]">
                Back to Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
