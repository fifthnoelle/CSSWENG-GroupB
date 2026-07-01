import { Link } from 'react-router-dom'

interface Props {
  onRetry?: () => void
}

function ServerError({ onRetry }: Props) {
  function handleRetry() {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#14151a] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-16 h-16 rounded-full overflow-hidden mb-2">
        <img src="/assets/logo.jpg" className="w-full h-full object-cover" alt="Rice N Roll logo" />
      </div>
      <p className="font-[Archivo] text-6xl font-bold text-[#93191d] dark:text-[#f87171]">500</p>
      <h1 className="font-[Archivo] text-2xl font-bold text-[#171a1f] dark:text-[#f3f4f6]">Something went wrong</h1>
      <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] max-w-sm">
        We hit an unexpected server error. Please try again — if the problem keeps happening, let an admin know.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleRetry}
          className="px-6 h-11 flex items-center bg-[#93191d] rounded-md text-white text-sm font-[Inter] font-medium hover:bg-[#7a1518] transition-colors"
        >
          Try Again
        </button>
        <Link
          to="/login"
          className="px-6 h-11 flex items-center border border-[#dee1e6] dark:border-white/10 rounded-md text-[#171a1f] dark:text-[#e5e7eb] text-sm font-[Inter] font-medium bg-white dark:bg-[#1f2128] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}

export default ServerError
