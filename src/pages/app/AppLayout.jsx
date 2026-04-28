import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { Wrench, Clock, TrendingUp, Menu, Package, Zap } from 'lucide-react'
import { useAuth, hasAccess, trialDaysLeft } from '../../contexts/AuthContext'
import AnnouncementBanner from '../../components/AnnouncementBanner'
import Logo from '../../components/Logo'

const tabs = [
  { to: '/app/oficina',    icon: Wrench,     label: 'Oficina' },
  { to: '/app/historico',  icon: Clock,      label: 'Histórico' },
  { to: '/app/financeiro', icon: TrendingUp, label: 'Financeiro' },
  { to: '/app/estoque',    icon: Package,    label: 'Estoque' },
  { to: '/app/menu',       icon: Menu,       label: 'Menu' },
]

export default function AppLayout() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!hasAccess(user)) return <Navigate to="/renovar" replace />

  const diasRestantes = user.status === 'trial' ? trialDaysLeft(user) : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AnnouncementBanner />

      {/* ── DESKTOP: sidebar + content ─────────────────────── */}
      <div className="hidden lg:flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-screen z-40">
          {/* Logo */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" priority />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 truncate">{user.oficina}</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {tabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : ''}`} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Trial banner (sidebar bottom) */}
          {user.status === 'trial' && diasRestantes !== null && (
            <div
              className="mx-3 mb-4 bg-indigo-600 text-white text-xs font-medium px-3 py-2.5 rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors"
              onClick={() => navigate('/assinar')}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {diasRestantes > 0
                    ? `${diasRestantes} ${diasRestantes === 1 ? 'dia restante' : 'dias restantes'}`
                    : 'Período encerrado'}
                </span>
              </div>
              <span className="underline font-semibold">Assinar agora →</span>
            </div>
          )}
        </aside>

        {/* Main content — offset for sidebar */}
        <div className="ml-56 flex-1 flex flex-col min-h-screen">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ── MOBILE: top header + bottom tab bar ────────────── */}
      <div className="lg:hidden w-full max-w-lg mx-auto flex flex-col min-h-screen relative">

        {/* Banner trial */}
        {user.status === 'trial' && diasRestantes !== null && (
          <div
            className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-indigo-700 transition-colors shrink-0"
            onClick={() => navigate('/assinar')}
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              {diasRestantes > 0
                ? `Período gratuito: ${diasRestantes} ${diasRestantes === 1 ? 'dia restante' : 'dias restantes'}`
                : 'Seu período gratuito encerrou'}
            </div>
            <span className="underline font-semibold">Assinar agora →</span>
          </div>
        )}

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shrink-0">
          <Logo size="sm" priority />
          <span className="text-xs text-slate-400 truncate max-w-[150px]">{user.oficina}</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>

        {/* Tab Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 z-50">
          <div className="flex">
            {tabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-50' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </nav>
      </div>

      {/* Fundo decorativo desktop */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-indigo-50 hidden lg:block" />
    </div>
  )
}
