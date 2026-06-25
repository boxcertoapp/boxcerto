/**
 * LandingDemo — /demo
 * Landing de alta conversão para donos de oficina mecânica.
 * Objetivo: levar o visitante a testar o sistema OU criar conta.
 */
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { useConfig } from '../hooks/useConfig'
import { supportWaHref } from '../lib/support'
import {
  ArrowRight, Play, CheckCircle, Star, Shield, Zap,
  Wrench, Clock, TrendingUp, Package, ChevronRight,
  X, PhoneCall, MessageCircle, BarChart3, Users,
} from 'lucide-react'
import Logo from '../components/Logo'

// ─── Dados ──────────────────────────────────────────────────────────────────
const DORES = [
  {
    nao: 'Planilha do Excel que não abre no celular',
    sim: 'Acesse tudo pelo celular em qualquer lugar',
  },
  {
    nao: 'Você não sabe se o mês fechou no lucro ou no prejuízo',
    sim: 'Financeiro em tempo real — receitas, despesas e lucro do mês',
  },
  {
    nao: 'Cliente liga e você não acha a OS nem o histórico',
    sim: 'Histórico completo de cada cliente e veículo em segundos',
  },
  {
    nao: 'Estoque de peças no caderno ou na memória',
    sim: 'Alerta automático quando a peça está acabando',
  },
  {
    nao: 'Orçamento feito no papel, cliente não aprova',
    sim: 'Orçamento por link no WhatsApp — cliente aprova na hora',
  },
]

const FEATURES = [
  {
    icon: Wrench,
    titulo: 'Ordem de Serviço completa',
    desc: 'Crie, gerencie e entregue OS do orçamento à entrega. Tudo rastreado.',
    cor: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: MessageCircle,
    titulo: 'Orçamento via WhatsApp',
    desc: 'Envie link de orçamento pro cliente aprovar direto no celular.',
    cor: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Clock,
    titulo: 'Histórico de clientes',
    desc: 'Todo veículo, cada serviço, cada peça. Na palma da mão.',
    cor: 'bg-blue-50 text-blue-600',
  },
  {
    icon: BarChart3,
    titulo: 'Financeiro em tempo real',
    desc: 'Receitas, despesas e lucro líquido. Sem surpresa no fim do mês.',
    cor: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Package,
    titulo: 'Controle de estoque',
    desc: 'Entrada, saída e alertas de estoque mínimo. Nunca fique sem peça.',
    cor: 'bg-red-50 text-red-500',
  },
  {
    icon: Users,
    titulo: 'Suporte humano incluso',
    desc: 'Atendimento real via WhatsApp. Sem robô, sem fila, sem espera.',
    cor: 'bg-purple-50 text-purple-600',
  },
]

const DEPOIMENTOS = [
  {
    nome: 'Marcelo Teixeira',
    cidade: 'Pelotas, RS',
    avatar: 'MT',
    cor: 'bg-indigo-600',
    texto: 'Antes eu não sabia se a oficina estava lucrando ou não. Hoje vejo o financeiro em tempo real e em março fechei com R$ 17 mil de lucro. Isso mudou minha vida.',
    estrelas: 5,
  },
  {
    nome: 'Adriana Fonseca',
    cidade: 'Porto Alegre, RS',
    avatar: 'AF',
    cor: 'bg-emerald-600',
    texto: 'O cliente aprovar o orçamento pelo WhatsApp foi um divisor de águas. Minha taxa de aprovação subiu demais. Sistema muito fácil de usar, aprendi em um dia.',
    estrelas: 5,
  },
  {
    nome: 'Roberto Machado',
    cidade: 'Caxias do Sul, RS',
    avatar: 'RM',
    cor: 'bg-amber-600',
    texto: 'Tentei várias planilhas, outros sistemas caros e complicados. O BoxCerto é o único que funciona de verdade no celular. Em 15 minutos já estava usando.',
    estrelas: 5,
  },
]

const PLANOS = [
  {
    label: 'Plano Mensal',
    preco: 'R$ 97',
    periodo: '/mês',
    detalhe: 'Cancele quando quiser',
    destaque: false,
    economia: null,
  },
  {
    label: 'Plano Anual',
    preco: 'R$ 79,90',
    periodo: '/mês',
    detalhe: 'Cobrado uma vez: R$ 958,80/ano',
    destaque: true,
    economia: 'Economia de R$ 205/ano',
  },
]

