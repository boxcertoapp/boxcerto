import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ── Opções de qualificação ────────────────────────────────────────────────────
const TIPOS = [
  { value: 'mecanica',   emoji: '🔧', label: 'Mecânica Geral',       desc: 'Motor, freios, suspensão, revisões' },
  { value: 'funilaria',  emoji: '🎨', label: 'Funilaria & Pintura',   desc: 'Lataria, amassados, pintura geral' },
  { value: 'eletrica',   emoji: '⚡', label: 'Elétrica Automotiva',   desc: 'Injeção eletrônica, ar-condicionado' },
  { value: 'geral',      emoji: '🚗', label: 'Vários serviços',       desc: 'Mais de um tipo na mesma oficina' },
]

const CARGOS = [
  { value: 'dono',      emoji: '👑', label: 'Sou o dono ou sócio',        desc: 'O negócio é meu — quero controlar tudo' },
  { value: 'gerente',   emoji: '📋', label: 'Sou funcionário / gerente',   desc: 'Cuido da operação no dia a dia' },
]

// ── Componente de card de opção ───────────────────────────────────────────────
function OptionCard({ emoji, label, desc, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 active:scale-[0.97] ${
        selected
          ? 'border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100'
          : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0">{emoji}</span>
        <div className="min-w-0">
          <p className={`font-bold text-sm leading-tight ${selected ? 'text-indigo-700' : 'text-slate-800'}`}>
            {label}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
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
function ProgressBar({ step, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < step ? 'bg-indigo-500 flex-1' : i === step ? 'bg-indigo-300 flex-1' : 'bg-gray-200 flex-1'
          }`}
        />
      ))}
    </div>
  )
}

// ── Tela de loading ────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-indigo-300/30 border-t-indigo-400 rounded-full animate-spin"
        style={{ border: '3px solid rgba(165,180,252,0.2)', borderTopColor: '#818cf8' }} />
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function BemVindo() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, loading: authLoading, refreshUser } = useAuth()

  // step: 'loading' | 'oficina' | 'tipo' | 'cargo' | 'saving' | 'done'
  const [step, setStep]           = useState('loading')
  const [oficina, setOficina]     = useState('')
  const [tipo, setTipo]           = useState('')
  const [cargo, setCargo]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [nomeDisplay, setNomeDisplay] = useState('')

  // Determina o ponto de entrada após auth carregar
  useEffect(() => {
    if (authLoading) return

    // Sem usuário → redireciona para login
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    // Se já qualificou → vai direto pro app
    if (user.tipoOficina && user.cargo) {
      navigate('/app/oficina', { replace: true })
      return
    }

    // Define nome para exibição
    const nomeUrl = params.get('nome')
    setNomeDisplay(nomeUrl || user.responsavel?.split(' ')[0] || user.nome?.split(' ')[0] || 'parceiro')

    // Se falta nome de oficina (cadastro Google sem oficina) → pede primeiro
    const oficinaSalva = user.oficina || ''
    if (!oficinaSalva.trim()) {
      setStep('oficina')
    } else {
      setOficina(oficinaSalva)
      setStep('tipo')
    }
  }, [authLoading, user])

  // ── Avança do passo "oficina" para "tipo" ─────────────────────────────────
  const handleOficinaNext = () => {
    if (!oficina.trim()) return
    setStep('tipo')
  }

  // ── Avança do passo "tipo" para "cargo" ───────────────────────────────────
  const handleTipoNext = () => {
    if (!tipo) return
    setStep('cargo')
  }

  // ── Salva e redireciona ───────────────────────────────────────────────────
  const handleCargoNext = async () => {
    if (!cargo || saving) return
    setSaving(true)
    setStep('saving')

    try {
      const updates = {
        tipo_oficina: tipo,
        cargo,
        ...(oficina.trim() ? { oficina: oficina.trim() } : {}),
      }
      await supabase.from('profiles').update(updates).eq('id', user.id)

      // Analytics qualificado
      try {
        if (typeof gtag === 'function') {
          gtag('event', 'lead_qualificado', { tipo_oficina: tipo, cargo, is_owner: cargo === 'dono' })
          if (cargo === 'dono') {
            gtag('event', 'lead_dono_oficina', { tipo_oficina: tipo })
          }
        }
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({ event: 'lead_qualificado', tipo_oficina: tipo, cargo, is_owner: cargo === 'dono' })
      } catch {}

      // Atualiza contexto
      await refreshUser()
    } catch (e) {
      console.error('Erro ao salvar qualificação:', e)
    }

    setStep('done')
    setTimeout(() => navigate('/app/oficina', { replace: true }), 1800)
  }

  // ── Renderização por passo ────────────────────────────────────────────────
  if (authLoading || step === 'loading') return <Loader />

  // Tela final de sucesso
  if (step === 'saving' || step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Tudo pronto! 🎉</h2>
          <p className="text-indigo-300 text-sm">Preparando seu BoxCerto...</p>
          <div className="mt-6 flex gap-1.5 justify-center">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Total de passos visíveis: oficina é step extra só quando necessário
  const hasOficinaStep = step === 'oficina' || (step !== 'tipo' && step !== 'cargo' && !user?.oficina?.trim())
  const totalSteps = hasOficinaStep ? 3 : 2
  const stepIndex  = step === 'oficina' ? 0 : step === 'tipo' ? (hasOficinaStep ? 1 : 0) : (hasOficinaStep ? 2 : 1)

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

        <ProgressBar step={stepIndex} total={totalSteps} />

        {/* ── PASSO: Nome da Oficina ────────────────────────── */}
        {step === 'oficina' && (
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">Passo 1</p>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">
              Como se chama<br />sua oficina?
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Isso aparece no sistema e nos orçamentos que você envia aos clientes.
            </p>

            <input
              autoFocus
              type="text"
              value={oficina}
              onChange={e => setOficina(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleOficinaNext()}
              placeholder="Ex: Oficina do João, Auto Center Silva..."
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none text-slate-900 placeholder-slate-300 text-base transition-all mb-6"
            />

            <button
              onClick={handleOficinaNext}
              disabled={!oficina.trim()}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-indigo-200"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* ── PASSO: Tipo de negócio ────────────────────────── */}
        {step === 'tipo' && (
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
              {hasOficinaStep ? 'Passo 2' : 'Passo 1'}
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">
              Que tipo de negócio<br />você tem?
            </h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Vamos personalizar o BoxCerto para a sua realidade.
            </p>

            <div className="space-y-2.5 mb-6">
              {TIPOS.map(opt => (
                <OptionCard
                  key={opt.value}
                  {...opt}
                  selected={tipo === opt.value}
                  onClick={() => setTipo(opt.value)}
                />
              ))}
            </div>

            <button
              onClick={handleTipoNext}
              disabled={!tipo}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-indigo-200"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* ── PASSO: Cargo ──────────────────────────────────── */}
        {step === 'cargo' && (
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
              {hasOficinaStep ? 'Passo 3' : 'Passo 2'}
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-1">
              Qual é o seu papel<br />na oficina?
            </h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Última pergunta, {nomeDisplay}. Promessa!
            </p>

            <div className="space-y-2.5 mb-6">
              {CARGOS.map(opt => (
                <OptionCard
                  key={opt.value}
                  {...opt}
                  selected={cargo === opt.value}
                  onClick={() => setCargo(opt.value)}
                />
              ))}
            </div>

            <button
              onClick={handleCargoNext}
              disabled={!cargo || saving}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-indigo-200"
            >
              {saving ? 'Salvando...' : 'Entrar no BoxCerto →'}
            </button>

            <p className="text-center text-xs text-slate-300 mt-3">
              🔒 7 dias grátis • sem cartão • cancele quando quiser
            </p>
          </div>
        )}
      </div>

      {/* Rodapé discreto */}
      <p className="mt-6 text-indigo-300/50 text-xs text-center">
        Suas respostas nos ajudam a melhorar o sistema para oficinas como a sua.
      </p>
    </div>
  )
}
