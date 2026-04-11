import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Mis calendarios' },
    { to: '/library', label: 'Biblioteca' },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Administración' }] : []),
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-lg font-bold text-primary-700">
                CalendApp
              </Link>
              <nav className="flex gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-500">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-neutral-500 hover:text-red-600 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
