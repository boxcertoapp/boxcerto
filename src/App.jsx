import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// ── Eager: páginas críticas do caminho feliz ───────────────────────────────
import Landing    from './pages/Landing'
import Login      from './pages/Login'
import Register   from './pages/Register'

// ── Lazy: tudo que o visitante NÃO vê na primeira visita ──────────────────
const Assinar         = lazy(() => import('./pages/Assinar'))
const Sucesso         = lazy(() => import('./pages/Sucesso'))
const Renovar         = lazy(() => import('./pages/Renovar'))
const EsqueciSenha    = lazy(() => import('./pages/EsqueciSenha'))
const RedefinirSenha  = lazy(() => import('./pages/RedefinirSenha'))
const OrcamentoPublico = lazy(() => import('./pages/OrcamentoPublico'))
const Termos          = lazy(() => import('./pages/Termos'))
const Privacidade     = lazy(() => import('./pages/Privacidade'))
const LandingAds      = lazy(() => import('./pages/LandingAds'))
const LandingAds2     = lazy(() => import('./pages/LandingAds2'))
const Diagnostico     = lazy(() => import('./pages/Diagnostico'))
const LandingOficinaP = lazy(() => import('./pages/LandingOficinaP'))
const LandingOrcamento= lazy(() => import('./pages/LandingOrcamento'))
const LandingVsPlanilha = lazy(() => import('./pages/LandingVsPlanilha'))

// ── App (carregado apenas após login) ─────────────────────────────────────
const AppLayout  = lazy(() => import('./pages/app/AppLayout'))
const Oficina    = lazy(() => import('./pages/app/Oficina'))
const Historico  = lazy(() => import('./pages/app/Historico'))
const Financeiro = lazy(() => import('./pages/app/Financeiro'))
const AppMenu    = lazy(() => import('./pages/app/Menu'))
const Estoque    = lazy(() => import('./pages/app/Estoque'))
const Suporte    = lazy(() => import('./pages/app/Suporte'))
const AdminPanel      = lazy(() => import('./pages/admin/AdminPanel'))
const TecnicoConvite  = lazy(() => import('./pages/TecnicoConvite'))
const TecnicoLayout   = lazy(() => import('./pages/tecnico/TecnicoLayout'))
const TecnicoOficina  = lazy(() => import('./pages/tecnico/TecnicoOficina'))

// Fallback mínimo enquanto o chunk carrega
function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#3F46E5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Públicas */}
            <Route path="/"               element={<Landing />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/cadastro"       element={<Register />} />
            <Route path="/renovar"        element={<Renovar />} />
            <Route path="/assinar"        element={<Assinar />} />
            <Route path="/sucesso"        element={<Sucesso />} />
            <Route path="/esqueci-senha"  element={<EsqueciSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/o/:token"       element={<OrcamentoPublico />} />
            <Route path="/termos"         element={<Termos />} />
            <Route path="/privacidade"    element={<Privacidade />} />
            <Route path="/lp"             element={<LandingAds />} />
            <Route path="/lp2"            element={<LandingAds2 />} />
            <Route path="/diagnostico"                      element={<Diagnostico />} />
            <Route path="/sistema-para-oficina-pequena"     element={<LandingOficinaP />} />
            <Route path="/orcamento-online-oficina"         element={<LandingOrcamento />} />
            <Route path="/boxcerto-vs-planilha"             element={<LandingVsPlanilha />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminPanel />} />

            {/* Convite de técnico (público — não precisa estar logado) */}
            <Route path="/tecnico-convite" element={<TecnicoConvite />} />

            {/* Área do técnico */}
            <Route path="/tecnico" element={<TecnicoLayout />}>
              <Route index element={<TecnicoOficina />} />
            </Route>

            {/* App protegido */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/oficina" replace />} />
              <Route path="oficina"    element={<Oficina />} />
              <Route path="historico"  element={<Historico />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="estoque"    element={<Estoque />} />
              <Route path="suporte"    element={<Suporte />} />
              <Route path="menu"       element={<AppMenu />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
