/**
 * DemoMenu — espelha Menu.jsx no modo demonstração
 */
import { useNavigate } from 'react-router-dom'
import {
  Building2, User, Phone, MapPin, Lock, ArrowRight,
  CheckCircle, Wrench, Clock, TrendingUp, Package, FileText, Star
} from 'lucide-react'
import { useDemoModal } from './DemoLayout'
import { DEMO_OFICINA } from './demoData'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: FileText, label: 'Orçamentos ilimitados', desc: 'Crie e envie por link no WhatsApp' },
  { icon: Wrench,   label: 'OS ilimitadas',          desc: 'Acompanhe do orçamento à entrega' },
  { icon: Clock,    label: 'Histórico completo',      desc: 'Por cliente e veículo' },
  { icon: TrendingUp,label:'Financeiro em tempo real',desc: 'Receitas, despesas e lucro' },
  { icon: Package,  label: 'Controle de estoque',     desc: 'Com alertas de estoque mínimo' },
  { icon: Star,     label: 'Suporte via WhatsApp',    desc: 'Atendimento humano incluído' },
]

export default function DemoMenu() {
  const { open } = useDemoModal()
  const navigate = useNavigate()

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <h1 className="text-lg font-extrabold text-slate-900">Menu</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Banner de conversão */}
        <div className="bg-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Modo Demonstração</span>
          </div>
          <h2 className="text-lg font-extrabold mb-1">Gostou do que viu?</h2>
          <p className="text-indigo-200 text-sm mb-4">
            Crie sua conta grátis e tenha acesso completo ao BoxCerto — com seus dados reais, da sua oficina.
          </p>
          <button
            onClick={() => navigate('/cadastro')}
            className="w-full bg-white text-indigo-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
          >
            Criar minha conta grátis <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-indigo-300 text-[11px] text-center mt-2">7 dias grátis · Sem cartão de crédito</p>
        </div>

        {/* Dados da oficina de demonstração */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">Oficina (dados de demo)</p>
            <button onClick={() => open('Editar dados da oficina')}
              className="text-xs text-indigo-600 font-semibold hover:underline">
              Editar
            </button>
          </div>
          <div className="px-4">
            <InfoRow icon={Building2} label="Nome da oficina" value={DEMO_OFICINA.nome} />
            <InfoRow icon={User}      label="Responsável"    value={DEMO_OFICINA.responsavel} />
            <InfoRow icon={Phone}     label="WhatsApp"        value="(53) 99706-5725" />
            <InfoRow icon={MapPin}    label="Cidade"          value={DEMO_OFICINA.cidade} />
          </div>
        </div>

        {/* Funcionalidades inclusas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-bold text-slate-800">O que está incluso no BoxCerto</p>
          </div>
          <div className="px-4 divide-y divide-gray-50">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{f.label}</p>
                    <p className="text-xs text-slate-400">{f.desc}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Planos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-bold text-slate-800">Planos disponíveis</p>
          </div>
          <div className="p-4 space-y-3">
            {/* Mensal */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-slate-700">Plano Mensal</p>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">R$ 97<span className="text-sm font-normal text-slate-400">/mês</span></p>
              <p className="text-xs text-slate-400 mt-1">Cancele quando quiser</p>
            </div>
            {/* Anual */}
            <div className="border-2 border-indigo-600 rounded-xl p-4 relative">
              <span className="absolute -top-2.5 right-3 bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">MAIS VANTAJOSO</span>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-indigo-700">Plano Anual</p>
              </div>
              <p className="text-2xl font-extrabold text-indigo-700">R$ 79,90<span className="text-sm font-normal text-indigo-400">/mês</span></p>
              <p className="text-xs text-indigo-400 mt-0.5">Cobrado uma vez ao ano: R$ 958,80</p>
              <p className="text-xs font-bold text-amber-600 mt-0.5">Economia de R$ 205,20 vs mensal</p>
            </div>
            <button onClick={() => navigate('/cadastro')}
              className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm">
              Começar grátis por 7 dias →
            </button>
          </div>
        </div>

        {/* Ações bloqueadas */}
        {[
          { label: 'Configurar logo da oficina', icon: Building2 },
          { label: 'Gerenciar técnicos',          icon: User },
          { label: 'Configurar mensagens WhatsApp', icon: Phone },
          { label: 'Exportar dados',               icon: FileText },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <button key={i} onClick={() => open(item.label)}
              className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left shadow-sm">
              <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <span className="flex-1 text-sm font-medium text-slate-700">{item.label}</span>
              <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
