import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ── Passos do tour ────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    type: 'modal',
  },
  {
    id: 'criar-os',
    type: 'spotlight',
    page: '/app/oficina',
    target: '[data-tour="fab-nova-os"]',
    title: 'Clique no + para criar sua primeira OS',
    body: 'Toque no botão azul + no canto da tela para abrir o formulário.',
    completeOn: 'boxcerto:os-criada',
    // Texto exibido DEPOIS que o FAB foi clicado (modal aberta)
    afterTitle: '✍️ Agora preencha o formulário',
    afterSteps: [
      'Digite a placa → clique "Buscar / Abrir OS"',
      'Preencha nome, WhatsApp, modelo e CPF do cliente',
      'Clique em "Criar OS" para salvar',
    ],
  },
  {
    id: 'celebration-os',
    type: 'celebration',
    emoji: '🎉',
    title: 'Parabéns! Você criou sua primeira OS!',
    body: 'Isso é o começo de uma oficina organizada. Agora vamos dar um passo ainda maior — enviar o orçamento para o cliente pelo WhatsApp.',
    cta: 'Continuar →',
  },
  {
    id: 'enviar-orcamento',
    type: 'floating',
    page: '/app/oficina',
    title: '📲 Agora envie o orçamento para o cliente',
    body: 'Abra a OS que você criou e clique no botão verde "Enviar para cliente". O cliente recebe um link e aprova no celular.',
    completeOn: 'boxcerto:orcamento-enviado',
  },
  {
    id: 'celebration-wpp',
    type: 'celebration',
    emoji: '🏆',
    title: 'Você está no top 1% das oficinas do Brasil!',
    body: 'A maioria das oficinas ainda manda tudo por texto no WhatsApp — e perde clientes por isso. Você já faz diferente. Agora vamos colocar a identidade da sua oficina.',
    cta: 'Quase lá →',
  },
  {
    id: 'configurar-oficina',
    type: 'spotlight',
    page: '/app/menu',
    pageState: { tab: 'oficina' },
    target: '[data-tour="btn-config-oficina"]',
    title: 'Preencha os dados e clique em Salvar',
    body: 'Coloque o nome e dados da sua oficina. Eles aparecem nos orçamentos que o cliente recebe.',
    completeOn: 'boxcerto:oficina-configurada',
  },
  {
    id: 'celebration-final',
    type: 'celebration',
    emoji: '🚀',
    title: 'Sua oficina está pronta para decolar!',
    body: 'Você completou todas as etapas. OS criada, orçamento enviado, oficina configurada. Agora é só usar e ver a diferença no caixa.',
    cta: 'Começar a usar →',
    final: true,
  },
]

function getIdx(id) { return STEPS.findIndex(s => s.id === id) }

