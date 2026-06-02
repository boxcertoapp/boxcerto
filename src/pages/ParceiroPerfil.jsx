// ============================================================
// ParceiroPerfil — LP personalizada por parceiro
// Rota: /parceiro/:slug
// Design: hi-fi handoff (parc.css reference)
// Lógica original preservada integralmente.
// ============================================================
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { captureAffiliateRef, saveAffiliateCoupon } from '../lib/affiliateTracking'

// ── CSS ──────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Manrope:wght@400;600;700&family=Space+Mono:wght@700&display=swap');

@keyframes pulseDot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes pr-reveal{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes faqSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}

.parc-page{
  font-family:Manrope,sans-serif;color:#3c4254;
  --indigo:#4f46e5;--indigo-50:#eef0fe;--indigo-100:#e0e3fc;
  --green:#22c55e;--green-50:#ecfdf3;--green-100:#d3f6df;--green-600:#16a34a;--green-700:#15803d;
  --ink:#14161f;--amber:#f59e0b;
  --sl4:#9aa0b6;--sl5:#5a617a;--sl6:#4a5568;--sl7:#3c4254;
  --line:#e8eaf3;--bg-soft:#f6f7fb;
  --r-lg:20px;--r-xl:28px;--r-pill:999px;
  --sh-sm:0 2px 8px rgba(20,22,31,.06),0 1px 2px rgba(20,22,31,.04);
  --sh-md:0 8px 28px -4px rgba(20,22,31,.14),0 2px 6px -2px rgba(20,22,31,.08);
  --sh-lg:0 24px 56px -12px rgba(20,22,31,.22),0 4px 12px -4px rgba(20,22,31,.08);
  --sh-indigo:0 10px 32px -4px rgba(79,70,229,.32);
  --sh-green:0 10px 32px -4px rgba(34,197,94,.28);
}
.parc-page *{box-sizing:border-box;}
.parc-page a{text-decoration:none;}

/* layout */
.pr-wrap{max-width:1200px;margin:0 auto;padding:0 28px;}
@media(max-width:600px){.pr-wrap{padding:0 20px;}}
.pr-section{padding:96px 0;}
@media(max-width:768px){.pr-section{padding:64px 0;}}
.pr-section-head{text-align:center;max-width:680px;margin:0 auto 56px;}
.pr-eyebrow{font-family:'Space Mono',monospace;font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--indigo);display:block;margin-bottom:14px;}
.pr-h-section{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(28px,3.4vw,44px);font-weight:800;letter-spacing:-.02em;line-height:1.1;color:var(--ink);margin:0 0 16px;}
.pr-lead{font-size:clamp(16px,1.3vw,18px);line-height:1.7;color:var(--sl5);}

/* glow blobs */
.pr-glow{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}

/* reveal */
.pr-reveal{opacity:0;transform:translateY(22px);transition:opacity .65s cubic-bezier(.2,.7,.3,1),transform .65s cubic-bezier(.2,.7,.3,1);}
.pr-reveal.in{opacity:1;transform:translateY(0);}

