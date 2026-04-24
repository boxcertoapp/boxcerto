import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Pending from './pages/Pending'
import Assinar from './pages/Assinar'
import Sucesso from './pages/Sucesso'
import AppLayout from './pages/app/AppLayout'
import Oficina from './pages/app/Oficina'
import Historico from './pages/app/Historico'
import Financeiro from './pages/app/Financeiro'
import AppMenu from './pages/app/Menu'
import Estoque from './pages/app/Estoque'
import AdminPanel from './pages/admin/AdminPanel'

function Renovar() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-sm">
        <p className="text-2xl mb-2">⚠️</p>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Assinatura inativa</h2>
        <p className="text-slate-500 text-sm mb-6">Sua assinatura está vencida. Renove para continuar usando o BoxCerto.</p>
        <a
          href="https://billing.stripe.com/p/login/test_00g00000000000"
          target="_blank"
          rel="noreferrer"
          className="block w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Renovar assinatura
        </a>
      </div>
    </div>
  )
}

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

          {/* Admin */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* App protegido */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/oficina" replace />} />
            <Route path="oficina" element={<Oficina />} />
            <Route path="historico" element={<Historico />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="menu" element={<AppMenu />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
