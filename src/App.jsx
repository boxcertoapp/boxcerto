import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Pending from './pages/Pending'
import Assinar from './pages/Assinar'
import Sucesso from './pages/Sucesso'
import Renovar from './pages/Renovar'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import OrcamentoPublico from './pages/OrcamentoPublico'
import Termos from './pages/Termos'
import Privacidade from './pages/Privacidade'
import LandingAds from './pages/LandingAds'
import AppLayout from './pages/app/AppLayout'
import Oficina from './pages/app/Oficina'
import Historico from './pages/app/Historico'
import Financeiro from './pages/app/Financeiro'
import AppMenu from './pages/app/Menu'
import Estoque from './pages/app/Estoque'
import Suporte from './pages/app/Suporte'
import AdminPanel from './pages/admin/AdminPanel'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/pendente" element={<Pending />} />
          <Route path="/renovar" element={<Renovar />} />
          <Route path="/assinar" element={<Assinar />} />
          <Route path="/sucesso" element={<Sucesso />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/o/:token" element={<OrcamentoPublico />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/lp" element={<LandingAds />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* App protegido */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/oficina" replace />} />
            <Route path="oficina" element={<Oficina />} />
            <Route path="historico" element={<Historico />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="suporte" element={<Suporte />} />
            <Route path="menu" element={<AppMenu />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
