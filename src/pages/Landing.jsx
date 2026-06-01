import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, hasAccess } from '../contexts/AuthContext'
import { useConfig } from '../hooks/useConfig'
import { usePageView } from '../hooks/usePageView'
import { usePageMeta } from '../hooks/usePageMeta'
import {
  Wrench, Send, Check, FileText, Users, Package,
  TrendingUp, FileBarChart2, ShieldCheck, Clock, Bell,
  ArrowRight, ChevronRight, Plus, Menu, X as XIcon,
  RotateCcw, Star,
} from 'lucide-react'
import '../styles/landing.css'

const WPP = 'https://wa.me/5553997065725?text=Ol%C3%A1%2C%20tenho%20d%C3%BAvidas%20sobre%20o%20BoxCerto!'

/* ── Custom SVG icons ─────────────────────────────────────── */
function WhatsappIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.06c-.25.69-1.44 1.32-1.99 1.4-.51.08-1.15.11-1.86-.12-.43-.13-.98-.31-1.69-.62-2.97-1.28-4.9-4.27-5.05-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.59-.37.79-.37.2 0 .39.002.57.01.18.008.43-.07.67.51.25.6.84 2.07.91 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.49-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.39-.25.66-.15.27.1 1.7.8 1.99.95.3.15.49.22.56.34.07.13.07.72-.18 1.41Z" />
    </svg>
  )
}
function BoltFill(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  )
}

/* ── Plate component ──────────────────────────────────────── */
function Plate({ num, sm }) {
  return (
    <div className={'plate' + (sm ? ' sm' : '')}>
      <div className="plate-strip" />
      <div className="plate-num">{num}</div>
      {!sm && <div className="plate-country">BRASIL</div>}
    </div>
  )
}

