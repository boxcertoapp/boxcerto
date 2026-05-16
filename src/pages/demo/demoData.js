/**
 * demoData.js — Dados fictícios para o Modo Demonstração do BoxCerto
 * Oficina: Auto Center Machado — Pelotas, RS
 * Todos os telefones: 53997065725 (WhatsApp comercial BoxCerto)
 */

export const DEMO_OFICINA = {
  nome: 'Auto Center Machado',
  responsavel: 'Carlos Augusto Machado',
  telefone: '53997065725',
  cidade: 'Pelotas, RS',
  cnpj: '12.345.678/0001-90',
}

// ── Clientes ──────────────────────────────────────────────────────────────────
export const DEMO_CLIENTES = [
  { id: 'c1', nome: 'Carlos Augusto Machado', telefone: '53997065725', email: 'carlos@email.com',
    veiculo: { modelo: 'VW Gol G5 1.0', placa: 'PEL-1234', ano: 2012, cor: 'Prata' },
    totalOS: 8, ultimaVisita: '2026-05-14' },
  { id: 'c2', nome: 'Rodrigo da Silva Santos', telefone: '53997065725', email: 'rodrigo@email.com',
    veiculo: { modelo: 'GM Celta 1.0', placa: 'PEL-5678', ano: 2010, cor: 'Branco' },
    totalOS: 5, ultimaVisita: '2026-05-10' },
  { id: 'c3', nome: 'Andréia Pereira Lima', telefone: '53997065725', email: 'andreia@email.com',
    veiculo: { modelo: 'Fiat Palio 1.4', placa: 'PEL-9012', ano: 2015, cor: 'Vermelho' },
    totalOS: 3, ultimaVisita: '2026-05-08' },
  { id: 'c4', nome: 'Marcos Henrique Oliveira', telefone: '53997065725', email: 'marcos@email.com',
    veiculo: { modelo: 'VW Saveiro 1.6', placa: 'PEL-3456', ano: 2011, cor: 'Azul' },
    totalOS: 6, ultimaVisita: '2026-05-06' },
  { id: 'c5', nome: 'Fernanda Duarte Costa', telefone: '53997065725', email: 'fernanda@email.com',
    veiculo: { modelo: 'VW Fox 1.0', placa: 'PEL-7890', ano: 2014, cor: 'Prata' },
    totalOS: 4, ultimaVisita: '2026-05-03' },
  { id: 'c6', nome: 'José Alberto Nunes', telefone: '53997065725', email: 'jose@email.com',
    veiculo: { modelo: 'GM Corsa Sedan 1.0', placa: 'PEL-2345', ano: 2008, cor: 'Cinza' },
    totalOS: 9, ultimaVisita: '2026-04-28' },
  { id: 'c7', nome: 'Luciane Moreira Dias', telefone: '53997065725', email: 'luciane@email.com',
    veiculo: { modelo: 'Hyundai HB20 1.0', placa: 'PEL-6789', ano: 2019, cor: 'Preto' },
    totalOS: 2, ultimaVisita: '2026-05-12' },
  { id: 'c8', nome: 'Paulo César Borges', telefone: '53997065725', email: 'paulo@email.com',
    veiculo: { modelo: 'Fiat Uno 1.0', placa: 'PEL-1111', ano: 2016, cor: 'Branco' },
    totalOS: 7, ultimaVisita: '2026-05-09' },
  { id: 'c9', nome: 'Gilberto Ramos Ferreira', telefone: '53997065725', email: 'gilberto@email.com',
    veiculo: { modelo: 'VW Voyage 1.6', placa: 'PEL-2222', ano: 2013, cor: 'Prata' },
    totalOS: 3, ultimaVisita: '2026-05-05' },
  { id: 'c10', nome: 'Rosana Teixeira Alves', telefone: '53997065725', email: 'rosana@email.com',
    veiculo: { modelo: 'GM Spin 1.8', placa: 'PEL-3333', ano: 2018, cor: 'Branco' },
    totalOS: 5, ultimaVisita: '2026-05-11' },
]

