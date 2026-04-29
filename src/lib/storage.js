// ============================================================
// CAMADA DE DADOS — Supabase
// ============================================================
import { supabase } from './supabase'

// Helper: obtém o ID do usuário autenticado atual (usa sessão em cache, sem network)
const getCurrentUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

// ── ADMIN ─────────────────────────────────────────────────
export const ADMIN_EMAIL = 'rogerioknfilho@gmail.com'

// ── MAPPERS (DB snake_case → JS camelCase) ────────────────
const mapClient = (c) => !c ? null : ({
  id: c.id,
  nome: c.nome,
  whatsapp: c.whatsapp || '',
  cpf: c.cpf || '',
  dataNascimento: c.data_nascimento || '',
  cep: c.cep || '',
  endereco: c.endereco || '',
  numero: c.numero || '',
  bairro: c.bairro || '',
  cidade: c.cidade || '',
  uf: c.uf || '',
  createdAt: c.created_at,
})

const mapVehicle = (v) => !v ? null : ({
  id: v.id,
  clientId: v.client_id,
  placa: v.placa,
  modelo: v.modelo,
  createdAt: v.created_at,
})

const mapOS = (os) => !os ? null : ({
  id: os.id,
  vehicleId: os.vehicle_id,
  status: os.status,
  km: os.km || '',
  observacoes: os.observacoes || '',
  agendadoPara: os.agendado_para,
  tecnico: os.tecnico || '',
  deliveredAt: os.delivered_at,
  deliveryNotes: os.delivery_notes || '',
  payments: os.payments || [],
  desconto: os.desconto || { tipo: 'valor', valor: 0 },
  createdAt: os.created_at,
  updatedAt: os.updated_at,
  aprovacaoToken: os.aprovacao_token || null,
  aprovacaoStatus: os.aprovacao_status || 'pendente',
  aprovadoEm: os.aprovado_em || null,
})

const mapItem = (i) => !i ? null : ({
  id: i.id,
  osId: i.os_id,
  descricao: i.descricao,
  custo: Number(i.custo),
  venda: Number(i.venda),
  garantia: i.garantia || '',
  inventoryId: i.inventory_id,
  createdAt: i.created_at,
})

const mapExpense = (e) => !e ? null : ({
  id: e.id,
  descricao: e.descricao,
  valor: Number(e.valor),
  mes: e.mes,
  ano: e.ano,
  createdAt: e.created_at,
})

const mapInventory = (i) => !i ? null : ({
  id: i.id,
  produto: i.produto,
  quantidade: Number(i.quantidade),
  quantidadeMin: Number(i.quantidade_min),
  alertaAtivo: i.alerta_ativo,
  valorCompra: Number(i.valor_compra),
  valorVenda: Number(i.valor_venda),
  fornecedor: i.fornecedor || '',
  createdAt: i.created_at,
})

