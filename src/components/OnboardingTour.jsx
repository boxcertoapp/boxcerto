import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { osStorage } from '../lib/storage'

const TOUR_STORAGE_PREFIX = 'boxcerto:onboarding-tour:'
const FIRST_OS_SESSION_KEY = 'boxcerto:onboarding:first-os-active'

const STEP_ORDER = [
  'welcome',
  'open-fab',
  'plate',
  'search-plate',
  'branch-after-search',
  'existing-open',
  'client-name',
  'client-whatsapp',
  'vehicle-model',
  'create-os',
  'os-done',
  'open-os-detail',
  'send-whatsapp',
  'whatsapp-done',
  'config-logo',
  'config-address',
  'config-save',
  'final',
]

const LEGACY_STEP_MAP = {
  'criar-os': 'open-fab',
  'search-plate': 'plate',
  'branch-after-search': 'plate',
  'existing-open': 'plate',
  'enviar-orcamento': 'open-os-detail',
  'configurar-oficina': 'config-logo',
  'celebration-final': 'final',
}

const PHASES = [
  { id: 'os', label: 'OS' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'oficina', label: 'Oficina' },
]

const FIRST_OS_STEPS = new Set([
  'open-fab',
  'plate',
  'search-plate',
  'branch-after-search',
  'existing-open',
  'client-name',
  'client-whatsapp',
  'vehicle-model',
  'create-os',
])

const FORM_STEPS = new Set([
  'plate',
  'search-plate',
  'branch-after-search',
  'existing-open',
  'client-name',
  'client-whatsapp',
  'vehicle-model',
  'create-os',
])

const STEPS = {
  welcome: {
    id: 'welcome',
    kind: 'modal',
    phase: 1,
  },
  'open-fab': {
    id: 'open-fab',
    kind: 'target',
    phase: 1,
    page: '/app/oficina',
    target: '[data-tour="fab-nova-os"]',
    title: 'Toque no + para abrir sua primeira OS',
    body: 'Vamos criar uma OS de exemplo dentro do fluxo real do sistema.',
    action: 'click',
  },
  plate: {
    id: 'plate',
    kind: 'target',
    phase: 1,
    page: '/app/oficina',
    target: '[data-tour="input-placa"]',
    title: 'Digite a placa',
    body: 'Use uma placa real ou de teste. No tour da primeira OS, não vamos buscar cadastro antigo.',
    action: 'blur',
    next: 'client-name',
  },
  'search-plate': {
    id: 'search-plate',
    kind: 'target',
    phase: 1,
    page: '/app/oficina',
    target: '[data-tour="btn-buscar-placa"]',
    title: 'Busque a placa',
    body: 'O sistema verifica se o veículo já existe. Se for novo, seguimos com cliente e modelo.',
    action: 'click',
  },
  'branch-after-search': {
    id: 'branch-after-search',
    kind: 'waiting',
    phase: 1,
    title: 'Verificando a placa',
    body: 'Estou aguardando o sistema mostrar o próximo passo certo.',
  },
  'existing-open': {
    id: 'existing-open',
    kind: 'target',
    phase: 1,
    page: '/app/oficina',
    target: '[data-tour="btn-abrir-os"]',
    title: 'Abra a OS desse veículo',
    body: 'Como a placa já existe, basta abrir uma nova OS para esse cliente.',
    action: 'event',
    event: 'boxcerto:os-criada',
  },
  'client-name': {
    id: 'client-name',
    kind: 'target',
    phase: 1,
    page: '/app/oficina',
    target: '[data-tour="input-nome-cliente"]',
    title: 'Digite o nome do cliente',
    body: 'Nome é obrigatório. CPF não faz parte do tour e pode ficar em branco.',
    action: 'blur',
    next: 'client-whatsapp',
  },
  'client-whatsapp': {
    id: 'client-whatsapp',
    kind: 'target',
    phase: 1,
    page: '/app/oficina',
    target: '[data-tour="input-whatsapp"]',
    title: 'Digite o WhatsApp',
    body: 'Esse número recebe o orçamento profissional e o link de aprovação.',
    action: 'blur',
    next: 'vehicle-model',
  },
  'vehicle-model': {
    id: 'vehicle-model',
    kind: 'target',
    phase: 1,
    page: '/app/oficina',
    target: '[data-tour="input-modelo-manual"]',
    title: 'Digite o modelo do veículo',
    body: 'Aqui é digitação manual para acelerar. Exemplo: Honda CG 160 2022.',
    action: 'blur',
    next: 'create-os',
  },
  'create-os': {
    id: 'create-os',
    kind: 'target',
    phase: 1,
    page: '/app/oficina',
    target: '[data-tour="btn-criar-os"]',
    title: 'Crie e abra a primeira OS',
    body: 'Ao criar, adiciono automaticamente o item SERVIÇO EXEMPLO PRIMEIRA OS no valor de R$ 470,00.',
    action: 'event',
    event: 'boxcerto:os-criada',
  },
  'os-done': {
    id: 'os-done',
    kind: 'message',
    phase: 2,
    title: 'Concluímos nossa primeira OS',
    body: 'Perfeito. Agora vamos abrir essa OS e enviar o orçamento profissional pelo WhatsApp.',
    cta: 'Enviar pelo WhatsApp',
    next: 'open-os-detail',
  },
  'open-os-detail': {
    id: 'open-os-detail',
    kind: 'target',
    phase: 2,
    page: '/app/oficina',
    target: '[data-tour="card-onboarding-os"]',
    title: 'Abra a OS criada',
    body: 'Toque na OS que acabou de aparecer. Dentro dela fica o botão de enviar para o cliente.',
    action: 'click',
  },
  'send-whatsapp': {
    id: 'send-whatsapp',
    kind: 'target',
    phase: 2,
    page: '/app/oficina',
    target: '[data-tour="btn-enviar-cliente"]',
    title: 'Envie pelo WhatsApp',
    body: 'Clique em Enviar para cliente. O cliente recebe o link de aprovação da OS no WhatsApp.',
    action: 'event',
    event: 'boxcerto:orcamento-enviado',
  },
  'whatsapp-done': {
    id: 'whatsapp-done',
    kind: 'message',
    phase: 3,
    title: 'Ótimo, orçamento enviado',
    body: 'Agora vamos terminar de configurar sua oficina para seus PDFs e orçamentos saírem com mais confiança.',
    cta: 'Configurar oficina',
    next: 'config-logo',
  },
  'config-logo': {
    id: 'config-logo',
    kind: 'target',
    phase: 3,
    page: '/app/menu',
    pageState: { tab: 'oficina' },
    target: '[data-tour="btn-logo-oficina"]',
    title: 'Adicione o logotipo',
    body: 'O logotipo deixa PDFs e orçamentos mais profissionais. Este passo pode ser pulado.',
    action: 'optional',
    next: 'config-address',
  },
  'config-address': {
    id: 'config-address',
    kind: 'target',
    phase: 3,
    page: '/app/menu',
    pageState: { tab: 'oficina' },
    target: '[data-tour="input-endereco-oficina"]',
    title: 'Preencha o endereço',
    body: 'O endereço aparece no material enviado ao cliente e aumenta a confiança.',
    action: 'blur',
    next: 'config-save',
  },
  'config-save': {
    id: 'config-save',
    kind: 'target',
    phase: 3,
    page: '/app/menu',
    pageState: { tab: 'oficina' },
    target: '[data-tour="btn-config-oficina"]',
    title: 'Salve os dados da oficina',
    body: 'Depois de salvar, seu primeiro ciclo de onboarding estará completo.',
    action: 'event',
    event: 'boxcerto:oficina-configurada',
  },
  final: {
    id: 'final',
    kind: 'final',
    phase: 3,
  },
}

