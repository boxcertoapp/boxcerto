import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle2, MessageCircle, Clock, Car, Wrench,
  Shield, Loader2, XCircle, ChevronDown, ChevronUp, Bell, RefreshCw,
  Camera, X,
} from 'lucide-react'
import { osStorage, formatCurrency } from '../lib/storage'
import { urlPublica } from '../lib/fotos'
import { supabase } from '../lib/supabase'
import PlateTag from '../components/PlateTag'
import { showToast } from '../components/Toast'

// Monta o número no formato do wa.me (55 + DDD + número). Trata números
// que já vêm com o código do país e zeros à esquerda. Retorna '' se for
// curto demais para discar (aí o botão de contato nem aparece).
function waNumber(raw) {
  const d = (raw || '').replace(/\D/g, '').replace(/^0+/, '')
  if (!d) return ''
  if (d.length >= 12 && d.startsWith('55')) return d   // já tem o 55
  if (d.length >= 10) return '55' + d                   // DDD + número
  return ''
}

// ── Galeria de fotos (só as liberadas pela oficina) ──────────────
function FotosCliente({ fotos }) {
  const lista = (fotos || []).filter(f => f && f.pub)
  const [zoom, setZoom] = useState(null)
  if (!lista.length) return null
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Camera className="w-4 h-4 text-slate-400" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fotos do serviço</p>
      </div>
      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        {lista.map((f, i) => (
          <button key={i} onClick={() => setZoom(i)} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={urlPublica(f.pub)} alt={f.etiqueta || 'Foto do serviço'} className="w-full h-full object-cover" loading="lazy" />
            {f.etiqueta && (
              <span className="absolute bottom-1 left-1 right-1 text-[9px] font-semibold text-white bg-black/55 rounded px-1 py-0.5 truncate text-center">{f.etiqueta}</span>
            )}
          </button>
        ))}
      </div>
      {zoom != null && lista[zoom] && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col" onClick={() => setZoom(null)}>
          <div className="flex justify-between items-center p-4 shrink-0">
            <span className="text-white/70 text-xs font-mono">{zoom + 1} / {lista.length}</span>
            <button className="p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-6 min-h-0">
            <img src={urlPublica(lista[zoom].pub)} alt={lista[zoom].etiqueta || 'Foto do serviço'} className="max-h-full max-w-full object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Stepper ──────────────────────────────────────────────────────
const PASSOS = [
  { key: 'orcamento', label: 'Orçamento'       },
  { key: 'aprovado',  label: 'Aprovado'         },
  { key: 'servico',   label: 'Em serviço'       },
  { key: 'pronto',    label: 'Pronto'           },
]

// Retorna o passo atual (0-3) e se o orçamento foi atualizado após aprovação anterior
function getEstado(os) {
  if (!os) return { passo: 0, foiAtualizado: false }
  const aprovado    = os.aprovacao_status === 'aprovado'
  const temHistorico = !!os.aprovado_em   // já foi aprovado antes
  if (!aprovado) {
    return { passo: 0, foiAtualizado: temHistorico }  // pendente — 1ª vez ou re-aprovação
  }
  if (os.status === 'orcamento')  return { passo: 1, foiAtualizado: false }
  if (os.status === 'manutencao') return { passo: 2, foiAtualizado: false }
  return { passo: 3, foiAtualizado: false }
}

function Stepper({ ativo }) {
  return (
    <div className="flex items-start">
      {PASSOS.map((p, i) => {
        const done   = i < ativo
        const active = i === ativo
        return (
          <div key={p.key} className="flex-1 flex flex-col items-center relative">
            {/* Linha conectora */}
            {i < PASSOS.length - 1 && (
              <div
                className="absolute top-[14px] left-1/2 w-full h-[2px] z-0 transition-colors duration-500"
                style={{ background: done ? '#4f46e5' : '#e5e7eb' }}
              />
            )}
            {/* Círculo */}
            <div
              className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
              style={{
                background: done ? '#4f46e5' : active ? '#fff' : '#f3f4f6',
                border: active ? '2px solid #4f46e5' : done ? 'none' : '1.5px solid #d1d5db',
                color: done ? '#fff' : active ? '#4f46e5' : '#9ca3af',
              }}
            >
              {done ? (
                <svg viewBox="0 0 12 10" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1,5 4,8 11,1" />
                </svg>
              ) : i + 1}
            </div>
            {/* Label */}
            <span
              className="mt-1.5 text-[10px] text-center leading-tight font-medium"
              style={{ color: done || active ? '#4f46e5' : '#9ca3af' }}
            >
              {p.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Acordeão do orçamento (pós-aprovação) ────────────────────────
function OrcamentoAcordeon({ items, total, desconto, descontoValor }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-slate-700">Ver orçamento aprovado</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-indigo-600">{formatCurrency(total)}</span>
          {aberto
            ? <ChevronUp  className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      {aberto && (
        <div className="border-t border-gray-50">
          <div className="divide-y divide-gray-50">
            {items.map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{item.descricao}</p>
                  {item.garantia && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield className="w-3 h-3 text-indigo-400" />
                      <p className="text-xs text-indigo-500">{item.garantia}</p>
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-800 shrink-0">{formatCurrency(item.venda)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-4 py-3 space-y-1">
            {descontoValor > 0 && (
              <>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(items.reduce((s, i) => s + Number(i.venda || 0), 0))}</span>
                </div>
                <div className="flex justify-between text-xs text-green-600">
                  <span>Desconto {desconto?.tipo === 'percent' ? `(${desconto.valor}%)` : ''}</span>
                  <span>− {formatCurrency(descontoValor)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-sm font-bold text-slate-900">Total aprovado</span>
              <span className="text-base font-bold text-indigo-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Vistoria de entrada (ciente do cliente) ──────────────────────
const ITENS_LBL = { estepe: 'Estepe', macaco: 'Macaco', chave_roda: 'Chave de roda', documentos: 'Documentos', som: 'Som/multimídia', tapetes: 'Tapetes' }

function VistoriaCliente({ token }) {
  const [v,        setV]        = useState(null)
  const [ciente,   setCiente]   = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let vivo = true
    supabase.rpc('get_vistoria_by_token', { p_token: token }).then(({ data }) => {
      if (vivo && data) { setV(data); setCiente(data.ciente || null) }
    })
    return () => { vivo = false }
  }, [token])

  if (!v) return null

  const itensPresentes = Object.entries(v.itens || {}).filter(([, on]) => on).map(([k]) => ITENS_LBL[k] || k)

  const confirmar = async () => {
    setEnviando(true)
    const { data, error } = await supabase.rpc('vistoria_dar_ciente', { p_token: token })
    setEnviando(false)
    if (error) { showToast('Não foi possível confirmar. Tente de novo.', 'warning'); return }
    if (data) setCiente(data)
  }

  const fmtDt = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-800">Vistoria de entrada</h3>
      </div>
      {(v.fotos || []).length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {v.fotos.map((p, i) => (
            <a key={i} href={urlPublica(p)} target="_blank" rel="noreferrer"
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 block">
              <img src={urlPublica(p)} alt="Foto da vistoria de entrada" className="w-full h-full object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      )}
      <div className="space-y-1.5 text-sm text-slate-600 mb-4">
        {v.combustivel && <p>Combustível na entrada: <strong className="text-slate-800">{v.combustivel}</strong></p>}
        {itensPresentes.length > 0 && <p>Itens: {itensPresentes.join(', ')}</p>}
        {v.avarias_count > 0 && <p>{v.avarias_count} {v.avarias_count === 1 ? 'avaria registrada' : 'avarias registradas'}</p>}
        {v.observacoes && <p className="text-slate-500">{v.observacoes}</p>}
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3">
        <p className="text-xs text-slate-500 leading-relaxed">Declaro estar ciente do estado do veículo descrito acima, registrado na entrada para serviço.</p>
      </div>

      {ciente ? (
        <div className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-emerald-600">
          <CheckCircle2 className="w-4 h-4" /> Confirmado em {fmtDt(ciente.em)}
        </div>
      ) : (
        <button onClick={confirmar} disabled={enviando}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Confirmo o estado na entrada
        </button>
      )}
    </div>
  )
}

// ── Conteúdo por passo ───────────────────────────────────────────
function ConteudoPasso({ passo, foiAtualizado, os, items, total, desconto, descontoValor, onAprovar, aprovando, onWhatsApp, temTelefone }) {
  if (passo === 0) {
    // Aguardando aprovação — exibe orçamento completo
    return (
      <>
        {foiAtualizado ? (
          <div className="bg-orange-50 border border-orange-300 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-orange-800">Orçamento atualizado</p>
              <p className="text-sm text-orange-600 mt-0.5">A oficina fez alterações no orçamento. Por favor, revise os valores e aprove novamente.</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">Aguardando sua aprovação</p>
              <p className="text-sm text-amber-600 mt-0.5">Revise e aprove para iniciarmos o serviço.</p>
            </div>
          </div>
        )}

        {/* Itens */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Serviços e peças</p>
          </div>
          <div className="divide-y divide-gray-50">
            {items.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400 text-center">Nenhum item cadastrado</p>
            ) : items.map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium">{item.descricao}</p>
                  {item.garantia && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield className="w-3 h-3 text-indigo-400" />
                      <p className="text-xs text-indigo-500">{item.garantia}</p>
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-900 shrink-0">{formatCurrency(item.venda)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-4 py-3 space-y-1.5">
            {descontoValor > 0 && (
              <>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(items.reduce((s, i) => s + Number(i.venda || 0), 0))}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto {desconto?.tipo === 'percent' ? `(${desconto.valor}%)` : ''}</span>
                  <span>− {formatCurrency(descontoValor)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-xl text-indigo-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Observações */}
        {os.observacoes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Observações</p>
            <p className="text-sm text-amber-800">{os.observacoes}</p>
          </div>
        )}

        {/* Botões */}
        <div className="space-y-3 pt-2 pb-8">
          <button
            onClick={onAprovar}
            disabled={aprovando}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {aprovando
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Aprovando...</>
              : <><CheckCircle2 className="w-5 h-5" /> Aprovar orçamento</>
            }
          </button>
          {temTelefone && (
            <button
              onClick={onWhatsApp}
              className="w-full bg-white text-slate-700 font-semibold py-4 rounded-2xl text-base border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              Tenho uma dúvida
            </button>
          )}
        </div>
      </>
    )
  }

  if (passo === 1) {
    // Aprovado — aguardando início do serviço
    return (
      <>
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-indigo-600" />
          </div>
          <p className="font-bold text-indigo-900 text-lg">Orçamento aprovado!</p>
          <p className="text-sm text-indigo-600 mt-1">A oficina já foi notificada e em breve iniciará o serviço.</p>
        </div>

        <OrcamentoAcordeon items={items} total={total} desconto={desconto} descontoValor={descontoValor} />

        {temTelefone && (
          <button
            onClick={onWhatsApp}
            className="w-full bg-white text-slate-700 font-semibold py-4 rounded-2xl text-base border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 mb-8"
          >
            <MessageCircle className="w-5 h-5 text-green-600" />
            Falar com a oficina
          </button>
        )}
      </>
    )
  }

  if (passo === 2) {
    // Em manutenção
    return (
      <>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-7 h-7 text-blue-600" />
          </div>
          <p className="font-bold text-blue-900 text-lg">Veículo em serviço</p>
          <p className="text-sm text-blue-600 mt-1">Nossa equipe está trabalhando. Você será avisado quando estiver pronto.</p>
        </div>

        <OrcamentoAcordeon items={items} total={total} desconto={desconto} descontoValor={descontoValor} />

        {temTelefone && (
          <button
            onClick={onWhatsApp}
            className="w-full bg-white text-slate-700 font-semibold py-4 rounded-2xl text-base border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 mb-8"
          >
            <MessageCircle className="w-5 h-5 text-green-600" />
            Falar com a oficina
          </button>
        )}
      </>
    )
  }

  // passo === 3 — Pronto para retirada
  return (
    <>
      <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Bell className="w-8 h-8 text-green-600" />
        </div>
        <p className="font-bold text-green-900 text-xl">Pronto para retirada!</p>
        <p className="text-sm text-green-700 mt-1.5">Seu veículo está pronto. Fale com a oficina para combinar a retirada.</p>
      </div>

      {temTelefone && (
        <button
          onClick={onWhatsApp}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Falar com a oficina no WhatsApp
        </button>
      )}

      <OrcamentoAcordeon items={items} total={total} desconto={desconto} descontoValor={descontoValor} />

      <div className="pb-8" />
    </>
  )
}

// ── Componente principal ─────────────────────────────────────────
export default function OrcamentoPublico() {
  const { token } = useParams()
  const [os, setOs]           = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [aprovando, setAprovando] = useState(false)
  const [showDuvida, setShowDuvida] = useState(false)
  const [duvida, setDuvida]   = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await osStorage.getByToken(token)
        if (!data) { setNotFound(true); return }
        setOs(data)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const handleAprovar = async () => {
    setAprovando(true)
    try {
      const ok = await osStorage.approveByToken(token)
      if (ok) {
        setOs(prev => ({ ...prev, aprovacao_status: 'aprovado' }))
        // Notifica o mecânico via push — fire-and-forget, não bloqueia o UI
        fetch('/api/notify-aprovacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch(() => {})
      } else {
        showToast('Não foi possível aprovar. O orçamento pode ter sido alterado.')
      }
    } catch {
      showToast('Erro ao aprovar. Tente novamente.')
    } finally {
      setAprovando(false)
    }
  }

  const handleWhatsApp = () => {
    if (!os) return
    const numero = waNumber(os.office?.telefone)
    const { passo: p, foiAtualizado: atualizado } = getEstado(os)
    const msgs = [
      atualizado
        ? `Olá! Vi que o orçamento do ${os.vehicle?.modelo} (${os.vehicle?.placa}) foi atualizado. Pode me explicar as alterações?`
        : `Olá! Tenho uma dúvida sobre o orçamento do ${os.vehicle?.modelo} (${os.vehicle?.placa}).`,
      `Olá! Aprovei o orçamento do ${os.vehicle?.modelo} (${os.vehicle?.placa}) e gostaria de mais informações.`,
      `Olá! Gostaria de saber como está o serviço do ${os.vehicle?.modelo} (${os.vehicle?.placa}).`,
      `Olá! Vi que o ${os.vehicle?.modelo} (${os.vehicle?.placa}) está pronto. Quando posso retirar?`,
    ]
    const texto = msgs[p] || msgs[0]
    if (numero) {
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank')
    } else {
      setShowDuvida(true)
    }
  }

  // ── Loading / Not Found ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Orçamento não encontrado</h1>
          <p className="text-slate-500 text-sm">
            Este link pode ter expirado ou sido removido. Entre em contato com a oficina.
          </p>
        </div>
      </div>
    )
  }

  // ── Cálculos ────────────────────────────────────────────────────
  const items       = os.items || []
  const subtotal    = items.reduce((s, i) => s + Number(i.venda || 0), 0)
  const desconto    = os.desconto || { tipo: 'valor', valor: 0 }
  const descontoValor = (() => {
    if (!desconto.valor) return 0
    if (desconto.tipo === 'percent') return subtotal * desconto.valor / 100
    return Math.min(Number(desconto.valor), subtotal)
  })()
  const total = subtotal - descontoValor

  const { passo, foiAtualizado } = getEstado(os)
  const oficinaNome  = os.office?.nome    || 'Oficina'
  const oficinaTel   = os.office?.telefone || ''
  const oficinaLogo  = os.office?.logo    || ''
  // Só libera o botão de contato quando há um número dialável (mesma
  // checagem que o wa.me usa). Sem isso o WhatsApp não abriria nada.
  const temTelefone  = !!waNumber(oficinaTel)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header da oficina */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {oficinaLogo ? (
            <img src={oficinaLogo} alt={oficinaNome} className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-900">{oficinaNome}</p>
            {oficinaTel && <p className="text-xs text-slate-400">{oficinaTel}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Dados do veículo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Veículo</p>
            </div>
            {os.numero_os && (
              <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                #{os.numero_os.slice(0,3)}-{os.numero_os.slice(3)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <PlateTag placa={os.vehicle?.placa} />
            <div>
              <p className="font-semibold text-slate-900">{os.vehicle?.modelo}</p>
              <p className="text-sm text-slate-400">{os.client?.nome}</p>
            </div>
          </div>
          {os.km && <p className="text-xs text-slate-400 mt-2">KM: {os.km}</p>}
        </div>

        {/* Stepper de progresso */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <Stepper ativo={passo} />
        </div>

        {/* Conteúdo dinâmico por passo */}
        <ConteudoPasso
          passo={passo}
          foiAtualizado={foiAtualizado}
          os={os}
          items={items}
          total={total}
          desconto={desconto}
          descontoValor={descontoValor}
          onAprovar={handleAprovar}
          aprovando={aprovando}
          onWhatsApp={handleWhatsApp}
          temTelefone={temTelefone}
        />

        {/* Fotos do serviço (só as liberadas pela oficina) */}
        <FotosCliente fotos={os.fotos} />

        {/* Vistoria de entrada — ciente do cliente (só se a oficina liberou) */}
        <VistoriaCliente token={token} />

        {/* Footer */}
        <p className="text-center text-xs text-slate-300 pb-6">Gerenciado por BoxCerto · boxcerto.com</p>
      </div>

      {/* Modal fallback dúvida (sem telefone cadastrado) */}
      {showDuvida && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-slate-900 mb-1">Enviar mensagem</h3>
            <p className="text-sm text-slate-500 mb-4">
              Entre em contato diretamente com a oficina.
            </p>
            <textarea
              value={duvida}
              onChange={e => setDuvida(e.target.value)}
              placeholder="Sua mensagem..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-400 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowDuvida(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!duvida.trim()) return
                  const numero = waNumber(oficinaTel)
                  const texto = `Mensagem sobre ${os.vehicle?.placa}: ${duvida}`
                  if (numero) window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank')
                  setShowDuvida(false)
                }}
                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold"
              >
                Enviar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