// ── CLIENTES ──────────────────────────────────────────────
export const clientStorage = {
  getAll: async (_officeName) => {
    const { data } = await supabase.from('clients').select('*').order('nome')
    return (data || []).map(mapClient)
  },

  create: async ({ officeName: _o, nome, whatsapp, cpf = '', dataNascimento = '',
    cep = '', endereco = '', numero = '', bairro = '', cidade = '', uf = '' }) => {
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase.from('clients').insert({
      user_id, nome, whatsapp, cpf, data_nascimento: dataNascimento,
      cep, endereco, numero, bairro, cidade, uf,
    }).select().single()
    if (error) throw new Error(error.message)
    return mapClient(data)
  },

  update: async (id, upd) => {
    const mapped = {}
    if (upd.nome !== undefined) mapped.nome = upd.nome
    if (upd.whatsapp !== undefined) mapped.whatsapp = upd.whatsapp
    if (upd.cpf !== undefined) mapped.cpf = upd.cpf
    if (upd.dataNascimento !== undefined) mapped.data_nascimento = upd.dataNascimento
    if (upd.cep !== undefined) mapped.cep = upd.cep
    if (upd.endereco !== undefined) mapped.endereco = upd.endereco
    if (upd.numero !== undefined) mapped.numero = upd.numero
    if (upd.bairro !== undefined) mapped.bairro = upd.bairro
    if (upd.cidade !== undefined) mapped.cidade = upd.cidade
    if (upd.uf !== undefined) mapped.uf = upd.uf
    await supabase.from('clients').update(mapped).eq('id', id)
  },

  search: async (_officeName, query) => {
    const q = query.toLowerCase()
    const qDigits = q.replace(/\D/g, '') // só dígitos para busca por CPF/telefone
    const { data } = await supabase.from('clients').select('*')
    return (data || [])
      .filter(c =>
        c.nome?.toLowerCase().includes(q) ||
        (qDigits.length > 0 && (c.cpf || '').replace(/\D/g, '').includes(qDigits)) ||
        (qDigits.length > 0 && (c.whatsapp || '').replace(/\D/g, '').includes(qDigits))
      )
      .map(mapClient)
  },

  getAniversariantes: async (_officeName, dias) => {
    const { data } = await supabase.from('clients').select('*').not('data_nascimento', 'is', null).neq('data_nascimento', '')
    if (!data) return []
    const today = new Date()
    return data.filter(c => {
      if (!c.data_nascimento) return false
      const parts = c.data_nascimento.split('-').map(Number)
      const mes = parts[1]; const dia = parts[2]
      for (let i = 0; i <= dias; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() + i)
        if (d.getMonth() + 1 === mes && d.getDate() === dia) return true
      }
      return false
    }).map(mapClient)
  },

  getInativos: async (_officeName, meses) => {
    const limite = new Date()
    limite.setMonth(limite.getMonth() - meses)
    const [{ data: clients }, { data: vehicles }, { data: orders }] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('vehicles').select('id, client_id'),
      supabase.from('service_orders').select('id, vehicle_id, created_at'),
    ])
    if (!clients) return []
    return clients.filter(c => {
      const veiculos = (vehicles || []).filter(v => v.client_id === c.id)
      if (veiculos.length === 0) return true
      const ultimaOS = (orders || [])
        .filter(os => veiculos.some(v => v.id === os.vehicle_id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      if (!ultimaOS) return true
      return new Date(ultimaOS.created_at) < limite
    }).map(c => {
      const veiculos = (vehicles || []).filter(v => v.client_id === c.id)
      const ultimaOS = (orders || [])
        .filter(os => veiculos.some(v => v.id === os.vehicle_id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      return { ...mapClient(c), ultimaVisita: ultimaOS?.created_at || null }
    })
  },
}

// ── VEÍCULOS ──────────────────────────────────────────────
export const vehicleStorage = {
  getAll: async (_officeName) => {
    const { data } = await supabase.from('vehicles').select('*').order('placa')
    return (data || []).map(mapVehicle)
  },

  getByPlate: async (_officeName, placa) => {
    const { data } = await supabase.from('vehicles').select('*').ilike('placa', placa).maybeSingle()
    return mapVehicle(data)
  },

  create: async ({ officeName: _o, clientId, placa, modelo }) => {
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase.from('vehicles').insert({
      user_id, client_id: clientId, placa: placa.toUpperCase(), modelo,
    }).select().single()
    if (error) throw new Error(error.message)
    return mapVehicle(data)
  },

  update: async (id, upd) => {
    const mapped = {}
    if (upd.modelo !== undefined) mapped.modelo = upd.modelo
    if (upd.placa !== undefined) mapped.placa = upd.placa.toUpperCase()
    if (Object.keys(mapped).length > 0)
      await supabase.from('vehicles').update(mapped).eq('id', id)
  },

  search: async (_officeName, query) => {
    const q = query.toLowerCase()
    const qDigits = q.replace(/\D/g, '') // só dígitos para busca por CPF
    const { data } = await supabase
      .from('vehicles')
      .select('*, clients(*)')
    return (data || [])
      .filter(v =>
        v.placa?.toLowerCase().includes(q) ||
        v.modelo?.toLowerCase().includes(q) ||
        v.clients?.nome?.toLowerCase().includes(q) ||
        (qDigits.length > 0 && (v.clients?.cpf || '').replace(/\D/g, '').includes(qDigits))
      )
      .map(v => ({ ...mapVehicle(v), client: mapClient(v.clients) }))
  },
}

// ── ORDENS DE SERVIÇO ──────────────────────────────────────
export const osStorage = {
  // Retorna todas as OS com vehicle e client embutidos
  getAll: async (_officeName) => {
    const { data } = await supabase
      .from('service_orders')
      .select(`*, vehicles(*, clients(*)), service_items(*)`)
      .order('created_at', { ascending: false })
    if (!data) return []
    return data.map(os => {
      const items = (os.service_items || []).map(mapItem)
      const totals = itemStorage.totals(items)
      return {
        ...mapOS(os),
        vehicle: os.vehicles ? { ...mapVehicle(os.vehicles), client: mapClient(os.vehicles.clients) } : null,
        client: os.vehicles?.clients ? mapClient(os.vehicles.clients) : null,
        totals,
      }
    })
  },

  getByVehicle: async (vehicleId) => {
    const { data } = await supabase
      .from('service_orders')
      .select('*, service_items(*)')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
    if (!data) return []
    return data.map(os => {
      const items = (os.service_items || []).map(mapItem)
      return { ...mapOS(os), items, totals: itemStorage.totals(items) }
    })
  },

  getById: async (id) => {
    const { data } = await supabase.from('service_orders').select('*').eq('id', id).maybeSingle()
    return mapOS(data)
  },

  create: async ({ officeName: _o, vehicleId, observacoes = '', km = '', agendadoPara = null }) => {
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase.from('service_orders').insert({
      user_id,
      vehicle_id: vehicleId,
      status: 'orcamento',
      observacoes, km,
      agendado_para: agendadoPara,
      payments: [],
      desconto: { tipo: 'valor', valor: 0 },
    }).select().single()
    if (error) throw new Error(error.message)
    return mapOS(data)
  },

  updateStatus: async (id, status) => {
    await supabase.from('service_orders').update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'entregue' ? { delivered_at: new Date().toISOString() } : {}),
    }).eq('id', id)
  },

  updateObservacoes: async (id, observacoes) => {
    await supabase.from('service_orders').update({ observacoes, updated_at: new Date().toISOString() }).eq('id', id)
  },

  updateKm: async (id, km) => {
    await supabase.from('service_orders').update({ km, updated_at: new Date().toISOString() }).eq('id', id)
  },

  confirmarChegada: async (id) => {
    await supabase.from('service_orders').update({
      agendado_para: null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
  },

  updateTecnico: async (id, tecnico) => {
    await supabase.from('service_orders').update({
      tecnico: tecnico || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
  },

  deliverOS: async (id, { deliveredAt, deliveryNotes, payments, desconto }) => {
    await supabase.from('service_orders').update({
      status: 'entregue',
      updated_at: new Date().toISOString(),
      delivered_at: deliveredAt || new Date().toISOString(),
      delivery_notes: deliveryNotes || '',
      payments: payments || [],
      desconto: desconto || { tipo: 'valor', valor: 0 },
    }).eq('id', id)
  },

  revertDelivery: async (id) => {
    await supabase.from('service_orders').update({
      status: 'pronto',
      updated_at: new Date().toISOString(),
      delivered_at: null,
      delivery_notes: '',
      payments: [],
      desconto: { tipo: 'valor', valor: 0 },
    }).eq('id', id)
  },

  delete: async (id) => {
    await supabase.from('service_items').delete().eq('os_id', id)
    await supabase.from('service_orders').delete().eq('id', id)
  },

  // Gera token de aprovação e salva na OS
  generateApprovalToken: async (id) => {
    const token = crypto.randomUUID()
    const { error } = await supabase.from('service_orders').update({
      aprovacao_token: token,
      aprovacao_status: 'pendente',
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw new Error(error.message)
    return token
  },

  // Busca OS pelo token (público — usa RPC SECURITY DEFINER)
  getByToken: async (token) => {
    const { data, error } = await supabase.rpc('get_os_by_token', { p_token: token })
    if (error || !data) return null
    return data
  },

  // Aprova OS pelo token (público)
  approveByToken: async (token) => {
    const { data, error } = await supabase.rpc('approve_os_by_token', { p_token: token })
    if (error) throw new Error(error.message)
    return data
  },
}

// ── ITENS DA OS ───────────────────────────────────────────
export const itemStorage = {
  getByOS: async (osId) => {
    const { data } = await supabase.from('service_items').select('*').eq('os_id', osId).order('created_at')
    return (data || []).map(mapItem)
  },

  add: async ({ osId, descricao, custo, venda, garantia = '', inventoryId = null }) => {
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase.from('service_items').insert({
      user_id,
      os_id: osId, descricao,
      custo: Number(custo), venda: Number(venda),
      garantia, inventory_id: inventoryId,
    }).select().single()
    if (error) throw new Error(error.message)
    return mapItem(data)
  },

  remove: async (id) => {
    await supabase.from('service_items').delete().eq('id', id)
  },

  update: async (id, { descricao, custo, venda, garantia }) => {
    await supabase.from('service_items').update({
      descricao, custo: Number(custo), venda: Number(venda), garantia: garantia || '',
    }).eq('id', id)
  },

  // Síncrono — recebe array de items já carregados
  totals: (items = []) => ({
    venda:  items.reduce((s, i) => s + (i.venda || 0), 0),
    custo:  items.reduce((s, i) => s + (i.custo || 0), 0),
    lucro:  items.reduce((s, i) => s + ((i.venda || 0) - (i.custo || 0)), 0),
  }),

  totalComDesconto: (items, desconto) => {
    const { venda } = itemStorage.totals(items)
    if (!desconto || !desconto.valor) return venda
    if (desconto.tipo === 'percent') return venda * (1 - desconto.valor / 100)
    return Math.max(0, venda - desconto.valor)
  },
}

// ── DESPESAS ──────────────────────────────────────────────
export const expenseStorage = {
  getByMonth: async (_officeName, mes, ano) => {
    const { data } = await supabase.from('expenses').select('*').eq('mes', mes).eq('ano', ano)
    return (data || []).map(mapExpense)
  },

  add: async ({ officeName: _o, descricao, valor, mes, ano }) => {
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase.from('expenses')
      .insert({ user_id, descricao, valor: Number(valor), mes, ano }).select().single()
    if (error) throw new Error(error.message)
    return mapExpense(data)
  },

  remove: async (id) => {
    await supabase.from('expenses').delete().eq('id', id)
  },
}

// ── ESTOQUE ───────────────────────────────────────────────
export const inventoryStorage = {
  getAll: async (_officeName) => {
    const { data } = await supabase.from('inventory').select('*').order('produto')
    return (data || []).map(mapInventory)
  },

  create: async ({ officeName: _o, produto, quantidade, quantidadeMin = 0,
    alertaAtivo = false, valorCompra, valorVenda, fornecedor = '' }) => {
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase.from('inventory').insert({
      user_id, produto, quantidade: Number(quantidade),
      quantidade_min: Number(quantidadeMin),
      alerta_ativo: alertaAtivo,
      valor_compra: Number(valorCompra),
      valor_venda: Number(valorVenda),
      fornecedor,
    }).select().single()
    if (error) throw new Error(error.message)
    return mapInventory(data)
  },

  update: async (id, upd) => {
    const mapped = {}
    if (upd.produto !== undefined) mapped.produto = upd.produto
    if (upd.quantidade !== undefined) mapped.quantidade = Number(upd.quantidade)
    if (upd.quantidadeMin !== undefined) mapped.quantidade_min = Number(upd.quantidadeMin)
    if (upd.alertaAtivo !== undefined) mapped.alerta_ativo = upd.alertaAtivo
    if (upd.valorCompra !== undefined) mapped.valor_compra = Number(upd.valorCompra)
    if (upd.valorVenda !== undefined) mapped.valor_venda = Number(upd.valorVenda)
    if (upd.fornecedor !== undefined) mapped.fornecedor = upd.fornecedor
    await supabase.from('inventory').update(mapped).eq('id', id)
  },

  remove: async (id) => {
    await supabase.from('inventory').delete().eq('id', id)
  },

  baixar: async (id, qtd = 1) => {
    const { data } = await supabase.from('inventory').select('quantidade').eq('id', id).single()
    if (!data) return
    const nova = Math.max(0, data.quantidade - qtd)
    await supabase.from('inventory').update({ quantidade: nova }).eq('id', id)
  },
}

// ── DADOS DA OFICINA ──────────────────────────────────────
export const officeDataStorage = {
  get: async (_officeName) => {
    const { data } = await supabase.from('office_data').select('*').maybeSingle()
    if (!data) return {}
    return {
      nome: data.nome || '',
      cnpj: data.cnpj || '',
      telefone: data.telefone || '',
      endereco: data.endereco || '',
      logo: data.logo || '',
      tecnicos: data.tecnicos || [],
    }
  },

  save: async (_officeName, officeData) => {
    const { data: existing } = await supabase.from('office_data').select('user_id').maybeSingle()
    if (existing) {
      await supabase.from('office_data').update({
        nome: officeData.nome || '',
        cnpj: officeData.cnpj || '',
        telefone: officeData.telefone || '',
        endereco: officeData.endereco || '',
        logo: officeData.logo || '',
        tecnicos: officeData.tecnicos || [],
        updated_at: new Date().toISOString(),
      }).eq('user_id', existing.user_id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('office_data').insert({
        user_id: user.id,
        nome: officeData.nome || '',
        cnpj: officeData.cnpj || '',
        telefone: officeData.telefone || '',
        endereco: officeData.endereco || '',
        logo: officeData.logo || '',
        tecnicos: officeData.tecnicos || [],
      })
    }
  },
}

// ── AUTH (admin) ───────────────────────────────────────────
export const authStorage = {
  getAll: async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    return (data || []).map(p => ({
      id: p.id,
      oficina: p.oficina || '',
      responsavel: p.responsavel || '',
      whatsapp: p.whatsapp || '',
      email: p.email || '',
      status: p.status || 'trial',
      plan: p.plan || null,
      isAdmin: p.is_admin || false,
      trialEnd: p.trial_end || null,
      createdAt: p.created_at,
      activatedAt: p.activated_at || null,
    }))
  },

  updateStatus: async (id, status, plan = null) => {
    await supabase.from('profiles').update({
      status,
      ...(plan ? { plan } : {}),
      ...(status === 'active' ? { activated_at: new Date().toISOString() } : {}),
    }).eq('id', id)
  },
}

// ── GERADOR DE PDF / IMPRESSÃO ────────────────────────────
export const printOS = ({ os, client, vehicle, items, officeData, formatCurrencyFn, formatDateFn, desconto }) => {
  const subtotal = items.reduce((s, i) => s + i.venda, 0)
  const descontoValor = (() => {
    if (!desconto || !desconto.valor) return 0
    if (desconto.tipo === 'percent') return subtotal * desconto.valor / 100
    return Math.min(desconto.valor, subtotal)
  })()
  const totalVenda = subtotal - descontoValor

  const itemsRows = items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">${item.descricao}${item.garantia ? `<span style="font-size:10px;color:#64748b;margin-left:6px">🛡️ ${item.garantia}</span>` : ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;text-align:right;white-space:nowrap">${formatCurrencyFn(item.venda)}</td>
    </tr>`).join('')

  const logoHtml = officeData.logo
    ? `<img src="${officeData.logo}" style="max-height:60px;max-width:160px;object-fit:contain" />`
    : `<div style="width:44px;height:44px;background:#4f46e5;border-radius:10px;display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:22px;font-weight:bold">B</span></div>`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>orcamento-${vehicle?.placa}-${client?.nome?.split(' ')[0] || 'cliente'}.pdf</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1e293b;padding:32px;max-width:680px;margin:0 auto}@media print{body{padding:16px}}</style>
</head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e2e8f0">
    <div>${logoHtml}<div style="margin-top:10px">
      <div style="font-size:18px;font-weight:800;color:#1e293b">${officeData.nome || 'Minha Oficina'}</div>
      ${officeData.cnpj ? `<div style="font-size:12px;color:#64748b;margin-top:2px">CNPJ: ${officeData.cnpj}</div>` : ''}
      ${officeData.endereco ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${officeData.endereco}</div>` : ''}
      ${officeData.telefone ? `<div style="font-size:12px;color:#64748b;margin-top:2px">Tel: ${officeData.telefone}</div>` : ''}
    </div></div>
    <div style="text-align:right">
      <div style="background:#4f46e5;color:white;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Ordem de Serviço</div>
      <div style="font-size:12px;color:#64748b">Data: ${formatDateFn(os.createdAt)}</div>
      ${os.km ? `<div style="font-size:12px;color:#64748b">KM: ${os.km}</div>` : ''}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px">
    <div style="background:#f8fafc;border-radius:12px;padding:16px">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Cliente</div>
      <div style="font-weight:700;font-size:15px;color:#1e293b">${client?.nome || '—'}</div>
      ${client?.whatsapp ? `<div style="font-size:13px;color:#64748b;margin-top:4px">${client.whatsapp}</div>` : ''}
      ${client?.cpf ? `<div style="font-size:12px;color:#64748b;margin-top:2px">CPF: ${client.cpf}</div>` : ''}
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:16px">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Veículo</div>
      <div style="font-weight:700;font-size:15px;color:#1e293b">${vehicle?.modelo || '—'}</div>
      <div style="font-size:13px;font-weight:700;color:#4f46e5;margin-top:4px;letter-spacing:.1em">${vehicle?.placa || ''}</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead><tr style="background:#f8fafc">
      <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0">Descrição</th>
      <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0">Valor</th>
    </tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>
  ${descontoValor > 0 ? `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:0 8px">
    <span style="color:#64748b;font-size:13px">Subtotal</span>
    <span style="color:#64748b;font-size:13px">${formatCurrencyFn(subtotal)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:0 8px">
    <span style="color:#16a34a;font-size:13px">Desconto ${desconto.tipo === 'percent' ? `(${desconto.valor}%)` : ''}</span>
    <span style="color:#16a34a;font-size:13px">− ${formatCurrencyFn(descontoValor)}</span>
  </div>` : ''}
  <div style="background:#4f46e5;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:28px">
    <span style="color:rgba(255,255,255,.8);font-size:14px;font-weight:600">Total</span>
    <span style="color:white;font-size:22px;font-weight:800">${formatCurrencyFn(totalVenda)}</span>
  </div>
  ${os.observacoes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px">
    <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Observações</div>
    <div style="font-size:13px;color:#78350f">${os.observacoes}</div>
  </div>` : ''}
  ${(() => {
    const metodoLabels = { dinheiro: 'Dinheiro', pix: 'PIX', debito: 'Cartão de Débito', credito: 'Cartão de Crédito' }
    const metodos = desconto?.metodos || []
    if (metodos.length === 0) return ''
    const lista = metodos.map(k => metodoLabels[k] || k).join(' &bull; ')
    return `<div style="background:#f8fafc;border-radius:12px;padding:14px 16px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
      <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap">Pagamentos</span>
      <span style="font-size:13px;color:#475569">${lista}</span>
    </div>`
  })()}
  <div style="text-align:center;color:#94a3b8;font-size:11px;margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0">Gerado por BoxCerto &bull; boxcerto.com</div>
</body></html>`

  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) { alert('Permita pop-ups para gerar o PDF'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

// ── RECIBO DE PAGAMENTO ───────────────────────────────────
export const printReceipt = ({ os, client, vehicle, items, officeData, formatCurrencyFn, formatDateFn }) => {
  const PAYMENT_LABELS = { pix: 'PIX', dinheiro: 'Dinheiro', debito: 'Cartão Débito', credito: 'Cartão Crédito', outros: 'Outros' }
  const subtotal = items.reduce((s, i) => s + i.venda, 0)
  const desconto = os.desconto || { tipo: 'valor', valor: 0 }
  const descontoValor = (() => {
    if (!desconto.valor) return 0
    if (desconto.tipo === 'percent') return subtotal * desconto.valor / 100
    return Math.min(desconto.valor, subtotal)
  })()
  const total = subtotal - descontoValor
  const paymentsRows = (os.payments || []).map(p =>
    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9">
      <span style="color:#475569;font-size:13px">${PAYMENT_LABELS[p.method] || p.method}</span>
      <span style="font-weight:600;font-size:13px">${formatCurrencyFn(Number(p.amount))}</span>
    </div>`).join('')

  const logoHtml = officeData.logo
    ? `<img src="${officeData.logo}" style="max-height:50px;max-width:120px;object-fit:contain" />`
    : `<div style="width:36px;height:36px;background:#4f46e5;border-radius:8px;display:flex;align-items:center;justify-content:center"><span style="color:white;font-size:18px;font-weight:bold">B</span></div>`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>recibo-${vehicle?.placa}-${client?.nome?.split(' ')[0] || 'cliente'}.pdf</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1e293b;padding:24px;max-width:400px;margin:0 auto}@media print{body{padding:12px}}</style>
</head><body>
  <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px dashed #e2e8f0">
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px">
      ${logoHtml}
      <div style="text-align:left">
        <div style="font-size:16px;font-weight:800">${officeData.nome || 'Minha Oficina'}</div>
        ${officeData.telefone ? `<div style="font-size:11px;color:#64748b">${officeData.telefone}</div>` : ''}
      </div>
    </div>
    <div style="background:#f1f5f9;border-radius:8px;padding:6px 16px;display:inline-block;margin-top:8px">
      <span style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px">Recibo de Pagamento</span>
    </div>
  </div>
  <div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <span style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Cliente</span>
      <span style="font-size:13px;font-weight:600">${client?.nome || '—'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <span style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Veículo</span>
      <span style="font-size:13px;font-weight:600">${vehicle?.modelo} · ${vehicle?.placa}</span>
    </div>
    <div style="display:flex;justify-content:space-between">
      <span style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Data Entrega</span>
      <span style="font-size:13px;font-weight:600">${os.deliveredAt ? new Date(os.deliveredAt).toLocaleString('pt-BR') : '—'}</span>
    </div>
  </div>
  <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:16px">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Formas de Pagamento</div>
    ${paymentsRows}
    ${descontoValor > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9">
      <span style="color:#16a34a;font-size:13px">Desconto</span>
      <span style="color:#16a34a;font-weight:600;font-size:13px">− ${formatCurrencyFn(descontoValor)}</span>
    </div>` : ''}
    <div style="display:flex;justify-content:space-between;padding:12px 0 0">
      <span style="font-weight:700;font-size:14px">Total Pago</span>
      <span style="font-weight:800;font-size:16px;color:#4f46e5">${formatCurrencyFn(total)}</span>
    </div>
  </div>
  ${os.deliveryNotes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:#78350f">${os.deliveryNotes}</div>` : ''}
  <div style="text-align:center;color:#94a3b8;font-size:10px;margin-top:16px;padding-top:12px;border-top:1px dashed #e2e8f0">
    Obrigado pela confiança! &bull; BoxCerto
  </div>
</body></html>`

  const win = window.open('', '_blank', 'width=500,height=700')
  if (!win) { alert('Permita pop-ups para gerar o recibo'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

// ── PDF DOWNLOAD (jsPDF) ──────────────────────────────────
const PAYMENT_NAMES = { pix: 'PIX', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito', outros: 'Outros' }

export const buildDescontoLabel = (desconto, valor) => {
  if (!desconto || !valor) return ''
  const metodos = (desconto.metodos || []).map(k => PAYMENT_NAMES[k] || k)
  const sufixo = metodos.length > 0 ? ` no ${metodos.join('/')}` : ''
  return desconto.tipo === 'percent' ? `Desconto (${desconto.valor}%${sufixo})` : `Desconto${sufixo}`
}

export const downloadOsPDF = async ({ os, client, vehicle, items, officeData, formatCurrencyFn, formatDateFn, desconto }) => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, ml = 15, mr = 15, cW = 180
  let y = 15

  const C = {
    main: [30, 41, 59], med: [100, 116, 139], light: [148, 163, 184],
    line: [226, 232, 240], indigo: [79, 70, 229], green: [22, 163, 74],
    bg: [248, 250, 252],
  }
  const txt = (t, x, yy, { size = 9, bold = false, color = C.main, align = 'left' } = {}) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color); doc.text(String(t || ''), x, yy, { align })
  }
  const line = (yy) => { doc.setDrawColor(...C.line); doc.setLineWidth(0.3); doc.line(ml, yy, W - mr, yy) }

  // ── Header ────────────────────────────────────────────
  doc.setFillColor(...C.indigo)
  doc.roundedRect(ml, y, 11, 11, 2, 2, 'F')
  txt('B', ml + 3.8, y + 7.8, { size: 9, bold: true, color: [255, 255, 255] })
  txt(officeData.nome || 'Minha Oficina', ml + 14, y + 4, { size: 13, bold: true })
  if (officeData.cnpj) txt(`CNPJ: ${officeData.cnpj}`, ml + 14, y + 8, { size: 7, color: C.med })
  if (officeData.endereco) txt(officeData.endereco, ml + 14, y + 12, { size: 7, color: C.med })

  doc.setFillColor(...C.indigo)
  doc.roundedRect(W - mr - 42, y, 42, 7, 2, 2, 'F')
  txt('ORDEM DE SERVIÇO', W - mr - 21, y + 5, { size: 7, bold: true, color: [255, 255, 255], align: 'center' })
  txt(`Data: ${formatDateFn(os.createdAt)}`, W - mr, y + 10, { size: 8, color: C.med, align: 'right' })
  if (os.km) txt(`KM: ${os.km}`, W - mr, y + 14, { size: 8, color: C.med, align: 'right' })

  y += 19; line(y); y += 5

  // ── Cliente / Veículo ────────────────────────────────
  const hw = (cW - 5) / 2
  doc.setFillColor(...C.bg); doc.roundedRect(ml, y, hw, 24, 3, 3, 'F')
  txt('CLIENTE', ml + 4, y + 5, { size: 7, bold: true, color: C.light })
  txt(client?.nome || '—', ml + 4, y + 11, { size: 10, bold: true })
  if (client?.whatsapp) txt(client.whatsapp, ml + 4, y + 16, { size: 8, color: C.med })
  if (client?.cpf) txt(`CPF: ${client.cpf}`, ml + 4, y + 20, { size: 7, color: C.med })

  const vX = ml + hw + 5
  doc.setFillColor(...C.bg); doc.roundedRect(vX, y, hw, 24, 3, 3, 'F')
  txt('VEÍCULO', vX + 4, y + 5, { size: 7, bold: true, color: C.light })
  txt(vehicle?.modelo || '—', vX + 4, y + 11, { size: 10, bold: true })
  txt(vehicle?.placa || '', vX + 4, y + 18, { size: 10, bold: true, color: C.indigo })

  y += 30

  // ── Tabela de itens ──────────────────────────────────
  doc.setFillColor(...C.bg); doc.rect(ml, y, cW, 8, 'F')
  txt('DESCRIÇÃO', ml + 3, y + 5.5, { size: 7, bold: true, color: C.light })
  txt('VALOR', W - mr - 3, y + 5.5, { size: 7, bold: true, color: C.light, align: 'right' })
  line(y + 8); y += 8

  items.forEach(item => {
    if (y > 255) { doc.addPage(); y = 20 }
    const desc = item.descricao.length > 60 ? item.descricao.slice(0, 57) + '...' : item.descricao
    txt(desc, ml + 3, y + 6)
    if (item.garantia) txt(`🛡 ${item.garantia}`, ml + 3, y + 10.5, { size: 7, color: C.med })
    txt(formatCurrencyFn(item.venda), W - mr - 3, y + 6, { bold: true, align: 'right' })
    line(y + (item.garantia ? 13 : 9))
    y += item.garantia ? 14 : 10
  })
  y += 4

  // ── Totais ───────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + i.venda, 0)
  const descontoCalc = (() => {
    if (!desconto?.valor) return 0
    if (desconto.tipo === 'percent') return subtotal * Number(desconto.valor) / 100
    return Math.min(Number(desconto.valor), subtotal)
  })()
  const total = subtotal - descontoCalc

  if (descontoCalc > 0) {
    txt('Subtotal', W - mr - 55, y, { size: 9, color: C.med }); txt(formatCurrencyFn(subtotal), W - mr, y, { size: 9, color: C.med, align: 'right' }); y += 5
    const lbl = buildDescontoLabel(desconto, descontoCalc)
    txt(lbl, W - mr - 55, y, { size: 9, color: C.green }); txt(`− ${formatCurrencyFn(descontoCalc)}`, W - mr, y, { size: 9, color: C.green, align: 'right' }); y += 5
  }

  doc.setFillColor(...C.indigo); doc.roundedRect(ml, y, cW, 13, 3, 3, 'F')
  txt('TOTAL', ml + 5, y + 9, { size: 10, bold: true, color: [200, 200, 255] })
  txt(formatCurrencyFn(total), W - mr - 5, y + 9, { size: 14, bold: true, color: [255, 255, 255], align: 'right' })
  y += 18

  // ── Observações ──────────────────────────────────────
  if (os.observacoes) {
    doc.setFillColor(255, 251, 235); doc.roundedRect(ml, y, cW, 18, 3, 3, 'F')
    txt('OBSERVAÇÕES', ml + 4, y + 5, { size: 7, bold: true, color: [146, 64, 14] })
    const obsLines = doc.splitTextToSize(os.observacoes, cW - 8)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 53, 15)
    doc.text(obsLines, ml + 4, y + 10); y += 22
  }

  // ── Condição de pagamento ────────────────────────────
  const metodos = (desconto?.metodos || []).map(k => PAYMENT_NAMES[k] || k)
  if (metodos.length > 0) {
    doc.setFillColor(...C.bg); doc.roundedRect(ml, y, cW, 10, 3, 3, 'F')
    txt('PAGAMENTO', ml + 4, y + 4, { size: 7, bold: true, color: C.light })
    txt(metodos.join(' · '), ml + 4, y + 8, { size: 8, color: C.med })
    y += 14
  }

  // ── Footer ───────────────────────────────────────────
  txt('Gerado por BoxCerto · boxcerto.com', W / 2, 288, { size: 7, color: C.light, align: 'center' })

  const filename = `orcamento-${vehicle?.placa || 'veiculo'}-${(client?.nome || 'cliente').split(' ')[0]}.pdf`
  doc.save(filename)
}

export const downloadReceiptPDF = async ({ os, client, vehicle, items, officeData, formatCurrencyFn }) => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, ml = 30, mr = 30, cW = 150
  let y = 20

  const C = { main: [30, 41, 59], med: [100, 116, 139], light: [148, 163, 184], line: [226, 232, 240], indigo: [79, 70, 229], green: [22, 163, 74], bg: [248, 250, 252] }
  const txt = (t, x, yy, { size = 9, bold = false, color = C.main, align = 'left' } = {}) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color); doc.text(String(t || ''), x, yy, { align })
  }

  // ── Header ────────────────────────────────────────────
  doc.setFillColor(...C.indigo); doc.roundedRect(ml, y, 10, 10, 2, 2, 'F')
  txt('B', ml + 3.3, y + 7, { size: 9, bold: true, color: [255, 255, 255] })
  txt(officeData.nome || 'Minha Oficina', ml + 13, y + 5, { size: 12, bold: true })
  if (officeData.telefone) txt(officeData.telefone, ml + 13, y + 10, { size: 7, color: C.med })

  doc.setFillColor(...C.bg); doc.roundedRect(ml, y + 14, cW, 7, 2, 2, 'F')
  txt('RECIBO DE PAGAMENTO', W / 2, y + 19, { size: 8, bold: true, color: C.med, align: 'center' })
  y += 26

  // ── Info OS ──────────────────────────────────────────
  const row = (label, val, yy) => {
    txt(label, ml, yy, { size: 8, bold: true, color: C.light })
    txt(val, W - mr, yy, { size: 8, bold: true, align: 'right' })
  }
  row('Cliente', client?.nome || '—', y); y += 6
  row('Veículo', `${vehicle?.modelo || '—'} · ${vehicle?.placa || ''}`, y); y += 6
  row('Data de Entrega', os.deliveredAt ? new Date(os.deliveredAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—', y); y += 10

  doc.setDrawColor(...C.line); doc.setLineWidth(0.3); doc.line(ml, y, W - mr, y); y += 6

  // ── Pagamentos ───────────────────────────────────────
  txt('FORMAS DE PAGAMENTO', ml, y, { size: 7, bold: true, color: C.light }); y += 6
  const PLABELS = { pix: 'PIX', dinheiro: 'Dinheiro', debito: 'Cartão Débito', credito: 'Cartão Crédito', outros: 'Outros' }
  ;(os.payments || []).forEach(p => {
    txt(PLABELS[p.method] || p.method, ml, y, { size: 9 })
    txt(formatCurrencyFn(Number(p.amount)), W - mr, y, { size: 9, bold: true, align: 'right' })
    y += 7
  })

  // ── Totais ───────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + i.venda, 0)
  const desconto = os.desconto || {}
  const descontoCalc = (() => {
    if (!desconto.valor) return 0
    if (desconto.tipo === 'percent') return subtotal * Number(desconto.valor) / 100
    return Math.min(Number(desconto.valor), subtotal)
  })()
  const total = subtotal - descontoCalc

  y += 2; doc.setDrawColor(...C.line); doc.line(ml, y, W - mr, y); y += 6

  if (descontoCalc > 0) {
    const lbl = buildDescontoLabel(desconto, descontoCalc)
    txt(lbl, ml, y, { size: 8, color: C.green }); txt(`− ${formatCurrencyFn(descontoCalc)}`, W - mr, y, { size: 8, color: C.green, align: 'right' }); y += 7
  }

  doc.setFillColor(...C.indigo); doc.roundedRect(ml, y, cW, 13, 3, 3, 'F')
  txt('TOTAL PAGO', ml + 5, y + 9, { size: 10, bold: true, color: [200, 200, 255] })
  txt(formatCurrencyFn(total), W - mr - 5, y + 9, { size: 13, bold: true, color: [255, 255, 255], align: 'right' })
  y += 18

  if (os.deliveryNotes) {
    doc.setFillColor(255, 251, 235); doc.roundedRect(ml, y, cW, 14, 3, 3, 'F')
    const noteLines = doc.splitTextToSize(os.deliveryNotes, cW - 8)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 53, 15)
    doc.text(noteLines, ml + 4, y + 7); y += 18
  }

  txt('Obrigado pela confiança! · BoxCerto · boxcerto.com', W / 2, 288, { size: 7, color: C.light, align: 'center' })

  const filename = `recibo-${vehicle?.placa || 'veiculo'}-${(client?.nome || 'cliente').split(' ')[0]}.pdf`
  doc.save(filename)
}

// ── HELPERS ───────────────────────────────────────────────
export const formatCurrency = (val) =>
  Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const STATUS_LABELS = {
  orcamento: 'Orçamento',
  manutencao: 'Em Manutenção',
  pronto: 'Pronto',
  entregue: 'Entregue',
}

export const STATUS_COLORS = {
  orcamento: 'bg-amber-100 text-amber-700',
  manutencao: 'bg-blue-100 text-blue-700',
  pronto: 'bg-green-100 text-green-700',
  entregue: 'bg-gray-100 text-gray-500',
}

export const GARANTIA_OPTIONS = ['', '30 dias', '60 dias', '90 dias', '6 meses', '1 ano']

export const SERVICOS_COMUNS = [
  'Troca de óleo e filtro',
  'Revisão de freios',
  'Alinhamento e balanceamento',
  'Troca de pastilha de freio',
  'Troca de correia dentada',
  'Troca de velas',
  'Troca de amortecedor',
  'Higienização do ar-condicionado',
  'Troca de filtro de ar',
  'Troca de bateria',
  'Diagnóstico eletrônico',
  'Troca de embreagem',
  'Pintura',
  'Polimento',
  'Funilaria',
  'Troca de escapamento',
  'Revisão elétrica',
  'Troca de mangueira',
]
