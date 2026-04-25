import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Zap, ArrowRight, MessageCircle, RefreshCw, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Renovar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const statusMsg = {
    cancelado:    { titulo: 'Assinatura cancelada',          desc: 'Sua assinatura foi cancelada. Renove para continuar usando o BoxCerto.' },
    inadimplente: { titulo: 'Pagamento não confirmado',      desc: 'Identificamos um problema com seu último pagamento. Atualize seu método de pagamento para continuar.' },
    inactive:     { titulo: 'Conta inativa',                 desc: 'Sua conta está inativa. Entre em contato para reativar.' },
  }

  const info = statusMsg[user?.status] || {
    titulo: 'Acesso expirado',
    desc: 'Seu período de trial encerrou. Assine um plano para continuar usando todas as funcionalidades.',
  }

  const abrirWhatsApp = () => {
    const msg = encodeURIComponent(`Olá! Minha conta BoxCerto (${user?.email}) está com acesso bloqueado. Podem me ajudar?`)
    window.open(`https://wa.me/5553999999999?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">

      {/* Card principal */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">

        {/* Ícone de alerta */}
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900">BoxCerto</span>
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 mb-2">{info.titulo}</h1>
        <p className="text-slate-500 text-sm mb-1">{info.desc}</p>
        {user?.email && (
          <p className="text-xs text-slate-400 mb-6">{user.email}</p>
        )}

        {/* Ação principal — assinar */}
        <button
          onClick={() => navigate('/assinar')}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:bg-indigo-700 transition-colors mb-3 shadow-lg shadow-indigo-100"
        >
          <Zap className="w-4 h-4" />
          Ver planos e assinar
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Gerenciar assinatura existente (Stripe portal) */}
        {user?.status === 'inadimplente' && (
          <a
            href={`https://billing.stripe.com/p/login/00g00000000000?prefilled_email=${encodeURIComponent(user?.email || '')}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-slate-700 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors mb-3 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar forma de pagamento
          </a>
        )}

        {/* WhatsApp suporte */}
        <button
          onClick={abrirWhatsApp}
          className="w-full flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 font-semibold py-3 rounded-2xl hover:bg-green-100 transition-colors mb-4 text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          Falar com suporte
        </button>

        {/* Sair */}
        <button
          onClick={() => { logout(); navigate('/') }}
          className="flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs mx-auto transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair da conta
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-6 text-center">
        Pagamento 100% seguro via Stripe · Cancele quando quiser
      </p>
    </div>
  )
}