function normalizeStepId(stepId) {
  const mapped = LEGACY_STEP_MAP[stepId] || stepId
  return STEP_ORDER.includes(mapped) ? mapped : null
}

function stepRank(stepId) {
  const idx = STEP_ORDER.indexOf(stepId)
  return idx < 0 ? -1 : idx
}

function getStoredStep(userId) {
  if (!userId) return null
  try {
    return normalizeStepId(localStorage.getItem(`${TOUR_STORAGE_PREFIX}${userId}`))
  } catch {
    return null
  }
}

function getStepFromUserFlags(user) {
  if (!user) return null
  if (user.onboardingOficinaD) return 'final'
  if (user.onboardingOrcamentoDone) return 'config-logo'
  if (user.onboardingOsDone) return 'open-os-detail'
  return null
}

function laterStep(...stepIds) {
  return stepIds
    .map(normalizeStepId)
    .filter(Boolean)
    .sort((a, b) => stepRank(b) - stepRank(a))[0] || null
}

function setFirstOsSession(active) {
  try {
    if (active) sessionStorage.setItem(FIRST_OS_SESSION_KEY, '1')
    else sessionStorage.removeItem(FIRST_OS_SESSION_KEY)
  } catch {}
}

function getVisibleTarget(selector) {
  const nodes = Array.from(document.querySelectorAll(selector))
  return nodes.find(el => {
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return false
    const style = window.getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden'
  }) || null
}

