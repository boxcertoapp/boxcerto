import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ── Sub-passos do formulário Nova OS ─────────────────────────────────────────
// Fluxo: placa → buscar → (btn-abrir-os OU nome→wpp→marca→ano→modelo→confirmar) → criar-os
// skipAfter: tempo (ms) antes de pular automaticamente se o elemento não aparecer
const FORM_SUBSTEPS = [
  { sel: '[data-tour="input-placa"]',             title: 'Digite a placa',              body: 'Formato antigo: ABC-1234 · Mercosul: ABC-1A23' },
  { sel: '[data-tour="btn-buscar-placa"]',         title: 'Clique em Buscar / Abrir OS', body: 'O sistema verifica se o veículo já está cadastrado.' },
  // Caminho "veículo já existe" — aparece só se placa encontrada
  { sel: '[data-tour="btn-abrir-os"]',             title: 'Veículo encontrado!',         body: 'Clique para abrir a Ordem de Serviço diretamente.',  skipAfter: 3500 },
  // Caminho "novo cliente" — aparece se placa não encontrada
  { sel: '[data-tour="input-nome-cliente"]',       title: 'Nome do cliente *',           body: 'Obrigatório. Digite 4+ letras para ver sugestões.',  skipAfter: 1500 },
  { sel: '[data-tour="input-whatsapp"]',           title: 'WhatsApp *',                  body: 'Obrigatório — o cliente recebe o orçamento aqui.',   skipAfter: 1500 },
  // FipeSeletor — 3 etapas em cascata
  { sel: '[data-tour="select-marca"]',             title: 'Marca do veículo *',          body: 'Escolha o tipo (carro/moto/caminhão) e a montadora.', skipAfter: 1500 },
  { sel: '[data-tour="select-ano"]',               title: 'Ano do veículo *',            body: 'A lista de anos carrega após escolher a marca.',     skipAfter: 12000 },
  { sel: '[data-tour="select-modelo-container"]',  title: 'Modelo *',                    body: 'Filtre pelo nome e clique no modelo desejado.',      skipAfter: 12000 },
  { sel: '[data-tour="btn-confirmar-modelo"]',     title: 'Confirme o veículo',          body: 'Clique em Confirmar para usar este veículo.',        skipAfter: 12000 },
  // Botão final
  { sel: '[data-tour="btn-criar-os"]',             title: 'Cadastrar e Abrir OS',        body: 'Tudo preenchido! Clique para criar a OS.' },
]

// ── Passos principais do tour ─────────────────────────────────────────────────
const STEPS = [
  { id: 'welcome', type: 'modal' },
  {
    id: 'criar-os',
    type: 'spotlight',
    page: '/app/oficina',
    target: '[data-tour="fab-nova-os"]',
    title: 'Toque no + para criar sua primeira OS',
    body: 'Toque no botão azul + no canto da tela.',
    completeOn: 'boxcerto:os-criada',
    completeColumn: 'onboarding_os_done',
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
    completeColumn: 'onboarding_orcamento_done',
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
    // FIX: era 'spotlight' com target=[data-tour="btn-config-oficina"],
    // mas esse botão só renderiza quando isDirty||saved → poll nunca achava
    // → overlay bloqueante cobria a página inteira → usuário não conseguia digitar.
    // Solução: floating card não-bloqueante; completeOn avança quando o usuário salvar.
    type: 'floating',
    page: '/app/menu',
    pageState: { tab: 'oficina' },
    title: '⚙️ Preencha os dados da oficina',
    body: 'Digite o nome e telefone da sua oficina e clique em Salvar. Esses dados aparecem nos orçamentos enviados aos clientes.',
    completeOn: 'boxcerto:oficina-configurada',
    completeColumn: 'onboarding_oficina_done',
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

const TOUR_STORAGE_PREFIX = 'boxcerto:onboarding-tour:'

function getStoredStep(userId) {
  if (!userId) return null
  try {
    const stepId = localStorage.getItem(`${TOUR_STORAGE_PREFIX}${userId}`)
    return getIdx(stepId) >= 0 ? stepId : null
  } catch {
    return null
  }
}

function getCompletedStep(user) {
  if (!user) return null
  if (user.onboardingOsDone && user.onboardingOrcamentoDone && user.onboardingOficinaD) return 'celebration-final'
  if (user.onboardingOsDone && user.onboardingOrcamentoDone) return 'configurar-oficina'
  if (user.onboardingOsDone) return 'enviar-orcamento'
  return null
}

function getLaterStep(...stepIds) {
  return stepIds
    .filter(stepId => getIdx(stepId) >= 0)
    .sort((a, b) => getIdx(b) - getIdx(a))[0] || null
}

// ── Componente principal ──────────────────────────────────────────────────────
function isSubstepValueReady(sub, el) {
  if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'SELECT')) return false

  const value = String(el.value || '').trim()
  if (el.tagName === 'SELECT') return value.length > 0
  if (sub.sel === '[data-tour="input-placa"]') {
    return value.replace(/[^a-z0-9]/gi, '').length >= 7
  }
  if (sub.sel === '[data-tour="input-nome-cliente"]') return value.length >= 4
  if (sub.sel === '[data-tour="input-whatsapp"]') {
    return value.replace(/\D/g, '').length >= 10
  }

  return value.length > 0
}