/* buttons */
.pr-btn{display:inline-flex;align-items:center;gap:8px;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;border:none;cursor:pointer;transition:transform .15s,box-shadow .15s;white-space:nowrap;}
.pr-btn:hover{transform:translateY(-2px);}
.pr-btn:active{transform:translateY(0);}
.pr-btn-primary{background:var(--indigo);color:#fff;border-radius:12px;padding:13px 26px;font-size:15px;box-shadow:var(--sh-indigo);}
.pr-btn-primary:hover{background:#4338ca;}
.pr-btn-ghost{background:#fff;color:var(--sl7);border:1.5px solid var(--line);border-radius:12px;padding:13px 26px;font-size:15px;}
.pr-btn-ghost:hover{border-color:var(--indigo-100);}
.pr-btn-green{background:var(--green);color:#fff;border-radius:12px;padding:13px 26px;font-size:15px;box-shadow:var(--sh-green);}
.pr-btn-green:hover{background:var(--green-600);}
.pr-btn-lg{padding:16px 32px;font-size:16px;border-radius:14px;}
.pr-btn-block{display:flex;justify-content:center;width:100%;}

/* ── ANNOUNCE ── */
.pr-announce{background:var(--ink);color:#e9ebf6;text-align:center;font-size:13.5px;font-weight:600;padding:9px 16px;display:flex;align-items:center;justify-content:center;gap:10px;line-height:1.3;flex-wrap:wrap;}
.pr-announce b{color:#fff;}
.pr-pulse-dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulseDot 2s infinite;flex-shrink:0;}
.pr-code-pill{font-family:'Space Mono',monospace;font-weight:700;color:#0e1030;background:var(--green);border-radius:6px;padding:2px 9px;letter-spacing:.04em;font-size:12.5px;}

/* ── NAV ── */
.pr-nav{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.88);backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid transparent;transition:border-color .25s,box-shadow .25s;}
.pr-nav.scrolled{border-color:var(--line);box-shadow:var(--sh-sm);}
.pr-nav-inner{display:flex;align-items:center;height:66px;gap:16px;}
.pr-cobrand{display:flex;align-items:center;gap:12px;margin-right:auto;}
.pr-cobrand .pr-cb-x{color:var(--sl4);font-size:17px;font-weight:400;}
.pr-cobrand .pr-cb-partner{display:inline-flex;align-items:center;gap:8px;}
.pr-pav{border-radius:50%;display:grid;place-items:center;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;flex-shrink:0;}
.pr-cobrand .pr-pav{width:30px;height:30px;font-size:12px;}
.pr-cobrand .pr-pnm{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15px;color:var(--ink);letter-spacing:-.02em;}
@media(max-width:560px){.pr-cobrand .pr-pnm{display:none;}.pr-nav-inner{height:60px;}}
.pr-brand{display:inline-flex;align-items:center;gap:8px;}
.pr-brand-wm{font-family:'Plus Jakarta Sans',sans-serif;font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-.02em;}

/* ── HERO ── */
.pr-hero{position:relative;overflow:hidden;padding:44px 0 64px;background:#fff;}
.pr-hero .pr-glow.g1{width:560px;height:560px;background:rgba(99,102,241,.15);top:-280px;right:-140px;}
.pr-hero .pr-glow.g2{width:400px;height:400px;background:rgba(34,197,94,.11);bottom:-220px;left:-160px;}
.pr-hero-grid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr);gap:52px;align-items:center;}
.pr-hero-copy,.pr-hero-visual{min-width:0;}

/* badge */
.pr-ref-badge{display:inline-flex;align-items:center;gap:11px;background:#fff;border:1px solid var(--line);border-radius:var(--r-pill);padding:7px 16px 7px 7px;box-shadow:var(--sh-sm);}
.pr-ref-badge .pr-pav{width:34px;height:34px;font-size:13px;}
.pr-ref-badge .rb-tx{font-size:13.5px;color:var(--sl5);font-weight:600;line-height:1.2;}
.pr-ref-badge .rb-tx b{color:var(--ink);font-family:'Plus Jakarta Sans',sans-serif;}
.pr-hero-h1{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(36px,5vw,62px);font-weight:800;letter-spacing:-.025em;line-height:1.05;color:var(--ink);margin:20px 0 16px;}
.pr-hero-h1 .hl{color:var(--indigo);}
.pr-hero-lead{font-size:clamp(16px,1.3vw,19px);line-height:1.7;color:var(--sl5);max-width:520px;margin:0 0 26px;}

/* offer card */
.pr-offer-card{margin:0 0 20px;background:#fff;border:1.5px dashed var(--indigo-100);border-radius:var(--r-lg);padding:18px 20px;display:flex;align-items:center;gap:18px;box-shadow:var(--sh-sm);max-width:520px;}
.pr-offer-card .oc-gift{flex-shrink:0;width:50px;height:50px;border-radius:14px;background:var(--indigo-50);color:var(--indigo);display:grid;place-items:center;}
.pr-offer-card .oc-gift svg{width:26px;height:26px;}
.pr-offer-card .oc-main{flex:1;min-width:0;}
.pr-offer-card .oc-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;color:var(--ink);font-size:17px;line-height:1.2;}
.pr-offer-card .oc-h .em{color:var(--indigo);}
.pr-offer-card .oc-sub{font-size:13px;color:var(--sl4);font-weight:600;margin-top:3px;}
.pr-offer-card .oc-code{flex-shrink:0;text-align:center;}
.pr-offer-card .oc-code .lbl{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--sl4);font-weight:700;}
.pr-offer-card .oc-code .code{font-family:'Space Mono',monospace;font-weight:700;font-size:14px;color:var(--green-700);background:var(--green-50);border:1px dashed var(--green-100);border-radius:8px;padding:5px 10px;margin-top:4px;}
.pr-offer-card .oc-applied{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--green-600);font-weight:800;margin-top:5px;}
.pr-offer-card .oc-applied svg{width:12px;height:12px;}
@media(max-width:480px){.pr-offer-card{flex-wrap:wrap;gap:14px;}.pr-offer-card .oc-code{text-align:left;}}

.pr-hero-cta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px;}
.pr-hero-micro{font-size:13.5px;color:var(--sl4);font-weight:600;display:inline-flex;align-items:center;gap:8px;}
.pr-hero-micro svg{width:15px;height:15px;color:var(--green-600);}

/* hero visual */
.pr-hero-visual{position:relative;}
.pr-hero-visual .device{width:100%;filter:drop-shadow(0 36px 52px rgba(20,22,31,.2));}
.pr-hero-quote{position:absolute;z-index:4;bottom:6%;left:-20px;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:var(--sh-lg);padding:14px 16px;max-width:268px;animation:floaty 6s ease-in-out infinite;}
.pr-hero-quote .pq-stars{color:var(--amber);letter-spacing:1px;font-size:13px;}
.pr-hero-quote .pq-tx{font-size:13.5px;color:var(--sl7);font-weight:500;line-height:1.4;margin:6px 0 10px;}
.pr-hero-quote .pq-who{display:flex;align-items:center;gap:9px;}
.pr-hero-quote .pq-who .pr-pav{width:30px;height:30px;font-size:11px;}
.pr-hero-quote .pq-who .nm{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:12.5px;color:var(--ink);}
.pr-hero-quote .pq-who .rl{font-size:11px;color:var(--sl4);}

@media(max-width:900px){
  .pr-hero{padding:28px 0 44px;}
  .pr-hero-grid{grid-template-columns:1fr;gap:36px;}
  .pr-hero-visual{max-width:440px;margin:4px auto 0;}
  .pr-hero-quote{left:-6px;bottom:4%;max-width:230px;padding:12px 13px;}
}
@media(max-width:560px){.pr-hero-cta .pr-btn{width:100%;justify-content:center;}}

/* ── ENDORSE ── */
.pr-endorse{background:#fff;}
.pr-endorse-card{max-width:920px;margin:0 auto;background:var(--ink);color:#dfe2ef;border-radius:var(--r-xl);padding:44px clamp(28px,4vw,56px);position:relative;overflow:hidden;box-shadow:var(--sh-lg);display:grid;grid-template-columns:auto 1fr;gap:36px;align-items:center;}
.pr-endorse-card .e-glow{position:absolute;width:320px;height:320px;border-radius:50%;background:rgba(79,70,229,.38);filter:blur(76px);top:-150px;right:-90px;pointer-events:none;}
.pr-endorse-media{position:relative;z-index:2;}
.pr-endorse-media .pav-lg{width:132px;height:132px;border-radius:24px;display:grid;place-items:center;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:44px;box-shadow:var(--sh-md);}
.pr-endorse-media .play{position:absolute;right:-10px;bottom:-10px;width:44px;height:44px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:var(--sh-md);cursor:pointer;}
.pr-endorse-media .play svg{width:18px;height:18px;color:var(--indigo);margin-left:2px;}
.pr-endorse-body{position:relative;z-index:2;}
.pr-endorse-body .e-mark{font-family:'Plus Jakarta Sans',sans-serif;font-size:56px;line-height:.6;color:var(--indigo);opacity:.5;}
.pr-endorse-body .e-quote{font-size:clamp(18px,2vw,24px);line-height:1.5;color:#fff;font-weight:500;margin:8px 0 22px;}
.pr-endorse-body .e-quote b{color:#8b93ff;font-weight:700;}
.pr-endorse-body .e-who{display:flex;align-items:center;gap:12px;}
.pr-endorse-body .e-who .nm{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;color:#fff;font-size:16px;}
.pr-endorse-body .e-who .rl{font-size:13.5px;color:#aab0d8;}
.pr-endorse-body .e-who .sep{width:1px;height:30px;background:rgba(255,255,255,.18);}
@media(max-width:720px){.pr-endorse-card{grid-template-columns:1fr;gap:22px;padding:34px 26px;text-align:center;}.pr-endorse-media{margin:0 auto;}.pr-endorse-body .e-who{justify-content:center;}}

/* ── BENEFITS ── */
.pr-benefits{background:var(--bg-soft);}
.pr-benefit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
@media(max-width:900px){.pr-benefit-grid{grid-template-columns:1fr 1fr;}}
@media(max-width:560px){.pr-benefit-grid{grid-template-columns:1fr;}}
.pr-benefit-card{background:#fff;border-radius:var(--r-lg);border:1px solid var(--line);padding:26px;display:flex;gap:16px;transition:transform .2s,box-shadow .2s;}
.pr-benefit-card:hover{transform:translateY(-4px);box-shadow:var(--sh-md);}
.pr-benefit-icon{width:44px;height:44px;border-radius:14px;background:var(--indigo-50);color:var(--indigo);display:grid;place-items:center;flex-shrink:0;}
.pr-benefit-icon svg{width:22px;height:22px;}
.pr-benefit-card h3{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15px;color:var(--ink);margin:0 0 6px;}
.pr-benefit-card p{font-size:13.5px;color:var(--sl5);line-height:1.65;margin:0;}

/* ── STATS ── */
.pr-statsband{background:var(--ink);padding:72px 0;}
.pr-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center;}
@media(max-width:760px){.pr-stats-grid{grid-template-columns:1fr 1fr;gap:32px 16px;}}
.pr-stat-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(36px,4vw,56px);font-weight:800;letter-spacing:-.03em;color:#fff;line-height:1;}
.pr-stat-unit{font-size:clamp(18px,2vw,28px);color:rgba(165,180,252,.7);font-weight:700;}
.pr-stat-label{font-size:14px;color:rgba(165,180,252,.6);margin-top:8px;font-weight:600;}

/* ── TESTIMONIALS ── */
.pr-tst-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
@media(max-width:860px){.pr-tst-grid{grid-template-columns:1fr;}}
.pr-tst-card{background:#fff;border-radius:var(--r-lg);border:1px solid var(--line);padding:24px;display:flex;flex-direction:column;gap:14px;transition:transform .2s,box-shadow .2s;}
.pr-tst-card:hover{transform:translateY(-4px);box-shadow:var(--sh-md);}
.pr-tst-stars{color:var(--amber);letter-spacing:2px;font-size:13px;}
.pr-tst-quote{font-size:14px;color:var(--sl6);line-height:1.65;flex:1;font-style:italic;}
.pr-tst-who{display:flex;align-items:center;gap:10px;border-top:1px solid var(--line);padding-top:14px;}
.pr-tst-who .pr-pav{width:34px;height:34px;font-size:12px;}
.pr-tst-who .nm{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:13px;color:var(--ink);}
.pr-tst-who .rl{font-size:12px;color:var(--sl4);}

/* ── PRICING ── */
.pr-pricing-wrap{max-width:540px;margin:0 auto;}
.pr-coupon-strip{display:flex;align-items:center;justify-content:center;gap:10px;background:var(--green-50);border:1px dashed var(--green-100);border-radius:var(--r-pill);padding:10px 18px;font-size:14px;font-weight:700;color:var(--green-600);margin-bottom:14px;flex-wrap:wrap;}
.pr-coupon-strip svg{width:16px;height:16px;}
.pr-coupon-strip .code{font-family:'Space Mono',monospace;background:#fff;border:1px dashed var(--green-100);border-radius:6px;padding:2px 8px;color:var(--green-700);}
.pr-price-card{background:var(--ink);border-radius:var(--r-xl);padding:36px;position:relative;overflow:hidden;box-shadow:var(--sh-lg);}
.pr-price-card .pc-glow{position:absolute;width:300px;height:300px;border-radius:50%;background:rgba(79,70,229,.35);filter:blur(64px);top:-150px;right:-80px;pointer-events:none;}
.pr-price-card .pc-in{position:relative;z-index:1;}
.pr-price-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,.16);border:1px solid rgba(34,197,94,.3);border-radius:var(--r-pill);padding:7px 16px;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:#86efac;letter-spacing:.06em;margin-bottom:24px;}
.pr-price-free{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(36px,4.5vw,56px);font-weight:800;letter-spacing:-.03em;color:#fff;line-height:1;margin:0 0 8px;}
.pr-price-free u{color:var(--green);text-decoration:none;}
.pr-price-after{font-size:14px;color:rgba(165,180,252,.7);margin:0 0 24px;line-height:1.6;}
.pr-price-after b{color:rgba(255,255,255,.9);}
.pr-price-feats{margin:0 0 28px;display:flex;flex-direction:column;gap:10px;}
.pr-price-feat{display:flex;align-items:center;gap:10px;font-size:14px;color:rgba(219,224,255,.85);}
.pr-price-feat svg{width:16px;height:16px;color:var(--green);flex-shrink:0;}
.pr-price-note{text-align:center;font-size:12px;color:rgba(165,180,252,.5);margin-top:14px;}

/* ── FAQ ── */
.pr-faq{background:#fff;}
.pr-faq-wrap{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:8px;}
.pr-faq-item{border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden;background:#fff;transition:box-shadow .2s;}
.pr-faq-item.open{box-shadow:var(--sh-sm);}
.pr-faq-q{width:100%;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:18px 22px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;color:var(--ink);text-align:left;gap:12px;}
.pr-faq-q .pm{width:22px;height:22px;border-radius:50%;background:var(--indigo-50);color:var(--indigo);display:grid;place-items:center;flex-shrink:0;transition:transform .25s;}
.pr-faq-item.open .pr-faq-q .pm{transform:rotate(45deg);}
.pr-faq-a{max-height:0;overflow:hidden;transition:max-height .28s cubic-bezier(.4,0,.2,1);}
.pr-faq-a .inner{padding:0 22px 18px;font-size:14px;color:var(--sl5);line-height:1.7;}

/* ── FINAL CTA ── */
.pr-final{background:var(--ink);position:relative;overflow:hidden;text-align:center;}
.pr-final .pr-glow.g1{width:500px;height:500px;background:rgba(79,70,229,.3);top:-250px;left:50%;transform:translateX(-50%);}
.pr-final .pr-glow.g2{width:320px;height:320px;background:rgba(34,197,94,.15);bottom:-160px;right:-80px;}
.pr-final-inner{position:relative;z-index:1;max-width:640px;margin:0 auto;padding:96px 0;}
.pr-final-kicker{display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,.14);border:1px solid rgba(34,197,94,.3);border-radius:var(--r-pill);padding:7px 18px;font-size:13px;font-weight:700;color:#86efac;margin-bottom:22px;}
.pr-final-kicker .dot{width:7px;height:7px;border-radius:50%;background:var(--green);}
.pr-final-h2{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(28px,4vw,46px);font-weight:800;letter-spacing:-.025em;color:#fff;line-height:1.1;margin:0 0 16px;}
.pr-final-p{font-size:16px;color:rgba(165,180,252,.7);margin:0 0 36px;line-height:1.65;}
.pr-final-guar{display:inline-flex;align-items:center;gap:8px;margin-top:18px;font-size:13px;color:rgba(165,180,252,.5);font-weight:600;}
.pr-final-guar svg{width:16px;height:16px;}
@media(max-width:560px){.pr-final-inner{padding:72px 0;}.pr-final .pr-btn-lg{width:100%;justify-content:center;}}

/* ── FOOTER ── */
.pr-footer{background:var(--bg-soft);border-top:1px solid var(--line);padding:34px 0;}
.pr-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.pr-footer-ref{font-size:13px;color:var(--sl4);}
.pr-footer-ref b{color:var(--sl6);}
.pr-footer-links{display:flex;gap:18px;flex-wrap:wrap;}
.pr-footer-links a{font-size:13px;color:var(--sl4);font-weight:600;}
.pr-footer-links a:hover{color:var(--indigo);}
`

// ── Helpers ──────────────────────────────────────────────────
const PARTNER_COLORS = ['#e11d48','#ea580c','#7c3aed','#0284c7','#0f766e','#65a30d','#b45309','#db2777']
function partnerColor(slug = '') {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % PARTNER_COLORS.length
  return PARTNER_COLORS[Math.abs(h)]
}
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).filter(Boolean).join('')
}
function tipoLabel(tipo = '') {
  const map = { influencer: 'Canal parceiro', vendedor: 'Parceiro comercial', empresa: 'Empresa parceira', oficina: 'Parceiro oficial', outro: 'Parceiro BoxCerto' }
  return map[tipo] || 'Parceiro BoxCerto'
}

// ── Inline SVG icons ─────────────────────────────────────────
const IcArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)
const IcCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7"/>
  </svg>
)
const IcCheckSm = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7"/>
  </svg>
)
const IcGift = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="13" rx="1.5"/>
    <path d="M3 12h18M12 8v13"/>
    <path d="M12 8S10.5 3.5 8 4.2C6 4.8 6.6 8 9 8h3Zm0 0s1.5-4.5 4-3.8C18 4.8 17.4 8 15 8h-3Z"/>
  </svg>
)
const IcBolt = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
  </svg>
)
const IcShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>
    <path d="M8.5 12l2.5 2.5L16 9.5" strokeLinecap="round"/>
  </svg>
)
const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const IcPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

// ── Reveal on scroll ─────────────────────────────────────────
function Reveal({ children, delay = 0, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          setTimeout(() => el.classList.add('in'), delay)
          io.unobserve(el)
        }
      })
    }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [delay])
  return <Tag ref={ref} className={`pr-reveal ${className}`} {...rest}>{children}</Tag>
}

// ── PAnnounce ────────────────────────────────────────────────
function PAnnounce({ p }) {
  if (!p.coupon) return null
  return (
    <div className="pr-announce">
      <span className="pr-pulse-dot" />
      <span>Oferta de <b>{p.name}</b>: <b>{p.offerShort}</b> com o cupom{' '}
        <span className="pr-code-pill">{p.coupon}</span>
      </span>
    </div>
  )
}

// ── PNav ─────────────────────────────────────────────────────
function PNav({ p, onCTA }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`pr-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="pr-wrap pr-nav-inner">
        <div className="pr-cobrand">
          <a className="pr-brand" href="https://boxcerto.com">
            <img src="/logo.svg" alt="BoxCerto" width="32" height="32" style={{ borderRadius: 8 }} />
            <span className="pr-brand-wm">Box<b>Certo</b></span>
          </a>
          <span className="pr-cb-x">×</span>
          <span className="pr-cb-partner">
            <span className="pr-pav" style={{ background: p.color, width: 30, height: 30, fontSize: 12 }}>{p.initials}</span>
            <span className="pr-pnm">{p.name}</span>
          </span>
        </div>
        <button onClick={onCTA} className="pr-btn pr-btn-primary" style={{ fontSize: 14, padding: '10px 20px', borderRadius: 12 }}>
          Criar conta grátis <IcArrow />
        </button>
      </div>
    </header>
  )
}

// ── PHero ────────────────────────────────────────────────────
function PHero({ p, onCTA }) {
  return (
    <section className="pr-hero">
      <span className="pr-glow g1" />
      <span className="pr-glow g2" />
      <div className="pr-wrap">
        <div className="pr-hero-grid">

          {/* copy */}
          <div className="pr-hero-copy">
            <Reveal>
              <span className="pr-ref-badge">
                <span className="pr-pav" style={{ background: p.color, width: 34, height: 34, fontSize: 13 }}>{p.initials}</span>
                <span className="rb-tx">Você veio por <b>{p.name}</b><br />{p.category}</span>
              </span>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="pr-hero-h1">
                A oficina de quem confia em{' '}
                <span className="hl">{p.name}</span>{' '}
                agora roda com o BoxCerto.
              </h1>
            </Reveal>

            <Reveal delay={100}>
              <p className="pr-hero-lead">
                Faça a OS, mande o orçamento por link no WhatsApp e o cliente aprova num toque.
                Estoque, financeiro e clientes num app só — simples de verdade.
                {p.coupon && ` E como você veio pela ${p.name}, o cupom já vem com desconto.`}
              </p>
            </Reveal>

            {p.coupon && (
              <Reveal delay={130}>
                <div className="pr-offer-card">
                  <span className="oc-gift"><IcGift /></span>
                  <div className="oc-main">
                    <div className="oc-h">Oferta <span className="em">{p.name}</span>: {p.offerShort}</div>
                    <div className="oc-sub">{p.offerSub}</div>
                  </div>
                  <div className="oc-code">
                    <div className="lbl">cupom</div>
                    <div className="code">{p.coupon}</div>
                    <div className="oc-applied"><IcCheckSm /> já aplicado</div>
                  </div>
                </div>
              </Reveal>
            )}

            <Reveal delay={160}>
              <div className="pr-hero-cta">
                <button onClick={onCTA} className="pr-btn pr-btn-primary pr-btn-lg">
                  {p.coupon ? 'Criar conta com o cupom' : 'Criar conta grátis'} <IcArrow />
                </button>
                <a href="#como-funciona" className="pr-btn pr-btn-ghost pr-btn-lg">Ver como funciona</a>
              </div>
              <span className="pr-hero-micro">
                <IcCheck size={15} /> {p.coupon ? 'Cupom aplicado automaticamente · ' : ''}sem cartão · pronto em 2 minutos
              </span>
            </Reveal>
          </div>

          {/* visual */}
          <Reveal delay={80} className="pr-hero-visual">
            <img className="device" src="/hero-device.png" alt="BoxCerto no computador e no celular" width="1448" height="1086" />
            <div className="pr-hero-quote">
              <div className="pq-stars">★★★★★</div>
              <div className="pq-tx">"Mandei o orçamento e o cliente aprovou em 2 minutos. Parecia oficina grande."</div>
              <div className="pq-who">
                <span className="pr-pav" style={{ background: '#0f8a4d', width: 30, height: 30, fontSize: 11 }}>AF</span>
                <div>
                  <div className="nm">André F.</div>
                  <div className="rl">Oficina do André</div>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  )
}

// ── PEndorse ─────────────────────────────────────────────────
function PEndorse({ p }) {
  if (!p.endorsement) return null
  return (
    <section className="pr-endorse pr-section">
      <div className="pr-wrap">
        <Reveal>
          <div className="pr-endorse-card">
            <span className="e-glow" />
            <div className="pr-endorse-media">
              <div className="pav-lg" style={{ background: p.color }}>{p.initials}</div>
              <span className="play"><IcPlay /></span>
            </div>
            <div className="pr-endorse-body">
              <div className="e-mark">"</div>
              <p className="e-quote" dangerouslySetInnerHTML={{ __html: p.endorsement }} />
              <div className="e-who">
                <div className="nm">{p.name}</div>
                <span className="sep" />
                <div className="rl">{p.role}</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── PBenefits ────────────────────────────────────────────────
const BENEFITS = [
  { icon: '📋', title: 'OS e orçamento em 2 minutos', desc: 'Crie a ordem de serviço, adicione peças e serviços e gere o orçamento sem papel nenhum.' },
  { icon: '💬', title: 'Cliente aprova por link no WhatsApp', desc: 'Mande o link pelo WhatsApp. O cliente abre no celular e aprova com um toque — registrado com hora e data.' },
  { icon: '💰', title: 'Financeiro integrado', desc: 'Cada OS quitada vira receita no financeiro automaticamente. Saiba seu lucro em tempo real.' },
  { icon: '📦', title: 'Controle de estoque', desc: 'Estoque de peças atualizado a cada OS. Alerta quando o item estiver baixo.' },
  { icon: '🚗', title: 'Histórico por cliente e veículo', desc: 'Todo o histórico de serviços, peças e quilometragem por veículo num único lugar.' },
  { icon: '📱', title: 'Funciona no celular e no PC', desc: 'Acesse pelo celular na bancada ou pelo computador no escritório. Sem instalar nada.' },
]

function PBenefits({ onCTA }) {
  return (
    <section className="pr-benefits pr-section" id="como-funciona">
      <div className="pr-wrap">
        <Reveal className="pr-section-head">
          <span className="pr-eyebrow">Por que mecânicos escolhem</span>
          <h2 className="pr-h-section">Tudo que sua oficina precisa, num app só.</h2>
          <p className="pr-lead">Sem planilha, sem papel, sem app separado para cada coisa.</p>
        </Reveal>
        <div className="pr-benefit-grid">
          {BENEFITS.map(({ icon, title, desc }, i) => (
            <Reveal key={i} delay={i * 60} className="pr-benefit-card">
              <div className="pr-benefit-icon">
                <span style={{ fontSize: 22 }}>{icon}</span>
              </div>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── PStats ───────────────────────────────────────────────────
function PStats() {
  const items = [
    { num: '2', unit: 'min', label: 'para criar um orçamento' },
    { num: '1', unit: ' toque', label: 'para o cliente aprovar' },
    { num: '4,9', unit: '★', label: 'de avaliação média' },
    { num: '100', unit: '%', label: 'na nuvem, sem instalar nada' },
  ]
  return (
    <div className="pr-statsband">
      <div className="pr-wrap">
        <div className="pr-stats-grid">
          {items.map(({ num, unit, label }, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="pr-stat-num">{num}<span className="pr-stat-unit">{unit}</span></div>
              <div className="pr-stat-label">{label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── PTestimonials ────────────────────────────────────────────
const TESTIMONIALS = [
  { initials: 'MR', color: '#0f8a4d', stars: 5, quote: 'Antes levava 30 minutos no telefone pra aprovar um orçamento. Hoje mando o link e o cliente aprova em minutos.', name: 'Marcos R.', role: 'Mecânica do Marcos · Curitiba/PR' },
  { initials: 'JS', color: '#7c3aed', stars: 5, quote: 'O financeiro integrado me mostrou que eu estava ganhando menos do que achava. Com o BoxCerto, vi onde estava perdendo dinheiro.', name: 'João S.', role: 'Auto Center Silva · Goiânia/GO' },
  { initials: 'AP', color: '#ea580c', stars: 5, quote: 'Minha oficina é pequena, sou só eu. O BoxCerto me faz parecer uma empresa grande pro cliente. Vale muito.', name: 'Ana P.', role: 'Oficina da Ana · Porto Alegre/RS' },
]

function PTestimonials() {
  return (
    <section className="pr-section" style={{ background: '#fff' }}>
      <div className="pr-wrap">
        <Reveal className="pr-section-head">
          <span className="pr-eyebrow">Quem já usa</span>
          <h2 className="pr-h-section">Mecânicos reais, resultados reais.</h2>
        </Reveal>
        <div className="pr-tst-grid">
          {TESTIMONIALS.map(({ initials, color, stars, quote, name, role }, i) => (
            <Reveal key={i} delay={i * 80} className="pr-tst-card">
              <div className="pr-tst-stars">{'★'.repeat(stars)}</div>
              <p className="pr-tst-quote">"{quote}"</p>
              <div className="pr-tst-who">
                <span className="pr-pav" style={{ background: color, width: 34, height: 34, fontSize: 12 }}>{initials}</span>
                <div>
                  <div className="nm">{name}</div>
                  <div className="rl">{role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── PPricing ─────────────────────────────────────────────────
const PRICE_FEATS = [
  'OS, Orçamento, Estoque e Financeiro inclusos',
  'Orçamento aprovado por link no WhatsApp',
  'Funciona no celular e no computador',
  'Suporte humano em português',
]

function PPricing({ p, onCTA }) {
  return (
    <section className="pr-section pr-faq" id="precos">
      <div className="pr-wrap">
        <Reveal className="pr-section-head">
          <span className="pr-eyebrow">Oferta exclusiva {p.name}</span>
          <h2 className="pr-h-section">Comece grátis e ainda com desconto</h2>
          <p className="pr-lead">
            7 dias grátis pra testar, sem cartão.
            {p.coupon && ` Quando virar assinatura, seu cupom ${p.name} entra com ${p.offerShort.toLowerCase()}.`}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="pr-pricing-wrap">
            {p.coupon && (
              <div className="pr-coupon-strip">
                <IcCheckSm /> Cupom <span className="code">{p.coupon}</span> aplicado — {p.offerShort}
              </div>
            )}
            <div className="pr-price-card">
              <span className="pc-glow" />
              <div className="pc-in">
                <span className="pr-price-badge"><IcBolt /> 7 DIAS GRÁTIS · SEM CARTÃO</span>
                <div className="pr-price-free">Teste tudo por <u>R$ 0</u></div>
                <p className="pr-price-after">
                  Depois, a partir de <b>R$ 79,90/mês</b>
                  {p.coupon && <> — com o cupom {p.name}, ainda <b>{p.offerShort.toLowerCase()}</b></>}.
                </p>
                <div className="pr-price-feats">
                  {PRICE_FEATS.map(f => (
                    <div key={f} className="pr-price-feat"><IcCheckSm /> {f}</div>
                  ))}
                </div>
                <button onClick={onCTA} className="pr-btn pr-btn-green pr-btn-lg pr-btn-block">
                  {p.coupon ? 'Criar conta com o cupom' : 'Criar conta grátis'} <IcArrow />
                </button>
                <div className="pr-price-note">Sem fidelidade · cancela quando quiser</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── PFaq ─────────────────────────────────────────────────────
const FAQ = [
  ['Preciso usar o cupom? Como aplico?', 'O cupom já vai aplicado quando você cria a conta por esta página. Não precisa digitar nada — é só seguir o cadastro normalmente.'],
  ['Preciso colocar cartão pra testar?', 'Não. São 7 dias grátis com tudo liberado e sem cartão de crédito. O cupom só entra quando (e se) você decidir assinar.'],
  ['É difícil de usar?', 'É feito pra quem toca a oficina, não pra quem entende de sistema. Se você usa WhatsApp, você usa o BoxCerto — a maioria cadastra o primeiro carro em poucos minutos.'],
  ['Como o cliente aprova o orçamento?', 'Você manda um link pelo WhatsApp. O cliente abre no navegador, confere peças e valores e aprova com um toque. Fica tudo registrado com data e hora.'],
  ['Serve pra minha oficina pequena?', 'Sim. Atende mecânica geral, funilaria, auto elétrica, troca de óleo, motos e também quem trabalha sozinho.'],
]

function PFaq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="pr-section pr-faq" id="faq">
      <div className="pr-wrap">
        <Reveal className="pr-section-head">
          <span className="pr-eyebrow">Dúvidas rápidas</span>
          <h2 className="pr-h-section">Antes de criar sua conta</h2>
        </Reveal>
        <div className="pr-faq-wrap">
          {FAQ.map(([q, a], i) => (
            <Reveal key={i} delay={i * 50} className={`pr-faq-item${open === i ? ' open' : ''}`}>
              <button className="pr-faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                {q}
                <span className="pm"><IcPlus /></span>
              </button>
              <div className="pr-faq-a" style={{ maxHeight: open === i ? 200 : 0 }}>
                <div className="inner">{a}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── PFinalCta ────────────────────────────────────────────────
function PFinalCta({ p, onCTA }) {
  return (
    <section className="pr-final">
      <span className="pr-glow g1" />
      <span className="pr-glow g2" />
      <div className="pr-wrap">
        <Reveal className="pr-final-inner">
          {p.coupon && (
            <div className="pr-final-kicker">
              <span className="dot" /> Oferta {p.name} · cupom {p.coupon}
            </div>
          )}
          <h2 className="pr-final-h2">
            Crie sua conta com o desconto {p.name} ainda hoje.
          </h2>
          <p className="pr-final-p">
            7 dias grátis, sem cartão{p.coupon ? ', cupom já aplicado' : ''}. Leva 2 minutos pra começar.
          </p>
          <button onClick={onCTA} className="pr-btn pr-btn-primary pr-btn-lg">
            {p.coupon ? 'Criar conta com o cupom' : 'Criar conta grátis'} <IcArrow />
          </button>
          <div className="pr-final-guar">
            <IcShield />
            {p.coupon ? `Cupom ${p.coupon} aplicado · ` : ''}sem cartão · cancele quando quiser
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ── PFooter ──────────────────────────────────────────────────
function PFooter({ p }) {
  return (
    <footer className="pr-footer">
      <div className="pr-wrap">
        <div className="pr-footer-inner">
          <a className="pr-brand" href="https://boxcerto.com">
            <img src="/logo.svg" alt="BoxCerto" width="28" height="28" style={{ borderRadius: 7 }} />
            <span className="pr-brand-wm" style={{ fontSize: 15 }}>Box<b>Certo</b></span>
          </a>
          <div className="pr-footer-ref">
            Você chegou por <b>{p.name}</b>{p.coupon ? ` · cupom ${p.coupon}` : ''}
          </div>
          <div className="pr-footer-links">
            <a href="#precos">Oferta</a>
            <a href="#faq">Dúvidas</a>
            <a href="/termos">Termos</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Loader ───────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f7fb' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e0e3fc', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'pr-spin .7s linear infinite' }} />
      <style>{`@keyframes pr-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────
export default function ParceiroPerfil() {
  const { slug }  = useParams()
  const navigate  = useNavigate()

  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Lógica original preservada integralmente ─────────────
  useEffect(() => {
    if (!slug) { navigate('/lp', { replace: true }); return }

    supabase
      .from('affiliate_partners')
      .select('id, nome, slug, coupon_code, tipo, empresa, materials')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => {
        setLoading(false)
        if (!data) {
          // Parceiro não existe ou inativo → redireciona com ref
          try {
            const url = new URL(window.location.href)
            url.searchParams.set('ref', slug)
            window.history.replaceState({}, '', url.toString())
            captureAffiliateRef()
          } catch {}
          navigate('/lp', { replace: true })
          return
        }

        setPartner(data)

        // Salva ref e cupom no tracking
        try {
          const url = new URL(window.location.href)
          url.searchParams.set('ref', data.slug)
          window.history.replaceState({}, '', url.toString())
          captureAffiliateRef()
          if (data.coupon_code) saveAffiliateCoupon(data.coupon_code)
        } catch {}

        // Registra evento de clique (fire-and-forget)
        supabase.from('affiliate_events').insert({
          partner_id: data.id,
          event_type: 'click',
          metadata:   { source: 'perfil_lp', slug },
        }).catch(() => {})
      })
  }, [slug])

  const handleCTA = () => {
    const params = new URLSearchParams()
    if (partner?.slug)        params.set('ref', partner.slug)
    if (partner?.coupon_code) params.set('coupon', partner.coupon_code)
    navigate(`/cadastro?${params.toString()}`)
  }
  // ── Fim da lógica original ────────────────────────────────

  if (loading) return <PageLoader />
  if (!partner) return null

  // Objeto de display derivado dos dados reais do parceiro
  const mat = partner.materials || {}
  const p = {
    name:        partner.nome,
    initials:    getInitials(partner.nome),
    color:       mat.color || partnerColor(partner.slug),
    category:    mat.category || tipoLabel(partner.tipo),
    role:        mat.role || partner.empresa || tipoLabel(partner.tipo),
    coupon:      partner.coupon_code || '',
    offerShort:  mat.offerShort || '10% OFF na 1ª mensalidade',
    offerSub:    mat.offerSub   || '+ 7 dias grátis · sem cartão',
    endorsement: mat.endorsement || null,
  }

  return (
    <div className="parc-page">
      <style>{CSS}</style>

      <PAnnounce p={p} />
      <PNav p={p} onCTA={handleCTA} />
      <PHero p={p} onCTA={handleCTA} />
      <PEndorse p={p} />
      <PBenefits onCTA={handleCTA} />
      <PStats />
      <PTestimonials />
      <PPricing p={p} onCTA={handleCTA} />
      <PFaq />
      <PFinalCta p={p} onCTA={handleCTA} />
      <PFooter p={p} />
    </div>
  )
}
