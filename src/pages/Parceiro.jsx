// ============================================================
// Parceiro — Programa de Parceiros BoxCerto
// Rota: /parceiro
// Design: hi-fi handoff (dark/light alternating, Space Grotesk)
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfig } from '../hooks/useConfig'
import { supportWaHref } from '../lib/support'

// ── CSS (tokens + animações não mapeáveis no Tailwind) ───────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

:root{
  --ink:#0a0b14;--ink-2:#0f1020;--ink-3:#15172a;
  --indigo:#4f46e5;--indigo-br:#6d63ff;--indigo-soft:#a5b4fc;--indigo-glow:rgba(99,90,255,.35);
  --green:#16b35a;--green-br:#22d36b;--green-soft:#7df0ab;
  --paper:#f7f6f3;--card:#ffffff;
  --text-d:#0c0d16;--text-mut:#5d5e6b;
  --on-dark:#edecf7;--on-dark-mut:#a3a3bd;--on-dark-faint:#6f7090;
  --line:rgba(12,13,22,.10);
}
.pg-parc{font-family:'Plus Jakarta Sans',sans-serif;}
.pg-parc h1,.pg-parc h2,.pg-parc h3{font-family:'Space Grotesk',sans-serif;}
.pg-mono{font-family:'JetBrains Mono',monospace;}

