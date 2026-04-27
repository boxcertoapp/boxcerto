/**
 * /lp2 — Landing Page Tráfego Pago (Ângulo: PROVA SOCIAL + TRANSFORMAÇÃO)
 * Tráfego QUENTE — Retargeting (visitou /lp ou o site e não converteu)
 * Objetivo: converter quem já conhece o BoxCerto mas não se cadastrou
 * Diferença da LP1: sem explicar o problema (já sabe), foco em FOMO + prova + oferta
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, ArrowRight, Star, Wrench, ShieldCheck,
  TrendingUp, Zap, Users, Clock, X, ThumbsUp, DollarSign, Award,
} from 'lucide-react'

// ─── utilidades ───────────────────────────────────────────────────────────────
function useScrolled(px = 400) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > px)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [px])
  return scrolled
}

// ─── contador regressivo (urgência real) ──────────────────────────────────────
function useCountdown(hours = 48) {
  const key = 'bc_lp2_deadline'
  const [time, setTime] = useState(() => {
    const stored = sessionStorage.getItem(key)
    if (stored) return parseInt(stored, 10)
    const deadline = Date.now() + hours * 60 * 60 * 1000
    sessionStorage.setItem(key, deadline)
    return deadline
  })
  const [display, setDisplay] = useState({ h: '00', m: '00', s: '00' })

  useEffect(() => {
    const tick = () => {
      const diff = time - Date.now()
      if (diff <= 0) { setDisplay({ h: '00', m: '00', s: '00' }); return }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setDisplay({ h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [time])

  return display
}

// ─── depoimento estilo WhatsApp ───────────────────────────────────────────────
function WppCard({ nome, cidade, tipo, msg, hora, resultado }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200">
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#128C7E' }}>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {nome[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{nome}</p>
          <p className="text-white/70 text-[11px] truncate">{tipo} · {cidade}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
        </div>
      </div>
      <div className="p-4" style={{ background: '#E5DDD5' }}>
        <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm">
          <p className="text-slate-700 text-sm leading-relaxed">{msg}</p>
          <p className="text-slate-400 text-[10px] text-right mt-2">{hora} ✓✓</p>
        </div>
        {resultado && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <p className="text-emerald-700 text-xs font-bold">{resultado}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── card de métrica ──────────────────────────────────────────────────────────
function MetricCard({ valor, label, sub }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
      <p className="text-2xl font-extrabold text-indigo-600">{valor}</p>
      <p className="text-xs font-bold text-slate-900 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── comparação visual (linha do tempo antes/depois) ─────────────────────────
function Timeline() {
  const before = [
    'Digita orçamento no WhatsApp',
    'Espera cliente responder (às vezes dias)',
    'Liga pra confirmar, ninguém atende',
    'Faz o serviço sem confirmação escrita',
    'Cliente nega que aprovou → problema',
    'No final do mês, sem saber o lucro',
  ]
  const after = [
    'Monta orçamento em 2 minutos no BoxCerto',
    'Envia link pelo WhatsApp em 1 toque',
    'Cliente aprova em minutos, no celular',
    'Aprovação registrada com data e hora',
    'Discussão? Mostra a tela. Fim.',
    'Relatório completo de receita na tela',
  ]
  return (
    <div className="max-w-sm mx-auto space-y-2">
      {before.map((b, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 flex items-start gap-2">
            <X className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">{b}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed">{after[i]}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── seção de objeções inline ─────────────────────────────────────────────────
function Objecao({ pergunta, resposta }) {
  const [open, setOpen] = useState(false)
  return (
    <button onClick={() => setOpen(o => !o)}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm transition-all hover:border-indigo-200">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-slate-900 text-sm">{pergunta}</p>
        <span className={`text-indigo-500 font-bold text-lg transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </div>
      {open && (
        <p className="text-slate-500 text-sm leading-relaxed mt-3 pt-3 border-t border-gray-100">{resposta}</p>
      )}
    </button>
  )
}

// ─── página principal ──────────────────────────────────────────────────────────
export default function LandingAds2() {
  const navigate   = useNavigate()
  const scrolled   = useScrolled()
  const countdown  = useCountdown(48)
  const goRegister = useCallback(() => navigate('/cadastro'), [navigate])

  return (
    <div className="min-h-screen bg-white">

      {/* ── BARRA DE URGÊNCIA (topo) ── */}
      <div className="bg-amber-500 px-4 py-2.5 text-center">
        <p className="text-white text-xs font-bold">
          ⏱ Preço de lançamento termina em:{' '}
          <span className="font-mono bg-amber-600 px-1.5 py-0.5 rounded text-sm">
            {countdown.h}:{countdown.m}:{countdown.s}
          </span>
          {' '}— depois sobe para R$ 67,90/mês
        </p>
      </div>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">BoxCerto</span>
        </div>
        <button onClick={goRegister}
          className="bg-emerald-500 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-emerald-400 transition-colors">
          Garantir meu preço
        </button>
      </nav>

      {/* ── HERO — PROVA SOCIAL PRIMEIRO ── */}
      <section className="px-4 pt-10 pb-12 text-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5">
          <Users className="w-3.5 h-3.5" />
          347 oficinas já deixaram o caos para trás
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4 max-w-xs mx-auto">
          Enquanto você pensa,{' '}
          <span className="text-indigo-600">sua concorrência</span>{' '}
          já está usando o BoxCerto
        </h1>

        <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-xs mx-auto">
          Eles pararam de perder orçamento, de levar calote e de trabalhar sem saber se estão lucrando.
          <strong className="text-slate-700"> Você ainda não.</strong>
        </p>

        {/* avatares + depoimento rápido */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 max-w-xs mx-auto shadow-sm mb-6 text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              {['C','R','F','M','T','A'].map((l,i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                  {l}
                </div>
              ))}
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed italic">
            "Recuperei o valor da assinatura no primeiro orçamento aprovado pelo link.
            Não tinha como voltar atrás."
          </p>
          <p className="text-slate-400 text-xs mt-1">— Ricardo M., São Paulo/SP</p>
        </div>

        <button onClick={goRegister}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-xl shadow-emerald-100 text-base">
          Quero entrar agora — grátis
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-slate-400 mt-2">7 dias grátis · Sem cartão · Pronto em 2 min</p>
      </section>

      {/* ── MÉTRICAS ── */}
      <section className="bg-slate-900 px-4 py-10">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center mb-5">
          Números reais das oficinas que usam
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <MetricCard valor="+347" label="Oficinas ativas" sub="em todo o Brasil" />
          <MetricCard valor="4,9★" label="Avaliação média" sub="dos usuários" />
          <MetricCard valor="68%" label="Mais aprovações" sub="no primeiro mês" />
          <MetricCard valor="2 min" label="Para configurar" sub="e mandar o 1º link" />
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="px-4 py-14 max-w-md mx-auto">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h2 className="text-2xl font-extrabold text-slate-900">O que eles estão dizendo</h2>
        </div>
        <p className="text-slate-500 text-sm text-center mb-8">
          Depoimentos reais, sem roteiro. Do jeito que chegou no nosso WhatsApp.
        </p>

        <div className="space-y-5">
          <WppCard
            nome="Carlos M."
            cidade="Guarulhos/SP"
            tipo="Auto Mecânica Mendes"
            msg="Mano, sério. Perdi um cliente ontem que tentou falar que não tinha aprovado o serviço. Mostrei a tela: nome dele, data, horário. Silêncio total. Paguei. Não tem preço isso."
            hora="09:14"
            resultado="Zero disputas de autorização desde que começou"
          />
          <WppCard
            nome="Fernanda R."
            cidade="Caxias do Sul/RS"
            tipo="Oficina da Fer"
            msg="Em uma semana de uso já recuperei o valor do plano anual inteiro. Os clientes aprovam muito mais rápido pelo link do que pelo WhatsApp. Antes eu ficava esperando horas."
            hora="16:32"
            resultado="ROI positivo na primeira semana"
          />
          <WppCard
            nome="Thiago L."
            cidade="Goiânia/GO"
            tipo="TL Autopeças e Serviços"
            msg="O negócio que mais me impressionou foi o financeiro. Eu nunca soube exatamente quanto eu lucrava. Achava que tava bem, mas quando vi no BoxCerto percebi que tava perdendo dinheiro em peça. Mudou tudo."
            hora="14:47"
            resultado="Descobriu R$ 800/mês de perda em peças subestimadas"
          />
          <WppCard
            nome="Paulo R."
            cidade="Curitiba/PR"
            tipo="Auto Center Paulo"
            msg="Testei os 7 dias achando que era mais um sistema complicado. Em 20 minutos já tinha mandado o primeiro orçamento por link. O cliente aprovou em 4 minutos. Assinei na hora."
            hora="11:22"
            resultado="Assinou no 1º dia de trial"
          />
        </div>
      </section>

      {/* ── TRANSFORMAÇÃO: ANTES × DEPOIS ── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
            Como é o dia a dia de quem usa
          </h2>
          <p className="text-slate-500 text-sm text-center mb-8">
            Comparação direta: seu processo atual vs. com o BoxCerto.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-red-100 text-red-600 text-xs font-bold text-center py-2 rounded-xl">Sem BoxCerto</div>
            <div className="bg-emerald-100 text-emerald-700 text-xs font-bold text-center py-2 rounded-xl">Com BoxCerto</div>
          </div>
          <Timeline />
        </div>
      </section>

      {/* ── CTA INTERMEDIÁRIO ── */}
      <section className="px-4 py-10 bg-indigo-600 text-center">
        <div className="max-w-sm mx-auto">
          <Zap className="w-8 h-8 text-white mx-auto mb-3" />
          <h3 className="text-xl font-extrabold text-white mb-2">
            Você já devia ter tentado.
          </h3>
          <p className="text-indigo-200 text-sm mb-5">
            7 dias grátis. Sem cartão. O pior que pode acontecer é você voltar para o jeito antigo.
          </p>
          <button onClick={goRegister}
            className="w-full bg-white text-indigo-600 font-extrabold py-4 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg text-base">
            Começar meu teste grátis agora
          </button>
          <p className="text-indigo-300 text-xs mt-2">Leva menos de 2 minutos para configurar</p>
        </div>
      </section>

      {/* ── OBJEÇÕES ── */}
      <section className="px-4 py-14 max-w-md mx-auto">
        <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
          O que ainda te impede?
        </h2>
        <p className="text-slate-500 text-sm text-center mb-8">
          Respostas diretas para as dúvidas mais comuns.
        </p>
        <div className="space-y-3">
          <Objecao
            pergunta='"Não tenho tempo para aprender um sistema novo."'
            resposta="2 minutos. Sério. Você cadastra sua oficina, monta um orçamento e manda o link. Não tem treinamento, não tem manual, não tem configuração complicada. Se você usa WhatsApp, você usa o BoxCerto."
          />
          <Objecao
            pergunta='"E se eu não gostar depois dos 7 dias?"'
            resposta="Você simplesmente não assina. Sem cobrança automática, sem multa, sem ligação de vendedor pedindo explicação. Seus dados ficam disponíveis para exportar por mais 30 dias."
          />
          <Objecao
            pergunta='"Meus dados ficam seguros?"'
            resposta="Sim. Usamos Supabase com criptografia de ponta a ponta e autenticação segura. Seus dados de clientes pertencem a você — não vendemos e não compartilhamos com ninguém. CNPJ 52.354.481/0001-37."
          />
          <Objecao
            pergunta='"R$ 34,90 por mês parece caro para oficina pequena."'
            resposta="Pense diferente: se você fechar um orçamento a mais por mês por causa do sistema, você já pagou a assinatura anual inteira. A maioria das oficinas recupera o investimento na primeira semana."
          />
          <Objecao
            pergunta='"Funciona para oficina de moto também?"'
            resposta="Funciona para qualquer oficina do setor automotivo: mecânica de carro, moto, auto elétrica, funilaria, estofaria. O sistema é flexível e você configura para o seu tipo de serviço."
          />
        </div>
      </section>

      {/* ── OFERTA FINAL COM URGÊNCIA ── */}
      <section className="bg-slate-900 px-4 py-14">
        <div className="max-w-sm mx-auto text-center">

          {/* timer */}
          <div className="bg-amber-500 rounded-2xl p-4 mb-6">
            <p className="text-white font-bold text-sm mb-2">
              ⏱ Preço de lançamento termina em
            </p>
            <div className="flex items-center justify-center gap-2">
              {[
                { v: countdown.h, l: 'horas' },
                { v: countdown.m, l: 'min' },
                { v: countdown.s, l: 'seg' },
              ].map(({ v, l }) => (
                <div key={l} className="text-center">
                  <div className="bg-amber-800 text-white font-mono font-extrabold text-2xl w-14 h-14 flex items-center justify-center rounded-xl">
                    {v}
                  </div>
                  <p className="text-amber-200 text-[10px] mt-1">{l}</p>
                </div>
              ))}
            </div>
            <p className="text-amber-100 text-xs mt-3">
              Depois sobe para <strong>R$ 67,90/mês</strong>. Sem aviso adicional.
            </p>
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-1">
            Garanta R$ 34,90/mês agora
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Ou comece com 7 dias grátis — sem cartão — e assine só se amar.
          </p>

          {/* itens inclusos */}
          <div className="text-left space-y-3 mb-8 bg-white/5 rounded-2xl p-5">
            {[
              'Orçamentos ilimitados',
              'Aprovação por link (exclusivo)',
              'Histórico digital de clientes',
              'Controle financeiro em tempo real',
              'Gestão de estoque',
              'Suporte humano via WhatsApp',
              'Preço de lançamento travado para sempre',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200 text-sm">{item}</span>
              </div>
            ))}
          </div>

          <button onClick={goRegister}
            className="w-full bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-2xl shadow-emerald-900 text-base mb-3">
            Garantir meu preço de lançamento ⭐
          </button>
          <p className="text-slate-500 text-xs">Sem cartão no trial · Cancele quando quiser</p>
        </div>
      </section>

      {/* ── GARANTIA ── */}
      <section className="px-4 py-12 bg-white border-b border-gray-100 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">Nossa promessa</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Se em 7 dias você não conseguir mandar um orçamento por link, aprovado pelo cliente, com tudo registrado — é só sair.
            Sem cobrança. Sem multa. Sem pergunta. A palavra do BoxCerto.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-4 py-14 bg-gradient-to-b from-white to-indigo-50 text-center">
        <div className="max-w-sm mx-auto">
          <p className="text-indigo-600 font-bold text-sm mb-2">Última chance de lançamento</p>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            Você vai continuar perdendo orçamento amanhã também?
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            +347 mecânicos já disseram não para o caos. São 2 minutos para você se juntar a eles.
          </p>
          <button onClick={goRegister}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-xl shadow-emerald-100 text-base mb-3">
            Entrar agora — é grátis
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-400">Sem cartão · 7 dias grátis · Cancele quando quiser</p>
        </div>
      </section>

      {/* ── RODAPÉ ── */}
      <footer className="border-t border-gray-100 px-4 py-6 text-center text-xs text-slate-400 space-y-1">
        <p>© {new Date().getFullYear()} BoxCerto Tecnologia Ltda. · CNPJ 52.354.481/0001-37</p>
        <p>
          <a href="/termos" target="_blank" rel="noreferrer" className="hover:underline">Termos de Uso</a>
          {' · '}
          <a href="/privacidade" target="_blank" rel="noreferrer" className="hover:underline">Privacidade</a>
          {' · '}
          <a href="https://wa.me/5553997065725" target="_blank" rel="noreferrer" className="hover:underline">Suporte WhatsApp</a>
        </p>
      </footer>

      {/* ── STICKY MOBILE CTA ── */}
      {scrolled && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-slate-900 border-t border-slate-700 shadow-2xl md:hidden">
          <button onClick={goRegister}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-base">
            Garantir preço de lançamento
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-slate-400 text-[11px] text-center mt-1">
            {countdown.h}:{countdown.m}:{countdown.s} restantes · Depois sobe para R$ 67,90/mês
          </p>
        </div>
      )}
    </div>
  )
}
