/**
 * DemoLayout — layout do app no modo demonstração
 * Espelha AppLayout.jsx mas sem autenticação real.
 * Fornece DemoModalContext para todas as páginas filhas.
 */
import { createContext, useContext, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Wrench, Clock, TrendingUp, Menu, Package, ArrowRight, X } from 'lucide-react'

// ── Contexto do modal de conversão ────────────────────────────────────────────
export const DemoModalContext = createContext({ open: () => {} })
export const useDemoModal = () => useContext(DemoModalContext)

// ── Modal de conversão ────────────────────────────────────────────────────────
function ConversionModal({ acao, onClose }) {
  const navigate = useNavigate()
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500">
          <X className="w-5 h-5" />
        </button>

        <div className="text-4xl mb-4 text-center">🔒</div>

        <h2 className="text-xl font-extrabold text-slate-900 text-center mb-2">
          Você está no modo demonstração
        </h2>

        {acao && (
          <p className="text-center text-slate-500 text-sm mb-1">
            A ação "<span className="font-semibold text-slate-700">{acao}</span>" está
            disponível na versão completa.
          </p>
        )}

        <p className="text-center text-slate-400 text-xs mb-6">
          Crie sua conta grátis e tenha acesso total — 7 dias sem cartão.
        </p>

        <button
          onClick={() => navigate('/cadastro')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm transition-colors shadow-lg mb-3"
        >
          Criar minha conta grátis <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          className="w-full text-slate-400 hover:text-slate-600 text-sm py-2 transition-colors"
        >
          Continuar explorando o demo
        </button>

        <p className="text-center text-[11px] text-slate-300 mt-3">
          Sem cartão · 7 dias grátis · Cancele quando quiser
        </p>
      </div>
    </div>
  )
}

// ── Tabs de navegação ─────────────────────────────────────────────────────────
const tabs = [
  { to: '/demo/app/oficina',    icon: Wrench,     label: 'Oficina'    },
  { to: '/demo/app/historico',  icon: Clock,      label: 'Histórico'  },
  { to: '/demo/app/financeiro', icon: TrendingUp, label: 'Financeiro' },
  { to: '/demo/app/estoque',    icon: Package,    label: 'Estoque'    },
  { to: '/demo/app/menu',       icon: Menu,       label: 'Menu'       },
]

// ── Layout principal ──────────────────────────────────────────────────────────
export default function DemoLayout() {
  const navigate = useNavigate()
  const [modalConfig, setModalConfig] = useState(null)

  const openModal = (acao = null) => setModalConfig({ acao })
  const closeModal = () => setModalConfig(null)

  return (
    <DemoModalContext.Provider value={{ open: openModal }}>
      {/* Modal de conversão */}
      {modalConfig && <ConversionModal acao={modalConfig.acao} onClose={closeModal} />}

      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* ── Banner demo (topo fixo) ──────────────────────── */}
        <div className="sticky top-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shrink-0">
          <span className="flex items-center gap-2">
            🔒 <span className="hidden sm:inline">Modo Demonstração — dados fictícios para exploração</span>
            <span className="sm:hidden">Modo Demonstração</span>
          </span>
          <button
            onClick={() => navigate('/cadastro')}
            className="bg-white text-amber-600 px-3 py-1 rounded-full font-bold hover:bg-amber-50 transition-colors text-[11px] whitespace-nowrap"
          >
            Cadastrar grátis →
          </button>
        </div>

        {/* ── DESKTOP: sidebar + content ─────────────────────── */}
        <div className="hidden lg:flex flex-1">

          {/* Sidebar */}
          <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed left-0 z-40" style={{ top: '36px', height: 'calc(100vh - 36px)' }}>
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">Auto Center Machado</p>
                  <p className="text-[10px] text-slate-400 truncate">Pelotas, RS</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {tabs.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
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

            {/* CTA sidebar */}
            <div className="mx-3 mb-4">
              <button
                onClick={() => navigate('/cadastro')}
                className="w-full bg-indigo-600 text-white text-xs font-semibold px-3 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  🚀 <span>Ter acesso completo</span>
                </div>
                <span className="underline font-bold">Cadastrar grátis →</span>
              </button>
            </div>
          </aside>

          {/* Main */}
          <div className="ml-56 flex-1 min-h-screen">
            <main className="max-w-3xl mx-auto">
              <Outlet />
            </main>
          </div>
        </div>

        {/* ── MOBILE: header + content + tab bar ─────────────── */}
        <div className="lg:hidden w-full max-w-lg mx-auto flex flex-col flex-1 relative">

          {/* Header mobile */}
          <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-[36px] z-40 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-900">Auto Center Machado</span>
            </div>
            <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-full">Demo</span>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto pb-24">
            <Outlet />
          </main>

          {/* Tab Bar */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 z-50">
            <div className="flex">
              {tabs.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to}
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
      </div>
    </DemoModalContext.Provider>
  )
}
