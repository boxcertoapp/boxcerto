import { useState, useEffect } from 'react'
import {
  Package, Plus, Trash2, X, AlertTriangle,
  BarChart2, Search, ChevronDown, ChevronUp,
  Bell, BellOff, Printer, Edit2, Check
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { inventoryStorage, formatCurrency, officeDataStorage } from '../../lib/storage'

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
  if (!win) { alert('Permita pop-ups'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
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
            if (!form.produto || !form.quantidade || !form.valorCompra || !form.valorVenda) return alert('Preencha os campos obrigatórios.')
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

  const reload = async () => {
    const [inv, od] = await Promise.all([
      inventoryStorage.getAll(user.oficina),
      officeDataStorage.get(user.oficina),
    ])
    setItems(inv)
    setOfficeData(od || {})
  }
  useEffect(() => { reload() }, [])

  const filtered = items.filter(i => {
    const match = i.produto.toLowerCase().includes(search.toLowerCase()) ||
      (i.fornecedor || '').toLowerCase().includes(search.toLowerCase())
    if (showAlertOnly) return match && i.alertaAtivo && i.quantidade <= i.quantidadeMin
    return match
  }).sort((a, b) => a.produto.localeCompare(b.produto))

  const emAlerta = items.filter(i => i.alertaAtivo && i.quantidade <= i.quantidadeMin)
  const totalInvestido = items.reduce((s, i) => s + i.valorCompra * i.quantidade, 0)

  const handleAdd = async (form) => {
    await inventoryStorage.create({ officeName: user.oficina, ...form })
    setShowAdd(false)
    await reload()
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

      {/* Formulário de adição */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-4 mb-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900 mb-3">Novo Produto</p>
          <ProductForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
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
        <div className="space-y-2">
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

      {/* FAB */}
      <button
        onClick={() => { setShowAdd(true); setEditId(null) }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 z-40"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>
    </div>
  )
}
