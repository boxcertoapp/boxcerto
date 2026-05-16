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
    totalOS: 12, totalGasto: 9800, ultimaVisita: '2026-05-14' },
  { id: 'c2', nome: 'Rodrigo da Silva Santos', telefone: '53997065725', email: 'rodrigo@email.com',
    veiculo: { modelo: 'GM Celta 1.0', placa: 'PEL-5678', ano: 2010, cor: 'Branco' },
    totalOS: 8, totalGasto: 5640, ultimaVisita: '2026-05-10' },
  { id: 'c3', nome: 'Andréia Pereira Lima', telefone: '53997065725', email: 'andreia@email.com',
    veiculo: { modelo: 'Fiat Palio 1.4', placa: 'PEL-9012', ano: 2015, cor: 'Vermelho' },
    totalOS: 6, totalGasto: 7185, ultimaVisita: '2026-05-12' },
  { id: 'c4', nome: 'Marcos Henrique Oliveira', telefone: '53997065725', email: 'marcos@email.com',
    veiculo: { modelo: 'VW Saveiro 1.6', placa: 'PEL-3456', ano: 2011, cor: 'Azul' },
    totalOS: 9, totalGasto: 8420, ultimaVisita: '2026-05-11' },
  { id: 'c5', nome: 'Fernanda Duarte Costa', telefone: '53997065725', email: 'fernanda@email.com',
    veiculo: { modelo: 'VW Fox 1.0', placa: 'PEL-7890', ano: 2014, cor: 'Prata' },
    totalOS: 7, totalGasto: 6390, ultimaVisita: '2026-05-08' },
  { id: 'c6', nome: 'José Alberto Nunes', telefone: '53997065725', email: 'jose@email.com',
    veiculo: { modelo: 'GM Corsa Sedan 1.0', placa: 'PEL-2345', ano: 2008, cor: 'Cinza' },
    totalOS: 14, totalGasto: 12480, ultimaVisita: '2026-05-03' },
  { id: 'c7', nome: 'Luciane Moreira Dias', telefone: '53997065725', email: 'luciane@email.com',
    veiculo: { modelo: 'Hyundai HB20 1.0', placa: 'PEL-6789', ano: 2019, cor: 'Preto' },
    totalOS: 5, totalGasto: 4180, ultimaVisita: '2026-05-12' },
  { id: 'c8', nome: 'Paulo César Borges', telefone: '53997065725', email: 'paulo@email.com',
    veiculo: { modelo: 'Fiat Uno 1.0', placa: 'PEL-1111', ano: 2016, cor: 'Branco' },
    totalOS: 11, totalGasto: 9750, ultimaVisita: '2026-05-13' },
  { id: 'c9', nome: 'Gilberto Ramos Ferreira', telefone: '53997065725', email: 'gilberto@email.com',
    veiculo: { modelo: 'VW Voyage 1.6', placa: 'PEL-2222', ano: 2013, cor: 'Prata' },
    totalOS: 6, totalGasto: 6830, ultimaVisita: '2026-05-05' },
  { id: 'c10', nome: 'Rosana Teixeira Alves', telefone: '53997065725', email: 'rosana@email.com',
    veiculo: { modelo: 'GM Spin 1.8', placa: 'PEL-3333', ano: 2018, cor: 'Branco' },
    totalOS: 9, totalGasto: 10240, ultimaVisita: '2026-05-15' },
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
  // ── Maio 2026 — Em andamento / recentes ──
  {
    id: 'os1', numero: 252, status: 'em_servico',
    cliente: 'Rosana Teixeira Alves', veiculo: 'GM Spin 1.8', placa: 'PEL-3333',
    data: '2026-05-15', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Suspensão traseira — braço oscilante (par)', tipo: 'pecas', valor: 480 },
      { descricao: 'Molas traseiras (par)', tipo: 'pecas', valor: 390 },
      { descricao: 'Amortecedor traseiro (par) Monroe', tipo: 'pecas', valor: 620 },
      { descricao: 'Mão de obra — suspensão traseira completa', tipo: 'servico', valor: 680 },
    ],
    total: 2170, km: 88200, obs: 'Cliente relatou barulho e instabilidade na traseira. Suspensão traseira toda comprometida.'
  },
  {
    id: 'os2', numero: 251, status: 'aprovado',
    cliente: 'Marcos Henrique Oliveira', veiculo: 'VW Saveiro 1.6', placa: 'PEL-3456',
    data: '2026-05-14', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Correia dentada + tensor + correia acessórios', tipo: 'pecas', valor: 320 },
      { descricao: 'Bomba d\'água', tipo: 'pecas', valor: 185 },
      { descricao: 'Velas de ignição NGK (4)', tipo: 'pecas', valor: 72 },
      { descricao: 'Filtro de ar + óleo + combustível', tipo: 'pecas', valor: 92 },
      { descricao: 'Troca de óleo 5W30 sintético 4L', tipo: 'pecas', valor: 152 },
      { descricao: 'Mão de obra — revisão 80.000 km completa', tipo: 'servico', valor: 420 },
    ],
    total: 1241, km: 80100, obs: 'Revisão programada dos 80k km. Cliente aprovou todos os itens.'
  },
  {
    id: 'os3', numero: 250, status: 'em_servico',
    cliente: 'Carlos Augusto Machado', veiculo: 'VW Gol G5 1.0', placa: 'PEL-1234',
    data: '2026-05-14', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Pastilha dianteira (par) Bosch', tipo: 'pecas', valor: 85 },
      { descricao: 'Disco dianteiro (par) Cofap', tipo: 'pecas', valor: 290 },
      { descricao: 'Fluido de freio DOT4', tipo: 'pecas', valor: 45 },
      { descricao: 'Mão de obra — freios dianteiros completo', tipo: 'servico', valor: 220 },
    ],
    total: 640, km: 87400, obs: 'Ruído ao frear e pedal mole. Discos com desgaste acima do limite.'
  },
  {
    id: 'os4', numero: 249, status: 'pronto',
    cliente: 'Andréia Pereira Lima', veiculo: 'Fiat Palio 1.4', placa: 'PEL-9012',
    data: '2026-05-13', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Caixa de câmbio revisada', tipo: 'pecas', valor: 1800 },
      { descricao: 'Óleo de câmbio 75W90', tipo: 'pecas', valor: 145 },
      { descricao: 'Rolamento de entrada', tipo: 'pecas', valor: 180 },
      { descricao: 'Mão de obra — câmbio manual completo', tipo: 'servico', valor: 680 },
    ],
    total: 2805, km: 107800, obs: 'Câmbio travando nas trocas. Peças repostas, testado e aprovado.'
  },
  {
    id: 'os5', numero: 248, status: 'aprovado',
    cliente: 'Luciane Moreira Dias', veiculo: 'Hyundai HB20 1.0', placa: 'PEL-6789',
    data: '2026-05-12', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Scanner diagnóstico — leitura de falhas', tipo: 'servico', valor: 150 },
      { descricao: 'Sensor de oxigênio (sonda lambda)', tipo: 'pecas', valor: 310 },
      { descricao: 'Bico injetor (limpeza ultrassom — 4)', tipo: 'servico', valor: 280 },
      { descricao: 'Mão de obra — injeção eletrônica', tipo: 'servico', valor: 320 },
    ],
    total: 1060, km: 43200, obs: 'Consumo elevado e perda de potência. Sistema de injeção limpo e sensor trocado.'
  },
  {
    id: 'os6', numero: 247, status: 'orcamento',
    cliente: 'Gilberto Ramos Ferreira', veiculo: 'VW Voyage 1.6', placa: 'PEL-2222',
    data: '2026-05-10', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Amortecedor dianteiro (par) Monroe', tipo: 'pecas', valor: 570 },
      { descricao: 'Batente + coxim (par)', tipo: 'pecas', valor: 140 },
      { descricao: 'Rolamento de roda dianteiro (par)', tipo: 'pecas', valor: 230 },
      { descricao: 'Mão de obra — suspensão dianteira', tipo: 'servico', valor: 320 },
    ],
    total: 1260, km: 132000, obs: 'Suspensão dianteira com folga e barulho. Aguardando confirmação do cliente.'
  },
  {
    id: 'os7', numero: 246, status: 'pronto',
    cliente: 'Rodrigo da Silva Santos', veiculo: 'GM Celta 1.0', placa: 'PEL-5678',
    data: '2026-05-10', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Alinhamento computadorizado 3D', tipo: 'servico', valor: 120 },
      { descricao: 'Balanceamento (4 rodas)', tipo: 'servico', valor: 80 },
      { descricao: 'Pneus 175/70 R13 Pirelli (4)', tipo: 'pecas', valor: 1040 },
    ],
    total: 1240, km: 62100, obs: 'Troca completa de pneus + alinhamento. Desgaste uniforme nas 4 rodas.'
  },
  {
    id: 'os8', numero: 245, status: 'entregue',
    cliente: 'Paulo César Borges', veiculo: 'Fiat Uno 1.0', placa: 'PEL-1111',
    data: '2026-05-13', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Sistema de freio traseiro completo', tipo: 'pecas', valor: 380 },
      { descricao: 'Cilindro de roda (par)', tipo: 'pecas', valor: 120 },
      { descricao: 'Mangueira de freio traseira', tipo: 'pecas', valor: 95 },
      { descricao: 'Mão de obra — freio tambor traseiro', tipo: 'servico', valor: 280 },
    ],
    total: 875, km: 94200, obs: 'Freio traseiro com vazamento. Kit completo trocado.', pagamento: 'pix'
  },
  {
    id: 'os9', numero: 244, status: 'entregue',
    cliente: 'Fernanda Duarte Costa', veiculo: 'VW Fox 1.0', placa: 'PEL-7890',
    data: '2026-05-08', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Troca de óleo 5W30 sintético 4L', tipo: 'pecas', valor: 152 },
      { descricao: 'Filtro de óleo Mann', tipo: 'pecas', valor: 25 },
      { descricao: 'Filtro de ar Mann', tipo: 'pecas', valor: 32 },
      { descricao: 'Mão de obra — troca óleo + filtros', tipo: 'servico', valor: 80 },
    ],
    total: 289, km: 71300, obs: '', pagamento: 'pix'
  },
  {
    id: 'os10', numero: 243, status: 'entregue',
    cliente: 'José Alberto Nunes', veiculo: 'GM Corsa Sedan 1.0', placa: 'PEL-2345',
    data: '2026-05-03', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Kit embreagem Sachs (disco + platô)', tipo: 'pecas', valor: 580 },
      { descricao: 'Rolamento de embreagem', tipo: 'pecas', valor: 110 },
      { descricao: 'Cilindro mestre + escravo', tipo: 'pecas', valor: 240 },
      { descricao: 'Mão de obra — embreagem completa', tipo: 'servico', valor: 580 },
    ],
    total: 1510, km: 118500, obs: 'Embreagem patinando. Kit completo trocado. Cilindros com vazamento também trocados.', pagamento: 'credito'
  },
  {
    id: 'os11', numero: 242, status: 'entregue',
    cliente: 'Rosana Teixeira Alves', veiculo: 'GM Spin 1.8', placa: 'PEL-3333',
    data: '2026-05-07', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Higienização completa do ar condicionado', tipo: 'servico', valor: 180 },
      { descricao: 'Recarga de gás R134a 900g', tipo: 'servico', valor: 220 },
      { descricao: 'Filtro de cabine Mann', tipo: 'pecas', valor: 55 },
      { descricao: 'Resistência do ventilador', tipo: 'pecas', valor: 120 },
    ],
    total: 575, km: 86400, obs: 'Ar não gelava e com cheiro. Higienização + recarga + resistência trocada.', pagamento: 'pix'
  },
  {
    id: 'os12', numero: 241, status: 'entregue',
    cliente: 'Andréia Pereira Lima', veiculo: 'Fiat Palio 1.4', placa: 'PEL-9012',
    data: '2026-05-05', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Pintura — porta dianteira direita', tipo: 'servico', valor: 780 },
      { descricao: 'Lanternagem — amassado lateral', tipo: 'servico', valor: 420 },
      { descricao: 'Materiais — tinta, massa, lixa', tipo: 'pecas', valor: 380 },
    ],
    total: 1580, km: 106200, obs: 'Amassado e arranhão na porta direita. Cor combinada perfeitamente.', pagamento: 'dinheiro'
  },
  {
    id: 'os13', numero: 240, status: 'entregue',
    cliente: 'Paulo César Borges', veiculo: 'Fiat Uno 1.0', placa: 'PEL-1111',
    data: '2026-05-02', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Bateria 60Ah Moura', tipo: 'pecas', valor: 480 },
      { descricao: 'Bornes + terminais', tipo: 'pecas', valor: 45 },
      { descricao: 'Diagnóstico sistema de carga', tipo: 'servico', valor: 120 },
    ],
    total: 645, km: 93700, obs: 'Não partia. Bateria morta. Alternador testado OK.', pagamento: 'pix'
  },

  // ── Abril 2026 — Histórico entregue ──
  {
    id: 'os14', numero: 239, status: 'entregue',
    cliente: 'Rosana Teixeira Alves', veiculo: 'GM Spin 1.8', placa: 'PEL-3333',
    data: '2026-04-28', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Injeção eletrônica — limpeza bicos (4)', tipo: 'servico', valor: 280 },
      { descricao: 'Sensor de temperatura do motor', tipo: 'pecas', valor: 190 },
      { descricao: 'Cabo sensor de rotação (rpm)', tipo: 'pecas', valor: 145 },
      { descricao: 'Mão de obra — diagnóstico e elétrica', tipo: 'servico', valor: 380 },
    ],
    total: 995, km: 85100, obs: '', pagamento: 'debito'
  },
  {
    id: 'os15', numero: 238, status: 'entregue',
    cliente: 'Carlos Augusto Machado', veiculo: 'VW Gol G5 1.0', placa: 'PEL-1234',
    data: '2026-04-22', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Retífica de cabeçote completa', tipo: 'servico', valor: 1400 },
      { descricao: 'Junta do cabeçote', tipo: 'pecas', valor: 280 },
      { descricao: 'Válvulas de admissão e escapamento (8)', tipo: 'pecas', valor: 480 },
      { descricao: 'Mão de obra — desmontagem e montagem motor', tipo: 'servico', valor: 850 },
    ],
    total: 3010, km: 86800, obs: 'Motor superaquecendo. Cabeçote empenado. Retificado e revisado.', pagamento: 'credito'
  },
  {
    id: 'os16', numero: 237, status: 'entregue',
    cliente: 'Paulo César Borges', veiculo: 'Fiat Uno 1.0', placa: 'PEL-1111',
    data: '2026-04-18', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Caixa de câmbio revisada (5 marchas)', tipo: 'pecas', valor: 1650 },
      { descricao: 'Óleo de câmbio 75W90 1L', tipo: 'pecas', valor: 95 },
      { descricao: 'Semi-eixo (homocinética) direito', tipo: 'pecas', valor: 380 },
      { descricao: 'Mão de obra — câmbio + homocinética', tipo: 'servico', valor: 680 },
    ],
    total: 2805, km: 93200, obs: 'Câmbio com barulho e homocinética batendo. Revisão completa realizada.', pagamento: 'dinheiro'
  },
  {
    id: 'os17', numero: 236, status: 'entregue',
    cliente: 'Marcos Henrique Oliveira', veiculo: 'VW Saveiro 1.6', placa: 'PEL-3456',
    data: '2026-04-15', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Sistema de freio completo (4 rodas)', tipo: 'pecas', valor: 680 },
      { descricao: 'Disco dianteiro (par)', tipo: 'pecas', valor: 290 },
      { descricao: 'Fluido DOT4 + sangria', tipo: 'pecas', valor: 65 },
      { descricao: 'Mão de obra — freios completos', tipo: 'servico', valor: 380 },
    ],
    total: 1415, km: 79200, obs: 'Freio pedal esponjoso e risco nos discos. Sistema todo revisado.', pagamento: 'pix'
  },
  {
    id: 'os18', numero: 235, status: 'entregue',
    cliente: 'Luciane Moreira Dias', veiculo: 'Hyundai HB20 1.0', placa: 'PEL-6789',
    data: '2026-04-10', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Correia dentada + tensor + polia', tipo: 'pecas', valor: 380 },
      { descricao: 'Bomba d\'água', tipo: 'pecas', valor: 185 },
      { descricao: 'Líquido de arrefecimento 2L', tipo: 'pecas', valor: 64 },
      { descricao: 'Mão de obra — kit distribuição completo', tipo: 'servico', valor: 450 },
    ],
    total: 1079, km: 60800, obs: 'Revisão preventiva dos 60k km. Todos itens do kit trocados.', pagamento: 'pix'
  },
  {
    id: 'os19', numero: 234, status: 'entregue',
    cliente: 'José Alberto Nunes', veiculo: 'GM Corsa Sedan 1.0', placa: 'PEL-2345',
    data: '2026-04-05', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Motor de arranque revisado', tipo: 'pecas', valor: 380 },
      { descricao: 'Bateria 45Ah Moura', tipo: 'pecas', valor: 380 },
      { descricao: 'Alternador revisado', tipo: 'pecas', valor: 520 },
      { descricao: 'Mão de obra — sistema de carga completo', tipo: 'servico', valor: 420 },
    ],
    total: 1700, km: 117900, obs: 'Não carregava a bateria e o arranque falhava. Sistema de carga todo revisado.', pagamento: 'credito'
  },

  // ── Março 2026 — Histórico entregue ──
  {
    id: 'os20', numero: 233, status: 'entregue',
    cliente: 'Fernanda Duarte Costa', veiculo: 'VW Fox 1.0', placa: 'PEL-7890',
    data: '2026-03-28', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Kit freio completo dianteiro + traseiro', tipo: 'pecas', valor: 520 },
      { descricao: 'Tambores traseiros (par)', tipo: 'pecas', valor: 180 },
      { descricao: 'Mão de obra — revisão freios completa', tipo: 'servico', valor: 320 },
    ],
    total: 1020, km: 70800, obs: '', pagamento: 'pix'
  },
  {
    id: 'os21', numero: 232, status: 'entregue',
    cliente: 'Gilberto Ramos Ferreira', veiculo: 'VW Voyage 1.6', placa: 'PEL-2222',
    data: '2026-03-24', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Kit embreagem LUK (disco + platô)', tipo: 'pecas', valor: 620 },
      { descricao: 'Cilindro mestre de embreagem', tipo: 'pecas', valor: 195 },
      { descricao: 'Cabo de embreagem', tipo: 'pecas', valor: 85 },
      { descricao: 'Mão de obra — embreagem completa', tipo: 'servico', valor: 480 },
    ],
    total: 1380, km: 131400, obs: '', pagamento: 'dinheiro'
  },
  {
    id: 'os22', numero: 231, status: 'entregue',
    cliente: 'Carlos Augusto Machado', veiculo: 'VW Gol G5 1.0', placa: 'PEL-1234',
    data: '2026-03-20', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Revisão geral 100.000 km', tipo: 'servico', valor: 200 },
      { descricao: 'Correia dentada + tensor', tipo: 'pecas', valor: 290 },
      { descricao: 'Filtros (óleo + ar + combustível)', tipo: 'pecas', valor: 82 },
      { descricao: 'Velas NGK (4)', tipo: 'pecas', valor: 72 },
      { descricao: 'Troca óleo 5W30 sintético 4L', tipo: 'pecas', valor: 152 },
      { descricao: 'Mão de obra completa', tipo: 'servico', valor: 420 },
    ],
    total: 1216, km: 99800, obs: 'Revisão completa dos 100k km. Tudo dentro do esperado.', pagamento: 'pix'
  },
  {
    id: 'os23', numero: 230, status: 'entregue',
    cliente: 'Rodrigo da Silva Santos', veiculo: 'GM Celta 1.0', placa: 'PEL-5678',
    data: '2026-03-15', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Suspensão dianteira completa — bandeja + pivô', tipo: 'pecas', valor: 680 },
      { descricao: 'Amortecedor dianteiro (par)', tipo: 'pecas', valor: 420 },
      { descricao: 'Mão de obra — suspensão dianteira', tipo: 'servico', valor: 420 },
    ],
    total: 1520, km: 61800, obs: '', pagamento: 'credito'
  },
  {
    id: 'os24', numero: 229, status: 'entregue',
    cliente: 'José Alberto Nunes', veiculo: 'GM Corsa Sedan 1.0', placa: 'PEL-2345',
    data: '2026-03-10', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Scanner elétrico + diagnóstico injeção', tipo: 'servico', valor: 180 },
      { descricao: 'Bicos injetores (limpeza + teste — 4)', tipo: 'servico', valor: 280 },
      { descricao: 'Regulador de pressão de combustível', tipo: 'pecas', valor: 195 },
      { descricao: 'Mão de obra', tipo: 'servico', valor: 220 },
    ],
    total: 875, km: 117500, obs: '', pagamento: 'pix'
  },
  {
    id: 'os25', numero: 228, status: 'entregue',
    cliente: 'Rosana Teixeira Alves', veiculo: 'GM Spin 1.8', placa: 'PEL-3333',
    data: '2026-03-05', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Pintura total — capô + teto + para-choque', tipo: 'servico', valor: 2200 },
      { descricao: 'Lanternagem — amassados laterais', tipo: 'servico', valor: 680 },
      { descricao: 'Materiais (tinta poliuretano, lixa, massa)', tipo: 'pecas', valor: 580 },
    ],
    total: 3460, km: 84500, obs: 'Pintura oxidada e arranhões. Carro saiu novo.', pagamento: 'credito'
  },
  {
    id: 'os26', numero: 227, status: 'entregue',
    cliente: 'Marcos Henrique Oliveira', veiculo: 'VW Saveiro 1.6', placa: 'PEL-3456',
    data: '2026-03-01', tecnico: 'Carlos Machado',
    servicos: [
      { descricao: 'Troca de óleo 5W40 mineral 4L', tipo: 'pecas', valor: 110 },
      { descricao: 'Filtro de óleo + ar + combustível', tipo: 'pecas', valor: 82 },
      { descricao: 'Mão de obra', tipo: 'servico', valor: 80 },
    ],
    total: 272, km: 78900, obs: '', pagamento: 'pix'
  },
]

