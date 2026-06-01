import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { usePageView } from '../hooks/usePageView'
import { useConfig } from '../hooks/useConfig'
import {
  ArrowRight, Check, X as XIcon, Wrench, Zap, Package, TrendingUp,
  FileText, Users, Smartphone, ShieldCheck, Clock, RotateCcw, Plus,
} from 'lucide-react'
import '../styles/landing-pequena.css'

const SIGNUP = '/cadastro'
const WPP    = 'https://wa.me/5553997065725?text=Quero%20testar%20o%20BoxCerto%20na%20minha%20oficina'

/* ── Custom SVGs ──────────────────────────────────────────── */
function WaIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.06c-.25.69-1.44 1.32-1.99 1.4-.51.08-1.15.11-1.86-.12-.43-.13-.98-.31-1.69-.62-2.97-1.28-4.9-4.27-5.05-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.59-.37.79-.37.2 0 .39.002.57.01.18.008.43-.07.67.51.25.6.84 2.07.91 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.49-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.39-.25.66-.15.27.1 1.7.8 1.99.95.3.15.49.22.56.34.07.13.07.72-.18 1.41Z" />
    </svg>
  )
}

/* ── Announce bar ─────────────────────────────────────────── */
function Announce() {
  return (
    <div className="announce">
      <span className="pulse-dot" />
      <span><b>7 dias grátis</b> com tudo liberado · <span className="ann-strong">sem cartão de crédito</span></span>
    </div>
  )
}

/* ── Nav (slim, single CTA) ───────────────────────────────── */
function LpNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <header className={'lpnav' + (scrolled ? ' scrolled' : '')}>
      <div className="wrap lpnav-inner">
        <a className="brand" href="#topo">
          <img src="/logo.svg" alt="BoxCerto" width={34} height={34} />
          <span className="wm">Box<b>Certo</b></span>
        </a>
        <Link className="btn btn-primary" to={SIGNUP}>
          Criar conta grátis <ArrowRight />
        </Link>
      </div>
    </header>
  )
}

/* ── Hero ─────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="lphero" id="topo">
      <span className="glow g1" />
      <span className="glow g2" />
      <div className="wrap">
        <div className="lphero-grid">
          <div className="lphero-copy">
            <span className="kicker"><span className="dot" /> Sistema para oficina pequena</span>
            <h1 className="h-display">
              Sua oficina organizada{' '}
              <span className="hl">sem complicação</span>, com orçamento{' '}
              <span className="wa">aprovado pelo WhatsApp</span>.
            </h1>
            <p className="lead">
              Troque o caderno e a planilha por um app simples de verdade. Faça a OS,
              mande o orçamento por um link no WhatsApp e o cliente aprova num toque.
              Feito pra quem toca a oficina no dia a dia — não pra quem entende de sistema.
            </p>
            <div className="lphero-cta">
              <Link className="btn btn-primary btn-lg" to={SIGNUP}>
                Criar conta grátis <ArrowRight />
              </Link>
              <a className="btn btn-ghost btn-lg" href="#como-funciona">
                Ver como funciona
              </a>
            </div>
            <span className="lphero-micro">
              <Check /> Sem cartão · pronto em 2 minutos · cancele quando quiser
            </span>
            <div className="lphero-proof">
              <div className="avs">
                <span>CV</span><span>AF</span><span>LL</span><span>MS</span>
              </div>
              <div className="pf-tx">
                <span className="stars">★★★★★</span> <b>4,9 de 5</b><br />
                Oficinas de todo o Brasil já organizam o dia no BoxCerto
              </div>
            </div>
          </div>

          <div className="lphero-visual">
            <img
              className="device"
              src="/hero-device.png"
              alt="BoxCerto no computador e no celular"
              width={1448} height={1086}
              loading="eager"
            />
            <div className="lphero-float f-approved">
              <div className="approved-pill">
                <span className="check"><Check /></span>
                Cliente aprovou
                <span className="ap-time">hoje 23:50</span>
              </div>
            </div>
            <div className="lphero-float f-money">
              <div className="fm-lbl">Lucro do mês</div>
              <div className="fm-val">R$ 17.994</div>
              <div className="fm-sub">no painel, sem planilha</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Trust bar ────────────────────────────────────────────── */
const TRUST_ITEMS = [
  ['Mecânica', Wrench],
  ['Funilaria e pintura', Zap],
  ['Auto elétrica', Zap],
  ['Troca de óleo', Package],
  ['Motos', Wrench],
  ['Autônomos', Users],
]