// Aguarda elemento aparecer no DOM
function waitForElement(selector, timeout = 5000) {
  return new Promise(resolve => {
    const el = document.querySelector(selector)
    if (el) { resolve(el); return }
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) { obs.disconnect(); resolve(el) }
    })
    obs.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { obs.disconnect(); resolve(null) }, timeout)
  })
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function OnboardingTour() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [stepId,          setStepId]          = useState('welcome')
  const [rect,            setRect]            = useState(null)
  const [spotlightDone,   setSpotlightDone]   = useState(false) // alvo foi clicado → remove overlay
  const [done,            setDone]            = useState(false)
  const [skipped,         setSkipped]         = useState(false)
  const [animIn,          setAnimIn]          = useState(true)
  const doneRef = useRef(false)

  const shouldShow = user
    && !user.isAdmin
    && !user.isTecnico
    && !user.onboardingDismissed
    && !done
    && !skipped

  // ── Avança passo ─────────────────────────────────────────────────────────
  const advance = useCallback((toId) => {
    setAnimIn(false)
    setTimeout(() => {
      setStepId(toId)
      setRect(null)
      setSpotlightDone(false)
      setAnimIn(true)
    }, 200)
  }, [])

  const nextStep = useCallback(() => {
    const idx = getIdx(stepId)
    if (idx < STEPS.length - 1) advance(STEPS[idx + 1].id)
  }, [stepId, advance])

  // ── Navega ao mudar de passo ──────────────────────────────────────────────
  useEffect(() => {
    const step = STEPS[getIdx(stepId)]
    if (!step?.page) return
    if (location.pathname !== step.page) {
      navigate(step.page, step.pageState ? { state: step.pageState } : undefined)
    }
  }, [stepId]) // eslint-disable-line

  // ── Spotlight: calcula posição ────────────────────────────────────────────
  useEffect(() => {
    const step = STEPS[getIdx(stepId)]
    if (!step?.target || step.type !== 'spotlight') return

    let cancelled = false

    // Aguarda o elemento aparecer no DOM com polling em rAF (mais confiável que
    // MutationObserver quando o elemento é fixed e já existe no DOM mobile oculto)
    const grabRect = (el) => {
      const r = el.getBoundingClientRect()
      // Se o elemento está oculto (display:none no bloco mobile/desktop errado),
      // ele retorna rect zerado — ignora e continua tentando
      if (r.width === 0 && r.height === 0) return false
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      el.setAttribute('data-tour-active', 'true')
      return true
    }

    // Tenta imediatamente; se não achou ou rect zerado, usa polling via rAF
    const tryNow = () => {
      // Pega TODOS os elementos com o seletor e usa o que tiver rect visível
      const all = document.querySelectorAll(step.target)
      for (const el of all) {
        if (grabRect(el)) return
      }
    }

    // rAF polling até achar (máx ~5s)
    let rafId
    let start = null
    const poll = (ts) => {
      if (cancelled) return
      start = start ?? ts
      tryNow()
      const gotRect = document.querySelector(`${step.target}[data-tour-active]`)
      if (!gotRect && ts - start < 5000) {
        rafId = requestAnimationFrame(poll)
      }
    }
    rafId = requestAnimationFrame(poll)

    // Recalcula quando resize/scroll (ignora rects zerados)
    const recalc = () => {
      const all = document.querySelectorAll(step.target)
      for (const el of all) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 || r.height > 0) {
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          return
        }
      }
    }
    window.addEventListener('resize', recalc)
    window.addEventListener('scroll', recalc, true)

    // Quando o alvo for clicado, remove o overlay mas mantém o tour aguardando
    const handleTargetClick = () => setSpotlightDone(true)
    // Delega o listener ao documento para pegar cliques mesmo antes do attach direto
    const delegatedClick = (e) => {
      if (e.target.closest(step.target)) handleTargetClick()
    }
    document.addEventListener('click', delegatedClick, true)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', recalc)
      window.removeEventListener('scroll', recalc, true)
      document.removeEventListener('click', delegatedClick, true)
      document.querySelectorAll(`${step.target}[data-tour-active]`)
        .forEach(el => el.removeAttribute('data-tour-active'))
    }
  }, [stepId])

  // ── Listener de conclusão ─────────────────────────────────────────────────
  useEffect(() => {
    const step = STEPS[getIdx(stepId)]
    if (!step?.completeOn) return
    const handler = () => nextStep()
    window.addEventListener(step.completeOn, handler)
    return () => window.removeEventListener(step.completeOn, handler)
  }, [stepId, nextStep])

  // ── Finalizar ─────────────────────────────────────────────────────────────
  const finalize = useCallback(async () => {
    if (doneRef.current) return
    doneRef.current = true
    setDone(true)
    if (user?.id) {
      try { await supabase.from('profiles').update({ onboarding_dismissed: true }).eq('id', user.id) } catch {}
    }
  }, [user?.id])

  const skip = useCallback(async () => {
    setSkipped(true)
    if (user?.id) {
      try { await supabase.from('profiles').update({ onboarding_dismissed: true }).eq('id', user.id) } catch {}
    }
  }, [user?.id])

  if (!shouldShow) return null
  const step = STEPS[getIdx(stepId)]
  if (!step) return null

  const NON_CELEBRATION = STEPS.filter(s => s.type !== 'celebration')
  const progIdx = NON_CELEBRATION.findIndex(s => s.id === stepId)
  const progPct = progIdx >= 0 ? Math.round((progIdx / (NON_CELEBRATION.length - 1)) * 100) : 100

  // ── MODAL DE BOAS-VINDAS ──────────────────────────────────────────────────
  if (step.type === 'modal') return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <TourStyles />
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
        style={{ animation: 'tourUp .35s ease' }}>
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-8 pt-10 pb-8 text-white text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-2xl font-extrabold leading-tight mb-2">
            Vamos configurar sua oficina agora!
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed">
            São 3 passos rápidos. No final você já terá enviado seu primeiro orçamento profissional.
          </p>
        </div>
        <div className="px-6 py-5 space-y-3">
          {[
            { icon: '📋', text: 'Criar sua primeira OS' },
            { icon: '📲', text: 'Enviar orçamento pelo WhatsApp' },
            { icon: '⚙️', text: 'Configurar os dados da oficina' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-lg shrink-0">{item.icon}</div>
              <span className="text-sm font-medium text-slate-700">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <button onClick={nextStep}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-base">
            Vamos lá! →
          </button>
          <button onClick={skip}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-3 py-1 transition-colors">
            Pular e explorar sozinho
          </button>
        </div>
      </div>
    </div>
  )

  // ── CELEBRAÇÃO ────────────────────────────────────────────────────────────
  if (step.type === 'celebration') return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <TourStyles />
      <Confetti />
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden text-center"
        style={{ animation: 'tourBounce .5s ease' }}>
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-10">
          <div className="text-7xl mb-4">{step.emoji}</div>
          <h2 className="text-2xl font-extrabold text-white leading-tight">{step.title}</h2>
        </div>
        <div className="px-6 py-6">
          <p className="text-slate-600 text-sm leading-relaxed mb-6">{step.body}</p>
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Progresso</span><span>{progPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${progPct}%` }} />
            </div>
          </div>
          <button
            onClick={() => step.final ? finalize() : nextStep()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-base">
            {step.cta}
          </button>
        </div>
      </div>
    </div>
  )

  // ── SPOTLIGHT — 4 divs que deixam o alvo livre para clicar ───────────────
  if (step.type === 'spotlight') {
    const PAD     = 10
    const color   = 'rgba(0,0,0,0.72)'
    const TIP_W   = 288   // largura fixa do tooltip em px

    // Aguardando o elemento → overlay escuro + spinner
    if (!rect) return (
      <>
        <TourStyles />
        <div className="fixed inset-0 z-[290] pointer-events-auto" style={{ background: color }} />
        <div className="fixed inset-0 z-[296] flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600">Carregando…</span>
          </div>
        </div>
        <button onClick={skip}
          className="fixed top-4 right-4 z-[297] text-white/50 hover:text-white text-xs transition-colors">
          Pular tour
        </button>
      </>
    )

    const sTop    = rect.top    - PAD
    const sLeft   = rect.left   - PAD
    const sWidth  = rect.width  + PAD * 2
    const sHeight = rect.height + PAD * 2

    // Posição vertical: tooltip acima quando alvo está na metade inferior
    const above = rect.top > window.innerHeight * 0.5
    const SPACING = 14
    const tipVertical = above
      ? { bottom: window.innerHeight - sTop + SPACING }
      : { top: sTop + sHeight + SPACING }

    // Posição horizontal: centralizado no alvo, clamped para não vazar
    const targetCX = sLeft + sWidth / 2
    const idealLeft = targetCX - TIP_W / 2
    const tipLeft   = Math.max(12, Math.min(window.innerWidth - TIP_W - 12, idealLeft))

    // Seta: aponta para o centro do alvo mesmo que tooltip esteja clamped
    const rawArrow = targetCX - tipLeft
    const arrowX   = Math.max(20, Math.min(TIP_W - 20, rawArrow))

    // ── Alvo já foi clicado → guia passo-a-passo pelo formulário ──────────
    if (spotlightDone) return (
      <>
        <TourStyles />
        <div className="fixed z-[300] top-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-sm"
          style={{ animation: 'tourUp .25s ease' }}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Barra topo */}
            <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                {NON_CELEBRATION.map((s, i) => (
                  <div key={s.id} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i <= progIdx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                ))}
              </div>
              <span className="text-indigo-200 text-xs ml-auto">
                {progIdx + 1} de {NON_CELEBRATION.length}
              </span>
            </div>
            <div className="px-4 pt-3 pb-4">
              <h3 className="font-bold text-slate-900 text-sm mb-2">
                {step.afterTitle || step.title}
              </h3>
              {/* Mini checklist de passos */}
              {step.afterSteps ? (
                <ol className="space-y-1.5 mb-3">
                  {step.afterSteps.map((txt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600
                        font-bold text-[10px] flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span>{txt}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-slate-500 text-xs leading-relaxed mb-3">{step.body}</p>
              )}
              {/* Rodapé: spinner + botão manual */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-[11px] text-slate-400">Aguardando criação da OS…</span>
                </div>
                <button
                  onClick={nextStep}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                  Já criei →
                </button>
              </div>
            </div>
          </div>
        </div>
        <button onClick={skip}
          className="fixed top-3 right-3 z-[301] text-slate-300 hover:text-slate-500 text-[11px] transition-colors">
          Pular
        </button>
      </>
    )

    return (
      <>
        <TourStyles />

        {/* ── 4 overlays que NÃO cobrem o alvo ─────── */}
        {/* Topo */}
        <div className="fixed inset-x-0 top-0 z-[290] pointer-events-auto"
          style={{ height: sTop, background: color }} />
        {/* Baixo */}
        <div className="fixed inset-x-0 z-[290] pointer-events-auto"
          style={{ top: sTop + sHeight, bottom: 0, background: color }} />
        {/* Esquerda */}
        <div className="fixed left-0 z-[290] pointer-events-auto"
          style={{ top: sTop, width: sLeft, height: sHeight, background: color }} />
        {/* Direita */}
        <div className="fixed right-0 z-[290] pointer-events-auto"
          style={{ top: sTop, left: sLeft + sWidth, height: sHeight, background: color }} />

        {/* Borda pulsante ao redor do alvo */}
        <div className="fixed z-[291] pointer-events-none rounded-2xl"
          style={{
            top: sTop, left: sLeft, width: sWidth, height: sHeight,
            boxShadow: '0 0 0 3px #4f46e5, 0 0 0 6px rgba(79,70,229,0.3)',
            animation: 'tourPulse 1.4s ease-in-out infinite',
          }} />

        {/* ── Tooltip ──────────────────────────────── */}
        <div className="fixed z-[295]" style={{ left: tipLeft, width: TIP_W, ...tipVertical }}>

          {/* Seta apontando PARA CIMA → tooltip está abaixo do alvo */}
          {!above && (
            <div style={{
              position: 'absolute', bottom: '100%', left: arrowX - 7, marginBottom: -1,
              width: 0, height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderBottom: '7px solid #4f46e5',
            }} />
          )}

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ animation: 'tourUp .3s ease' }}>
            <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                {NON_CELEBRATION.map((s, i) => (
                  <div key={s.id} className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: i <= progIdx ? '#fff' : 'rgba(255,255,255,0.35)' }} />
                ))}
              </div>
              <span className="text-indigo-200 text-xs ml-auto">
                {progIdx + 1} de {NON_CELEBRATION.length}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">👆 {step.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{step.body}</p>
            </div>
          </div>

          {/* Seta apontando PARA BAIXO → tooltip está acima do alvo */}
          {above && (
            <div style={{
              position: 'absolute', top: '100%', left: arrowX - 7, marginTop: -1,
              width: 0, height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid white',
            }} />
          )}
        </div>

        {/* Pular */}
        <button onClick={skip}
          className="fixed top-4 right-4 z-[297] text-white/50 hover:text-white text-xs transition-colors">
          Pular tour
        </button>
      </>
    )
  }

  // ── FLOATING CARD ─────────────────────────────────────────────────────────
  if (step.type === 'floating') return (
    <>
      <TourStyles />
      <div className="fixed z-[300] left-1/2 -translate-x-1/2 bottom-28 lg:bottom-8 w-[calc(100%-32px)] max-w-sm"
        style={{ animation: animIn ? 'tourUp .35s ease' : 'none' }}>
        <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden">
          <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1">
              {NON_CELEBRATION.map((s, i) => (
                <div key={s.id} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: i <= progIdx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </div>
            <span className="text-indigo-200 text-xs ml-auto">
              {progIdx + 1} de {NON_CELEBRATION.length}
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-slate-900 text-sm mb-1.5">{step.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{step.body}</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-xs text-indigo-500">Aguardando você completar este passo…</span>
            </div>
          </div>
        </div>
      </div>
      <button onClick={skip}
        className="fixed top-4 right-4 z-[301] text-slate-400 hover:text-slate-600 text-xs transition-colors">
        Pular tour
      </button>
    </>
  )

  return null
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ['#4f46e5','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899']
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[302]">
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} className="absolute" style={{
          left: `${Math.random() * 100}%`,
          top: `-${Math.random() * 20 + 5}px`,
          width: `${Math.random() * 8 + 5}px`,
          height: `${Math.random() * 8 + 5}px`,
          background: colors[i % colors.length],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confettiFall ${Math.random() * 2 + 1.5}s ${Math.random() * 0.8}s ease-in forwards`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
    </div>
  )
}

// ── Animações CSS ─────────────────────────────────────────────────────────────
function TourStyles() {
  return (
    <style>{`
      @keyframes tourUp {
        from { opacity:0; transform:translateY(16px) scale(.97) }
        to   { opacity:1; transform:translateY(0) scale(1) }
      }
      @keyframes tourBounce {
        0%   { transform:scale(.65); opacity:0 }
        60%  { transform:scale(1.1) }
        80%  { transform:scale(.96) }
        100% { transform:scale(1); opacity:1 }
      }
      @keyframes tourPulse {
        0%,100% { box-shadow:0 0 0 3px #4f46e5, 0 0 0 6px rgba(79,70,229,.3) }
        50%     { box-shadow:0 0 0 3px #4f46e5, 0 0 0 14px rgba(79,70,229,0) }
      }
      @keyframes confettiFall {
        0%   { transform:translateY(0) rotate(0deg); opacity:1 }
        100% { transform:translateY(100vh) rotate(720deg); opacity:0 }
      }
      [data-tour-active="true"] {
        z-index:292 !important;
      }
    `}</style>
  )
}
