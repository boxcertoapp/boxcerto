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
    title: 'Clique aqui para criar sua primeira OS',
    body: 'Este botão abre a Ordem de Serviço. É onde tudo começa — cliente, veículo e serviços.',
    arrow: 'bottom-right',
    completeOn: 'boxcerto:os-criada',
  },
  {
    id: 'preencher-os',
    type: 'floating',
    page: '/app/oficina',
    title: '📝 Preencha os dados e salve',
    body: 'Adicione o nome do cliente, o WhatsApp, o veículo e pelo menos um serviço. Depois clique em Salvar.',
    completeOn: 'boxcerto:os-criada',
    // este passo é pulado se a os já foi criada neste mesmo clique — tratado no useEffect
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
    body: 'A maioria das oficinas ainda manda tudo por texto no WhatsApp — e perde clientes por isso. Você já faz diferente. Agora vamos colocar a identidade da sua oficina no sistema.',
    cta: 'Quase lá →',
  },
  {
    id: 'configurar-oficina',
    type: 'spotlight',
    page: '/app/menu',
    pageState: { tab: 'oficina' },
    target: '[data-tour="btn-config-oficina"]',
    title: 'Configure sua oficina aqui',
    body: 'Coloque o nome e os dados da sua oficina. Eles aparecem nos orçamentos que o cliente recebe.',
    arrow: 'top-right',
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

// ── Utilitários ───────────────────────────────────────────────────────────────
function getStepIndex(id) {
  return STEPS.findIndex(s => s.id === id)
}

// Polling para aguardar elemento aparecer no DOM
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const el = document.querySelector(selector)
    if (el) { resolve(el); return }
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) { observer.disconnect(); resolve(el) }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => { observer.disconnect(); resolve(null) }, timeout)
  })
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function OnboardingTour() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [stepId, setStepId]     = useState('welcome')
  const [rect,   setRect]       = useState(null)   // spotlight target rect
  const [done,   setDone]       = useState(false)  // tour concluído
  const [skipped,setSkipped]    = useState(false)
  const [animIn, setAnimIn]     = useState(true)

  const persistRef = useRef(false)

  // ── Verifica se deve mostrar ──────────────────────────────────────────────
  const shouldShow = user
    && !user.isAdmin
    && !user.isTecnico
    && !user.onboardingDismissed
    && !done
    && !skipped

  // ── Avança para o próximo passo ───────────────────────────────────────────
  const advance = useCallback((toId) => {
    setAnimIn(false)
    setTimeout(() => {
      setStepId(toId)
      setRect(null)
      setAnimIn(true)
    }, 220)
  }, [])

  const nextStep = useCallback(() => {
    const idx = getStepIndex(stepId)
    if (idx < STEPS.length - 1) {
      advance(STEPS[idx + 1].id)
    }
  }, [stepId, advance])

  // ── Navegação automática ao mudar de passo ────────────────────────────────
  useEffect(() => {
    const step = STEPS[getStepIndex(stepId)]
    if (!step || !step.page) return
    if (location.pathname !== step.page) {
      navigate(step.page, step.pageState ? { state: step.pageState } : undefined)
    }
  }, [stepId]) // eslint-disable-line

  // ── Spotlight: localiza elemento e calcula rect ───────────────────────────
  useEffect(() => {
    const step = STEPS[getStepIndex(stepId)]
    if (!step || step.type !== 'spotlight' || !step.target) return

    let cancelled = false
    waitForElement(step.target, 4000).then(el => {
      if (cancelled || !el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      // Pulsa o elemento
      el.setAttribute('data-tour-active', 'true')
    })

    // Recalcula no resize/scroll
    const recalc = () => {
      const el = document.querySelector(step.target)
      if (!el || cancelled) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('resize', recalc)
    window.addEventListener('scroll', recalc, true)

    return () => {
      cancelled = true
      window.removeEventListener('resize', recalc)
      window.removeEventListener('scroll', recalc, true)
      document.querySelector(step.target)?.removeAttribute('data-tour-active')
    }
  }, [stepId])

  // ── Listeners de conclusão de passo ──────────────────────────────────────
  useEffect(() => {
    const step = STEPS[getStepIndex(stepId)]
    if (!step?.completeOn) return

    const handler = () => {
      // Se passo atual e próximo têm mesmo evento, pula os dois
      const idx = getStepIndex(stepId)
      const nextIdx = idx + 1
      if (nextIdx < STEPS.length) {
        advance(STEPS[nextIdx].id)
      }
    }

    window.addEventListener(step.completeOn, handler)
    return () => window.removeEventListener(step.completeOn, handler)
  }, [stepId, advance])

  // ── Finalizar tour ────────────────────────────────────────────────────────
  const finalizeTour = useCallback(async () => {
    if (persistRef.current) return
    persistRef.current = true
    setDone(true)
    if (user?.id) {
      try {
        await supabase.from('profiles')
          .update({ onboarding_dismissed: true })
          .eq('id', user.id)
      } catch {}
    }
  }, [user?.id])

  // ── Pular tour ────────────────────────────────────────────────────────────
  const skipTour = useCallback(async () => {
    setSkipped(true)
    if (user?.id) {
      try {
        await supabase.from('profiles')
          .update({ onboarding_dismissed: true })
          .eq('id', user.id)
      } catch {}
    }
  }, [user?.id])

  if (!shouldShow) return null

  const step = STEPS[getStepIndex(stepId)]
  if (!step) return null

  const PROGRESS_STEPS = STEPS.filter(s => s.type !== 'celebration')
  const progressIdx = PROGRESS_STEPS.findIndex(s => s.id === stepId)
  const progressPct = progressIdx >= 0
    ? Math.round((progressIdx / (PROGRESS_STEPS.length - 1)) * 100)
    : 100

  // ── Modal de boas-vindas ──────────────────────────────────────────────────
  if (step.type === 'modal') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
          style={{ animation: animIn ? 'tourSlideUp .35s ease' : 'tourSlideDown .22s ease' }}
        >
          {/* Header gradiente */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-8 pt-10 pb-8 text-white text-center">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-2xl font-extrabold leading-tight mb-2">
              Vamos configurar sua oficina agora!
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed">
              São apenas 3 passos rápidos. No final você vai saber usar tudo — e já vai ter enviado seu primeiro orçamento profissional.
            </p>
          </div>

          {/* Passos resumidos */}
          <div className="px-6 py-5 space-y-3">
            {[
              { icon: '📋', text: 'Criar sua primeira OS' },
              { icon: '📲', text: 'Enviar orçamento pelo WhatsApp' },
              { icon: '⚙️', text: 'Configurar os dados da oficina' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-lg shrink-0">
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-slate-700">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <button
              onClick={nextStep}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-base"
            >
              Vamos lá! →
            </button>
            <button
              onClick={skipTour}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-3 py-1 transition-colors"
            >
              Pular tour e explorar sozinho
            </button>
          </div>
        </div>
        <TourStyles />
      </div>
    )
  }

  // ── Tela de celebração ────────────────────────────────────────────────────
  if (step.type === 'celebration') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <Confetti />
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden text-center"
          style={{ animation: animIn ? 'tourBounce .5s ease' : 'tourSlideDown .22s ease' }}
        >
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-10">
            <div className="text-7xl mb-4" style={{ animation: 'tourBounce .6s ease' }}>
              {step.emoji}
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              {step.title}
            </h2>
          </div>
          <div className="px-6 py-6">
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {step.body}
            </p>

            {/* Barra de progresso */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Progresso</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (step.final) finalizeTour()
                else nextStep()
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-base"
            >
              {step.cta}
            </button>
          </div>
        </div>
        <TourStyles />
      </div>
    )
  }

  // ── Spotlight ─────────────────────────────────────────────────────────────
  if (step.type === 'spotlight') {
    const PAD = 10
    const spotTop    = rect ? rect.top    - PAD : null
    const spotLeft   = rect ? rect.left   - PAD : null
    const spotWidth  = rect ? rect.width  + PAD * 2 : null
    const spotHeight = rect ? rect.height + PAD * 2 : null

    // Posição do tooltip: acima ou abaixo dependendo da metade da tela
    const above = rect && rect.top > window.innerHeight / 2

    return (
      <div className="fixed inset-0 z-[200]" style={{ pointerEvents: rect ? 'auto' : 'none' }}>
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/70 transition-all duration-300" />

        {/* Buraco do spotlight */}
        {rect && (
          <div
            className="absolute rounded-2xl transition-all duration-300"
            style={{
              top: spotTop, left: spotLeft,
              width: spotWidth, height: spotHeight,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.70)',
              background: 'transparent',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {/* Tooltip do tour */}
        {rect && (
          <div
            className="absolute z-10"
            style={{
              left: Math.min(Math.max(spotLeft + spotWidth / 2 - 160, 12), window.innerWidth - 332),
              [above ? 'bottom' : 'top']: above
                ? window.innerHeight - spotTop + 16
                : spotTop + spotHeight + 16,
              width: 320,
              animation: animIn ? 'tourSlideUp .3s ease' : 'none',
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Indicador de step */}
              <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1">
                  {PROGRESS_STEPS.map((s, i) => (
                    <div
                      key={s.id}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{ background: i <= progressIdx ? '#fff' : 'rgba(255,255,255,0.3)' }}
                    />
                  ))}
                </div>
                <span className="text-indigo-200 text-xs ml-auto">
                  {progressIdx + 1} de {PROGRESS_STEPS.length}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  👆 {step.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {step.body}
                </p>
              </div>
              {/* Seta indicando o elemento */}
              <div
                className="absolute w-4 h-4 bg-white rotate-45"
                style={{
                  [above ? 'bottom' : 'top']: -8,
                  left: Math.min(
                    Math.max(spotLeft + spotWidth / 2 - (Math.min(Math.max(spotLeft + spotWidth / 2 - 160, 12), window.innerWidth - 332)), 20),
                    300
                  ),
                  boxShadow: above
                    ? '2px 2px 4px rgba(0,0,0,0.06)'
                    : '-2px -2px 4px rgba(0,0,0,0.06)',
                }}
              />
            </div>
          </div>
        )}

        {/* Loading enquanto elemento não aparece */}
        {!rect && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-600">Abrindo a página...</span>
            </div>
          </div>
        )}

        {/* Pular discreto */}
        <button
          onClick={skipTour}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 text-xs transition-colors z-20"
        >
          Pular tour
        </button>

        <TourStyles />
      </div>
    )
  }

  // ── Floating card (sem spotlight) ─────────────────────────────────────────
  if (step.type === 'floating') {
    return (
      <>
        {/* Overlay semi-transparente leve — não bloqueia os cliques */}
        <div className="fixed inset-0 z-[190] pointer-events-none" />

        {/* Card flutuante */}
        <div
          className="fixed z-[200] left-1/2 -translate-x-1/2 bottom-28 lg:bottom-8 w-[calc(100%-32px)] max-w-sm"
          style={{ animation: animIn ? 'tourSlideUp .35s ease' : 'tourSlideDown .22s ease' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                {PROGRESS_STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i <= progressIdx ? '#fff' : 'rgba(255,255,255,0.3)' }}
                  />
                ))}
              </div>
              <span className="text-indigo-200 text-xs ml-auto">
                {progressIdx + 1} de {PROGRESS_STEPS.length}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">{step.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{step.body}</p>
              {/* Spinner esperando ação */}
              <div className="flex items-center gap-2 mt-3">
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs text-indigo-500">Aguardando você completar este passo…</span>
              </div>
            </div>
          </div>
          {/* Seta apontando para baixo */}
          <div className="flex justify-center mt-1">
            <span className="text-indigo-400 text-xl animate-bounce">↓</span>
          </div>
        </div>

        <button
          onClick={skipTour}
          className="fixed top-4 right-4 z-[201] text-slate-400 hover:text-slate-600 text-xs transition-colors"
        >
          Pular tour
        </button>

        <TourStyles />
      </>
    )
  }

  return null
}

// ── Confetti animado ──────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i)
  const colors = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[201]">
      {pieces.map(i => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20 + 5}px`,
            width: `${Math.random() * 8 + 5}px`,
            height: `${Math.random() * 8 + 5}px`,
            background: colors[i % colors.length],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confettiFall ${Math.random() * 2 + 1.5}s ${Math.random() * 0.8}s ease-in forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// ── CSS animations ────────────────────────────────────────────────────────────
function TourStyles() {
  return (
    <style>{`
      @keyframes tourSlideUp {
        from { opacity:0; transform:translateY(20px) scale(.97); }
        to   { opacity:1; transform:translateY(0)    scale(1); }
      }
      @keyframes tourSlideDown {
        from { opacity:1; transform:translateY(0)    scale(1); }
        to   { opacity:0; transform:translateY(10px) scale(.97); }
      }
      @keyframes tourBounce {
        0%   { transform:scale(.6); opacity:0; }
        60%  { transform:scale(1.15); }
        80%  { transform:scale(.95); }
        100% { transform:scale(1); opacity:1; }
      }
      @keyframes confettiFall {
        0%   { transform:translateY(0) rotate(0deg);   opacity:1; }
        100% { transform:translateY(100vh) rotate(720deg); opacity:0; }
      }
      [data-tour-active="true"] {
        outline: 3px solid #4f46e5;
        outline-offset: 4px;
        border-radius: 12px;
        animation: tourPulse 1.2s ease-in-out infinite;
        position: relative;
        z-index: 201;
      }
      @keyframes tourPulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(79,70,229,.6); }
        50%      { box-shadow: 0 0 0 10px rgba(79,70,229,0); }
      }
    `}</style>
  )
}