/* ── Nav ──────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const links = [
    ['Funcionalidades', '#funcionalidades'],
    ['Como funciona', '#como-funciona'],
    ['Para quem', '#para-quem'],
    ['Preços', '#precos'],
  ]

  return (
    <>
      <header className={'nav' + (scrolled ? ' scrolled' : '')}>
        <div className="wrap nav-inner">
          <a href="#topo" className="brand" onClick={() => setOpen(false)}>
            <img src="/logo.svg" alt="BoxCerto" width={34} height={34} />
            <span className="wm">Box<b>Certo</b></span>
          </a>
          <nav className="nav-links">
            {links.map(([t, h]) => <a key={h} href={h}>{t}</a>)}
          </nav>
          <div className="nav-cta">
            <Link className="login" to="/login">Entrar</Link>
            <Link className="btn btn-primary" to="/cadastro">
              Começar grátis <ArrowRight />
            </Link>
            <button
              className="nav-burger"
              onClick={() => setOpen(o => !o)}
              aria-label="Menu"
            >
              {open ? <XIcon /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <div className={'mobile-menu' + (open ? ' open' : '')}>
        {links.map(([t, h]) => (
          <a key={h} href={h} onClick={() => setOpen(false)}>{t}</a>
        ))}
        <div className="mm-cta">
          <Link className="mm-enter" to="/login" onClick={() => setOpen(false)}>Entrar</Link>
          <Link className="btn btn-primary btn-lg btn-block" to="/cadastro" onClick={() => setOpen(false)}>
            Começar teste grátis
          </Link>
        </div>
      </div>
    </>
  )
}

/* ── Hero ─────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="hero" id="topo">
      <span className="glow g1" />
      <span className="glow g2" />
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="kicker">
              <span className="dot" /> Gestão de oficina + orçamento no WhatsApp
            </span>
            <h1 className="h-display">
              O orçamento da sua oficina,{' '}
              <span className="wa">aprovado pelo WhatsApp</span> em 1 clique.
            </h1>
            <p className="lead">
              Monte a OS e envie o orçamento por um link no WhatsApp. O cliente abre, aprova em
              1 clique e acompanha o serviço até a retirada — tudo registrado com data e hora.
              Mais clientes, estoque e financeiro num app feito pra oficina.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary btn-lg" href="#precos">
                Começar teste grátis de 7 dias <ArrowRight />
              </a>
              <a className="btn btn-ghost btn-lg" href="#whatsapp">
                Ver como funciona
              </a>
            </div>
            <div className="trust-line">
              <span className="ti"><Check /> Sem cartão de crédito</span>
              <span className="ti"><Check /> Pronto em 2 minutos</span>
              <span className="ti"><Check /> Cancele quando quiser</span>
            </div>
            <div className="hero-rating">
              <div className="avs">
                <span>RK</span><span>AF</span><span>LL</span><span>GP</span>
              </div>
              <div>
                <div className="stars">★★★★★</div>
                <div className="rate-txt">Usada por oficinas de <b>todo o Brasil</b></div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="device"
              src="/hero-device.png"
              alt="BoxCerto no notebook e no celular"
              width={1448}
              height={1086}
            />
            <div className="hero-float f-approved">
              <div className="approved-pill">
                <span className="check"><Check /></span>
                Aprovado
                <span className="ap-time">16/05 23:50</span>
              </div>
            </div>
            <div className="hero-float f-plate">
              <Plate num="QPL-4I82" sm />
              <div className="fp-txt">
                <b>Fiat Argo 1.0</b>
                <span>R$ 320,00 · pronto</span>
              </div>
            </div>
          </div>
        </div>

        <div className="types-strip">
          <div className="ts-label">Feito para todo tipo de oficina</div>
          <div className="ts-row">
            {[
              ['Mecânica', <Wrench key="w1" />],
              ['Funilaria e pintura', <BoltFill key="b1" />],
              ['Auto elétrica', <BoltFill key="b2" />],
              ['Troca de óleo', <Package key="p1" />],
              ['Centro automotivo', <ShieldCheck key="s1" />],
              ['Motos', <Wrench key="w2" />],
              ['Autônomos', <Users key="u1" />],
            ].map(([t, ic]) => (
              <span className="type-chip" key={t}>{ic} {t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── WhatsApp Demo ────────────────────────────────────────── */
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
            <span className="kicker green"><span className="dot" /> Passo 1 · Você envia</span>
            <h2 className="h-section">
              Mandou o link pelo WhatsApp. O resto corre sozinho.
            </h2>
            <p className="lead">
              O cliente sumiu no telefone? Você toca em "Enviar para cliente" e o BoxCerto manda
              uma mensagem no WhatsApp com um link do orçamento. Ele abre no navegador, confere
              peças e valores e aprova com um toque — e você é avisado na hora.
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
            <a className="btn btn-green btn-lg" href="#precos">
              <WhatsappIcon /> Quero enviar orçamentos assim
            </a>
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
                            <b>Orçamento · OS #1042</b>
                            <span>boxcerto.com/o/EEE-1133</span>
                          </div>
                        </div>
                        <div className="wa-link-body">
                          <div className="lb-ti">Volvo XC40 T-5 R-Design · R$ 947,50</div>
                          <div className="lb-d">Natusch Auto Certo enviou seu orçamento</div>
                          <div className="lb-cta"><ArrowRight /> Ver e aprovar orçamento</div>
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
                    <div className="wa-tap-hint"><ArrowRight /> abre no navegador →</div>
                  )}
                </div>
              </div>
              <button className="wa-replay" onClick={run}><RotateCcw /> Repetir</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Client Tracking ──────────────────────────────────────── */
const STAGES = [
  { lb: 'Orçamento', sub: 'Cliente recebe e revisa', Ic: FileText },
  { lb: 'Aprovado',  sub: 'Aprova em 1 clique',      Ic: Check },
  { lb: 'Em serviço', sub: 'Acompanha o reparo',     Ic: Wrench },
  { lb: 'Pronto',    sub: 'Avisado pra retirar',      Ic: Bell },
]
const BANNERS = [
  { cls: 'amber',  Ic: Clock,      ti: 'Aguardando sua aprovação',  sub: 'Revise e aprove para iniciarmos o serviço.' },
  { cls: 'indigo', Ic: Check,      ti: 'Orçamento aprovado!',        sub: 'A oficina já foi notificada e em breve iniciará o serviço.' },
  { cls: 'blue',   Ic: Wrench,     ti: 'Veículo em serviço',         sub: 'Nossa equipe está trabalhando. Você será avisado quando estiver pronto.' },
  { cls: 'green',  Ic: Bell,       ti: 'Pronto para retirada!',      sub: 'Seu veículo está pronto. Fale com a oficina para combinar a retirada.' },
]
const TRACK_SERVICES = [
  ['Diagnóstico eletrônico', 'R$ 380,00'],
  ['Oleo 5w30 Mobil (x5)', 'R$ 239,50'],
  ['Kit Filtros Volvo 492Bx2a', 'R$ 328,00'],
]

