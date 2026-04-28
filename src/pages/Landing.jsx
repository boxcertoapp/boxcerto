import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, hasAccess } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import {
  Wrench, CheckCircle, ChevronDown, ChevronUp,
  MessageCircle, TrendingUp, Clock, Search,
  Star, ArrowRight, Zap, Shield, X,
  FileText, Users, Package, Monitor, Check,
  LogIn
} from 'lucide-react'

const WPP = 'https://wa.me/5553997065725?text=Ol%C3%A1%2C%20tenho%20d%C3%BAvidas%20sobre%20o%20BoxCerto!'

const SEGMENTOS = [
  { emoji: '🔧', label: 'Mecânica Geral' },
  { emoji: '🎨', label: 'Funilaria e Pintura' },
  { emoji: '⚡', label: 'Auto Elétrica' },
  { emoji: '❄️', label: 'Ar Condicionado Auto' },
  { emoji: '🏍️', label: 'Mecânica de Motos' },
]

// ── WhatsApp-style testimonial ─────────────────────────────────
const AVATAR_GRAD = [
  ['#1565C0','#0D47A1'],
  ['#6A1B9A','#4A148C'],
  ['#B71C1C','#7F0000'],
]
function WppCard({ nome, tipo, cidade, mensagem, hora, gradIdx = 0 }) {
  const [c1, c2] = AVATAR_GRAD[gradIdx % AVATAR_GRAD.length]
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      {/* header escuro (estilo WPP Business) */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#075E54' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
          <span className="text-white font-bold text-sm">{nome[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{nome}</p>
          <p className="text-white/60 text-xs truncate">{tipo} · {cidade}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
        </div>
      </div>
      {/* chat */}
      <div className="p-4" style={{ background: '#E5DDD5' }}>
        <div className="text-center mb-3">
          <span className="bg-black/15 text-white text-[9px] px-2 py-0.5 rounded-full">HOJE</span>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5"
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
            <span className="text-white font-bold text-[9px]">{nome[0]}</span>
          </div>
          <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 max-w-[88%] shadow-sm">
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">{mensagem}</p>
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400">{hora}</span>
              <span className="text-slate-400 text-[10px]">✓✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Loss Calculator ────────────────────────────────────────────
function Calculadora({ onCTA }) {
  const [carros, setCarros] = useState(25)
  const [ticket, setTicket] = useState(600)
  const perda = Math.round(carros * ticket * 0.18)

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-3xl mx-auto px-5">
        <div className="text-center mb-10">
          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-3">Calculadora de Perda</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Quanto a bagunça custa para sua oficina?</h2>
          <p className="text-slate-400 max-w-lg mx-auto">Orçamentos que somem, clientes que não voltam, lucro que você não mede. Isso tem um preço.</p>
        </div>
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-3">
                Carros atendidos por mês: <span className="text-indigo-400 text-lg font-bold">{carros}</span>
              </label>
              <input type="range" min="5" max="120" value={carros}
                onChange={e => setCarros(+e.target.value)}
                className="w-full h-2 rounded-full accent-indigo-500 cursor-pointer" />
              <div className="flex justify-between text-xs text-slate-600 mt-1"><span>5</span><span>120</span></div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-3">
                Ticket médio por carro: <span className="text-indigo-400 text-lg font-bold">R$ {ticket}</span>
              </label>
              <input type="range" min="150" max="3000" step="50" value={ticket}
                onChange={e => setTicket(+e.target.value)}
                className="w-full h-2 rounded-full accent-indigo-500 cursor-pointer" />
              <div className="flex justify-between text-xs text-slate-600 mt-1"><span>R$150</span><span>R$3.000</span></div>
            </div>
          </div>

          <div className="rounded-2xl p-6 text-center mb-6 border border-red-700/40" style={{ background: 'rgba(127,29,29,0.25)' }}>
            <p className="text-slate-400 text-sm mb-1">Estimativa de perda mensal por falta de controle</p>
            <p className="text-5xl font-bold text-red-400 my-2">R$&nbsp;{perda.toLocaleString('pt-BR')}</p>
            <p className="text-slate-500 text-xs">Orçamentos perdidos + clientes sem retorno + lucro que você não enxerga</p>
          </div>

          <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-center">
            <p className="text-slate-300 text-sm">
              O BoxCerto custa <span className="text-white font-bold">R$47,90/mês</span>.
              Com apenas <span className="text-indigo-400 font-bold">1 cliente recuperado</span> você já paga o ano inteiro.
            </p>
          </div>

          <button onClick={onCTA}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 text-lg">
            Quero parar de perder esse dinheiro <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Main Landing ───────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [faqOpen, setFaqOpen] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [showSticky, setShowSticky] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (user.isAdmin) { navigate('/admin', { replace: true }); return }
    if (hasAccess(user)) { navigate('/app/oficina', { replace: true }); return }
    if (user.status === 'inactive') { navigate('/renovar', { replace: true }); return }
    navigate('/pendente', { replace: true })
  }, [user, loading, navigate])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      setShowSticky(window.scrollY > 600)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goRegister = () => navigate('/cadastro')

  const faqs = [
    { q: 'Preciso instalar algum programa?', a: 'Não. O BoxCerto funciona direto no navegador — no celular, no tablet ou no computador. Só entrar e usar. Sem instalação, sem complicação.' },
    { q: 'Funciona para quem trabalha sozinho?', a: 'Foi feito exatamente para isso. Um mecânico solo consegue usar sem treinamento nenhum. Se você sabe usar o WhatsApp, sabe usar o BoxCerto.' },
    { q: 'Funciona para pintura, auto elétrica, ar condicionado e moto?', a: 'Sim. O BoxCerto foi pensado para qualquer negócio automotivo — mecânica geral, funilaria e pintura, auto elétrica, ar condicionado automotivo e mecânica de motos. Qualquer operação que receba veículo, faça serviço e precise de aprovação do cliente.' },
    { q: 'É muito caro para uma oficina pequena?', a: 'R$47,90 por mês é menos do que uma hora de mão de obra. Se você recuperar 1 cliente por mês ou deixar de perder 1 orçamento por semana, o sistema já se pagou — e sobra dinheiro.' },
    { q: 'Já uso planilha, por que mudar?', a: 'Planilha não avisa quando peça está acabando, não envia WhatsApp ao cliente, não registra aprovação de orçamento com data e hora, não mostra o lucro real separando custo de peça. O BoxCerto faz tudo isso — e roda no celular.' },
    { q: 'O BoxCerto emite nota fiscal?', a: 'Não, e é uma escolha intencional. O BoxCerto é desenhado para ser leve, rápido e sem burocracia. Sistemas fiscais adicionam complexidade e custo que a maioria das oficinas pequenas não precisa no dia a dia. Foco total na sua operação — do orçamento à entrega.' },
    { q: 'Meus dados ficam seguros?', a: 'Sim. Todos os dados ficam em servidores seguros e protegidos. Nenhuma informação sua ou dos seus clientes é compartilhada com ninguém.' },
    { q: 'O que acontece depois dos 7 dias grátis?', a: 'Você escolhe um plano e continua usando. Se não quiser assinar, pode sair sem custo algum. Não pedimos cartão para começar.' },
    { q: 'Posso cancelar quando quiser?', a: 'No plano mensal, sim — cancela a qualquer momento sem multa, sem burocracia, em 1 clique. No anual, você trava o menor preço pelo ano todo.' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ──────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo iconOnly size="md" />
            <span className={`font-bold text-lg transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>BoxCerto</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Entrar — sempre visível, importante para usuários recorrentes */}
            <button onClick={() => navigate('/login')}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
                scrolled
                  ? 'border-gray-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 bg-white'
                  : 'border-white/30 text-white/90 hover:text-white hover:border-white/60'
              }`}>
              <LogIn className="w-4 h-4" />
              Entrar
            </button>
            <button onClick={goRegister}
              className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-500 transition-all shadow-sm">
              Testar grátis
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative bg-slate-900 pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-0 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Zap className="w-4 h-4" />
            7 dias grátis &middot; Sem cartão de crédito &middot; Cancele quando quiser
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6 max-w-4xl mx-auto">
            Pare de perder orçamentos<br />
            <span className="text-indigo-400">no WhatsApp.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Crie orçamentos profissionais, envie um link para o cliente aprovar pelo celular
            e receba a confirmação com data e hora registradas. Simples, rápido e feito para qualquer oficina automotiva.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button onClick={goRegister}
              className="w-full sm:w-auto bg-indigo-600 text-white text-lg font-bold px-8 py-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2 group">
              Testar grátis por 7 dias — sem cartão
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/login')}
              className="w-full sm:w-auto text-slate-400 hover:text-white text-base font-medium px-6 py-4 rounded-2xl border border-slate-700 hover:border-slate-500 transition-all flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /> Já tenho conta
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-16">
            <div className="flex -space-x-2">
              {['C','A','M','J','R'].map((l,i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white ${['bg-indigo-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-violet-500'][i]}`}>{l}</div>
              ))}
            </div>
            <p className="text-slate-400 text-sm ml-1">
              <span className="text-white font-bold">+347 oficinas</span> já usam o BoxCerto
            </p>
          </div>

          {/* Phone mockup */}
          <div className="max-w-xs mx-auto relative">
            <div className="absolute -inset-6 bg-indigo-600/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl border border-slate-700">
              <div className="bg-gray-50 rounded-[2rem] overflow-hidden">
                <div className="bg-white h-6 flex items-center justify-center">
                  <div className="w-20 h-3 bg-gray-200 rounded-full" />
                </div>
                <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img src="/logo.svg" width="20" height="20" alt="" loading="lazy" decoding="async" style={{borderRadius:4}} />
                    <span className="text-xs font-bold text-slate-900">BoxCerto</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Oficina do José</span>
                </div>
                <div className="bg-gray-50 px-3 py-2 grid grid-cols-3 gap-1.5">
                  <div className="bg-amber-50 rounded-xl p-2 text-center border border-amber-100">
                    <p className="text-[14px] font-bold text-amber-600">3</p>
                    <p className="text-[8px] text-amber-500 font-medium">Orçamentos</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                    <p className="text-[14px] font-bold text-blue-600">7</p>
                    <p className="text-[8px] text-blue-500 font-medium">Em serviço</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-2 text-center border border-green-100">
                    <p className="text-[14px] font-bold text-green-600">4</p>
                    <p className="text-[8px] text-green-500 font-medium">Prontos</p>
                  </div>
                </div>
                <div className="p-2 space-y-2 bg-gray-50">
                  {[
                    { placa: 'RST-2F45', modelo: 'Ford Ranger',  cliente: 'Carlos M.',  status: 'Pronto',       sc: 'bg-green-100 text-green-700' },
                    { placa: 'ABC-1D23', modelo: 'Fiat Strada',  cliente: 'Ana Paula',  status: 'Aguard. apr.', sc: 'bg-amber-100 text-amber-700' },
                    { placa: 'XYZ-8G90', modelo: 'VW Gol',       cliente: 'Roberto S.', status: 'Em serviço',   sc: 'bg-blue-100 text-blue-700' },
                  ].map((c, i) => (
                    <div key={i} className="bg-white rounded-xl p-2.5 flex items-center gap-2 shadow-sm border border-gray-100">
                      <div className="bg-slate-800 px-1.5 py-1 rounded-md min-w-[52px] text-center">
                        <span className="text-white text-[9px] font-bold tracking-wider">{c.placa}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate">{c.modelo}</p>
                        <p className="text-[9px] text-slate-400 truncate">{c.cliente}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${c.sc}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white border-t border-gray-100 flex justify-around py-2">
                  {[
                    { icon: Wrench, label: 'Oficina', a: true },
                    { icon: Clock, label: 'Histórico', a: false },
                    { icon: TrendingUp, label: 'Financeiro', a: false },
                    { icon: Package, label: 'Estoque', a: false },
                    { icon: Users, label: 'Menu', a: false },
                  ].map((t, i) => (
                    <div key={i} className={`flex flex-col items-center gap-0.5 ${t.a ? 'text-indigo-600' : 'text-gray-300'}`}>
                      <t.icon className="w-3 h-3" />
                      <span className="text-[7px] font-medium">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-8">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 20C1200 70 800 0 0 60L0 80Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ─────────────────────────── */}
      <section className="bg-gray-50 py-10 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center text-slate-400 text-xs font-semibold uppercase tracking-widest mb-6">Funciona para qualquer tipo de oficina automotiva</p>
          <div className="flex flex-wrap justify-center gap-3">
            {SEGMENTOS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                <span className="text-lg">{s.emoji}</span>
                <span className="text-sm font-semibold text-slate-700">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APROVAÇÃO POR LINK — DIFERENCIAL #1 ──────── */}
      <section className="py-20 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" /> Diferencial exclusivo
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
                Dê adeus ao<br />"não autorizei esse serviço."
              </h2>
              <p className="text-indigo-200 text-lg mb-6 leading-relaxed">
                Você envia o orçamento por um <strong className="text-white">link exclusivo no WhatsApp</strong>. O cliente abre no navegador, vê o detalhamento completo e clica em <strong className="text-white">Aprovar</strong>. O BoxCerto registra a aprovação com <strong className="text-white">data e hora</strong> — segurança jurídica para você e agilidade para o cliente.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Link único por orçamento — não pode ser editado depois',
                  'Cliente aprova no navegador, sem precisar ter o app',
                  'Data e hora do aceite registradas automaticamente',
                  'OS entra em execução assim que o cliente aprova',
                  'Fim do "pode fazer" perdido no WhatsApp',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
                    <span className="text-indigo-100 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={goRegister}
                className="bg-white text-indigo-600 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all inline-flex items-center gap-2 shadow-xl">
                Quero aprovar orçamentos assim <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Visual: WPP link → browser page */}
            <div className="flex flex-col items-center gap-4">

              {/* Passo 1: WPP com link */}
              <div className="w-full max-w-sm">
                <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2 text-center">1. Você envia o link pelo WhatsApp</p>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-white/10">
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#075E54' }}>
                    <div className="w-7 h-7 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
                      <span className="text-emerald-900 font-bold text-xs">C</span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">Carlos Mendonça</p>
                      <p className="text-emerald-300 text-[10px]">online</p>
                    </div>
                  </div>
                  <div className="p-3" style={{ background: '#E5DDD5' }}>
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-tr-none px-3 py-2 max-w-[85%] shadow-sm" style={{ background: '#DCF8C6' }}>
                        <p className="text-slate-700 text-xs mb-1.5">Olá Carlos! Segue o orçamento do seu Ranger 👇</p>
                        {/* Link preview */}
                        <div className="bg-white rounded-xl overflow-hidden border border-green-200">
                          <div className="bg-indigo-600 px-3 py-2 flex items-center gap-2">
                            <img src="/logo.svg" width="18" height="18" alt="" loading="lazy" decoding="async" style={{borderRadius:3}} />
                            <span className="text-white text-[10px] font-bold">BoxCerto</span>
                          </div>
                          <div className="px-3 py-2">
                            <p className="text-slate-800 text-[10px] font-bold">Orçamento #0042 — Ford Ranger</p>
                            <p className="text-slate-500 text-[9px]">boxcerto.com/o/abc123 · Toque para ver</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-1.5">
                          <span className="text-[9px] text-slate-500">14:32</span>
                          <span className="text-blue-500 text-[10px] font-black">✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seta */}
              <div className="text-indigo-300 text-2xl">↓</div>

              {/* Passo 2: Tela do navegador */}
              <div className="w-full max-w-sm">
                <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2 text-center">2. Cliente abre e aprova no navegador</p>
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-white/10">
                  {/* Browser bar */}
                  <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white rounded-md px-2 py-0.5 text-[9px] text-slate-400 border border-gray-200">
                      boxcerto.com/o/abc123
                    </div>
                  </div>
                  {/* Orçamento page */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <img src="/logo.svg" width="24" height="24" alt="" loading="lazy" decoding="async" style={{borderRadius:5}} />
                      <span className="text-xs font-bold text-slate-900">Orçamento #0042</span>
                      <span className="ml-auto text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Aguard. aprovação</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Troca de pastilhas</span>
                        <span className="text-slate-800 font-semibold">R$280</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Fluido de freio</span>
                        <span className="text-slate-800 font-semibold">R$80</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Mão de obra</span>
                        <span className="text-slate-800 font-semibold">R$120</span>
                      </div>
                      <div className="border-t border-gray-200 pt-1.5 flex justify-between text-[10px]">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="font-bold text-slate-900">R$480,00</span>
                      </div>
                    </div>
                    <button className="w-full bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Aprovar Orçamento
                    </button>
                    <p className="text-[9px] text-slate-400 text-center mt-2">Ao aprovar, você autoriza a execução do serviço</p>
                  </div>
                </div>
              </div>

              {/* Confirmação */}
              <div className="w-full max-w-sm bg-emerald-500 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold">Aprovado! Oficina notificada.</p>
                  <p className="text-emerald-100 text-[10px]">Registrado em 25/04/2025 às 14:35 — OS em execução</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DORES ────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-red-500 font-semibold text-sm uppercase tracking-wider mb-3">A realidade de quem não usa</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Reconhece alguma dessas situações?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Cada uma dessas situações representa dinheiro saindo do seu bolso toda semana.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { e: '📋', d: '"Onde foi que eu anotei o telefone desse cliente?"', t: 'Papéis perdidos, cadernos rasurados, post-it que some. Você perde tempo toda semana procurando informação que deveria estar na ponta dos dedos.' },
              { e: '📞', d: '"Meu carro tá pronto?" — 3 vezes por dia.', t: 'Cliente ligando, você parando o serviço pra atender. Com o BoxCerto, você manda o status pelo WhatsApp em 1 toque — e o cliente para de ligar.' },
              { e: '💸', d: 'Trabalhou o mês todo e não sabe quanto lucrou.', t: 'Recebeu dinheiro, pagou peça, pagou conta — mas no final, sobrou quanto? Sem separar custo de peça do valor cobrado, você pode estar trabalhando de graça.' },
              { e: '🔧', d: '"Esse carro já veio aqui antes?" Não lembro.', t: 'Cliente volta e você não tem o histórico. Não sabe o que foi feito, quanto cobrou, quais peças usou. Cada atendimento recomeça do zero.' },
              { e: '📄', d: '"Pode fazer" no WhatsApp — cliente sumiu.', t: 'Você mandou o orçamento por mensagem, o cliente não respondeu. Dias depois, o carro foi para o concorrente. Com o BoxCerto, o cliente aprova por link com 1 clique.' },
              { e: '📦', d: '"Acabou a peça? Mas eu pedi semana passada..."', t: 'Sem controle de estoque, você descobre que a peça acabou na hora que o cliente está esperando. O BoxCerto desconta automaticamente e avisa antes de acabar.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all group">
                <span className="text-3xl shrink-0 mt-0.5">{item.e}</span>
                <div>
                  <p className="font-bold text-slate-900 mb-1.5 group-hover:text-red-700 transition-colors">"{item.d}"</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.t}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-slate-400 text-sm mb-4">Se você se identificou com qualquer um desses, o BoxCerto é para você.</p>
            <button onClick={goRegister}
              className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-lg">
              Quero resolver isso agora <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FLUXO BOXCERTO ───────────────────────────── */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Como funciona</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">O Fluxo BoxCerto</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Da entrada do carro até a entrega, cada etapa organizada — no celular, no tablet ou no computador.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { n: '1', emoji: '🚗', title: 'Entrada', desc: 'Cadastra o veículo em segundos — placa, modelo, KM, observações.' },
              { n: '2', emoji: '📝', title: 'Orçamento', desc: 'Monte com peças, mão de obra, garantia e desconto. PDF automático.' },
              { n: '3', emoji: '✅', title: 'Aprovação', desc: 'Link no WhatsApp → cliente abre no navegador → aprova com 1 clique.', destaque: true },
              { n: '4', emoji: '⚙️', title: 'Execução', desc: 'Equipe executa com status claro. Todo mundo sabe o que está acontecendo.' },
              { n: '5', emoji: '🏁', title: 'Entrega', desc: 'Histórico registrado, financeiro atualizado, recibo em PDF.' },
            ].map((step, i) => (
              <div key={i} className={`relative flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all ${step.destaque ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-gray-100 bg-white'}`}>
                {step.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    ⭐ DIFERENCIAL
                  </div>
                )}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black mb-3 ${step.destaque ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-slate-600'}`}>
                  {step.n}
                </div>
                <span className="text-2xl mb-2">{step.emoji}</span>
                <p className={`font-bold mb-1.5 text-sm ${step.destaque ? 'text-indigo-800' : 'text-slate-900'}`}>{step.title}</p>
                <p className={`text-xs leading-relaxed ${step.destaque ? 'text-indigo-600' : 'text-slate-500'}`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANTES / DEPOIS ───────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">A transformação</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Antes e depois do BoxCerto</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Sem BoxCerto</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Orçamento perdido no WhatsApp',
                  '"Pode fazer" sem registro formal',
                  'Cliente ligando sem parar',
                  'Carro parado sem responsável',
                  'Controle em papel ou planilha',
                  'Lucro calculado "no olho"',
                  'Histórico do cliente inexistente',
                  'Peça acaba sem aviso',
                  'Recibo escrito à mão',
                  'Financeiro impossível de entender',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-red-600" />
                    </div>
                    <span className="text-slate-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Com BoxCerto</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Link de orçamento enviado pelo WhatsApp',
                  'Cliente aprova no navegador — data e hora registradas',
                  'Status automático no WhatsApp — cliente para de ligar',
                  'Todo carro com responsável e prazo',
                  'Tudo no celular, tablet ou computador',
                  'Lucro real separando custo de peça',
                  'Histórico completo de qualquer cliente',
                  'Alerta de estoque baixo automático',
                  'Recibo em PDF em 1 toque',
                  'Financeiro claro no fim de cada mês',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-700" />
                    </div>
                    <span className="text-slate-700 text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 text-center">
            <button onClick={goRegister}
              className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-lg">
              Quero a versão "Com BoxCerto" <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── MÓDULOS ──────────────────────────────────── */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-3">Módulos do sistema</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tudo que sua oficina precisa. Nada que não precisa.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Sem menus complicados. Sem treinamento. 5 abas — no celular, no tablet ou no computador.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Wrench className="w-6 h-6 text-white" />, bg: 'bg-indigo-600', title: 'Oficina — Visão em tempo real', desc: 'Dashboard com todos os carros. Placa, modelo, cliente e status por cor. Um toque para WhatsApp com o status atualizado.', items: ['Dashboard por cores: orçamento, serviço, pronto', 'Agendamento e KM do veículo', 'WhatsApp automático com 1 toque'] },
              { icon: <Search className="w-6 h-6 text-white" />, bg: 'bg-violet-600', title: 'Histórico — Memória eterna', desc: 'Busque qualquer cliente ou placa e veja tudo que já foi feito. Nunca mais perca o histórico, mesmo que o cliente volte anos depois.', items: ['Busca por placa, nome ou CPF', 'Linha do tempo de todas as OS', 'Lista completa de clientes e veículos'] },
              { icon: <TrendingUp className="w-6 h-6 text-white" />, bg: 'bg-emerald-600', title: 'Financeiro — Lucro real', desc: 'Veja quanto entrou, quanto custou e quanto você realmente lucrou. O custo de peça fica invisível para o cliente — só você vê.', items: ['Lucro líquido do mês em destaque', 'Custo de peça separado do valor cobrado', 'Controle de despesas fixas'] },
              { icon: <FileText className="w-6 h-6 text-white" />, bg: 'bg-amber-500', title: 'Orçamento — Profissional em PDF', desc: 'Monte item por item com desconto, garantia por peça e recibo de pagamento. Envie o link de aprovação pelo WhatsApp.', items: ['PDF profissional com logo da sua oficina', 'Link exclusivo para aprovação do cliente', 'Aprovação com registro de data e hora'] },
              { icon: <Package className="w-6 h-6 text-white" />, bg: 'bg-rose-500', title: 'Estoque — Chega de peça faltando', desc: 'Cadastre suas peças e o app desconta automaticamente ao usar na OS. Alerta de estoque baixo antes de acabar na hora errada.', items: ['Baixa automática ao usar no orçamento', 'Alerta de estoque baixo configurável', 'Relatório imprimível em 1 toque'] },
            ].map((f, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-slate-500 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center shrink-0`}>{f.icon}</div>
                  <p className="text-white font-bold text-sm leading-tight">{f.title}</p>
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{f.desc}</p>
                <ul className="space-y-2">
                  {f.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS (WHATSAPP STYLE) ─────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Quem usa</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Quem usa, não volta ao papel.</h2>
            <p className="text-slate-500">Mensagens reais de clientes BoxCerto</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <WppCard
              gradIdx={0}
              nome="João Batista R."
              tipo="Mecânica Geral"
              cidade="Curitiba, PR"
              hora="09:14"
              mensagem={"cara o sistema me salvou semana passada\n\ncliente chegou aqui falando que não tinha autorizado a troca de embreagem. abri o boxcerto, mostrei pra ele: nome dele, data, horário. ele ficou sem palavras e pagou na hora kkkk"}
            />
            <WppCard
              gradIdx={1}
              nome="Adriana F."
              tipo="Auto Elétrica"
              cidade="Goiânia, GO"
              hora="14:22"
              mensagem={"trabalho sozinha e ficava quase 1h por dia atendendo telefone de 'meu carro tá pronto?'\n\nagora mando o link com o status em 5 segundos e volto pro serviço. mudou meu dia completamente ⚡"}
            />
            <WppCard
              gradIdx={2}
              nome="Paulo R."
              tipo="Ar Condicionado Auto"
              cidade="São Paulo, SP"
              hora="18:05"
              mensagem={"descobri que tava lucrando 30% menos do que achava porque não separava custo de peça do valor cobrado\n\no financeiro do sistema mostrou exatamente onde o dinheiro tava indo. agora sei o que ganho em cada carro"}
            />
          </div>
          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4">
              <div className="flex -space-x-1.5">
                {['C','A','M','J','R','P','L'].map((l,i) => (
                  <div key={i} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${['bg-indigo-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-violet-500','bg-blue-500','bg-orange-500'][i]}`}>{l}</div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 text-xs font-medium">+347 oficinas avaliaram 5 estrelas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALCULADORA ──────────────────────────────── */}
      <Calculadora onCTA={goRegister} />

      {/* ── PREÇOS ───────────────────────────────────── */}
      <section id="precos" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Preços</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">R$1,60 por dia. Menos que um café.</h2>
            <p className="text-slate-500 max-w-xl mx-auto mb-3">Comece grátis por 7 dias. Sem cartão. Sem compromisso.</p>
            <p className="text-slate-400 text-sm italic">Recupere 1 cliente por mês e já se paga — o resto é lucro puro.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Mensal */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Plano Mensal</h3>
              <p className="text-slate-400 text-sm mb-6">Flexibilidade total, cancele quando quiser</p>
              <div className="flex items-end gap-1 mb-8">
                <span className="text-5xl font-bold text-slate-900">R$47,90</span>
                <span className="text-slate-400 mb-1.5">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'OS ilimitadas',
                  'Clientes e veículos ilimitados',
                  'Aprovação de orçamento por link',
                  'WhatsApp automático',
                  'Histórico completo',
                  'Controle financeiro',
                  'Estoque com alerta automático',
                  'Acesso em qualquer dispositivo',
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="text-slate-600 text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <button onClick={goRegister}
                className="w-full border-2 border-indigo-600 text-indigo-600 font-bold py-3.5 rounded-2xl hover:bg-indigo-50 transition-colors">
                Testar 7 dias grátis
              </button>
            </div>

            {/* Anual — botão verde para guiar o olho */}
            <div className="bg-indigo-600 rounded-3xl p-8 relative flex flex-col shadow-xl shadow-indigo-200">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-black px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm">
                ⭐ MAIS POPULAR — ECONOMIZE R$156/ANO
              </div>
              <h3 className="text-lg font-bold text-white mb-1 mt-2">Plano Anual</h3>
              <p className="text-indigo-200 text-sm mb-2">Pague uma vez, use o ano todo</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-bold text-white">R$34,90</span>
                <span className="text-indigo-200 mb-1.5">/mês</span>
              </div>
              <p className="text-indigo-300 text-sm mt-1 mb-6">Cobrado R$418,80 uma vez por ano</p>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Tudo do plano mensal',
                  'Prioridade no suporte',
                  'Acesso antecipado a novidades',
                  'Menor preço garantido',
                  '7 dias grátis para testar',
                  'Garantia de reembolso',
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-200 shrink-0" />
                    <span className="text-white text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              {/* Verde para destacar visualmente como a melhor escolha */}
              <button onClick={goRegister}
                className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-400 transition-colors shadow-lg text-base">
                Testar 7 dias grátis — melhor oferta ⭐
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-slate-400">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Pagamento 100% seguro</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 7 dias grátis, sem cartão</div>
            <div className="flex items-center gap-2"><X className="w-4 h-4" /> Cancele em 1 clique</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Dados protegidos pela LGPD</div>
          </div>

          {/* Guarantee */}
          <div className="mt-10 bg-white border-2 border-emerald-200 rounded-3xl p-6 max-w-xl mx-auto text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Teste Grátis por 7 Dias — Cancelamento em 1 Clique</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Comece sem cartão de crédito. Se não gostar dentro dos 7 dias, é só sair — sem custo, sem burocracia, sem nenhuma pergunta.
            </p>
          </div>

          <div className="text-center mt-8">
            <p className="text-slate-400 text-sm mb-2">Ainda com dúvida? Fale agora com um especialista em oficinas.</p>
            <a href={WPP} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm hover:text-emerald-700 transition-colors">
              <MessageCircle className="w-4 h-4" />
              Conversar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Perguntas frequentes</h2>
            <p className="text-slate-500">Tudo que você precisa saber antes de começar.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                  {faqOpen === i
                    ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  }
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 text-slate-500 leading-relaxed text-sm border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative max-w-3xl mx-auto px-5 text-center">
          <p className="text-indigo-300 font-semibold text-sm uppercase tracking-wider mb-4">Está esperando o quê?</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Organize sua oficina e aprove<br />orçamentos mais rápido.
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Teste o BoxCerto grátis por 7 dias e veja como fica o fluxo da sua oficina — sem caderno, sem planilha e sem orçamento perdido no WhatsApp.
          </p>
          <button onClick={goRegister}
            className="bg-white text-indigo-600 font-bold text-lg px-10 py-5 rounded-2xl hover:bg-indigo-50 transition-all inline-flex items-center gap-3 shadow-xl group mb-6">
            Começar teste grátis — 7 dias sem cartão
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-indigo-300 text-sm">
            Sem cartão &middot; Cancele em 1 clique &middot; +347 oficinas já usam
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo iconOnly size="sm" />
            <span className="font-bold text-white">BoxCerto</span>
            <span className="text-slate-600 text-xs">Gestão de Oficina</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-slate-400 text-sm">
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" /> Entrar na conta
            </button>
            <button onClick={goRegister} className="hover:text-white transition-colors">Cadastrar</button>
            <a href={WPP} target="_blank" rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> Ainda com dúvida? Fale com a gente
            </a>
            <a href="mailto:contato@boxcerto.com" className="hover:text-white transition-colors">contato@boxcerto.com</a>
          </div>
          <p className="text-slate-600 text-sm">&copy; 2025 BoxCerto</p>
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA ────────────────────────── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 md:hidden ${showSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="bg-white border-t border-gray-200 px-4 py-3 shadow-2xl flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-slate-500">7 dias grátis, sem cartão</p>
            <p className="text-sm font-bold text-slate-900">Comece a organizar sua oficina agora</p>
          </div>
          <button onClick={goRegister}
            className="bg-indigo-600 text-white text-sm font-bold px-5 py-3 rounded-xl hover:bg-indigo-700 transition-colors shrink-0 flex items-center gap-1.5">
            Testar grátis <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  )
}
