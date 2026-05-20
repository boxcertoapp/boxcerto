import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, X, ChevronDown, ChevronUp, HelpCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function OnboardingChecklist() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const tooltipRef = useRef(null)

  // Inicia EXPANDIDO — garante que o usuário veja os passos logo na primeira visita
  const [collapsed,   setCollapsed]   = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  // Aviso inline para passo 3 quando OS ainda não foi criada
  const [warnOS, setWarnOS] = useState(false)

  const [done, setDone] = useState({
    oficina:   false,
    os:        false,
    orcamento: false,
  })
  const [dismissed, setDismissed] = useState(false)

  // Sincroniza quando user carrega / atualiza
  useEffect(() => {
    if (!user) return
    setDone({
      oficina:   user.onboardingOficinaD      || false,
      os:        user.onboardingOsDone        || false,
      orcamento: user.onboardingOrcamentoDone || false,
    })
    setDismissed(user.onboardingDismissed || false)
  }, [
    user?.id,
    user?.onboardingOficinaD,
    user?.onboardingOsDone,
    user?.onboardingOrcamentoDone,
    user?.onboardingDismissed,
  ])

  // Persistência no Supabase (fire-and-forget)
  const persist = useCallback(async (col) => {
    if (!user?.id) return
    try {
      await supabase.from('profiles').update({ [col]: true }).eq('id', user.id)
    } catch {}
  }, [user?.id])

  // Listeners de eventos globais
  useEffect(() => {
    const markOficina = () => {
      setDone(p => ({ ...p, oficina: true }))
      persist('onboarding_oficina_done')
    }
    const markOs = () => {
      setDone(p => ({ ...p, os: true }))
      persist('onboarding_os_done')
      setWarnOS(false) // limpa aviso se já criou
    }
    const markOrcamento = () => {
      setDone(p => ({ ...p, orcamento: true }))
      persist('onboarding_orcamento_done')
    }

    window.addEventListener('boxcerto:oficina-configurada', markOficina)
    window.addEventListener('boxcerto:os-criada',           markOs)
    window.addEventListener('boxcerto:orcamento-enviado',   markOrcamento)
    return () => {
      window.removeEventListener('boxcerto:oficina-configurada', markOficina)
      window.removeEventListener('boxcerto:os-criada',           markOs)
      window.removeEventListener('boxcerto:orcamento-enviado',   markOrcamento)
    }
  }, [persist])

  // Fecha tooltip ao clicar fora
  useEffect(() => {
    if (!showTooltip) return
    const handler = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setShowTooltip(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showTooltip])

  // Quando todos os 3 passos forem concluídos → dismiss permanente no banco
  useEffect(() => {
    if (!user?.id) return
    if (done.oficina && done.os && done.orcamento) {
      setDismissed(true)
      supabase.from('profiles')
        .update({ onboarding_dismissed: true })
        .eq('id', user.id)
        .then(() => {}).catch(() => {})
    }
  }, [done.oficina, done.os, done.orcamento, user?.id])

  // ── Guarda de exibição ─────────────────────────────────────
  if (!user || user.isAdmin || user.isTecnico || dismissed) return null

  const completedCount = [done.oficina, done.os, done.orcamento].filter(Boolean).length

  // ── Ações ─────────────────────────────────────────────────
  // X fecha só por essa sessão — não persiste no banco (volta no próximo acesso)
  const dismiss = () => setDismissed(true)

  // Passo 1: navega para Menu e abre direto na aba "Oficina"
  const irParaConfigurar = () => {
    setCollapsed(true)
    navigate('/app/menu', { state: { tab: 'oficina' } })
  }

  // Passo 2: navega para Oficina e dispara abertura do modal de nova OS
  const irParaCriarOS = () => {
    setCollapsed(true)
    navigate('/app/oficina')
    setTimeout(() => window.dispatchEvent(new CustomEvent('boxcerto:abrir-nova-os')), 80)
  }

  // Passo 3: se OS não foi criada, mostra aviso e oferece criar agora
  //          se OS já existe, navega para Oficina com dica
  const irParaOrcamento = () => {
    if (!done.os) {
      setWarnOS(true)
    } else {
      setCollapsed(true)
      navigate('/app/oficina')
    }
  }

  // ── Passos ────────────────────────────────────────────────
  const steps = [
    {
      key:    'os',
      icon:   '📋',
      label:  'Crie seu primeiro orçamento',
      done:   done.os,
      action: irParaCriarOS,
    },
    {
      key:    'oficina',
      icon:   '📋',
      label:  'Configure sua oficina',
      done:   done.oficina,
      action: irParaConfigurar,
    },
    {
      key:        'orcamento',
      icon:       '📲',
      label:      'Envie um orçamento',
      done:       done.orcamento,
      action:     irParaOrcamento,
      hasTooltip: true,
    },
  ]

  return (
    <div
      className="fixed z-50 left-3 bottom-[88px] lg:left-auto lg:right-6 lg:bottom-6 w-72"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.14))' }}
    >
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white">

        {/* ── Cabeçalho (sempre visível) ─────────────────── */}
        <div
          className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-2 cursor-pointer select-none"
          onClick={() => { setCollapsed(c => !c); setWarnOS(false) }}
        >
          <span className="text-base leading-none">🚀</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">Primeiros passos</p>
            <p className="text-indigo-200 text-[11px] mt-0.5">
              {completedCount} de 3 concluídos
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); setWarnOS(false) }}
            className="p-1 hover:bg-indigo-500 rounded-lg transition-colors"
            title={collapsed ? 'Expandir' : 'Minimizar'}
          >
            {collapsed
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronUp   className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss() }}
            className="p-1 hover:bg-indigo-500 rounded-lg transition-colors"
            title="Fechar por agora (volta no próximo acesso)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Passos (só quando expandido) ───────────────── */}
        {!collapsed && (
          <>
            <div className="divide-y divide-gray-50">
              {steps.map((step) => (
                <div key={step.key} className="px-4 py-3 flex items-center gap-3">

                  {/* Checkbox circular */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                    step.done
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-gray-300'
                  }`}>
                    {step.done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>

                  {/* Ícone + label */}
                  <span className={`flex-1 text-sm leading-snug ${
                    step.done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'
                  }`}>
                    <span className="mr-1">{step.icon}</span>
                    {step.label}
                  </span>

                  {/* Ação — só se não concluído */}
                  {!step.done && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* ? Tooltip para passo 3 */}
                      {step.hasTooltip && (
                        <div ref={tooltipRef} className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowTooltip(s => !s) }}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                          {showTooltip && (
                            <div className="absolute right-0 bottom-8 w-56 bg-gray-900 text-white text-[11px] rounded-xl p-3 shadow-2xl z-20 leading-relaxed pointer-events-none">
                              Abra uma OS, adicione itens e toque em{' '}
                              <strong className="text-indigo-300">Enviar para cliente</strong>{' '}
                              para enviar o orçamento via WhatsApp.
                              <div className="absolute bottom-0 right-5 translate-y-1/2 w-2.5 h-2.5 bg-gray-900 rotate-45" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botão Ir → */}
                      <button
                        onClick={(e) => { e.stopPropagation(); step.action() }}
                        className="text-indigo-600 hover:bg-indigo-50 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Ir →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Aviso: OS ainda não criada ─────────────── */}
            {warnOS && (
              <div className="mx-3 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-snug">
                    Você precisa criar o orçamento antes de enviá-lo ao cliente.
                  </p>
                </div>
                <button
                  onClick={() => { setWarnOS(false); irParaCriarOS() }}
                  className="w-full bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  📋 Criar primeiro orçamento agora
                </button>
              </div>
            )}

            {/* Barra de progresso */}
            <div className="px-4 pb-3.5 pt-0.5">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / 3) * 100}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