// ── Status ────────────────────────────────────────────────────────────────────
export const STATUS_LABELS = {
  orcamento:  'Orçamento',
  aprovado:   'Aprovado',
  em_servico: 'Em Serviço',
  pronto:     'Pronto',
  entregue:   'Entregue',
}
export const STATUS_COLORS = {
  orcamento:  'bg-amber-100 text-amber-700',
  aprovado:   'bg-blue-100 text-blue-700',
  em_servico: 'bg-purple-100 text-purple-700',
  pronto:     'bg-emerald-100 text-emerald-700',
  entregue:   'bg-gray-100 text-gray-600',
}
export const STATUS_DOT = {
  orcamento:  'bg-amber-400',
  aprovado:   'bg-blue-500',
  em_servico: 'bg-purple-500',
  pronto:     'bg-emerald-500',
  entregue:   'bg-gray-400',
}

// ── OS (Ordens de Serviço) ────────────────────────────────────────────────────
export const DEMO_OS = [
  {
    id: 'os1', numero: 247, status: 'em_servico',
    cliente: 'Carlos Augusto Machado', veiculo: 'VW Gol G5 1.0', placa: 'PEL-1234',
    data: '2026-05-14', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Troca de pastilha dianteira (par)', tipo: 'pecas', valor: 85 },
      { descricao: 'Troca de disco dianteiro (par)', tipo: 'pecas', valor: 290 },
      { descricao: 'Mão de obra — freios dianteiros', tipo: 'servico', valor: 180 },
    ],
    total: 555, km: 87400, obs: 'Cliente relatou ruído ao frear. Verificado desgaste excessivo.'
  },
  {
    id: 'os2', numero: 246, status: 'pronto',
    cliente: 'Rodrigo da Silva Santos', veiculo: 'GM Celta 1.0', placa: 'PEL-5678',
    data: '2026-05-13', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Alinhamento de direção', tipo: 'servico', valor: 80 },
      { descricao: 'Balanceamento (4 rodas)', tipo: 'servico', valor: 80 },
      { descricao: 'Rodízio de pneus', tipo: 'servico', valor: 40 },
    ],
    total: 200, km: 62100, obs: 'Carro com desgaste irregular nos pneus traseiros.'
  },
  {
    id: 'os3', numero: 245, status: 'aprovado',
    cliente: 'Andréia Pereira Lima', veiculo: 'Fiat Palio 1.4', placa: 'PEL-9012',
    data: '2026-05-12', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Correia dentada + tensor', tipo: 'pecas', valor: 220 },
      { descricao: 'Bomba d\'água', tipo: 'pecas', valor: 185 },
      { descricao: 'Mão de obra — kit distribuição', tipo: 'servico', valor: 380 },
    ],
    total: 785, km: 105000, obs: 'Revisão programada dos 100k km. Correia com sinais de desgaste.'
  },
  {
    id: 'os4', numero: 244, status: 'orcamento',
    cliente: 'Marcos Henrique Oliveira', veiculo: 'VW Saveiro 1.6', placa: 'PEL-3456',
    data: '2026-05-11', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Troca de óleo 5W30 sintético', tipo: 'pecas', valor: 76 },
      { descricao: 'Filtro de óleo', tipo: 'pecas', valor: 25 },
      { descricao: 'Filtro de ar', tipo: 'pecas', valor: 32 },
      { descricao: 'Filtro de combustível', tipo: 'pecas', valor: 35 },
      { descricao: 'Velas de ignição (4)', tipo: 'pecas', valor: 72 },
      { descricao: 'Revisão geral + mão de obra', tipo: 'servico', valor: 220 },
    ],
    total: 460, km: 50200, obs: 'Revisão dos 50.000 km. Cliente aprovará até sexta.'
  },
  {
    id: 'os5', numero: 243, status: 'entregue',
    cliente: 'Fernanda Duarte Costa', veiculo: 'VW Fox 1.0', placa: 'PEL-7890',
    data: '2026-05-08', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Troca de óleo 5W30', tipo: 'pecas', valor: 76 },
      { descricao: 'Filtro de óleo', tipo: 'pecas', valor: 25 },
      { descricao: 'Mão de obra', tipo: 'servico', valor: 80 },
    ],
    total: 181, km: 71300, obs: '', pagamento: 'pix'
  },
  {
    id: 'os6', numero: 242, status: 'entregue',
    cliente: 'José Alberto Nunes', veiculo: 'GM Corsa Sedan 1.0', placa: 'PEL-2345',
    data: '2026-05-03', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Kit embreagem (disco + platô)', tipo: 'pecas', valor: 480 },
      { descricao: 'Rolamento de embreagem', tipo: 'pecas', valor: 90 },
      { descricao: 'Mão de obra — embreagem', tipo: 'servico', valor: 450 },
    ],
    total: 1020, km: 118500, obs: 'Embreagem deslizando. Trocado kit completo.', pagamento: 'credito'
  },
  {
    id: 'os7', numero: 241, status: 'em_servico',
    cliente: 'Luciane Moreira Dias', veiculo: 'Hyundai HB20 1.0', placa: 'PEL-6789',
    data: '2026-05-12', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Diagnóstico elétrico', tipo: 'servico', valor: 150 },
      { descricao: 'Sensor de oxigênio', tipo: 'pecas', valor: 230 },
      { descricao: 'Mão de obra — sensor O2', tipo: 'servico', valor: 120 },
    ],
    total: 500, km: 43200, obs: 'Luz amarela do painel acesa. Scanner detectou falha no sensor O2.'
  },
  {
    id: 'os8', numero: 240, status: 'pronto',
    cliente: 'Paulo César Borges', veiculo: 'Fiat Uno 1.0', placa: 'PEL-1111',
    data: '2026-05-09', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Velas de ignição NGK (4)', tipo: 'pecas', valor: 72 },
      { descricao: 'Cabos de vela', tipo: 'pecas', valor: 95 },
      { descricao: 'Mão de obra', tipo: 'servico', valor: 80 },
    ],
    total: 247, km: 93700, obs: 'Motor falhando em arranque frio.'
  },
  {
    id: 'os9', numero: 239, status: 'orcamento',
    cliente: 'Gilberto Ramos Ferreira', veiculo: 'VW Voyage 1.6', placa: 'PEL-2222',
    data: '2026-05-10', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Amortecedor dianteiro (par) Monroe', tipo: 'pecas', valor: 570 },
      { descricao: 'Batente + coxim (par)', tipo: 'pecas', valor: 140 },
      { descricao: 'Mão de obra — suspensão dianteira', tipo: 'servico', valor: 280 },
    ],
    total: 990, km: 132000, obs: 'Carro batendo na suspensão em lombada. Amortecedores esgotados.'
  },
  {
    id: 'os10', numero: 238, status: 'aprovado',
    cliente: 'Rosana Teixeira Alves', veiculo: 'GM Spin 1.8', placa: 'PEL-3333',
    data: '2026-05-11', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Higienização do ar condicionado', tipo: 'servico', valor: 120 },
      { descricao: 'Recarga de gás R134a', tipo: 'servico', valor: 180 },
      { descricao: 'Filtro de cabine', tipo: 'pecas', valor: 55 },
    ],
    total: 355, km: 58900, obs: 'Ar condicionado com cheiro ruim e freon baixo.'
  },
  {
    id: 'os11', numero: 237, status: 'entregue',
    cliente: 'Carlos Augusto Machado', veiculo: 'VW Gol G5 1.0', placa: 'PEL-1234',
    data: '2026-04-22', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Alinhamento', tipo: 'servico', valor: 80 },
    ],
    total: 80, km: 86900, obs: '', pagamento: 'dinheiro'
  },
  {
    id: 'os12', numero: 236, status: 'entregue',
    cliente: 'Rodrigo da Silva Santos', veiculo: 'GM Celta 1.0', placa: 'PEL-5678',
    data: '2026-04-18', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Pastilha de freio traseira (par)', tipo: 'pecas', valor: 65 },
      { descricao: 'Mão de obra', tipo: 'servico', valor: 80 },
    ],
    total: 145, km: 61500, obs: '', pagamento: 'pix'
  },
  {
    id: 'os13', numero: 235, status: 'entregue',
    cliente: 'José Alberto Nunes', veiculo: 'GM Corsa Sedan 1.0', placa: 'PEL-2345',
    data: '2026-04-10', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Troca de óleo 5W30 + filtro', tipo: 'pecas', valor: 101 },
      { descricao: 'Mão de obra', tipo: 'servico', valor: 60 },
    ],
    total: 161, km: 117800, obs: '', pagamento: 'pix'
  },
]