function getRect(el) {
  const rect = el.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function unionRects(a, b) {
  if (!a) return b
  if (!b) return a
  const top = Math.min(a.top, b.top)
  const left = Math.min(a.left, b.left)
  const right = Math.max(a.left + a.width, b.left + b.width)
  const bottom = Math.max(a.top + a.height, b.top + b.height)
  return { top, left, width: right - left, height: bottom - top }
}

function getRectForStep(step, el) {
  const primary = getRect(el)
  const extraTargetByStep = {
    'client-name': '[data-tour="input-whatsapp"]',
    'vehicle-model': '[data-tour="btn-criar-os"]',
    'config-address': '[data-tour="btn-config-oficina"]',
  }
  const extraSelector = extraTargetByStep[step.id]
  if (!extraSelector) return primary
  const extra = getVisibleTarget(extraSelector)
  return extra ? unionRects(primary, getRect(extra)) : primary
}

function getCurrentFirstOsStepFromDom(preferredStepId) {
  if (getVisibleTarget('[data-tour="btn-enviar-cliente"]')) return 'send-whatsapp'
  if (getVisibleTarget('[data-tour="card-onboarding-os"]')) return 'open-os-detail'
  if (getVisibleTarget('[data-tour="btn-abrir-os"]')) return 'existing-open'

  if (getVisibleTarget('[data-tour="input-placa"]')) return 'plate'

  const nameInput = getVisibleTarget('[data-tour="input-nome-cliente"]')
  const whatsappInput = getVisibleTarget('[data-tour="input-whatsapp"]')
  const modelInput = getVisibleTarget('[data-tour="input-modelo-manual"]')
  const createButton = getVisibleTarget('[data-tour="btn-criar-os"]')

  if (preferredStepId === 'create-os' && createButton) return 'create-os'
  if (preferredStepId === 'vehicle-model' && modelInput) return 'vehicle-model'
  if (preferredStepId === 'client-whatsapp' && whatsappInput) return 'client-whatsapp'
  if (nameInput) return 'client-name'
  if (whatsappInput) return 'client-whatsapp'
  if (modelInput) return 'vehicle-model'
  if (createButton) return 'create-os'
  if (getVisibleTarget('[data-tour="fab-nova-os"]')) return 'open-fab'

  return null
}

function cleanPlate(value) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase()
}

function isPlateValid(value) {
  const plate = cleanPlate(value)
  return /^[A-Z]{3}\d{4}$/.test(plate) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate)
}

