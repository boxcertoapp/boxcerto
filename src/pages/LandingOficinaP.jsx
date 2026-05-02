import { useState } from 'react'
import {
  CheckCircle, ArrowRight, Zap, Star, MessageCircle, Shield,
  Clock, Smartphone, TrendingUp, FileText, ChevronRight, Package
} from 'lucide-react'
import { usePageMeta } from '../hooks/usePageMeta'
import { useConfig } from '../hooks/useConfig'

const CADASTRO = 'https://www.boxcerto.com/cadastro'
const WPP_NUM  = '5553997065725'
const WPP_MSG  = encodeURIComponent('Olá! Vi a página sobre sistema para oficina pequena e quero saber mais.')

// ── Status Stepper ────────────────────────────────────────────
const STEPS = [
  { label: 'Orçamento',  desc: 'enviado',        bg: 'bg-slate-700',   ring: false },
  { label: 'Aprovado',   desc: 'pelo cliente',   bg: 'bg-indigo-600',  ring: false },
  { label: 'Em serviço', desc: 'mãos na massa',  bg: 'bg-amber-500',   ring: true  },
  { label: 'Pronto',     desc: 'para retirada',  bg: 'bg-emerald-500', ring: false },
]

function StatusStepper() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
      {STEPS.map((step, i) => (
        <div key={i} className="flex flex-col sm:flex-row items-center">
          <div className={`flex flex-col items-center justify-center px-5 py-3 rounded-2xl min-w-[110px] text-white ${step.bg} ${step.ring ? 'ring-4 ring-amber-300 shadow-xl scale-105 z-10' : 'opacity-90'}`}>
            <span className="text-xs font-extrabold">{step.label}</span>
            <span className="text-[10px] text-white/70 mt-0.5">{step.desc}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-px h-3 sm:h-px sm:w-5 bg-slate-300 my-0.5 sm:my-0 sm:mx-0.5" />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Antes e Depois ─────────────────────────────────────────────
const COMPARATIVO = [
  { antes: 'Orçamento no papel ou WhatsApp', depois: 'Link profissional que o cliente aprova em 1 clique' },
  { antes: 'Cliente pergunta "cadê meu carro?"', depois: 'Status do serviço atualizado em tempo real' },
  { antes: 'Estoque na cabeça ou no caderno', depois: 'Alertas automáticos quando peça vai acabar' },
  { antes: 'Não sei quanto lucrei esse mês', depois: 'Financeiro fechado em 30 segundos' },
  { antes: 'OS perdida, serviço esquecido', depois: 'Histórico completo de cada veículo e cliente' },
  { antes: 'Horas de papelada por semana', depois: 'OS e recibo gerados em segundos' },
]

// ── Depoimentos ───────────────────────────────────────────────
const DEPOIMENTOS = [
  {
    nome: 'Carlos M.',
    oficina: 'Mecânica do Carlos · Caxias do Sul, RS',
    texto: 'Sou só eu e mais um ajudante. Achei que sistema era coisa de grande empresa. O BoxCerto é simples demais — em uma tarde já estava rodando. Nunca mais perdi um orçamento.',
    inicial: 'C',
  },
  {
    nome: 'Patrícia L.',
    oficina: 'Auto Elétrica LP · Porto Alegre, RS',
    texto: 'Minha oficina é pequena mas agora parece grande. O cliente recebe link, aprova, acompanha o serviço. Passei de 8 para 18 OS por semana sem contratar ninguém.',
    inicial: 'P',
  },
  {
    nome: 'Rodrigo F.',
    oficina: 'RF Mecânica · Pelotas, RS',
    texto: 'Tinha medo de sistema complicado. Em 10 minutos já tinha cadastrado os primeiros clientes e aberto a primeira OS. O suporte no WhatsApp é muito rápido.',
    inicial: 'R',
  },
  {
    nome: 'Janaina S.',
    oficina: 'Auto Center Janaina · Novo Hamburgo, RS',
    texto: 'Trabalho sozinha na recepção enquanto meu marido está na mecânica. O BoxCerto organizou tudo — não precisamos mais de planilha nem de caderno.',
    inicial: 'J',
  },
]

export default function LandingOficinaP() {
  usePageMeta({
    title: 'Sistema para Oficina Pequena | Controle OS, Orçamentos e Lucro — BoxCerto',
    description: 'Sistema simples para oficina pequena controlar clientes, veículos, ordens de serviço, orçamentos e lucro pelo celular. Sem treinamento. Teste grátis por 7 dias.',
    canonical: 'https://boxcerto.com/sistema-para-oficina-pequena',
  })
  const cfg = useConfig()
  const cfg_pm  = parseFloat(cfg.price_monthly)        || 97
  const cfg_pam = parseFloat(cfg.price_annual_monthly) || 79.90

  const [tabAtiva, setTabAtiva] = useState('antes')

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">BoxCerto</span>
          </a>
          <a
            href={CADASTRO}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Começar grátis <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-b from-indigo-50 to-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <Smartphone className="w-3.5 h-3.5" />
              Feito para oficinas pequenas e médias
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 leading-tight">
              O sistema de gestão que<br />
              <span className="text-indigo-600">pequenas oficinas precisavam</span>
            </h1>
            <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
              Sem complicação, sem treinamento longo, sem contrato. Em 10 minutos você já está abrindo sua primeira OS e enviando orçamentos profissionais pelo celular.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={CADASTRO}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-colors text-base shadow-lg shadow-indigo-200"
              >
                Testar grátis por 7 dias
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href={`https://wa.me/${WPP_NUM}?text=${WPP_MSG}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-slate-700 font-semibold px-6 py-4 rounded-2xl hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-4">Sem cartão de crédito · Cancele quando quiser</p>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <span>4.9 de satisfação</span>
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Mais de 300 oficinas ativas</span>
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>Suporte via WhatsApp incluso</span>
            </div>
          </div>
        </div>
      </section>

      {/* ISSO É PARA VOCÊ SE */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 text-center">
              Essa página é para você se…
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Você controla os serviços pelo WhatsApp',
                'Anota orçamento em caderno ou papel',
                'Não sabe quantos orçamentos ficaram sem resposta essa semana',
                'Esquece de ligar pro cliente quando o carro fica pronto',
                'Não sabe exatamente quanto lucrou esse mês',
                'Acha que sistema de gestão é complicado demais para sua oficina',
                'Já perdeu o histórico de algum cliente ou veículo',
                'Fica sem peça porque não controla o estoque direito',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500 mb-4">Se você marcou pelo menos 2 desses pontos, o BoxCerto foi feito para você.</p>
              <a
                href="https://www.boxcerto.com/cadastro"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Testar grátis por 7 dias <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* DOR — O QUE TRAVAR UMA OFICINA PEQUENA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Oficina pequena tem problema específico
            </h2>
            <p className="text-slate-500">
              Sistemas grandes demais, planilhas que não escalam, e a sensação de que você trabalha muito mas não sabe quanto está sobrado no final do mês.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                icon: Clock,
                cor: 'rose',
                titulo: 'Tempo gasto em burocracia',
                desc: 'OS no papel, orçamento no caderno, histórico na memória. Cada serviço gera trabalho duplo que poderia estar na chave.',
              },
              {
                icon: FileText,
                cor: 'amber',
                titulo: 'Orçamentos sem resposta',
                desc: 'Você envia pelo WhatsApp, o cliente visualiza e some. Sem rastreio, sem follow-up automático, sem aprovação formal.',
              },
              {
                icon: TrendingUp,
                cor: 'indigo',
                titulo: 'Financeiro no escuro',
                desc: 'Quanto entrou esse mês? Quanto saiu com peças? Qual foi o lucro real? Perguntas que deveriam ter resposta em segundos.',
              },
            ].map((item, i) => {
              const Icon = item.icon
              const cores = {
                rose:   { bg: 'bg-rose-100',   text: 'text-rose-600'   },
                amber:  { bg: 'bg-amber-100',  text: 'text-amber-600'  },
                indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
              }
              const c = cores[item.cor]
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{item.titulo}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ANTES E DEPOIS */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Como fica sua oficina com o BoxCerto
            </h2>
            <p className="text-slate-500">Uma mudança simples que transforma a operação toda.</p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {[['antes', 'Sem BoxCerto'], ['depois', 'Com BoxCerto']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTabAtiva(key)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  tabAtiva === key
                    ? key === 'antes' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="max-w-xl mx-auto space-y-3">
            {COMPARATIVO.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                tabAtiva === 'antes'
                  ? 'bg-rose-50 border-rose-100'
                  : 'bg-emerald-50 border-emerald-100'
              }`}>
                {tabAtiva === 'antes'
                  ? <div className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600 text-xs font-bold">✕</div>
                  : <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                }
                <span className="text-sm text-slate-700">{tabAtiva === 'antes' ? item.antes : item.depois}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATUS TRACKER */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-600/30 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Smartphone className="w-3.5 h-3.5" />
              Rastreio em tempo real
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              Seu cliente sabe onde está o carro — sem precisar ligar
            </h2>
            <p className="text-slate-400 mb-8">
              Você atualiza o status da OS e o cliente acompanha tudo pelo link. Profissional, transparente, sem ligação chata.
            </p>
          </div>
          <StatusStepper />
          <p className="text-center text-slate-400 text-sm mt-6">
            A cada mudança de status, o cliente pode ser notificado automaticamente.
          </p>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Tudo que uma oficina pequena precisa
            </h2>
            <p className="text-slate-500">Sem funcionalidades inúteis, sem curva de aprendizado longa.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { icon: FileText, label: 'OS ilimitadas', desc: 'Abra e gerencie quantas quiser' },
              { icon: CheckCircle, label: 'Aprovação por link', desc: 'Cliente aprova sem ligar' },
              { icon: Package, label: 'Controle de estoque', desc: 'Alertas de reposição automáticos' },
              { icon: TrendingUp, label: 'Financeiro completo', desc: 'Lucro real sem planilha' },
              { icon: Clock, label: 'Histórico de clientes', desc: 'Todo veículo com registro' },
              { icon: Shield, label: 'Modo técnico', desc: 'Acesso limitado para funcionários' },
              { icon: Smartphone, label: 'Funciona no celular', desc: '100% responsivo e rápido' },
              { icon: Star, label: 'Suporte WhatsApp', desc: 'Atendimento humano incluso' },
              { icon: ArrowRight, label: 'Impressão de OS', desc: 'PDF pronto com sua marca' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Oficinas pequenas que mudaram de patamar
            </h2>
            <p className="text-slate-500">Donos que trabalhavam sozinhos ou com equipe pequena — e transformaram a operação.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {DEPOIMENTOS.map((d, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-slate-600 italic mb-4 leading-relaxed">"{d.texto}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">{d.inicial}</div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{d.nome}</p>
                    <p className="text-xs text-slate-400">{d.oficina}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              Preço que cabe no orçamento da oficina
            </h2>
            <p className="text-slate-500 mb-8">Menos que o custo de uma peça. E recupera o investimento no primeiro orçamento aprovado.</p>

            <div className="bg-indigo-600 rounded-2xl p-8 text-white mb-4">
              <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wide mb-2">Plano único · Tudo incluído</p>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-5xl font-extrabold">R${cfg_pm % 1 === 0 ? cfg_pm.toFixed(0) : cfg_pm.toFixed(2).replace('.',',')}</span>
                <span className="text-indigo-300 mb-1">/mês</span>
              </div>
              <p className="text-indigo-200 text-sm mb-6">ou R${cfg_pam.toFixed(2).replace('.',',')}/mês no plano anual</p>
              <a
                href={CADASTRO}
                className="flex items-center justify-center gap-2 w-full bg-white text-indigo-700 font-bold py-3.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Começar 7 dias grátis
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
              <Shield className="w-3.5 h-3.5" />
              Cancele quando quiser · Suporte incluso · Sem contrato de fidelidade
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 bg-gradient-to-b from-indigo-600 to-indigo-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Sua oficina pequena pode ter gestão grande
            </h2>
            <p className="text-indigo-200 mb-8 text-lg">
              Comece hoje. Sem cartão de crédito, sem complicação. Em 10 minutos você já está no controle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={CADASTRO}
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors text-base"
              >
                Testar grátis agora
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href={`https://wa.me/${WPP_NUM}?text=${WPP_MSG}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-indigo-400 text-white font-semibold px-6 py-4 rounded-2xl hover:bg-indigo-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Tirar dúvidas no WhatsApp
              </a>
            </div>
            <p className="text-indigo-300 text-xs mt-4">7 dias grátis · Sem cartão · Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-400 font-semibold">BoxCerto</span>
            <span>· © 2025 Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-4">
            <a href="/termos" className="hover:text-slate-300">Termos</a>
            <a href="/privacidade" className="hover:text-slate-300">Privacidade</a>
            <a href="/diagnostico" className="hover:text-slate-300">Fazer diagnóstico</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
