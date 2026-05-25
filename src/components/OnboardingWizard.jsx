import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Check, ChevronRight, ChevronLeft, Loader2, AlertCircle,
  Camera, MapPin, Send, MessageCircle, Sparkles,
  Rocket, Zap, Smartphone, CheckCircle2, Plus,
  Trophy, Sliders, ClipboardCheck, BarChart3,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  clientStorage, vehicleStorage, osStorage, itemStorage,
  officeDataStorage, formatCurrency,
} from '../lib/storage'
import { titleCaseName } from '../lib/text'
import { usePWAInstall } from '../hooks/usePWAInstall'
import PWAInstallSheet from './PWAInstallSheet'

const STORAGE_KEY_PREFIX = 'boxcerto:onboarding:'

const EXAMPLE_ITEM = {
  descricao: 'SERVIÇO EXEMPLO PRIMEIRA OS',
  custo: 0,
  venda: 470,
  garantia: '',
}

const PHASES = [
  { id: 'os', label: 'OS' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'oficina', label: 'Oficina' },
]

const OS_STEPS = [
  { key: 'plate', label: 'Placa' },
  { key: 'name', label: 'Cliente' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'model', label: 'Veículo' },
  { key: 'confirm', label: 'Criar OS' },
]

function formatPlate(v) {
  const clean = String(v || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (clean.length <= 3) return clean
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`
}

function isPlateValid(value) {
  const clean = String(value || '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
  return /^[A-Z]{3}\d{4}$/.test(clean) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(clean)
}

function formatWpp(val) {
  const n = String(val || '').replace(/\D/g, '')
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}

function buildWhatsappMessage(cliente, modelo, total, link) {
  const nome = (cliente || 'cliente').split(' ')[0]
  return `Olá ${nome}! 👋 O orçamento do seu *${modelo}* está pronto.\n\nTotal: *${formatCurrency(total)}*\n\n📋 Veja e aprove online:\n${link}`
}

function readStored(userId) {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeStored(userId, data) {
  if (!userId) return
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(data))
  } catch {}
}

function clearStored(userId) {
  if (!userId) return
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`)
  } catch {}
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