// ── Estoque ───────────────────────────────────────────────────────────────────
export const DEMO_ESTOQUE = [
  { id: 'e1',  nome: 'Pastilha de freio dianteira (par)', marca: 'Bosch',   categoria: 'Freios',      quantidade: 14, minimo: 8,  custo: 58,  venda: 85,  codigo: 'PF-001' },
  { id: 'e2',  nome: 'Óleo motor 5W30 sintético 1L',      marca: 'Mobil',   categoria: 'Lubrificante', quantidade: 6,  minimo: 10, custo: 28,  venda: 38,  codigo: 'OL-001' },
  { id: 'e3',  nome: 'Filtro de óleo',                    marca: 'Mann',    categoria: 'Filtros',     quantidade: 22, minimo: 8,  custo: 15,  venda: 25,  codigo: 'FO-001' },
  { id: 'e4',  nome: 'Filtro de ar',                      marca: 'Mann',    categoria: 'Filtros',     quantidade: 11, minimo: 6,  custo: 22,  venda: 32,  codigo: 'FA-001' },
  { id: 'e5',  nome: 'Disco de freio dianteiro',          marca: 'Cofap',   categoria: 'Freios',      quantidade: 4,  minimo: 6,  custo: 98,  venda: 145, codigo: 'DF-001' },
  { id: 'e6',  nome: 'Correia dentada',                   marca: 'Gates',   categoria: 'Motor',       quantidade: 8,  minimo: 4,  custo: 65,  venda: 95,  codigo: 'CD-001' },
  { id: 'e7',  nome: 'Vela de ignição NGK',               marca: 'NGK',     categoria: 'Ignição',     quantidade: 32, minimo: 12, custo: 12,  venda: 18,  codigo: 'VI-001' },
  { id: 'e8',  nome: 'Fluido de freio DOT4 500ml',        marca: 'Bosch',   categoria: 'Freios',      quantidade: 9,  minimo: 6,  custo: 18,  venda: 28,  codigo: 'FF-001' },
  { id: 'e9',  nome: 'Rolamento de roda',                 marca: 'FAG',     categoria: 'Suspensão',   quantidade: 6,  minimo: 4,  custo: 78,  venda: 115, codigo: 'RR-001' },
  { id: 'e10', nome: 'Amortecedor dianteiro Monroe',      marca: 'Monroe',  categoria: 'Suspensão',   quantidade: 3,  minimo: 4,  custo: 190, venda: 285, codigo: 'AM-001' },
  { id: 'e11', nome: 'Filtro de combustível',             marca: 'Mann',    categoria: 'Filtros',     quantidade: 15, minimo: 6,  custo: 24,  venda: 35,  codigo: 'FC-001' },
  { id: 'e12', nome: 'Líquido de arrefecimento 1L',       marca: 'Comma',   categoria: 'Refrigeração',quantidade: 11, minimo: 8,  custo: 22,  venda: 32,  codigo: 'LA-001' },
  { id: 'e13', nome: 'Correia do alternador',             marca: 'Gates',   categoria: 'Motor',       quantidade: 7,  minimo: 4,  custo: 45,  venda: 65,  codigo: 'CA-001' },
  { id: 'e14', nome: 'Tensor da correia dentada',         marca: 'INA',     categoria: 'Motor',       quantidade: 5,  minimo: 3,  custo: 85,  venda: 125, codigo: 'TC-001' },
  { id: 'e15', nome: 'Cabo de vela (jogo)',               marca: 'Bosch',   categoria: 'Ignição',     quantidade: 4,  minimo: 4,  custo: 50,  venda: 72,  codigo: 'CV-001' },
  { id: 'e16', nome: 'Pastilha de freio traseira (par)',  marca: 'Bosch',   categoria: 'Freios',      quantidade: 10, minimo: 8,  custo: 42,  venda: 65,  codigo: 'PT-001' },
  { id: 'e17', nome: 'Filtro de cabine',                  marca: 'Mann',    categoria: 'Filtros',     quantidade: 8,  minimo: 6,  custo: 35,  venda: 55,  codigo: 'FCB-001' },
  { id: 'e18', nome: 'Bomba d\'água',                     marca: 'Bosch',   categoria: 'Motor',       quantidade: 4,  minimo: 2,  custo: 120, venda: 185, codigo: 'BA-001' },
]

