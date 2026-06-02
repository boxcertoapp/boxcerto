// ============================================================
// LandingPago — LP de tráfego pago (/comecar)
// Trial com cartão obrigatório. Foco 100% em conversão.
// NÃO usar "sem cartão" nesta página.
// Design: handoff trafego/design_handoff_trafego
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, RotateCcw, ArrowRight, Star,
  Wrench, Package, DollarSign, Smartphone,
  Users, ClipboardList, BarChart2, Shield,
} from 'lucide-react'
import '../styles/landing.css'
import { usePageView } from '../hooks/usePageView'
import { usePageMeta } from '../hooks/usePageMeta'

// ── CSS específico desta LP ──────────────────────────────────
const CSS = `
/* Announce */
.tannounce{background:var(--ink);color:#e9ebf6;text-align:center;font-size:13.5px;font-weight:600;padding:9px 16px;display:flex;align-items:center;justify-content:center;gap:9px;line-height:1.3;}
.tannounce .spark{color:var(--green);font-size:14px;}
.tannounce b{color:#fff;}

/* Nav mínima */
.tnav{position:sticky;top:0;z-index:60;background:rgba(14,16,30,.72);backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid rgba(255,255,255,.07);}
.tnav-inner{display:flex;align-items:center;height:64px;}
.tnav .brand{margin-right:auto;display:inline-flex;align-items:center;gap:9px;text-decoration:none;}
.tnav .brand .wm{font-family:var(--font-display);font-size:18px;font-weight:800;color:#fff;letter-spacing:-.02em;}
.tnav .brand .wm b{color:#a5acff;}
@media(max-width:560px){.tnav-inner{height:58px;}}

/* Hero escuro */
.thero{position:relative;overflow:hidden;background:radial-gradient(120% 130% at 80% -10%,#20254a 0%,#14163a 45%,#0d0f2b 100%);color:#d7daf0;padding:50px 0 60px;}
.thero .glow.g1{width:620px;height:620px;background:rgba(99,102,241,.34);top:-280px;right:-140px;}
.thero .glow.g2{width:420px;height:420px;background:rgba(34,197,94,.16);bottom:-240px;left:-160px;}
.thero-grid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.06fr) minmax(0,.94fr);gap:50px;align-items:center;}
.thero-copy,.thero-visual{min-width:0;}
.thero .t-kick{display:inline-flex;align-items:center;gap:9px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#9fa6ff;background:rgba(99,102,241,.16);border:1px solid rgba(99,102,241,.3);padding:7px 13px;border-radius:var(--r-pill);}
.thero .t-kick .dot{width:7px;height:7px;border-radius:50%;background:currentColor;}
.thero h1{color:#fff;font-size:clamp(38px,5.2vw,62px);line-height:1.04;letter-spacing:-.03em;margin:20px 0 18px;font-family:var(--font-display);font-weight:800;}
.thero h1 .hl{color:#8b93ff;}
.thero .t-sub{font-size:clamp(17px,1.5vw,20px);color:#aab0d8;max-width:540px;line-height:1.5;font-family:var(--font-body);}
.thero-cta{display:flex;flex-direction:column;align-items:flex-start;gap:14px;margin:30px 0 0;}
.thero-cta .btn-green{box-shadow:0 20px 44px -14px rgba(34,197,94,.6)!important;}
.thero-micro{display:inline-flex;align-items:center;gap:9px;font-size:13.5px;color:#aab0d8;font-weight:600;flex-wrap:wrap;}
.thero-micro .sep{width:4px;height:4px;border-radius:50%;background:#6970a0;}
.thero-micro svg{width:15px!important;height:15px!important;color:#4ade80;}
.thero-visual{position:relative;}
.thero-visual .device{width:100%;filter:drop-shadow(0 40px 70px rgba(0,0,0,.5));}
.thero-float{position:absolute;z-index:4;background:#fff;border-radius:15px;box-shadow:var(--sh-lg);padding:12px 14px;}
.thero-float.f-approved{top:9%;left:-16px;animation:floaty 5s ease-in-out infinite;}
.approved-pill{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-display);font-weight:800;font-size:13.5px;color:var(--ink);}
.approved-pill .check{width:22px;height:22px;border-radius:50%;background:var(--green-50);color:var(--green-600);display:grid;place-items:center;flex:none;}
.approved-pill .check svg{width:13px!important;height:13px!important;}
.approved-pill .ap-time{font-family:var(--font-mono);font-size:10px;color:var(--slate-400);font-weight:700;margin-left:4px;}
.thero-float.f-fin{bottom:8%;right:-14px;animation:floaty 6s ease-in-out .8s infinite;}
.thero-float.f-fin .ft-lbl{font-family:var(--font-mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--slate-400);font-weight:700;}
.thero-float.f-fin .ft-val{font-family:var(--font-display);font-weight:800;color:var(--ink);font-size:17px;line-height:1.1;margin-top:3px;}
.thero-float.f-fin .ft-val .g{color:var(--green-600);}
@media(max-width:900px){
  .thero{padding:32px 0 44px;}
  .thero-grid{grid-template-columns:1fr;gap:36px;}
  .thero-visual{max-width:440px;margin:0 auto;}
  .thero-cta{align-items:stretch;}
  .thero-cta .btn{width:100%!important;justify-content:center;}
  .thero-micro{justify-content:center;}
}

/* Steps — override para 3 colunas */
.tsteps-row{grid-template-columns:repeat(3,1fr)!important;}
@media(max-width:760px){.tsteps-row{grid-template-columns:1fr!important;}}
@media(max-width:900px) and (min-width:761px){.tsteps-row{grid-template-columns:1fr 1fr!important;}}

/* Stats band escura */
.t-statsband{background:var(--ink);padding:72px 0;}
.t-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center;}
.t-stat-num{font-family:var(--font-display);font-size:clamp(36px,4.5vw,56px);font-weight:800;letter-spacing:-.03em;color:#fff;line-height:1;}
.t-stat-unit{font-size:clamp(18px,2vw,26px);color:rgba(165,180,252,.7);font-weight:700;}
.t-stat-label{font-size:14px;color:rgba(165,180,252,.55);margin-top:8px;font-weight:600;}
@media(max-width:760px){.t-stats-grid{grid-template-columns:1fr 1fr;gap:32px 16px;}}

/* Pricing */
.tprice-wrap{max-width:540px;margin:50px auto 0;}
.tprice-card{position:relative;background:var(--ink);color:#fff;border-radius:var(--r-xl);padding:38px 36px;box-shadow:var(--sh-lg);overflow:hidden;}
.tprice-card .pc-glow{position:absolute;width:340px;height:340px;border-radius:50%;background:rgba(34,197,94,.36);filter:blur(80px);top:-150px;right:-90px;pointer-events:none;}
.tprice-card .pc-in{position:relative;z-index:2;}
.tprice-card .pc-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,.16);border:1px solid rgba(34,197,94,.34);color:#6ee7a0;font-family:var(--font-mono);font-size:11.5px;font-weight:700;letter-spacing:.04em;padding:7px 13px;border-radius:var(--r-pill);}
.tprice-card .pc-badge svg{width:14px!important;height:14px!important;}
.tprice-card .pc-free{font-family:var(--font-display);font-weight:800;font-size:clamp(28px,4.4vw,38px);color:#fff;margin:20px 0 6px;letter-spacing:-.02em;line-height:1.05;}
.tprice-card .pc-free .u{color:var(--green);}
.tprice-card .pc-after{font-size:15px;color:#aab0cf;}
.tprice-card .pc-after b{color:#fff;font-family:var(--font-display);}
.tprice-card .pc-feats{display:grid;gap:12px;margin:26px 0 28px;padding-top:24px;border-top:1px solid rgba(255,255,255,.14);}
.tprice-card .pc-feat{display:flex;gap:11px;align-items:flex-start;font-size:14.5px;color:#dfe2ef;}
.tprice-card .pc-feat .ck{flex:none;width:22px;height:22px;border-radius:50%;background:rgba(34,197,94,.18);display:grid;place-items:center;margin-top:-1px;}
.tprice-card .pc-feat .ck svg{width:12px!important;height:12px!important;color:var(--green);}
.tprice-card .pc-cta{width:100%!important;justify-content:center;}
.tprice-guarantee{display:flex;align-items:center;gap:11px;margin-top:18px;padding:14px 16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:13px;}
.tprice-guarantee svg{width:20px!important;height:20px!important;color:var(--green);flex:none;}
.tprice-guarantee .tg-tx{font-size:13px;color:#c2c7e6;font-weight:600;line-height:1.4;}
.tprice-guarantee .tg-tx b{color:#fff;}
.tprice-mini{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:20px;font-size:14px;color:var(--slate-600);font-weight:600;flex-wrap:wrap;}
.tprice-mini .pm-price{font-family:var(--font-display);font-weight:800;color:var(--ink);}
.tprice-mini .dot-sep{width:4px;height:4px;border-radius:50%;background:var(--slate-400);}
@media(max-width:560px){.tprice-card{padding:30px 24px;}}

/* Footer mínimo */
.tfooter{background:var(--ink);padding:34px 0;}
.tfooter-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.tfooter .tbrand{display:inline-flex;align-items:center;gap:8px;text-decoration:none;}
.tfooter .tbrand .wm{font-family:var(--font-display);font-size:15px;font-weight:800;color:#fff;letter-spacing:-.02em;}
.tfooter .tbrand .wm b{color:#a5acff;}
.tfooter .tf-copy{font-size:13px;color:#8a90b0;}
.tfooter .tf-links{display:flex;gap:18px;}
.tfooter .tf-links a{font-size:13px;color:#aab0cf;font-weight:600;text-decoration:none;}
.tfooter .tf-links a:hover{color:#fff;}

/* Sticky CTA mobile */
.tsticky{position:fixed;left:0;right:0;bottom:0;z-index:70;background:rgba(255,255,255,.95);backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);border-top:1px solid var(--line);padding:10px 16px calc(10px + env(safe-area-inset-bottom));display:none;align-items:center;gap:12px;box-shadow:0 -8px 24px -16px rgba(20,22,31,.3);transform:translateY(120%);transition:transform .3s cubic-bezier(.2,.7,.2,1);}
.tsticky.show{transform:translateY(0);}
.tsticky .ts-tx{flex:1;min-width:0;}
.tsticky .ts-tx b{display:block;font-family:var(--font-display);font-weight:800;color:var(--ink);font-size:14px;line-height:1.15;}
.tsticky .ts-tx span{font-size:11.5px;color:var(--slate-500);font-weight:600;}
.tsticky .btn{flex:none;}
@media(max-width:760px){.tsticky{display:flex;}}
body.has-tsticky{padding-bottom:74px;}
`

