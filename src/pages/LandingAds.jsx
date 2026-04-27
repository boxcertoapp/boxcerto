/**
 * /lp — Landing Page Tráfego Pago (Ângulo: DOR)
 * Tráfego FRIO — Meta Ads (Instagram / Facebook)
 * Objetivo: converter mecânicos que nunca ouviram falar do BoxCerto
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, ArrowRight, Star, Wrench, MessageCircle,
  Clock, TrendingUp, ShieldCheck, AlertTriangle, X, Zap,
  ThumbsUp, Users, DollarSign,
} from 'lucide-react'

// ─── utilidades ──────────────────────────────────────────────────────────────
function useScrolled(px = 500) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > px)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [px])
  return scrolled
}

// ─── notificação social (prova em tempo real) ────────────────────────────────
const NOTIFS = [
  { nome: 'Paulo R.',    cidade: 'Curitiba/PR',        tempo: 'agora mesmo' },
  { nome: 'Ricardo M.', cidade: 'São Paulo/SP',         tempo: '3 min atrás' },
  { nome: 'Fernanda C.',cidade: 'Porto Alegre/RS',      tempo: '7 min atrás' },
  { nome: 'Carlos S.',  cidade: 'Belo Horizonte/MG',    tempo: '11 min atrás' },
  { nome: 'Thiago L.',  cidade: 'Goiânia/GO',           tempo: '15 min atrás' },
  { nome: 'Ana P.',     cidade: 'Fortaleza/CE',          tempo: '19 min atrás' },
]

function SocialNotification() {
  const [visible, setVisible] = useState(false)
  const [idx, setIdx]         = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed) return
    const show = setTimeout(() => setVisible(true), 6000)
    return () => clearTimeout(show)
  }, [dismissed])

  useEffect(() => {
    if (!visible || dismissed) return
    const hide = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(hide)
  }, [visible, dismissed])

  useEffect(() => {
    if (!visible || dismissed) return
    const next = setTimeout(() => {
      setIdx(i => (i + 1) % NOTIFS.length)
      setVisible(true)
    }, 12000)
    return () => clearTimeout(next)
  }, [visible, dismissed, idx])

  if (!visible || dismissed) return null
  const n = NOTIFS[idx]
  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 max-w-xs md:bottom-6 md:left-6 md:right-auto animate-fade-in-up">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <ThumbsUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900">{n.nome} acabou de se cadastrar</p>
          <p className="text-[11px] text-slate-400">{n.cidade} · {n.tempo}</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-slate-300 hover:text-slate-500 shrink-0 ml-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── calculadora de perdas ───────────────────────────────────────────────────
function MiniCalc({ onCTA }) {
  const [carros, setCarros] = useState(20)
  const [ticket, setTicket] = useState(500)
  const perdaMes = Math.round(carros * ticket * 0.18)
  const perdaAno = perdaMes * 12

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-lg max-w-sm mx-auto">
      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-4 text-center">
        📊 Calculadora de perdas da sua oficina
      </p>

      <div className="space-y-5 mb-6">
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Carros atendidos por mês</label>
            <span className="text-sm font-bold text-indigo-600">{carros}</span>
          </div>
          <input type="range" min={5} max={80} value={carros}
            onChange={e => setCarros(+e.target.value)}
            className="w-full accent-indigo-600" />
          <div className="flex justify-between text-xs text-slate-400 mt-1"><span>5</span><span>80</span></div>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Ticket médio por serviço</label>
            <span className="text-sm font-bold text-indigo-600">R$ {ticket}</span>
          </div>
          <input type="range" min={150} max={2000} step={50} value={ticket}
            onChange={e => setTicket(+e.target.value)}
            className="w-full accent-indigo-600" />
          <div className="flex justify-between text-xs text-slate-400 mt-1"><span>R$ 150</span><span>R$ 2.000</span></div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 text-center">
        <p className="text-xs text-red-500 mb-1">Estimativa de receita perdida por desorganização</p>
        <p className="text-3xl font-extrabold text-red-600">
          R$ {perdaMes.toLocaleString('pt-BR')}
          <span className="text-base font-bold">/mês</span>
        </p>
        <p className="text-xs text-red-400 mt-1">
          ≈ R$ {perdaAno.toLocaleString('pt-BR')} por ano jogados fora
        </p>
      </div>

      <p className="text-xs text-slate-400 text-center mb-4">
        Baseado em média de 18% de perda por orçamentos sem retorno,<br/>serviços não aprovados e falta de seguimento.
      </p>

      <button onClick={onCTA}
        className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100">
        Parar de perder dinheiro agora
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── card de depoimento (WhatsApp) ───────────────────────────────────────────
function WppCard({ nome, tipo, msg, hora, resultado }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 max-w-xs mx-auto">
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#128C7E' }}>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {nome[0]}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{nome}</p>
          <p className="text-white/70 text-xs">{tipo}</p>
        </div>
      </div>
      <div className="p-4 space-y-3" style={{ background: '#E5DDD5' }}>
        <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm">
          <p className="text-slate-700 text-sm leading-relaxed">{msg}</p>
          <p className="text-slate-400 text-[10px] text-right mt-2">{hora} ✓✓</p>
        </div>
        {resultado && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <p className="text-emerald-700 text-xs font-semibold">{resultado}</p>
          </div>
        )}
        <div className="flex gap-0.5 justify-end">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
        </div>
      </div>
    </div>
  )
}

// ─── mockup de aprovação ─────────────────────────────────────────────────────
function AprovacaoMock() {
  const [aprovado, setAprovado] = useState(false)

  return (
    <div className="space-y-4 max-w-xs mx-auto">
      {/* Step 1 */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">
          Passo 1 — Você envia o link pelo WhatsApp
        </p>
        <div className="rounded-2xl overflow-hidden shadow border border-gray-200">
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#128C7E' }}>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">O</div>
            <div>
              <p className="text-white font-semibold text-sm">Sua Oficina</p>
              <p className="text-white/60 text-[10px]">online</p>
            </div>
          </div>
          <div className="p-3" style={{ background: '#E5DDD5' }}>
            <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm text-sm text-slate-700 leading-relaxed">
              Olá, João! Orçamento do seu Gol pronto 👇
              <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-700">Ver orçamento completo</p>
                  <p className="text-[10px] text-slate-400">boxcerto.com/o/abc123</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-right mt-1.5">14:30 ✓✓</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="w-5 h-5 text-indigo-400 rotate-90" />
          <p className="text-[10px] text-slate-400">cliente clica no link</p>
        </div>
      </div>

      {/* Step 2 */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">
          Passo 2 — Cliente aprova no celular
        </p>
        <div className="rounded-2xl overflow-hidden shadow border border-gray-200 bg-white">
          <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs text-slate-500 truncate">boxcerto.com/o/abc123</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Orçamento para</p>
                <p className="font-bold text-slate-900 text-sm">João Silva · Gol 2018</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between"><span>Troca de pastilhas</span><span className="font-semibold">R$ 180</span></div>
              <div className="flex justify-between"><span>Disco dianteiro (2×)</span><span className="font-semibold">R$ 220</span></div>
              <div className="flex justify-between"><span>Mão de obra</span><span className="font-semibold">R$ 120</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm">
                <span>Total</span><span>R$ 520</span>
              </div>
            </div>
            <button
              onClick={() => setAprovado(true)}
              className={`w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${
                aprovado
                  ? 'bg-emerald-100 text-emerald-700 cursor-default'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-100 active:scale-95'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {aprovado ? 'Aprovado com sucesso!' : 'Aprovar orçamento'}
            </button>
          </div>
          <div className={`px-4 py-2 flex items-center gap-2 transition-all ${
            aprovado ? 'bg-emerald-500' : 'bg-emerald-50 border-t border-emerald-100'
          }`}>
            <CheckCircle className={`w-4 h-4 shrink-0 ${aprovado ? 'text-white' : 'text-emerald-600'}`} />
            <p className={`text-xs font-semibold ${aprovado ? 'text-white' : 'text-emerald-700'}`}>
              {aprovado
                ? '✅ Aprovado agora mesmo — registrado automaticamente!'
                : 'Aprovado · 25/04 às 14:35 — registrado'}
            </p>
          </div>
        </div>
        {!aprovado && (
          <p className="text-center text-[11px] text-indigo-500 mt-2 animate-pulse">
            👆 Clique em "Aprovar orçamento" para ver como funciona
          </p>
        )}
      </div>
    </div>
  )
}

// ─── antes / depois ──────────────────────────────────────────────────────────
const COMPARATIVO = [
  ['Orçamento no WhatsApp, cliente some',        'Link enviado, aprovação em minutos'],
  ['Cliente nega que autorizou o serviço',        'Aprovação registrada com data e hora'],
  ['Não sabe quanto entrou de dinheiro',          'Relatório financeiro em tempo real'],
  ['Histórico de clientes espalhado em caderno',  'Histórico digital por placa ou nome'],
  ['Estoque controlado no "achismo"',             'Entradas e saídas registradas'],
]

function AntesDepois() {
  return (
    <div className="max-w-sm mx-auto space-y-3">
      {COMPARATIVO.map(([antes, depois], i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2">
            <div className="bg-red-50 p-3 border-r border-gray-200">
              <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Sem BoxCerto</p>
              <p className="text-xs text-red-700 leading-relaxed">{antes}</p>
            </div>
            <div className="bg-emerald-50 p-3">
              <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Com BoxCerto</p>
              <p className="text-xs text-emerald-700 leading-relaxed">{depois}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────
export default function LandingAds() {
  const navigate   = useNavigate()
  const scrolled   = useScrolled(500)
  const goRegister = useCallback(() => navigate('/cadastro'), [navigate])

  return (
    <div className="min-h-screen bg-white">
      <SocialNotification />

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">BoxCerto</span>
        </div>
        <button onClick={goRegister}
          className="bg-indigo-600 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
          Testar grátis
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="px-4 pt-10 pb-14 text-center bg-gradient-to-b from-slate-900 to-indigo-950">

        {/* urgência */}
        <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" />
          Preço de lançamento · Sobe em breve
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4 max-w-xs mx-auto">
          Sua oficina perde em média{' '}
          <span className="text-amber-400">R$&nbsp;1.800 por mês</span>{' '}
          sem perceber
        </h1>

        <p className="text-slate-300 text-base leading-relaxed mb-3 max-w-xs mx-auto">
          Orçamento no zap sem resposta. Serviço feito, cliente negou. Caixa no papel sem sentido.
          <strong className="text-white"> O BoxCerto acaba com isso hoje.</strong>
        </p>

        {/* social proof rápida */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex -space-x-2">
            {['C','R','F','M','T'].map((l,i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-indigo-950 flex items-center justify-center text-white text-xs font-bold">
                {l}
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-xs">
            <span className="text-white font-bold">+347 oficinas</span> já resolveram isso
          </p>
        </div>

        <button onClick={goRegister}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-2xl shadow-emerald-900 text-base mb-3 animate-pulse-slow">
          Começar grátis por 7 dias
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-slate-500 text-xs">Sem cartão · Cancele quando quiser · Leva 2 minutos</p>
      </section>

      {/* ── BARRA DE CONFIANÇA ── */}
      <section className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />4,9 de avaliação</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />Dados 100% seus</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500" />Pronto em 2 min</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-indigo-500" />+347 oficinas ativas</span>
        </div>
      </section>

      {/* ── DOR — RECONHECIMENTO ── */}
      <section className="px-4 py-14 max-w-md mx-auto">
        <div className="flex items-center gap-2 justify-center mb-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-2xl font-extrabold text-slate-900 text-center">
            Isso acontece na sua oficina?
          </h2>
        </div>
        <p className="text-slate-500 text-sm text-center mb-8">
          Se você se identificar com pelo menos 2 desses cenários, você está perdendo dinheiro todo dia.
        </p>

        <div className="space-y-4">
          {[
            {
              icon: <MessageCircle className="w-5 h-5 text-red-500" />,
              bg: 'bg-red-50',
              title: '"Mandei o orçamento no zap e o cliente sumiu"',
              desc: 'Você digita, manda, e fica esperando. O cliente abre, vê… e ignora. Você não tem como cobrar, não tem como saber se leu.',
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-red-500" />,
              bg: 'bg-red-50',
              title: '"Fiz o serviço e o cliente disse que não autorizou"',
              desc: 'Acontece mais do que você imagina. E sem prova de aprovação, você fica no prejuízo ou perde o cliente.',
            },
            {
              icon: <DollarSign className="w-5 h-5 text-red-500" />,
              bg: 'bg-red-50',
              title: '"Não sei exatamente quanto entrou esse mês"',
              desc: 'O dinheiro passa pela mão e some. No final do mês você não sabe se teve lucro ou prejuízo.',
            },
            {
              icon: <Clock className="w-5 h-5 text-red-500" />,
              bg: 'bg-red-50',
              title: '"Perco horas ligando para cliente confirmar"',
              desc: 'Telefone não atende. WhatsApp na fila. Você poderia estar trabalhando no carro, não caçando aprovação.',
            },
          ].map((item, i) => (
            <div key={i} className={`${item.bg} border border-red-100 rounded-2xl p-4 flex gap-3`}>
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm mb-1">{item.title}</p>
                <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-slate-900 rounded-2xl p-5 text-center">
          <p className="text-white font-bold mb-1">Cada um desses problemas tem um custo real.</p>
          <p className="text-slate-400 text-sm">Calcule o quanto sua oficina está perdendo por mês 👇</p>
        </div>
      </section>

      {/* ── CALCULADORA ── */}
      <section className="px-4 pb-14">
        <MiniCalc onCTA={goRegister} />
      </section>

      {/* ── SOLUÇÃO — APROVAÇÃO POR LINK ── */}
      <section className="bg-gradient-to-b from-indigo-950 to-indigo-900 px-4 py-14">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-full mb-3 tracking-wide">
              EXCLUSIVO BOXCERTO
            </span>
            <h2 className="text-2xl font-extrabold text-white mb-3">
              Aprovação de orçamento em 1 clique
            </h2>
            <p className="text-indigo-300 text-sm leading-relaxed">
              Você monta o orçamento, manda o link pelo WhatsApp. O cliente abre no celular, vê tudo detalhado e aprova na hora.
              Data, hora e nome ficam registrados. <strong className="text-white">Sem discussão depois.</strong>
            </p>
          </div>
          <AprovacaoMock />
          <div className="mt-8 text-center">
            <button onClick={goRegister}
              className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-lg text-base">
              Quero isso na minha oficina
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-indigo-400 text-xs mt-2">7 dias grátis · Sem cartão</p>
          </div>
        </div>
      </section>

      {/* ── ANTES / DEPOIS ── */}
      <section className="px-4 py-14 max-w-md mx-auto">
        <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
          A diferença é gritante
        </h2>
        <p className="text-slate-500 text-sm text-center mb-8">
          Veja o que muda em cada situação do dia a dia da sua oficina.
        </p>
        <AntesDepois />
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
            Mecânicos reais, resultados reais
          </h2>
          <p className="text-slate-500 text-sm text-center mb-8">
            Não é promessa. É o que está acontecendo nas oficinas que já usam.
          </p>

          <div className="space-y-5">
            <WppCard
              nome="Carlos M."
              tipo="Auto Mecânica Mendes · Guarulhos/SP"
              msg="Cara, antigamente eu perdia uns 4 ou 5 orçamentos por mês de clientes que simplesmente sumiam. Agora o link chega, ele clica e pronto. Minha aprovação subiu muito."
              hora="09:14"
              resultado="Aprovações aumentaram 60% no 1º mês"
            />
            <WppCard
              nome="Fernanda R."
              tipo="Oficina da Fer · Caxias do Sul/RS"
              msg="O melhor é quando o cliente fala que não autorizou. Aí eu mostro a tela com o nome dele, a data e o horário. Acabou a discussão. Isso vale cada centavo da assinatura."
              hora="16:32"
              resultado="Zero disputas de autorização desde que começou a usar"
            />
            <WppCard
              nome="Marcos O."
              tipo="Auto Elétrica Oliveira · Uberlândia/MG"
              msg="Antes eu nem sabia quanto tinha entrado no mês. Era tudo no caderno e na memória. Agora abro o BoxCerto e tá lá, tudo detalhado. Minha esposa que controla as finanças ficou feliz."
              hora="11:05"
              resultado="Controle financeiro 100% no primeiro uso"
            />
          </div>
        </div>
      </section>

      {/* ── OFERTA ── */}
      <section className="bg-slate-900 px-4 py-14">
        <div className="max-w-sm mx-auto text-center">
          <span className="inline-block bg-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-full mb-4 tracking-wide">
            OFERTA DE LANÇAMENTO
          </span>
          <h2 className="text-2xl font-extrabold text-white mb-1">
            Comece hoje por R$ 0
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            7 dias grátis para testar tudo, sem cartão. Depois só <strong className="text-white">R$ 34,90/mês</strong> no plano anual.
          </p>

          <div className="text-left space-y-3 mb-8 bg-white/5 rounded-2xl p-5">
            {[
              ['Orçamentos ilimitados',               true],
              ['Aprovação por link (único no mercado)', true],
              ['Histórico de clientes e veículos',    true],
              ['Controle financeiro completo',         true],
              ['Gestão de estoque',                    true],
              ['Suporte humano via WhatsApp',          true],
              ['Sem fidelidade — cancele quando quiser', true],
            ].map(([item, ok], i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className={`w-4 h-4 shrink-0 ${ok ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span className={`text-sm ${ok ? 'text-slate-200' : 'text-slate-600 line-through'}`}>{item}</span>
              </div>
            ))}
          </div>

          <button onClick={goRegister}
            className="w-full bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-xl text-base mb-3">
            Começar meu teste grátis ⭐
          </button>
          <p className="text-slate-500 text-xs">Sem cartão · 7 dias · Cancele quando quiser</p>
        </div>
      </section>

      {/* ── GARANTIA ── */}
      <section className="px-4 py-12 bg-white border-b border-gray-100">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">
            Risco zero. Sem pegar no bolso.
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Teste 7 dias com tudo liberado. Se não resolver o seu problema, é só não assinar.
            Nenhuma cobrança, nenhuma enrolação, seus dados disponíveis para exportar.
            A palavra do BoxCerto está aqui.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-4 py-14 bg-gradient-to-b from-white to-indigo-50 text-center">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
            Todo dia sem BoxCerto é dinheiro deixado na mesa.
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            São 2 minutos para configurar. Já no primeiro orçamento você vai entender por que +347 oficinas não voltam para o jeito antigo.
          </p>
          <button onClick={goRegister}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-extrabold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-200 text-base mb-3">
            Criar minha conta — é grátis
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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white border-t border-gray-200 shadow-2xl md:hidden">
          <button onClick={goRegister}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-base">
            Começar grátis — 7 dias sem cartão
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