export default function OnboardingWizard() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  // 'intro' | 'phase1' | 'phase2' | 'phase3' | 'celebration' | 'coachmark' | 'done'
  const [view, setView] = useState('intro')
  const [osStep, setOsStep] = useState('plate')
  const [createdOs, setCreatedOs] = useState(null)
  const [approvalLink, setApprovalLink] = useState('')
  const [hidden, setHidden] = useState(false)
  const [legacyChecked, setLegacyChecked] = useState(false)

  const [form, setForm] = useState({
    placa: '',
    nome: '',
    whatsapp: '',
    modelo: '',
  })
  const [officeForm, setOfficeForm] = useState({ logo: '', endereco: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoBusy, setLogoBusy] = useState(false)

  const { canInstall, isIOS, promptInstall } = usePWAInstall()
  const [showInstallSheet, setShowInstallSheet] = useState(false)
  const [installSkipped, setInstallSkipped] = useState(false)

  const logoInputRef = useRef(null)
  const resumedRef = useRef(null)
  const legacyCheckedRef = useRef(null)

  const shouldShow = Boolean(user)
    && !user.isAdmin
    && !user.isTecnico
    && !user.onboardingDismissed
    && !hidden

  const phaseIndex = useMemo(() => {
    if (view === 'phase1' || view === 'intro' || view === 'fab-coachmark') return 0
    if (view === 'phase2') return 1
    return 2
  }, [view])

  const firstName = useMemo(() => {
    const raw = user?.responsavel || user?.oficina || ''
    const first = String(raw).trim().split(/\s+/)[0]
    return titleCaseName(first) || 'Parceiro'
  }, [user?.responsavel, user?.oficina])

  const setVisualVh = useCallback(() => {
    if (typeof window === 'undefined') return
    const h = window.visualViewport?.height || window.innerHeight
    document.documentElement.style.setProperty('--boxcerto-visual-vh', `${h}px`)
  }, [])

  useEffect(() => {
    if (!shouldShow) return
    setVisualVh()
    window.addEventListener('resize', setVisualVh)
    window.visualViewport?.addEventListener('resize', setVisualVh)
    return () => {
      window.removeEventListener('resize', setVisualVh)
      window.visualViewport?.removeEventListener('resize', setVisualVh)
    }
  }, [shouldShow, setVisualVh])

  // Travar scroll do body enquanto o wizard estiver visível (exceto views que precisam interagir com a página)
  useEffect(() => {
    if (!shouldShow) return
    if (view === 'coachmark' || view === 'done' || view === 'fab-coachmark') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [shouldShow, view])

  // Navegar para a Oficina quando entrar na view do coachmark do FAB
  useEffect(() => {
    if (!shouldShow || view !== 'fab-coachmark') return
    if (window.location.pathname !== '/app/oficina') {
      navigate('/app/oficina', { replace: true })
    }
  }, [navigate, shouldShow, view])

  // Interceptar o clique no FAB quando estiver no coachmark dele
  useEffect(() => {
    if (!shouldShow || view !== 'fab-coachmark') return

    const onClickCapture = (event) => {
      const fab = event.target?.closest?.('[data-tour="fab-nova-os"]')
      if (!fab) return
      event.preventDefault()
      event.stopPropagation()
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation()
      }
      setView('phase1')
    }

    document.addEventListener('click', onClickCapture, true)
    return () => document.removeEventListener('click', onClickCapture, true)
  }, [shouldShow, view])

  // Resume do localStorage / flags do usuário
  useEffect(() => {
    if (!user?.id || resumedRef.current === user.id) return
    resumedRef.current = user.id

    const stored = readStored(user.id)

    // Dismissed = tour concluído permanentemente, esconde
    if (user.onboardingDismissed) {
      setView('done')
      setHidden(true)
      return
    }

    // Completou as 3 fases mas ainda não dispensou → mostra celebração
    // (cobre o caso de o usuário recarregar a página depois do save da fase 3)
    if (user.onboardingOficinaD) {
      setView('celebration')
      if (stored?.createdOs) setCreatedOs(stored.createdOs)
      if (stored?.approvalLink) setApprovalLink(stored.approvalLink)
      return
    }

    if (user.onboardingOrcamentoDone) {
      setView('phase3')
      if (stored?.officeForm) setOfficeForm(prev => ({ ...prev, ...stored.officeForm }))
      if (stored?.createdOs) setCreatedOs(stored.createdOs)
      return
    }
    if (user.onboardingOsDone) {
      setView('phase2')
      if (stored?.createdOs) setCreatedOs(stored.createdOs)
      if (stored?.approvalLink) setApprovalLink(stored.approvalLink)
      return
    }

    if (stored?.view && ['intro', 'fab-coachmark', 'phase1', 'phase2', 'phase3', 'celebration'].includes(stored.view)) {
      setView(stored.view)
      if (stored.osStep) setOsStep(stored.osStep)
      if (stored.form) setForm(prev => ({ ...prev, ...stored.form }))
      if (stored.officeForm) setOfficeForm(prev => ({ ...prev, ...stored.officeForm }))
      if (stored.createdOs) setCreatedOs(stored.createdOs)
      if (stored.approvalLink) setApprovalLink(stored.approvalLink)
    }
  }, [user])

  // Persiste estado do wizard
  useEffect(() => {
    if (!user?.id || !shouldShow) return
    writeStored(user.id, { view, osStep, form, officeForm, createdOs, approvalLink })
  }, [user?.id, shouldShow, view, osStep, form, officeForm, createdOs, approvalLink])

  // Detecção de oficina legada: se já tem OS, marca tudo como concluído
  useEffect(() => {
    if (!shouldShow || !user?.id || !user?.oficina) return
    if (legacyCheckedRef.current === user.id) return
    if (user.onboardingOsDone || user.onboardingOrcamentoDone || user.onboardingOficinaD) {
      legacyCheckedRef.current = user.id
      return
    }
    legacyCheckedRef.current = user.id

    let cancelled = false
    osStorage.getAll(user.oficina)
      .then(async orders => {
        if (cancelled || !orders?.length) return
        clearStored(user.id)
        setHidden(true)
        await supabase.from('profiles').update({
          onboarding_os_done: true,
          onboarding_orcamento_done: true,
          onboarding_oficina_done: true,
          onboarding_dismissed: true,
        }).eq('id', user.id)
        await refreshUser?.()
      })
      .catch(() => {})
      .finally(() => { setLegacyChecked(true) })

    return () => { cancelled = true }
  }, [shouldShow, user, refreshUser])

  // Pré-carrega dados existentes da oficina (se houver)
  useEffect(() => {
    if (!shouldShow || !user?.oficina) return
    let cancelled = false
    officeDataStorage.get(user.oficina).then(data => {
      if (cancelled || !data) return
      setOfficeForm(prev => ({
        logo: data.logo || prev.logo,
        endereco: data.endereco || prev.endereco,
      }))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [shouldShow, user?.oficina])

  const patchProfile = useCallback(async (values, refresh = false) => {
    if (!user?.id) return
    try {
      await supabase.from('profiles').update(values).eq('id', user.id)
      if (refresh) await refreshUser?.()
    } catch {}
  }, [refreshUser, user?.id])

  const skipAll = useCallback(async () => {
    setHidden(true)
    clearStored(user?.id)
    await patchProfile({ onboarding_dismissed: true }, true)
  }, [patchProfile, user?.id])

  const closeForLater = useCallback(() => {
    setHidden(true)
    setTimeout(() => setHidden(false), 60_000)
  }, [])

  const handleInstall = useCallback(async () => {
    const result = await promptInstall()
    if (result === 'ios') setShowInstallSheet(true)
  }, [promptInstall])

  const goOsBack = useCallback(() => {
    setError('')
    const idx = OS_STEPS.findIndex(s => s.key === osStep)
    if (idx > 0) setOsStep(OS_STEPS[idx - 1].key)
  }, [osStep])

  const goOsNext = useCallback(() => {
    setError('')
    if (osStep === 'plate') {
      if (!isPlateValid(form.placa)) return setError('Use uma placa no formato ABC-1234 ou ABC-1A23.')
      setOsStep('name')
      return
    }
    if (osStep === 'name') {
      if (form.nome.trim().length < 4) return setError('Digite o nome do cliente.')
      setOsStep('whatsapp')
      return
    }
    if (osStep === 'whatsapp') {
      if (form.whatsapp.replace(/\D/g, '').length < 10) return setError('Digite o WhatsApp do cliente.')
      setOsStep('model')
      return
    }
    if (osStep === 'model') {
      if (form.modelo.trim().length < 2) return setError('Digite o modelo do veículo.')
      setOsStep('confirm')
    }
  }, [form, osStep])

  const createFirstOS = useCallback(async () => {
    if (!user?.oficina) return
    setError('')
    setLoading(true)
    try {
      const client = await clientStorage.create({
        officeName: user.oficina,
        nome: form.nome.trim(),
        whatsapp: form.whatsapp,
      })
      const vehicle = await vehicleStorage.create({
        officeName: user.oficina,
        clientId: client.id,
        placa: form.placa,
        modelo: form.modelo.trim(),
      })
      const os = await osStorage.create({
        officeName: user.oficina,
        vehicleId: vehicle.id,
      })
      const item = await itemStorage.add({ osId: os.id, ...EXAMPLE_ITEM })
      const hydrated = {
        id: os.id,
        clientNome: client.nome,
        clientWhatsapp: client.whatsapp,
        placa: vehicle.placa,
        modelo: vehicle.modelo,
        total: item.venda,
      }
      setCreatedOs(hydrated)
      window.dispatchEvent(new CustomEvent('boxcerto:os-criada', {
        detail: { osId: os.id, onboarding: true },
      }))
      await patchProfile({ onboarding_os_done: true })
      setView('phase2')
    } catch (e) {
      setError(e?.message || 'Erro ao criar OS.')
    } finally {
      setLoading(false)
    }
  }, [form, patchProfile, user?.oficina])

  const sendWhatsApp = useCallback(async () => {
    if (!createdOs) return
    setError('')
    setLoading(true)
    try {
      const token = await osStorage.generateApprovalToken(createdOs.id)
      const link = `${window.location.origin}/o/${token}`
      setApprovalLink(link)
      const phone = createdOs.clientWhatsapp.replace(/\D/g, '')
      const msg = buildWhatsappMessage(createdOs.clientNome, createdOs.modelo, createdOs.total, link)
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
      window.dispatchEvent(new CustomEvent('boxcerto:orcamento-enviado'))
      await patchProfile({ onboarding_orcamento_done: true })
      setView('phase3')
    } catch (e) {
      setError(e?.message || 'Erro ao gerar link de aprovação.')
    } finally {
      setLoading(false)
    }
  }, [createdOs, patchProfile])

  const handleLogoFile = useCallback((file) => {
    if (!file || !user?.oficina) return
    if (file.size > 1024 * 1024) {
      setError('Logo precisa ter no máximo 1MB.')
      return
    }
    setError('')
    setLogoBusy(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const logo = ev.target?.result || ''
        setOfficeForm(prev => ({ ...prev, logo }))
        const current = await officeDataStorage.get(user.oficina)
        await officeDataStorage.save(user.oficina, { ...current, logo })
      } catch {
        setError('Não consegui salvar o logo. Tente outra imagem.')
      } finally {
        setLogoBusy(false)
      }
    }
    reader.onerror = () => {
      setLogoBusy(false)
      setError('Não consegui ler essa imagem.')
    }
    reader.readAsDataURL(file)
  }, [user?.oficina])

  const saveOffice = useCallback(async () => {
    if (!user?.oficina) return
    setError('')
    if (officeForm.endereco.trim().length < 5) {
      setError('Preencha o endereço completo da oficina.')
      return
    }
    setLoading(true)
    try {
      const current = await officeDataStorage.get(user.oficina)
      await officeDataStorage.save(user.oficina, {
        ...current,
        logo: officeForm.logo || current.logo || '',
        endereco: officeForm.endereco.trim(),
      })
      window.dispatchEvent(new CustomEvent('boxcerto:oficina-configurada'))
      // Mostra celebração IMEDIATAMENTE. Persistência do flag e refresh do
      // user vão em background — qualquer mudança em user.onboardingOficinaD
      // que dispare re-render do wizard cai no resume effect, que agora
      // entende OficinaD+não-dispensado como "mostrar celebração".
      setView('celebration')
      patchProfile({ onboarding_oficina_done: true }, false)
    } catch (e) {
      setError(e?.message || 'Erro ao salvar dados da oficina.')
    } finally {
      setLoading(false)
    }
  }, [officeForm, patchProfile, user?.oficina])

  const finishAndShowCoachmark = useCallback(() => {
    if (createdOs?.id) {
      navigate('/app/oficina', { replace: true })
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('boxcerto:onboarding-abrir-os', {
          detail: { osId: createdOs.id },
        }))
      }, 80)
      setView('coachmark')
    } else {
      navigate('/app/oficina', { replace: true })
      setView('done')
      setHidden(true)
      clearStored(user?.id)
      patchProfile({ onboarding_dismissed: true }, true)
    }
  }, [createdOs, navigate, patchProfile, user?.id])

  const finishToDashboard = useCallback(() => {
    setView('done')
    setHidden(true)
    clearStored(user?.id)
    navigate('/app/oficina', { replace: true })
    patchProfile({ onboarding_dismissed: true }, true)
  }, [navigate, patchProfile, user?.id])

  if (!shouldShow) return null
  if (view === 'done') return null

  if (view === 'coachmark') {
    return (
      <FinalCoachmark
        onDismiss={() => {
          setView('done')
          setHidden(true)
          clearStored(user?.id)
          patchProfile({ onboarding_dismissed: true }, true)
        }}
      />
    )
  }

  if (view === 'celebration') {
    return (
      <FullscreenShell>
        <CelebrationConfetti />
        <div className="flex w-full flex-1 flex-col overflow-y-auto bg-white">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-700 px-6 pt-10 pb-9 text-center text-white">
            <SparkleField />

            <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30 backdrop-blur-sm">
              <Trophy className="h-9 w-9 text-white" />
            </div>

            <div className="relative mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/30 backdrop-blur-sm">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-white">Tour concluído</span>
            </div>

            <h2 className="relative text-[24px] font-extrabold leading-[1.2]">
              Parabéns, {firstName}!<br />
              Você concluiu os passos iniciais.
            </h2>
            <p className="relative mt-3 text-[13px] leading-relaxed text-indigo-100">
              Sua oficina agora está em outro nível<br />
              de organização. Tudo pronto para começar<br />
              a usar o BoxCerto de verdade.
            </p>
          </div>

          <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
            <div className="space-y-2">
              {[
                { Icon: Sliders, bg: 'bg-indigo-50', color: 'text-indigo-500', text: 'Sistema configurado e pronto para uso' },
                { Icon: ClipboardCheck, bg: 'bg-violet-50', color: 'text-violet-500', text: 'Orçamentos, aprovações e andamento sob controle' },
                { Icon: BarChart3, bg: 'bg-fuchsia-50', color: 'text-fuchsia-500', text: 'Mais organização desde o primeiro dia' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-100">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                    <item.Icon className={`h-5 w-5 ${item.color}`} />
                  </span>
                  <span className="text-sm font-medium leading-snug text-slate-700">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4">
              {canInstall && !installSkipped && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
                      <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-900">
                        {isIOS ? 'Adicione à tela inicial' : 'Instale o app'}
                      </p>
                      <p className="text-xs text-indigo-600">
                        {isIOS ? 'Abra com 1 toque pelo iPhone' : 'Acesso rápido — funciona offline'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleInstall}
                      className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
                    >
                      {isIOS ? 'Como adicionar?' : 'Instalar agora'}
                    </button>
                    <button
                      onClick={() => setInstallSkipped(true)}
                      className="rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-600"
                    >
                      Depois
                    </button>
                  </div>
                </div>
              )}
              <div>
                <button
                  onClick={finishAndShowCoachmark}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-[15px] font-extrabold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
                >
                  Ir para meu painel <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={finishToDashboard}
                  className="mt-2 w-full py-3 text-center text-sm font-medium text-slate-400 hover:text-slate-600"
                >
                  Criar outro orçamento
                </button>
              </div>
            </div>
          </div>
        </div>
        {showInstallSheet && <PWAInstallSheet onClose={() => setShowInstallSheet(false)} />}
      </FullscreenShell>
    )
  }

  if (view === 'intro') {
    return (
      <FullscreenShell>
        <div className="flex w-full flex-1 flex-col overflow-y-auto bg-white">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-700 px-6 pt-10 pb-10 text-center text-white">
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute top-1/2 right-1/4 h-16 w-16 rounded-full bg-white/5" />

            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Rocket className="h-7 w-7 text-white" />
            </div>
            <h2 className="relative text-[26px] font-extrabold leading-[1.15]">
              Pronto, {firstName}.
              <br />
              Sua oficina já está no controle.
            </h2>
            <p className="relative mt-3 text-sm leading-relaxed text-indigo-100">
              Crie seu primeiro orçamento e envie para o<br />cliente aprovar pelo WhatsApp em<br />menos de 2 minutos.
            </p>
          </div>

          <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
            <div className="space-y-2">
              {[
                { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', text: 'Orçamento pronto em poucos minutos' },
                { icon: Smartphone, color: 'text-indigo-500', bg: 'bg-indigo-50', text: 'Cliente aprova pelo link no WhatsApp' },
                { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', text: 'Tudo organizado: pendente, aprovado e em andamento' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-100">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </span>
                  <span className="text-sm font-medium leading-snug text-slate-700">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6">
              <button
                onClick={() => setView('fab-coachmark')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-[15px] font-extrabold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
              >
                Criar primeiro orçamento agora <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={skipAll}
                className="mt-2 w-full py-3 text-center text-sm font-medium text-slate-400 hover:text-slate-600"
              >
                Ver o painel antes
              </button>
            </div>
          </div>
        </div>
      </FullscreenShell>
    )
  }

  if (view === 'fab-coachmark') {
    return (
      <FabCoachmark
        firstName={firstName}
        onSkip={skipAll}
        onManualProceed={() => setView('phase1')}
      />
    )
  }

  if (view === 'phase1') {
    const idx = OS_STEPS.findIndex(s => s.key === osStep)
    const onEnter = e => { if (e.key === 'Enter') { e.preventDefault(); goOsNext() } }
    return (
      <FullscreenShell>
        <Header phaseIndex={phaseIndex} onSkip={skipAll} onClose={closeForLater} />
        <div className="flex w-full max-w-md flex-col px-5 pb-4 pt-3">
          <div className="grid grid-cols-5 gap-1.5">
            {OS_STEPS.map((s, i) => (
              <span key={s.key} className={`h-1.5 rounded-full ${i <= idx ? 'bg-indigo-600' : 'bg-slate-100'}`} />
            ))}
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
            Passo {idx + 1} de {OS_STEPS.length}
          </p>
        </div>

        <div className="flex w-full max-w-md flex-1 flex-col overflow-y-auto px-5 pb-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {osStep === 'plate' && (
            <div className="space-y-3">
              <h3 className="text-2xl font-extrabold leading-tight text-slate-950">Digite a placa</h3>
              <p className="text-sm leading-relaxed text-slate-500">Pode ser real ou de teste. Não vamos buscar cadastro antigo aqui.</p>
              <input
                type="text"
                value={form.placa}
                onChange={e => { setError(''); setForm(p => ({ ...p, placa: formatPlate(e.target.value) })) }}
                onKeyDown={onEnter}
                placeholder="ABC-1D23"
                maxLength={8}
                autoFocus
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-5 text-center text-3xl font-black uppercase tracking-widest text-slate-950 plate-mercosul focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          {osStep === 'name' && (
            <div className="space-y-3">
              <h3 className="text-2xl font-extrabold leading-tight text-slate-950">Nome do cliente</h3>
              <p className="text-sm leading-relaxed text-slate-500">Só o nome é obrigatório.</p>
              <input
                type="text"
                value={form.nome}
                onChange={e => { setError(''); setForm(p => ({ ...p, nome: e.target.value })) }}
                onKeyDown={onEnter}
                placeholder="João da Silva"
                autoFocus
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg font-semibold text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          {osStep === 'whatsapp' && (
            <div className="space-y-3">
              <h3 className="text-2xl font-extrabold leading-tight text-slate-950">WhatsApp do cliente</h3>
              <p className="text-sm leading-relaxed text-slate-500">Esse número receberá o link de aprovação do orçamento.</p>
              <input
                type="tel"
                inputMode="tel"
                value={form.whatsapp}
                onChange={e => { setError(''); setForm(p => ({ ...p, whatsapp: formatWpp(e.target.value) })) }}
                onKeyDown={onEnter}
                placeholder="(51) 99999-9999"
                maxLength={15}
                autoFocus
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg font-semibold text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          {osStep === 'model' && (
            <div className="space-y-3">
              <h3 className="text-2xl font-extrabold leading-tight text-slate-950">Modelo do veículo</h3>
              <p className="text-sm leading-relaxed text-slate-500">Digite manualmente. Exemplo: Honda CG 160 2022.</p>
              <input
                type="text"
                value={form.modelo}
                onChange={e => { setError(''); setForm(p => ({ ...p, modelo: e.target.value })) }}
                onKeyDown={onEnter}
                placeholder="Honda CG 160 2022"
                autoFocus
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg font-semibold text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          {osStep === 'confirm' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold leading-tight text-slate-950">Tudo pronto para criar</h3>
              <p className="text-sm leading-relaxed text-slate-500">Vou criar a OS e adicionar automaticamente o serviço exemplo de R$ 470,00.</p>

              <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                <Row label="Placa" value={form.placa} />
                <Row label="Cliente" value={form.nome} />
                <Row label="WhatsApp" value={form.whatsapp} />
                <Row label="Veículo" value={form.modelo} />
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">SERVIÇO EXEMPLO PRIMEIRA OS</p>
                  <p className="mt-0.5 text-sm text-emerald-700">Valor: R$ 470,00</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer
          showBack={idx > 0}
          onBack={goOsBack}
          onNext={osStep === 'confirm' ? createFirstOS : goOsNext}
          nextLabel={osStep === 'confirm' ? 'Criar primeira OS' : 'Continuar'}
          loading={loading}
          icon={osStep === 'confirm' ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        />
      </FullscreenShell>
    )
  }

  if (view === 'phase2') {
    return (
      <FullscreenShell>
        <Header phaseIndex={phaseIndex} onSkip={skipAll} onClose={closeForLater} />

        <div className="flex w-full max-w-md flex-1 flex-col overflow-y-auto px-5 pb-5 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">Fase 2 de 3</p>
          <h3 className="mt-2 text-2xl font-extrabold leading-tight text-slate-950">Envie pelo WhatsApp</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Vou abrir o WhatsApp Web com a mensagem pronta. O cliente recebe um link único e aprova com 1 toque.
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Pré-visualização</span>
            </div>
            <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[13px] leading-relaxed text-slate-700 shadow-sm">
              <p>Olá {createdOs?.clientNome?.split(' ')[0] || 'cliente'}! 👋 O orçamento do seu <strong>{createdOs?.modelo}</strong> está pronto.</p>
              <p>Total: <strong>{formatCurrency(createdOs?.total || 470)}</strong></p>
              <p>📋 Veja e aprove online: <span className="text-indigo-600 underline">link de aprovação</span></p>
            </div>
            <p className="mt-3 text-[11px] text-emerald-700">
              Enviado para {createdOs?.clientWhatsapp || 'cliente'}
            </p>
          </div>
        </div>

        <div className="w-full max-w-md shrink-0 border-t border-slate-100 bg-white px-5 pb-5 pt-3">
          <button
            onClick={sendWhatsApp}
            disabled={loading || !createdOs}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-100 transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Gerando link...' : 'Enviar pelo WhatsApp'}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Vou abrir o WhatsApp em uma nova aba.
          </p>
        </div>
      </FullscreenShell>
    )
  }

  if (view === 'phase3') {
    return (
      <FullscreenShell>
        <Header phaseIndex={phaseIndex} onSkip={skipAll} onClose={closeForLater} />

        <div className="flex w-full max-w-md flex-1 flex-col overflow-y-auto px-5 pb-5 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">Fase 3 de 3</p>
          <h3 className="mt-2 text-2xl font-extrabold leading-tight text-slate-950">Dados da oficina</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Esses dados aparecem nos PDFs e mensagens enviadas ao cliente.
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-700">Logotipo (opcional)</p>
            <div className="mt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={() => !logoBusy && logoInputRef.current?.click()}
                className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                  logoBusy ? 'border-slate-100 opacity-60' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                {officeForm.logo
                  ? <img src={officeForm.logo} alt="Logo" className="h-full w-full object-contain" />
                  : <Camera className="h-7 w-7 text-slate-300" />}
              </button>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => !logoBusy && logoInputRef.current?.click()}
                  className="text-sm font-semibold text-indigo-600 hover:underline disabled:opacity-50"
                  disabled={logoBusy}
                >
                  {logoBusy ? 'Salvando...' : officeForm.logo ? 'Trocar logo' : 'Adicionar logo'}
                </button>
                <p className="mt-1 text-[11px] text-slate-400">PNG ou JPG, até 1MB.</p>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleLogoFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-700">Endereço completo</label>
            <p className="mt-1 text-[11px] text-slate-400">Aparece no rodapé dos PDFs e dá mais confiança ao cliente.</p>
            <div className="relative mt-2">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={officeForm.endereco}
                onChange={e => { setError(''); setOfficeForm(p => ({ ...p, endereco: e.target.value })) }}
                placeholder="Rua das Flores, 123 — Porto Alegre, RS"
                className="w-full rounded-xl border border-slate-200 px-10 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-50"
              />
            </div>
          </div>
        </div>

        <div className="w-full max-w-md shrink-0 border-t border-slate-100 bg-white px-5 pb-5 pt-3">
          <button
            onClick={saveOffice}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {loading ? 'Salvando...' : 'Salvar e concluir'}
          </button>
        </div>
      </FullscreenShell>
    )
  }

  return null
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <strong className="truncate text-slate-950">{value}</strong>
    </div>
  )
}

function Header({ phaseIndex, onSkip, onClose }) {
  return (
    <div className="w-full max-w-md shrink-0 px-5 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {PHASES.map((phase, i) => (
            <div key={phase.id} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${i <= phaseIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wide ${i <= phaseIndex ? 'text-indigo-600' : 'text-slate-300'}`}>
                {phase.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onSkip}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            Pular tour
          </button>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Footer({ showBack, onBack, onNext, nextLabel, loading, icon }) {
  return (
    <div className="w-full max-w-md shrink-0 border-t border-slate-100 bg-white px-5 pb-5 pt-3">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-1 rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
          {loading ? 'Carregando...' : nextLabel}
        </button>
      </div>
    </div>
  )
}

function FullscreenShell({ children }) {
  const mobile = isMobileViewport()
  return (
    <div
      className={mobile
        ? 'fixed inset-0 z-[400] flex flex-col items-center bg-white'
        : 'fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4'}
      style={mobile ? { height: 'var(--boxcerto-visual-vh, 100dvh)' } : undefined}
    >
      <WizardStyles />
      {mobile ? (
        <div className="flex h-full w-full max-w-md flex-col bg-white">
          {children}
        </div>
      ) : (
        <div
          className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
        >
          {children}
        </div>
      )}
    </div>
  )
}

function FabCoachmark({ firstName, onSkip, onManualProceed }) {
  // O FAB real está em `fixed bottom-24 right-4 w-14 h-14` ([data-tour="fab-nova-os"]
  // dentro de Dashboard, em Oficina.jsx). Em vez de tentar localizar via DOM
  // (frágil entre route lazy-load + iOS Safari URL bar), renderizamos um
  // FAB fantasma na mesma posição, por cima, com anel pulsante. O clique
  // no fantasma avança o wizard direto para fase 1.
  return (
    <>
      <WizardStyles />

      {/* Anel pulsante na mesma posição do FAB real */}
      <div
        className="pointer-events-none fixed z-[391] rounded-full"
        style={{
          bottom: '86px',
          right: '6px',
          width: '76px',
          height: '76px',
          boxShadow: '0 0 0 3px #4f46e5, 0 0 0 8px rgba(79,70,229,.32)',
          animation: 'wizardPulseIndigo 1.4s ease-in-out infinite',
        }}
      />

      {/* FAB fantasma — visualmente idêntico, fica acima do real e captura o toque */}
      <button
        type="button"
        onClick={onManualProceed}
        aria-label="Abrir primeira OS"
        className="fixed bottom-24 right-4 z-[392] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-200 transition-transform active:scale-95"
      >
        <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
      </button>

      {/* Card explicativo no topo */}
      <div className="fixed left-3 right-3 top-3 z-[395] mx-auto max-w-sm">
        <div className="relative rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-900/5">
          <button
            type="button"
            onClick={onSkip}
            className="absolute right-2.5 top-2.5 rounded-full px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            Pular
          </button>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Plus className="h-4 w-4 text-white" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">Passo 1</span>
          </div>
          <h4 className="mt-2 pr-8 text-[15px] font-extrabold leading-snug text-slate-950">
            Toque no <span className="text-indigo-600">+</span> para abrir sua primeira OS
          </h4>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {firstName}, é esse botão que você vai usar todos os dias para criar uma nova OS.
          </p>
        </div>
      </div>
    </>
  )
}

function FinalCoachmark({ onDismiss }) {
  const [rect, setRect] = useState(null)
  const dismissedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let intervalId = null
    let dismissTimer = null

    const sync = () => {
      if (cancelled || dismissedRef.current) return
      const el = document.querySelector('[data-tour="btn-enviar-cliente"]')
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) {
        setRect(null)
        return
      }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      if (!dismissTimer) {
        dismissTimer = window.setTimeout(() => {
          dismissedRef.current = true
          onDismiss()
        }, 5200)
      }
    }

    // Tenta encontrar o alvo por até 6s — a OS pode demorar a abrir
    const startedAt = Date.now()
    const findTarget = () => {
      if (cancelled || dismissedRef.current) return
      sync()
      if (rect) return
      if (Date.now() - startedAt > 6000) {
        dismissedRef.current = true
        onDismiss()
        return
      }
      window.setTimeout(findTarget, 200)
    }
    findTarget()

    intervalId = window.setInterval(sync, 240)
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    window.visualViewport?.addEventListener('resize', sync)

    return () => {
      cancelled = true
      if (intervalId) window.clearInterval(intervalId)
      if (dismissTimer) window.clearTimeout(dismissTimer)
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
      window.visualViewport?.removeEventListener('resize', sync)
    }
  }, [onDismiss, rect])

  if (!rect) return null

  const pad = 6
  const ringTop = Math.max(0, rect.top - pad)
  const ringLeft = Math.max(0, rect.left - pad)
  const ringWidth = rect.width + pad * 2
  const ringHeight = rect.height + pad * 2

  const viewportTop = window.visualViewport?.offsetTop || 0
  const viewportHeight = window.visualViewport?.height || window.innerHeight
  const viewportBottom = viewportTop + viewportHeight
  const cardWidth = Math.min(320, window.innerWidth - 24)
  const estimatedCardHeight = 130
  const roomBelow = viewportBottom - (ringTop + ringHeight) - 12
  const placeBelow = roomBelow >= estimatedCardHeight
  const cardTop = placeBelow
    ? ringTop + ringHeight + 12
    : Math.max(viewportTop + 12, ringTop - estimatedCardHeight - 12)
  const cardLeft = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, ringLeft + ringWidth / 2 - cardWidth / 2))

  return (
    <>
      <WizardStyles />
      <div
        className="pointer-events-none fixed z-[391] rounded-2xl"
        style={{
          top: ringTop,
          left: ringLeft,
          width: ringWidth,
          height: ringHeight,
          boxShadow: '0 0 0 3px #10b981, 0 0 0 8px rgba(16,185,129,.24)',
          animation: 'wizardPulse 1.4s ease-in-out infinite',
        }}
      />
      <div
        className="fixed z-[395]"
        style={{ top: cardTop, left: cardLeft, width: cardWidth }}
      >
        <div className="rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-900/5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Dica final</p>
          <h4 className="mt-1 text-sm font-extrabold text-slate-950">É aqui que você envia o orçamento</h4>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Sempre que abrir uma OS, esse botão fica disponível. Esse aviso some sozinho.
          </p>
        </div>
      </div>
    </>
  )
}

function SparkleField() {
  const sparkles = Array.from({ length: 22 }, (_, i) => ({
    left: (i * 41 + 11) % 100,
    top: (i * 23 + 7) % 90,
    size: 4 + (i % 4),
    delay: (i % 7) * 0.18,
    duration: 1.8 + (i % 5) * 0.25,
    rotate: (i * 47) % 360,
  }))
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-10 -right-12 h-44 w-44 rounded-full bg-white/10" />
      <div className="absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-white/8" />
      <div className="absolute top-1/3 right-1/4 h-20 w-20 rounded-full bg-white/5" />
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="absolute block"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 0 6px rgba(255,255,255,0.6)',
            transform: `rotate(${s.rotate}deg)`,
            animation: `wizardSparkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}

function CelebrationConfetti() {
  const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444']
  return (
    <div className="pointer-events-none fixed inset-0 z-[401] overflow-hidden">
      {Array.from({ length: 34 }, (_, i) => (
        <span
          key={i}
          className="absolute block"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `-${12 + (i % 9) * 8}px`,
            width: `${6 + (i % 4)}px`,
            height: `${8 + (i % 5)}px`,
            borderRadius: i % 3 === 0 ? '999px' : '2px',
            background: colors[i % colors.length],
            animation: `wizardConfetti ${1.9 + (i % 6) * 0.16}s ${(i % 8) * 0.08}s ease-in forwards`,
            transform: `rotate(${i * 23}deg)`,
          }}
        />
      ))}
    </div>
  )
}

function WizardStyles() {
  return (
    <style>{`
      @keyframes wizardPulse {
        0%, 100% { box-shadow: 0 0 0 3px #10b981, 0 0 0 8px rgba(16,185,129,.24); }
        50% { box-shadow: 0 0 0 3px #10b981, 0 0 0 16px rgba(16,185,129,0); }
      }
      @keyframes wizardPulseIndigo {
        0%, 100% { box-shadow: 0 0 0 3px #4f46e5, 0 0 0 8px rgba(79,70,229,.32); }
        50% { box-shadow: 0 0 0 3px #4f46e5, 0 0 0 18px rgba(79,70,229,0); }
      }
      @keyframes wizardConfetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(600deg); opacity: 0; }
      }
      @keyframes wizardSparkle {
        0%, 100% { opacity: 0.2; transform: scale(0.7); }
        50% { opacity: 1; transform: scale(1.15); }
      }
    `}</style>
  )
}
