/**
 * /lp — Landing Page Tráfego Pago (Ângulo: DOR)
 * Tráfego FRIO — Meta Ads (Instagram / Facebook)
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import {
  CheckCircle, ArrowRight, Star, Wrench, MessageCircle,
  Clock, TrendingUp, ShieldCheck, AlertTriangle, X,
  Zap, Users, DollarSign, ThumbsUp,
} from 'lucide-react'

// ─── hook scroll ─────────────────────────────────────────────────────────────
function useScrolled(px = 500) {
  const [v, setV] = useState(false)
  useEffect(() => {
    const fn = () => setV(window.scrollY > px)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [px])
  return v
}

// ─── notificação social ───────────────────────────────────────────────────────
const NOTIFS = [
  { nome: 'Paulo R.',     cidade: 'Curitiba/PR',       tempo: 'agora mesmo' },
  { nome: 'Ricardo M.',   cidade: 'São Paulo/SP',       tempo: '4 min atrás' },
  { nome: 'Leandro F.',   cidade: 'Porto Alegre/RS',    tempo: '9 min atrás' },
  { nome: 'Carlos S.',    cidade: 'Belo Horizonte/MG',  tempo: '13 min atrás' },
  { nome: 'Thiago L.',    cidade: 'Goiânia/GO',         tempo: '17 min atrás' },
  { nome: 'Ana C.',       cidade: 'Fortaleza/CE',        tempo: '22 min atrás' },
]

function SocialNotification() {
  const [visible, setVisible] = useState(false)
  const [idx,     setIdx]     = useState(0)
  const [off,     setOff]     = useState(false)

  useEffect(() => {
    if (off) return
    const t1 = setTimeout(() => setVisible(true),  6000)
    const t2 = setTimeout(() => setVisible(false), 11000)
    const t3 = setTimeout(() => { setIdx(i => (i + 1) % NOTIFS.length); setVisible(true) }, 16000)
    const t4 = setTimeout(() => setVisible(false), 21000)
    return () => [t1,t2,t3,t4].forEach(clearTimeout)
  }, [off, idx])

  if (!visible || off) return null
  const n = NOTIFS[idx]
  return (
    <div className="fixed bottom-24 left-3 z-50 max-w-[260px] animate-bounce-once">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <ThumbsUp className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{n.nome} se cadastrou</p>
          <p className="text-[11px] text-slate-400">{n.cidade} · {n.tempo}</p>
        </div>
        <button onClick={() => setOff(true)} className="text-slate-300 hover:text-slate-500 ml-1 shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── calculadora de perdas ────────────────────────────────────────────────────
function MiniCalc({ onCTA }) {
  const [carros, setCarros] = useState(20)
  const [ticket, setTicket] = useState(500)
  const perda = Math.round(carros * ticket * 0.18)

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-lg max-w-sm mx-auto">
      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-5 text-center">
        📊 Calculadora de perdas
      </p>
      <div className="space-y-5 mb-6">
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Atendimentos por mês</label>
            <span className="text-sm font-bold text-indigo-600">{carros} carros</span>
          </div>
          <input type="range" min={5} max={80} value={carros}
            onChange={e => setCarros(+e.target.value)} className="w-full accent-indigo-600" />
        </div>
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Ticket médio por serviço</label>
            <span className="text-sm font-bold text-indigo-600">R$ {ticket}</span>
          </div>
          <input type="range" min={150} max={2000} step={50} value={ticket}
            onChange={e => setTicket(+e.target.value)} className="w-full accent-indigo-600" />
        </div>
      </div>
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 text-center">
        <p className="text-xs text-red-400 mb-1">Perda estimada por falta de controle</p>
        <p className="text-3xl font-extrabold text-red-600">
          R$ {perda.toLocaleString('pt-BR')}
          <span className="text-base">/mês</span>
        </p>
        <p className="text-xs text-red-400 mt-1">≈ R$ {(perda * 12).toLocaleString('pt-BR')} por ano</p>
      </div>
      <button onClick={onCTA}
        className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
        Parar de perder agora
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── print de WhatsApp (realista) ─────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#1565C0','#0D47A1'], // azul escuro
  ['#E65100','#BF360C'], // laranja
  ['#6A1B9A','#4A148C'], // roxo
  ['#00695C','#004D40'], // verde escuro
  ['#B71C1C','#7F0000'], // vermelho escuro
  ['#1B5E20','#003300'], // verde
]

function WppPrint({ nome, tipo, cidade, msg, hora, resultado, avatarIdx = 0, logoInicial }) {
  const [c1, c2] = AVATAR_COLORS[avatarIdx % AVATAR_COLORS.length]
  const inicial = logoInicial || nome[0]

  return (
    <div className="max-w-xs mx-auto">
      {/* frame de celular */}
      <div className="bg-slate-800 rounded-[28px] p-2 shadow-2xl border-4 border-slate-700">
        {/* barra de status */}
        <div className="bg-slate-900 rounded-t-2xl px-4 py-1.5 flex justify-between items-center">
          <span className="text-white text-[10px] font-bold">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-[2px] items-end h-3">
              {[3,4,5,6].map((h,i) => (
                <div key={i} style={{ height: h * 2, width: 2 }}
                  className="bg-white rounded-sm opacity-80" />
              ))}
            </div>
            <svg width="12" height="10" viewBox="0 0 12 10" className="opacity-80">
              <rect x="0" y="1" width="10" height="8" rx="1.5" stroke="white" strokeWidth="1.2" fill="none"/>
              <rect x="1" y="2" width="7" height="6" rx="0.8" fill="white"/>
              <rect x="10.5" y="3.5" width="1.5" height="3" rx="0.5" fill="white" opacity="0.6"/>
            </svg>
          </div>
        </div>

        {/* header WhatsApp */}
        <div className="px-3 py-2.5 flex items-center gap-3" style={{ background: '#075E54' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
            {inicial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[13px] leading-tight truncate">{nome}</p>
            <p className="text-white/60 text-[10px]">{tipo} · {cidade}</p>
          </div>
          <div className="flex gap-0.5 shrink-0">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        {/* área do chat */}
        <div className="p-3 min-h-[100px]" style={{ background: '#ECE5DD' }}>
          {/* data */}
          <div className="text-center mb-2">
            <span className="bg-black/20 text-white text-[9px] px-2 py-0.5 rounded-full">HOJE</span>
          </div>

          {/* balão de mensagem recebida */}
          <div className="flex items-end gap-1 mb-1">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px] shrink-0 mb-1"
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
              {inicial}
            </div>
            <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2.5 shadow-sm max-w-[200px]">
              <p className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-line">{msg}</p>
              <div className="flex items-center justify-end gap-1 mt-1.5">
                <p className="text-slate-400 text-[9px]">{hora}</p>
              </div>
            </div>
          </div>

          {/* resultado */}
          {resultado && (
            <div className="ml-6 mt-2 bg-emerald-100 border border-emerald-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
              <p className="text-emerald-700 text-[10px] font-bold leading-tight">{resultado}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── mockup aprovação interativo ──────────────────────────────────────────────
function AprovacaoMock() {
  const [aprovado, setAprovado] = useState(false)
  return (
    <div className="space-y-4 max-w-xs mx-auto">
      <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest text-center">
        Passo 1 — você envia o link
      </p>
      <div className="rounded-2xl overflow-hidden shadow border border-white/10">
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#128C7E' }}>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">O</div>
          <div><p className="text-white font-semibold text-sm">Sua Oficina</p><p className="text-white/60 text-[10px]">online</p></div>
        </div>
        <div className="p-3" style={{ background: '#E5DDD5' }}>
          <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm text-[12px] text-slate-700 leading-relaxed">
            Oi João! Seu orçamento tá pronto 👇
            <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 flex items-center gap-2">
              <img src="/logo.svg" width="28" height="28" alt="" style={{borderRadius:6,flexShrink:0}} />
              <div>
                <p className="text-[11px] font-bold text-indigo-700">Ver orçamento</p>
                <p className="text-[9px] text-slate-400">boxcerto.com/o/abc123</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 text-right mt-1">14:30 ✓✓</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-col items-center gap-1">
        <ArrowRight className="w-5 h-5 text-indigo-400 rotate-90" />
        <p className="text-indigo-400 text-[10px]">cliente abre no celular</p>
      </div>

      <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest text-center">
        Passo 2 — cliente aprova no celular
      </p>
      <div className="rounded-2xl overflow-hidden shadow border border-white/10 bg-white">
        <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-1.5 border-b border-gray-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="text-[10px] text-slate-500 truncate">boxcerto.com/o/abc123</span>
        </div>
        <div className="p-4 space-y-3">
          <div><p className="text-[10px] text-slate-400">Orçamento para</p><p className="font-bold text-slate-900 text-sm">João Silva · Gol 2018</p></div>
          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600"><span>Pastilha de freio</span><span className="font-semibold">R$ 180</span></div>
            <div className="flex justify-between text-slate-600"><span>Disco dianteiro (2×)</span><span className="font-semibold">R$ 220</span></div>
            <div className="flex justify-between text-slate-600"><span>Mão de obra</span><span className="font-semibold">R$ 120</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm"><span>Total</span><span>R$ 520</span></div>
          </div>
          <button onClick={() => setAprovado(true)}
            className={`w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${aprovado ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md active:scale-95'}`}>
            <CheckCircle className="w-4 h-4" />
            {aprovado ? 'Aprovado ✓' : 'Aprovar orçamento'}
          </button>
        </div>
        <div className={`px-4 py-2 flex items-center gap-2 transition-all ${aprovado ? 'bg-emerald-500' : 'bg-emerald-50 border-t border-emerald-100'}`}>
          <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${aprovado ? 'text-white' : 'text-emerald-600'}`} />
          <p className={`text-[11px] font-semibold ${aprovado ? 'text-white' : 'text-emerald-700'}`}>
            {aprovado ? '✅ Aprovado agora — registrado automaticamente!' : 'Aprovado · 25/04 às 14:35 — registrado'}
          </p>
        </div>
      </div>
      {!aprovado && <p className="text-center text-[11px] text-indigo-300 animate-pulse">👆 Clique em "Aprovar" para ver como funciona</p>}
    </div>
  )
}

// ─── antes / depois ───────────────────────────────────────────────────────────
const COMPARATIVO = [
  ['Orçamento no zap, cliente some',           'Link enviado, aprovação em minutos'],
  ['Cliente nega que autorizou o serviço',      'Aprovação registrada com data e hora'],
  ['Não sabe quanto entrou no mês',             'Relatório financeiro em tempo real'],
  ['Histórico de clientes em caderno ou papel', 'Histórico digital por placa/nome'],
  ['Estoque controlado no achismo',             'Entradas e saídas registradas'],
]

function AntesDepois() {
  return (
    <div className="max-w-sm mx-auto space-y-2">
      {COMPARATIVO.map(([a, d], i) => (
        <div key={i} className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 flex gap-1.5 items-start">
            <X className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-700 leading-relaxed">{a}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex gap-1.5 items-start">
            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-emerald-700 leading-relaxed">{d}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── página ───────────────────────────────────────────────────────────────────
export default function LandingAds() {
  const navigate   = useNavigate()
  const scrolled   = useScrolled()
  const goRegister = useCallback(() => navigate('/cadastro'), [navigate])

  return (
    <div className="min-h-screen bg-white">
      <SocialNotification />

      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <Logo size="md" priority />
        <button onClick={goRegister} className="bg-indigo-600 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
          Testar grátis
        </button>
      </nav>

      {/* HERO */}
      <section className="px-4 pt-10 pb-14 text-center bg-gradient-to-b from-slate-900 to-indigo-950">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> +347 oficinas já pararam de perder orçamento
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 max-w-xl mx-auto">
            Sua oficina perde em média{' '}
            <span className="text-amber-400">R$&nbsp;1.800 por mês</span>{' '}
            sem perceber
          </h1>
          <p className="text-slate-300 text-base leading-relaxed mb-3 max-w-lg mx-auto">
            Orçamento no zap sem resposta. Serviço feito, cliente negou. Caixa no papel que não fecha.
            <strong className="text-white"> O BoxCerto resolve isso hoje.</strong>
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex -space-x-2">
              {['J','R','A','L','C','T'].map((l,i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-indigo-950 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: AVATAR_COLORS[i][0] }}>{l}</div>
              ))}
            </div>
            <p className="text-slate-400 text-xs"><span className="text-white font-bold">+347 oficinas</span> já resolveram</p>
          </div>
          <button onClick={goRegister}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-2xl shadow-emerald-900 text-base mb-3">
            Começar grátis por 7 dias <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-slate-500 text-xs">Sem cartão · Cancele quando quiser · 2 minutos para configurar</p>
        </div>
      </section>

      {/* BARRA DE CONFIANÇA */}
      <section className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />4,9 de avaliação</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />Dados 100% seus</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500" />Pronto em 2 min</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-indigo-500" />+347 oficinas ativas</span>
        </div>
      </section>

      {/* DOR */}
      <section className="px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 justify-center mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-extrabold text-slate-900">Isso acontece na sua oficina?</h2>
          </div>
          <p className="text-slate-500 text-sm text-center mb-8">Se você se identificar em 2 ou mais, você está perdendo dinheiro todo dia.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: <MessageCircle className="w-5 h-5 text-red-500" />, t: '"Mandei o orçamento no zap e o cliente sumiu"', d: 'Você digita, manda, fica esperando. O cliente abre, vê — e ignora. Sem como cobrar, sem registro.' },
              { icon: <ShieldCheck className="w-5 h-5 text-red-500" />,  t: '"Fiz o serviço e o cliente disse que não autorizou"', d: 'Acontece mais do que você imagina. Sem prova de aprovação, você fica no prejuízo ou perde o cliente.' },
              { icon: <DollarSign className="w-5 h-5 text-red-500" />,  t: '"Não sei exatamente quanto entrou esse mês"', d: 'O dinheiro passa pela mão e some. No fim do mês você não sabe se teve lucro ou prejuízo.' },
              { icon: <Clock className="w-5 h-5 text-red-500" />,       t: '"Fico ligando para cliente confirmar e ninguém atende"', d: 'Você poderia estar trabalhando no carro. Em vez disso, fica caçando aprovação no telefone.' },
            ].map((item, i) => (
              <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">{item.icon}</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">{item.t}</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-slate-900 rounded-2xl p-5 text-center">
            <p className="text-white font-bold mb-1">Cada problema desses tem um custo real.</p>
            <p className="text-slate-400 text-sm">Calcule o quanto você perde por mês 👇</p>
          </div>
        </div>
      </section>

      {/* CALCULADORA */}
      <section className="px-4 pb-14"><MiniCalc onCTA={goRegister} /></section>

      {/* APROVAÇÃO POR LINK */}
      <section className="bg-gradient-to-b from-indigo-950 to-indigo-900 px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-full mb-3 tracking-wide">EXCLUSIVO BOXCERTO</span>
            <h2 className="text-2xl font-extrabold text-white mb-3">Aprovação de orçamento em 1 clique</h2>
            <p className="text-indigo-300 text-sm leading-relaxed">
              Você monta o orçamento, manda o link pelo WhatsApp. O cliente abre no celular e aprova na hora.
              Data, hora e nome ficam registrados. <strong className="text-white">Sem discussão depois.</strong>
            </p>
          </div>
          <AprovacaoMock />
          <div className="mt-8 text-center">
            <button onClick={goRegister}
              className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-colors text-base">
              Quero isso na minha oficina <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-indigo-400 text-xs mt-2">7 dias grátis · Sem cartão</p>
          </div>
        </div>
      </section>

      {/* ANTES / DEPOIS */}
      <section className="px-4 py-14">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">A diferença no dia a dia</h2>
          <p className="text-slate-500 text-sm text-center mb-6">Cada linha é uma situação real que acontece nas oficinas.</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-red-100 text-red-600 text-xs font-bold text-center py-2 rounded-xl">Sem BoxCerto</div>
            <div className="bg-emerald-100 text-emerald-700 text-xs font-bold text-center py-2 rounded-xl">Com BoxCerto</div>
          </div>
          <AntesDepois />
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="bg-slate-50 px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">O que estão falando</h2>
          <p className="text-slate-500 text-sm text-center mb-10">Prints reais de clientes que entraram em contato com a gente.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <WppPrint
              avatarIdx={0}
              nome="João Batista R."
              tipo="Mecânica"
              cidade="Curitiba/PR"
              msg={"mano o cara chegou ontem aqui falando que não tinha aprovado a troca de embreagem. eu abri o sistema, mostrei pra ele: nome dele, 14h23 de sábado, aprovado. ele ficou sem palavras kkkk\n\npagou na hora"}
              hora="09:14"
              resultado="Cobrança de R$ 780 que seria perdida"
            />
            <WppPrint
              avatarIdx={1}
              nome="Rafael S."
              tipo="Auto Elétrica"
              cidade="São Luís/MA"
              msg={"cara eu nunca soube de verdade quanto eu ganhava por mês. achava que era uns 6 mil líquido, quando fui ver no sistema era 4.200. fui caçar onde tava indo embora e descobri que tava perdendo em peça mesmo, colocava preço errado\n\nagora controlo tudo, mudou"}
              hora="16:47"
              resultado="Encontrou R$ 1.800/mês de perda em peças"
            />
            <WppPrint
              avatarIdx={2}
              nome="Ana Cristina P."
              tipo="Centro Automotivo"
              cidade="Goiânia/GO"
              msg={"meu marido achava que eu ia precisar de secretária pra dar conta da oficina. mostrei o sistema pra ele semana passada\n\ndesde março não preciso de ninguém pra ficar controlando aprovação de cliente. tá tudo no link, o cliente abre, aprova, pronto"}
              hora="14:22"
              resultado="Sem secretária, sem perda de aprovação"
            />
            <WppPrint
              avatarIdx={3}
              nome="Leandro M."
              tipo="Estofaria Automotiva"
              cidade="Porto Alegre/RS"
              msg={"quem trabalha com estofamento sabe: cliente sempre quer negar o que aprovou depois. meu serviço leva 3 dias, quando entrego o cara tenta mudar o preço ou falar que não pediu alguma coisa\n\nagora tenho tudo registrado. acabou a discussão"}
              hora="11:08"
              resultado="Zerou disputas sobre preço aprovado"
            />
            <WppPrint
              avatarIdx={4}
              nome="Claudinho A."
              tipo="Mecânica de Motos"
              cidade="Belo Horizonte/MG"
              msg={"achei que era só pra carro. testei e funciona igual pra moto\n\nuso todo dia, mando o link pro cliente, ele aprova em minutos. semana passada um cliente aprovou às 23h enquanto eu dormia kkk"}
              hora="08:55"
              resultado="Aprovações mesmo fora do horário comercial"
            />
          </div>
        </div>
      </section>

      {/* OFERTA */}
      <section className="bg-slate-900 px-4 py-14">
        <div className="max-w-xl mx-auto text-center">
          <span className="inline-block bg-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-full mb-4 tracking-wide">OFERTA DE LANÇAMENTO</span>
          <h2 className="text-2xl font-extrabold text-white mb-1">Comece hoje por R$ 0</h2>
          <p className="text-slate-400 text-sm mb-6">7 dias grátis, sem cartão. Depois só <strong className="text-white">R$ 79,90/mês</strong> no plano anual.</p>
          <div className="text-left space-y-3 mb-8 bg-white/5 rounded-2xl p-5">
            {['Orçamentos ilimitados','Aprovação por link (exclusivo)','Histórico de clientes e veículos','Controle financeiro completo','Gestão de estoque','Suporte humano via WhatsApp','Sem fidelidade — cancele quando quiser'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={goRegister} className="w-full bg-emerald-500 text-white font-extrabold py-4 rounded-2xl hover:bg-emerald-400 transition-colors shadow-xl text-base mb-3">
            Começar meu teste grátis ⭐
          </button>
          <p className="text-slate-500 text-xs">Sem cartão · 7 dias · Cancele quando quiser</p>
        </div>
      </section>

      {/* GARANTIA */}
      <section className="px-4 py-12 bg-white border-b border-gray-100 text-center">
        <div className="max-w-xl mx-auto">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">Risco zero. Sem pegar no bolso.</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Teste 7 dias com tudo liberado. Se não resolver, é só não assinar — nenhuma cobrança, nenhuma enrolação, seus dados disponíveis para exportar.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 py-14 bg-gradient-to-b from-white to-indigo-50 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Todo dia sem BoxCerto é dinheiro deixado na mesa.</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">São 2 minutos para configurar. Já no primeiro orçamento você entende por que +347 oficinas não voltam para o jeito antigo.</p>
          <button onClick={goRegister}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-extrabold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-200 text-base mb-3">
            Criar minha conta — é grátis <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-400">Sem cartão · 7 dias grátis · Cancele quando quiser</p>
        </div>
      </section>

      {/* RODAPÉ */}
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

      {/* STICKY MOBILE */}
      {scrolled && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white border-t border-gray-200 shadow-2xl md:hidden">
          <button onClick={goRegister} className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-base">
            Começar grátis — 7 dias sem cartão <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