export default function OnboardingTour() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  const [stepId,     setStepId]     = useState('welcome')
  const [rect,       setRect]       = useState(null)      // rect do FAB / btn-config
  const [formActive, setFormActive] = useState(false)     // true após FAB clicado
  const [formSubIdx, setFormSubIdx] = useState(0)         // índice em FORM_SUBSTEPS
  const [formRect,   setFormRect]   = useState(null)      // rect do campo atual
  const [done,       setDone]       = useState(false)
  const [skipped,    setSkipped]    = useState(false)
  const [animIn,     setAnimIn]     = useState(true)
  const doneRef = useRef(false)
  const resumedUserRef = useRef(null)

  const shouldShow = user && !user.isAdmin && !user.isTecnico
    && !user.onboardingDismissed && !done && !skipped

  // ── Avança passo principal ────────────────────────────────────────────────
  const advance = useCallback((toId) => {
    setAnimIn(false)
    setTimeout(() => {
      setStepId(toId)
      setRect(null)
      setFormActive(false)
      setFormSubIdx(0)
      setFormRect(null)
      setAnimIn(true)
    }, 200)
  }, [])

  const nextStep = useCallback(() => {
    const idx = getIdx(stepId)
    if (idx < STEPS.length - 1) advance(STEPS[idx + 1].id)
  }, [stepId, advance])

  // ── FIX 1: sempre incrementa — nunca retorna prev ─────────────────────────
  // Antes: fazia scan síncrono e retornava prev se não achava → travado para sempre
  // Agora: incrementa incondicionalmente; o useEffect poleia pelo novo elemento;
  //        se não aparecer, o skipAfter do novo sub-passo o avança automaticamente.
  const nextFormSub = useCallback(() => {
    setFormRect(null)
    setFormSubIdx(prev => Math.min(prev + 1, FORM_SUBSTEPS.length - 1))
  }, [])

  // Retoma o passo salvo no navegador e nunca volta atras de tarefas ja concluidas.
  useEffect(() => {
    if (!user?.id || resumedUserRef.current === user.id) return
    resumedUserRef.current = user.id
    const resumeStep = getLaterStep(getStoredStep(user.id), getCompletedStep(user))
    if (!resumeStep || resumeStep === stepId) return
    setStepId(resumeStep)
    setRect(null)
    setFormActive(false)
    setFormSubIdx(0)
    setFormRect(null)
  }, [stepId, user])

  useEffect(() => {
    if (!user?.id || done || skipped) return
    try { localStorage.setItem(`${TOUR_STORAGE_PREFIX}${user.id}`, stepId) } catch {}
  }, [done, skipped, stepId, user?.id])

  // ── Navega ao mudar de passo principal ────────────────────────────────────
  useEffect(() => {
    const step = STEPS[getIdx(stepId)]
    if (!step?.page) return
    if (location.pathname !== step.page) {
      navigate(step.page, step.pageState ? { state: step.pageState } : undefined)
    }
  }, [stepId]) // eslint-disable-line

  // ── Spotlight do alvo PRINCIPAL (FAB ou btn-config) ───────────────────────
  useEffect(() => {
    const step = STEPS[getIdx(stepId)]
    if (!step?.target || step.type !== 'spotlight') return
    if (formActive) return   // sub-passos assumem o controle

    let cancelled = false
    let rafId
    let start = null

    const grabRect = () => {
      const all = document.querySelectorAll(step.target)
      for (const el of all) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          el.setAttribute('data-tour-active', 'true')
          return true
        }
      }
      return false
    }

    const poll = (ts) => {
      if (cancelled) return
      start = start ?? ts
      if (!grabRect() && ts - start < 5000) rafId = requestAnimationFrame(poll)
    }
    rafId = requestAnimationFrame(poll)

    const recalc = () => {
      if (formActive) return
      const all = document.querySelectorAll(step.target)
      for (const el of all) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          return
        }
      }
    }
    window.addEventListener('resize', recalc)
    window.addEventListener('scroll', recalc, true)

    // FAB clicado → ativa modo sub-passos
    const onFabClick = (e) => {
      if (e.target.closest(step.target)) setFormActive(true)
    }
    document.addEventListener('click', onFabClick, true)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', recalc)
      window.removeEventListener('scroll', recalc, true)
      document.removeEventListener('click', onFabClick, true)
      document.querySelectorAll(`${step.target}[data-tour-active]`)
        .forEach(el => el.removeAttribute('data-tour-active'))
    }
  }, [stepId, formActive])

  // ── Sub-passos do formulário ──────────────────────────────────────────────
  useEffect(() => {
    if (!formActive) return
    if (STEPS[getIdx(stepId)]?.id !== 'criar-os') return

    const sub = FORM_SUBSTEPS[formSubIdx]
    if (!sub) return

    let cancelled = false
    let rafId
    let skipTimer = null
    let advanceTimer = null
    let foundVisibleTarget = false
    let revealedTarget = false

    const scheduleNextFormSub = () => {
      clearTimeout(advanceTimer)
      advanceTimer = setTimeout(nextFormSub, 120)
    }

    const revealFormTarget = (el) => {
      if (revealedTarget) return
      revealedTarget = true
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    }

    const grabFormRect = () => {
      const all = document.querySelectorAll(sub.sel)
      for (const el of all) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          foundVisibleTarget = true
          revealFormTarget(el)
          setFormRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          el.setAttribute('data-tour-active', 'true')
          return true
        }
      }
      return false
    }

    // Polling contínuo até achar (sem timeout — skipAfter cancela se necessário)
    const poll = () => {
      if (cancelled) return
      if (!grabFormRect()) rafId = requestAnimationFrame(poll)
    }
    rafId = requestAnimationFrame(poll)

    // Pula automaticamente se o elemento não aparecer no tempo estipulado
    if (sub.skipAfter) {
      skipTimer = setTimeout(() => {
        if (!cancelled && !foundVisibleTarget) nextFormSub()
      }, sub.skipAfter)
    }

    const recalc = () => {
      const all = document.querySelectorAll(sub.sel)
      for (const el of all) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          foundVisibleTarget = true
          setFormRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          return
        }
      }
    }
    window.addEventListener('resize', recalc)
    window.addEventListener('scroll', recalc, true)

    // Avanca com botoes reais; inputs ficam no campo ate o usuario pedir o proximo.
    const onSubClick = (e) => {
      const all = document.querySelectorAll(sub.sel)
      for (const el of all) {
        if (el.contains(e.target) || el === e.target) {
          const clickedButton = e.target.closest('button')
          const pickedFipeModel = sub.sel === '[data-tour="select-modelo-container"]'
            && clickedButton?.matches('[data-tour="btn-modelo-fipe"]')
          if (el.tagName === 'BUTTON' || pickedFipeModel) {
            scheduleNextFormSub()
          }
          return
        }
      }
    }
    document.addEventListener('click', onSubClick, true)

    // Abrir o dropdown nao basta; a troca do select e que avanca o tour.
    const onSubChange = (e) => {
      const all = document.querySelectorAll(sub.sel)
      for (const el of all) {
        if (el.tagName === 'SELECT' && el === e.target) {
          scheduleNextFormSub()
          return
        }
      }
    }
    document.addEventListener('change', onSubChange, true)

    // Inputs advance only after the user leaves a filled guided field.
    const onSubFocusOut = (e) => {
      const all = document.querySelectorAll(sub.sel)
      for (const el of all) {
        if (el === e.target && isSubstepValueReady(sub, el)) {
          scheduleNextFormSub()
          return
        }
      }
    }
    document.addEventListener('focusout', onSubFocusOut, true)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      clearTimeout(skipTimer)
      clearTimeout(advanceTimer)
      window.removeEventListener('resize', recalc)
      window.removeEventListener('scroll', recalc, true)
      document.removeEventListener('click', onSubClick, true)
      document.removeEventListener('change', onSubChange, true)
      document.removeEventListener('focusout', onSubFocusOut, true)
      document.querySelectorAll(`${sub.sel}[data-tour-active]`)
        .forEach(el => el.removeAttribute('data-tour-active'))
    }
  }, [formSubIdx, formActive, stepId, nextFormSub])

  // ── Listener do evento de conclusão do passo principal ────────────────────
  useEffect(() => {
    const step = STEPS[getIdx(stepId)]
    if (!step?.completeOn) return
    const handler = () => {
      if (step.completeColumn && user?.id) {
        supabase.from('profiles')
          .update({ [step.completeColumn]: true })
          .eq('id', user.id)
          .then(() => {})
          .catch(() => {})
      }
      nextStep()
    }
    window.addEventListener(step.completeOn, handler)
    return () => window.removeEventListener(step.completeOn, handler)
  }, [stepId, nextStep, user?.id])

  // ── Finalizar / pular ─────────────────────────────────────────────────────
  const finalize = useCallback(async () => {
    if (doneRef.current) return
    doneRef.current = true
    setDone(true)
    if (user?.id) {
      try { localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${user.id}`) } catch {}
    }
    if (user?.id) {
      try { await supabase.from('profiles').update({ onboarding_dismissed: true }).eq('id', user.id) } catch {}
    }
  }, [user?.id])

  const skip = useCallback(async () => {
    setSkipped(true)
    if (user?.id) {
      try { localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${user.id}`) } catch {}
    }
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
          <h2 className="text-2xl font-extrabold leading-tight mb-2">Vamos configurar sua oficina agora!</h2>
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
            <span className="text-indigo-200 text-xs ml-auto">{progIdx + 1} de {NON_CELEBRATION.length}</span>
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

  // ── SPOTLIGHT ─────────────────────────────────────────────────────────────
  if (step.type === 'spotlight') {
    const activeRect = formActive ? formRect : rect
    const activeSub  = formActive ? FORM_SUBSTEPS[formSubIdx] : null

    const PAD   = 10
    const color = 'rgba(0,0,0,0.72)'
    const TIP_W = 288

    // ── Estado de espera — elemento ainda não apareceu ──────────────────────
    // FIX 2: quando formActive, overlay NÃO bloqueia pointer events
    //   → usuário pode interagir com o modal mesmo durante a transição
    if (!activeRect) return (
      <>
        <TourStyles />

        {/* Overlay: bloqueia interação apenas se NÃO estiver no modo formulário */}
        <div className="fixed inset-0 z-[290]"
          style={{ background: color, pointerEvents: formActive ? 'none' : 'auto' }} />

        {formActive && activeSub ? (
          // Card flutuante — não bloqueia a tela, informa o próximo campo
          <div className="fixed z-[295] left-1/2 -translate-x-1/2 bottom-8 w-[calc(100%-32px)] max-w-sm"
            style={{ animation: 'tourUp .3s ease' }}>
            <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden">
              <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1">
                  {NON_CELEBRATION.map((s, i) => (
                    <div key={s.id} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: i <= progIdx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                  ))}
                </div>
                <span className="text-indigo-200 text-xs ml-auto">{progIdx + 1} de {NON_CELEBRATION.length}</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{activeSub.title}</h3>
                {activeSub.body && <p className="text-slate-500 text-xs leading-relaxed">{activeSub.body}</p>}
                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-xs text-indigo-400 flex-1">Localizando campo…</span>
                  <button onClick={nextFormSub}
                    className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">
                    Pular →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Spinner genérico (procurando FAB ou btn-config)
          <div className="fixed inset-0 z-[295] flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-600">Carregando…</span>
            </div>
          </div>
        )}

        {formActive && (
          <button onClick={nextStep}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[296] bg-white/10 backdrop-blur-sm text-white/70 text-xs px-4 py-2 rounded-full hover:text-white hover:bg-white/20 transition-colors">
            Já criei a OS →
          </button>
        )}
        <button onClick={skip}
          className="fixed top-4 right-4 z-[296] text-white/50 hover:text-white text-xs transition-colors">
          Pular tour
        </button>
      </>
    )

    // ── Spotlight ativo — elemento encontrado ───────────────────────────────
    const sTop   = activeRect.top    - PAD
    const sLeft  = activeRect.left   - PAD
    const sWidth = activeRect.width  + PAD * 2
    const sHeight= activeRect.height + PAD * 2

    const above    = activeRect.top > window.innerHeight * 0.5
    const SPACING  = 14
    const tipVert  = above
      ? { bottom: window.innerHeight - sTop + SPACING }
      : { top: sTop + sHeight + SPACING }

    const targetCX = sLeft + sWidth / 2
    const idealLeft= targetCX - TIP_W / 2
    const tipLeft  = Math.max(12, Math.min(window.innerWidth - TIP_W - 12, idealLeft))
    const arrowX   = Math.max(20, Math.min(TIP_W - 20, targetCX - tipLeft))

    const title = activeSub ? activeSub.title : step.title
    const body  = activeSub ? activeSub.body  : step.body

    return (
      <>
        <TourStyles />

        {/* ── 4 overlays que formam a moldura escura em volta do spotlight ── */}
        <div className="fixed inset-x-0 top-0 z-[290] pointer-events-auto"
          style={{ height: sTop, background: color, pointerEvents: formActive ? 'none' : 'auto' }} />
        <div className="fixed inset-x-0 z-[290] pointer-events-auto"
          style={{ top: sTop + sHeight, bottom: 0, background: color, pointerEvents: formActive ? 'none' : 'auto' }} />
        <div className="fixed left-0 z-[290] pointer-events-auto"
          style={{ top: sTop, width: sLeft, height: sHeight, background: color, pointerEvents: formActive ? 'none' : 'auto' }} />
        <div className="fixed right-0 z-[290] pointer-events-auto"
          style={{ top: sTop, left: sLeft + sWidth, height: sHeight, background: color, pointerEvents: formActive ? 'none' : 'auto' }} />

        {/* Borda pulsante ao redor do elemento */}
        <div className="fixed z-[291] pointer-events-none rounded-xl"
          style={{
            top: sTop, left: sLeft, width: sWidth, height: sHeight,
            boxShadow: '0 0 0 3px #4f46e5, 0 0 0 6px rgba(79,70,229,0.3)',
            animation: 'tourPulse 1.4s ease-in-out infinite',
          }} />

        {/* ── Tooltip ── */}
        <div className="fixed z-[295]" style={{ left: tipLeft, width: TIP_W, ...tipVert }}>

          {/* Seta apontando para cima (tooltip abaixo do elemento) */}
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
              <span className="text-indigo-200 text-xs ml-auto">{progIdx + 1} de {NON_CELEBRATION.length}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
              {body ? <p className="text-slate-500 text-xs leading-relaxed">{body}</p> : null}

              {/* Botões de escape no modo sub-passos */}
              {formActive && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button onClick={nextFormSub}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                    Próximo campo →
                  </button>
                  <button onClick={nextStep}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                    Já criei a OS
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Seta apontando para baixo (tooltip acima do elemento) */}
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

        {/* Botão pular */}
        <button onClick={skip}
          className="fixed top-4 right-4 z-[297] text-white/50 hover:text-white text-xs transition-colors">
          Pular tour
        </button>
      </>
    )
  }

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
        z-index: 292 !important;
      }
    `}</style>
  )
}
