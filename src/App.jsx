import { lazy, Suspense, useEffect, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { captureAffiliateRef } from './lib/affiliateTracking'

// ── Proteção contra tela em branco pós-deploy ─────────────────────────────
// Quando um novo deploy muda os nomes dos chunks (hash), usuários que já
// estavam na página tentam carregar o chunk antigo → 404 → blank screen.
// Este ErrorBoundary detecta ChunkLoadError e faz um reload automático
// (uma vez por sessão, para evitar loop infinito).
const CHUNK_RELOAD_KEY = 'bxc_csr'

class ChunkErrorBoundary extends Component {
  state = { crashed: false, isChunk: false }

  static getDerivedStateFromError(err) {
    const msg = (err?.message || '').toLowerCase()
    const isChunk =
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('importing a module script failed') ||
      msg.includes('loading chunk') ||
      err?.name === 'ChunkLoadError'
    return { crashed: true, isChunk }
  }

  componentDidCatch(err) {
    if (this.state.isChunk && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
      // Limpa todos os caches do Service Worker antes de recarregar
      // para garantir que o browser busca os novos chunks do servidor
      if ('caches' in window) {
        caches.keys()
          .then(keys => Promise.all(keys.map(k => caches.delete(k))))
          .finally(() => window.location.reload())
      } else {
        window.location.reload()
      }
    }
  }

  render() {
    if (!this.state.crashed) return this.props.children

    // Chunk desatualizado + ainda não tentou recarregar → spinner (reload vem logo)
    if (this.state.isChunk && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      return <PageLoader />
    }

    // Erro real ou reload já tentado → UI de recuperação
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 24, fontFamily: 'system-ui, sans-serif',
      }}>
        <p style={{ color: '#374151', fontSize: 16, textAlign: 'center', maxWidth: 360, margin: 0, lineHeight: 1.55 }}>
          Houve uma atualização no sistema.<br />
          Recarregue a página para continuar.
        </p>
        <button
          onClick={() => { sessionStorage.removeItem(CHUNK_RELOAD_KEY); window.location.reload() }}
          style={{
            background: '#4f46e5', color: '#fff', border: 'none',
            borderRadius: 999, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Recarregar agora
        </button>
      </div>
    )
  }
}

// ── Eager: apenas Landing (home page /) ───────────────────────────────────
// Login e Register são lazy para que vendor-supabase NÃO apareça no
// modulepreload de landing pages públicas (/lp, /lp2…).
import Landing    from './pages/Landing'

// ── Lazy: tudo que o visitante NÃO vê na primeira visita ──────────────────
const Login           = lazy(() => import('./pages/Login'))
const Register        = lazy(() => import('./pages/Register'))
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
const BemVindo          = lazy(() => import('./pages/BemVindo'))
const LandingDemo       = lazy(() => import('./pages/LandingDemo'))
const Parceiro            = lazy(() => import('./pages/Parceiro'))
const ParceiroPerfil      = lazy(() => import('./pages/ParceiroPerfil'))
const ParceiroDashboard   = lazy(() => import('./pages/ParceiroDashboard'))
const DemoLayout        = lazy(() => import('./pages/demo/DemoLayout'))
const DemoOficina       = lazy(() => import('./pages/demo/DemoOficina'))
const DemoHistorico     = lazy(() => import('./pages/demo/DemoHistorico'))
const DemoFinanceiro    = lazy(() => import('./pages/demo/DemoFinanceiro'))
const DemoEstoque       = lazy(() => import('./pages/demo/DemoEstoque'))
const DemoMenu          = lazy(() => import('./pages/demo/DemoMenu'))

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
  // Captura ?ref= de afiliado em qualquer página de entrada
  useEffect(() => { captureAffiliateRef() }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <ChunkErrorBoundary>
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
            <Route path="/lpdiagnostico"                        element={<Diagnostico />} />
            <Route path="/lpsistema-para-oficina-pequena"       element={<LandingOficinaP />} />
            <Route path="/lporcamento-online-oficina"           element={<LandingOrcamento />} />
            <Route path="/lpboxcerto-vs-planilha"               element={<LandingVsPlanilha />} />
            {/* Redirecionamentos das URLs antigas */}
            <Route path="/diagnostico" element={<Navigate to="/lpdiagnostico" replace />} />
            <Route path="/sistema-para-oficina-pequena"     element={<Navigate to="/lpsistema-para-oficina-pequena" replace />} />
            <Route path="/orcamento-online-oficina"         element={<Navigate to="/lporcamento-online-oficina" replace />} />
            <Route path="/boxcerto-vs-planilha"             element={<Navigate to="/lpboxcerto-vs-planilha" replace />} />
            <Route path="/bem-vindo"                        element={<BemVindo />} />
            <Route path="/parceiro"              element={<Parceiro />} />
            <Route path="/parceiro/dashboard" element={<ParceiroDashboard />} />
            <Route path="/parceiro/:slug"     element={<ParceiroPerfil />} />

            {/* Demo interativo */}
            <Route path="/demo"       element={<LandingDemo />} />
            <Route path="/demo/app"   element={<DemoLayout />}>
              <Route index element={<Navigate to="/demo/app/oficina" replace />} />
              <Route path="oficina"    element={<DemoOficina />} />
              <Route path="historico"  element={<DemoHistorico />} />
              <Route path="financeiro" element={<DemoFinanceiro />} />
              <Route path="estoque"    element={<DemoEstoque />} />
              <Route path="menu"       element={<DemoMenu />} />
            </Route>

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
        </ChunkErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  )
}