// ── Financeiro ────────────────────────────────────────────────────────────────
export const DEMO_FINANCEIRO = {
  maio_2026: {
    mes: 4, ano: 2026, // maio = índice 4
    receitas: [
      { descricao: 'OS #243 — Fox (Troca de óleo)', valor: 181, data: '2026-05-08', placa: 'PEL-7890' },
      { descricao: 'OS #242 — Corsa (Embreagem)', valor: 1020, data: '2026-05-05', placa: 'PEL-2345' },
    ],
    despesas: [
      { descricao: 'Aluguel do galpão', valor: 1200, data: '2026-05-05', categoria: 'Fixo' },
      { descricao: 'Energia elétrica', valor: 380, data: '2026-05-10', categoria: 'Fixo' },
      { descricao: 'Compra de peças — NF 8821', valor: 1240, data: '2026-05-07', categoria: 'Estoque' },
      { descricao: 'Internet + telefone', valor: 120, data: '2026-05-05', categoria: 'Fixo' },
    ],
    totalReceitas: 1201,
    totalDespesas: 2940,
  },
  abril_2026: {
    mes: 3, ano: 2026,
    receitas: [
      { descricao: 'OS #237 — Gol (Alinhamento)', valor: 80, data: '2026-04-22', placa: 'PEL-1234' },
      { descricao: 'OS #236 — Celta (Pastilha)', valor: 145, data: '2026-04-19', placa: 'PEL-5678' },
      { descricao: 'OS #235 — Corsa (Troca óleo)', valor: 161, data: '2026-04-12', placa: 'PEL-2345' },
      { descricao: 'OS #234 — HB20 (Freio completo)', valor: 680, data: '2026-04-08', placa: 'PEL-6789' },
      { descricao: 'OS #233 — Spin (Revisão)', valor: 520, data: '2026-04-05', placa: 'PEL-3333' },
      { descricao: 'OS #232 — Uno (Suspensão)', valor: 890, data: '2026-04-03', placa: 'PEL-1111' },
      { descricao: 'OS #231 — Saveiro (Elétrica)', valor: 410, data: '2026-04-01', placa: 'PEL-3456' },
    ],
    despesas: [
      { descricao: 'Aluguel do galpão', valor: 1200, data: '2026-04-05', categoria: 'Fixo' },
      { descricao: 'Energia elétrica', valor: 350, data: '2026-04-10', categoria: 'Fixo' },
      { descricao: 'Compra de peças — NF 8740', valor: 1850, data: '2026-04-06', categoria: 'Estoque' },
      { descricao: 'Internet + telefone', valor: 120, data: '2026-04-05', categoria: 'Fixo' },
      { descricao: 'Ferramenta diagnóstico (scanner)', valor: 480, data: '2026-04-15', categoria: 'Equipamento' },
    ],
    totalReceitas: 2886,
    totalDespesas: 4000,
  },
  marco_2026: {
    mes: 2, ano: 2026,
    receitas: [
      { descricao: 'OS #230 — Fox (Kit freio)', valor: 620, data: '2026-03-28', placa: 'PEL-7890' },
      { descricao: 'OS #229 — Voyage (Embreagem)', valor: 980, data: '2026-03-24', placa: 'PEL-2222' },
      { descricao: 'OS #228 — Gol (Revisão 60k)', valor: 740, data: '2026-03-20', placa: 'PEL-1234' },
      { descricao: 'OS #227 — Palio (Correia)', valor: 785, data: '2026-03-15', placa: 'PEL-9012' },
      { descricao: 'OS #226 — Celta (Amortecedor)', valor: 890, data: '2026-03-10', placa: 'PEL-5678' },
      { descricao: 'OS #225 — Saveiro (Freios)', valor: 520, data: '2026-03-05', placa: 'PEL-3456' },
      { descricao: 'OS #224 — HB20 (Troca óleo)', valor: 181, data: '2026-03-03', placa: 'PEL-6789' },
      { descricao: 'OS #223 — Uno (Elétrica)', valor: 350, data: '2026-03-01', placa: 'PEL-1111' },
    ],
    despesas: [
      { descricao: 'Aluguel do galpão', valor: 1200, data: '2026-03-05', categoria: 'Fixo' },
      { descricao: 'Energia elétrica', valor: 310, data: '2026-03-10', categoria: 'Fixo' },
      { descricao: 'Compra de peças — NF 8612', valor: 2100, data: '2026-03-04', categoria: 'Estoque' },
      { descricao: 'Internet + telefone', valor: 120, data: '2026-03-05', categoria: 'Fixo' },
    ],
    totalReceitas: 5066,
    totalDespesas: 3730,
  },
}

export const DEMO_MESES_KEYS = ['marco_2026', 'abril_2026', 'maio_2026']
export const DEMO_MESES_LABELS = { marco_2026: 'Março 2026', abril_2026: 'Abril 2026', maio_2026: 'Maio 2026' }
