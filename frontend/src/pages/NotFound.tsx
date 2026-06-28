import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'

function NotFound() {
  const { user } = useUser()

  const homePath = !user ? '/login' : user.role === 'admin' ? '/admin/inventory' : '/inventory'
  const homeLabel = !user ? 'Back to Login' : 'Back to Inventory'

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#14151a] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-16 h-16 rounded-full overflow-hidden mb-2">
        <img src="/assets/logo.jpg" className="w-full h-full object-cover" alt="Rice N Roll logo" />
      </div>
      <p className="font-[Archivo] text-6xl font-bold text-[#93191d] dark:text-[#f87171]">404</p>
      <h1 className="font-[Archivo] text-2xl font-bold text-[#171a1f] dark:text-[#f3f4f6]">Page not found</h1>
      <p className="font-[Archivo] text-sm text-[#565e6c] dark:text-[#9095a0] max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to={homePath}
        className="mt-4 px-6 h-11 flex items-center bg-[#93191d] rounded-md text-white text-sm font-[Inter] font-medium hover:bg-[#7a1518] transition-colors"
      >
        {homeLabel}
      </Link>
    </div>
  )
}

export default NotFound
