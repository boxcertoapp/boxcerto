import { useState, useEffect } from 'react'
import {
  Package, Plus, Trash2, X, AlertTriangle,
  Search, Bell, Printer, Edit2, Check, ArrowUpDown,
  ShoppingCart, UserPlus, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { showSaveCheck } from '../../components/SaveCheck'
import { showToast } from '../../components/Toast'
import {
  inventoryStorage, vendaStorage, clientStorage,
  officeDataStorage, formatCurrency, norm,
  printVendaReceipt, downloadVendaPDF,
} from '../../lib/storage'

// ── RELATÓRIO DE ESTOQUE ──────────────────────────────────
function printEstoque({ items, officeData, formatCurrencyFn }) {
  const total = items.reduce((s, i) => s + i.valorCompra * i.quantidade, 0)
  const rows = items.map(i => `
    <tr style="${i.alertaAtivo && i.quantidade <= i.quantidadeMin ? 'background:#fef2f2' : ''}">
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px">${i.produto}${i.alertaAtivo && i.quantidade <= i.quantidadeMin ? ' ⚠️' : ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;font-weight:${i.alertaAtivo && i.quantidade <= i.quantidadeMin ? '700;color:#dc2626' : '600'}">${i.quantidade}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right">${formatCurrencyFn(i.valorCompra)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right">${formatCurrencyFn(i.valorVenda)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b">${i.fornecedor || '—'}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Relatório de Estoque</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;padding:32px;color:#1e293b}@media print{body{padding:16px}}</style>
</head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e2e8f0">
    <div>
      ${officeData.logo ? `<img src="${officeData.logo}" style="max-height:50px;max-width:140px;object-fit:contain;margin-bottom:8px;display:block"/>` : ''}
      <div style="font-size:18px;font-weight:800">${officeData.nome || 'Minha Oficina'}</div>
    </div>
    <div style="text-align:right">
      <div style="background:#4f46e5;color:white;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;text-transform:uppercase;letter-spacing:.5px">Relatório de Estoque</div>
      <div style="font-size:12px;color:#64748b;margin-top:6px">${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <thead><tr style="background:#f8fafc">
      <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Produto</th>
      <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Qtd</th>
      <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Custo</th>
      <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Venda</th>
      <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Fornecedor</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="background:#4f46e5;color:white;border-radius:12px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-weight:600;font-size:14px">${items.length} itens em estoque</span>
    <span style="font-weight:800;font-size:18px">Total investido: ${formatCurrencyFn(total)}</span>
  </div>
  <div style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px">Gerado por BoxCerto &bull; boxcerto.com</div>
</body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { showToast('Permita pop-ups para gerar o documento.', 'warning'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

// ── MODAL DE VENDA ────────────────────────────────────────
const PAGAMENTOS_VENDA = [
  { key: 'pix',     label: 'PIX'     },
  { key: 'dinheiro',label: 'Dinheiro'},
  { key: 'debito',  label: 'Débito'  },
  { key: 'credito', label: 'Crédito' },
]

function VendaModal({ inventory, officeData, onClose, onVendaCompleta }) {
  const { user } = useAuth()
  const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'

  // Produto
  const [busca,    setBusca]    = useState('')
  const [carrinho, setCarrinho] = useState([])

  // Desconto
  const [showDesconto, setShowDesconto] = useState(false)
  const [desconto,     setDesconto]     = useState({ tipo: 'valor', valor: '' })

  // Cliente
  const [showCliente,         setShowCliente]         = useState(false)
  const [clienteQuery,        setClienteQuery]        = useState('')
  const [clienteSugeridos,    setClienteSugeridos]    = useState([])
  const [clienteSelecionado,  setClienteSelecionado]  = useState(null)
  const [showClienteForm,     setShowClienteForm]     = useState(false)
  const [novoCliente,         setNovoCliente]         = useState({ nome: '', whatsapp: '', cpf: '' })

  // Pagamentos múltiplos
  const [pagamentos, setPagamentos] = useState([]) // [{ method, amount }]

  // Estado geral
  const [loading,   setLoading]   = useState(false)
  const [erro,      setErro]      = useState('')
  const [vendaFeita,setVendaFeita]= useState(null)

  // Cálculos
  const subtotal = carrinho.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0)
  const descontoValor = (() => {
    if (!showDesconto || !desconto.valor) return 0
    if (desconto.tipo === 'percent') return Math.min(subtotal * Number(desconto.valor) / 100, subtotal)
    return Math.min(Number(desconto.valor), subtotal)
  })()
  const total     = subtotal - descontoValor
  const totalPago = pagamentos.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const restante  = Math.max(0, parseFloat((total - totalPago).toFixed(2)))

  const disponiveis = inventory.filter(i => i.quantidade > 0)
  const filtrados   = disponiveis.filter(i => norm(i.produto).includes(norm(busca)))

  useEffect(() => {
    if (!showCliente || clienteQuery.trim().length < 1) { setClienteSugeridos([]); return }
    clientStorage.search(user.oficina, clienteQuery).then(setClienteSugeridos)
  }, [clienteQuery, showCliente])

  const addItem = (item) => {
    setCarrinho(prev => {
      const exists = prev.find(c => c.inventoryId === item.id)
      if (exists) return prev.map(c => c.inventoryId === item.id
        ? { ...c, quantidade: Math.min(c.quantidade + 1, item.quantidade) } : c)
      return [...prev, { inventoryId: item.id, produto: item.produto, quantidade: 1, valorUnitario: item.valorVenda, custo: item.valorCompra }]
    })
    setBusca('')
  }

  const updateQty = (inventoryId, delta) =>
    setCarrinho(prev => prev.map(c => c.inventoryId === inventoryId
      ? { ...c, quantidade: Math.max(0, c.quantidade + delta) } : c).filter(c => c.quantidade > 0))

  const addPagamento = (method) => {
    setPagamentos(prev => {
      if (prev.find(p => p.method === method)) return prev
      const val = restante > 0 ? restante.toFixed(2) : ''
      return [...prev, { method, amount: val }]
    })
    setErro('')
  }

  const updatePagAmount = (method, val) =>
    setPagamentos(prev => prev.map(p => p.method === method ? { ...p, amount: val } : p))

  const removePag = (method) =>
    setPagamentos(prev => prev.filter(p => p.method !== method))

  const confirmar = async () => {
    if (carrinho.length === 0) return setErro('Adicione pelo menos um produto.')
    if (pagamentos.length === 0) return setErro('Selecione a forma de pagamento.')
    if (restante > 0.01) return setErro(`Faltam ${formatCurrency(restante)} para cobrir o total.`)
    setErro(''); setLoading(true)
    try {
      let clienteId   = clienteSelecionado?.id || null
      let nomeCliente = clienteSelecionado?.nome || ''

      if (!clienteSelecionado && novoCliente.nome.trim()) {
        const novo = await clientStorage.create({
          officeName: user.oficina,
          nome:     novoCliente.nome.trim(),
          whatsapp: novoCliente.whatsapp.trim(),
          cpf:      novoCliente.cpf.trim(),
        })
        clienteId   = novo.id
        nomeCliente = novo.nome
        setClienteSelecionado(novo)
      }

      const descontoObj = showDesconto && desconto.valor
        ? { tipo: desconto.tipo, valor: Number(desconto.valor) }
        : { tipo: 'valor', valor: 0 }

      const venda = await vendaStorage.create({
        items:    carrinho,
        cliente:  nomeCliente,
        clientId: clienteId,
        pagamentos,
        desconto: descontoObj,
        total,
      })
      setVendaFeita({ ...venda, clienteNome: nomeCliente, whatsapp: clienteSelecionado?.whatsapp || novoCliente.whatsapp })
      onVendaCompleta()
      showSaveCheck('Venda registrada!')
    } catch (e) {
      setErro(e.message || 'Erro ao registrar venda.')
      setLoading(false)
    }
  }

  const handlePDF = () =>
    downloadVendaPDF({ venda: vendaFeita, clienteNome: vendaFeita.clienteNome, officeData, formatCurrencyFn: formatCurrency })

  const handleWhatsApp = () => {
    const wpp  = vendaFeita.whatsapp?.replace(/\D/g, '')
    const itens = vendaFeita.items.map(i => `• ${i.produto} x${i.quantidade} — ${formatCurrency(i.valorUnitario * i.quantidade)}`).join('\n')
    const pags  = (vendaFeita.pagamentos || []).map(p => `${PAGAMENTOS_VENDA.find(x => x.key === p.method)?.label || p.method}: ${formatCurrency(Number(p.amount))}`).join(', ')
    const desc  = descontoValor > 0 ? `\n🏷 Desconto: − ${formatCurrency(descontoValor)}` : ''
    const msg   = `🧾 *Recibo de Compra*\n🏪 *${officeData.nome || 'Oficina'}*\n📅 ${new Date().toLocaleDateString('pt-BR')}\n\n🛒 *Itens:*\n${itens}${desc}\n\n💰 *Total: ${formatCurrency(vendaFeita.total)}*\n💳 ${pags}\n\nObrigado pela preferência! 🙏`
    const url   = wpp
      ? `https://api.whatsapp.com/send?phone=55${wpp}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-x-hidden">

        <div className="flex items-center justify-between p-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-slate-900">Nova Venda</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {/* ── Sucesso ── */}
        {vendaFeita ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 pb-10">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">Venda registrada!</p>
              <p className="text-sm text-slate-400 mt-1">Estoque atualizado · {formatCurrency(vendaFeita.total)}</p>
            </div>
            <div className="w-full space-y-2 mt-2">
              <button onClick={handlePDF} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Baixar PDF / Imprimir recibo
              </button>
              <button onClick={handleWhatsApp} className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                <span className="text-base">💬</span> Enviar pelo WhatsApp
              </button>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl text-slate-400 text-sm hover:text-slate-600 transition-colors">
                Fechar sem recibo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">

              {/* Busca produto */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto do estoque..." autoFocus
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50" />
                </div>
                {busca.length > 0 && (filtrados.length > 0 ? (
                  <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {filtrados.slice(0, 6).map(item => (
                      <button key={item.id} type="button" onMouseDown={e => { e.preventDefault(); addItem(item) }}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center justify-between border-b border-gray-50 last:border-0">
                        <div><p className="text-sm font-semibold text-slate-900">{item.produto}</p><p className="text-xs text-slate-400">{item.quantidade} em estoque</p></div>
                        <p className="text-sm font-bold text-green-700">{formatCurrency(item.valorVenda)}</p>
                      </button>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400 mt-2 px-1">Nenhum produto encontrado.</p>)}
              </div>

              {/* Carrinho */}
              {carrinho.length > 0 && (
                <div className="space-y-2">
                  {carrinho.map(item => (
                    <div key={item.inventoryId} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.produto}</p>
                        <p className="text-xs text-slate-400">{formatCurrency(item.valorUnitario)} un.</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => updateQty(item.inventoryId, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-slate-500 hover:bg-gray-100 transition-colors">−</button>
                        <span className="w-5 text-center text-sm font-bold text-slate-900">{item.quantidade}</span>
                        <button onClick={() => updateQty(item.inventoryId, 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-slate-500 hover:bg-gray-100 transition-colors">+</button>
                      </div>
                      <p className="text-sm font-bold text-slate-900 w-16 text-right shrink-0">{formatCurrency(item.valorUnitario * item.quantidade)}</p>
                    </div>
                  ))}

                  {/* Subtotal + desconto */}
                  <div className="px-1 pt-1 border-t border-gray-100 space-y-1.5">
                    {showDesconto && (
                      <div className="flex items-center gap-2">
                        <div className="flex rounded-lg overflow-hidden border border-gray-200 shrink-0">
                          {['valor','percent'].map(t => (
                            <button key={t} onClick={() => setDesconto(p => ({ ...p, tipo: t }))}
                              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${desconto.tipo===t ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 hover:bg-gray-50'}`}>
                              {t === 'valor' ? 'R$' : '%'}
                            </button>
                          ))}
                        </div>
                        <input type="number" value={desconto.valor} onChange={e => setDesconto(p => ({ ...p, valor: e.target.value }))}
                          placeholder={desconto.tipo === 'percent' ? 'Ex: 10' : 'Ex: 20,00'} min="0"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50" />
                        <button onClick={() => { setShowDesconto(false); setDesconto({ tipo: 'valor', valor: '' }) }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-3.5 h-3.5 text-slate-400" /></button>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      {!showDesconto ? (
                        <button onClick={() => setShowDesconto(true)} className="text-xs text-slate-400 hover:text-amber-600 transition-colors">+ Desconto</button>
                      ) : descontoValor > 0 ? (
                        <p className="text-xs text-amber-600">Desconto: − {formatCurrency(descontoValor)}</p>
                      ) : <span />}
                      <p className="text-xl font-bold text-slate-900">{formatCurrency(total)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cliente */}
              {!showCliente ? (
                <button type="button" onClick={() => setShowCliente(true)}
                  className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                  <UserPlus className="w-3.5 h-3.5" /> Adicionar cliente (opcional)
                </button>
              ) : clienteSelecionado ? (
                <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">{clienteSelecionado.nome}</p>
                    {clienteSelecionado.whatsapp && <p className="text-xs text-indigo-400">{clienteSelecionado.whatsapp}</p>}
                  </div>
                  <button onClick={() => { setClienteSelecionado(null); setClienteQuery(''); setShowClienteForm(false) }}
                    className="p-1 hover:bg-indigo-100 rounded-lg transition-colors"><X className="w-4 h-4 text-indigo-400" /></button>
                </div>
              ) : showClienteForm ? (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Cadastrar cliente</p>
                  <input value={novoCliente.nome} onChange={e => setNovoCliente(p => ({ ...p, nome: e.target.value }))}
                    placeholder="Nome *" autoFocus className={inp} />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={novoCliente.whatsapp} onChange={e => setNovoCliente(p => ({ ...p, whatsapp: e.target.value }))}
                      placeholder="WhatsApp" inputMode="tel" className={inp} />
                    <input value={novoCliente.cpf} onChange={e => setNovoCliente(p => ({ ...p, cpf: e.target.value }))}
                      placeholder="CPF" inputMode="numeric" className={inp} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowClienteForm(false); setNovoCliente({ nome: '', whatsapp: '', cpf: '' }) }}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-slate-500 text-xs font-semibold hover:bg-gray-100 transition-colors">Cancelar</button>
                    <button onClick={() => {
                      if (!novoCliente.nome.trim()) return
                      setClienteSelecionado({ id: null, nome: novoCliente.nome.trim(), whatsapp: novoCliente.whatsapp.trim(), cpf: novoCliente.cpf.trim() })
                      setShowClienteForm(false)
                    }} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">Salvar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input value={clienteQuery} onChange={e => setClienteQuery(e.target.value)}
                      placeholder="Buscar cliente cadastrado..." autoFocus
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
                  </div>
                  {clienteQuery.length > 0 && (
                    <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {clienteSugeridos.slice(0, 5).map(c => (
                        <button key={c.id} type="button"
                          onMouseDown={e => { e.preventDefault(); setClienteSelecionado(c); setClienteQuery(''); setClienteSugeridos([]) }}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0">
                          <p className="text-sm font-semibold text-slate-900">{c.nome}</p>
                          {c.whatsapp && <p className="text-xs text-slate-400">{c.whatsapp}</p>}
                        </button>
                      ))}
                      <button type="button"
                        onMouseDown={e => { e.preventDefault(); setNovoCliente({ nome: clienteQuery, whatsapp: '', cpf: '' }); setShowClienteForm(true); setClienteQuery('') }}
                        className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors flex items-center gap-2 text-green-700">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span className="text-sm font-semibold">Cadastrar "{clienteQuery}"</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pagamento múltiplo */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Pagamento</p>
                {/* Botões para adicionar método */}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {PAGAMENTOS_VENDA.map(p => {
                    const ativo = !!pagamentos.find(x => x.method === p.key)
                    return (
                      <button key={p.key} type="button" onClick={() => ativo ? removePag(p.key) : addPagamento(p.key)}
                        className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${ativo
                          ? 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'bg-white text-slate-600 border-gray-200 hover:border-green-300'}`}>
                        {p.label}
                      </button>
                    )
                  })}
                </div>
                {/* Linhas de valor por método */}
                {pagamentos.length > 0 && (
                  <div className="space-y-1.5">
                    {pagamentos.map(p => (
                      <div key={p.method} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600 w-16 shrink-0">
                          {PAGAMENTOS_VENDA.find(x => x.key === p.method)?.label}
                        </span>
                        <input type="number" value={p.amount} min="0" step="0.01"
                          onChange={e => updatePagAmount(p.method, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-50" />
                        <button onClick={() => removePag(p.method)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    ))}
                    {restante > 0.01 && (
                      <p className="text-xs text-amber-600 px-1">Faltam {formatCurrency(restante)} para cobrir o total</p>
                    )}
                    {restante <= 0.01 && pagamentos.length > 0 && (
                      <p className="text-xs text-green-600 px-1">✓ Valor coberto</p>
                    )}
                  </div>
                )}
              </div>

              {erro && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{erro}</p>}
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-3 shrink-0 border-t border-gray-100">
              <button onClick={confirmar}
                disabled={loading || carrinho.length === 0 || pagamentos.length === 0 || restante > 0.01}
                className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold text-sm disabled:opacity-40 hover:bg-green-700 transition-colors">
                {loading ? 'Registrando...' : `Confirmar Venda${total > 0 ? ` · ${formatCurrency(total)}` : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── FORM DE PRODUTO ───────────────────────────────────────
function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    produto: '', quantidade: '', quantidadeMin: '', alertaAtivo: false,
    valorCompra: '', valorVenda: '', fornecedor: ''
  })

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-sm'

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Produto *</label>
        <input value={form.produto} onChange={e => f('produto', e.target.value)} placeholder="Ex: Filtro de óleo Fram" className={inp} autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Qtd. em estoque *</label>
          <input type="number" value={form.quantidade} onChange={e => f('quantidade', e.target.value)} placeholder="0" className={inp} min="0" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Fornecedor</label>
          <input value={form.fornecedor} onChange={e => f('fornecedor', e.target.value)} placeholder="Nome ou loja" className={inp} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Valor de Compra *</label>
          <input type="number" value={form.valorCompra} onChange={e => f('valorCompra', e.target.value)} placeholder="0,00" className={inp} min="0" step="0.01" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Valor de Venda *</label>
          <input type="number" value={form.valorVenda} onChange={e => f('valorVenda', e.target.value)} placeholder="0,00" className={inp} min="0" step="0.01" />
        </div>
      </div>

      {/* Alerta de estoque baixo */}
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Alerta de estoque baixo</span>
          </div>
          <button
            type="button"
            onClick={() => f('alertaAtivo', !form.alertaAtivo)}
            className={`w-10 h-6 rounded-full transition-colors relative ${form.alertaAtivo ? 'bg-amber-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.alertaAtivo ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
        {form.alertaAtivo && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Quantidade mínima</label>
            <input type="number" value={form.quantidadeMin} onChange={e => f('quantidadeMin', e.target.value)}
              placeholder="Ex: 2" className={inp} min="0" />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button
          onClick={() => {
            if (!form.produto || !form.quantidade || !form.valorCompra || !form.valorVenda) return showToast('Preencha todos os campos obrigatórios.')
            onSave(form)
          }}
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────
export default function Estoque() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [officeData, setOfficeData] = useState({})
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [showAlertOnly, setShowAlertOnly] = useState(false)
  const [showVenda, setShowVenda] = useState(false)
  const [sortBy, setSortBy] = useState('az') // az | qty_asc | qty_desc | val_asc | val_desc
  const [showSortMenu, setShowSortMenu] = useState(false)

  // Trava scroll do container principal quando modal está aberto
  useEffect(() => {
    const main = document.querySelector('main')
    if (showAdd || showVenda) {
      if (main) main.style.overflow = 'hidden'
    } else {
      if (main) main.style.overflow = ''
    }
    return () => { if (main) main.style.overflow = '' }
  }, [showAdd, showVenda])

  const SORT_OPTIONS = [
    { key: 'az',       label: 'A → Z' },
    { key: 'qty_asc',  label: 'Qtd ↑ (menor)' },
    { key: 'qty_desc', label: 'Qtd ↓ (maior)' },
    { key: 'val_asc',  label: 'Valor ↑ (menor)' },
    { key: 'val_desc', label: 'Valor ↓ (maior)' },
  ]

  const reload = async () => {
    const [inv, od] = await Promise.all([
      inventoryStorage.getAll(user.oficina),
      officeDataStorage.get(user.oficina),
    ])
    setItems(inv)
    setOfficeData(od || {})
  }
  useEffect(() => { reload() }, [])

  const sortFn = (a, b) => {
    if (sortBy === 'az')       return a.produto.localeCompare(b.produto)
    if (sortBy === 'qty_asc')  return a.quantidade - b.quantidade
    if (sortBy === 'qty_desc') return b.quantidade - a.quantidade
    if (sortBy === 'val_asc')  return a.valorVenda - b.valorVenda
    if (sortBy === 'val_desc') return b.valorVenda - a.valorVenda
    return 0
  }
  const filtered = items.filter(i => {
    const match = norm(i.produto).includes(norm(search)) ||
      norm(i.fornecedor).includes(norm(search))
    if (showAlertOnly) return match && i.alertaAtivo && i.quantidade <= i.quantidadeMin
    return match
  }).sort(sortFn)

  const emAlerta = items.filter(i => i.alertaAtivo && i.quantidade <= i.quantidadeMin)
  const totalInvestido = items.reduce((s, i) => s + i.valorCompra * i.quantidade, 0)

  const handleAdd = async (form) => {
    await inventoryStorage.create({ officeName: user.oficina, ...form })
    setShowAdd(false)
    await reload()
    showSaveCheck('Produto adicionado!')
  }

  const handleEdit = async (form) => {
    await inventoryStorage.update(editId, {
      produto: form.produto,
      quantidade: Number(form.quantidade),
      quantidadeMin: Number(form.quantidadeMin) || 0,
      alertaAtivo: form.alertaAtivo,
      valorCompra: Number(form.valorCompra),
      valorVenda: Number(form.valorVenda),
      fornecedor: form.fornecedor,
    })
    setEditId(null)
    await reload()
    showSaveCheck('Salvo!')
  }

  const handleDelete = async (id) => {
    if (!confirm('Remover este produto do estoque?')) return
    await inventoryStorage.remove(id)
    await reload()
  }

  const handleAjusteQtd = async (id, delta) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const novaQtd = Math.max(0, item.quantidade + delta)
    await inventoryStorage.update(id, { quantidade: novaQtd })
    await reload()
  }

  return (
    <div className="p-4 pb-36">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">{items.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Produtos</p>
        </div>
        <div className={`rounded-2xl border p-3 text-center ${emAlerta.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <p className={`text-2xl font-bold ${emAlerta.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>{emAlerta.length}</p>
          <p className={`text-xs mt-0.5 ${emAlerta.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>Em alerta</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
          <p className="text-sm font-bold text-slate-900">{formatCurrency(totalInvestido)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Investido</p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
          />
        </div>
        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(p => !p)}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Ordenar"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-600" />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-12 bg-white rounded-2xl border border-gray-100 shadow-xl z-20 overflow-hidden w-44">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => { setSortBy(opt.key); setShowSortMenu(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${sortBy === opt.key ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-gray-50'}`}>
                  {opt.label}
                  {sortBy === opt.key && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => printEstoque({ items: filtered, officeData, formatCurrencyFn: formatCurrency })}
          className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
          title="Relatório de estoque"
        >
          <Printer className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Filtro alerta */}
      {emAlerta.length > 0 && (
        <button
          onClick={() => setShowAlertOnly(!showAlertOnly)}
          className={`flex items-center gap-2 text-sm font-medium mb-4 px-3 py-1.5 rounded-xl transition-colors ${showAlertOnly ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
        >
          <AlertTriangle className="w-4 h-4" />
          {emAlerta.length} {emAlerta.length === 1 ? 'produto' : 'produtos'} com estoque baixo
          {showAlertOnly ? ' · Ver todos' : ''}
        </button>
      )}

      {/* Modal de adição — overlay com backdrop */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <p className="text-sm font-bold text-slate-900">Novo Produto</p>
              <button onClick={() => setShowAdd(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <ProductForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{items.length === 0 ? 'Estoque vazio' : 'Nenhum produto encontrado'}</p>
          <p className="text-sm mt-1">{items.length === 0 ? 'Adicione produtos com o botão +' : 'Tente outra busca'}</p>
        </div>
      ) : (
        <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-2.5">
          {filtered.map(item => {
            const emBaixoEstoque = item.alertaAtivo && item.quantidade <= item.quantidadeMin
            const isEditing = editId === item.id
            return (
              <div key={item.id} className={`bg-white rounded-2xl border p-4 ${emBaixoEstoque ? 'border-red-200' : 'border-gray-100'}`}>
                {isEditing ? (
                  <ProductForm
                    initial={{ ...item, quantidade: String(item.quantidade), quantidadeMin: String(item.quantidadeMin), valorCompra: String(item.valorCompra), valorVenda: String(item.valorVenda) }}
                    onSave={handleEdit}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">{item.produto}</p>
                          {emBaixoEstoque && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        </div>
                        {item.fornecedor && <p className="text-xs text-slate-400 mt-0.5">{item.fornecedor}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setEditId(item.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Controle de quantidade */}
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAjusteQtd(item.id, -1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-slate-600 font-bold hover:bg-gray-200 transition-colors">−</button>
                        <span className={`text-lg font-bold w-8 text-center ${emBaixoEstoque ? 'text-red-600' : 'text-slate-900'}`}>{item.quantidade}</span>
                        <button onClick={() => handleAjusteQtd(item.id, 1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-slate-600 font-bold hover:bg-gray-200 transition-colors">+</button>
                        <span className="text-xs text-slate-400">un.</span>
                      </div>

                      {/* Valores */}
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(item.valorVenda)}</p>
                        <p className="text-xs text-slate-400">custo: {formatCurrency(item.valorCompra)}</p>
                      </div>
                    </div>
                    {item.alertaAtivo && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Bell className="w-3 h-3" />Alerta em ≤ {item.quantidadeMin} un.
                      </p>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* FABs — ocultos quando qualquer modal está aberto */}
      {!showAdd && !showVenda && (
        <>
          <button
            onClick={() => setShowVenda(true)}
            className="fixed bottom-24 right-20 h-12 px-4 bg-green-600 rounded-full shadow-lg shadow-green-200 flex items-center gap-2 hover:bg-green-700 transition-all active:scale-95 z-40"
          >
            <ShoppingCart className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold">Vender</span>
          </button>
          <button
            onClick={() => { setShowAdd(true); setEditId(null) }}
            className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 z-40"
          >
            <Plus className="w-7 h-7 text-white" />
          </button>
        </>
      )}

      {/* Modal de Venda */}
      {showVenda && (
        <VendaModal
          inventory={items}
          officeData={officeData}
          onClose={() => setShowVenda(false)}
          onVendaCompleta={reload}
        />
      )}
    </div>
  )
}