function isStepReady(step, el) {
  if (!step || !el) return false
  const value = String(el.value || '').trim()
  if (step.id === 'plate') return isPlateValid(value)
  if (step.id === 'client-name') return value.length >= 4
  if (step.id === 'client-whatsapp') return value.replace(/\D/g, '').length >= 10
  if (step.id === 'vehicle-model') return value.length >= 2
  if (step.id === 'config-address') return value.length >= 5
  return false
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

function scrollTargetIntoView(el) {
  const container = el.closest('[data-tour="nova-os-scroll"]')
  if (container) {
    const targetRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const visualHeight = window.visualViewport?.height || window.innerHeight
    const availableHeight = Math.min(containerRect.height, Math.max(240, visualHeight - containerRect.top - 24))
    const mobile = isMobileViewport()
    const safeTop = containerRect.top + (mobile ? 148 : 0)
    const safeBottom = containerRect.top + availableHeight - (mobile ? 18 : 0)
    const safeHeight = Math.max(90, safeBottom - safeTop)
    const wantedCenter = mobile
      ? safeTop + safeHeight * 0.42
      : containerRect.top + availableHeight * 0.42
    const delta = (targetRect.top + targetRect.height / 2) - wantedCenter
    container.scrollTo({
      top: Math.max(0, container.scrollTop + delta),
      behavior: 'smooth',
    })
    return
  }

  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
}

function preventOverlayScroll(event) {
  event.preventDefault()
  event.stopPropagation()
}

export default function OnboardingTour() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [stepId, setStepId] = useState('welcome')
  const [targetRect, setTargetRect] = useState(null)
  const [targetReady, setTargetReady] = useState(false)
  const [done, setDone] = useState(false)
  const [skipped, setSkipped] = useState(false)
  const [legacyChecking, setLegacyChecking] = useState(false)

  const activeTargetRef = useRef(null)
  const resumedUserRef = useRef(null)
  const legacyCheckedRef = useRef(null)

  const shouldShow = Boolean(user)
    && !user.isAdmin
    && !user.isTecnico
    && !user.onboardingDismissed
    && !done
    && !skipped

  const step = STEPS[stepId] || STEPS.welcome

  const goToStep = useCallback((nextId) => {
    const normalized = normalizeStepId(nextId) || 'welcome'
    setTargetRect(null)
    setTargetReady(false)
    activeTargetRef.current?.removeAttribute('data-tour-active')
    activeTargetRef.current = null
    setStepId(normalized)
  }, [])

  const patchProfile = useCallback(async (values, refresh = false) => {
    if (!user?.id) return
    try {
      await supabase.from('profiles').update(values).eq('id', user.id)
      if (refresh) await refreshUser?.()
    } catch {}
  }, [refreshUser, user?.id])

  const finishTour = useCallback(async () => {
    setDone(true)
    setFirstOsSession(false)
    if (user?.id) {
      try { localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${user.id}`) } catch {}
    }
    await patchProfile({
      onboarding_os_done: true,
      onboarding_orcamento_done: true,
      onboarding_oficina_done: true,
      onboarding_dismissed: true,
    }, true)
  }, [patchProfile, user?.id])

  const skipTour = useCallback(async () => {
    setSkipped(true)
    setFirstOsSession(false)
    if (user?.id) {
      try { localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${user.id}`) } catch {}
    }
    await patchProfile({ onboarding_dismissed: true }, true)
  }, [patchProfile, user?.id])

  useEffect(() => {
    if (!user?.id || resumedUserRef.current === user.id) return
    resumedUserRef.current = user.id
    const resumeStep = laterStep(getStoredStep(user.id), getStepFromUserFlags(user))
    if (resumeStep && resumeStep !== stepId) goToStep(resumeStep)
  }, [goToStep, stepId, user])

  useEffect(() => {
    if (!shouldShow || !user?.id) return
    try { localStorage.setItem(`${TOUR_STORAGE_PREFIX}${user.id}`, stepId) } catch {}
  }, [shouldShow, stepId, user?.id])

  useEffect(() => {
    if (!shouldShow || !user?.id || !user?.oficina) return
    if (legacyCheckedRef.current === user.id) return
    if (user.onboardingOsDone || user.onboardingOrcamentoDone || user.onboardingOficinaD) return

    legacyCheckedRef.current = user.id
    let cancelled = false
    // Roda em segundo plano. Se for uma oficina antiga com OS, o tour some;
    // se for uma conta nova, o usuário já pode começar sem ficar preso em loading.
    setLegacyChecking(false)

    osStorage.getAll(user.oficina)
      .then(async orders => {
        if (cancelled || !orders?.length) return
        setDone(true)
        setFirstOsSession(false)
        try { localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${user.id}`) } catch {}
        await patchProfile({
          onboarding_os_done: true,
          onboarding_orcamento_done: true,
          onboarding_oficina_done: true,
          onboarding_dismissed: true,
        }, true)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLegacyChecking(false)
      })

    return () => { cancelled = true }
  }, [patchProfile, shouldShow, user])

  useEffect(() => {
    if (!shouldShow || !step.page) return
    if (location.pathname !== step.page) {
      navigate(step.page, step.pageState ? { state: step.pageState } : undefined)
      return
    }
    if (step.pageState?.tab && location.state?.tab !== step.pageState.tab) {
      navigate(step.page, { state: step.pageState, replace: true })
    }
  }, [location.pathname, location.state?.tab, navigate, shouldShow, step])

  useEffect(() => {
    if (!shouldShow) return
    if (FIRST_OS_STEPS.has(stepId)) setFirstOsSession(true)
    else setFirstOsSession(false)
  }, [shouldShow, stepId])

  useEffect(() => {
    if (!shouldShow || stepId !== 'branch-after-search') return

    let cancelled = false
    const startedAt = Date.now()
    const poll = () => {
      if (cancelled) return
      if (getVisibleTarget('[data-tour="btn-abrir-os"]')) {
        goToStep('existing-open')
        return
      }
      if (getVisibleTarget('[data-tour="input-nome-cliente"]')) {
        goToStep('client-name')
        return
      }
      if (Date.now() - startedAt > 9000) {
        goToStep(getCurrentFirstOsStepFromDom('search-plate') || 'search-plate')
        return
      }
      window.setTimeout(poll, 150)
    }

    poll()
    return () => { cancelled = true }
  }, [goToStep, shouldShow, stepId])

  useEffect(() => {
    if (!shouldShow || step.kind !== 'target' || !step.target) return

    let cancelled = false
    let revealed = false
    let settleTimer = null
    let missingSince = null

    const sync = (forceReveal = false) => {
      if (cancelled) return
      const el = getVisibleTarget(step.target)
      if (!el) {
        activeTargetRef.current?.removeAttribute('data-tour-active')
        activeTargetRef.current = null
        setTargetRect(null)
        setTargetReady(false)
        if (!missingSince) missingSince = Date.now()
        if ((FORM_STEPS.has(stepId) || stepId === 'open-os-detail' || stepId === 'send-whatsapp') && Date.now() - missingSince > 500) {
          const realStep = getCurrentFirstOsStepFromDom(stepId)
          if (realStep && realStep !== stepId) goToStep(realStep)
        }
        return
      }

      missingSince = null
      if (activeTargetRef.current && activeTargetRef.current !== el) {
        activeTargetRef.current.removeAttribute('data-tour-active')
      }
      activeTargetRef.current = el
      el.setAttribute('data-tour-active', 'true')

      if (!revealed || forceReveal) {
        revealed = true
        scrollTargetIntoView(el)
        clearTimeout(settleTimer)
        settleTimer = window.setTimeout(() => {
          if (cancelled) return
          setTargetRect(getRectForStep(step, el))
          setTargetReady(isStepReady(step, el))
        }, 260)
      }

      setTargetRect(getRectForStep(step, el))
      setTargetReady(isStepReady(step, el))
    }

    const syncNow = () => sync(false)
    const recenter = () => sync(true)
    const interval = window.setInterval(syncNow, 220)

    sync(true)
    window.addEventListener('resize', recenter)
    window.addEventListener('scroll', syncNow, true)
    window.visualViewport?.addEventListener('resize', recenter)
    window.visualViewport?.addEventListener('scroll', syncNow)

    const onInput = event => {
      const el = activeTargetRef.current
      if (!el || (event.target !== el && !el.contains(event.target))) return
      setTargetReady(isStepReady(step, el))
      window.setTimeout(() => sync(false), 0)
    }

    const onFocusIn = event => {
      const el = activeTargetRef.current
      if (!el || (event.target !== el && !el.contains(event.target))) return
      window.setTimeout(recenter, 80)
      window.setTimeout(recenter, 320)
    }

    document.addEventListener('input', onInput, true)
    document.addEventListener('change', onInput, true)
    document.addEventListener('focusin', onFocusIn, true)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.clearTimeout(settleTimer)
      window.removeEventListener('resize', recenter)
      window.removeEventListener('scroll', syncNow, true)
      window.visualViewport?.removeEventListener('resize', recenter)
      window.visualViewport?.removeEventListener('scroll', syncNow)
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('change', onInput, true)
      document.removeEventListener('focusin', onFocusIn, true)
      activeTargetRef.current?.removeAttribute('data-tour-active')
      activeTargetRef.current = null
    }
  }, [shouldShow, step])

  useEffect(() => {
    if (!shouldShow) return

    const onClick = event => {
      if (event.target.closest('[data-tour="btn-fechar-nova-os"]') && FORM_STEPS.has(stepId)) {
        window.setTimeout(() => goToStep('open-fab'), 0)
        return
      }

      if (step.kind !== 'target' || !step.target) return
      const target = event.target.closest(step.target)
      if (!target) return

      if (step.id === 'open-fab') {
        setFirstOsSession(true)
        window.setTimeout(() => goToStep('plate'), 180)
        return
      }

      if (step.id === 'search-plate') {
        window.setTimeout(() => goToStep('branch-after-search'), 180)
        return
      }

      if (step.id === 'open-os-detail') {
        window.setTimeout(() => goToStep('send-whatsapp'), 220)
      }
    }

    const onFocusOut = event => {
      if (step.kind !== 'target' || step.action !== 'blur' || !step.target || !step.next) return
      const target = activeTargetRef.current
      if (!target || event.target !== target) return
      if (!isStepReady(step, target)) return
      goToStep(step.next)
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('focusout', onFocusOut, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('focusout', onFocusOut, true)
    }
  }, [goToStep, shouldShow, step, stepId])

  useEffect(() => {
    if (!shouldShow) return

    const onOsCreated = async () => {
      if (!FIRST_OS_STEPS.has(stepId)) return
      setFirstOsSession(false)
      await patchProfile({ onboarding_os_done: true })
      goToStep('os-done')
    }

    const onBudgetSent = async () => {
      if (stepId !== 'send-whatsapp') return
      await patchProfile({ onboarding_orcamento_done: true })
      goToStep('whatsapp-done')
    }

    const onOfficeSaved = async () => {
      if (stepId !== 'config-save' && stepId !== 'config-address') return
      await patchProfile({ onboarding_oficina_done: true })
      goToStep('final')
    }

    window.addEventListener('boxcerto:os-criada', onOsCreated)
    window.addEventListener('boxcerto:orcamento-enviado', onBudgetSent)
    window.addEventListener('boxcerto:oficina-configurada', onOfficeSaved)
    return () => {
      window.removeEventListener('boxcerto:os-criada', onOsCreated)
      window.removeEventListener('boxcerto:orcamento-enviado', onBudgetSent)
      window.removeEventListener('boxcerto:oficina-configurada', onOfficeSaved)
    }
  }, [goToStep, patchProfile, shouldShow, stepId])

  const phaseIndex = useMemo(() => {
    if (step.phase <= 1) return 0
    if (step.phase === 2) return 1
    return 2
  }, [step.phase])

  const continueMessage = useCallback(() => {
    if (stepId === 'os-done') {
      goToStep(getCurrentFirstOsStepFromDom('open-os-detail') || 'open-os-detail')
      return
    }
    goToStep(step.next || 'config-logo')
  }, [goToStep, step, stepId])

  if (!shouldShow) return null

  if (legacyChecking && stepId !== 'welcome') {
    return (
      <>
        <TourStyles />
        <WaitingOverlay title="Preparando seu tour" body="Estou verificando se sua oficina já tem OS criada." />
      </>
    )
  }

  if (step.kind === 'modal') {
    return (
      <div className="fixed inset-0 z-[400] flex items-end justify-center bg-slate-950/70 p-0 sm:items-center sm:p-4">
        <TourStyles />
        <div className="w-full max-w-sm rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
          <div className="px-6 pb-5 pt-7">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Tour guiado</span>
            </div>
            <h2 className="text-2xl font-extrabold leading-tight text-slate-950">
              Vamos abrir sua primeira OS juntos
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Você vai criar uma OS real, enviar pelo WhatsApp e finalizar os dados da oficina. Eu vou guiar campo por campo.
            </p>
          </div>
          <div className="border-y border-slate-100 px-6 py-4">
            {[
              'Criar a primeira OS com serviço exemplo de R$ 470,00',
              'Enviar o orçamento profissional pelo WhatsApp',
              'Adicionar logotipo e endereço da oficina',
            ].map(text => (
              <div key={text} className="flex items-start gap-3 py-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-sm font-medium text-slate-700">{text}</span>
              </div>
            ))}
          </div>
          <div className="px-6 py-5">
            <button
              onClick={() => goToStep('open-fab')}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
            >
              Começar tour guiado
            </button>
            <button
              onClick={skipTour}
              className="mt-3 w-full py-2 text-center text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              Pular tour
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step.kind === 'message') {
    return (
      <>
        <TourStyles />
        <MessageOverlay
          step={step}
          phaseIndex={phaseIndex}
          onContinue={continueMessage}
          onSkip={skipTour}
        />
      </>
    )
  }

  if (step.kind === 'final') {
    return (
      <div className="fixed inset-0 z-[400] flex items-end justify-center bg-slate-950/75 p-0 sm:items-center sm:p-4">
        <TourStyles />
        <CelebrationPieces />
        <div className="relative w-full max-w-sm rounded-t-[30px] bg-white shadow-2xl sm:rounded-[30px]">
          <div className="px-6 pb-6 pt-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-black text-white">
              1%
            </div>
            <h2 className="text-2xl font-extrabold leading-tight text-slate-950">
              Você está no top 1% das oficinas do Brasil
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Sua oficina já tem OS organizada, orçamento com link de aprovação, envio profissional pelo WhatsApp e dados prontos para PDFs mais confiáveis.
            </p>
            <button
              onClick={finishTour}
              className="mt-6 w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
            >
              Começar a aproveitar o BoxCerto
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step.kind === 'waiting') {
    return (
      <>
        <TourStyles />
        <WaitingOverlay title={step.title} body={step.body} onSkip={skipTour} />
      </>
    )
  }

  if (!targetRect) {
    return (
      <>
        <TourStyles />
        <WaitingOverlay title={step.title} body="Localizando o item certo na tela." onSkip={skipTour} />
      </>
    )
  }

  return (
    <>
      <TourStyles />
      <TargetOverlay
        rect={targetRect}
        step={step}
        phaseIndex={phaseIndex}
        targetReady={targetReady}
        onReadyNext={() => step.next && goToStep(step.next)}
        onSkipLogo={() => goToStep('config-address')}
        onSkip={skipTour}
      />
    </>
  )
}

function MessageOverlay({ step, phaseIndex, onContinue, onSkip }) {
  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center bg-slate-950/70 p-0 sm:items-center sm:p-4">
      <div data-tour="tour-message" className="w-full max-w-sm rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
        <div className="px-6 pb-6 pt-7">
          <div className="mb-4 grid grid-cols-3 gap-1.5">
            {PHASES.map((phase, index) => (
              <span
                key={phase.id}
                className={`h-1.5 rounded-full ${index <= phaseIndex ? 'bg-indigo-600' : 'bg-slate-100'}`}
              />
            ))}
          </div>
          <h2 className="text-2xl font-extrabold leading-tight text-slate-950">{step.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">{step.body}</p>
          <button
            onClick={onContinue}
            className="mt-6 w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
          >
            {step.cta || 'Continuar'}
          </button>
          <button
            onClick={onSkip}
            className="mt-3 w-full py-2 text-center text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            Pular tour
          </button>
        </div>
      </div>
    </div>
  )
}

function WaitingOverlay({ title, body, onSkip }) {
  return (
    <>
      <div
        data-tour="spotlight-overlay"
        className="fixed inset-0 z-[390] bg-slate-950/70"
        onWheel={preventOverlayScroll}
        onTouchMove={preventOverlayScroll}
        style={{ touchAction: 'none' }}
      />
      <div className="fixed inset-0 z-[395] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl">
          <div className="mb-3 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-[tourLoad_1s_ease-in-out_infinite] rounded-full bg-indigo-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-950">{title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{body}</p>
        </div>
      </div>
      {onSkip && <SkipButton onClick={onSkip} dark />}
    </>
  )
}

function TargetOverlay({ rect, step, phaseIndex, targetReady, onReadyNext, onSkipLogo, onSkip }) {
  if (isMobileViewport()) {
    return (
      <MobileTargetOverlay
        rect={rect}
        step={step}
        phaseIndex={phaseIndex}
        targetReady={targetReady}
        onReadyNext={onReadyNext}
        onSkipLogo={onSkipLogo}
        onSkip={onSkip}
      />
    )
  }

  const pad = 10
  const top = Math.max(0, rect.top - pad)
  const left = Math.max(0, rect.left - pad)
  const width = rect.width + pad * 2
  const height = rect.height + pad * 2
  const right = Math.max(0, window.innerWidth - left - width)
  const bottom = Math.max(0, window.innerHeight - top - height)
  const color = 'rgba(15, 23, 42, 0.74)'

  const viewportTop = window.visualViewport?.offsetTop || 0
  const viewportHeight = window.visualViewport?.height || window.innerHeight
  const viewportBottom = viewportTop + viewportHeight
  const cardWidth = Math.min(340, window.innerWidth - 24)
  const cardHeight = step.action === 'optional' || targetReady ? 190 : 166
  const targetCenter = left + width / 2
  const cardLeft = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, targetCenter - cardWidth / 2))
  const roomBelow = viewportBottom - (top + height)
  const roomAbove = top - viewportTop
  const placeAbove = roomBelow < cardHeight + 18 && roomAbove > roomBelow
  const cardTop = placeAbove
    ? Math.max(viewportTop + 12, top - cardHeight - 14)
    : Math.min(viewportBottom - cardHeight - 12, top + height + 14)

  const overlayStyle = { background: color, touchAction: 'none' }

  return (
    <>
      <div data-tour="spotlight-overlay" className="fixed inset-x-0 top-0 z-[390]" style={{ height: top, ...overlayStyle }} onWheel={preventOverlayScroll} onTouchMove={preventOverlayScroll} />
      <div data-tour="spotlight-overlay" className="fixed inset-x-0 z-[390]" style={{ top: top + height, bottom: 0, ...overlayStyle }} onWheel={preventOverlayScroll} onTouchMove={preventOverlayScroll} />
      <div data-tour="spotlight-overlay" className="fixed left-0 z-[390]" style={{ top, width: left, height, ...overlayStyle }} onWheel={preventOverlayScroll} onTouchMove={preventOverlayScroll} />
      <div data-tour="spotlight-overlay" className="fixed right-0 z-[390]" style={{ top, width: right, height, ...overlayStyle }} onWheel={preventOverlayScroll} onTouchMove={preventOverlayScroll} />

      <div
        className="pointer-events-none fixed z-[391] rounded-2xl"
        style={{
          top,
          left,
          width,
          height,
          boxShadow: '0 0 0 3px #4f46e5, 0 0 0 8px rgba(79,70,229,.24)',
          animation: 'tourPulse 1.4s ease-in-out infinite',
        }}
      />

      <div className="fixed z-[395]" style={{ top: cardTop, left: cardLeft, width: cardWidth }}>
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-indigo-600 px-4 py-2.5">
            <div className="flex items-center gap-2">
              {PHASES.map((phase, index) => (
                <div key={phase.id} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${index <= phaseIndex ? 'bg-white' : 'bg-white/30'}`} />
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${index <= phaseIndex ? 'text-white' : 'text-white/50'}`}>
                    {phase.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-bold text-slate-950">{step.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{step.body}</p>

            {step.action === 'blur' && (
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className={`text-xs ${targetReady ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {targetReady ? 'Pronto. Clique fora do campo ou continue.' : 'Preencha o campo para avançar.'}
                </span>
                {targetReady && (
                  <button
                    onClick={onReadyNext}
                    className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
                  >
                    Continuar
                  </button>
                )}
              </div>
            )}

            {step.action === 'optional' && (
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">Pode adicionar agora ou pular.</span>
                <button
                  onClick={onSkipLogo}
                  className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
                >
                  Pular logo
                </button>
              </div>
            )}

            {step.action === 'click' && (
              <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium text-indigo-600">
                Clique no item destacado para seguir.
              </div>
            )}

            {step.action === 'event' && (
              <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium text-indigo-600">
                Aguardando sua ação no botão destacado.
              </div>
            )}
          </div>
        </div>
      </div>

      <SkipButton onClick={onSkip} dark />
    </>
  )
}

function MobileTargetOverlay({ rect, step, phaseIndex, targetReady, onReadyNext, onSkipLogo, onSkip }) {
  const pad = 6
  const viewportTop = window.visualViewport?.offsetTop || 0
  const top = Math.max(0, rect.top - pad)
  const left = Math.max(8, rect.left - pad)
  const width = Math.max(44, Math.min(window.innerWidth - left - 8, rect.width + pad * 2))
  const height = rect.height + pad * 2
  const cardTop = Math.max(42, viewportTop + 42)

  return (
    <>
      <div
        data-tour="spotlight-overlay"
        className="pointer-events-none fixed inset-0 z-[390] bg-slate-950/45"
      />

      <div
        className="pointer-events-none fixed z-[391] rounded-2xl"
        style={{
          top,
          left,
          width,
          height,
          boxShadow: '0 0 0 3px #4f46e5, 0 0 0 7px rgba(79,70,229,.26)',
          animation: 'tourPulse 1.4s ease-in-out infinite',
        }}
      />

      <div data-tour="mobile-tour-card" className="fixed left-3 right-3 z-[395]" style={{ top: cardTop }}>
        <div className="rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-900/5">
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {PHASES.map((phase, index) => (
              <span
                key={phase.id}
                className={`h-1.5 rounded-full ${index <= phaseIndex ? 'bg-indigo-600' : 'bg-slate-100'}`}
              />
            ))}
          </div>
          <h3 className="text-[15px] font-extrabold leading-tight text-slate-950">{step.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{step.body}</p>

          {step.action === 'blur' && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className={`text-xs ${targetReady ? 'text-indigo-600' : 'text-slate-400'}`}>
                {targetReady ? 'Pronto. Toque fora do campo ou continue.' : 'Preencha o campo para avançar.'}
              </span>
              {targetReady && (
                <button
                  onClick={onReadyNext}
                  className="shrink-0 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
                >
                  Continuar
                </button>
              )}
            </div>
          )}

          {step.action === 'optional' && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-400">Pode adicionar agora ou pular.</span>
              <button
                onClick={onSkipLogo}
                className="shrink-0 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
              >
                Pular logo
              </button>
            </div>
          )}

          {step.action === 'click' && (
            <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium text-indigo-600">
              Toque no item destacado para seguir.
            </div>
          )}

          {step.action === 'event' && (
            <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium text-indigo-600">
              Aguardando sua ação no botão destacado.
            </div>
          )}
        </div>
      </div>

      <SkipButton onClick={onSkip} dark />
    </>
  )
}