// ── Tracking ─────────────────────────────────────────────────
const pushCTA = (label = 'cta') => {
  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'lp_pago_cta_click', cta_label: label, page: '/comecar' })
  } catch (_) {}
}

// ── Ícones ───────────────────────────────────────────────────
function WhatsappIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.478 2 2 6.478 2 12c0 1.85.504 3.58 1.38 5.065L2 22l5.065-1.38A9.94 9.94 0 0 0 12 22c5.522 0 10-4.478 10-10S17.521 2 12 2h-.001zm0 18c-1.7 0-3.3-.457-4.68-1.252l-.336-.198-3.003.818.818-3.003-.198-.336A7.955 7.955 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>
  )
}

function ShieldLockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
      <rect x="9" y="11" width="6" height="5" rx="1"/>
      <path d="M10.5 11v-1.5a1.5 1.5 0 0 1 3 0V11"/>
    </svg>
  )
}

// ── Reveal on scroll ─────────────────────────────────────────
function Reveal({ children, delay = 0, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { setTimeout(() => el.classList.add('in'), delay); io.unobserve(el) }
      })
    }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [delay])
  return <Tag ref={ref} className={`reveal ${className}`} {...rest}>{children}</Tag>
}

// ── Announce bar ─────────────────────────────────────────────
function TAnnounce() {
  return (
    <div className="tannounce">
      <span className="spark">✦</span>
      <span>+347 oficinas já trocaram o caderno e a planilha pelo <b>BoxCerto</b></span>
    </div>
  )
}

