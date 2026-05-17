import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle, Wrench, Clock, TrendingUp, Package } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { usePageView } from '../hooks/usePageView'

// ── Mini mockup do sistema (coluna esquerda no desktop) ──────────────────────
function SystemPreview() {
  return (
    <div className="relative">
      {/* Sombra de fundo */}
      <div className="absolute -inset-4 bg-indigo-600/10 rounded-3xl blur-2xl" />

      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header do app */}
        <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white text-sm font-bold">BoxCerto</span>
          </div>
          <span className="text-white/60 text-xs">Sua oficina</span>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold text-slate-900">Oficina</p>
              <p className="text-xs text-slate-400">8 ordens abertas</p>
            </div>
            <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">+ Nova OS</div>
          </div>

          {[
            { n: 252, nome: 'Carlos Machado', veiculo: 'VW Gol 1.0',    status: 'Em Serviço', cor: 'bg-purple-100 text-purple-700', val: 'R$ 1.240' },
            { n: 251, nome: 'Andréia Lima',   veiculo: 'Fiat Palio 1.4', status: 'Aprovado',   cor: 'bg-blue-100 text-blue-700',   val: 'R$ 785'   },
            { n: 250, nome: 'José Nunes',      veiculo: 'GM Celta 1.0',   status: 'Pronto ✓',  cor: 'bg-emerald-100 text-emerald-700', val: 'R$ 520' },
          ].map(os => (
            <div key={os.n} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${os.cor}`}>{os.status}</span>
                <span className="text-sm font-extrabold text-slate-900">{os.val}</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">{os.nome}</p>
              <p className="text-[10px] text-slate-400">{os.veiculo}</p>
            </div>
          ))}

          {/* Card financeiro */}
          <div className="bg-emerald-600 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-[10px] font-semibold">Lucro do mês</p>
              <p className="text-white font-extrabold text-lg leading-tight">R$ 15.500</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-300" />
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-t border-gray-100 px-4 py-2 flex justify-around">
          {[
            { icon: Wrench, label: 'Oficina', active: true },
            { icon: Clock, label: 'Histórico', active: false },
            { icon: TrendingUp, label: 'Financeiro', active: false },
            { icon: Package, label: 'Estoque', active: false },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-300'}`} />
              <span className={`text-[9px] font-medium ${active ? 'text-indigo-600' : 'text-slate-300'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Register() {
  const { register } = useAuth()
  usePageView('/cadastro')
  const navigate = useNavigate()

  const [form, setForm] = useState({
    responsavel: '', whatsapp: '', oficina: '',
    email: '', password: '', plan: 'annual',
  })
  const [show, setShow]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const formatWpp = (val) => {
    const n = val.replace(/\D/g, '')
    if (n.length <= 2) return n
    if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}`
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('A senha deve ter ao menos 6 caracteres.')
    setLoading(true)
    const result = await register({
      oficina:    form.oficina.trim(),
      responsavel: form.responsavel.trim(),
      whatsapp:   form.whatsapp,
      email:      form.email.trim(),
      password:   form.password,
    })
    setLoading(false)
    if (!result.ok) return setError(result.error)

    // Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'sign_up', { method: 'email' })
      gtag('event', 'conversion', { send_to: 'G-HQNZQ5PHFB' })
    }

    // Meta Ads / dataLayer
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'iniciou_teste_gratis',
      user_name:     form.responsavel.trim(),
      user_whatsapp: '55' + form.whatsapp.replace(/\D/g, ''),
      user_email:    form.email.trim(),
    })

    // Email de boas-vindas (background)
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome',
        to: form.email.trim(),
        nome: form.responsavel.trim(),
        oficina: form.oficina.trim(),
        trialDias: 7,
      }),
    }).catch(() => {})

    navigate(`/bem-vindo?nome=${encodeURIComponent(form.responsavel.trim())}&oficina=${encodeURIComponent(form.oficina.trim())}`)
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

  // ── Formulário (compartilhado mobile/desktop) ─────────────────────────────
  const FormContent = (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 1. Seu nome */}
      <div>
        <label className={labelClass}>Seu nome</label>
        <input name="responsavel" required value={form.responsavel} onChange={handle}
          placeholder="Ex: João Silva"
          className={inputClass} />
      </div>

      {/* 2. WhatsApp */}
      <div>
        <label className={labelClass}>WhatsApp</label>
        <input name="whatsapp" required value={form.whatsapp}
          onChange={(e) => setForm({ ...form, whatsapp: formatWpp(e.target.value) })}
          placeholder="(51) 99999-9999" maxLength={15}
          className={inputClass} />
      </div>

      {/* 3. Nome da oficina */}
      <div>
        <label className={labelClass}>Nome da oficina</label>
        <input name="oficina" required value={form.oficina} onChange={handle}
          placeholder="Ex: Auto Elétrica do João"
          className={inputClass} />
      </div>

      {/* 4. E-mail */}
      <div>
        <label className={labelClass}>E-mail</label>
        <input name="email" type="email" required value={form.email} onChange={handle}
          placeholder="seuemail@exemplo.com"
          className={inputClass} />
      </div>

      {/* 5. Senha */}
      <div>
        <label className={labelClass}>Senha</label>
        <div className="relative">
          <input name="password" type={show ? 'text' : 'password'} required value={form.password}
            onChange={handle} placeholder="Crie uma senha"
            className={`${inputClass} pr-11`} />
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Botão */}
      <button type="submit" disabled={loading}
        className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 text-base shadow-lg shadow-indigo-200 mt-2">
        {loading ? 'Criando sua conta...' : 'Começar meu teste grátis'}
      </button>

      {/* Microcopy abaixo do botão */}
      <p className="text-center text-xs text-slate-400">
        Leva menos de 1 minuto. Não precisa cartão.
      </p>

      {/* Termos — discreto */}
      <p className="text-[11px] text-slate-300 text-center leading-relaxed">
        Ao continuar, você concorda com os{' '}
        <Link to="/termos" target="_blank" className="text-slate-400 hover:text-indigo-500 transition-colors">Termos de Uso</Link>
        {' '}e a{' '}
        <Link to="/privacidade" target="_blank" className="text-slate-400 hover:text-indigo-500 transition-colors">Política de Privacidade</Link>.
      </p>
    </form>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">

      {/* ── MOBILE ────────────────────────────────────────────────── */}
      <div className="lg:hidden flex flex-col items-center px-4 py-10">
        {/* Logo */}
        <Link to="/" className="mb-5">
          <Logo size="md" priority />
        </Link>

        {/* Selo de confiança */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
          7 dias grátis • sem cartão de crédito • acesso imediato
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Comece seu teste grátis</h1>
          <p className="text-slate-500 text-sm mb-5 leading-snug">
            Organize OS, estoque e orçamentos da sua oficina em minutos.
          </p>

          {/* Mini selos */}
          <div className="flex flex-wrap gap-2 mb-5">
            {['Fácil de usar', 'Aprenda em minutos', 'Sem burocracia'].map(t => (
              <span key={t} className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                <CheckCircle className="w-3 h-3 shrink-0" />{t}
              </span>
            ))}
          </div>

          {FormContent}
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Já tem conta?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Entrar</Link>
        </p>
      </div>

      {/* ── DESKTOP: 2 colunas ────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen">

        {/* Coluna esquerda — produto + benefícios */}
        <div className="flex-1 bg-gradient-to-br from-slate-900 to-indigo-950 flex flex-col justify-center px-12 xl:px-20 py-16">
          <Link to="/" className="mb-10 inline-block">
            <Logo size="md" onDark priority />
          </Link>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
            Sua oficina mais<br />
            <span className="text-amber-400">organizada desde</span><br />
            o primeiro dia
          </h1>

          <p className="text-slate-300 text-base mb-8 leading-relaxed max-w-md">
            Chega de papel, planilha e WhatsApp bagunçado. Tudo numa tela só, do celular.
          </p>

          {/* Bullets */}
          <div className="space-y-3 mb-10">
            {[
              'OS digital — do orçamento à entrega',
              'Aprovação de orçamento pelo WhatsApp',
              'Histórico completo de clientes e veículos',
              'Financeiro em tempo real — lucro do mês',
              'Controle de estoque com alertas automáticos',
            ].map(b => (
              <div key={b} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {b}
              </div>
            ))}
          </div>

          {/* Mockup do sistema */}
          <div className="max-w-xs">
            <SystemPreview />
          </div>
        </div>

        {/* Coluna direita — formulário */}
        <div className="w-full max-w-md xl:max-w-lg flex flex-col justify-center px-10 xl:px-16 py-16 bg-white">
          {/* Selo */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 self-start">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
            7 dias grátis • sem cartão • acesso imediato
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 mb-1">Comece seu teste grátis</h2>
          <p className="text-slate-500 text-sm mb-6 leading-snug">
            Organize OS, estoque e orçamentos da sua oficina em minutos.
          </p>

          {/* Mini selos */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['Fácil de usar', 'Aprenda em minutos', 'Sem burocracia'].map(t => (
              <span key={t} className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                <CheckCircle className="w-3 h-3 shrink-0" />{t}
              </span>
            ))}
          </div>

          {FormContent}

          <p className="mt-6 text-sm text-slate-500">
            Já tem conta?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