/* dark gradient bg */
.pg-dark-grad{
  background:
    radial-gradient(ellipse 80% 60% at 70% -10%,rgba(99,90,255,.18) 0%,transparent 70%),
    radial-gradient(ellipse 60% 40% at 0% 10%,rgba(22,179,90,.10) 0%,transparent 60%),
    linear-gradient(180deg,var(--ink-2) 0%,var(--ink) 100%);
}
/* grid overlay */
.pg-grid-bg{
  position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0;
  background-image:
    linear-gradient(rgba(140,150,220,.07) 1px,transparent 1px),
    linear-gradient(90deg,rgba(140,150,220,.07) 1px,transparent 1px);
  background-size:54px 54px;
  mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,black 30%,transparent 80%);
  -webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,black 30%,transparent 80%);
}
/* reveal */
.pg-reveal{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.3,1),transform .7s cubic-bezier(.2,.7,.3,1);}
.pg-reveal.in{opacity:1;transform:translateY(0);}
/* live dot */
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.pg-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green-br);animation:blink 1.8s infinite;flex-shrink:0;}
/* pill */
.pg-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:100px;border:1px solid rgba(140,150,220,.2);background:rgba(79,70,229,.12);font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--indigo-soft);}
/* slider */
.pg-slider{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:4px;background:rgba(255,255,255,.15);outline:none;cursor:pointer;}
.pg-slider::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--indigo-br);border:3px solid white;cursor:pointer;box-shadow:0 2px 8px rgba(99,90,255,.5);}
.pg-slider::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:var(--indigo-br);border:3px solid white;cursor:pointer;}
/* tier badge */
.pg-tier-badge{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:100px;border:1px solid rgba(99,90,255,.3);background:rgba(79,70,229,.12);font-size:12px;font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--indigo-soft);margin-top:28px;}
/* success loader */
@keyframes fill-bar{from{width:0}to{width:100%}}
.pg-fill-bar{height:5px;border-radius:4px;background:linear-gradient(90deg,var(--indigo),var(--green));animation:fill-bar 2.4s cubic-bezier(.4,0,.2,1) forwards;}
/* check pop */
@keyframes pop{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
.pg-pop{animation:pop .5s cubic-bezier(.2,.7,.3,1) forwards;}
/* card hover */
.pg-card-h{transition:transform .2s,box-shadow .2s;}
.pg-card-h:hover{transform:translateY(-3px);box-shadow:0 24px 50px -28px rgba(12,13,22,.28);}
/* btn */
.pg-btn{transition:transform .15s,box-shadow .15s;}
.pg-btn:hover{transform:translateY(-2px);}
.pg-btn:active{transform:translateY(1px);}
/* nav */
.pg-nav{position:sticky;top:0;z-index:40;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);background:rgba(10,11,20,.87);border-bottom:1px solid rgba(140,150,220,.12);}
.pg-nav a{text-decoration:none;}
/* form input */
.pg-inp{width:100%;box-sizing:border-box;background:rgba(255,255,255,.07);border:1px solid rgba(140,150,220,.2);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--on-dark);outline:none;font-family:'Plus Jakarta Sans',sans-serif;transition:border-color .2s,box-shadow .2s;}
.pg-inp:focus{border-color:var(--indigo);box-shadow:0 0 0 3px rgba(79,70,229,.18);}
.pg-inp.err{border-color:#f87171;}
.pg-inp option{color:#111;background:white;}
/* responsive */
@media(max-width:900px){.pg-hero-grid,.pg-form-grid{grid-template-columns:1fr!important;}.pg-form-side{order:-1;}}
@media(max-width:820px){.pg-pillars,.pg-why-grid,.pg-aud,.pg-calc-wrap{grid-template-columns:1fr!important;}.pg-steps{grid-template-columns:1fr 1fr!important;}.pg-tiers{grid-template-columns:1fr!important;}}
@media(max-width:640px){.pg-sticky-cta{display:flex!important;}}
@media(min-width:641px){.pg-sticky-cta{display:none!important;}}
@media(max-width:860px){.pg-nav-links{display:none!important;}}
@media(max-width:560px){.pg-nav-inner{padding:0 14px!important;gap:10px!important;}.pg-nav-actions{gap:8px!important;}.pg-nav-ghost{padding:8px 11px!important;font-size:12px!important;}.pg-nav-cta{padding:9px 14px!important;font-size:12px!important;}}
@media(max-width:360px){.pg-brand-text{display:none!important;}}
@media(max-width:460px){.pg-field-row{grid-template-columns:1fr!important;}.pg-steps{grid-template-columns:1fr!important;}.pg-form-stats{grid-template-columns:1fr!important;}}
`

// ── Constants ────────────────────────────────────────────────
const PLAN  = 97
const BONUS = 50

const TIPOS = [
  { value: 'influencer', label: 'Influencer / criador de conteúdo automotivo' },
  { value: 'vendedor',   label: 'Vendedor / representante de peças' },
  { value: 'empresa',    label: 'Empresa do ramo automotivo (com carteira de clientes)' },
  { value: 'oficina',    label: 'Dono / mecânico de oficina' },
  { value: 'outro',      label: 'Outro' },
]

// ── Helpers ──────────────────────────────────────────────────
function tierFor(n) {
  if (n >= 26) return { pct: 0.30, label: '30%', tier: 'Faixa Ouro 🥇' }
  if (n >= 11) return { pct: 0.25, label: '25%', tier: 'Faixa Prata 🥈' }
  return              { pct: 0.20, label: '20%', tier: 'Faixa Bronze 🥉' }
}
function brl(n) {
  return Math.round(n).toLocaleString('pt-BR')
}
function brlFull(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function maskPhone(v) {
  v = v.replace(/\D/g, '').slice(0, 11)
  if (v.length <= 2) return v.length ? '(' + v : v
  if (v.length <= 6) return `(${v.slice(0,2)}) ${v.slice(2)}`
  if (v.length <= 10) return `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`
  return `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`
}

// ── useCountUp ───────────────────────────────────────────────
function useCountUp(target, dur = 900) {
  const [val, setVal] = useState(target)
  const from = useRef(target)
  const raf  = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const a = from.current, b = target
    cancelAnimationFrame(raf.current)
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(a + (b - a) * e)
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else from.current = b
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target])
  return val
}

// ── Reveal on scroll ─────────────────────────────────────────
function Reveal({ children, delay = 0, className = '', style = {}, as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { setTimeout(() => el.classList.add('in'), delay); io.unobserve(el) } })
    }, { threshold: 0.14 })
    io.observe(el)
    return () => io.disconnect()
  }, [delay])
  return <Tag ref={ref} className={`pg-reveal ${className}`} style={style} {...rest}>{children}</Tag>
}

// ── Tiny SVG icons ───────────────────────────────────────────
const IcArrow  = (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcDown   = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcCheck  = (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcRepeat = (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}><path d="M4 9a8 8 0 0114-5l2 2M20 15a8 8 0 01-14 5l-2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 3v4h-4M4 21v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcBar    = (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcShield = (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8.5 12l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IcSpin   = (p) => <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>

// ── Brand ────────────────────────────────────────────────────
function Brand() {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:9 }}>
      <img src="/logo.svg" alt="BoxCerto" style={{ width:32, height:32, borderRadius:8 }} />
      <span className="pg-brand-text" style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:'var(--on-dark)' }}>
        Box<span>Certo</span>
      </span>
    </div>
  )
}

// ── Nav ──────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="pg-nav">
      <div className="pg-nav-inner" style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px', height:64, display:'flex', alignItems:'center', gap:32 }}>
        <Brand />
        <div className="pg-nav-links" style={{ display:'flex', gap:28, marginLeft:8 }}>
          {[['#ganhos','Como você ganha'],['#calculadora','Calculadora'],['#vende','O produto'],['#cadastro','Cadastro']].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize:14, color:'var(--on-dark-mut)', textDecoration:'none' }}>{label}</a>
          ))}
        </div>
        <div className="pg-nav-actions" style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <a href="/parceiro/dashboard" className="pg-nav-ghost" style={{
            display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
            color:'var(--on-dark-faint)', fontSize:13, fontWeight:600, textDecoration:'none',
            padding:'10px 14px', borderRadius:11, border:'1px solid rgba(140,150,220,.18)',
            transition:'color .15s,border-color .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--on-dark)'; e.currentTarget.style.borderColor='rgba(140,150,220,.4)' }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--on-dark-faint)'; e.currentTarget.style.borderColor='rgba(140,150,220,.18)' }}
          >
            Já sou parceiro
          </a>
          <a href="#cadastro" className="pg-btn pg-nav-cta" style={{
            display:'inline-flex', alignItems:'center', gap:8, whiteSpace:'nowrap',
            background:'var(--indigo)', color:'white', padding:'10px 20px',
            borderRadius:13, fontSize:13, fontWeight:700, textDecoration:'none',
            boxShadow:'0 10px 30px -8px var(--indigo-glow),inset 0 1px 0 rgba(255,255,255,.22)',
          }}>Quero ser parceiro</a>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ─────────────────────────────────────────────────────
function Hero() {
  const total = useCountUp(8730, 1400)
  return (
    <header className="pg-dark-grad" style={{ position:'relative', overflow:'hidden', padding:'96px 0 80px' }}>
      <div className="pg-grid-bg" />
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px', position:'relative', zIndex:1 }}>
        <div className="pg-hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>

          {/* copy */}
          <div>
            <div className="pg-pill" style={{ marginBottom:28 }}>
              <span className="pg-dot" /> Programa de Parceiros BoxCerto
            </div>
            <h1 style={{ fontSize:'clamp(38px,6.2vw,72px)', fontWeight:700, lineHeight:.98, letterSpacing:'-.03em', color:'var(--on-dark)', margin:'0 0 24px' }}>
              Você indica.<br />A oficina assina.<br />
              <span style={{ background:'linear-gradient(135deg,var(--indigo-soft),var(--green-soft))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Você ganha todo mês.
              </span>
            </h1>
            <p style={{ fontSize:'clamp(15px,1.55vw,18px)', lineHeight:1.65, color:'var(--on-dark-mut)', margin:'0 0 36px', maxWidth:500 }}>
              <strong style={{ color:'var(--on-dark)' }}>R$ 50 na hora</strong> por cada oficina que vira cliente pagante.
              Mais <strong style={{ color:'var(--on-dark)' }}>20% a 30% da mensalidade</strong> dela, todo mês.
              Some dezenas de oficinas e vira renda de verdade — no topo, parceiros
              <strong style={{ color:'var(--green-soft)' }}> passam de R$ 20 mil por mês</strong>.
            </p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <a href="#cadastro" className="pg-btn" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'var(--indigo)', color:'white', padding:'15px 28px',
                borderRadius:13, fontSize:15, fontWeight:700, textDecoration:'none',
                boxShadow:'0 10px 30px -8px var(--indigo-glow),inset 0 1px 0 rgba(255,255,255,.22)',
              }}>
                Criar minha conta de parceiro <IcArrow />
              </a>
              <a href="#calculadora" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                border:'1px solid rgba(140,150,220,.25)', color:'var(--on-dark-mut)', padding:'15px 24px',
                borderRadius:13, fontSize:14, fontWeight:600, textDecoration:'none',
              }}>
                Ver quanto eu ganho <IcDown />
              </a>
            </div>
            <div style={{ display:'flex', gap:22, marginTop:28, flexWrap:'wrap' }}>
              {['Pagamento via PIX','Sem custo pra entrar','Painel próprio de acompanhamento'].map(t => (
                <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'var(--on-dark-faint)' }}>
                  <IcCheck style={{ color:'var(--green-br)', width:14, height:14 }} />{t}
                </span>
              ))}
            </div>
          </div>

          {/* panel card */}
          <div style={{
            background:'rgba(28,30,54,.7)', border:'1px solid rgba(140,150,220,.16)',
            borderRadius:24, padding:28, backdropFilter:'blur(12px)', minWidth:0,
            boxShadow:'0 40px 90px -30px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.06)',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <span className="pg-mono" style={{ fontSize:11, color:'var(--on-dark-faint)' }}>Painel do Parceiro · Maio 2026</span>
              <span className="pg-pill" style={{ padding:'5px 11px', fontSize:10 }}><span className="pg-dot" /> ao vivo</span>
            </div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(32px,4vw,46px)', fontWeight:700, color:'#fff', letterSpacing:'-.02em', marginBottom:4 }}>
              R$ {brlFull(total)}
            </div>
            <div style={{ fontSize:12, color:'var(--green-soft)', marginBottom:24, display:'flex', alignItems:'center', gap:6 }}>
              <IcRepeat style={{ color:'var(--green-soft)' }} /> recorrente · 300 oficinas ativas · faixa Ouro 30%
            </div>
            {[
              ['Maciel Auto Center','Caxias do Sul/RS','+R$ 29,10/mês'],
              ['Gomes Multimarcas','Londrina/PR','+R$ 29,10/mês'],
              ['Mecânica Brasil','Goiânia/GO','+R$ 29,10/mês'],
              ['Natusch Auto Certo','Pelotas/RS','+R$ 29,10/mês'],
            ].map(([name, loc, val], i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid rgba(140,150,220,.08)' }}>
                <IcCheck style={{ color:'var(--green-br)', width:12, height:12, flexShrink:0 }} />
                <span style={{ flex:1, minWidth:0, fontSize:13, color:'var(--on-dark)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {name} <span style={{ color:'var(--on-dark-faint)' }}>· {loc}</span>
                </span>
                <span className="pg-mono" style={{ fontSize:11, color:'var(--green-soft)', fontWeight:700, flexShrink:0 }}>{val}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:16, fontSize:11, color:'var(--on-dark-faint)' }} className="pg-mono">
              <span>+ 296 oficinas ativas</span>
              <span>Bônus no mês: <strong style={{ color:'var(--green-soft)' }}>R$ 2.000,00</strong></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ── Ganhos ───────────────────────────────────────────────────
function Ganhos() {
  return (
    <section id="ganhos" style={{ background:'var(--ink-3)', padding:'100px 0' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
        <Reveal style={{ textAlign:'center', maxWidth:680, margin:'0 auto 60px' }}>
          <span className="pg-mono" style={{ fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--indigo-soft)', display:'block', marginBottom:14 }}>Como o dinheiro entra</span>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:700, letterSpacing:'-.025em', color:'#fff', margin:'0 0 16px', lineHeight:1.1 }}>
            Dois ganhos somados.<br />Um pra te animar agora, outro pra te manter.
          </h2>
          <p style={{ color:'var(--on-dark-mut)', fontSize:16, lineHeight:1.65, margin:0 }}>
            Sem letra miúda escondida. O modelo cabe num guardanapo — e foi feito pra recompensar quem traz oficina boa, que fica.
          </p>
        </Reveal>

        <div className="pg-pillars" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:24 }}>
          {[
            { d:0,   em:'⚡', num:'GANHO 01 · NA HORA',  big:'R$ 50', unit:'/ pagante',  title:'Bônus de ativação',           desc:'Toda oficina que sai do teste e vira cliente pagante coloca R$ 50 direto no seu PIX. Sem teto de quantas você pode trazer.' },
            { d:90,  em:'🔄', num:'GANHO 02 · TODO MÊS', big:'20–30', unit:'% / mês',    title:'Comissão recorrente',          desc:'Você fatura uma porcentagem da mensalidade de cada cliente ativo, todo mês, por 12 meses. Indicou uma vez, recebe o ano inteiro.' },
            { d:180, em:'📈', num:'A FAIXA SOBE',         big:'+ vol', unit:'= + %',      title:'Quanto mais ativas, maior a fatia', desc:'Sua porcentagem cresce conforme o número de oficinas ativas na sua carteira. Recompensamos quem leva o programa a sério.' },
          ].map((p, i) => (
            <Reveal key={i} delay={p.d} style={{ background:'rgba(28,30,54,.6)', border:'1px solid rgba(140,150,220,.12)', borderRadius:24, padding:'32px 28px' }}>
              <span style={{ fontSize:28, marginBottom:12, display:'block' }}>{p.em}</span>
              <div className="pg-mono" style={{ fontSize:10, letterSpacing:'.2em', color:'var(--on-dark-faint)', textTransform:'uppercase', marginBottom:10 }}>{p.num}</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(28px,3vw,40px)', fontWeight:700, color:'#fff', letterSpacing:'-.02em', marginBottom:8 }}>
                {p.big}<span style={{ fontSize:'0.42em', color:'var(--on-dark-faint)', fontWeight:400, marginLeft:6 }}>{p.unit}</span>
              </div>
              <h3 style={{ fontSize:17, fontWeight:700, color:'var(--on-dark)', margin:'0 0 10px' }}>{p.title}</h3>
              <p style={{ fontSize:14, color:'var(--on-dark-mut)', lineHeight:1.65, margin:0 }}>{p.desc}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="pg-tiers" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              { label:'Faixa Bronze · 1 a 10 oficinas ativas', pct:'20%' },
              { label:'Faixa Prata · 11 a 25 oficinas ativas', pct:'25%' },
              { label:'Faixa Ouro · 26+ oficinas ativas',       pct:'30%' },
            ].map((t, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,.04)', border:'1px solid rgba(140,150,220,.1)', borderRadius:16, padding:'16px 20px' }}>
                <span className="pg-mono" style={{ fontSize:12, color:'var(--on-dark-mut)' }}>{t.label}</span>
                <span className="pg-mono" style={{ fontSize:24, fontWeight:700, color:'var(--green-br)' }}>{t.pct}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── Calculator ───────────────────────────────────────────────
function Calculator() {
  const [n,     setN]     = useState(80)
  const [novas, setNovas] = useState(12)

  const t          = tierFor(n)
  const recMonth   = n * PLAN * t.pct
  const recYear    = recMonth * 12
  const bonusMonth = novas * BONUS
  const totalMonth = recMonth + bonusMonth

  const animTotal  = useCountUp(totalMonth)
  const animRec    = useCountUp(recMonth)
  const animBonus  = useCountUp(bonusMonth)
  const animYear   = useCountUp(recYear)

  return (
    <section id="calculadora" style={{ background:'var(--ink)', padding:'0 0 100px' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
        <Reveal style={{ textAlign:'center', maxWidth:620, margin:'0 auto', paddingTop:80, paddingBottom:48 }}>
          <span className="pg-mono" style={{ fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--indigo-soft)', display:'block', marginBottom:14 }}>Faça as contas</span>
          <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:700, letterSpacing:'-.025em', color:'#fff', margin:'0 0 14px', lineHeight:1.1 }}>
            Arraste e veja a máquina trabalhando.
          </h2>
          <p style={{ color:'var(--on-dark-mut)', fontSize:16, margin:0 }}>
            Ajuste quantas oficinas ativas você tem e quantas novas entram no mês. Arraste até o topo: parceiros com centenas de oficinas <strong style={{ color:'var(--on-dark)' }}>passam de R$ 20 mil por mês</strong> — e não tem teto.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="pg-calc-wrap" style={{
            display:'grid', gridTemplateColumns:'1fr 1fr',
            background:'rgba(15,16,32,.85)', border:'1px solid rgba(140,150,220,.12)',
            borderRadius:28, overflow:'hidden', boxShadow:'0 50px 100px -40px rgba(0,0,0,.7)',
          }}>
            {/* Sliders */}
            <div style={{ padding:'40px', borderRight:'1px solid rgba(140,150,220,.09)' }}>
              {/* Oficinas ativas */}
              <div style={{ marginBottom:36 }}>
                <div className="pg-mono" style={{ fontSize:11, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--indigo-soft)', marginBottom:6 }}>Oficinas ativas que você trouxe</div>
                <p style={{ fontSize:13, color:'var(--on-dark-faint)', marginBottom:16, lineHeight:1.5 }}>Clientes pagantes que continuam usando o BoxCerto.</p>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:52, fontWeight:700, color:'#fff', letterSpacing:'-.03em', lineHeight:1, marginBottom:16 }}>
                  {n}<span style={{ fontSize:20, color:'var(--on-dark-faint)', fontWeight:400, marginLeft:6 }}>{n===1?'oficina':'oficinas'}</span>
                </div>
                <input type="range" min="1" max="700" value={n} onChange={e => setN(+e.target.value)} className="pg-slider" aria-label="Oficinas ativas" />
                <div className="pg-mono" style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--on-dark-faint)', marginTop:6 }}>
                  <span>1</span><span>350</span><span>700</span>
                </div>
              </div>

              <div style={{ height:1, background:'rgba(255,255,255,.06)', margin:'0 0 32px' }} />

              {/* Novas */}
              <div>
                <div className="pg-mono" style={{ fontSize:11, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--indigo-soft)', marginBottom:6 }}>Novas pagantes neste mês</div>
                <p style={{ fontSize:13, color:'var(--on-dark-faint)', marginBottom:16, lineHeight:1.5 }}>Cada uma rende R$ 50 de bônus na hora.</p>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:44, fontWeight:700, color:'#fff', letterSpacing:'-.03em', lineHeight:1, marginBottom:16 }}>
                  {novas}<span style={{ fontSize:18, color:'var(--on-dark-faint)', fontWeight:400, marginLeft:6 }}>{novas===1?'nova':'novas'}</span>
                </div>
                <input type="range" min="0" max="50" value={novas} onChange={e => setNovas(+e.target.value)} className="pg-slider" aria-label="Novas pagantes no mês" />
                <div className="pg-mono" style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--on-dark-faint)', marginTop:6 }}>
                  <span>0</span><span>25</span><span>50</span>
                </div>
              </div>

              <div className="pg-tier-badge">
                <IcBar />{t.tier} · {t.label} de comissão recorrente
              </div>
            </div>

            {/* Output */}
            <div style={{ padding:'40px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div className="pg-mono" style={{ fontSize:11, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--indigo-soft)', marginBottom:12 }}>
                Você recebe, estimado neste mês
              </div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(46px,6vw,68px)', fontWeight:700, color:'#fff', letterSpacing:'-.03em', lineHeight:1, marginBottom:8 }}>
                <span style={{ fontSize:'0.42em', color:'var(--on-dark-faint)' }}>R$</span>{brl(animTotal)}
              </div>
              <p style={{ fontSize:13, color:'var(--green-soft)', marginBottom:32, lineHeight:1.5 }}>
                ↗ e isso se repete enquanto suas oficinas seguirem ativas
              </p>

              {[
                { label:'Comissão recorrente / mês', val:animRec },
                { label:'Bônus de ativação no mês',  val:animBonus },
              ].map((row, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', marginBottom:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(140,150,220,.08)', borderRadius:14 }}>
                  <span style={{ fontSize:13, color:'var(--on-dark-mut)' }}>{row.label}</span>
                  <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:20, color:'#fff' }}>
                    <span style={{ fontSize:12, color:'var(--on-dark-faint)' }}>R$</span>{brl(row.val)}
                  </span>
                </div>
              ))}

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', marginTop:4, background:'rgba(34,211,107,.08)', border:'1px solid rgba(34,211,107,.25)', borderRadius:14 }}>
                <span style={{ fontSize:13, color:'var(--green-soft)' }}>Recorrente projetado em 12 meses</span>
                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:24, color:'var(--green-br)' }}>
                  <span style={{ fontSize:12 }}>R$</span>{brl(animYear)}
                </span>
              </div>

              <p style={{ fontSize:11, color:'var(--on-dark-faint)', lineHeight:1.6, marginTop:20 }}>
                Simulação com base no plano mensal de R$ 97 e na faixa de comissão do seu volume (20% a 30%).
                Exemplo no topo: <strong style={{ color:'var(--on-dark-mut)' }}>500 oficinas ativas = R$ 14.550/mês só de recorrência</strong> (R$ 174.600/ano);
                700 oficinas + 50 novas no mês passam de <strong style={{ color:'var(--green-soft)' }}>R$ 22 mil/mês</strong>.
                Comissão recorrente paga por até 12 meses por cliente ativo. Sem teto de quantas você pode trazer.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── Vende ────────────────────────────────────────────────────
function Vende() {
  const items = [
    { em:'💬', title:'Orçamento por WhatsApp em 1 clique', desc:'A oficina manda o orçamento por link, o cliente aprova sem baixar app nem criar conta. É o tipo de coisa que vende sozinha numa demonstração.' },
    { em:'🚀', title:'Setup em minutos, não em dias', desc:'Cria conta, cadastra a oficina e já manda o primeiro orçamento. Sem implantação, sem consultor. Indicar é fácil porque usar é fácil.' },
    { em:'⏱️', title:'Cliente acompanha em tempo real', desc:'A oficina ganha cara de empresa grande sem custar caro. Esse é o argumento que faz dono de oficina abrir a carteira.' },
    { em:'🏷️', title:'Preço que cabe na oficina', desc:'A partir de R$ 79,90/mês — menos que uma troca de óleo. Objeção de preço quase não existe, então sua conversão sobe.' },
  ]
  return (
    <section id="vende" style={{ background:'var(--paper)', padding:'100px 0' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
        <Reveal style={{ textAlign:'center', maxWidth:600, margin:'0 auto 56px' }}>
          <span className="pg-mono" style={{ fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--text-mut)', display:'block', marginBottom:14 }}>O produto vende sozinho</span>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:700, letterSpacing:'-.025em', color:'var(--text-d)', margin:'0 0 14px', lineHeight:1.1 }}>
            Fácil de indicar porque é bom de verdade.
          </h2>
          <p style={{ color:'var(--text-mut)', fontSize:16, lineHeight:1.65, margin:0 }}>
            Você não vai empurrar nada. O BoxCerto resolve uma dor real — e ainda dá 7 dias grátis sem cartão pra pessoa testar antes. Seu trabalho é só apresentar.
          </p>
        </Reveal>

        <div className="pg-why-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          {items.map((item, i) => (
            <Reveal key={i} delay={i*70} className="pg-card-h" style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:24, padding:'28px', display:'flex', gap:16 }}>
              <div style={{ width:44, height:44, background:'rgba(79,70,229,.07)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>
                {item.em}
              </div>
              <div>
                <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-d)', margin:'0 0 8px' }}>{item.title}</h3>
                <p style={{ fontSize:14, color:'var(--text-mut)', lineHeight:1.65, margin:0 }}>{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'20px 24px', background:'rgba(22,179,90,.06)', border:'1px solid rgba(22,179,90,.2)', borderRadius:18, fontSize:14, color:'var(--text-mut)', lineHeight:1.65 }}>
          <IcShield style={{ color:'var(--green)', flexShrink:0, marginTop:2 }} />
          7 dias grátis sem cartão de crédito — a oficina testa antes de pagar. Você indica sem peso na consciência e sem precisar convencer ninguém na marra.
        </Reveal>
      </div>
    </section>
  )
}

// ── Steps ────────────────────────────────────────────────────
function Steps() {
  const steps = [
    ['Cadastre-se', 'Preencha o formulário em 1 minuto. Sua conta de parceiro e seu painel saem na hora.'],
    ['Pegue seu link', 'Você recebe um link de indicação único e materiais prontos pra divulgar pro seu público.'],
    ['Indique pro seu público', 'Manda no story, no grupo, pro cliente. A oficina testa 7 dias grátis e assina.'],
    ['Receba no PIX', 'Acompanhe cada oficina ativa no painel e receba bônus + recorrente direto na sua chave.'],
  ]
  return (
    <section style={{ background:'var(--paper)', padding:'0 0 100px' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
        <Reveal style={{ textAlign:'center', maxWidth:420, margin:'0 auto 52px' }}>
          <span className="pg-mono" style={{ fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--text-mut)', display:'block', marginBottom:14 }}>Como começar</span>
          <h2 style={{ fontSize:'clamp(26px,4vw,42px)', fontWeight:700, letterSpacing:'-.025em', color:'var(--text-d)', margin:0, lineHeight:1.1 }}>
            Do cadastro ao primeiro PIX.
          </h2>
        </Reveal>
        <div className="pg-steps" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16 }}>
          {steps.map((s, i) => (
            <Reveal key={i} delay={i*80} className="pg-card-h" style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:24, padding:'28px 24px' }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:60, fontWeight:700, color:'rgba(12,13,22,.04)', letterSpacing:'-.04em', lineHeight:1, marginBottom:12 }}>
                {String(i+1).padStart(2,'0')}
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-d)', margin:'0 0 8px' }}>{s[0]}</h3>
              <p style={{ fontSize:14, color:'var(--text-mut)', lineHeight:1.65, margin:0 }}>{s[1]}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Audience ─────────────────────────────────────────────────
function Audience() {
  const cards = [
    { num:'01', title:'Influencer & criador', desc:'Tem audiência que confia em você no nicho automotivo? Cada indicação que vira oficina ativa pinga no seu PIX todo mês.' },
    { num:'02', title:'Vendedor & representante', desc:'Já circula em oficina vendendo peça ou serviço? Some uma renda recorrente ao que você já faz, sem mudar a rota.' },
    { num:'03', title:'Empresa do ramo', desc:'Distribuidora, autopeças, franquia — tem carteira de oficinas? Transforme esse relacionamento em comissão recorrente.' },
  ]
  return (
    <section style={{ background:'var(--paper)', padding:'0 0 100px' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
        <Reveal style={{ textAlign:'center', maxWidth:520, margin:'0 auto 48px' }}>
          <span className="pg-mono" style={{ fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--text-mut)', display:'block', marginBottom:14 }}>Pra quem é</span>
          <h2 style={{ fontSize:'clamp(26px,4vw,42px)', fontWeight:700, letterSpacing:'-.025em', color:'var(--text-d)', margin:0, lineHeight:1.15 }}>
            Se você fala com dono de oficina,<br />tem dinheiro na mesa.
          </h2>
        </Reveal>
        <div className="pg-aud" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          {cards.map((c, i) => (
            <Reveal key={i} delay={i*80} className="pg-card-h" style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:24, padding:'32px 28px', position:'relative', overflow:'hidden' }}>
              <span className="pg-mono" style={{ position:'absolute', bottom:-12, right:14, fontSize:80, fontWeight:700, color:'rgba(12,13,22,.04)', lineHeight:1 }}>{c.num}</span>
              <span style={{ display:'inline-block', fontSize:11, fontWeight:600, color:'var(--indigo)', background:'rgba(79,70,229,.08)', padding:'4px 10px', borderRadius:100, marginBottom:16, textTransform:'uppercase', letterSpacing:'.08em' }}>Pra você</span>
              <h3 style={{ fontSize:20, fontWeight:700, color:'var(--text-d)', margin:'0 0 10px' }}>{c.title}</h3>
              <p style={{ fontSize:14, color:'var(--text-mut)', lineHeight:1.65, margin:0 }}>{c.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Liberdade (você só indica) ───────────────────────────────
function Liberdade() {
  const nosso = [
    'O produto que converte sozinho no teste grátis de 7 dias',
    'A cobrança e toda a parte financeira com a oficina',
    'O suporte ao cliente, via WhatsApp — você não atende ninguém',
    'As atualizações e novidades do BoxCerto',
    'O seu pagamento, no PIX, todo dia 5',
  ]
  return (
    <section style={{ background:'var(--paper)', padding:'0 0 100px' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
        <Reveal style={{ textAlign:'center', maxWidth:560, margin:'0 auto 48px' }}>
          <span className="pg-mono" style={{ fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--text-mut)', display:'block', marginBottom:14 }}>Seu trabalho é leve</span>
          <h2 style={{ fontSize:'clamp(26px,4vw,42px)', fontWeight:700, letterSpacing:'-.025em', color:'var(--text-d)', margin:'0 0 14px', lineHeight:1.15 }}>
            Você indica. O resto é com a gente.
          </h2>
          <p style={{ color:'var(--text-mut)', fontSize:16, lineHeight:1.65, margin:0 }}>
            Não precisa entender de mecânica, não precisa vender na marra, não precisa dar suporte. Você compartilha um link — do celular, de onde estiver.
          </p>
        </Reveal>

        <Reveal delay={100} className="pg-why-grid" style={{ display:'grid', gridTemplateColumns:'0.8fr 1.2fr', gap:16, alignItems:'stretch' }}>
          {/* Você faz */}
          <div style={{ background:'var(--indigo)', borderRadius:24, padding:'32px 28px', color:'#fff', display:'flex', flexDirection:'column' }}>
            <span className="pg-mono" style={{ fontSize:11, letterSpacing:'.2em', textTransform:'uppercase', opacity:.7, marginBottom:14 }}>Você faz</span>
            <div style={{ fontSize:40, marginBottom:14 }}>🔗</div>
            <h3 style={{ fontSize:22, fontWeight:700, margin:'0 0 10px', lineHeight:1.2 }}>Compartilha seu link.</h3>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.82)', lineHeight:1.65, margin:0 }}>
              No story, no grupo, pro cliente, pro colega de ramo. É literalmente o seu único trabalho — sem reunião, sem planilha, sem perseguir ninguém.
            </p>
          </div>
          {/* A gente cuida */}
          <div style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:24, padding:'32px 28px' }}>
            <span className="pg-mono" style={{ fontSize:11, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--text-mut)', display:'block', marginBottom:18 }}>A gente cuida de tudo isto</span>
            <div style={{ display:'grid', gap:14 }}>
              {nosso.map((t, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <span style={{ width:24, height:24, borderRadius:8, background:'rgba(22,179,90,.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <IcCheck style={{ color:'var(--green)', width:14, height:14 }} />
                  </span>
                  <span style={{ fontSize:15, color:'var(--text-d)', lineHeight:1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── FAQ de parceiro ──────────────────────────────────────────
const FAQS = [
  ['Preciso entender de mecânica?', 'Não. Quem usa o BoxCerto é a oficina. Você só indica pra quem pode se interessar — o resto é com o produto.'],
  ['Preciso vender ou convencer na marra?', 'Não. São 7 dias grátis sem cartão: a oficina testa e decide sozinha. Você apresenta, o produto converte. Sem pressão, sem perseguir ninguém.'],
  ['Preciso dar suporte pra oficina?', 'Não. Todo o suporte é nosso, via WhatsApp. Você não atende cliente, não resolve dúvida técnica e não cuida de cobrança.'],
  ['Quando e como eu recebo?', 'Sempre via PIX, todo dia 5. R$ 50 por cada oficina que vira pagante, mais a comissão recorrente da mensalidade enquanto ela seguir cliente.'],
  ['Tem custo ou contrato de fidelidade?', 'Nenhum. Entrar é grátis, sem mensalidade e sem fidelidade. Você participa enquanto quiser e sai quando quiser.'],
  ['Posso indicar pelo WhatsApp e nas redes?', 'Pode e deve. Você recebe um link único e materiais prontos — manda no story, no grupo, pro cliente, onde seu público estiver.'],
  ['Por quanto tempo recebo a recorrente?', 'Por até 12 meses por cliente ativo. Indicou uma vez, recebe o ano inteiro enquanto a oficina continuar pagando.'],
  ['O programa é novo?', 'É — e essa é a melhor hora pra entrar. Quem começa agora constrói carteira de oficinas antes da concorrência e sobe de faixa (20% → 25% → 30%) primeiro.'],
]

function FaqItem({ q, a, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--line)', borderRadius:18, overflow:'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
        padding:'20px 24px', background:'none', border:'none', cursor:'pointer', textAlign:'left',
      }}>
        <span style={{ fontSize:16, fontWeight:700, color:'var(--text-d)' }}>{q}</span>
        <span style={{ fontSize:22, color:'var(--indigo)', flexShrink:0, lineHeight:1, transform: open ? 'rotate(45deg)' : 'none', transition:'transform .2s' }}>+</span>
      </button>
      {open && (
        <p style={{ margin:0, padding:'0 24px 22px', fontSize:14.5, color:'var(--text-mut)', lineHeight:1.7 }}>{a}</p>
      )}
    </div>
  )
}

function FAQ() {
  return (
    <section style={{ background:'var(--paper)', padding:'0 0 100px' }}>
      <div style={{ maxWidth:760, margin:'0 auto', padding:'0 28px' }}>
        <Reveal style={{ textAlign:'center', marginBottom:44 }}>
          <span className="pg-mono" style={{ fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--text-mut)', display:'block', marginBottom:14 }}>Antes de você perguntar</span>
          <h2 style={{ fontSize:'clamp(26px,4vw,42px)', fontWeight:700, letterSpacing:'-.025em', color:'var(--text-d)', margin:0, lineHeight:1.15 }}>
            As dúvidas que todo parceiro tem.
          </h2>
        </Reveal>
        <div style={{ display:'grid', gap:12 }}>
          {FAQS.map(([q, a], i) => <FaqItem key={i} q={q} a={a} defaultOpen={i === 0} />)}
        </div>
        <Reveal delay={80} style={{ textAlign:'center', marginTop:36 }}>
          <a href="#cadastro" className="pg-btn" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--indigo)', color:'#fff', padding:'14px 26px', borderRadius:13, fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 10px 30px -8px var(--indigo-glow)' }}>
            Quero começar a indicar <IcArrow />
          </a>
        </Reveal>
      </div>
    </section>
  )
}

// ── Form helpers ─────────────────────────────────────────────
function Field({ label, required, sub, err, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--on-dark-mut)', marginBottom:7 }}>
        {label}{required && <span style={{ color:'#f87171', marginLeft:2 }}>*</span>}
        {sub && <span style={{ fontWeight:400, color:'var(--on-dark-faint)', marginLeft:4 }}>{sub}</span>}
      </label>
      {children}
      {err && <p style={{ fontSize:12, color:'#f87171', marginTop:5, marginBottom:0 }}>{err}</p>}
    </div>
  )
}

// ── Form ─────────────────────────────────────────────────────
function FormCard() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ nome:'', whats:'', email:'', tipo:'', insta:'', pix:'' })
  const [errs,    setErrs]    = useState({})
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [apiErr,  setApiErr]  = useState('')

  const isInfluencer = form.tipo === 'influencer'
  const set = (k, v) => { setForm(p => ({...p,[k]:v})); setErrs(p => ({...p,[k]:null})); setApiErr('') }

  function validate() {
    const e = {}
    if (form.nome.trim().length < 3)                     e.nome  = 'Conta pra gente seu nome completo.'
    if (form.whats.replace(/\D/g,'').length < 10)         e.whats = 'WhatsApp com DDD, por favor.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.'
    if (!form.tipo)                                       e.tipo  = 'Selecione como você atua.'
    if (form.pix.trim().length < 4)                      e.pix   = 'Informe sua chave PIX pra receber.'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  async function submit(ev) {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true); setApiErr('')
    try {
      const res = await fetch('/api/affiliate-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:     form.nome.trim(),
          email:    form.email.trim(),
          whatsapp: form.whats,
          empresa:  isInfluencer ? form.insta.trim() : '',
          tipo:     form.tipo,
          pix_key:  form.pix.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setApiErr(data.error || 'Erro ao cadastrar. Tente novamente.'); return }
      setResult(data)
    } catch { setApiErr('Erro de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  const baseInp = {
    width:'100%', boxSizing:'border-box',
    background:'rgba(255,255,255,.07)', border:'1px solid rgba(140,150,220,.2)',
    borderRadius:11, padding:'12px 14px', fontSize:14, color:'var(--on-dark)',
    outline:'none', fontFamily:"'Plus Jakarta Sans',sans-serif",
    transition:'border-color .2s,box-shadow .2s',
  }
  const errInp = { ...baseInp, borderColor:'#f87171' }

  // ── Sucesso ────────────────────────────────────────────────
  if (result) {
    const primeiro = result.nome?.split(' ')[0] || 'Parceiro'
    const inicial  = (result.nome?.[0] || 'P').toUpperCase()
    return (
      <div style={{ background:'rgba(20,22,42,.92)', border:'1px solid rgba(140,150,220,.15)', borderRadius:24, padding:'36px 32px' }}>
        <div style={{ textAlign:'center' }}>
          <div className="pg-pop" style={{ width:68, height:68, background:'rgba(22,179,90,.15)', border:'1px solid rgba(34,211,107,.3)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <IcCheck style={{ width:34, height:34, color:'var(--green-br)' }} />
          </div>
          <h3 style={{ fontSize:22, fontWeight:700, color:'var(--on-dark)', margin:'0 0 10px' }}>Conta de parceiro criada! 🎉</h3>
          <p style={{ fontSize:14, color:'var(--on-dark-mut)', lineHeight:1.65, marginBottom:24 }}>
            Tudo certo, {primeiro}. Estamos abrindo seu painel — seu link de indicação já está te esperando lá dentro.
          </p>
          <div style={{ height:6, background:'rgba(255,255,255,.08)', borderRadius:4, marginBottom:24, overflow:'hidden' }}>
            <div className="pg-fill-bar" />
          </div>
          {/* mini-card */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', background:'rgba(255,255,255,.05)', borderRadius:16, marginBottom:22, textAlign:'left' }}>
            <div style={{ width:40, height:40, background:'var(--indigo)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:'white', fontSize:16, flexShrink:0 }}>{inicial}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'var(--on-dark)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{result.nome}</div>
              <div style={{ fontSize:12, color:'var(--on-dark-mut)' }}>Parceiro BoxCerto · comissão via PIX</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--green-br)', fontWeight:700, fontSize:12, flexShrink:0 }}>
              <span className="pg-dot" /> ativo
            </div>
          </div>
          <button onClick={() => navigate('/parceiro/dashboard')} className="pg-btn" style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'var(--indigo)', color:'white', padding:14, borderRadius:13,
            fontWeight:700, fontSize:15, border:'none', cursor:'pointer',
            boxShadow:'0 10px 30px -8px var(--indigo-glow),inset 0 1px 0 rgba(255,255,255,.22)',
          }}>
            Entrar no painel <IcArrow />
          </button>
          <p style={{ fontSize:11, color:'var(--on-dark-faint)', marginTop:14, lineHeight:1.5 }}>
            Um e-mail com seu link e cupom foi enviado para {form.email}
          </p>
        </div>
      </div>
    )
  }

  // ── Formulário ──────────────────────────────────────────────
  return (
    <form onSubmit={submit} noValidate style={{ background:'rgba(20,22,42,.92)', border:'1px solid rgba(140,150,220,.15)', borderRadius:24, padding:'36px 32px', boxShadow:'0 50px 110px -40px rgba(0,0,0,.6)' }}>
      <h3 style={{ fontSize:22, fontWeight:700, color:'var(--on-dark)', margin:'0 0 6px' }}>Crie sua conta de parceiro</h3>
      <p style={{ fontSize:14, color:'var(--on-dark-mut)', marginBottom:28 }}>Leva 1 minuto. Sem custo, sem contrato. Seu link e painel saem na hora.</p>

      {apiErr && (
        <div style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)', borderRadius:12, padding:'12px 14px', fontSize:13, color:'#fca5a5', marginBottom:20 }}>
          {apiErr}
        </div>
      )}

      <Field label="Nome completo" required err={errs.nome}>
        <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Como você se chama"
          style={errs.nome ? errInp : baseInp} className="pg-inp" />
      </Field>

      <div className="pg-field-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Field label="WhatsApp" required err={errs.whats}>
          <input value={form.whats} onChange={e => set('whats', maskPhone(e.target.value))} placeholder="(53) 99999-9999" inputMode="tel"
            style={errs.whats ? errInp : baseInp} className="pg-inp" />
        </Field>
        <Field label="E-mail" required err={errs.email}>
          <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="voce@email.com" inputMode="email"
            style={errs.email ? errInp : baseInp} className="pg-inp" />
        </Field>
      </div>

      <Field label="Como você atua" required err={errs.tipo}>
        <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
          style={{ ...(errs.tipo ? errInp : baseInp), color: form.tipo ? 'var(--on-dark)' : 'var(--on-dark-faint)' }} className="pg-inp">
          <option value="" disabled style={{ color:'#333' }}>Selecione seu perfil</option>
          {TIPOS.map(t => <option key={t.value} value={t.value} style={{ color:'#111', background:'white' }}>{t.label}</option>)}
        </select>
      </Field>

      {isInfluencer && (
        <Field label="Instagram / canal" sub="(pra gente conhecer seu público)">
          <input value={form.insta} onChange={e => set('insta', e.target.value)} placeholder="@seuperfil ou link do canal"
            style={baseInp} className="pg-inp" />
        </Field>
      )}

      <Field label="Chave PIX pra receber" required err={errs.pix}>
        <input value={form.pix} onChange={e => set('pix', e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória"
          style={errs.pix ? errInp : baseInp} className="pg-inp" />
      </Field>

      <button type="submit" disabled={loading} className="pg-btn" style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        background: loading ? 'rgba(79,70,229,.6)' : 'var(--indigo)',
        color:'white', padding:15, borderRadius:13, fontWeight:700, fontSize:15,
        border:'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop:8,
        boxShadow:'0 10px 30px -8px var(--indigo-glow),inset 0 1px 0 rgba(255,255,255,.22)',
      }}>
        {loading ? <><IcSpin /> Criando conta...</> : <>Criar conta e ver meu painel <IcArrow /></>}
      </button>
      <p style={{ fontSize:11, color:'var(--on-dark-faint)', textAlign:'center', marginTop:14, lineHeight:1.5 }}>
        Ao continuar você concorda com os{' '}
        <a href="/termos" style={{ color:'var(--indigo-soft)' }}>termos do programa</a>.
        Pagamentos de comissão sempre via PIX.
      </p>
      <p style={{ fontSize:12, color:'var(--on-dark-faint)', textAlign:'center', marginTop:10 }}>
        Já tem conta?{' '}
        <a href="/parceiro/dashboard" style={{ color:'var(--indigo-soft)', fontWeight:600 }}>Acessar meu painel →</a>
      </p>
    </form>
  )
}

// ── Form section (wrapper com copy) ──────────────────────────
function FormSection() {
  return (
    <section id="cadastro" className="pg-dark-grad" style={{ position:'relative', overflow:'hidden', padding:'100px 0' }}>
      <div className="pg-grid-bg" />
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px', position:'relative', zIndex:1 }}>
        <div className="pg-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
          {/* copy */}
          <Reveal className="pg-form-side">
            <div className="pg-pill" style={{ marginBottom:28 }}><span className="pg-dot" /> Comece agora</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:700, letterSpacing:'-.025em', color:'#fff', margin:'0 0 20px', lineHeight:1.1 }}>
              Sua conta de parceiro<br />em 1 minuto.
            </h2>
            <p style={{ fontSize:17, color:'var(--on-dark-mut)', lineHeight:1.65, marginBottom:40 }}>
              Sem custo pra entrar, sem contrato de fidelidade. Você cria a conta, recebe seu link e painel, e já pode indicar a primeira oficina hoje.
            </p>
            <div className="pg-form-stats" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              {[
                { n:'R$50',  l:'por oficina pagante' },
                { n:'30%',   l:'de recorrente no topo' },
                { n:'12',    l:'meses por cliente' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign:'center', padding:'18px 8px', background:'rgba(255,255,255,.05)', borderRadius:16, border:'1px solid rgba(140,150,220,.1)' }}>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:28, fontWeight:700, color:'#fff', letterSpacing:'-.02em' }}>{s.n}</div>
                  <div style={{ fontSize:11, color:'var(--on-dark-faint)', marginTop:4, lineHeight:1.4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
          {/* form */}
          <Reveal delay={80}><FormCard /></Reveal>
        </div>
      </div>
    </section>
  )
}

// ── Footer ───────────────────────────────────────────────────
function ParcFooter() {
  const cfg = useConfig()
  return (
    <footer style={{ background:'var(--ink-2)', padding:'60px 0 40px', borderTop:'1px solid rgba(140,150,220,.08)' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
        <div style={{ display:'flex', gap:60, marginBottom:44, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:9, marginBottom:14 }}>
              <img src="/logo.svg" alt="BoxCerto" style={{ width:30, height:30, borderRadius:8 }} />
              <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:'var(--on-dark)' }}>BoxCerto</span>
            </div>
            <p style={{ fontSize:13, color:'var(--on-dark-faint)', lineHeight:1.65, maxWidth:240 }}>
              Gestão de oficina mecânica feita pra mecânico de verdade. O programa de parceiros divide o crescimento com quem leva o BoxCerto pra mais oficinas.
            </p>
          </div>
          <div style={{ display:'flex', gap:40, flexWrap:'wrap' }}>
            {[
              { title:'Programa',  links:[['#ganhos','Como você ganha'],['#calculadora','Calculadora'],['#cadastro','Cadastro']] },
              { title:'BoxCerto',  links:[['https://boxcerto.com','Site principal'],['/lp','Para oficinas'],['/login','Entrar']] },
              { title:'Suporte',   links:[[supportWaHref(cfg.support_phone),'WhatsApp'],['/privacidade','Privacidade'],['/termos','Termos']] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:'var(--on-dark)', marginBottom:14 }}>{col.title}</h4>
                {col.links.map(([href, label]) => (
                  <a key={label} href={href} style={{ display:'block', fontSize:13, color:'var(--on-dark-faint)', textDecoration:'none', marginBottom:9 }}>{label}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:24, borderTop:'1px solid rgba(140,150,220,.08)', fontSize:12, color:'var(--on-dark-faint)', flexWrap:'wrap', gap:8 }}>
          <span>© {new Date().getFullYear()} BoxCerto · boxcerto.com</span>
          <span>Feito com graxa em Pelotas/RS · Comissões pagas via PIX</span>
        </div>
      </div>
    </footer>
  )
}

// ── Main export ──────────────────────────────────────────────
export default function Parceiro() {
  return (
    <div className="pg-parc">
      <style>{CSS}</style>
      <Nav />
      <Hero />
      <Ganhos />
      <Calculator />
      <Vende />
      <Liberdade />
      <Steps />
      <Audience />
      <FAQ />
      <FormSection />
      <ParcFooter />

      {/* Sticky CTA — só mobile ≤640px */}
      <div className="pg-sticky-cta" style={{
        display:'none', position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        padding:'12px 20px 16px', background:'rgba(10,11,20,.95)', borderTop:'1px solid rgba(140,150,220,.12)',
        backdropFilter:'blur(14px)',
      }}>
        <a href="#cadastro" className="pg-btn" style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          background:'var(--indigo)', color:'white', padding:14, borderRadius:13,
          fontWeight:700, fontSize:14, textDecoration:'none',
          boxShadow:'0 10px 30px -8px var(--indigo-glow)',
        }}>
          Quero ser parceiro · grátis <IcArrow />
        </a>
      </div>
    </div>
  )
}