// ── Estoque ───────────────────────────────────────────────────────────────────
export const DEMO_ESTOQUE = [
  { id: 'e1',  nome: 'Pastilha de freio dianteira (par)', marca: 'Bosch',    categoria: 'Freios',       quantidade: 18, minimo: 8,  custo: 58,  venda: 85,  codigo: 'PF-001' },
  { id: 'e2',  nome: 'Óleo motor 5W30 sintético 1L',      marca: 'Mobil',    categoria: 'Lubrificante', quantidade: 24, minimo: 12, custo: 28,  venda: 38,  codigo: 'OL-001' },
  { id: 'e3',  nome: 'Filtro de óleo Mann',                marca: 'Mann',     categoria: 'Filtros',      quantidade: 26, minimo: 8,  custo: 15,  venda: 25,  codigo: 'FO-001' },
  { id: 'e4',  nome: 'Filtro de ar Mann',                  marca: 'Mann',     categoria: 'Filtros',      quantidade: 14, minimo: 6,  custo: 22,  venda: 32,  codigo: 'FA-001' },
  { id: 'e5',  nome: 'Disco de freio dianteiro Cofap',     marca: 'Cofap',    categoria: 'Freios',       quantidade: 10, minimo: 6,  custo: 98,  venda: 145, codigo: 'DF-001' },
  { id: 'e6',  nome: 'Correia dentada Gates',              marca: 'Gates',    categoria: 'Motor',        quantidade: 9,  minimo: 4,  custo: 65,  venda: 95,  codigo: 'CD-001' },
  { id: 'e7',  nome: 'Vela de ignição NGK',                marca: 'NGK',      categoria: 'Ignição',      quantidade: 40, minimo: 12, custo: 12,  venda: 18,  codigo: 'VI-001' },
  { id: 'e8',  nome: 'Fluido de freio DOT4 500ml',         marca: 'Bosch',    categoria: 'Freios',       quantidade: 12, minimo: 6,  custo: 18,  venda: 28,  codigo: 'FF-001' },
  { id: 'e9',  nome: 'Rolamento de roda FAG',              marca: 'FAG',      categoria: 'Suspensão',    quantidade: 8,  minimo: 4,  custo: 78,  venda: 115, codigo: 'RR-001' },
  { id: 'e10', nome: 'Amortecedor dianteiro Monroe',       marca: 'Monroe',   categoria: 'Suspensão',    quantidade: 8,  minimo: 6,  custo: 190, venda: 285, codigo: 'AM-001' },
  { id: 'e11', nome: 'Filtro de combustível Mann',         marca: 'Mann',     categoria: 'Filtros',      quantidade: 16, minimo: 6,  custo: 24,  venda: 35,  codigo: 'FC-001' },
  { id: 'e12', nome: 'Líquido de arrefecimento 1L',        marca: 'Comma',    categoria: 'Refrigeração', quantidade: 14, minimo: 8,  custo: 22,  venda: 32,  codigo: 'LA-001' },
  { id: 'e13', nome: 'Correia do alternador Gates',        marca: 'Gates',    categoria: 'Motor',        quantidade: 9,  minimo: 4,  custo: 45,  venda: 65,  codigo: 'CA-001' },
  { id: 'e14', nome: 'Tensor da correia dentada INA',      marca: 'INA',      categoria: 'Motor',        quantidade: 7,  minimo: 3,  custo: 85,  venda: 125, codigo: 'TC-001' },
  { id: 'e15', nome: 'Cabo de vela Bosch (jogo)',          marca: 'Bosch',    categoria: 'Ignição',      quantidade: 7,  minimo: 4,  custo: 50,  venda: 72,  codigo: 'CV-001' },
  { id: 'e16', nome: 'Pastilha de freio traseira (par)',   marca: 'Bosch',    categoria: 'Freios',       quantidade: 12, minimo: 8,  custo: 42,  venda: 65,  codigo: 'PT-001' },
  { id: 'e17', nome: 'Filtro de cabine Mann',              marca: 'Mann',     categoria: 'Filtros',      quantidade: 10, minimo: 6,  custo: 35,  venda: 55,  codigo: 'FCB-001' },
  { id: 'e18', nome: 'Bomba d\'água Bosch',                marca: 'Bosch',    categoria: 'Motor',        quantidade: 6,  minimo: 2,  custo: 120, venda: 185, codigo: 'BA-001' },
  { id: 'e19', nome: 'Kit embreagem Sachs',                marca: 'Sachs',    categoria: 'Motor',        quantidade: 4,  minimo: 2,  custo: 380, venda: 580, codigo: 'KE-001' },
  { id: 'e20', nome: 'Bateria 60Ah Moura',                 marca: 'Moura',    categoria: 'Ignição',      quantidade: 5,  minimo: 3,  custo: 320, venda: 480, codigo: 'BT-001' },
  { id: 'e21', nome: 'Pneu 175/70 R13 Pirelli',            marca: 'Pirelli',  categoria: 'Suspensão',    quantidade: 8,  minimo: 4,  custo: 195, venda: 260, codigo: 'PN-001' },
  { id: 'e22', nome: 'Óleo de câmbio 75W90 1L',            marca: 'Mobil',    categoria: 'Lubrificante', quantidade: 9,  minimo: 5,  custo: 45,  venda: 65,  codigo: 'OC-001' },
]

