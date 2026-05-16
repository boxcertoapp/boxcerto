/**
 * LandingDemo — /demo
 * Página de entrada para o modo de demonstração interativo do BoxCerto.
 * Foco: levar o visitante a entrar no sistema o mais rápido possível.
 */
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import {
  ArrowRight, Wrench, Clock, TrendingUp, Package, CheckCircle,
  Star, ShieldCheck, Play, FileText, Car, Users
} from 'lucide-react'

const MODULOS = [
  { icon: Wrench,     label: 'Oficina',     desc: '12 OS em diferentes status — do orçamento à entrega' },
  { icon: Clock,      label: 'Histórico',   desc: '10 clientes reais com histórico de serviços' },
  { icon: TrendingUp, label: 'Financeiro',  desc: '3 meses de receitas, despesas e lucro real' },
  { icon: Package,    label: 'Estoque',     desc: '18 peças cadastradas com alertas de estoque mínimo' },
]

const PREVIEWS = [
  { icon: FileText, label: 'OS aprovada pelo cliente', cor: 'bg-blue-50 text-blue-600',  info: 'Andréia Lima · Palio · R$ 785' },
  { icon: Car,      label: 'Em serviço agora',         cor: 'bg-purple-50 text-purple-600', info: 'Carlos Machado · Gol · R$ 555' },
  { icon: Package,  label: 'Estoque crítico',          cor: 'bg-red-50 text-red-500',    info: 'Amortecedor Monroe — 3 un (mín 4)' },
  { icon: TrendingUp,label:'Lucro em março',           cor: 'bg-emerald-50 text-emerald-600', info: '+R$ 1.336,00 de lucro líquido' },
]

export default function LandingDemo() {
  usePageMeta({
    title: 'Demonstração Interativa | BoxCerto — Explore sem criar conta',
    description: 'Explore o BoxCerto com dados reais sem criar conta. Veja OS, histórico de clientes, financeiro e estoque de uma oficina mecânica real funcionando.',
    canonical: 'https://boxcerto.com/demo',
  })

  const navigate = useNavigate()
  const goDemo   = () => navigate('/demo/app/oficina')

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 text-lg">BoxCerto</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/login')}
            className="text-slate-500 text-sm font-medium px-3 py-2 hover:text-slate-800 transition-colors hidden sm:block">
            Entrar
          </button>
          <button onClick={() => navigate('/cadastro')}
            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
            Criar conta grátis
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-b from-slate-900 to-indigo-950 px-4 py-14 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <Play className="w-3.5 h-3.5" /> Demo interativo — sem criar conta
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Explore o BoxCerto<br />
            <span className="text-amber-400">como se fosse sua oficina</span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-lg mx-auto">
            Clique em qualquer botão, abra OS, navegue pelo financeiro, veja o estoque — tudo com dados
            fictícios de uma oficina mecânica em Pelotas, RS.
          </p>

          <button onClick={goDemo}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-2xl shadow-emerald-900 text-base mb-3">
            Entrar no modo demonstração <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-slate-500 text-xs">Sem cadastro · Sem cartão · Acesso imediato</p>
        </div>
      </section>

      {/* O QUE VOCÊ VAI ENCONTRAR */}
      <section className="bg-gray-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            O que está disponível no demo
          </p>
          <div className="grid grid-cols-2 gap-3">
            {MODULOS.map((m, i) => {
              const Icon = m.icon
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-4.5 h-4.5 text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1">{m.label}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PREVIEW DOS DADOS */}
      <section className="bg-white px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Exemplos do que você vai ver
          </p>
          <p className="text-center text-slate-500 text-sm mb-6">Dados fictícios de uma oficina em Pelotas, RS</p>
          <div className="space-y-2">
            {PREVIEWS.map((p, i) => {
              const Icon = p.icon
              return (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${p.cor.split(' ')[0]}`}>
                    <Icon className={`w-4 h-4 ${p.cor.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{p.label}</p>
                    <p className="text-xs text-slate-400 truncate">{p.info}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CONFIANÇA */}
      <section className="bg-gray-50 border-y border-gray-100 px-4 py-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500 max-w-2xl mx-auto">
          <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />4,9 de avaliação</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />Dados 100% fictícios no demo</span>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-500" />+347 oficinas ativas</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-indigo-500" />7 dias grátis após cadastro</span>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-white px-4 py-14 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            Pronto para explorar?
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Entre no demo agora e veja como o BoxCerto funciona na prática — sem burocracia, sem formulário.
          </p>
          <button onClick={goDemo}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-extrabold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg text-base mb-3">
            Entrar no modo demonstração <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/cadastro')}
            className="w-full text-slate-500 text-sm py-2 hover:text-indigo-600 transition-colors">
            Ou criar minha conta grátis direto →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 px-4 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} BoxCerto Tecnologia Ltda. · CNPJ 52.354.481/0001-37</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="/termos" className="hover:text-slate-300">Termos</a>
          <a href="/privacidade" className="hover:text-slate-300">Privacidade</a>
          <a href="https://wa.me/5553997065725" target="_blank" rel="noreferrer" className="hover:text-slate-300">WhatsApp</a>
        </div>
      </footer>
    </div>
  )
}