const FAQ = [
  {
    q: 'Preciso instalar algum aplicativo?',
    a: 'Não. O BoxCerto funciona direto no navegador do seu celular ou computador. É só entrar no site e começar.',
  },
  {
    q: 'Posso testar antes de pagar?',
    a: 'Sim. Você tem 7 dias grátis sem precisar colocar cartão. E ainda pode testar o sistema demo agora mesmo, sem criar conta.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Seus dados ficam em servidores seguros e criptografados. Você pode exportar tudo a qualquer momento.',
  },
  {
    q: 'E se eu quiser cancelar?',
    a: 'Sem fidelidade e sem multa. Cancele com um clique a qualquer momento, sem burocracia.',
  },
  {
    q: 'Tem suporte se eu travar?',
    a: 'Sim. Suporte humano via WhatsApp incluído em todos os planos. Respondemos em minutos.',
  },
]

// ─── Componentes auxiliares ──────────────────────────────────────────────────
function Estrelas({ n = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

function FaqItem({ q, a }) {
  return (
    <details className="group border-b border-gray-100 py-4">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="text-sm font-semibold text-slate-800 pr-4">{q}</span>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-open:rotate-90 transition-transform" />
      </summary>
      <p className="mt-3 text-sm text-slate-500 leading-relaxed">{a}</p>
    </details>
  )
}

// ─── App mockup visual ───────────────────────────────────────────────────────
function AppMockup() {
  return (
    <div className="relative mx-auto" style={{ maxWidth: 300 }}>
      <div className="absolute -inset-6 bg-gradient-to-b from-indigo-600/20 to-transparent rounded-3xl blur-2xl" />
      <div className="relative bg-slate-800 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
        <div className="bg-white rounded-[2rem] overflow-hidden" style={{ minHeight: 560 }}>

          {/* Header do app */}
          <div className="bg-indigo-600 px-4 pt-3 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
                <Wrench className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-white text-[11px] font-bold">BoxCerto</span>
            </div>
            <span className="text-white/60 text-[9px]">Auto Center Machado</span>
          </div>

          <div className="px-3 py-3 space-y-2">
            {/* Título */}
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs font-extrabold text-slate-900">Oficina</p>
                <p className="text-[9px] text-slate-400">13 ordens abertas</p>
              </div>
              <div className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg">
                + Nova OS
              </div>
            </div>

            {/* OS cards */}
            {[
              { num: 252, cliente: 'Rosana T. Alves', veiculo: 'GM Spin 1.8', status: 'Em Serviço', cor: 'bg-purple-100 text-purple-700', val: 'R$ 2.170' },
              { num: 251, cliente: 'Marcos H. Oliveira', veiculo: 'VW Saveiro 1.6', status: 'Aprovado', cor: 'bg-blue-100 text-blue-700', val: 'R$ 1.241' },
              { num: 249, cliente: 'Andréia P. Lima', veiculo: 'Fiat Palio 1.4', status: 'Pronto ✓', cor: 'bg-emerald-100 text-emerald-700', val: 'R$ 2.805' },
              { num: 247, cliente: 'Gilberto Ferreira', veiculo: 'VW Voyage 1.6', status: 'Orçamento', cor: 'bg-amber-100 text-amber-700', val: 'R$ 1.260' },
            ].map(os => (
              <div key={os.num} className="bg-white border border-gray-100 rounded-xl p-2.5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400">#{os.num}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${os.cor}`}>{os.status}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-900">{os.val}</span>
                </div>
                <p className="text-[10px] font-semibold text-slate-800">{os.cliente}</p>
                <p className="text-[9px] text-slate-400">{os.veiculo}</p>
              </div>
            ))}

            {/* Card financeiro */}
            <div className="bg-emerald-600 rounded-xl p-2.5 mt-1">
              <p className="text-emerald-200 text-[8px] font-semibold">Lucro — Maio 2026</p>
              <p className="text-white font-extrabold text-base leading-tight">R$ 15.500</p>
              <p className="text-emerald-300 text-[8px]">↑ R$ 20.580 receitas · R$ 5.080 despesas</p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="absolute bottom-2 left-2 right-2 bg-white border border-gray-100 rounded-2xl py-1.5 flex shadow-lg">
            {[
              { icon: Wrench, label: 'Oficina', active: true },
              { icon: Clock, label: 'Histórico', active: false },
              { icon: TrendingUp, label: 'Financeiro', active: false },
              { icon: Package, label: 'Estoque', active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-0.5">
                <div className={`p-1 rounded-lg ${active ? 'bg-indigo-50' : ''}`}>
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-600' : 'text-slate-300'}`} />
                </div>
                <span className={`text-[7px] font-medium ${active ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function LandingDemo() {
  const cfg = useConfig()
  usePageMeta({
    title: 'BoxCerto — Sistema para Oficina Mecânica | Teste Grátis',
    description: 'OS, histórico de clientes, financeiro e estoque num só lugar. Tudo pelo celular. Teste grátis agora — sem cadastro, sem cartão.',
    canonical: 'https://boxcerto.com/demo',
  })

  const navigate = useNavigate()
  const goDemo     = () => navigate('/demo/app/oficina')
  const goCadastro = () => navigate('/cadastro')

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <Logo size="sm" priority />
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="text-slate-500 text-sm font-medium px-3 py-2 hover:text-slate-800 transition-colors hidden sm:block"
          >
            Entrar
          </button>
          <button
            onClick={goCadastro}
            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Criar conta grátis
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 px-4 py-14 lg:py-20">
        <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Texto */}
          <div className="text-center lg:text-left mb-12 lg:mb-0">
            <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block" />
              347 oficinas ativas · 4,9 ★ de avaliação
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
              O sistema que prova que{' '}
              <span className="text-amber-400">sua oficina está lucrando</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              OS, histórico de clientes, financeiro e estoque — tudo num só lugar,
              tudo pelo celular. Chega de planilha travando e de não saber o lucro do mês.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={goDemo}
                className="flex items-center justify-center gap-2 bg-emerald-500 text-white font-extrabold py-4 px-6 rounded-2xl hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-900 text-base active:scale-95"
              >
                <Play className="w-5 h-5" />
                Testar o sistema agora
              </button>
              <button
                onClick={goCadastro}
                className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold py-4 px-6 rounded-2xl hover:bg-white/20 transition-colors text-base"
              >
                Criar conta grátis <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 text-xs mt-4">
              Sem cadastro para testar · Sem cartão para criar conta · 7 dias grátis
            </p>
          </div>

          {/* Mockup real */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <div className="absolute -inset-4 bg-indigo-500/20 rounded-3xl blur-3xl pointer-events-none" />
              <img
                src="/mockup01.webp"
                alt="BoxCerto — gestão de oficina no celular e no computador"
                className="relative w-full h-auto"
                loading="eager"
                decoding="async"
                width="1448"
                height="1086"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── BARRA DE CONFIANÇA ───────────────────────────────────── */}
      <section className="bg-slate-900 border-y border-slate-800 px-4 py-5">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3">
          {[
            { icon: Star,   text: '4,9 de avaliação média' },
            { icon: Users,  text: '347 oficinas ativas' },
            { icon: Shield, text: 'Dados seguros e criptografados' },
            { icon: Zap,    text: 'Acesso imediato, sem instalação' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO DE DORES ───────────────────────────────────────── */}
      <section className="bg-gray-50 px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Você se identifica?
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
            Se você faz assim,{' '}
            <span className="text-red-500">está perdendo dinheiro</span>
          </h2>

          <div className="space-y-3">
            {DORES.map((d, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 font-medium leading-snug">{d.nao}</p>
                </div>
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-emerald-800 font-medium leading-snug">{d.sim}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA DEMO ─────────────────────────────────────────────── */}
      <section className="bg-indigo-600 px-4 py-14 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-3">
            Sem burocracia · Acesso imediato
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            Explore o sistema agora,<br />
            <span className="text-amber-300">sem criar conta</span>
          </h2>
          <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
            Clique e entre direto no sistema com dados de uma oficina real. Abra OS,
            veja o financeiro, navegue pelo estoque. Funciona de verdade.
          </p>
          <button
            onClick={goDemo}
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-extrabold py-4 px-8 rounded-2xl hover:bg-indigo-50 transition-colors shadow-2xl text-base mb-4 active:scale-95"
          >
            <Play className="w-5 h-5" />
            Entrar no sistema de demonstração
          </button>
          <p className="text-indigo-300 text-xs">
            Testa tudo agora. Se gostar, cria conta em 2 minutos.
          </p>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ──────────────────────────────────────── */}
      <section className="bg-white px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Tudo que você precisa
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
            Uma ferramenta. Sua oficina organizada.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              const [bg, fg] = f.cor.split(' ')
              return (
                <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bg}`}>
                    <Icon className={`w-5 h-5 ${fg}`} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1">{f.titulo}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ──────────────────────────────────────────── */}
      <section className="bg-gray-50 px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Donos de oficina falam
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-10">
            Resultados reais de oficinas reais
          </h2>

          <div className="space-y-4">
            {DEPOIMENTOS.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <Estrelas n={d.estrelas} />
                <p className="text-sm text-slate-700 leading-relaxed mt-3 mb-4">"{d.texto}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${d.cor} rounded-full flex items-center justify-center shrink-0`}>
                    <span className="text-white text-xs font-extrabold">{d.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{d.nome}</p>
                    <p className="text-xs text-slate-400">{d.cidade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ───────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Preço justo e transparente
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-3">
            Comece grátis por 7 dias
          </h2>
          <p className="text-center text-slate-500 text-sm mb-10">
            Sem cartão de crédito para começar. Cancele quando quiser.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {PLANOS.map((p, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 relative ${
                  p.destaque
                    ? 'border-2 border-indigo-600 bg-indigo-50'
                    : 'border border-gray-200 bg-white'
                }`}
              >
                {p.destaque && (
                  <span className="absolute -top-3 right-4 bg-amber-400 text-slate-900 text-[10px] font-extrabold px-3 py-1 rounded-full">
                    MAIS VANTAJOSO
                  </span>
                )}
                <p className={`text-sm font-bold mb-1 ${p.destaque ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {p.label}
                </p>
                <p className={`text-3xl font-extrabold ${p.destaque ? 'text-indigo-700' : 'text-slate-900'}`}>
                  {p.preco}
                  <span className={`text-sm font-normal ${p.destaque ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {p.periodo}
                  </span>
                </p>
                <p className={`text-xs mt-1 ${p.destaque ? 'text-indigo-400' : 'text-slate-400'}`}>{p.detalhe}</p>
                {p.economia && (
                  <p className="text-xs font-bold text-amber-600 mt-1">{p.economia}</p>
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={goCadastro}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-extrabold py-4 px-8 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg text-base mb-3 active:scale-95"
            >
              Começar grátis por 7 dias <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-slate-400 text-xs">Sem cartão · Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-4 py-14">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-8">
            Perguntas frequentes
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 px-6 divide-y divide-gray-100">
            {FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section className="bg-slate-900 px-4 py-16 text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block" />
            7 dias grátis · Sem cartão · Cancele quando quiser
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            Sua oficina merece funcionar<br />
            <span className="text-amber-400">como uma empresa de verdade</span>
          </h2>

          <p className="text-slate-400 text-sm mb-10 leading-relaxed">
            Mais de 347 donos de oficina já tomaram essa decisão. O próximo pode ser você.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={goCadastro}
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white font-extrabold py-4 px-8 rounded-2xl hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-900/50 text-base active:scale-95"
            >
              Criar minha conta grátis <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={goDemo}
              className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold py-4 px-8 rounded-2xl hover:bg-white/20 transition-colors text-base"
            >
              <Play className="w-4 h-4" />
              Testar antes
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500 mt-8">
            {[
              'Sem cartão para começar',
              'Acesso em 2 minutos',
              'Suporte via WhatsApp incluso',
              'Cancele quando quiser',
            ].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-slate-950 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <Logo size="sm" onDark priority />
            <div className="flex items-center gap-4">
              <a
                href={supportWaHref(cfg.support_phone)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <a href="/login" className="text-slate-500 text-xs hover:text-slate-300 transition-colors">Entrar</a>
              <a href="/cadastro" className="text-slate-500 text-xs hover:text-slate-300 transition-colors">Criar conta</a>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <p>© {new Date().getFullYear()} BoxCerto Tecnologia Ltda. · CNPJ 52.354.481/0001-37</p>
            <div className="flex gap-4">
              <a href="/termos" className="hover:text-slate-400 transition-colors">Termos</a>
              <a href="/privacidade" className="hover:text-slate-400 transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
