import { useNavigate } from 'react-router-dom'
import { Check, Zap, ArrowLeft, Shield, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useConfig } from '../hooks/useConfig'

// ── COLE AQUI OS LINKS DO STRIPE APÓS CRIAR EM:
// Stripe Dashboard → Produtos → Payment Links → + Novo link de pagamento
// Em cada link, configure a URL de sucesso como: https://seudominio.com/sucesso
const LINK_MENSAL = 'https://buy.stripe.com/dRm5kF3Xkglx0WK2EV63K03'
const LINK_ANUAL  = 'https://buy.stripe.com/4gM6oJ8dAc5h48Wdjz63K02'

const features = [
  'Ordens de serviço ilimitadas',
  'Aprovação de orçamento por link (com rastreio do status)',
  'Histórico completo de clientes e veículos',
  'Controle financeiro e despesas',
  'Gestão de estoque com alertas',
  'Impressão de OS e recibos',
  'Modo técnico — acesso limitado para funcionários',
  'Múltiplos técnicos na mesma conta',
  'Checklist e notas internas por OS',
  'Relatórios de clientes inativos',
  'Aniversariantes do mês',
  'Suporte via WhatsApp',
]

export default function Assinar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const cfg = useConfig()
  const pMensal  = parseFloat(cfg.price_monthly)        || 97
  const pAnual   = parseFloat(cfg.price_annual)         || 958.80
  const pAnualM  = parseFloat(cfg.price_annual_monthly) || 79.90
  const economia = Math.round(pMensal * 12 - pAnual)

  const abrirStripe = (url) => {
    // Pré-preenche o email do cliente no checkout
    const finalUrl = user?.email
      ? `${url}?prefilled_email=${encodeURIComponent(user.email)}`
      : url
    window.location.href = finalUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">

      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">BoxCerto — Assinar</span>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Star className="w-3.5 h-3.5" />
            Acesso completo a todas as funcionalidades
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Escolha seu plano</h1>
          <p className="text-slate-500 text-base max-w-md mx-auto">
            Sem surpresas. Cancele quando quiser. Seus dados ficam seguros.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-8 max-w-2xl mx-auto">

          {/* Plano Mensal */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Mensal</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-slate-900">R${pMensal % 1 === 0 ? pMensal.toFixed(0) : pMensal.toFixed(2).replace('.',',')}</span>
                <span className="text-slate-400 text-sm mb-1">/mês</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Cobrado mensalmente · Cancele quando quiser</p>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => abrirStripe(LINK_MENSAL)}
              className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-700 transition-colors"
            >
              Assinar plano mensal
            </button>
          </div>

          {/* Plano Anual */}
          <div className="bg-indigo-600 rounded-2xl p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
              Mais popular
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-indigo-200 uppercase tracking-wide mb-1">Anual</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-white">R${String(pAnualM.toFixed(2)).split(',')[0].split('.')[0]}</span>
                <span className="text-2xl font-bold text-white">,{pAnualM.toFixed(2).split('.')[1]}</span>
                <span className="text-indigo-300 text-sm mb-1">/mês</span>
              </div>
              <p className="text-xs text-indigo-300 mt-1">R${pAnual.toFixed(2).replace('.',',')} cobrado anualmente · Economize R${economia}</p>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-indigo-100">
                  <Check className="w-4 h-4 text-indigo-300 mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => abrirStripe(LINK_ANUAL)}
              className="w-full bg-white text-indigo-700 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Assinar plano anual
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
          <Shield className="w-3.5 h-3.5" />
          Pagamento 100% seguro via Stripe · Cancele a qualquer momento
        </div>
      </div>
    </div>
  )
}
