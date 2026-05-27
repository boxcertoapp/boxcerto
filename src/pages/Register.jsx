import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle, Star, MessageCircle } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { usePageView } from '../hooks/usePageView'
import { supabase } from '../lib/supabase'
import { titleCaseName } from '../lib/text'
import { sendCapi } from '../lib/metaCapi'

const WPP_SUPORTE = 'https://wa.me/5553997065725?text=' + encodeURIComponent('Olá! Tenho dúvidas sobre o BoxCerto e quero ajuda para me cadastrar.')

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
    oficina: '', responsavel: '', whatsapp: '', email: '', password: '', plan: 'annual',
  })
  const [show, setShow]               = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [formStarted, setFormStarted] = useState(false)

  // Contar campos válidos (para analytics)
  const filled = [
    form.oficina.trim().length > 0,
    form.responsavel.trim().length > 0,
    form.whatsapp.replace(/\D/g,'').length >= 10,
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
    if (!form.oficina.trim())       return validErr('oficina',  'oficina_vazia',         'Informe o nome da sua oficina.')
    if (!form.responsavel.trim())  return validErr('nome',     'nome_vazio',           'Informe seu nome para continuar.')
    if (wppClean.length < 10)      return validErr('whatsapp', 'whatsapp_incompleto',   'Confira seu WhatsApp. Ele precisa ter DDD + número.')
    if (!form.email.includes('@')) return validErr('email',    'email_invalido',        'E-mail inválido. Verifique e tente novamente.')
    if (form.password.length < 6)  return validErr('senha',    'senha_curta',           'A senha deve ter ao menos 6 caracteres.')

    track('cadastro_submit_click', { campos_preenchidos: filled })
    setLoading(true)

    const oficinaNormalized = titleCaseName(form.oficina)
    const responsavelNormalized = titleCaseName(form.responsavel)

    const result = await register({
      oficina:     oficinaNormalized,
      responsavel: responsavelNormalized,
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

    // ── CAPI server-side: envia evento com dados hasheados e retorna event_id
    // para deduplicação com o pixel browser via GTM
    const capiEventId = await sendCapi('StartTrial', {
      email:     form.email.trim(),
      whatsapp:  wppClean,
      firstName: responsavelNormalized.split(' ')[0],
    })

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event:          'iniciou_teste_gratis',
      event_id:       capiEventId,
      user_name:      responsavelNormalized,
      user_whatsapp:  '55' + wppClean,
      user_email:     form.email.trim(),
    })
    track('cadastro_signup_success')

    // Persiste UTMs para o BemVindo.jsx recuperar após o redirect
    try {
      localStorage.setItem('boxcerto_utm', JSON.stringify({
        utm_source:   sp.get('utm_source')   || '',
        utm_medium:   sp.get('utm_medium')   || '',
        utm_campaign: sp.get('utm_campaign') || '',
        utm_content:  sp.get('utm_content')  || '',
        origem:       sp.get('origem')       || '',
      }))
    } catch {}

    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'welcome', to: form.email.trim(),
        nome: responsavelNormalized, oficina: oficinaNormalized, trialDias: 7,
      }),
    }).catch(() => {})

    navigate(`/bem-vindo?nome=${encodeURIComponent(responsavelNormalized)}`)
  }

  const loginGoogle = async () => {
    track('cadastro_google_click')
    // Salva UTMs antes do redirect OAuth (a URL muda e os params se perdem)
    try {
      const sp2 = new URLSearchParams(window.location.search)
      localStorage.setItem('boxcerto_utm', JSON.stringify({
        utm_source:   sp2.get('utm_source')   || '',
        utm_medium:   sp2.get('utm_medium')   || '',
        utm_campaign: sp2.get('utm_campaign') || '',
        utm_content:  sp2.get('utm_content')  || '',
        origem:       sp2.get('origem')       || '',
      }))
    } catch {}
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/bem-vindo' },
    })
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

      {/* Nome da oficina */}
      <div>
        <label className={labelCls}>Nome da oficina</label>
        <input
          name="oficina" required
          value={form.oficina} onChange={handle}
          onFocus={handleFocus}
          onBlur={() => handleBlur('oficina')}
          placeholder="Ex: Oficina do João"
          className={inputCls}
        />
      </div>

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

      {/* Divisor */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-slate-400 font-medium">ou</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Entrar com Google */}
      <button
        type="button"
        onClick={loginGoogle}
        className="w-full flex items-center justify-center gap-2.5 border border-gray-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar com Google
      </button>

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
      <div className="lg:hidden min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-indigo-900 flex flex-col items-center px-4 pt-6 pb-10">

        {/* Logo */}
        <Link to="/" className="mb-5">
          <Logo size="sm" onDark priority />
        </Link>

        {/* ── VENDA ANTES DO FORM ─────────────────────────── */}
        <div className="w-full max-w-sm text-center mb-5">
          <h1 className="text-2xl font-extrabold text-white leading-tight mb-2">
            Pare de perder o controle<br />
            <span className="text-amber-400">da sua oficina</span>
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed mb-5">
            OS digital, orçamento pelo WhatsApp, financeiro e estoque — tudo no celular.
          </p>

          {/* Bullets */}
          <div className="space-y-2 mb-5 text-left">
            {[
              '✅ Orçamento aprovado pelo WhatsApp em segundos',
              '✅ Financeiro em tempo real — saiba seu lucro hoje',
              '✅ Histórico completo de clientes e veículos',
            ].map(b => (
              <p key={b} className="text-sm text-indigo-100">{b}</p>
            ))}
          </div>

          {/* Prova social */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-white text-sm font-semibold">+347 oficinas já usam</span>
          </div>
        </div>

        {/* ── FORMULÁRIO ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-sm">
          <p className="text-xs font-semibold text-slate-500 text-center mb-4">
            7 dias grátis · sem cartão · acesso imediato
          </p>

          {FormFields}
        </div>

        {/* Link login */}
        <p className="mt-4 text-sm text-indigo-300 text-center">
          Já tem conta?{' '}
          <Link to="/login" onClick={() => track('cadastro_login_click')}
            className="text-white font-semibold hover:underline">
            Entrar
          </Link>
        </p>

        {/* Botão WhatsApp suporte */}
        <a
          href={WPP_SUPORTE} target="_blank" rel="noreferrer"
          onClick={() => track('cadastro_wpp_suporte_click')}
          className="mt-4 flex items-center gap-2 text-emerald-300 text-sm font-medium hover:text-emerald-200 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Falar com especialista antes de cadastrar
        </a>
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

          <div className="space-y-2.5 mb-6">
            {BULLETS.map(b => (
              <div key={b} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {b}
              </div>
            ))}
          </div>

          {/* Prova social desktop */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-slate-300 text-sm">+347 oficinas já usam o BoxCerto</span>
          </div>

          <div className="max-w-xs">
            <img
              src="/mockup01.webp"
              alt="BoxCerto — gestão de oficina no celular e no computador"
              className="w-full h-auto"
              loading="eager"
              decoding="async"
              width="1448"
              height="1086"
            />
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

          {/* WhatsApp suporte desktop */}
          <a
            href={WPP_SUPORTE} target="_blank" rel="noreferrer"
            onClick={() => track('cadastro_wpp_suporte_click')}
            className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com especialista antes de cadastrar
          </a>
        </div>
      </div>
    </>
  )
}
