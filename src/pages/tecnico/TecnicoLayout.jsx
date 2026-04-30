/**
 * TecnicoLayout — Wrapper de autenticação para técnicos.
 * Toda a navegação (bottom nav / sidebar) fica em TecnicoOficina.
 */
import { Outlet, Navigate, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50">

      {/* Topbar: logo + usuário + logout — visível em todas as telas */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" priority />
          <div className="hidden sm:block w-px h-5 bg-gray-200 mx-1" />
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">
                {(user.nome || user.email || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">{user.nome || user.email}</p>
            <span className="text-[10px] text-indigo-500 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-full">Técnico</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Usuário no mobile */}
          <div className="flex sm:hidden items-center gap-1.5">
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">
                {(user.nome || user.email || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">{user.nome || user.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo — TecnicoOficina cuida do layout interno (sidebar/bottom nav) */}
      <main className="min-h-[calc(100vh-53px)]">
        <Outlet />
      </main>
    </div>
  )
}
