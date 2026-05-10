import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Tag, PlusCircle, LogOut } from 'lucide-react'

export default function Layout() {
  const { profile, signOut } = useAuth()

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/descuentos', label: 'Descuentos', icon: Tag },
    { to: '/agregar', label: 'Agregar', icon: PlusCircle },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-slate-800 text-lg">PromoTracker</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 hidden sm:block">
              Hola, <span className="text-emerald-600 font-semibold">{profile?.name ?? '...'}</span>
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-sm"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
        <div className="max-w-4xl mx-auto flex">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
