import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatWpp(val) {
  const n = val.replace(/\D/g, '')
  if (n.length <= 2)  return n
  if (n.length <= 7)  return `(${n.slice(0,2)}) ${n.slice(2)}`
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}`
}

function getStoredUtms() {
  try {
    const raw = localStorage.getItem('boxcerto_utm')
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    localStorage.removeItem('boxcerto_utm')
    return parsed
  } catch { return {} }
}

// ── Opções ────────────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'mecanica',   emoji: '🔧', label: 'Mecânica Geral',       desc: 'Motor, freios, suspensão, revisões' },
  { value: 'moto',       emoji: '🏍️',  label: 'Moto oficina',         desc: 'Motos de qualquer cilindrada' },
  { value: 'pesados',    emoji: '🚛', label: 'Pesados',               desc: 'Caminhões, ônibus, vans' },
  { value: 'funilaria',  emoji: '🎨', label: 'Funilaria & Pintura',   desc: 'Lataria, amassados, pintura geral' },
  { value: 'eletrica',   emoji: '⚡', label: 'Elétrica Automotiva',   desc: 'Injeção eletrônica, ar-condicionado' },
  { value: 'estetica',   emoji: '✨', label: 'Estética Automotiva',   desc: 'Polimento, vitrificação, higienização' },
  { value: 'geral',      emoji: '🚗', label: 'Vários serviços',       desc: 'Mais de um tipo na mesma oficina' },
]

const CARGOS = [
  { value: 'dono',        emoji: '👑', label: 'Sou o dono ou sócio',       desc: 'O negócio é meu — quero controlar tudo',  muted: false },
  { value: 'gerente',     emoji: '📋', label: 'Sou funcionário / gerente',  desc: 'Cuido da operação no dia a dia',           muted: false },
  { value: 'pesquisando', emoji: '🔍', label: 'Estou só pesquisando',       desc: 'Ainda não tenho certeza se é pra mim',    muted: true  },
]

// ── Card de opção ─────────────────────────────────────────────────────────────
function OptionCard({ emoji, label, desc, selected, onClick, muted = false, extra = null }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 active:scale-[0.97] ${
        selected
          ? 'border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100'
          : muted
            ? 'border-gray-100 bg-gray-50/60 hover:border-gray-200'
            : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-2xl shrink-0 ${muted && !selected ? 'opacity-60' : ''}`}>{emoji}</span>
        <div className="min-w-0 flex-1">
          <p className={`font-bold text-sm leading-tight ${
            selected ? 'text-indigo-700' : muted ? 'text-gray-400' : 'text-slate-800'
          }`}>
            {label}
          </p>
          <p className={`text-xs mt-0.5 leading-snug ${muted && !selected ? 'text-gray-300' : 'text-slate-400'}`}>
            {desc}
          </p>
          {extra && !selected && (
            <p className="text-[10px] text-emerald-600 font-medium mt-1">{extra}</p>
          )}
        </div>
        <div className={`ml-auto w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200'
        }`}>
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Barra de progresso ────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
          i < current ? 'bg-indigo-500' : i === current ? 'bg-indigo-300' : 'bg-gray-100'
        }`} />
      ))}
    </div>
  )
}

// ── Loader ────────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
      <div style={{ width: 32, height: 32, border: '3px solid rgba(165,180,252,0.2)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function BemVindo() {
  const navigate   = useNavigate()
  const [params]   = useSearchParams()
  const { user, loading: authLoading, refreshUser } = useAuth()

  // Formulário
  const [oficina,  setOficina]  = useState('')
  const [tipo,     setTipo]     = useState('')
  const [cargo,    setCargo]    = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  // Controle de navegação entre passos
  // steps: lista dos passos que este usuário precisa completar, em ordem
  const [steps,    setSteps]    = useState([])   // ['oficina','tipo','cargo','whatsapp']
  const [stepIdx,  setStepIdx]  = useState(0)    // índice atual
  const [ready,    setReady]    = useState(false) // auth carregou + steps calculados
  const [saving,   setSaving]   = useState(false)
  const [done,     setDone]     = useState(false)

  const nomeDisplay = params.get('nome') || user?.responsavel?.split(' ')[0] || user?.nome?.split(' ')[0] || 'parceiro'

  // ── Calcula os passos que faltam após auth carregar ───────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { replace: true }); return }

    const needsOficina  = !user.oficina?.trim()
    const needsTipo     = !user.tipoOficina
    const needsCargo    = !user.cargo
    const needsWhatsapp = !user.whatsapp?.replace(/\D/g, '').length

    const pending = []
    if (needsOficina)  pending.push('oficina')
    if (needsTipo)     pending.push('tipo')
    if (needsCargo)    pending.push('cargo')
    if (needsWhatsapp) pending.push('whatsapp')

    // Tudo preenchido → vai direto pro app
    if (pending.length === 0) {
      navigate('/app/oficina', { replace: true })
      return
    }

    // Pré-popula com o que já existe no perfil
    if (user.oficina)  setOficina(user.oficina)
    if (user.whatsapp) setWhatsapp(user.whatsapp)

    setSteps(pending)
    setStepIdx(0)
    setReady(true)
  }, [authLoading, user?.id])

  // ── Avança para o próximo passo ───────────────────────────────────────────
  const next = useCallback(() => {
    if (stepIdx < steps.length - 1) {
      setStepIdx(i => i + 1)
    } else {
      handleFinish()
    }
  }, [stepIdx, steps])

  // ── Salva tudo e redireciona ──────────────────────────────────────────────
  const handleFinish = async () => {
    if (saving) return
    setSaving(true)

    try {
      // Recupera UTMs salvos no localStorage antes do redirect
      const utms = getStoredUtms()

      const updates = {
        ...(oficina.trim()  ? { oficina:      oficina.trim()  } : {}),
        ...(tipo            ? { tipo_oficina: tipo            } : {}),
        ...(cargo           ? { cargo                        } : {}),
        ...(whatsapp.replace(/\D/g,'').length ? { whatsapp } : {}),
        ...(utms.utm_source   ? { utm_source:   utms.utm_source   } : {}),
        ...(utms.utm_medium   ? { utm_medium:   utms.utm_medium   } : {}),
        ...(utms.utm_campaign ? { utm_campaign: utms.utm_campaign } : {}),
        ...(utms.utm_content  ? { utm_content:  utms.utm_content  } : {}),
      }

      await supabase.from('profiles').update(updates).eq('id', user.id)

      // ── Eventos ──────────────────────────────────────────────────────────
      const finalOficina  = (oficina.trim() || user.oficina || '').trim()
      const finalWhatsapp = whatsapp || user.whatsapp || ''
      const finalTipo     = tipo || user.tipoOficina || ''
      const finalCargo    = cargo || user.cargo || ''
      const isQualified   = finalOficina && finalWhatsapp.replace(/\D/g,'').length >= 10
                          && finalTipo && finalCargo !== 'pesquisando'

      try {
        if (typeof gtag === 'function') {
          if (isQualified) {
            gtag('event', 'StartTrialQualified', {
              tipo_oficina: finalTipo,
              cargo: finalCargo,
              is_owner: finalCargo === 'dono',
            })
          }
          gtag('event', 'lead_qualificado', {
            tipo_oficina: finalTipo,
            cargo: finalCargo,
            qualified: isQualified,
          })
        }
        window.dataLayer = window.dataLayer || []
        if (isQualified) {
          window.dataLayer.push({ event: 'StartTrialQualified', tipo_oficina: finalTipo, cargo: finalCargo })
        }
        window.dataLayer.push({ event: 'lead_qualificado', tipo_oficina: finalTipo, cargo: finalCargo })
      } catch {}

      await refreshUser()
    } catch (e) {
      console.error('Erro ao salvar qualificação:', e)
    }

    setDone(true)
    setTimeout(() => navigate('/app/oficina', { replace: true }), 1600)
  }

  // ── Ações por passo ───────────────────────────────────────────────────────
  const canAdvance = {
    oficina:  oficina.trim().length > 0,
    tipo:     tipo !== '',
    cargo:    cargo !== '',
    whatsapp: whatsapp.replace(/\D/g, '').length >= 10,
  }

  const handleKeyDown = (e, step) => {
    if (e.key === 'Enter' && canAdvance[step]) next()
  }

  // ── Renderização ──────────────────────────────────────────────────────────
  if (authLoading || !ready) return <Loader />

  const currentStep = steps[stepIdx]
  const isLast      = stepIdx === steps.length - 1

  // Tela de sucesso
  if (done || saving) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ animation: 'bounceIn 0.4s ease' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Tudo pronto! 🎉</h2>
          <p className="text-indigo-300 text-sm">Preparando seu BoxCerto...</p>
          <div className="mt-6 flex gap-1.5 justify-center">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full"
                style={{ animation: `bounce 0.8s ${i*0.15}s infinite` }} />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes bounceIn { 0% { transform: scale(0.5); opacity: 0 } 70% { transform: scale(1.1) } 100% { transform: scale(1); opacity: 1 } }
          @keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        `}</style>
      </div>
    )
  }

  // Rótulo do passo para a barra de progresso
  const stepLabel = { oficina: 'Passo 1', tipo: `Passo ${stepIdx+1}`, cargo: `Passo ${stepIdx+1}`, whatsapp: `Passo ${stepIdx+1}` }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4 py-10">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">BoxCerto</span>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8">

        <ProgressBar current={stepIdx} total={steps.length} />

        {/* ── PASSO: Nome da Oficina ──────────────────────── */}
        {currentStep === 'oficina' && (
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
              Passo {stepIdx + 1} de {steps.length}
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">
              Como se chama<br />sua oficina?
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Esse nome aparece nos orçamentos que você envia aos clientes.
            </p>
            <input
              autoFocus
              type="text"
              value={oficina}
              onChange={e => setOficina(e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'oficina')}
              placeholder="Ex: Oficina do João, Auto Center Silva..."
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none text-slate-900 placeholder-slate-300 text-base transition-all mb-6"
            />
            <button onClick={next} disabled={!canAdvance.oficina}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-indigo-200">
              Continuar →
            </button>
          </div>
        )}

        {/* ── PASSO: Tipo de negócio ──────────────────────── */}
        {currentStep === 'tipo' && (
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
              Passo {stepIdx + 1} de {steps.length}
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">
              Qual é o foco principal<br />da sua oficina?
            </h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Vamos configurar o BoxCerto do jeito certo pra você.
            </p>
            <div className="space-y-2 mb-6">
              {TIPOS.map(opt => (
                <OptionCard key={opt.value} {...opt}
                  selected={tipo === opt.value}
                  onClick={() => setTipo(opt.value)} />
              ))}
            </div>
            <button onClick={next} disabled={!canAdvance.tipo}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-indigo-200">
              Continuar →
            </button>
          </div>
        )}

        {/* ── PASSO: Papel na oficina ─────────────────────── */}
        {currentStep === 'cargo' && (
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
              Passo {stepIdx + 1} de {steps.length}
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">
              Qual é o seu papel<br />na oficina?
            </h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Última pergunta de qualificação, {nomeDisplay}.
            </p>
            <div className="space-y-2 mb-6">
              {CARGOS.map(opt => (
                <OptionCard key={opt.value} {...opt}
                  selected={cargo === opt.value}
                  onClick={() => setCargo(opt.value)}
                  extra={opt.value === 'pesquisando' ? '✓ Acesso liberado, sem cobrança' : null} />
              ))}
            </div>
            <button onClick={next} disabled={!canAdvance.cargo}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-indigo-200">
              {isLast ? 'Criar meu primeiro orçamento →' : 'Continuar →'}
            </button>
            {isLast && (
              <p className="text-center text-xs text-slate-300 mt-3">
                🔒 7 dias grátis · sem cartão · cancele quando quiser
              </p>
            )}
          </div>
        )}

        {/* ── PASSO: WhatsApp ─────────────────────────────── */}
        {currentStep === 'whatsapp' && (
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
              Passo {stepIdx + 1} de {steps.length}
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">
              Qual é o WhatsApp<br />da oficina?
            </h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Seus clientes aprovam orçamentos direto pelo WhatsApp.
            </p>
            <input
              autoFocus
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(formatWpp(e.target.value))}
              onKeyDown={e => handleKeyDown(e, 'whatsapp')}
              placeholder="(51) 99999-0000"
              maxLength={15}
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none text-slate-900 placeholder-slate-300 text-base transition-all mb-4"
            />
            {/* Card explicativo */}
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-6">
              <span className="text-xl shrink-0 mt-0.5">📲</span>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                O WhatsApp é o coração do BoxCerto — seu cliente aprova o orçamento com 1 clique direto pelo WhatsApp.
              </p>
            </div>
            <button onClick={next} disabled={!canAdvance.whatsapp}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-indigo-200">
              Criar meu primeiro orçamento →
            </button>
            <p className="text-center text-xs text-slate-300 mt-3">
              🔒 7 dias grátis · sem cartão · cancele quando quiser
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-indigo-300/40 text-xs text-center">
        Suas respostas nos ajudam a personalizar o sistema para sua oficina.
      </p>
    </div>
  )
}
