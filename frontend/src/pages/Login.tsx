import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getUser } from '../services/auth.service'
import { useUser } from '../context/UserContext'
import type { User } from '../types'

async function authenticate(email: string, password: string): Promise<User> {
  await login(email, password)
  return getUser()
}

function Login() {
  const navigate = useNavigate()
  const { refreshUser } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setLoading(true)

    try {
      const user = await authenticate(email, password)
      await refreshUser()
      if (user.role === 'admin') {
        navigate('/admin/inventory')
      } else {
        navigate('/inventory')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in. Please check your email and password.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row items-center justify-center gap-10 p-6 overflow-x-hidden">

      {/* Branding */}
      <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-auto">
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden">
          <img src="/assets/logo.png" className="w-full h-full object-cover" alt="Rice N Roll logo" />
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

      {/* Login card */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-[0px_0px_2px_0px_#171a1f1f,_0px_17px_35px_0px_#171a1f3d] p-8 md:p-10">
        <div className="text-center mb-8">
          <h2 className="font-[Archivo] text-3xl font-bold text-[#171a1f]">Welcome Back!</h2>
          <p className="font-[Archivo] text-sm text-[#9095a0] mt-1">Sign in to continue to your account</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Email */}
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
                onChange={(event) => setEmail(event.target.value)}
                className="flex-1 text-sm font-[Inter] text-[#bcc1ca] placeholder:text-[#bcc1ca] outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-[Inter] text-[#424955]">Password</label>
            <div className="flex items-center gap-2 px-3 h-11 bg-[#f3f4f6] rounded-md">
              <img className="w-4 h-4 shrink-0" src="/assets/icon-lock.svg" alt="lock" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="flex-1 text-sm font-[Inter] text-[#bcc1ca] placeholder:text-[#bcc1ca] outline-none bg-transparent"
              />
              <img 
                className="w-4 h-4 shrink-0 cursor-pointer" 
                src={showPassword ? "/assets/icon-eye.svg" : "/assets/icon-eye-off.svg"} 
                alt={showPassword ? "show" : "hide"}
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-[#93191d] font-[Inter]">
              {error}
            </div>
          )}

          <div className="text-right -mt-2">
            <span className="text-sm font-bold font-[Archivo] text-[#93191d] cursor-pointer">
              Forgot Password?
            </span>
          </div>

          <button
            id="btn-login"
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-14 bg-[#93191d] rounded-md text-white text-base font-[Inter] hover:bg-[#7a1518] transition-colors disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
