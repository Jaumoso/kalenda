import { Outlet, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const languages = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
  ]

  const currentLang = languages.find((l) => i18n.language.startsWith(l.code)) ?? languages[0]

  const navLinks = [
    { to: '/', label: t('nav.myCalendars') },
    { to: '/library', label: t('nav.library') },
    { to: '/events', label: t('nav.events') },
    { to: '/templates', label: t('nav.templates') },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: t('nav.admin') }] : []),
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-surface border-b border-neutral-200">
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
              <div className="flex items-center border border-neutral-200 rounded overflow-hidden">
                {([['light', Sun], ['dark', Moon], ['system', Monitor]] as const).map(([value, Icon]) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    title={t(`theme.${value}`)}
                    className={`p-1.5 transition-colors ${
                      theme === value
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
              <select
                value={currentLang.code}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="text-sm text-neutral-500 bg-transparent border border-neutral-200 rounded px-2 py-1 cursor-pointer hover:border-neutral-400 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-neutral-500">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-neutral-500 hover:text-red-600 transition-colors"
              >
                {t('common.signOut')}
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
