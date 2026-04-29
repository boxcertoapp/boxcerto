/**
 * TecnicoLayout — Layout exclusivo para técnicos
 * Navegação limitada: Minhas OS + Suporte + Perfil
 */
import { Outlet, Navigate, useNavigate } from 'react-router-dom'
import { Wrench, LogOut, HardHat } from 'lucide-react'
import { useAuth, hasAccess } from '../../contexts/AuthContext'
import Logo from '../../components/Logo'

export default function TecnicoLayout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!hasAccess(user)) return <Navigate to="/login" replace />
  if (!user.isTecnico) return <Navigate to="/app/oficina" replace />

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── DESKTOP ──────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen">
        <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-screen z-40">
          {/* Logo + oficina */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" priority />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 truncate">Área do Técnico</p>
              </div>
            </div>
          </div>

          {/* Técnico info */}
          <div className="px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">
                  {(user.nome || user.email || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{user.nome || user.email}</p>
                <p className="text-[10px] text-indigo-500 font-medium">Técnico</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-600">
              <Wrench className="w-5 h-5 shrink-0" />
              Minhas OS
            </div>
          </nav>

          {/* Logout */}
          <div className="px-3 pb-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              Sair
            </button>
          </div>
        </aside>

        <div className="ml-56 flex-1 flex flex-col min-h-screen">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ── MOBILE ───────────────────────────────────────────── */}
      <div className="lg:hidden w-full max-w-lg mx-auto flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">
                {(user.nome || user.email || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 leading-tight">{user.nome || user.email}</p>
              <p className="text-[10px] text-indigo-500 leading-tight">Técnico</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-8">
          <Outlet />
        </main>
      </div>

      {/* Fundo decorativo desktop */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-indigo-50 hidden lg:block" />
    </div>
  )
}