function TrustBar() {
  return (
    <div className="trustbar">
      <div className="wrap trustbar-inner">
        <span className="tb-label">Feito para a oficina pequena</span>
        {TRUST_ITEMS.map(([label, Icon]) => (
          <span className="tb-item" key={label}>
            <Icon /> {label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Pain → Solution ──────────────────────────────────────── */
const BEFORE = [
  'Orçamento no caderno, no zap solto e na cabeça — some na hora que precisa.',
  'Cliente some e você fica ligando atrás de "e aí, pode fazer?"',
  'No fim do mês não sabe se lucrou ou só trabalhou.',
  'Peça que "acabou" e parou o serviço bem no dia cheio.',
  'Histórico do carro? Só perguntando pro cliente o que já foi feito.',
]
const AFTER = [
  ['Tudo num lugar só', '— OS, clientes, estoque e financeiro no celular e no PC.'],
  ['Cliente aprova sozinho', '— o orçamento vai por link no WhatsApp e ele aprova num toque.'],
  ['Lucro na tela', '— você abre o financeiro e vê o líquido do mês na hora.'],
  ['Estoque com alerta', '— o sistema avisa antes da peça acabar.'],
  ['Histórico completo', '— cada carro com tudo que já passou na sua oficina.'],
]

function PainSolution() {
  return (
    <section className="section pain bg-soft" id="por-que">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Por que mudar</span>
          <h2 className="h-section">A bagunça custa caro. Organizar é mais simples do que parece.</h2>
          <p className="lead">Você não precisa de um sistema complicado. Precisa de um que a oficina inteira consiga usar no primeiro dia.</p>
        </div>
        <div className="pain-grid">
          <div className="pain-col before">
            <span className="pc-tag">Sua oficina hoje</span>
            <h3>Caderno, planilha e WhatsApp bagunçado</h3>
            <div className="pain-list">
              {BEFORE.map(t => (
                <div className="pain-li" key={t}>
                  <span className="pic"><XIcon /></span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pain-col after">
            <span className="pa-glow" />
            <span className="pc-tag">Com o BoxCerto</span>
            <h3>Tudo organizado, do jeito simples</h3>
            <div className="pain-list">
              {AFTER.map(([b, t]) => (
                <div className="pain-li" key={b}>
                  <span className="pic"><Check /></span>
                  <span><b>{b}</b> {t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── WhatsApp demo ────────────────────────────────────────── */
function WaDemo() {
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="section wa-sec" id="whatsapp">
      <span className="glow g1" />
      <div className="wrap">
        <div className="wa-grid">
          <div className="wa-copy">
            <span className="kicker green"><span className="dot" /> O recurso que vende sozinho</span>
            <h2 className="h-section">O cliente aprova o orçamento sem você ligar atrás.</h2>
            <p className="lead">
              Acabou a novela de ficar cobrando resposta. Você toca em "Enviar para
              cliente" e o BoxCerto manda uma mensagem no WhatsApp com um link. O cliente
              abre o link no navegador, confere peça por peça e aprova num toque — e você
              é avisado na hora pra começar o serviço.
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
                <div className="num"><WaIcon /></div>
                <div>
                  <div className="st-b">Manda o link pelo WhatsApp</div>
                  <div className="st-p">Uma mensagem com o link do orçamento, em 1 toque.</div>
                </div>
              </div>
              <div className="wa-step">
                <div className="num">3</div>
                <div>
                  <div className="st-b">O cliente abre o link e aprova</div>
                  <div className="st-p">Ele abre no navegador, aprova e acompanha o serviço até a retirada.</div>
                </div>
              </div>
            </div>
            <Link className="btn btn-green btn-lg" to={SIGNUP}>
              <WaIcon /> Quero enviar orçamentos assim
            </Link>
          </div>

          <div className="wa-demo-wrap">
            <span className="glow" />
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="wa-head">
                  <div className="av"><img src="/logo.svg" alt="" width={26} height={26} /></div>
                  <div className="htx">
                    <div className="wn">Oficina do André</div>
                    <div className="ws">conta comercial · online</div>
                  </div>
                </div>
                <div className="wa-body">
                  {step >= 1 && (
                    <div className="bubble in">
                      Boa tarde, Marcos! 👋 Aqui é da Oficina do André.
                      <div className="t">14:32</div>
                    </div>
                  )}
                  {step >= 2 && (
                    <div className="bubble in">
                      Seu orçamento do Onix ficou pronto 🧾 Toque no link pra ver e aprovar:
                      <div className="t">14:32</div>
                    </div>
                  )}
                  {step >= 3 && (
                    <div className="wa-link-msg">
                      <div className={'wa-link-card' + (step < 4 ? ' pulse' : '')}>
                        <div className="wa-link-prev">
                          <img className="lp-logo" src="/logo.svg" alt="" width={34} height={34} />
                          <div className="lp-t">
                            <b>Orçamento · OS #0231</b>
                            <span>boxcerto.com/o/MKS-0231</span>
                          </div>
                        </div>
                        <div className="wa-link-body">
                          <div className="lb-ti">Chevrolet Onix 1.0 · R$ 540,00</div>
                          <div className="lb-d">Oficina do André enviou seu orçamento</div>
                          <div className="lb-cta"><ArrowRight /> Ver e aprovar orçamento</div>
                        </div>
                      </div>
                      <div className="t">14:32</div>
                    </div>
                  )}
                  {step >= 4 && (
                    <div className="bubble out">
                      Recebi! abrindo aqui 👍
                      <div className="t read">14:33 ✓✓</div>
                    </div>
                  )}
                  {step >= 5 && (
                    <div className="wa-tap-hint"><ArrowRight /> abre no navegador →</div>
                  )}
                </div>
              </div>
              <button className="wa-replay" onClick={run}>
                <RotateCcw /> Repetir
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Como funciona ────────────────────────────────────────── */
const STEPS = [
  { n: '1', h: 'Crie sua conta grátis', p: 'Sem cartão, sem instalação. Você cria a conta e já entra na sua oficina.', t: 'leva 2 minutos', green: false },
  { n: '2', h: 'Cadastre o primeiro carro', p: 'Monte a OS com peças e serviços. O sistema é tão simples que não precisa de manual.', t: 'no primeiro dia', green: false },
  { n: '3', h: 'Mande o orçamento no Whats', p: 'O cliente aprova pelo link e você começa o serviço. Pronto — sua oficina já tá rodando melhor.', t: 'orçamento aprovado', green: true },
]

function HowItWorks() {
  return (
    <section className="section how" id="como-funciona">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Como funciona</span>
          <h2 className="h-section">Da bagunça à oficina organizada em 3 passos</h2>
          <p className="lead">Sem treinamento longo, sem enrolação. Se você usa WhatsApp, você usa o BoxCerto.</p>
        </div>
        <div className="lpsteps-row">
          {STEPS.map(s => (
            <div className={'lpstep' + (s.green ? ' green' : '')} key={s.n}>
              <div className="ls-n">{s.n}</div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
              <span className="ls-time"><Clock /> {s.t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Benefits ─────────────────────────────────────────────── */
const BENEFITS = [
  { Icon: FileText, color: '',       h: 'Ordem de serviço completa',   p: 'Peças, serviços, fotos e status do carro. Tudo registrado, nada mais no caderno.' },
  { Icon: WaIcon,   color: 'green',  h: 'Orçamento pelo WhatsApp',     p: 'O cliente aprova por um link e fica tudo registrado com nome, data e hora.' },
  { Icon: TrendingUp, color: '',     h: 'Financeiro sem planilha',      p: 'Entradas, saídas e o lucro líquido do mês na tela, automático.' },
  { Icon: Package,  color: 'amber',  h: 'Estoque com alerta',          p: 'Saiba o que tem, o que vendeu e seja avisado antes da peça acabar.' },
  { Icon: Users,    color: 'sky',    h: 'Clientes e histórico',        p: 'Todo carro com o histórico do que já passou na sua oficina.' },
  { Icon: Smartphone, color: '',     h: 'No celular e no PC',          p: 'Atende no balcão pelo computador e acompanha tudo pelo telefone quando sai.' },
]

function Benefits() {
  return (
    <section className="section" id="funcionalidades">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">O que vem junto</span>
          <h2 className="h-section">Tudo que a oficina precisa. Nada que ela não usa.</h2>
        </div>
        <div className="benefit-grid">
          {BENEFITS.map(({ Icon, color, h, p }) => (
            <div className="card benefit-card" key={h}>
              <div className={'benefit-ic' + (color ? ' ' + color : '')}><Icon /></div>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Stats band ───────────────────────────────────────────── */
const STATS = [
  { v: '2',   u: 'min',   l: 'pra criar a conta e começar a usar' },
  { v: '1',   u: 'toque', l: 'pro cliente aprovar o orçamento' },
  { v: '4,9', u: '',      l: 'de nota média das oficinas (de 5)' },
  { v: '100', u: '%',     l: 'no celular e no computador' },
]

function StatsBand() {
  return (
    <section className="section-sm statsband">
      <span className="glow g1" />
      <div className="wrap">
        <div className="statsband-grid">
          {STATS.map(s => (
            <div className="stat-cell" key={s.l}>
              <div className="sv">{s.v}{s.u && <span className="u">{s.u}</span>}</div>
              <div className="sl">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Testimonials ─────────────────────────────────────────── */
const TSTS = [
  { ini: 'CV', bg: '#4f46e5', nm: 'Cleber Vargas',   rl: 'Auto Center Vargas',       loc: 'Pelotas · RS',     q: ['O cliente ', <b key="b">aprova o orçamento pelo Whats e eu já começo o serviço</b>, '. Acabou aquela novela de ficar ligando atrás de resposta. Pra oficina pequena igual a minha, isso vale ouro.'] },
  { ini: 'AF', bg: '#0f8a4d', nm: 'André Fernandes', rl: 'Oficina do André',          loc: 'Rio Grande · RS',  q: ['Antes eu não sabia se tava lucrando. Agora abro o financeiro e ', <b key="b">vejo o líquido do mês na hora</b>, '. Larguei a planilha que vivia dando erro.'] },
  { ini: 'LL', bg: '#b4690e', nm: 'Luciano Lima',    rl: 'Centro Automotivo Lima',    loc: 'Bagé · RS',        q: ['O ', <b key="b">estoque com alerta</b>, ' foi o que me pegou. Nunca mais parei serviço porque "acabou o filtro". E é simples, meu funcionário aprendeu no primeiro dia.'] },
  { ini: 'MS', bg: '#4338ca', nm: 'Marcos Severo',   rl: 'MS Funilaria e Pintura',   loc: 'Camaquã · RS',     q: ['Eu fugia de sistema porque achava que era complicado. Esse aqui é ', <b key="b">fácil de verdade</b>, '. Em dois minutos eu tava cadastrando carro e mandando orçamento.'] },
  { ini: 'JC', bg: '#0f8a4d', nm: 'Juliano Castro',  rl: 'Auto Elétrica Castro',     loc: 'Santa Maria · RS', q: ['Meu cliente abre o link, vê tudo certinho e aprova. ', <b key="b">Passei a parecer muito mais profissional</b>, ' do que oficina que é três vezes maior que a minha.'] },
  { ini: 'PT', bg: '#b4690e', nm: 'Patrícia Teixeira', rl: 'Box 7 Troca de Óleo',   loc: 'Canoas · RS',      q: ['Giro rápido de troca de óleo precisa de agilidade. ', <b key="b">A OS sai em segundos</b>, ' e o histórico do carro fica salvo. Mudou a rotina do balcão.'] },
]

function Testimonials() {
  return (
    <section className="section bg-soft" id="depoimentos">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Quem usa, recomenda</span>
          <h2 className="h-section">Oficinas pequenas, donos mais tranquilos</h2>
          <p className="lead">Gente que troca peça e atende cliente o dia inteiro — não gente de escritório.</p>
        </div>
        <div className="lptst-grid">
          {TSTS.map(t => (
            <div className="card lptst-card" key={t.nm}>
              <div className="top">
                <span className="stars">★★★★★</span>
                <span className="verif"><ShieldCheck /> Cliente verificado</span>
              </div>
              <p className="quote">"{t.q}"</p>
              <div className="who">
                <div className="av" style={{ background: t.bg }}>{t.ini}</div>
                <div>
                  <div className="nm">{t.nm}</div>
                  <div className="rl">{t.rl} · <span className="loc">{t.loc}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Guarantee ────────────────────────────────────────────── */
function Guarantee() {
  return (
    <section className="section-sm">
      <div className="wrap">
        <div className="guarantee">
          <div className="g-ic"><ShieldCheck /></div>
          <div>
            <h3>Teste sem risco nenhum</h3>
            <p>São 7 dias grátis com tudo liberado e sem pedir cartão. Se não for pra você, é só não continuar — não cobramos nada e seus dados ficam guardados se quiser voltar depois.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ──────────────────────────────────────────────── */
const PRICE_FEATS = [
  'OS, Orçamento, Estoque e Financeiro — tudo incluso',
  'Orçamento aprovado por link no WhatsApp',
  'Página de acompanhamento pro seu cliente',
  'Clientes e relatórios ilimitados',
  'Funciona no celular e no computador',
  'Suporte humano de verdade, em português',
]

function Pricing() {
  const config = useConfig()
  const pm  = Number(config?.price_monthly)        || 97
  const pam = Number(config?.price_annual_monthly) || 79.90
  const pa  = Number(config?.price_annual)         || 958.80

  const fmt = n => n % 1 === 0 ? n.toFixed(0) : n.toFixed(2).replace('.', ',')

  return (
    <section className="section pricing" id="precos">
      <span className="glow g1" />
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Preço de oficina, não de software de empresa grande</span>
          <h2 className="h-section">Comece grátis. Decida depois.</h2>
          <p className="lead">7 dias com tudo liberado pra testar na sua oficina. Sem cartão agora — você só assina se gostar.</p>
        </div>
        <div className="lpprice-wrap">
          <div className="lpprice-card">
            <span className="pc-glow" />
            <div className="pc-in">
              <span className="pc-badge"><Zap /> 7 DIAS GRÁTIS · SEM CARTÃO</span>
              <div className="pc-free">Teste tudo por <span className="u">R$ 0</span></div>
              <div className="pc-after">
                Depois, a partir de <b>R$ {fmt(pam)}/mês</b> no plano anual.
                Menos que uma troca de óleo por mês.
              </div>
              <div className="pc-feats">
                {PRICE_FEATS.map(f => (
                  <div className="pc-feat" key={f}>
                    <span className="ck"><Check /></span> {f}
                  </div>
                ))}
              </div>
              <Link className="btn btn-green btn-lg btn-block" to={SIGNUP}>
                Criar conta grátis <ArrowRight />
              </Link>
              <div className="pc-note">Sem fidelidade · sem multa · cancela direto no painel</div>
            </div>
          </div>
          <div className="lpprice-mini">
            <span>Planos a partir de</span>
            <span className="pm-price">R$ {fmt(pam)}/mês</span>
            <span className="dot-sep" />
            <span>mensal <span className="pm-price">R$ {fmt(pm)}</span></span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── FAQ ──────────────────────────────────────────────────── */
const QA = [
  ['Preciso colocar cartão de crédito pra testar?', 'Não. O teste de 7 dias é grátis e com tudo liberado. Você só decide assinar se gostar — e configura o pagamento depois, quando quiser.'],
  ['É difícil de usar? Não entendo muito de sistema.', 'É feito justamente pra quem toca a oficina, não pra quem entende de computador. Se você usa WhatsApp, você usa o BoxCerto. A maioria cadastra o primeiro carro em poucos minutos, sem manual.'],
  ['Como o cliente aprova o orçamento?', 'Você toca em "Enviar para cliente" e o orçamento vai por um link no WhatsApp. O cliente abre o link no navegador, confere peças e valores e aprova num toque. A aprovação fica registrada com nome, data e hora.'],
  ['Funciona no meu celular?', 'Sim. Funciona no celular e no computador, sincronizado. Você abre a oficina no balcão pelo PC e acompanha tudo pelo telefone quando sai.'],
  ['Serve pra minha oficina pequena?', 'Foi feito pra ela. Atende mecânica, funilaria e pintura, auto elétrica, troca de óleo, centro automotivo, motos e também quem trabalha sozinho.'],
  ['Já tenho tudo no caderno e na planilha. Dá pra migrar?', 'Dá. Você começa a usar na hora e vai trazendo seus clientes e carros aos poucos. No plano anual, a gente ajuda a migrar sua planilha sem custo.'],
  ['Consigo cancelar quando quiser?', 'Sim. Não tem fidelidade nem multa. Se decidir parar, é só cancelar no painel — sem burocracia.'],
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
          <span className="eyebrow">Antes de começar</span>
          <h2 className="h-section">Perguntas que toda oficina faz</h2>
        </div>
        <div className="faq-wrap">
          {QA.map(([q, a], i) => (
            <FaqItem
              key={i}
              q={q} a={a}
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
          <span className="kicker green" style={{ background: 'rgba(34,197,94,.14)', borderColor: 'rgba(34,197,94,.3)', color: '#86efac' }}>
            <span className="dot" /> Sua oficina mais organizada hoje
          </span>
          <h2>Crie sua conta grátis e mande o primeiro orçamento ainda hoje.</h2>
          <p>Leva 2 minutos pra configurar. Sem cartão, sem compromisso — só a sua oficina rodando melhor.</p>
          <div className="final-cta-btns">
            <Link className="btn btn-primary btn-lg" to={SIGNUP}>
              Criar conta grátis <ArrowRight />
            </Link>
            <a className="btn btn-green btn-lg" href={WPP} target="_blank" rel="noreferrer">
              <WaIcon /> Falar no WhatsApp
            </a>
          </div>
          <div className="fc-guar"><ShieldCheck /> 7 dias grátis · sem cartão · cancele quando quiser</div>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="lpfooter">
      <div className="wrap">
        <div className="lpfooter-inner">
          <a className="brand" href="#topo">
            <img src="/logo.svg" alt="BoxCerto" width={30} height={30} />
            <span className="wm">Box<b>Certo</b></span>
          </a>
          <div className="lf-links">
            <a href="#precos">Preços</a>
            <a href="#faq">Dúvidas</a>
            <a href="https://boxcerto.com" target="_top">Site</a>
          </div>
        </div>
        <div className="lpfooter-inner" style={{ marginTop: '22px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
          <div className="lf-copy">© 2026 BoxCerto · Sistema de gestão para oficina pequena</div>
          <div className="lf-links">
            <a href="/termos">Termos</a>
            <a href="/privacidade">Privacidade</a>
            <a href="/privacidade">LGPD</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ── Sticky CTA (mobile) ──────────────────────────────────── */
function StickyCta() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 520)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <div className={'sticky-cta' + (show ? ' show' : '')}>
      <div className="sc-tx">
        <b>Teste grátis por 7 dias</b>
        <span>Sem cartão · pronto em 2 minutos</span>
      </div>
      <Link className="btn btn-primary" to={SIGNUP}>Criar conta <ArrowRight /></Link>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────── */
export default function LandingOficinaP() {
  usePageView('/sistema-para-oficina-pequena')
  usePageMeta({
    title: 'Sistema para Oficina Pequena | Organização sem complicação — BoxCerto',
    description: 'Sistema simples para oficina pequena: OS, orçamento aprovado por link no WhatsApp, estoque e financeiro. Sem treinamento. Teste grátis por 7 dias, sem cartão.',
    canonical: 'https://boxcerto.com/lpsistema-para-oficina-pequena',
  })

  // Scroll reveal
  useEffect(() => {
    const blocks = []

    document.querySelectorAll(
      '.lpp .section-head, .lpp .lphero-copy, .lpp .lphero-visual, .lpp .wa-copy, .lpp .wa-demo-wrap, .lpp .guarantee, .lpp .lpprice-card, .lpp .lpprice-mini'
    ).forEach(el => blocks.push(el))

    document.querySelectorAll(
      '.lpp .pain-grid, .lpp .lpsteps-row, .lpp .benefit-grid, .lpp .statsband-grid, .lpp .lptst-grid, .lpp .faq-wrap, .lpp .final-inner, .lpp .trustbar-inner'
    ).forEach(grid => {
      Array.from(grid.children).forEach((child, i) => {
        child.style.animationDelay = Math.min(i * 70, 420) + 'ms'
        blocks.push(child)
      })
    })

    blocks.forEach(el => el.classList.add('reveal'))

    let pending = new Set(blocks)

    const show = el => {
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
      pending.forEach(el => {
        if (el.getBoundingClientRect().top < vh * 0.92) show(el)
      })
      if (!pending.size) teardown()
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(sweep) } }

    let io = null
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) show(e.target) })
        if (!pending.size) teardown()
      }, { threshold: 0.06, rootMargin: '0px 0px -8% 0px' })
      blocks.forEach(el => io.observe(el))
    }

    function teardown() {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (io) io.disconnect()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    sweep()

    return teardown
  }, [])

  return (
    <div className="lpp">
      <Announce />
      <LpNav />
      <main>
        <Hero />
        <TrustBar />
        <PainSolution />
        <WaDemo />
        <HowItWorks />
        <Benefits />
        <StatsBand />
        <Testimonials />
        <Guarantee />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </div>
  )
}
