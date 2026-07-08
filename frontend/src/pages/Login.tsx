import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login} from '../services/auth.service'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'
//import type { User } from '../types'

async function authenticate(email: string, password: string) {
  return login(email, password)
}

function Login() {
  const navigate = useNavigate()
  // Bug fix (#6): also grab setPreviousLogin so the "previous login"
  // snapshot the backend computes (see login() in user.controller.js) is
  // actually captured somewhere — it used to be read off the response and
  // then thrown away entirely.
  const { refreshUser, setPreviousLogin } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleLogin = async (event?: FormEvent) => {
    event?.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const authResult = await authenticate(email, password)
      setPreviousLogin(authResult.previousLogin ?? null)
      await refreshUser()
      if (authResult.role === 'admin') {
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
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#14151a] flex flex-col md:flex-row items-center justify-center gap-10 p-6 overflow-x-hidden relative">

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 rounded-full bg-white dark:bg-[#1f2128] border border-[#dee1e6] dark:border-white/10 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5 text-[#d1d5db]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        ) : (
          <svg className="w-5 h-5 text-[#565e6c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </button>

      {/* Branding */}
      <div className="flex flex-col items-center md:items-start gap-4 w-full md:w-auto">
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden">
          <img src="/assets/logo.jpg" className="w-full h-full object-cover" alt="Rice N Roll logo" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-[#93191d] font-[Archivo] text-[clamp(1.75rem,9vw,5rem)] font-bold leading-tight">
            RICE 'N' ROLL
          </h1>
          <p className="font-[Archivo] text-[clamp(1rem,5vw,2.5rem)] text-[#171a1f] dark:text-[#e5e7eb] font-normal mt-1">
            Inventory Management
          </p>
        </div>
      </div>

      {/* Login card */}
      <div className="w-full max-w-lg bg-white dark:bg-[#1f2128] rounded-2xl shadow-[0px_0px_2px_0px_#171a1f1f,_0px_17px_35px_0px_#171a1f3d] p-8 md:p-10">
        <div className="text-center mb-8">
          <h2 className="font-[Archivo] text-3xl font-bold text-[#171a1f] dark:text-[#f3f4f6]">Welcome Back!</h2>
          <p className="font-[Archivo] text-sm text-[#9095a0] dark:text-[#6b7280] mt-1">Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-[Inter] text-[#424955] dark:text-[#d1d5db]">Email</label>
            <div className="flex items-center gap-2 px-3 h-11 bg-[#f3f4f6] dark:bg-white/5 rounded-md">
              <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-mail.svg" alt="mail" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="flex-1 text-sm font-[Inter] text-[#171a1f] dark:text-[#e5e7eb] placeholder:text-[#bcc1ca] dark:placeholder:text-[#6b7280] outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-[Inter] text-[#424955] dark:text-[#d1d5db]">Password</label>
            <div className="flex items-center gap-2 px-3 h-11 bg-[#f3f4f6] dark:bg-white/5 rounded-md">
              <img className="w-4 h-4 shrink-0 dark:invert" src="/assets/icon-lock.svg" alt="lock" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="flex-1 text-sm font-[Inter] text-[#171a1f] dark:text-[#e5e7eb] placeholder:text-[#bcc1ca] dark:placeholder:text-[#6b7280] outline-none bg-transparent"
              />
              <img 
                className="w-4 h-4 shrink-0 cursor-pointer dark:invert" 
                src={showPassword ? "/assets/icon-eye.svg" : "/assets/icon-eye-off.svg"} 
                alt={showPassword ? "show" : "hide"}
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-[#93191d] dark:text-[#fca5a5] font-[Inter]">
              {error}
            </div>
          )}

          <div className="text-right -mt-2">
            <Link to="/forgot-password" className="text-sm font-bold font-[Archivo] text-[#93191d] dark:text-[#f87171] cursor-pointer hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            id="btn-login"
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-[#93191d] rounded-md text-white text-base font-[Inter] hover:bg-[#7a1518] transition-colors disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