// ── Nav mínima ───────────────────────────────────────────────
function TNav({ onCTA }) {
  return (
    <header className="tnav">
      <div className="wrap tnav-inner">
        <Link className="brand" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="BoxCerto" width="32" height="32" style={{ borderRadius: 8 }} />
          <span className="wm" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>
            Box<b style={{ color: '#a5acff' }}>Certo</b>
          </span>
        </Link>
        <Link to="/cadastro" onClick={() => { pushCTA('nav') }} className="btn btn-green" style={{ fontSize: 14, padding: '10px 20px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Criar conta grátis <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    </header>
  )
}

// ── Hero ─────────────────────────────────────────────────────
function THero({ onCTA }) {
  return (
    <section className="thero" id="topo">
      <span className="glow g1" />
      <span className="glow g2" />
      <div className="wrap">
        <div className="thero-grid">
          <div className="thero-copy">
            <Reveal>
              <span className="t-kick"><span className="dot" /> Sistema para oficina mecânica</span>
            </Reveal>
            <Reveal delay={60}>
              <h1>A oficina mais organizada da cidade <span className="hl">pode ser a sua</span>.</h1>
            </Reveal>
            <Reveal delay={100}>
              <p className="t-sub">
                Orçamento aprovado pelo WhatsApp num toque, OS digital, estoque e financeiro
                numa tela só. O BoxCerto faz a sua oficina trabalhar como as grandes — sem a
                complicação delas.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="thero-cta">
                <Link to="/cadastro" onClick={() => pushCTA('hero')} className="btn btn-green btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  Criar minha conta grátis <ArrowRight />
                </Link>
                <span className="thero-micro">
                  <Shield style={{ width: 15, height: 15, color: '#4ade80' }} />
                  Pronto em 2 minutos
                  <span className="sep" />
                  Sem complicação
                  <span className="sep" />
                  Cancele quando quiser
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={80} className="thero-visual">
            <img className="device" src="/hero-device.png" alt="BoxCerto no computador e no celular" width="1448" height="1086" />
            <div className="thero-float f-approved">
              <div className="approved-pill">
                <span className="check"><Check /></span>
                Cliente aprovou
                <span className="ap-time">hoje 23:50</span>
              </div>
            </div>
            <div className="thero-float f-fin">
              <div className="ft-lbl">Financeiro do mês</div>
              <div className="ft-val"><span className="g">R$ 17.994</span></div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ── Como funciona — variante SEM "sem cartão" ────────────────
const TSTEPS = [
  { n: 'PASSO 01', h: 'Crie sua conta', p: 'Você cria a conta e já entra na sua oficina. Sem instalação, sem enrolação.', tag: 'pronto em 2 minutos', green: false, Ic: ClipboardList },
  { n: 'PASSO 02', h: 'Cadastre o primeiro carro', p: 'Monte a OS com peças e serviços. É tão simples que não precisa de manual nem treinamento.', tag: 'no primeiro dia', green: false, Ic: Wrench },
  { n: 'PASSO 03', h: 'Mande o orçamento no Whats', p: 'O cliente aprova pelo link num toque e você já começa o serviço. Sua oficina rodando melhor na hora.', tag: 'orçamento aprovado', green: true, Ic: WhatsappIcon },
]

function TSteps() {
  return (
    <section className="section how" id="como-funciona">
      <div className="wrap">
        <Reveal className="section-head center">
          <span className="eyebrow">Como funciona</span>
          <h2 className="h-section">Da bagunça à oficina organizada em 3 passos</h2>
          <p className="lead">Sem treinamento longo, sem enrolação. Se você usa WhatsApp, você usa o BoxCerto.</p>
        </Reveal>
        <div className="steps-row tsteps-row">
          {TSTEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80} className={`step-card${s.green ? ' green' : ''}`}>
              <div className="sn">{s.n}</div>
              <div className="sic"><s.Ic style={{ width: 23, height: 23 }} /></div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── WhatsApp Demo (idêntico ao Landing.jsx) ──────────────────
function WhatsappDemo() {
  const [step, setStep] = useState(0)
  const timers = useRef([])

  const run = () => {
    timers.current.forEach(clearTimeout)
    setStep(0)
    const seq = [[1, 500], [2, 1700], [3, 2900], [4, 4400], [5, 5300]]
    timers.current = seq.map(([s, t]) => setTimeout(() => setStep(s), t))
  }

  useEffect(() => {
    run()
    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="section wa-sec" id="whatsapp">
      <span className="glow g1" />
      <div className="wrap">
        <div className="wa-grid">
          <div className="wa-copy">
            <span className="kicker green"><span className="dot" /> Como funciona na prática</span>
            <h2 className="h-section">Mandou o link pelo WhatsApp. O cliente aprova em segundos.</h2>
            <p className="lead">
              Você monta a OS com peças e serviços, toca em "Enviar para cliente" e o BoxCerto
              manda o link pelo WhatsApp. O cliente abre no navegador, confere e aprova em 1 toque
              — e você é avisado na hora para começar o serviço.
            </p>
            <div className="wa-steps">
              <div className="wa-step">
                <div className="num">1</div>
                <div>
                  <div className="st-b">Você monta o orçamento</div>
                  <div className="st-p">Peças, serviços e valores direto na OS, em segundos.</div>
                </div>
              </div>
              <div className="wa-step is-wa">
                <div className="num"><WhatsappIcon /></div>
                <div>
                  <div className="st-b">Envia o link pelo WhatsApp</div>
                  <div className="st-p">Uma mensagem com o link do orçamento, em 1 toque.</div>
                </div>
              </div>
              <div className="wa-step">
                <div className="num">3</div>
                <div>
                  <div className="st-b">O cliente abre o link no navegador</div>
                  <div className="st-p">É lá que ele aprova — e acompanha o serviço depois.</div>
                </div>
              </div>
            </div>
            <Link to="/cadastro" onClick={() => pushCTA('wa-cta')} className="btn btn-green btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              <WhatsappIcon style={{ width: 18, height: 18 }} /> Quero enviar orçamentos assim
            </Link>
          </div>

          <div className="wa-demo-wrap">
            <span className="glow" />
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="wa-head">
                  <div className="av"><img src="/logo.svg" alt="" /></div>
                  <div className="htx">
                    <div className="wn">Natusch Auto Certo</div>
                    <div className="ws">conta comercial · online</div>
                  </div>
                </div>
                <div className="wa-body">
                  {step >= 1 && (
                    <div className="bubble in">
                      Boa noite, Rogério! 👋 Aqui é da Natusch Auto Certo.
                      <div className="t">23:48</div>
                    </div>
                  )}
                  {step >= 2 && (
                    <div className="bubble in">
                      Seu orçamento do Volvo XC40 ficou pronto 🧾 Toque no link pra ver e aprovar:
                      <div className="t">23:48</div>
                    </div>
                  )}
                  {step >= 3 && (
                    <div className="wa-link-msg">
                      <div className={'wa-link-card' + (step < 4 ? ' pulse' : '')}>
                        <div className="wa-link-prev">
                          <img className="lp-logo" src="/logo.svg" alt="" />
                          <div className="lp-t">
                            <b>Orçamento · Volvo XC40</b>
                            <span>boxcerto.com/o/EEE-1133</span>
                          </div>
                        </div>
                        <div className="wa-link-body">
                          <div className="lb-ti">Volvo XC40 T-5 R-Design · R$ 947,50</div>
                          <div className="lb-d">Natusch Auto Certo enviou seu orçamento</div>
                          <div className="lb-cta"><ArrowRight style={{ width: 14, height: 14 }} /> Ver e aprovar orçamento</div>
                        </div>
                      </div>
                      <div className="t">23:48</div>
                    </div>
                  )}
                  {step >= 4 && (
                    <div className="bubble out">
                      Recebi! abrindo aqui 👍
                      <div className="t read">23:49 ✓✓</div>
                    </div>
                  )}
                  {step >= 5 && (
                    <div className="wa-tap-hint"><ArrowRight style={{ width: 14, height: 14 }} /> abre no navegador →</div>
                  )}
                </div>
              </div>
              <button className="wa-replay" onClick={run}><RotateCcw style={{ width: 13, height: 13 }} /> Repetir</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Benefícios ───────────────────────────────────────────────
const FEATS = [
  { Ic: ClipboardList, cls: 'indigo', h: 'OS digital em 2 minutos',       p: 'Cadastre o carro pela placa, adicione peças e serviços. Sem papel, sem caderno.' },
  { Ic: WhatsappIcon,  cls: 'green',  h: 'Orçamento aprovado por link',    p: 'Envie por WhatsApp. O cliente abre no navegador e aprova num toque. Registrado com hora e data.' },
  { Ic: DollarSign,    cls: 'indigo', h: 'Financeiro integrado',           p: 'Cada OS quitada vira receita no financeiro. Saiba seu lucro em tempo real, sem planilha.' },
  { Ic: Package,       cls: 'amber',  h: 'Estoque com alerta',             p: 'Controle quantidade, custo e margem. Alerta automático quando alguma peça está acabando.' },
  { Ic: Users,         cls: 'sky',    h: 'Histórico por cliente',          p: 'Todos os serviços, peças e quilometragem de cada veículo, sempre à mão.' },
  { Ic: Smartphone,    cls: 'green',  h: 'Celular e computador',           p: 'Acesse pela bancada ou pelo escritório. Sincronizado em tempo real, sem instalar nada.' },
]

function TBenefits() {
  return (
    <section className="section bg-soft" id="funcionalidades">
      <div className="wrap">
        <Reveal className="section-head center">
          <span className="eyebrow">Tudo num lugar só</span>
          <h2 className="h-section">A oficina inteira em um app</h2>
          <p className="lead">Do orçamento ao financeiro — num sistema simples, feito pra quem está com a mão na graxa.</p>
        </Reveal>
        <div className="feat-grid">
          {FEATS.map((f, i) => (
            <Reveal key={f.h} delay={i * 60} className="card feat-card">
              <div className={`feat-ic ${f.cls}`}><f.Ic style={{ width: 25, height: 25 }} /></div>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Stats band ───────────────────────────────────────────────
const STATS = [
  { num: '2', unit: ' min', label: 'para criar um orçamento' },
  { num: '1', unit: ' toque', label: 'para o cliente aprovar' },
  { num: '4,9', unit: '★', label: 'de avaliação média' },
  { num: '100', unit: '%', label: 'na nuvem, sem instalar nada' },
]

function TStats() {
  return (
    <div className="t-statsband">
      <div className="wrap">
        <div className="t-stats-grid">
          {STATS.map(({ num, unit, label }, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="t-stat-num">{num}<span className="t-stat-unit">{unit}</span></div>
              <div className="t-stat-label">{label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Depoimentos ──────────────────────────────────────────────
const AVATAR_GRAD = [['#1565C0','#0D47A1'],['#6A1B9A','#4A148C'],['#B71C1C','#7F0000']]

function WppCard({ nome, tipo, cidade, mensagem, hora, gradIdx = 0 }) {
  const [c1, c2] = AVATAR_GRAD[gradIdx % AVATAR_GRAD.length]
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#075E54' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
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
      <div className="p-4" style={{ background: '#E5DDD5' }}>
        <div className="text-center mb-3">
          <span className="bg-black/15 text-white text-[9px] px-2 py-0.5 rounded-full">HOJE</span>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5"
            style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
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

const TESTIMONIALS = [
  { nome: 'João Batista R.', tipo: 'Mecânica Geral', cidade: 'Curitiba, PR', hora: '09:14', mensagem: 'cara o sistema me salvou semana passada\n\ncliente chegou aqui falando que não tinha autorizado a troca de embreagem. abri o boxcerto, mostrei pra ele: nome dele, data, horário. ele ficou sem palavras e pagou na hora kkkk', gradIdx: 0 },
  { nome: 'Adriana F.', tipo: 'Auto Elétrica', cidade: 'Goiânia, GO', hora: '14:22', mensagem: "trabalho sozinha e ficava quase 1h por dia atendendo telefone de 'meu carro tá pronto?'\n\nagora mando o link com o status em 5 segundos e volto pro serviço. mudou meu dia completamente ⚡", gradIdx: 1 },
  { nome: 'Paulo R.', tipo: 'Ar Condicionado Auto', cidade: 'São Paulo, SP', hora: '18:05', mensagem: 'descobri que tava lucrando 30% menos do que achava porque não separava custo de peça do valor cobrado\n\no financeiro do sistema mostrou exatamente onde o dinheiro tava indo. agora sei o que ganho em cada carro', gradIdx: 2 },
]

function TTestimonials() {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="section-head center">
          <span className="eyebrow">Quem usa, recomenda</span>
          <h2 className="h-section">Oficinas mais organizadas, donos mais tranquilos</h2>
        </Reveal>
        <div className="tst-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.nome} delay={i * 80}><WppCard {...t} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing ──────────────────────────────────────────────────
const PRICE_FEATS = [
  'OS, Orçamento, Estoque e Financeiro — tudo incluso',
  'Orçamento aprovado por link no WhatsApp',
  'Clientes, veículos e relatórios ilimitados',
  'Funciona no celular e no computador',
  'Suporte humano de verdade, em português',
]

function TPricing() {
  return (
    <section className="section pricing" id="precos" style={{ background: 'var(--ink)', position: 'relative', overflow: 'hidden' }}>
      <span className="glow g1" style={{ background: 'rgba(34,197,94,.18)', top: -200, right: -100 }} />
      <div className="wrap">
        <Reveal className="section-head center" style={{ '--h-section-color': '#fff' }}>
          <span className="eyebrow" style={{ color: '#6ee7a0' }}>Comece agora</span>
          <h2 className="h-section" style={{ color: '#fff' }}>Tudo que sua oficina precisa por menos que uma troca de óleo por mês.</h2>
          <p className="lead" style={{ color: '#aab0d8' }}>Crie sua conta e use o sistema completo. Simples a ponto da oficina inteira usar no primeiro dia.</p>
        </Reveal>

        <Reveal delay={80}>
          <div className="tprice-wrap">
            <div className="tprice-card">
              <span className="pc-glow" />
              <div className="pc-in">
                <span className="pc-badge"><BoltIcon /> COMECE GRÁTIS</span>
                <div className="pc-free">Sua oficina organizada por <span className="u">R$ 79,90/mês</span></div>
                <div className="pc-after">No plano anual (ou R$ 97/mês no mensal). <b>Comece grátis</b> e cancele quando quiser.</div>
                <div className="pc-feats">
                  {PRICE_FEATS.map(f => (
                    <div key={f} className="pc-feat">
                      <span className="ck"><Check /></span> {f}
                    </div>
                  ))}
                </div>
                <Link to="/cadastro" onClick={() => pushCTA('pricing')} className="btn btn-green btn-lg pc-cta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  Criar minha conta grátis <ArrowRight />
                </Link>
                <div className="tprice-guarantee">
                  <ShieldLockIcon />
                  <div className="tg-tx">Sem fidelidade. <b>Cancele em 1 clique</b>, sem multa e sem precisar ligar.</div>
                </div>
              </div>
            </div>
            <div className="tprice-mini">
              <span>Anual</span><span className="pm-price">R$ 79,90/mês</span>
              <span className="dot-sep" />
              <span>Mensal</span><span className="pm-price">R$ 97</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── FAQ ──────────────────────────────────────────────────────
const TQA = [
  ['É difícil de usar? Não entendo muito de sistema.', 'Foi feito pra quem toca a oficina, não pra quem entende de computador. Se você usa WhatsApp, você usa o BoxCerto. A maioria cadastra o primeiro carro em poucos minutos, sem manual e sem treinamento.'],
  ['Como o cliente aprova o orçamento?', 'Você manda um link pelo WhatsApp. O cliente abre no navegador, confere peças e valores e aprova num toque — e você é avisado na hora pra começar o serviço. A aprovação fica registrada com nome, data e hora.'],
  ['Serve pra minha oficina, mesmo sendo pequena?', 'Serve. Atende mecânica, funilaria e pintura, auto elétrica, troca de óleo, motos, centro automotivo e também quem trabalha sozinho. Funciona no celular e no computador, sincronizado.'],
  ['Como começo e posso cancelar quando quiser?', 'Você cria a conta e já começa a usar o sistema completo. Não tem fidelidade nem multa — se quiser parar, é 1 clique no painel, sem precisar ligar. Seus dados ficam salvos se decidir voltar depois.'],
]

function TFaqItem({ q, a, open, onClick }) {
  const ref = useRef(null)
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={onClick}>
        {q}
        <span className="pm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </span>
      </button>
      <div className="faq-a" style={{ maxHeight: open && ref.current ? ref.current.scrollHeight + 'px' : '0px' }}>
        <div className="inner" ref={ref}>{a}</div>
      </div>
    </div>
  )
}

function TFaq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <Reveal className="section-head center">
          <span className="eyebrow">Sem letra miúda</span>
          <h2 className="h-section">As perguntas que todo dono de oficina faz</h2>
        </Reveal>
        <div className="faq-wrap">
          {TQA.map(([q, a], i) => (
            <TFaqItem key={i} q={q} a={a} open={open === i} onClick={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer mínimo ────────────────────────────────────────────
function TFooter() {
  return (
    <footer className="tfooter">
      <div className="wrap">
        <div className="tfooter-inner">
          <Link to="/" className="tbrand">
            <img src="/logo.svg" alt="BoxCerto" width="28" height="28" style={{ borderRadius: 7 }} />
            <span className="wm">Box<b>Certo</b></span>
          </Link>
          <div className="tf-copy">© {new Date().getFullYear()} BoxCerto · Sistema de gestão para oficinas</div>
          <div className="tf-links">
            <Link to="/termos" style={{ color: '#aab0cf', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Termos</Link>
            <Link to="/privacidade" style={{ color: '#aab0cf', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Sticky CTA (só mobile) ───────────────────────────────────
function TSticky() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    document.body.classList.add('has-tsticky')
    const onScroll = () => setShow(window.scrollY > 560)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.body.classList.remove('has-tsticky')
    }
  }, [])

  return (
    <div className={`tsticky${show ? ' show' : ''}`}>
      <div className="ts-tx">
        <b>Crie sua conta grátis</b>
        <span>Pronto em 2 minutos · cancele quando quiser</span>
      </div>
      <Link to="/cadastro" onClick={() => pushCTA('sticky')} className="btn btn-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 12 }}>
        Criar conta <ArrowRight style={{ width: 15, height: 15 }} />
      </Link>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────
export default function LandingPago() {
  usePageView('/comecar')
  usePageMeta({
    title: 'BoxCerto — Sistema para oficinas mecânicas',
    description: 'Orçamento aprovado pelo WhatsApp, OS digital, financeiro e estoque. A oficina mais organizada da cidade pode ser a sua.',
    canonical: 'https://boxcerto.com/comecar',
  })

  // noindex — página de tráfego pago não deve competir com a home no orgânico
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => { if (document.head.contains(meta)) document.head.removeChild(meta) }
  }, [])

  return (
    <div className="lp">
      <style>{CSS}</style>

      <TAnnounce />
      <TNav />
      <THero />
      <TSteps />
      <WhatsappDemo />
      <TBenefits />
      <TStats />
      <TTestimonials />
      <TPricing />
      <TFaq />
      <TFooter />
      <TSticky />
    </div>
  )
}
