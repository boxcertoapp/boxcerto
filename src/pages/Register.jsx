import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle, Wrench, Clock, TrendingUp, Package } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { usePageView } from '../hooks/usePageView'
import { supabase } from '../lib/supabase'

// Eventos que também gravamos no Supabase para o painel admin
const DB_EVENTS = new Set([
  'cadastro_view', 'cadastro_form_start', 'cadastro_submit_click',
  'cadastro_signup_success', 'cadastro_signup_error', 'cadastro_validation_error',
])

// ── Analytics ────────────────────────────────────────────────────────────────
function track(name, params = {}) {
  try {
    const sp = new URLSearchParams(window.location.search)
    const base = {
      origem:       sp.get('origem')       || 'direto',
      utm_source:   sp.get('utm_source')   || '',
      utm_campaign: sp.get('utm_campaign') || '',
      utm_content:  sp.get('utm_content')  || '',
      device: window.innerWidth < 768 ? 'mobile' : 'desktop',
    }
    if (typeof gtag === 'function') gtag('event', name, { ...base, ...params })
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: name, ...base, ...params })

    // Grava no Supabase para o painel de análise de cadastro
    if (DB_EVENTS.has(name)) {
      supabase.from('cadastro_events').insert({
        event_name:   name,
        origem:       base.origem       || null,
        utm_source:   base.utm_source   || null,
        utm_campaign: base.utm_campaign || null,
        utm_content:  base.utm_content  || null,
        device:       base.device,
        error_type:   params.error_type  || null,
        error_field:  params.error_field || null,
        fields_count: params.campos_preenchidos ?? null,
      }).then(() => {}).catch(() => {})
    }
  } catch {}
}

