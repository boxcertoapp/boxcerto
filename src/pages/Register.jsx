import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle, MessageCircle, Plus, ArrowRight, Lock } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { usePageView } from '../hooks/usePageView'
import { usePageMeta } from '../hooks/usePageMeta'
import { supabase } from '../lib/supabase'
import { titleCaseName } from '../lib/text'
import { sendCapi } from '../lib/metaCapi'
import { getAffiliateRef, getAffiliateCoupon, saveAffiliateCoupon, clearAffiliateData } from '../lib/affiliateTracking'
import '../styles/cadastro.css'

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

const BULLETS = [
  'OS digital — do orçamento à entrega',
  'Aprovação de orçamento pelo WhatsApp',
  'Gestão de técnicos e serviços em andamento',
  'Pátio visual com status dos veículos',
  'Controle de estoque com alertas automáticos',
]

// ── Componente principal ─────────────────────────────────────────────────────
export default function Register() {
  const { register }   = useAuth()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  usePageView('/cadastro')
  usePageMeta({
    title:       'Criar conta grátis — BoxCerto | Sistema para Oficina Mecânica',
    description: 'Crie sua conta grátis e teste o BoxCerto por 7 dias sem cartão. OS digital, estoque, financeiro e aprovação de orçamento pelo WhatsApp — tudo em um app para oficina mecânica.',
    canonical:   'https://boxcerto.com/cadastro',
  })

  const origem        = searchParams.get('origem') || ''
  const isDiagnostico = origem === 'diagnostico'
  const isCardTrial   = searchParams.get('trial') === 'card'

  // 3 campos: nome, email, senha (oficina e whatsapp vão no BemVindo)
  const [form, setForm]             = useState({ nome: '', email: '', password: '' })
  const [couponInput, setCouponInput] = useState(getAffiliateCoupon() || '')
  const [couponOpen, setCouponOpen] = useState(false)
  const [show, setShow]             = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [formStarted, setFormStarted] = useState(false)

  // Campos válidos (para analytics)
  const filled = [
    form.nome.trim().length > 0,
    form.email.trim().length > 0,
    form.password.length >= 6,
  ].filter(Boolean).length

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
      nome:     'cadastro_nome_filled',
      email:    'cadastro_email_filled',
      password: 'cadastro_senha_filled',
    }
    const val = form[fieldName]
    if (val && val.length > 0) track(events[fieldName])
  }

  const submit = async (e) => {
    e?.preventDefault()
    setError('')

    const validErr = (field, type, msg) => {
      track('cadastro_validation_error', { error_field: field, error_type: type, campos_preenchidos: filled })
      setError(msg)
    }
    if (!form.nome.trim())          return validErr('nome',  'nome_vazio',    'Informe seu nome para continuar.')
    if (!form.email.includes('@'))  return validErr('email', 'email_invalido','E-mail inválido. Verifique e tente novamente.')
    if (form.password.length < 6)   return validErr('senha', 'senha_curta',   'A senha deve ter ao menos 6 caracteres.')

    track('cadastro_submit_click', { campos_preenchidos: filled })
    setLoading(true)

    const nomeNormalized = titleCaseName(form.nome)

    // Captura atribuição de afiliado antes do signup
    const affiliateRef    = getAffiliateRef()
    const affiliateCoupon = couponInput.trim().toUpperCase() || getAffiliateCoupon()
    if (couponInput.trim()) saveAffiliateCoupon(couponInput.trim())

    const result = await register({
      oficina:        '',           // BemVindo captura depois
      responsavel:    nomeNormalized,
      whatsapp:       '',           // BemVindo captura depois
      email:          form.email.trim(),
      password:       form.password,
      affiliateRef,
      affiliateCoupon,
    })

    if (!result.ok) {
      setLoading(false)
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
      firstName: nomeNormalized.split(' ')[0],
    })

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event:      'iniciou_teste_gratis',
      event_id:   capiEventId,
      user_name:  nomeNormalized,
      user_email: form.email.trim(),
    })
    track('cadastro_signup_success')

    // Persiste UTMs para o BemVindo.jsx recuperar após o redirect
    // (usa searchParams do hook — evita o bug do `sp` indefinido)
    try {
      localStorage.setItem('boxcerto_utm', JSON.stringify({
        utm_source:   searchParams.get('utm_source')   || '',
        utm_medium:   searchParams.get('utm_medium')   || '',
        utm_campaign: searchParams.get('utm_campaign') || '',
        utm_content:  searchParams.get('utm_content')  || '',
        origem:       searchParams.get('origem')       || '',
      }))
    } catch {}

    // ── Fluxo card-required: vindo de /comecar (tráfego pago) ──
    // Redireciona para Stripe Checkout com trial de 7 dias + cartão obrigatório.
    // Não tem fallback para o fluxo normal — cartão é obrigatório nesse fluxo.
    if (isCardTrial) {
      try {
        const checkoutRes = await fetch('/api/create-trial-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email.trim(),
            nome:  nomeNormalized,
          }),
        })
        const checkoutData = await checkoutRes.json()
        if (checkoutData.url) {
          clearAffiliateData()
          window.location.href = checkoutData.url
          return
        }
        // API retornou erro — mostra para o usuário
        setError(checkoutData.error || 'Erro ao criar sessão de pagamento. Tente novamente.')
      } catch (e) {
        setError('Erro de conexão ao processar pagamento. Tente novamente.')
      }
      setLoading(false)
      return // nunca avança sem o cartão no fluxo pago
    }

    setLoading(false)

    // ── Fluxo normal: trial sem cartão ─────────────────────────
    fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(result.accessToken ? { Authorization: `Bearer ${result.accessToken}` } : {}),
      },
      body: JSON.stringify({
        type: 'welcome', to: form.email.trim(),
        nome: nomeNormalized, oficina: '', trialDias: 7,
      }),
    }).catch(() => {})

    clearAffiliateData() // atribuição salva no perfil — limpa localStorage
    navigate(`/bem-vindo?nome=${encodeURIComponent(nomeNormalized)}`)
  }

  const loginGoogle = async () => {
    track('cadastro_google_click')
    // Salva UTMs antes do redirect OAuth (a URL muda e os params se perdem)
    try {
      localStorage.setItem('boxcerto_utm', JSON.stringify({
        utm_source:   searchParams.get('utm_source')   || '',
        utm_medium:   searchParams.get('utm_medium')   || '',
        utm_campaign: searchParams.get('utm_campaign') || '',
        utm_content:  searchParams.get('utm_content')  || '',
        origem:       searchParams.get('origem')       || '',
      }))
    } catch {}
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/bem-vindo' },
    })
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="cad-page">
      <div className="cad-grid">

        {/* ── LEFT — marketing (dark) ──────────────────────────────────────── */}
        <div className="cad-left">
          <span className="l-glow a" />
          <span className="l-glow b" />
          <div className="cad-left-in">

            {/* Brand (desktop only) */}
            <div className="cad-brand">
              <Link to="/"><Logo size="sm" onDark priority /></Link>
            </div>

            <h1>
              {isDiagnostico ? (
                <>Agora comece a corrigir<br />os pontos que fazem<br />sua oficina <span className="hl">perder dinheiro</span></>
              ) : (
                <>Sua oficina no <span className="hl">controle</span><br />desde o <span className="am">primeiro dia</span></>
              )}
            </h1>
            <p className="l-sub">
              {isDiagnostico
                ? 'Teste grátis o BoxCerto por 7 dias e organize OS, estoque, técnicos, pátio e orçamentos em poucos minutos.'
                : 'Chega de papel, planilha e WhatsApp perdido. OS digital, estoque, técnicos e financeiro em uma única tela.'
              }
            </p>

            <div className="cad-benefits">
              {BULLETS.map(b => (
                <div key={b} className="cad-benefit">
                  <span className="ck"><CheckCircle /></span>
                  {b}
                </div>
              ))}
            </div>

            <div className="cad-social">
              <div className="avs">
                <span style={{ background: '#4f46e5' }}>CV</span>
                <span style={{ background: '#0f8a4d' }}>AF</span>
                <span style={{ background: '#b4690e' }}>LL</span>
              </div>
              <div className="sc-tx">
                <span className="stars">★★★★★</span>{' '}
                <b>+347 oficinas</b><br />já organizam o dia no BoxCerto
              </div>
            </div>

            {/* Título de reforço — visível só no mobile, abaixo do form */}
            <p className="l-rein-title">Por que mais de 347 mecânicos escolheram o BoxCerto?</p>

            <div className="cad-mock">
              <img
                src="/mockup01.webp"
                alt="BoxCerto — gestão de oficina no celular e no computador"
                loading="eager"
                decoding="async"
                width="1448"
                height="1086"
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT — formulário (branco) ───────────────────────────────────── */}
        <div className="cad-right">
          <form className="cad-form-card" onSubmit={submit} noValidate>

            {/* Mini brand — visível só no mobile */}
            <div className="cad-m-brand">
              <Link to="/"><Logo size="sm" priority /></Link>
            </div>

            {/* Badge */}
            <span className="cad-badge">
              <span className="dot" />
              {isDiagnostico
                ? 'Diagnóstico concluído · 7 dias grátis · sem cartão'
                : '7 dias grátis · sem cartão · acesso imediato'
              }
            </span>

            <h2>Comece seu teste grátis</h2>
            <p className="c-sub">Crie sua conta e configure sua oficina em poucos minutos.</p>

            {/* Prova social dentro do form */}
            <div className="cad-form-social">
              <div className="avs">
                <span style={{ background: '#4f46e5' }}>CV</span>
                <span style={{ background: '#0f8a4d' }}>AF</span>
                <span style={{ background: '#b4690e' }}>LL</span>
              </div>
              <div className="fs-tx">
                <span className="stars">★★★★★</span>{' '}
                <b>+347 oficinas</b><br />já organizam o dia no BoxCerto
              </div>
            </div>

            {/* Erro global */}
            {error && (
              <div className="cad-error">
                <AlertCircle />
                {error}
              </div>
            )}

            {/* ── GOOGLE — no topo ──────────────────────────── */}
            <button type="button" className="btn-google" onClick={loginGoogle}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
              <span className="g-fast">1 toque</span>
            </button>

            <div className="cad-or">ou cadastre com e-mail</div>

            {/* ── CAMPOS ──────────────────────────────────────── */}
            <div className="cad-fields">

              {/* Nome */}
              <div className="field">
                <label>Seu nome</label>
                <div className="inp-wrap">
                  <input
                    type="text" name="nome" placeholder="Ex: João Silva"
                    value={form.nome} onChange={handle}
                    onFocus={handleFocus} onBlur={() => handleBlur('nome')}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="field">
                <label>E-mail</label>
                <div className="inp-wrap">
                  <input
                    type="email" name="email" placeholder="voce@email.com"
                    value={form.email} onChange={handle}
                    onFocus={handleFocus} onBlur={() => handleBlur('email')}
                    autoComplete="email" inputMode="email"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="field">
                <label>Senha</label>
                <div className="inp-wrap">
                  <input
                    className="has-icon"
                    type={show ? 'text' : 'password'} name="password"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password} onChange={handle}
                    onFocus={handleFocus} onBlur={() => handleBlur('password')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button" className="eye"
                    onClick={() => setShow(s => !s)}
                    aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {show ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                <p className="hint">Use no mínimo 6 caracteres.</p>
              </div>

              {/* Cupom (colapsável) */}
              <div>
                <button
                  type="button"
                  className={`cad-coupon-toggle${couponOpen ? ' open' : ''}`}
                  onClick={() => setCouponOpen(c => !c)}
                >
                  <Plus /> Tem um cupom de parceiro?
                </button>
                <div className={`cad-coupon-field${couponOpen ? ' open' : ''}`}>
                  <div className="field" style={{ marginTop: '4px' }}>
                    <div className="inp-wrap">
                      <input
                        type="text" placeholder="EX: JOAO10"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn btn-primary cad-submit">
                {loading
                  ? (isCardTrial ? 'Aguarde, preparando pagamento...' : 'Criando sua conta...')
                  : <><span>{isCardTrial ? 'Criar conta e adicionar cartão' : 'Criar conta grátis'}</span><ArrowRight /></>
                }
              </button>
            </div>

            {/* Reassurance */}
            <div className="cad-reassure">
              <span className="micro">
                {isCardTrial
                  ? 'Leva 1 minuto · 7 dias grátis · cartão necessário · cancele quando quiser'
                  : 'Leva menos de 1 minuto · não precisa de cartão'}
              </span>
              <span className="secure"><Lock /> Seus dados protegidos · conta cancelável quando quiser</span>
            </div>

            {/* Termos */}
            <p className="cad-terms">
              Ao criar a conta você concorda com os{' '}
              <Link to="/termos" target="_blank">Termos de Uso</Link>
              {' '}e a{' '}
              <Link to="/privacidade" target="_blank">Política de Privacidade</Link>.
            </p>

            {/* Rodapé do card */}
            <div className="cad-foot">
              <span className="login-line">
                Já tem conta?{' '}
                <Link to="/login" onClick={() => track('cadastro_login_click')}>Entrar</Link>
              </span>
              <a
                className="expert"
                href={WPP_SUPORTE} target="_blank" rel="noreferrer"
                onClick={() => track('cadastro_wpp_suporte_click')}
              >
                <MessageCircle /> Falar com especialista antes de cadastrar
              </a>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}