// ── Financeiro ────────────────────────────────────────────────────────────────
export const DEMO_FINANCEIRO = {
  marco_2026: {
    mes: 2, ano: 2026,
    receitas: [
      { descricao: 'OS #228 — Spin (Pintura + lanternagem completa)',   valor: 3460, data: '2026-03-05', placa: 'PEL-3333' },
      { descricao: 'OS #227 — Gol (Retífica cabeçote completa)',        valor: 3010, data: '2026-03-08', placa: 'PEL-1234' },
      { descricao: 'OS #224 — Uno (Câmbio manual — revisão)',           valor: 2580, data: '2026-03-17', placa: 'PEL-1111' },
      { descricao: 'OS #223 — Voyage (Freios + suspensão dianteira)',   valor: 1850, data: '2026-03-22', placa: 'PEL-2222' },
      { descricao: 'OS #222 — Saveiro (Suspensão + amortecedor)',       valor: 1640, data: '2026-03-19', placa: 'PEL-3456' },
      { descricao: 'OS #230 — Celta (Suspensão dianteira completa)',    valor: 1520, data: '2026-03-15', placa: 'PEL-5678' },
      { descricao: 'OS #226 — Palio (Correia dentada + kit completo)',  valor: 1420, data: '2026-03-12', placa: 'PEL-9012' },
      { descricao: 'OS #225 — HB20 (Freios 4 rodas)',                   valor: 1280, data: '2026-03-10', placa: 'PEL-6789' },
      { descricao: 'OS #231 — Fox (Revisão geral 80k)',                 valor: 1216, data: '2026-03-20', placa: 'PEL-7890' },
      { descricao: 'OS #221 — HB20 (Revisão 60k + correia)',            valor: 1499, data: '2026-03-27', placa: 'PEL-6789' },
      { descricao: 'OS #229 — Corsa (Injeção eletrônica completa)',     valor: 875,  data: '2026-03-24', placa: 'PEL-2345' },
      { descricao: 'OS #220 — Uno (Sistema elétrico — alternador)',     valor: 780,  data: '2026-03-25', placa: 'PEL-1111' },
      { descricao: 'OS #219 — Saveiro (Óleo + filtros + balanceamento)',valor: 540,  data: '2026-03-28', placa: 'PEL-3456' },
      { descricao: 'OS #218 — Spin (Troca de óleo + filtros)',          valor: 320,  data: '2026-03-29', placa: 'PEL-3333' },
      { descricao: 'OS #217 — Fox (Alinhamento + balanceamento)',       valor: 210,  data: '2026-03-30', placa: 'PEL-7890' },
    ],
    despesas: [
      { descricao: 'Aluguel do galpão',          valor: 1800, data: '2026-03-05', categoria: 'Fixo' },
      { descricao: 'Energia elétrica',            valor: 680,  data: '2026-03-10', categoria: 'Fixo' },
      { descricao: 'Compra de peças — NF 8612',  valor: 1960, data: '2026-03-04', categoria: 'Estoque' },
      { descricao: 'Compra de peças — NF 8598',  valor: 1080, data: '2026-03-14', categoria: 'Estoque' },
      { descricao: 'Internet + telefone',         valor: 180,  data: '2026-03-05', categoria: 'Fixo' },
      { descricao: 'Salário auxiliar mecânico',   valor: 1000, data: '2026-03-05', categoria: 'Pessoal' },
    ],
    totalReceitas: 22200,
    totalDespesas: 6700,
  },
  abril_2026: {
    mes: 3, ano: 2026,
    receitas: [
      { descricao: 'OS #238 — Gol (Motor — pistões + anéis + retífica)', valor: 3800, data: '2026-04-22', placa: 'PEL-1234' },
      { descricao: 'OS #237 — Saveiro (Câmbio + homocinética)',           valor: 3200, data: '2026-04-18', placa: 'PEL-3456' },
      { descricao: 'OS #236 — Uno (Revisão completa + câmbio)',           valor: 2805, data: '2026-04-15', placa: 'PEL-1111' },
      { descricao: 'OS #235 — Corsa (Suspensão + amortecedor 4 rodas)',   valor: 2640, data: '2026-04-10', placa: 'PEL-2345' },
      { descricao: 'OS #234 — Fox (Freio + suspensão dianteira)',         valor: 1980, data: '2026-04-05', placa: 'PEL-7890' },
      { descricao: 'OS #233 — Spin (Sistema de arrefecimento)',           valor: 1700, data: '2026-04-02', placa: 'PEL-3333' },
      { descricao: 'OS #232 — Celta (Kit embreagem + cilindros)',         valor: 1560, data: '2026-04-07', placa: 'PEL-5678' },
      { descricao: 'OS #231 — HB20 (Correia dentada + bomba)',            valor: 1415, data: '2026-04-12', placa: 'PEL-6789' },
      { descricao: 'OS #230 — Voyage (Injeção eletrônica)',               valor: 1079, data: '2026-04-16', placa: 'PEL-2222' },
      { descricao: 'OS #229 — Gol (Ar condicionado completo)',            valor: 890,  data: '2026-04-20', placa: 'PEL-1234' },
      { descricao: 'OS #228 — Palio (Freios traseiros + tambores)',       valor: 780,  data: '2026-04-24', placa: 'PEL-9012' },
      { descricao: 'OS #227 — Spin (Bateria + alternador revisado)',      valor: 680,  data: '2026-04-26', placa: 'PEL-3333' },
      { descricao: 'OS #226 — Saveiro (Revisão geral + óleo)',            valor: 541,  data: '2026-04-29', placa: 'PEL-3456' },
      { descricao: 'OS #225 — Fox (Alinhamento 3D + pneu)',               valor: 480,  data: '2026-04-28', placa: 'PEL-7890' },
      { descricao: 'OS #224 — HB20 (Elétrica — sensor + fiação)',         valor: 800,  data: '2026-04-30', placa: 'PEL-6789' },
    ],
    despesas: [
      { descricao: 'Aluguel do galpão',          valor: 1800, data: '2026-04-05', categoria: 'Fixo' },
      { descricao: 'Energia elétrica',            valor: 780,  data: '2026-04-10', categoria: 'Fixo' },
      { descricao: 'Compra de peças — NF 8740',  valor: 2100, data: '2026-04-03', categoria: 'Estoque' },
      { descricao: 'Compra de peças — NF 8768',  valor: 1420, data: '2026-04-17', categoria: 'Estoque' },
      { descricao: 'Internet + telefone',         valor: 180,  data: '2026-04-05', categoria: 'Fixo' },
      { descricao: 'Salário auxiliar mecânico',   valor: 1000, data: '2026-04-05', categoria: 'Pessoal' },
    ],
    totalReceitas: 24350,
    totalDespesas: 7280,
  },
  maio_2026: {
    mes: 4, ano: 2026,
    receitas: [
      { descricao: 'OS #249 — Palio (Câmbio manual completo)',          valor: 2805, data: '2026-05-13', placa: 'PEL-9012' },
      { descricao: 'OS #252 — Spin (Suspensão traseira — em andamento)',valor: 2170, data: '2026-05-15', placa: 'PEL-3333' },
      { descricao: 'OS #241 — Palio (Pintura + lanternagem)',           valor: 1580, data: '2026-05-05', placa: 'PEL-9012' },
      { descricao: 'OS #248b — Gol (Arranque + alternador + fiação)',   valor: 1480, data: '2026-05-09', placa: 'PEL-1234' },
      { descricao: 'OS #243 — Corsa (Kit embreagem completo)',          valor: 1510, data: '2026-05-03', placa: 'PEL-2345' },
      { descricao: 'OS #247b — Voyage (Suspensão dianteira)',           valor: 1260, data: '2026-05-10', placa: 'PEL-2222' },
      { descricao: 'OS #251b — Saveiro (Revisão 80k aprovada)',         valor: 1241, data: '2026-05-14', placa: 'PEL-3456' },
      { descricao: 'OS #246 — Celta (Pneus novos + alinhamento)',       valor: 1240, data: '2026-05-10', placa: 'PEL-5678' },
      { descricao: 'OS #243b — Fox (Revisão geral 90k)',                valor: 1200, data: '2026-05-06', placa: 'PEL-7890' },
      { descricao: 'OS #248 — HB20 (Injeção eletrônica)',               valor: 1060, data: '2026-05-12', placa: 'PEL-6789' },
      { descricao: 'OS #244b — Spin (Freios 4 rodas completo)',         valor: 980,  data: '2026-05-04', placa: 'PEL-3333' },
      { descricao: 'OS #245 — Uno (Freio traseiro completo)',           valor: 875,  data: '2026-05-13', placa: 'PEL-1111' },
      { descricao: 'OS #242b — Gol (Ar condicionado + recarga)',        valor: 820,  data: '2026-05-11', placa: 'PEL-1234' },
      { descricao: 'OS #240 — Uno (Bateria Moura + diagnóstico)',       valor: 645,  data: '2026-05-02', placa: 'PEL-1111' },
      { descricao: 'OS #242 — Spin (Ar condicionado — higienização)',   valor: 575,  data: '2026-05-07', placa: 'PEL-3333' },
      { descricao: 'OS #246b — Voyage (Freio + alinhamento)',           valor: 850,  data: '2026-05-08', placa: 'PEL-2222' },
      { descricao: 'OS #244 — Fox (Troca de óleo + filtros)',           valor: 289,  data: '2026-05-08', placa: 'PEL-7890' },
    ],
    despesas: [
      { descricao: 'Aluguel do galpão',          valor: 1800, data: '2026-05-05', categoria: 'Fixo' },
      { descricao: 'Energia elétrica (parcial)',  valor: 370,  data: '2026-05-12', categoria: 'Fixo' },
      { descricao: 'Compra de peças — NF 8821',  valor: 1530, data: '2026-05-02', categoria: 'Estoque' },
      { descricao: 'Internet + telefone',         valor: 180,  data: '2026-05-05', categoria: 'Fixo' },
      { descricao: 'Salário auxiliar mecânico',   valor: 1200, data: '2026-05-05', categoria: 'Pessoal' },
    ],
    totalReceitas: 20580,
    totalDespesas: 5080,
  },
}

export const DEMO_MESES_KEYS   = ['marco_2026', 'abril_2026', 'maio_2026']
export const DEMO_MESES_LABELS = {
  marco_2026: 'Março 2026',
  abril_2026: 'Abril 2026',
  maio_2026:  'Maio 2026',
}
