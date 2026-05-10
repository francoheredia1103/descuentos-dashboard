import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Tag, PlusCircle } from 'lucide-react'

export default function Layout() {
  const { profile } = useAuth()

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/descuentos', label: 'Descuentos', icon: Tag },
    { to: '/agregar', label: 'Agregar', icon: PlusCircle },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <span className="text-sm">💰</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">PromoTracker</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{profile?.name?.[0]?.toUpperCase() ?? '?'}</span>
            </div>
            <span className="text-sm font-medium text-white/70 hidden sm:block">{profile?.name ?? '...'}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-28">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 px-4 pb-5 pt-2">
        <div className="max-w-xs mx-auto bg-[#1a1a25] border border-white/10 rounded-2xl flex shadow-2xl shadow-black/60 overflow-hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-3 gap-1 text-[10px] font-semibold transition-all ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-white/30 hover:text-white/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-emerald-500/20' : ''}`}>
                    <Icon size={20} />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