// ── Erros humanizados ────────────────────────────────────────────────────────
function humanizeError(raw = '') {
  const e = raw.toLowerCase()
  if (e.includes('already registered') || e.includes('already exists') || e.includes('email already') || e.includes('already in use'))
    return 'Esse e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.'
  if (e.includes('invalid email'))
    return 'E-mail inválido. Verifique e tente novamente.'
  if (e.includes('weak password') || e.includes('password'))
    return 'A senha deve ter ao menos 6 caracteres.'
  if (e.includes('network') || e.includes('fetch') || e.includes('failed'))
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  if (e.includes('rate limit') || e.includes('too many'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  return raw || 'Algo deu errado. Tente novamente ou fale com o suporte.'
}

// ── Mockup visual ────────────────────────────────────────────────────────────
function SystemPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 bg-indigo-500/10 rounded-3xl blur-xl" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* App header */}
        <div className="bg-indigo-600 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
              <Wrench className="w-3 h-3 text-white" />
            </div>
            <span className="text-white text-xs font-bold">BoxCerto</span>
          </div>
          <span className="text-white/50 text-[10px]">Sua oficina</span>
        </div>
        {/* Content */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-900">Oficina</p>
              <p className="text-[9px] text-slate-400">8 ordens abertas</p>
            </div>
            <div className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-1 rounded-md">+ Nova OS</div>
          </div>
          {[
            { n: 52, nome: 'Carlos Machado',  veiculo: 'VW Gol 1.0',    status: 'Em Serviço', cor: 'bg-purple-100 text-purple-700', val: 'R$ 1.240' },
            { n: 51, nome: 'Andréia Lima',    veiculo: 'Fiat Palio 1.4', status: 'Aprovado',   cor: 'bg-blue-100 text-blue-700',    val: 'R$ 785'   },
            { n: 50, nome: 'José Nunes',       veiculo: 'GM Celta 1.0',   status: 'Pronto ✓',  cor: 'bg-emerald-100 text-emerald-700', val: 'R$ 520' },
          ].map(os => (
            <div key={os.n} className="bg-gray-50 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${os.cor}`}>{os.status}</span>
                <span className="text-xs font-extrabold text-slate-900">{os.val}</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-800">{os.nome}</p>
              <p className="text-[9px] text-slate-400">{os.veiculo}</p>
            </div>
          ))}
          <div className="bg-emerald-600 rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-[9px] font-semibold">Lucro do mês</p>
              <p className="text-white font-extrabold text-base leading-tight">R$ 15.500</p>
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-300" />
          </div>
        </div>
        {/* Tab bar */}
        <div className="border-t border-gray-100 px-3 py-1.5 flex justify-around">
          {[
            { icon: Wrench, label: 'Oficina', a: true },
            { icon: Clock, label: 'Histórico', a: false },
            { icon: TrendingUp, label: 'Financeiro', a: false },
            { icon: Package, label: 'Estoque', a: false },
          ].map(({ icon: Icon, label, a }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <Icon className={`w-3.5 h-3.5 ${a ? 'text-indigo-600' : 'text-slate-300'}`} />
              <span className={`text-[8px] font-medium ${a ? 'text-indigo-600' : 'text-slate-300'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-white/40 text-[10px] mt-2 font-medium">Tela real do BoxCerto</p>
    </div>
  )
}

// ── Estilos compartilhados ───────────────────────────────────────────────────
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all text-sm bg-white'
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1'

// ── Componente principal ─────────────────────────────────────────────────────
export default function Register() {
  const { register }    = useAuth()
  const navigate        = useNavigate()
  const [searchParams]  = useSearchParams()
  usePageView('/cadastro')

  const origem        = searchParams.get('origem') || ''
  const isDiagnostico = origem === 'diagnostico'

  const nomeRef = useRef(null)
  const formRef = useRef(null)

  const [form, setForm] = useState({
    responsavel: '', whatsapp: '', oficina: '', email: '', password: '', plan: 'annual',
  })
  const [show, setShow]               = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [formStarted, setFormStarted] = useState(false)

  // Contar campos válidos (para analytics)
  const filled = [
    form.responsavel.trim().length > 0,
    form.whatsapp.replace(/\D/g,'').length >= 10,
    form.oficina.trim().length > 0,
    form.email.trim().length > 0,
    form.password.length >= 6,
  ].filter(Boolean).length
  const allFilled = filled === 5

  // Analytics: view
  useEffect(() => { track('cadastro_view') }, [])

  const handle = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFocus = () => {
    if (!formStarted) {
      setFormStarted(true)
      track('cadastro_form_start')
    }
  }

  const handleBlur = (fieldName) => {
    const events = {
      responsavel: 'cadastro_nome_filled',
      whatsapp:    'cadastro_whatsapp_filled',
      oficina:     'cadastro_oficina_filled',
      email:       'cadastro_email_filled',
      password:    'cadastro_senha_filled',
    }
    const val = form[fieldName]
    if (val && val.length > 0) track(events[fieldName])
  }

  const formatWpp = (val) => {
    const n = val.replace(/\D/g, '')
    if (n.length <= 2) return n
    if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}`
  }

  const submit = async (e) => {
    e?.preventDefault()
    setError('')

    const wppClean = form.whatsapp.replace(/\D/g,'')
    const validErr = (field, type, msg) => {
      track('cadastro_validation_error', { error_field: field, error_type: type, campos_preenchidos: filled })
      setError(msg)
    }
    if (!form.responsavel.trim())  return validErr('nome',     'nome_vazio',           'Informe seu nome para continuar.')
    if (wppClean.length < 10)      return validErr('whatsapp', 'whatsapp_incompleto',   'Confira seu WhatsApp. Ele precisa ter DDD + número.')
    if (!form.oficina.trim())      return validErr('oficina',  'oficina_vazia',         'Informe o nome da sua oficina.')
    if (!form.email.includes('@')) return validErr('email',    'email_invalido',        'E-mail inválido. Verifique e tente novamente.')
    if (form.password.length < 6)  return validErr('senha',    'senha_curta',           'A senha deve ter ao menos 6 caracteres.')

    track('cadastro_submit_click', { campos_preenchidos: filled })
    setLoading(true)

    const result = await register({
      oficina:     form.oficina.trim(),
      responsavel: form.responsavel.trim(),
      whatsapp:    form.whatsapp,
      email:       form.email.trim(),
      password:    form.password,
    })

    setLoading(false)

    if (!result.ok) {
      const msg = humanizeError(result.error)
      setError(msg)
      track('cadastro_signup_error', { erro: result.error })
      return
    }

    if (typeof gtag === 'function') {
      gtag('event', 'sign_up', { method: 'email' })
      gtag('event', 'conversion', { send_to: 'G-HQNZQ5PHFB' })
    }
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event:          'iniciou_teste_gratis',
      user_name:      form.responsavel.trim(),
      user_whatsapp:  '55' + wppClean,
      user_email:     form.email.trim(),
    })
    track('cadastro_signup_success')

    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome', to: form.email.trim(),
        nome: form.responsavel.trim(), oficina: form.oficina.trim(), trialDias: 7,
      }),
    }).catch(() => {})

    navigate(`/bem-vindo?nome=${encodeURIComponent(form.responsavel.trim())}&oficina=${encodeURIComponent(form.oficina.trim())}`)
  }

  // ── Copy dinâmica por origem ─────────────────────────────────────────────
  const copy = isDiagnostico ? {
    seal:      'Diagnóstico concluído • 7 dias grátis • sem cartão',
    sealMob:   'Diagnóstico concluído • 7 dias grátis',
    leftHead:  <>Agora comece a corrigir os pontos que fazem sua oficina <span className="text-indigo-400">perder dinheiro</span></>,
    leftSub:   'Teste grátis o BoxCerto por 7 dias e organize OS, estoque, técnicos, pátio e orçamentos em poucos minutos.',
    cardTitle: 'Comece seu teste grátis',
    cardSub:   'Controle OS, estoque, técnicos, pátio e orçamentos da sua oficina em minutos.',
  } : {
    seal:      '7 dias grátis • sem cartão • acesso imediato',
    sealMob:   '7 dias grátis • sem cartão',
    leftHead:  <>Sua oficina no <span className="text-indigo-400">controle</span> desde o primeiro dia</>,
    leftSub:   'Chega de papel, planilha e WhatsApp perdido. Controle OS, estoque, técnicos, pátio e orçamentos em uma única tela.',
    cardTitle: 'Comece seu teste grátis',
    cardSub:   'Controle OS, estoque, técnicos, pátio e orçamentos da sua oficina em minutos.',
  }

  const BULLETS = [
    'OS digital — do orçamento à entrega',
    'Aprovação de orçamento pelo WhatsApp',
    'Gestão de técnicos e serviços em andamento',
    'Pátio visual com status dos veículos',
    'Controle de estoque com alertas automáticos',
  ]

  // ── Formulário ──────────────────────────────────────────────────────────
  const FormFields = (
    <form id="form-cadastro" ref={formRef} onSubmit={submit} className="space-y-2.5">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Seu nome */}
      <div>
        <label className={labelCls}>Seu nome</label>
        <input
          ref={nomeRef}
          name="responsavel" required
          value={form.responsavel} onChange={handle}
          onFocus={handleFocus}
          onBlur={() => handleBlur('responsavel')}
          placeholder="Ex: João Silva"
          className={inputCls}
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label className={labelCls}>WhatsApp</label>
        <input
          name="whatsapp" required
          value={form.whatsapp}
          onChange={(e) => setForm(p => ({ ...p, whatsapp: formatWpp(e.target.value) }))}
          onFocus={handleFocus}
          onBlur={() => handleBlur('whatsapp')}
          placeholder="(51) 99999-9999" maxLength={15}
          className={inputCls}
        />
      </div>

      {/* Nome da oficina */}
      <div>
        <label className={labelCls}>Nome da oficina</label>
        <input
          name="oficina" required
          value={form.oficina} onChange={handle}
          onFocus={handleFocus}
          onBlur={() => handleBlur('oficina')}
          placeholder="Ex: Auto Elétrica do João"
          className={inputCls}
        />
      </div>

      {/* E-mail */}
      <div>
        <label className={labelCls}>E-mail</label>
        <input
          name="email" type="email" required
          value={form.email} onChange={handle}
          onFocus={handleFocus}
          onBlur={() => handleBlur('email')}
          placeholder="seuemail@exemplo.com"
          className={inputCls}
        />
      </div>

      {/* Senha */}
      <div>
        <label className={labelCls}>Senha</label>
        <div className="relative">
          <input
            name="password" type={show ? 'text' : 'password'} required
            value={form.password} onChange={handle}
            onFocus={handleFocus}
            onBlur={() => handleBlur('password')}
            placeholder="Mínimo 6 caracteres"
            className={`${inputCls} pr-11`}
          />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit" disabled={loading}
        onClick={() => track('cadastro_submit_click', { campos_preenchidos: filled })}
        className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 text-base shadow-lg shadow-indigo-200 mt-1"
      >
        {loading ? 'Criando sua conta...' : 'Começar meu teste grátis'}
      </button>

      <p className="text-center text-xs text-slate-400">
        Leva menos de 1 minuto. Não precisa cartão.
      </p>

      <p className="text-center text-[11px] text-slate-400 font-medium">
        Nenhuma cobrança será feita sem sua confirmação.
      </p>

      <p className="text-[10px] text-slate-300 text-center leading-relaxed pt-1">
        Ao continuar, você concorda com os{' '}
        <Link to="/termos" target="_blank" className="text-slate-400 hover:text-indigo-500 transition-colors underline underline-offset-2">Termos de Uso</Link>
        {' '}e a{' '}
        <Link to="/privacidade" target="_blank" className="text-slate-400 hover:text-indigo-500 transition-colors underline underline-offset-2">Política de Privacidade</Link>.
      </p>
    </form>
  )

  // ── Chips de confiança ───────────────────────────────────────────────────
  const Chips = ({ compact = false }) => (
    compact ? (
      <p className="text-xs text-slate-500 text-center mb-3">
        Fácil de usar&nbsp;•&nbsp;Aprenda em minutos&nbsp;•&nbsp;Acesso imediato
      </p>
    ) : (
      <div className="flex flex-wrap gap-2 mb-4">
        {['Fácil de usar', 'Aprenda em minutos', 'Acesso imediato'].map(t => (
          <span key={t} className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
            <CheckCircle className="w-3 h-3 shrink-0" />{t}
          </span>
        ))}
      </div>
    )
  )

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── MOBILE ─────────────────────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/20 flex flex-col items-center px-4 pt-5 pb-10">

        {/* Logo compacto */}
        <Link to="/" className="mb-2.5">
          <Logo size="sm" priority />
        </Link>

        {/* Selo */}
        <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
          {copy.sealMob}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 w-full max-w-sm">
          <h1 className="text-xl font-extrabold text-slate-900 mb-0.5">{copy.cardTitle}</h1>
          <p className="text-slate-500 text-xs mb-2.5 leading-snug">{copy.cardSub}</p>

          <Chips compact />

          {FormFields}
        </div>

        {/* Link login */}
        <p className="mt-4 text-sm text-slate-500 text-center">
          Já tem conta?{' '}
          <Link to="/login" onClick={() => track('cadastro_login_click')}
            className="text-indigo-600 font-semibold hover:underline">
            Entrar
          </Link>
        </p>

        {/* Mockup abaixo do form */}
        <div className="mt-8 w-full max-w-sm opacity-80">
          <SystemPreview />
        </div>
      </div>


      {/* ── DESKTOP: 2 colunas ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen">

        {/* Coluna esquerda — produto */}
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center px-12 xl:px-20 py-12 overflow-y-auto">
          <Link to="/" className="mb-8 inline-block">
            <Logo size="sm" onDark priority />
          </Link>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-3">
            {copy.leftHead}
          </h1>

          <p className="text-slate-300 text-sm xl:text-base mb-6 leading-relaxed max-w-md">
            {copy.leftSub}
          </p>

          <div className="space-y-2.5 mb-8">
            {BULLETS.map(b => (
              <div key={b} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {b}
              </div>
            ))}
          </div>

          <div className="max-w-xs">
            <SystemPreview />
          </div>
        </div>

        {/* Coluna direita — formulário */}
        <div className="w-full max-w-[480px] xl:max-w-[520px] flex flex-col justify-center px-10 xl:px-14 py-10 bg-white overflow-y-auto">

          {/* Selo */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 self-start">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
            {copy.seal}
          </div>

          <h2 className="text-2xl xl:text-3xl font-extrabold text-slate-900 mb-1">{copy.cardTitle}</h2>
          <p className="text-slate-500 text-sm mb-4 leading-snug">{copy.cardSub}</p>

          <Chips />

          {FormFields}

          <p className="mt-5 text-sm text-slate-500">
            Já tem conta?{' '}
            <Link to="/login" onClick={() => track('cadastro_login_click')}
              className="text-indigo-600 font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
