import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, MessageCircle, Clock, Car, Wrench, Shield, Loader2, XCircle } from 'lucide-react'
import { osStorage, formatCurrency } from '../lib/storage'

export default function OrcamentoPublico() {
  const { token } = useParams()
  const [os, setOs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [aprovando, setAprovando] = useState(false)
  const [aprovado, setAprovado] = useState(false)
  const [showDuvida, setShowDuvida] = useState(false)
  const [duvida, setDuvida] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await osStorage.getByToken(token)
        if (!data) { setNotFound(true); return }
        setOs(data)
        if (data.aprovacao_status === 'aprovado') setAprovado(true)
      } catch (e) {
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
        setAprovado(true)
        setOs(prev => ({ ...prev, aprovacao_status: 'aprovado' }))
      } else {
        alert('Não foi possível aprovar. O orçamento pode ter sido alterado.')
      }
    } catch (e) {
      alert('Erro ao aprovar. Tente novamente.')
    } finally {
      setAprovando(false)
    }
  }

  const handleDuvida = () => {
    if (!os) return
    const telefone = os.office?.telefone?.replace(/\D/g, '') || ''
    const texto = `Olá! Tenho uma dúvida sobre o orçamento do ${os.vehicle?.modelo} (${os.vehicle?.placa}).`
    if (telefone) {
      window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`, '_blank')
    } else {
      setShowDuvida(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Carregando orçamento...</p>
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

  const items = os.items || []
  const subtotal = items.reduce((s, i) => s + Number(i.venda || 0), 0)
  const desconto = os.desconto || { tipo: 'valor', valor: 0 }
  const descontoValor = (() => {
    if (!desconto.valor) return 0
    if (desconto.tipo === 'percent') return subtotal * desconto.valor / 100
    return Math.min(Number(desconto.valor), subtotal)
  })()
  const total = subtotal - descontoValor

  const oficinaNome = os.office?.nome || 'Oficina'
  const oficinaTel = os.office?.telefone || ''
  const oficinaLogo = os.office?.logo || ''

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header da oficina */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
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

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Badge de status */}
        {aprovado ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-800">Orçamento aprovado!</p>
              <p className="text-sm text-green-600">A oficina já foi notificada. Entraremos em contato em breve.</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-800">Aguardando sua aprovação</p>
              <p className="text-sm text-amber-600">Revise o orçamento e clique em Aprovar para prosseguir.</p>
            </div>
          </div>
        )}

        {/* Dados do veículo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Veículo</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 px-3 py-2 rounded-lg">
              <p className="text-white font-bold tracking-widest text-sm">{os.vehicle?.placa}</p>
              <p className="text-slate-500 text-[9px] text-center">BRASIL</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{os.vehicle?.modelo}</p>
              <p className="text-sm text-slate-400">Cliente: {os.client?.nome}</p>
            </div>
          </div>
          {os.km && <p className="text-xs text-slate-400 mt-2">KM: {os.km}</p>}
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Serviços e Peças</p>
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

          {/* Totais */}
          <div className="border-t border-gray-100 px-4 py-3 space-y-1.5">
            {descontoValor > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-400">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Desconto {desconto.tipo === 'percent' ? `(${desconto.valor}%)` : ''}</span>
                  <span className="text-green-600">− {formatCurrency(descontoValor)}</span>
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

        {/* Botões de ação */}
        {!aprovado && (
          <div className="space-y-3 pt-2 pb-8">
            <button
              onClick={handleAprovar}
              disabled={aprovando}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-base hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {aprovando ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Aprovando...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Aprovar orçamento</>
              )}
            </button>

            <button
              onClick={handleDuvida}
              className="w-full bg-white text-slate-700 font-semibold py-4 rounded-2xl text-base border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              Tenho uma dúvida
            </button>
          </div>
        )}

        {aprovado && (
          <div className="pb-8">
            <button
              onClick={handleDuvida}
              className="w-full bg-white text-slate-700 font-semibold py-4 rounded-2xl text-base border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              Falar com a oficina
            </button>
          </div>
        )}

        {showDuvida && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <h3 className="font-bold text-slate-900 mb-1">Enviar dúvida</h3>
              <p className="text-sm text-slate-500 mb-4">Digite sua mensagem e enviaremos para a oficina.</p>
              <textarea
                value={duvida}
                onChange={e => setDuvida(e.target.value)}
                placeholder="Qual é a sua dúvida sobre o orçamento?"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-400 mb-3"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowDuvida(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 text-sm">Cancelar</button>
                <button
                  onClick={() => {
                    if (!duvida.trim()) return
                    const tel = oficinaTel.replace(/\D/g, '')
                    const texto = `Dúvida sobre orçamento ${os.vehicle?.placa}: ${duvida}`
                    if (tel) window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(texto)}`, '_blank')
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

        {/* Footer */}
        <p className="text-center text-xs text-slate-300 pb-4">Gerenciado por BoxCerto · boxcerto.com</p>
      </div>
    </div>
  )
}