function ClientTracking() {
  const [stage, setStage] = useState(0)
  const B = BANNERS[stage]

  return (
    <section className="section track-sec" id="acompanhamento">
      <span className="glow g1" />
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Passo 2 · O cliente abre o link</span>
          <h2 className="h-section">No navegador, ele aprova e acompanha tudo</h2>
          <p className="lead">
            O link abre uma página com a sua marca — sem app pra instalar, sem login. O cliente
            aprova o orçamento e acompanha cada etapa, do "aprovado" até "pronto para retirada".
          </p>
        </div>

        <div className="track-grid">
          <div className="track-controls">
            <div className="stage-pills">
              {STAGES.map((s, i) => (
                <button
                  key={s.lb}
                  className={'stage-pill' + (i === stage ? ' active' : i < stage ? ' done' : '')}
                  onClick={() => setStage(i)}
                >
                  <span className="sp-ic">
                    {i < stage ? <Check /> : i === stage ? <s.Ic /> : (i + 1)}
                  </span>
                  <span className="sp-tx">
                    <b>{s.lb}</b>
                    <span>{s.sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="tc-note">
              <BoltFill /> Clique nas etapas para ver o que o cliente enxerga.
            </div>
          </div>

          <div className="track-phone-wrap">
            <span className="glow" />
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="cp-browserbar">
                  <span className="bb-dots"><i /><i /><i /></span>
                  <span className="bb-url"><ShieldCheck /> boxcerto.com/o/EEE-1133</span>
                </div>
                <div className="cp-screen">
                  <div className="cp-pad">
                    <div className="cp-head">
                      <div className="cp-logo"><b>AUTO<i>CERTO</i></b></div>
                      <div>
                        <div className="cp-name">Natusch Auto Certo ltda</div>
                        <div className="cp-phone-n">(53) 3199-8786</div>
                      </div>
                    </div>

                    <div className="cp-card">
                      <div className="cp-label"><Package /> VEÍCULO</div>
                      <div className="cp-veic-row">
                        <Plate num="EEE-1133" sm />
                        <div className="cp-veic-info">
                          <b>Volvo XC 40 T-5 R-Design 2.0 252cv AWD 2018</b>
                          <span>ROGÉRIO KUND NATUSCH FILHO</span>
                        </div>
                      </div>
                    </div>

                    <div className="cp-card">
                      <div className="cp-stepper">
                        <div className="cp-step-line">
                          <div className="fill" style={{ width: (stage / 3 * 100) + '%' }} />
                        </div>
                        {STAGES.map((s, i) => (
                          <div key={s.lb} className={'cp-step' + (i === stage ? ' active' : i < stage ? ' done' : '')}>
                            <div className="cs-dot">{i < stage ? <Check /> : (i + 1)}</div>
                            <div className="cs-lb">{s.lb}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={'cp-banner ' + B.cls}>
                      <div className="cb-ic"><B.Ic /></div>
                      <div>
                        <div className="cb-ti">{B.ti}</div>
                        <div className="cb-sub">{B.sub}</div>
                      </div>
                    </div>

                    {stage === 0 ? (
                      <div className="cp-card">
                        <div className="cp-label"><Wrench /> SERVIÇOS E PEÇAS</div>
                        {TRACK_SERVICES.map(([n, v]) => (
                          <div className="cp-serv-row" key={n}><span>{n}</span><b>{v}</b></div>
                        ))}
                        <div className="cp-total">
                          <span className="lbl">Total</span>
                          <span className="val">R$ 947,50</span>
                        </div>
                      </div>
                    ) : (
                      <div className="cp-card">
                        <div className="cp-approved-row">
                          <span className="lbl">Ver orçamento aprovado</span>
                          <span className="val">R$ 947,50 <ChevronRight /></span>
                        </div>
                      </div>
                    )}

                    {stage === 0 && (
                      <>
                        <button className="cp-btn indigo cp-pulse" onClick={() => setStage(1)}>
                          <Check /> Aprovar orçamento
                        </button>
                        <button className="cp-btn ghost">
                          <span className="gico"><WhatsappIcon /></span> Tenho uma dúvida
                        </button>
                      </>
                    )}
                    {(stage === 1 || stage === 2) && (
                      <button className="cp-btn ghost">
                        <span className="gico"><WhatsappIcon /></span> Falar com a oficina
                      </button>
                    )}
                    {stage === 3 && (
                      <button className="cp-btn green">
                        <WhatsappIcon /> Falar com a oficina no WhatsApp
                      </button>
                    )}

                    <div className="cp-foot">Gerenciado por <b>BoxCerto</b> · boxcerto.com</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Features ─────────────────────────────────────────────── */
const FEATURES = [
  { Ic: Wrench,       cls: '',      h: 'Ordem de Serviço',        p: 'Controle cada carro do orçamento à entrega: pronto, em manutenção, agendado. Tudo na palma da mão.',                          tag: 'OS organizada' },
  { Ic: WhatsappIcon, cls: 'green', h: 'Orçamento no WhatsApp',   p: 'Envie por link, o cliente aprova em 1 clique e fica registrado com data e hora. Sem ligação, sem retrabalho.',                 tag: 'Aprovação em 1 clique' },
  { Ic: Users,        cls: '',      h: 'Clientes e histórico',     p: 'Cada cliente com seus veículos e tudo que já foi feito. Aniversariantes e inativos pra você chamar de volta.',                tag: 'Relacionamento' },
  { Ic: Package,      cls: 'amber', h: 'Estoque com alerta',       p: 'Saiba o que tem, o custo e a margem de cada peça. Alerta automático quando algo está acabando.',                              tag: 'Nunca falta peça' },
  { Ic: TrendingUp,   cls: 'sky',   h: 'Financeiro e lucro',       p: 'Receitas, custos de peças e despesas calculados sozinhos. Veja o lucro líquido do mês sem planilha.',                        tag: 'Lucro na tela' },
  { Ic: FileBarChart2,cls: '',      h: 'Relatórios prontos',       p: 'Serviços do mês, desempenho por técnico, clientes inativos. Os números da oficina sem dor de cabeça.',                       tag: 'Decisões com dados' },
]

function Features() {
  return (
    <section className="section bg-soft" id="funcionalidades">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Tudo num lugar só</span>
          <h2 className="h-section">A oficina inteira em um app</h2>
          <p className="lead">
            Do orçamento ao financeiro, o BoxCerto junta o que você hoje resolve em caderno,
            planilha e grupo de WhatsApp — num sistema simples, feito pra quem está com a mão na graxa.
          </p>
        </div>
        <div className="feat-grid">
          {FEATURES.map((f) => (
            <div className="card feat-card" key={f.h}>
              <div className={'feat-ic ' + f.cls}><f.Ic /></div>
              <h3>{f.h}</h3>
              <p>{f.p}</p>
              <span className="tag"><Check /> {f.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── How It Works ─────────────────────────────────────────── */
const STEPS = [
  { Ic: Wrench,  n: '01', h: 'Abra a OS',          p: 'Cadastre o carro pela placa e adicione peças e serviços. Leva segundos.' },
  { Ic: Send,    n: '02', h: 'Envie o orçamento',   p: 'Um toque em "Enviar para cliente" e o link vai pelo WhatsApp.', green: true },
  { Ic: Check,   n: '03', h: 'Cliente aprova',      p: 'Ele vê tudo e aprova em 1 clique. Você é avisado na hora.',     green: true },
  { Ic: Package, n: '04', h: 'Entregue e cobre',    p: 'Acompanhe a manutenção, entregue o veículo e o financeiro se atualiza sozinho.' },
]

function HowItWorks() {
  return (
    <section className="section how" id="como-funciona">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Como funciona</span>
          <h2 className="h-section">Da placa à aprovação em 4 passos</h2>
          <p className="lead">Sem treinamento, sem manual. Se você usa WhatsApp, você usa o BoxCerto.</p>
        </div>
        <div className="steps-row">
          {STEPS.map((s, i) => (
            <div className={'step-card' + (s.green ? ' green' : '')} key={s.n}>
              <div className="sn">PASSO {s.n}</div>
              <div className="sic"><s.Ic /></div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
              {i < STEPS.length - 1 && (
                <div className="arrow"><ArrowRight /></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Showcase ─────────────────────────────────────────────── */
function SCRow({ rev, glow, eyebrow, title, lead, bullets, img, alt }) {
  return (
    <div className={'showcase' + (rev ? ' rev' : '')}>
      <div className="sc-media">
        <span className="glow" style={{
          background: glow,
          top: rev ? '-40px' : 'auto',
          bottom: rev ? 'auto' : '-40px',
          left: rev ? 'auto' : '-40px',
          right: rev ? '-40px' : 'auto',
        }} />
        <div className="sc-frame"><img src={img} alt={alt} loading="lazy" /></div>
      </div>
      <div className="sc-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="h-section">{title}</h2>
        <p className="lead">{lead}</p>
        <div className="sc-list">
          {bullets.map((b, i) => (
            <div className="sc-li" key={i}>
              <span className="ck"><Check /></span>
              <span dangerouslySetInnerHTML={{ __html: b }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Showcase() {
  return (
    <section className="section bg-soft">
      <div className="wrap">
        <SCRow
          eyebrow="Painel da oficina"
          glow="rgba(99,102,241,.18)"
          title="Toda a oficina numa tela só"
          lead="Abriu o app e já sabe o que está rolando: quantas OS em andamento, o que está pronto pra retirar, o que está em manutenção e os orçamentos esperando resposta."
          bullets={[
            '<b>Status na hora:</b> prontos, manutenção, orçamentos e agendados.',
            '<b>Placa em destaque</b> pra achar o carro num piscar de olhos.',
            '<b>Funciona no celular e no computador</b>, sincronizado.',
          ]}
          img="/screen-oficina-desktop.png"
          alt="Painel da oficina no BoxCerto"
        />
        <SCRow
          rev
          eyebrow="Financeiro"
          glow="rgba(34,197,94,.16)"
          title="Veja o lucro do mês sem abrir planilha"
          lead="O BoxCerto soma receitas, custos de peças e despesas automaticamente. Você bate o olho e sabe quanto sua oficina lucrou de verdade no mês."
          bullets={[
            '<b>Lucro líquido</b> calculado sozinho, mês a mês.',
            '<b>Receitas, custos e despesas</b> separados e claros.',
            '<b>Vendas de estoque</b> e formas de pagamento registradas.',
          ]}
          img="/screen-financeiro.png"
          alt="Tela de financeiro do BoxCerto"
        />
        <SCRow
          eyebrow="Estoque"
          glow="rgba(245,158,11,.16)"
          title="Nunca mais descobre que acabou a peça na hora"
          lead="Controle quantidade, custo e preço de cada item. O sistema avisa quando algo está acabando — e você ainda vê a margem de cada venda."
          bullets={[
            '<b>Alerta de estoque baixo</b> automático.',
            '<b>Custo e margem</b> visíveis em cada peça.',
            '<b>Venda direta do balcão</b> entra no financeiro na hora.',
          ]}
          img="/screen-estoque.png"
          alt="Tela de estoque do BoxCerto"
        />
        <SCRow
          rev
          eyebrow="Entrega e pagamento"
          glow="rgba(34,197,94,.16)"
          title="Fechou a conta, entregou o carro — tudo registrado"
          lead="Na hora de entregar, o BoxCerto fecha a conta da OS, registra como o cliente pagou e guarda data, hora e observações da entrega. Seu caixa sempre bate no fim do dia."
          bullets={[
            '<b>PIX, dinheiro, débito, crédito</b> ou outros — você escolhe e registra.',
            '<b>Conta fechada</b> automaticamente quando o pago bate o total.',
            '<b>Data, hora e observações</b> da entrega salvas no histórico.',
          ]}
          img="/screen-entrega.png"
          alt="Tela de entrega e pagamento do BoxCerto"
        />
      </div>
    </section>
  )
}

/* ── For Whom ─────────────────────────────────────────────── */
const WHOM = [
  { Ic: Wrench,    h: 'Oficina mecânica',     p: 'Geral, motor, suspensão, freios.' },
  { Ic: BoltFill,  h: 'Funilaria e pintura',  p: 'Orçamento detalhado e aprovação rápida.' },
  { Ic: BoltFill,  h: 'Auto elétrica',        p: 'Serviços e peças sempre registrados.' },
  { Ic: Package,   h: 'Troca de óleo',        p: 'Giro rápido com estoque sob controle.' },
  { Ic: ShieldCheck,h:'Centro automotivo',    p: 'Vários serviços num fluxo só.' },
  { Ic: Wrench,    h: 'Oficina de motos',     p: 'Mesma agilidade sobre duas rodas.' },
  { Ic: Package,   h: 'Pneus e alinhamento',  p: 'Venda de balcão e OS no mesmo lugar.' },
  { Ic: Users,     h: 'Autônomo',             p: 'Profissionalize o atendimento sozinho.' },
]

function ForWhom() {
  return (
    <section className="section how" id="para-quem">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Para quem é</span>
          <h2 className="h-section">Não é só pra mecânica</h2>
          <p className="lead">
            Se você atende veículo, faz orçamento e quer parar de perder dinheiro na
            desorganização, o BoxCerto é pra você.
          </p>
        </div>
        <div className="whom-grid">
          {WHOM.map((w) => (
            <div className="whom-card" key={w.h}>
              <div className="wic"><w.Ic /></div>
              <b>{w.h}</b>
              <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '5px' }}>{w.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Testimonials (WhatsApp-style cards) ──────────────────── */
const AVATAR_GRAD = [
  ['#1565C0', '#0D47A1'],
  ['#6A1B9A', '#4A148C'],
  ['#B71C1C', '#7F0000'],
]

function WppCard({ nome, tipo, cidade, mensagem, hora, gradIdx = 0 }) {
  const [c1, c2] = AVATAR_GRAD[gradIdx % AVATAR_GRAD.length]
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
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
          {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
        </div>
      </div>
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

const TESTIMONIALS = [
  {
    nome: 'João Batista R.',
    tipo: 'Mecânica Geral',
    cidade: 'Curitiba, PR',
    hora: '09:14',
    mensagem: 'cara o sistema me salvou semana passada\n\ncliente chegou aqui falando que não tinha autorizado a troca de embreagem. abri o boxcerto, mostrei pra ele: nome dele, data, horário. ele ficou sem palavras e pagou na hora kkkk',
    gradIdx: 0,
  },
  {
    nome: 'Adriana F.',
    tipo: 'Auto Elétrica',
    cidade: 'Goiânia, GO',
    hora: '14:22',
    mensagem: "trabalho sozinha e ficava quase 1h por dia atendendo telefone de 'meu carro tá pronto?'\n\nagora mando o link com o status em 5 segundos e volto pro serviço. mudou meu dia completamente ⚡",
    gradIdx: 1,
  },
  {
    nome: 'Paulo R.',
    tipo: 'Ar Condicionado Auto',
    cidade: 'São Paulo, SP',
    hora: '18:05',
    mensagem: 'descobri que tava lucrando 30% menos do que achava porque não separava custo de peça do valor cobrado\n\no financeiro do sistema mostrou exatamente onde o dinheiro tava indo. agora sei o que ganho em cada carro',
    gradIdx: 2,
  },
]

function Testimonials() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Quem usa, recomenda</span>
          <h2 className="h-section">Oficinas mais organizadas, donos mais tranquilos</h2>
        </div>
        <div className="tst-grid">
          {TESTIMONIALS.map((t) => <WppCard key={t.nome} {...t} />)}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ──────────────────────────────────────────────── */
function Pricing({ config }) {
  const pMonthly = Math.round(Number(config?.price_monthly) || 97)
  const pAnnualMonthly = Number(config?.price_annual_monthly) || 79.90
  const pAnnual = Number(config?.price_annual) || 958.80
  const savings = (pMonthly * 12 - pAnnual).toFixed(2).replace('.', ',')
  const [annualInt, annualDec] = pAnnualMonthly.toFixed(2).split('.')

  const mensalFeats = [
    'OS, Orçamento, Estoque e Financeiro',
    'Orçamento por link no WhatsApp',
    'Página de acompanhamento pro cliente',
    'Relatórios e clientes ilimitados',
    'Suporte humano em português',
  ]
  const anualFeats = [
    ['Tudo do plano mensal', true],
    ['Migração da sua planilha sem custo', false],
    ['Treinamento de equipe (1h por chamada)', false],
    ['Suporte prioritário no WhatsApp', false],
    ['Garantia: não gostou em 30 dias, devolvemos', false],
  ]

  return (
    <section className="section bg-soft pricing" id="precos">
      <span className="glow g1" />
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Preço de oficina, não de software de empresa grande</span>
          <h2 className="h-section">Menos que o custo de uma troca de óleo por mês.</h2>
          <p className="lead">7 dias grátis pra testar. Sem cartão. Cancela quando quiser, sem multa.</p>
        </div>

        <div className="price-grid">
          {/* Mensal */}
          <div className="plan light">
            <div className="pl-in">
              <div className="pl-name">Mensal</div>
              <div className="pl-tag">Flexibilidade total. Pague mês a mês.</div>
              <div className="pl-amt">
                <span className="cur">R$</span>
                <span className="num">{pMonthly}</span>
                <span className="per">/mês</span>
              </div>
              <div className="pl-feats">
                {mensalFeats.map((f) => (
                  <div className="pl-feat" key={f}>
                    <span className="ck"><Check /></span> {f}
                  </div>
                ))}
              </div>
              <a className="btn btn-dark btn-lg btn-block pl-cta" href="/cadastro">Começar grátis</a>
            </div>
          </div>

          {/* Anual */}
          <div className="plan dark">
            <span className="pl-clip"><span className="pl-glow" /></span>
            <div className="pl-badge">MAIS ESCOLHIDO</div>
            <div className="pl-in">
              <div className="pl-name">Anual</div>
              <div className="pl-tag">2 meses grátis. Pagamento à vista ou parcelado.</div>
              <div className="pl-amt">
                <span className="cur">R$</span>
                <span className="num">{annualInt}</span>
                <span className="dec">,{annualDec}</span>
                <span className="per">/mês</span>
              </div>
              <div className="pl-save"><BoltFill /> Economia de R$ {savings}/ano</div>
              <div className="pl-feats">
                {anualFeats.map(([f, bold]) => (
                  <div className="pl-feat" key={f}>
                    <span className="ck"><Check /></span>
                    {bold ? <b>{f}</b> : f}
                  </div>
                ))}
              </div>
              <a className="btn btn-primary btn-lg btn-block pl-cta" href="/cadastro">Começar grátis</a>
            </div>
          </div>
        </div>

        <div className="price-foot">Sem fidelidade · Sem multa de cancelamento · Cancela direto no painel</div>
      </div>
    </section>
  )
}

/* ── FAQ ──────────────────────────────────────────────────── */
const QA = [
  ['Preciso colocar cartão de crédito pra testar?',
   'Não. O teste de 7 dias é grátis e liberado com tudo. Você só decide assinar se gostar — e configura o pagamento depois, quando quiser.'],
  ['Funciona no celular?',
   'Sim. O BoxCerto funciona no celular e no computador, sincronizado. Você abre a oficina no balcão e acompanha tudo pelo telefone quando sai.'],
  ['Como o cliente aprova o orçamento?',
   'Você toca em "Enviar para cliente" e o orçamento vai por um link no WhatsApp. O cliente abre, confere peças e valores e aprova em 1 clique. A aprovação fica registrada com nome, data e hora.'],
  ['Serve só pra oficina mecânica?',
   'Não. Atende mecânica, funilaria e pintura, auto elétrica, troca de óleo, centro automotivo, oficina de motos, pneus e também profissionais autônomos.'],
  ['Meus dados ficam seguros?',
   'Sim. Suas informações ficam guardadas com segurança e backup automático. Seus clientes, OS e financeiro não se perdem se o celular quebrar.'],
  ['Consigo cancelar quando quiser?',
   'Sim. Não tem fidelidade nem multa. Se decidir parar, é só cancelar — sem burocracia.'],
]

function FaqItem({ q, a, open, onClick }) {
  const ref = useRef(null)
  return (
    <div className={'faq-item' + (open ? ' open' : '')}>
      <button className="faq-q" onClick={onClick}>
        {q}
        <span className="pm"><Plus /></span>
      </button>
      <div
        className="faq-a"
        style={{ maxHeight: open && ref.current ? ref.current.scrollHeight + 'px' : '0px' }}
      >
        <div className="inner" ref={ref}>{a}</div>
      </div>
    </div>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Dúvidas</span>
          <h2 className="h-section">Perguntas frequentes</h2>
        </div>
        <div className="faq-wrap">
          {QA.map(([q, a], i) => (
            <FaqItem
              key={i}
              q={q}
              a={a}
              open={open === i}
              onClick={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Final CTA ────────────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="section final-cta">
      <span className="glow g1" />
      <span className="glow g2" />
      <div className="wrap">
        <div className="final-inner">
          <span className="kicker green" style={{
            background: 'rgba(34,197,94,.14)',
            borderColor: 'rgba(34,197,94,.3)',
            color: '#86efac',
          }}>
            <span className="dot" /> Sua oficina mais organizada hoje
          </span>
          <h2 style={{ marginTop: '20px' }}>
            Comece o teste grátis e mande seu primeiro orçamento ainda hoje.
          </h2>
          <p>
            Leva 2 minutos pra configurar. Sem cartão, sem compromisso —
            só a sua oficina rodando melhor.
          </p>
          <div className="final-cta-btns">
            <a className="btn btn-primary btn-lg" href="/cadastro">
              Começar teste grátis de 7 dias <ArrowRight />
            </a>
            <a className="btn btn-green btn-lg" href={WPP} target="_blank" rel="noreferrer">
              <WhatsappIcon /> Falar no WhatsApp
            </a>
          </div>
          <div className="trust-line">
            <span className="ti"><Check /> Sem cartão</span>
            <span className="ti"><Check /> 7 dias grátis</span>
            <span className="ti"><Check /> Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────── */
const FOOTER_COLS = [
  ['Produto',  ['Funcionalidades', 'Como funciona', 'Para quem', 'Preços']],
  ['Empresa',  ['Sobre', 'Blog', 'Contato', 'Seja parceiro']],
  ['Suporte',  ['Central de ajuda', 'WhatsApp', 'Status', 'Treinamentos']],
]

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="f-brand">
            <a className="brand" href="#topo">
              <img src="/logo.svg" alt="BoxCerto" width={34} height={34} />
              <span className="wm">Box<b>Certo</b></span>
            </a>
            <p>Gestão de oficina de verdade: orçamento aprovado pelo WhatsApp, OS, clientes, estoque e financeiro num app só.</p>
            <a className="f-wa" href={WPP} target="_blank" rel="noreferrer">
              <WhatsappIcon /> Falar com a gente no WhatsApp
            </a>
          </div>
          {FOOTER_COLS.map(([h, items]) => (
            <div className="f-col" key={h}>
              <h5>{h}</h5>
              {items.map((it) => <a href="#" key={it}>{it}</a>)}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <div>© 2026 BoxCerto · Gestão de oficina mecânica online</div>
          <div className="fb-links">
            <a href="#">Termos</a>
            <a href="#">Privacidade</a>
            <a href="#">LGPD</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ── Main Landing component ───────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const config = useConfig()

  usePageView('/landing')
  usePageMeta({
    title: 'BoxCerto — Gestão de Oficina Mecânica Online',
    description: 'Envie orçamentos por link no WhatsApp, cliente aprova em 1 clique. Controle OS, clientes, estoque e financeiro. Teste grátis 7 dias — sem cartão.',
    canonical: 'https://boxcerto.com',
  })

  // Auth redirect
  useEffect(() => {
    if (loading || !user) return
    if (user.isAdmin)   { navigate('/admin',      { replace: true }); return }
    if (user.isTecnico) { navigate('/tecnico',    { replace: true }); return }
    if (hasAccess(user)){ navigate('/app/oficina', { replace: true }); return }
    navigate('/renovar', { replace: true })
  }, [user, loading, navigate])

  // Scroll reveal (ported from design's app.jsx)
  useEffect(() => {
    const blocks = []

    document.querySelectorAll(
      '.lp .section-head, .lp .hero-copy, .lp .hero-visual, .lp .wa-copy, .lp .wa-demo-wrap, .lp .track-controls, .lp .track-phone-wrap, .lp .sc-copy, .lp .sc-media, .lp .types-strip'
    ).forEach((el) => blocks.push(el))

    document.querySelectorAll(
      '.lp .feat-grid, .lp .steps-row, .lp .whom-grid, .lp .tst-grid, .lp .faq-wrap, .lp .ts-row, .lp .final-inner'
    ).forEach((grid) => {
      Array.from(grid.children).forEach((child, i) => {
        child.style.animationDelay = Math.min(i * 70, 420) + 'ms'
        blocks.push(child)
      })
    })

    blocks.forEach((el) => el.classList.add('reveal'))

    let pending = new Set(blocks)

    const show = (el) => {
      el.classList.add('in')
      pending.delete(el)
      const cleanup = () => {
        el.classList.remove('reveal', 'in')
        el.style.animationDelay = ''
      }
      el.addEventListener('animationend', cleanup, { once: true })
      setTimeout(cleanup, 1500)
    }

    let ticking = false
    const sweep = () => {
      ticking = false
      const vh = window.innerHeight || document.documentElement.clientHeight
      pending.forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.90) show(el)
      })
      if (!pending.size) teardown()
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(sweep) } }

    let io = null
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) show(e.target) })
        if (!pending.size) teardown()
      }, { threshold: 0.06, rootMargin: '0px 0px -8% 0px' })
      blocks.forEach((el) => io.observe(el))
    }

    function teardown() {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.removeEventListener('scroll', onScroll, true)
      if (io) io.disconnect()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    document.addEventListener('scroll', onScroll, true)
    sweep() // reveal above-the-fold immediately

    return teardown
  }, [])

  return (
    <div className="lp" style={{ fontFamily: 'var(--font-body)', color: 'var(--slate-700)', background: '#fff', fontSize: '17px', lineHeight: '1.6', WebkitFontSmoothing: 'antialiased' }}>
      <Nav />
      <main>
        <Hero />
        <WhatsappDemo />
        <ClientTracking />
        <Features />
        <HowItWorks />
        <Showcase />
        <ForWhom />
        <Testimonials />
        <Pricing config={config} />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