function SkipButton({ onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className={`fixed right-3 top-3 z-[401] rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
        dark
          ? 'bg-white/10 text-white/55 hover:bg-white/15 hover:text-white'
          : 'bg-slate-950/5 text-slate-400 hover:bg-slate-950/10 hover:text-slate-600'
      }`}
    >
      Pular tour
    </button>
  )
}

function CelebrationPieces() {
  const pieces = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444']
  return (
    <div className="pointer-events-none fixed inset-0 z-[401] overflow-hidden">
      {Array.from({ length: 34 }, (_, index) => (
        <span
          key={index}
          className="absolute block"
          style={{
            left: `${(index * 37) % 100}%`,
            top: `-${12 + (index % 9) * 8}px`,
            width: `${6 + (index % 4)}px`,
            height: `${8 + (index % 5)}px`,
            borderRadius: index % 3 === 0 ? '999px' : '2px',
            background: pieces[index % pieces.length],
            animation: `tourConfetti ${1.9 + (index % 6) * 0.16}s ${(index % 8) * 0.08}s ease-in forwards`,
            transform: `rotate(${index * 23}deg)`,
          }}
        />
      ))}
    </div>
  )
}

function TourStyles() {
  return (
    <style>{`
      @keyframes tourPulse {
        0%, 100% { box-shadow: 0 0 0 3px #4f46e5, 0 0 0 8px rgba(79,70,229,.24); }
        50% { box-shadow: 0 0 0 3px #4f46e5, 0 0 0 16px rgba(79,70,229,0); }
      }
      @keyframes tourLoad {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(70%); }
        100% { transform: translateX(240%); }
      }
      @keyframes tourConfetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(600deg); opacity: 0; }
      }
      [data-tour-active="true"] {
        position: relative;
      }
    `}</style>
  )
}
