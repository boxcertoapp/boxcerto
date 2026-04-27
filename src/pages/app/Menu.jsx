import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, CreditCard, ChevronRight, Shield, Building2,
  Phone, Mail, MapPin, FileText, Camera, Check, Save,
  Users, Cake, Wrench, Calendar, ChevronDown, ChevronUp,
  UserX, MessageCircle, LifeBuoy
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  officeDataStorage, clientStorage, vehicleStorage, osStorage,
  formatCurrency, formatDate
} from '../../lib/storage'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const PAYMENT_METHODS_OPTIONS = [
  { key: 'dinheiro', label: 'Dinheiro' },
  { key: 'pix',      label: 'PIX' },
  { key: 'debito',   label: 'Cartão de Débito' },
  { key: 'credito',  label: 'Cartão de Crédito' },
]
const LIMIT = 10

// ── RELATÓRIOS ────────────────────────────────────────────
function AbaRelatorios({ user }) {
  const now = new Date()
  const [section, setSection] = useState(null)

  // Clientes
  const [allClients, setAllClients] = useState([])
  const [clientVehicles, setClientVehicles] = useState([])
  const [showMoreClientes, setShowMoreClientes] = useState(false)

  // Aniversariantes
  const [anivFilter, setAnivFilter] = useState(0)
  const [aniversariantes, setAniversariantes] = useState([])

  // Inativos
  const [inativosMeses, setInativosMeses] = useState(null)
  const [inativos, setInativos] = useState([])

  // Serviços do mês
  const [mesSrv, setMesSrv] = useState(now.getMonth())
  const [anoSrv, setAnoSrv] = useState(now.getFullYear())
  const [servicosMes, setServicosMes] = useState([])
  const [sortClientes, setSortClientes] = useState('az')
  const [sortServicos, setSortServicos] = useState('date_desc')

  // Load on section change
  useEffect(() => {
    if (section === 'clientes') {
      Promise.all([
        clientStorage.getAll(user.oficina),
        vehicleStorage.getAll(user.oficina),
      ]).then(([clients, vehicles]) => {
        setAllClients(clients.sort((a, b) => a.nome.localeCompare(b.nome)))
        setClientVehicles(vehicles)
      })
    }
  }, [section])

  useEffect(() => {
    if (section === 'aniversariantes') {
      clientStorage.getAniversariantes(user.oficina, anivFilter)
        .then(list => setAniversariantes(list.sort((a, b) => a.nome.localeCompare(b.nome))))
    }
  }, [section, anivFilter])

  useEffect(() => {
    if (section === 'inativos' && inativosMeses !== null) {
      clientStorage.getInativos(user.oficina, inativosMeses)
        .then(list => setInativos(list.sort((a, b) => a.nome.localeCompare(b.nome))))
    }
  }, [section, inativosMeses])

  useEffect(() => {
    if (section === 'servicos') {
      osStorage.getAll(user.oficina).then(allOS => {
        const delivered = allOS.filter(os => {
          if (os.status !== 'entregue' || !os.deliveredAt) return false
          const d = new Date(os.deliveredAt)
          return d.getMonth() === mesSrv && d.getFullYear() === anoSrv
        })
        setServicosMes(delivered)
      })
    }
  }, [section, mesSrv, anoSrv])

  const totalServicos = servicosMes.reduce((s, os) => s + (os.totals?.venda || 0), 0)
  const prevMes = () => { if (mesSrv === 0) { setMesSrv(11); setAnoSrv(anoSrv-1) } else setMesSrv(mesSrv-1) }
  const nextMes = () => { if (mesSrv === 11) { setMesSrv(0); setAnoSrv(anoSrv+1) } else setMesSrv(mesSrv+1) }
  const toggle = (key) => setSection(prev => prev === key ? null : key)

  const printClientes = (clients, vehicles, officeInfo) => {
    const rows = clients.map(c => {
      const veiculos = vehicles.filter(v => v.clientId === c.id)
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${c.nome}</td>
          <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${c.whatsapp || '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${c.cpf || '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${veiculos.map(v => v.placa).join(', ') || '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${[c.cidade, c.uf].filter(Boolean).join('/')  || '—'}</td>
        </tr>`
    }).join('')
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Relatório de Clientes</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;padding:32px;color:#1e293b}@media print{body{padding:16px}}</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e2e8f0">
    <div style="font-size:18px;font-weight:800">${officeInfo || 'Minha Oficina'}</div>
    <div style="text-align:right">
      <div style="background:#4f46e5;color:white;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block">Relatório de Clientes</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
  </div>
  <p style="font-size:12px;color:#64748b;margin-bottom:12px">${clients.length} clientes cadastrados</p>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr style="background:#f8fafc">
      <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Nome</th>
      <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">WhatsApp</th>
      <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">CPF</th>
      <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Placas</th>
      <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Cidade</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px">Gerado por BoxCerto &bull; boxcerto.com</div>
</body></html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Permita pop-ups'); return }
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  const printServicos = (osList, mesLabel, officeInfo) => {
    const rows = osList.map(os => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${os.vehicle?.placa || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${os.vehicle?.modelo || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${os.client?.nome || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px">${os.deliveredAt ? new Date(os.deliveredAt).toLocaleDateString('pt-BR') : '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:12px;text-align:right;font-weight:600">R$ ${(os.totals?.venda || 0).toFixed(2).replace('.', ',')}</td>
      </tr>`).join('')
    const total = osList.reduce((s, os) => s + (os.totals?.venda || 0), 0)
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Serviços do Mês</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;padding:32px;color:#1e293b}@media print{body{padding:16px}}</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e2e8f0">
    <div style="font-size:18px;font-weight:800">${officeInfo || 'Minha Oficina'}</div>
    <div style="text-align:right">
      <div style="background:#10b981;color:white;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block">Serviços do Mês</div>
      <div style="font-size:13px;color:#1e293b;font-weight:700;margin-top:4px">${mesLabel}</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <thead><tr style="background:#f8fafc">
      <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Placa</th>
      <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Modelo</th>
      <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Cliente</th>
      <th style="padding:8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Entrega</th>
      <th style="padding:8px;text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="background:#10b981;color:white;border-radius:12px;padding:14px 20px;display:flex;justify-content:space-between">
    <span style="font-weight:600">${osList.length} carros entregues</span>
    <span style="font-weight:800;font-size:18px">R$ ${total.toFixed(2).replace('.', ',')}</span>
  </div>
  <div style="text-align:center;color:#94a3b8;font-size:11px;margin-top:24px">Gerado por BoxCerto &bull; boxcerto.com</div>
</body></html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Permita pop-ups'); return }
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  const sortedClientes = [...allClients].sort((a, b) => sortClientes === 'az' ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome))
  const sortedServicos = [...servicosMes].sort((a, b) => {
    if (sortServicos === 'date_desc') return new Date(b.deliveredAt || b.createdAt) - new Date(a.deliveredAt || a.createdAt)
    if (sortServicos === 'date_asc') return new Date(a.deliveredAt || a.createdAt) - new Date(b.deliveredAt || b.createdAt)
    if (sortServicos === 'val_desc') return (b.totals?.venda || 0) - (a.totals?.venda || 0)
    if (sortServicos === 'val_asc') return (a.totals?.venda || 0) - (b.totals?.venda || 0)
    return 0
  })

  const clientesVisiveis = showMoreClientes ? sortedClientes : sortedClientes.slice(0, LIMIT)

  const SectionBtn = ({ id, icon: Icon, iconColor, title, subtitle }) => (
    <button onClick={() => toggle(id)} className="w-full flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      {section === id ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
    </button>
  )

  return (
    <div className="space-y-3">
      {/* ── CLIENTES ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionBtn id="clientes" icon={Users} iconColor="bg-indigo-50 text-indigo-600"
          title="Relatório de Clientes" subtitle="Todos os clientes cadastrados" />
        {section === 'clientes' && (
          <div className="border-t border-gray-50 p-4">
            {allClients.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-6">Nenhum cliente cadastrado</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400 font-medium">{allClients.length} clientes</p>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
                      {[{ key: 'az', label: 'A→Z' }, { key: 'za', label: 'Z→A' }].map(s => (
                        <button key={s.key} onClick={() => setSortClientes(s.key)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${sortClientes === s.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => printClientes(sortedClientes, clientVehicles, user.oficina)}
                      className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {clientesVisiveis.map(c => {
                    const veiculos = clientVehicles.filter(v => v.clientId === c.id)
                    return (
                      <div key={c.id} className="rounded-xl bg-gray-50 p-3">
                        <p className="font-semibold text-slate-900 text-sm">{c.nome}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {c.whatsapp && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.whatsapp}</span>}
                          {c.cpf && <span className="text-xs text-slate-500">CPF: {c.cpf}</span>}
                          {c.dataNascimento && <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(c.dataNascimento)}</span>}
                        </div>
                        {(c.cidade || c.endereco) && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {[c.endereco, c.numero, c.bairro, c.cidade, c.uf].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {veiculos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {veiculos.map(v => (
                              <span key={v.id} className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded font-bold plate-mercosul">{v.placa}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {allClients.length > LIMIT && (
                  <button onClick={() => setShowMoreClientes(p => !p)}
                    className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 text-sm text-slate-500 font-medium hover:bg-gray-50 transition-colors">
                    {showMoreClientes ? 'Ver menos' : `Ver mais ${allClients.length - LIMIT} clientes`}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── ANIVERSARIANTES ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionBtn id="aniversariantes" icon={Cake} iconColor="bg-pink-50 text-pink-500"
          title="Aniversariantes" subtitle="Clientes fazendo aniversário" />
        {section === 'aniversariantes' && (
          <div className="border-t border-gray-50 p-4">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4">
              {[{ label: 'Hoje', dias: 0 }, { label: 'Próx. 7 dias', dias: 7 }, { label: 'Próx. 30 dias', dias: 30 }].map(f => (
                <button key={f.dias} onClick={() => setAnivFilter(f.dias)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${anivFilter === f.dias ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            {aniversariantes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Cake className="w-10 h-10 mx-auto mb-2 opacity-25" />
                <p className="text-sm">Nenhum aniversariante {anivFilter === 0 ? 'hoje' : `nos próximos ${anivFilter} dias`}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-medium">{aniversariantes.length} aniversariante{aniversariantes.length > 1 ? 's' : ''}</p>
                {aniversariantes.map(c => {
                  const nascimento = c.dataNascimento ? new Date(c.dataNascimento + 'T12:00:00') : null
                  const idade = nascimento ? new Date().getFullYear() - nascimento.getFullYear() : null
                  return (
                    <div key={c.id} className="flex items-center gap-3 bg-pink-50 rounded-xl p-3">
                      <div className="w-9 h-9 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
                        <Cake className="w-4 h-4 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{c.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.whatsapp && <span className="text-xs text-slate-500">{c.whatsapp}</span>}
                          {idade !== null && <span className="text-xs text-pink-600 font-medium">{idade} anos</span>}
                        </div>
                      </div>
                      {c.whatsapp && (
                        <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'').slice(-11)}?text=${encodeURIComponent(`Feliz aniversário, ${c.nome.split(' ')[0]}! 🎉 A equipe da oficina deseja um dia especial pra você!`)}`}
                          target="_blank" rel="noreferrer"
                          className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 hover:bg-green-600 transition-colors">
                          WPP 🎂
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CLIENTES INATIVOS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionBtn id="inativos" icon={UserX} iconColor="bg-orange-50 text-orange-500"
          title="Clientes Inativos" subtitle="Sem visita há algum tempo" />
        {section === 'inativos' && (
          <div className="border-t border-gray-50 p-4">
            {inativosMeses === null ? (
              <>
                <p className="text-sm text-slate-500 text-center mb-4">Selecione o período de inatividade:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: '3 meses', meses: 3 }, { label: '6 meses', meses: 6 }, { label: '9 meses', meses: 9 }, { label: '+ 1 ano', meses: 12 }].map(op => (
                    <button key={op.meses} onClick={() => setInativosMeses(op.meses)}
                      className="py-3 rounded-xl border-2 border-orange-100 bg-orange-50 text-orange-700 font-semibold text-sm hover:bg-orange-100 transition-colors">
                      {op.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400 font-medium">{inativos.length} clientes sem visita há +{inativosMeses === 12 ? '1 ano' : `${inativosMeses} meses`}</p>
                  <button onClick={() => setInativosMeses(null)} className="text-xs text-indigo-600 font-medium hover:underline">Alterar período</button>
                </div>
                {inativos.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <UserX className="w-10 h-10 mx-auto mb-2 opacity-25" />
                    <p className="text-sm">Nenhum cliente inativo neste período</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inativos.map(c => (
                      <div key={c.id} className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
                        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                          <UserX className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{c.nome}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {c.ultimaVisita ? `Última visita: ${formatDate(c.ultimaVisita)}` : 'Nunca visitou'}
                          </p>
                        </div>
                        {c.whatsapp && (
                          <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'').slice(-11)}?text=${encodeURIComponent(`Olá ${c.nome.split(' ')[0]}! 👋 Sentimos sua falta aqui na oficina. Tem algo que possamos fazer pelo seu veículo? Estamos à disposição!`)}`}
                            target="_blank" rel="noreferrer"
                            className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 hover:bg-green-600 transition-colors flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> WPP
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── SERVIÇOS DO MÊS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SectionBtn id="servicos" icon={Wrench} iconColor="bg-green-50 text-green-600"
          title="Serviços do Mês" subtitle="Carros entregues por período" />
        {section === 'servicos' && (
          <div className="border-t border-gray-50 p-4">
            <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-xl p-3">
              <button onClick={prevMes} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors text-slate-600 text-lg">‹</button>
              <span className="text-sm font-bold text-slate-900">{MESES[mesSrv]} {anoSrv}</span>
              <button onClick={nextMes} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors text-slate-600 text-lg">›</button>
            </div>
            {servicosMes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Wrench className="w-10 h-10 mx-auto mb-2 opacity-25" />
                <p className="text-sm">Nenhum carro entregue em {MESES[mesSrv]}</p>
              </div>
            ) : (
              <>
                <div className="bg-green-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-700 font-medium">{servicosMes.length} carro{servicosMes.length > 1 ? 's' : ''} entregue{servicosMes.length > 1 ? 's' : ''}</p>
                    <p className="text-xs text-green-600 mt-0.5">Total faturado</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-green-700">{formatCurrency(totalServicos)}</p>
                    <button onClick={() => printServicos(sortedServicos, `${MESES[mesSrv]} ${anoSrv}`, user.oficina)}
                      className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors shrink-0">
                      <FileText className="w-3.5 h-3.5 text-green-700" />
                    </button>
                  </div>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5 mb-3">
                  {[
                    { key: 'date_desc', label: 'Mais recente' },
                    { key: 'date_asc', label: 'Mais antigo' },
                    { key: 'val_desc', label: 'Maior valor' },
                    { key: 'val_asc', label: 'Menor valor' },
                  ].map(s => (
                    <button key={s.key} onClick={() => setSortServicos(s.key)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${sortServicos === s.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {sortedServicos.map(os => (
                    <div key={os.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                        <span className="text-white text-xs font-bold plate-mercosul">{os.vehicle?.placa}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{os.vehicle?.modelo}</p>
                        <p className="text-xs text-slate-400 truncate">{os.client?.nome} · {os.deliveredAt ? formatDate(os.deliveredAt) : ''}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 shrink-0">{formatCurrency(os.totals?.venda || 0)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function Menu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const logoRef = useRef()

  const [officeData, setOfficeData] = useState({ nome: '', endereco: '', telefone: '', cnpj: '', logo: '' })
  const [paymentDefaults, setPaymentDefaults] = useState(
    () => JSON.parse(localStorage.getItem('boxcerto_payment_defaults') || '["dinheiro","pix"]')
  )
  const [defaultDescontoTipo, setDefaultDescontoTipo] = useState(
    () => localStorage.getItem('boxcerto_desconto_tipo') || 'valor'
  )
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('relatorios')

  useEffect(() => {
    if (user?.oficina) {
      officeDataStorage.get(user.oficina).then(data => {
        setOfficeData({
          nome: data?.nome || user.oficina || '',
          endereco: data?.endereco || '',
          telefone: data?.telefone || user.whatsapp || '',
          cnpj: data?.cnpj || '',
          logo: data?.logo || '',
        })
      })
    }
  }, [user])

  const handleSave = async () => {
    await officeDataStorage.save(user.oficina, officeData)
    localStorage.setItem('boxcerto_payment_defaults', JSON.stringify(paymentDefaults))
    localStorage.setItem('boxcerto_desconto_tipo', defaultDescontoTipo)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const togglePaymentDefault = (key) => {
    setPaymentDefaults(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 1024 * 1024) return alert('A imagem deve ter no máximo 1MB.')
    const reader = new FileReader()
    reader.onload = (ev) => setOfficeData({ ...officeData, logo: ev.target.result })
    reader.readAsDataURL(file)
  }

  const handleLogout = () => { logout(); navigate('/') }
  const planLabel = user?.plan === 'annual' ? 'Plano Anual — R$418,80/ano' : 'Plano Mensal — R$47,90/mês'
  const isTrial = user?.status === 'trial'

  const TABS = [
    { key: 'relatorios', label: 'Relatórios' },
    { key: 'oficina', label: 'Oficina' },
    { key: 'conta', label: 'Minha Conta' },
    { key: 'suporte', label: 'Suporte' },
  ]

  return (
    <div className="p-4 pb-36 space-y-4">
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RELATÓRIOS ── */}
      {activeTab === 'relatorios' && <AbaRelatorios user={user} />}

      {/* ── DADOS DA OFICINA ── */}
      {activeTab === 'oficina' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">Esses dados aparecem nos PDFs de orçamento enviados aos clientes.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Logotipo (máx. 1MB)</label>
            <div className="flex items-center gap-4">
              <div onClick={() => logoRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden shrink-0">
                {officeData.logo ? <img src={officeData.logo} alt="Logo" className="w-full h-full object-contain" /> : <Camera className="w-8 h-8 text-slate-300" />}
              </div>
              <div>
                <button onClick={() => logoRef.current?.click()} className="text-indigo-600 text-sm font-semibold hover:underline block mb-1">
                  {officeData.logo ? 'Trocar logo' : 'Adicionar logo'}
                </button>
                {officeData.logo && <button onClick={() => setOfficeData({ ...officeData, logo: '' })} className="text-red-400 text-xs hover:underline">Remover</button>}
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, até 1MB</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>
          {[
            { key: 'nome', label: 'Nome da Oficina', icon: <Building2 className="w-4 h-4" />, placeholder: 'Auto Mecânica João Silva' },
            { key: 'cnpj', label: 'CNPJ (opcional)', icon: <FileText className="w-4 h-4" />, placeholder: '00.000.000/0001-00' },
            { key: 'telefone', label: 'Telefone / WhatsApp', icon: <Phone className="w-4 h-4" />, placeholder: '(51) 99999-9999' },
            { key: 'endereco', label: 'Endereço completo', icon: <MapPin className="w-4 h-4" />, placeholder: 'Rua das Flores, 123 — Porto Alegre, RS' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{f.icon}</div>
                <input type="text" value={officeData[f.key]}
                  onChange={e => setOfficeData({ ...officeData, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
              </div>
            </div>
          ))}
          {/* Pagamentos padrão — seção colapsível */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPaymentSection(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">Padrões de desconto e pagamento</p>
                <p className="text-xs text-slate-400">Pré-selecionados ao abrir cada OS</p>
              </div>
              {showPaymentSection
                ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
            </button>
            {showPaymentSection && (
              <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100">
                {/* Tipo de desconto padrão */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Tipo de desconto padrão</label>
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
                    {[{ key: 'valor', label: 'R$' }, { key: 'percent', label: '%' }].map(op => (
                      <button
                        key={op.key}
                        type="button"
                        onClick={() => setDefaultDescontoTipo(op.key)}
                        className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${defaultDescontoTipo === op.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Formas de pagamento */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Formas de pagamento pré-selecionadas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS_OPTIONS.map(m => {
                      const checked = paymentDefaults.includes(m.key)
                      return (
                        <label key={m.key}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${checked ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                          <input type="checkbox" checked={checked} onChange={() => togglePaymentDefault(m.key)}
                            className="w-3.5 h-3.5 accent-indigo-600" />
                          <span className={`text-xs font-medium ${checked ? 'text-indigo-700' : 'text-slate-600'}`}>{m.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {saved ? <><Check className="w-5 h-5" /> Salvo!</> : <><Save className="w-5 h-5" /> Salvar dados</>}
          </button>
        </div>
      )}

      {/* ── MINHA CONTA ── */}
      {activeTab === 'conta' && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-indigo-600 font-bold text-xl">{(user?.responsavel || user?.oficina || 'B')[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">{user?.responsavel || 'Mecânico'}</p>
                <p className="text-slate-400 text-sm">{user?.oficina}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[{ icon: <Mail className="w-4 h-4" />, label: 'E-mail', value: user?.email }, { icon: <Phone className="w-4 h-4" />, label: 'WhatsApp', value: user?.whatsapp }].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-sm text-slate-700 font-medium">{item.value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assinatura</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {isTrial ? 'Período gratuito (7 dias)' : user?.plan ? planLabel : 'Sem plano ativo'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${user?.status === 'active' ? 'bg-green-500' : isTrial ? 'bg-amber-400' : 'bg-red-400'}`} />
                    <span className="text-xs text-slate-400">{user?.status === 'active' ? 'Ativo' : isTrial ? 'Trial gratuito' : 'Pendente'}</span>
                  </div>
                </div>
              </div>
              {isTrial && (
                <div className="bg-indigo-50 rounded-xl p-4 mb-3">
                  <p className="text-sm text-indigo-700 font-medium mb-2">Assine e continue usando após o trial</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => navigate('/assinar')} className="bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold py-2 rounded-lg hover:bg-indigo-50 transition-colors">R$47,90/mês</button>
                    <button onClick={() => navigate('/assinar')} className="bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors">R$34,90/mês ⭐</button>
                  </div>
                </div>
              )}
              {!isTrial && (
                <button onClick={() => window.open('https://billing.stripe.com/p/login/test_00g00000000000', '_blank')}
                  className="w-full flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Gerenciar assinatura</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-red-100 text-red-500 font-semibold hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />Sair da conta
          </button>
          <p className="text-center text-xs text-slate-300">BoxCerto v1.0.0</p>
        </>
      )}

      {/* ── SUPORTE ── */}
      {activeTab === 'suporte' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <LifeBuoy className="w-5 h-5 text-indigo-200" />
              <p className="text-indigo-200 text-sm font-medium">Central de Suporte</p>
            </div>
            <h2 className="text-lg font-extrabold mb-1">Precisa de ajuda?</h2>
            <p className="text-indigo-200 text-sm">Guias, perguntas frequentes e atendimento direto.</p>
          </div>
          {/* Ação principal — ticket */}
          <button onClick={() => navigate('/app/suporte')}
            className="w-full flex items-center gap-3 bg-indigo-600 rounded-2xl p-4 hover:bg-indigo-700 transition-colors">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Acessar Central de Suporte</p>
              <p className="text-xs text-indigo-200">Guias, FAQ e abertura de chamados</p>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-300" />
          </button>

          {/* WhatsApp — secundário e discreto */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-slate-400 mb-2">Prefere falar diretamente?</p>
            <a href="https://wa.me/5553997065725?text=Ol%C3%A1%2C%20tenho%20uma%20urg%C3%AAncia%20no%20BoxCerto."
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors">
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">WhatsApp (53) 99706-5725</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
