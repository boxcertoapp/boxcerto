import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const blogDir = path.join(publicDir, 'blog')
const categoryDir = path.join(blogDir, 'categoria')
const site = 'https://www.boxcerto.com'
const today = '2026-05-26'

const categories = [
  { slug: 'todos', label: 'Todos', count: 48 },
  { slug: 'gestao', label: 'Gestão', count: 14 },
  { slug: 'whatsapp', label: 'WhatsApp', count: 9 },
  { slug: 'financeiro', label: 'Financeiro', count: 11 },
  { slug: 'operacoes', label: 'Operações', count: 8 },
  { slug: 'marketing', label: 'Marketing', count: 6 },
]

const authors = {
  'rafael-mota': {
    name: 'Rafael Mota',
    role: 'Conteúdo BoxCerto',
    bio: 'Apaixonado por gestão de oficinas, escreve sobre OS digital, atendimento e organização com foco na rotina prática de oficinas independentes.',
    initials: 'RM',
  },
  'carla-bertolini': {
    name: 'Carla Bertolini',
    role: 'Conteúdo BoxCerto',
    bio: 'Apaixonada pelo mundo automotivo, escreve sobre atendimento, vendas e relacionamento com clientes para oficinas que querem trabalhar com mais organização.',
    initials: 'CB',
  },
  'tiago-azevedo': {
    name: 'Tiago Azevedo',
    role: 'Conteúdo BoxCerto',
    bio: 'Escreve sobre financeiro, precificação e fluxo de caixa para oficinas pequenas, sempre com linguagem prática aplicada ao dia a dia.',
    initials: 'TA',
  },
}

const posts = [
  {
    slug: 'orcamento-whatsapp-modelos',
    title: 'Orçamento pelo WhatsApp: 7 modelos prontos para fechar mais serviços',
    excerpt: 'Modelos testados que aumentam em até 38% a taxa de aprovação. Inclui templates para revisão, troca de peça, retorno e cliente que “vai pensar”.',
    category: 'whatsapp',
    author: 'carla-bertolini',
    date: '2026-05-21',
    readingTime: 9,
    featured: true,
    hero: { kind: 'phone-orc', caption: 'Orçamento aprovado em 1 clique' },
    tags: ['WhatsApp', 'Vendas', 'Conversão'],
  },
  {
    slug: 'precificar-servicos-oficina',
    title: 'Como precificar serviços na oficina sem perder o cliente',
    excerpt: 'A fórmula que considera hora-homem, ocupação da baia e margem real sem chutar valor olhando para a concorrência.',
    category: 'financeiro',
    author: 'tiago-azevedo',
    date: '2026-05-14',
    readingTime: 12,
    hero: { kind: 'calc', caption: 'Calculadora de hora-homem' },
    tags: ['Preço', 'Margem', 'Hora-homem'],
  },
  {
    slug: 'os-digital-papel',
    title: 'Ordem de serviço digital: por que parar de usar papel agora',
    excerpt: 'Oficinas que migraram a OS para o digital reduziram retrabalho e ganharam clareza entre entrada do carro, aprovação e execução.',
    category: 'operacoes',
    author: 'rafael-mota',
    date: '2026-05-09',
    readingTime: 7,
    hero: { kind: 'doc', caption: 'OS #0428 - Civic 2019' },
    tags: ['OS', 'Operação'],
  },
  {
    slug: 'estoque-pecas-guia-2026',
    title: 'Gestão de estoque de peças: o guia completo para 2026',
    excerpt: 'Curva ABC, giro mínimo, peças de alto risco. Como descobrir o que está parando dinheiro na prateleira.',
    category: 'gestao',
    author: 'rafael-mota',
    date: '2026-04-28',
    readingTime: 18,
    hero: { kind: 'shelf', caption: 'Curva ABC aplicada' },
    tags: ['Estoque', 'Peças', 'Curva ABC'],
  },
  {
    slug: 'nfse-oficina-mecanica',
    title: 'NFS-e para oficina mecânica: passo a passo descomplicado',
    excerpt: 'Diferença entre NFS-e e NF-e, como emitir com mais segurança, e os erros fiscais que mais geram retrabalho.',
    category: 'financeiro',
    author: 'tiago-azevedo',
    date: '2026-04-22',
    readingTime: 11,
    hero: { kind: 'nfe', caption: 'Modelo NFS-e municipal' },
    tags: ['Fiscal', 'NFS-e', 'Contabilidade'],
  },
  {
    slug: 'kpis-oficina',
    title: '10 KPIs que toda oficina mecânica deveria acompanhar',
    excerpt: 'Ticket médio, retorno em 90 dias, ocupação de baia. Os números que separam oficina amadora de operação profissional.',
    category: 'gestao',
    author: 'rafael-mota',
    date: '2026-04-14',
    readingTime: 10,
    hero: { kind: 'chart', caption: 'Painel de KPIs' },
    tags: ['KPI', 'Indicadores'],
  },
  {
    slug: 'recorrencia-clientes',
    title: 'Como aumentar a recorrência de clientes na oficina',
    excerpt: 'Lembrete de revisão automatizado, pós-venda 30 dias, e o template de WhatsApp que faz o cliente voltar.',
    category: 'marketing',
    author: 'carla-bertolini',
    date: '2026-04-02',
    readingTime: 8,
    hero: { kind: 'loop', caption: 'Funil de recorrência' },
    tags: ['Retenção', 'Marketing'],
  },
  {
    slug: 'atendimento-humanizado',
    title: 'Atendimento humanizado: o diferencial que vende manutenção preventiva',
    excerpt: 'Por que perguntar “como o carro tem se comportado?” fecha mais serviço do que qualquer promoção genérica.',
    category: 'marketing',
    author: 'carla-bertolini',
    date: '2026-03-26',
    readingTime: 6,
    hero: { kind: 'chat', caption: 'Roteiro de conversa' },
    tags: ['Atendimento', 'Preventiva'],
  },
  {
    slug: 'escolher-sistema-oficina',
    title: 'Aplicativo para oficina: como escolher o melhor sistema',
    excerpt: 'Checklist com 22 itens. O que importa de verdade na hora de migrar do caderno ou da planilha para um sistema.',
    category: 'gestao',
    author: 'rafael-mota',
    date: '2026-03-18',
    readingTime: 14,
    hero: { kind: 'compare', caption: 'Comparativo de sistemas' },
    tags: ['Tecnologia', 'Sistema'],
  },
]

const guideLinks = [
  ['Planilha de OS grátis', '/planilha-os-oficina-mecanica-gratis', 'Ordem de serviço'],
  ['Modelo de orçamento grátis', '/modelo-orcamento-oficina-mecanica-gratis', 'WhatsApp'],
  ['Calculadora de mão de obra', '/calculadora-mao-de-obra-oficina-mecanica', 'Financeiro'],
  ['Planilha de fluxo de caixa', '/planilha-fluxo-caixa-oficina-mecanica-gratis', 'Financeiro'],
  ['Planilha de estoque de peças', '/planilha-estoque-pecas-oficina-gratis', 'Estoque'],
  ['Guias por assunto', '/blog/guias-oficina-mecanica', 'Biblioteca'],
]

const postContent = {
  'orcamento-whatsapp-modelos': {
    lead: 'O cliente já está no WhatsApp. A pergunta não é mais se você vai mandar orçamento por lá. É como. Reunimos modelos testados em oficinas para deixar valor, prazo e aprovação mais claros.',
    toc: [
      ['por-que-importa', 'Por que o formato importa'],
      ['modelo-1', 'Modelo 1 - Revisão programada'],
      ['modelo-2', 'Modelo 2 - Troca de peça urgente'],
      ['modelo-3', 'Modelo 3 - Cliente que vai pensar'],
      ['checklist-final', 'Checklist antes de enviar'],
    ],
    blocks: [
      { kind: 'h2', id: 'por-que-importa', text: 'Por que o formato do orçamento importa' },
      { kind: 'p', text: 'Um orçamento mal formatado no WhatsApp é o equivalente a entregar um papel sujo no balcão: o cliente lê, fica em dúvida e abre o concorrente. Quando o orçamento chega como link clicável, com itens detalhados e um botão verde de Aprovar, três coisas acontecem ao mesmo tempo.' },
      { kind: 'ul', items: ['O cliente não precisa interpretar: ele clica.', 'O “ok pode fazer” vira um registro com data e hora.', 'Você para de perder serviço por causa de ambiguidade.'] },
      { kind: 'stat', value: '+38%', label: 'de taxa de aprovação média quando o orçamento vai como link estruturado, comparado a texto solto.' },
      { kind: 'h2', id: 'modelo-1', text: 'Modelo 1 - Revisão programada' },
      { kind: 'p', text: 'Use quando o cliente já entrou na oficina, o carro está em checklist e você quer confirmar a revisão completa antes de começar. O tom é direto e tranquilizador.' },
      { kind: 'msg-you', text: 'Oi Marcos, tudo bem? Terminei o checklist do seu Corolla 2020 (placa GBT-2H45). Encontrei 3 itens para a revisão dos 60 mil km: troca de óleo + filtro, pastilhas dianteiras e velas. Anexei o orçamento detalhado abaixo. Se estiver tudo certo, é só aprovar pelo link.' },
      { kind: 'msg-card', title: 'Orçamento #1428 - Corolla 2020', price: 'R$ 1.247,00', items: ['Óleo motor 5W30 (4L)', 'Filtro de óleo + ar', 'Pastilhas de freio dianteiras', 'Velas (jogo)'], cta: 'Aprovar em 1 clique' },
      { kind: 'callout', title: 'Por que funciona', text: 'O cliente tem sensação de controle: ele sabe o que será feito, vê o valor antes de o serviço começar, e aprovar é mais fácil do que digitar uma resposta.' },
      { kind: 'h2', id: 'modelo-2', text: 'Modelo 2 - Troca de peça urgente' },
      { kind: 'p', text: 'Esse é o orçamento mais delicado. O cliente está sem o carro, ansioso, e qualquer hesitação custa caro. A regra de ouro: nunca abra com o valor. Abra com o problema, depois a consequência, depois o preço.' },
      { kind: 'msg-you', text: 'Joana, identifiquei o barulho. É o rolamento dianteiro direito. Já chegou no ponto em que continuar rodando pode danificar mais componentes. Tenho a peça em estoque e consigo entregar o carro hoje, 17h. Mando o orçamento aqui:' },
      { kind: 'cta-banner', headline: 'Chega de orçamento perdido no WhatsApp', subhead: 'No BoxCerto, você envia orçamento por link, registra aprovação e acompanha cada status da oficina.', href: '/cadastro?origem=artigo-whatsapp-cta' },
      { kind: 'h2', id: 'modelo-3', text: 'Modelo 3 - Cliente que vai pensar' },
      { kind: 'p', text: 'Aquele cliente que pediu orçamento, recebeu e sumiu. Em vez de mandar “e aí, decidiu?”, ofereça um caminho de menor atrito. Mostre que o orçamento tem validade, mas sem pressionar.' },
      { kind: 'msg-you', text: 'Oi Pedro, passando só para avisar que segurei a peça no nome do seu Onix até amanhã 18h. Depois disso ela volta para a prateleira e o valor pode mudar na próxima compra. Se quiser fechar, é só aprovar pelo link. Se não der dessa vez, me avisa que libero a peça.' },
      { kind: 'h2', id: 'checklist-final', text: 'Checklist antes de enviar' },
      { kind: 'checklist', items: ['O nome do cliente está correto?', 'O modelo e a placa do veículo estão no orçamento?', 'Cada item tem descrição clara?', 'O prazo está explícito?', 'O orçamento tem validade?', 'Tem botão de aprovar, não só PDF?'] },
      { kind: 'p', text: 'Se respondeu sim para os 6, manda. Aprovação em 1 clique é o padrão. Qualquer coisa abaixo disso já está atrasada para a rotina de uma oficina organizada.' },
    ],
    faq: [
      ['Posso usar esses modelos em qualquer oficina?', 'Sim, mas adapte o tom. Oficina de bairro tem uma proximidade diferente de oficina premium de marca. Os modelos servem como estrutura.'],
      ['Esses modelos funcionam para retífica e funilaria?', 'Os modelos 1, 2 e 3 funcionam bem quando você adapta peça, prazo, foto e etapas do serviço.'],
      ['O BoxCerto já tem esses modelos prontos?', 'Sim. O app ajuda a estruturar orçamento por link com aprovação registrada e histórico na OS.'],
    ],
  },
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function slugCategory(slug) {
  return categories.find((category) => category.slug === slug) || categories[0]
}

function fmtDate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${day} ${months[month - 1]} ${year}`
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c')
}

function logo() {
  return `<a class="bc-logo" href="/blog" aria-label="BoxCerto Blog">
  <img src="/logo.svg" width="36" height="36" alt="" loading="eager">
  <span>BoxCerto</span>
</a>`
}

function header({ active = 'todos', showRail = true } = {}) {
  const rail = categories.map((category) => `<a href="${category.slug === 'todos' ? '/blog' : `/blog/categoria/${category.slug}`}" class="bc-cat-pill${category.slug === active ? ' is-active' : ''}" data-category="${category.slug}">${esc(category.label)} <span>${category.count}</span></a>`).join('\n      ')
  const railBlock = showRail ? `<div class="bc-container bc-category-rail" data-category-rail>${rail}</div>` : ''
  return `<header class="bc-site-header">
  <div class="bc-container bc-topbar">
    ${logo()}
    <nav class="bc-nav" aria-label="Navegação principal">
      <a href="/lp">Produto</a>
      <a href="/lp#precos">Preços</a>
      <a href="/blog" aria-current="page">Blog</a>
      <a href="/diagnostico">Clientes</a>
    </nav>
    <div class="bc-actions">
      <form class="bc-search" role="search">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="search" placeholder="Buscar no blog..." aria-label="Buscar no blog" data-blog-search>
        <span>⌘K</span>
      </form>
      <button class="bc-icon-button" type="button" data-theme-toggle aria-label="Alternar tema">
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v2m0 14v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M3 12h2m14 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/><circle cx="12" cy="12" r="4"/></svg>
      </button>
      <a class="bc-btn bc-btn-ghost" href="/login">Entrar</a>
      <a class="bc-btn bc-btn-primary" href="/cadastro?origem=blog-nav">Teste 7 dias grátis</a>
      <button class="bc-menu-button" type="button" data-menu-toggle aria-label="Abrir menu"><span></span><span></span></button>
    </div>
  </div>
  <div class="bc-mobile-nav" data-mobile-nav>
    <a href="/lp">Produto</a>
    <a href="/lp#precos">Preços</a>
    <a href="/blog">Blog</a>
    <a href="/diagnostico">Clientes</a>
  </div>
${railBlock}
</header>`
}

function footer() {
  return `<footer class="bc-footer">
  <div class="bc-container bc-footer-grid">
    <div>
      ${logo()}
      <p>Sistema de gestão para oficina mecânica. Orçamento por WhatsApp, OS digital, estoque e financeiro no mesmo lugar.</p>
      <a class="bc-btn bc-btn-primary" href="/cadastro?origem=blog-footer">Teste grátis 7 dias</a>
    </div>
    <div><strong>Produto</strong><a href="/lp">Funcionalidades</a><a href="/lp#precos">Preços</a><a href="/cadastro">Teste grátis</a></div>
    <div><strong>Conteúdo</strong><a href="/blog">Blog</a><a href="/blog/guias-oficina-mecanica">Guias</a><a href="/planilha-os-oficina-mecanica-gratis">Planilha de OS</a></div>
    <div><strong>Empresa</strong><a href="/suporte">Suporte</a><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a></div>
  </div>
  <div class="bc-container bc-footer-bottom"><span>© 2026 BoxCerto Sistemas Ltda</span><span>v3.2 · blog para oficinas independentes</span></div>
</footer>`
}

function categoryPill(post) {
  const category = slugCategory(post.category)
  return `<span class="bc-pill">${esc(category.label)}</span>`
}

function authorChip(post, compact = false) {
  const author = authors[post.author]
  return `<div class="bc-author${compact ? ' compact' : ''}">
  <span>${esc(author.initials)}</span>
  <div><strong>${esc(author.name)}</strong><small>${fmtDate(post.date)} · ${post.readingTime} min de leitura</small></div>
</div>`
}

function visual(kind, caption) {
  const cap = `<div class="bc-vis-caption">${esc(caption)}</div>`
  if (kind === 'phone-orc') {
    return `<div class="bc-visual is-phone"><div class="bc-stripes"></div><div class="bc-phone-card">
      <i></i><small>BOXCERTO · ORÇ. #1428</small><strong>Corolla 2020 - Revisão 60k</strong>
      <p><span>Óleo + filtro</span><b>R$ 210</b></p><p><span>Pastilhas dianteiras</span><b>R$ 460</b></p><p><span>Velas (jogo)</span><b>R$ 180</b></p>
      <div><span>Total</span><b>R$ 1.247,00</b></div><span class="bc-phone-action">✓ Aprovar em 1 clique</span>
    </div>${cap}</div>`
  }
  if (kind === 'calc') {
    return `<div class="bc-visual is-calc"><div class="bc-stripes"></div><pre>hora_homem = R$ 78,00
ocupacao   = 0.73
margem     = 0.42
──────────────
preco_final = R$ 184,90</pre><strong>+38%</strong>${cap}</div>`
  }
  if (kind === 'doc') {
    return `<div class="bc-visual is-doc"><div class="bc-stripes"></div><div class="bc-doc-card"><strong>OS #0428</strong><small>Civic LXR 2019 · 78.430 km</small><p><span>Diagnóstico</span><b>Concluído</b></p><p><span>Aprovação</span><b>08:42</b></p><p><span>Serviço</span><b>67%</b></p><i><em></em></i></div>${cap}</div>`
  }
  if (kind === 'shelf') {
    return `<div class="bc-visual is-shelf"><div class="bc-shelf">${Array.from({ length: 18 }).map((_, index) => `<span data-rank="${index % 6 < 2 ? 'A' : index % 6 < 5 ? 'B' : 'C'}">${index % 6 < 2 ? 'A' : index % 6 < 5 ? 'B' : 'C'}</span>`).join('')}</div>${cap}</div>`
  }
  if (kind === 'nfe') {
    return `<div class="bc-visual is-nfe"><div class="bc-stripes"></div><div class="bc-receipt"><small>PREFEITURA · SÉRIE A · Nº 0001428</small><p>Prestador: OFICINA SILVA LTDA</p><p>CNPJ: 12.345.678/0001-90</p><p>Tomador: MARCOS R. SOUZA</p><p>Serviço: 14.01 - Manutenção</p><strong>VALOR R$ 1.247,00</strong></div>${cap}</div>`
  }
  if (kind === 'chart') {
    return `<div class="bc-visual is-chart"><small>TICKET MÉDIO · 90D</small><strong>R$ 487</strong><em>▲ 23% vs trimestre anterior</em><div>${[42, 58, 51, 73, 65, 88, 81, 95].map((height, index) => `<span style="height:${height}%${index === 7 ? ';background:var(--brand);opacity:1' : ''}"></span>`).join('')}</div>${cap}</div>`
  }
  if (kind === 'loop') {
    return `<div class="bc-visual is-loop"><div class="bc-loop"><span>Atendimento</span><span>Serviço</span><span>Pós-venda</span><span>Lembrete</span></div>${cap}</div>`
  }
  if (kind === 'chat') {
    return `<div class="bc-visual is-chat"><div class="bc-stripes"></div><p>Como o carro tem se comportado desde a última revisão?</p><p>Começou a fazer barulho na curva.</p><p>Posso encaixar amanhã às 14h.</p>${cap}</div>`
  }
  return `<div class="bc-visual is-compare"><table><tbody><tr><td>OS no papel</td><td>OS digital</td></tr><tr><td>WhatsApp solto</td><td>Aprovação registrada</td></tr><tr><td>Caixa no chute</td><td>Margem por OS</td></tr></tbody></table>${cap}</div>`
}

function postCard(post) {
  return `<article class="bc-post-card" data-post-card data-category="${post.category}" data-title="${esc(`${post.title} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase())}">
  <a href="/blog/${post.slug}" aria-label="${esc(post.title)}">
    <div class="bc-card-visual">${visual(post.hero.kind, post.hero.caption)}</div>
    <div class="bc-card-body">
      <div class="bc-card-meta">${categoryPill(post)}<span>${post.readingTime} min</span></div>
      <h3>${esc(post.title)}</h3>
      <p>${esc(post.excerpt)}</p>
      <footer>${authorChip(post, true)}<span aria-hidden="true">→</span></footer>
    </div>
  </a>
</article>`
}

function featuredHero(post) {
  return `<section class="bc-container bc-featured-wrap">
  <a class="bc-featured" href="/blog/${post.slug}">
    <div class="bc-featured-visual">
      ${visual(post.hero.kind, post.hero.caption)}
      <span class="bc-featured-badge"><i></i> EM DESTAQUE</span>
    </div>
    <div class="bc-featured-copy">
      <div class="bc-featured-meta">${categoryPill(post)}<span>${fmtDate(post.date)} · ${post.readingTime} min</span></div>
      <h2>${esc(post.title)}</h2>
      <p>${esc(post.excerpt)}</p>
      <div class="bc-featured-footer">${authorChip(post)}<strong>Ler artigo completo <span>→</span></strong></div>
    </div>
  </a>
</section>`
}

function indexHtml(active = 'todos') {
  const featured = posts.find((post) => post.featured) || posts[0]
  const activeCategory = slugCategory(active)
  const isCategory = active !== 'todos'
  const pageTitle = isCategory
    ? `${activeCategory.label} no Blog BoxCerto — Guias para oficina mecânica`
    : 'Blog BoxCerto — Gestão de oficina mecânica que funciona'
  const pageDescription = isCategory
    ? `Artigos de ${activeCategory.label.toLowerCase()} para oficinas mecânicas organizarem OS, atendimento, financeiro e rotina com mais controle.`
    : 'Artigos sobre WhatsApp, OS digital, estoque, financeiro e atendimento para oficinas mecânicas. Atualizado quinzenalmente.'
  const canonical = `${site}${isCategory ? `/blog/categoria/${active}` : '/blog'}`
  const itemList = posts.map((post, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${site}/blog/${post.slug}`,
    name: post.title,
  }))
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog BoxCerto',
    url: canonical,
    description: pageDescription,
    publisher: { '@type': 'Organization', name: 'BoxCerto', logo: { '@type': 'ImageObject', url: `${site}/logo.svg` } },
    blogPost: posts.map((post) => ({ '@type': 'BlogPosting', headline: post.title, url: `${site}/blog/${post.slug}`, datePublished: post.date })),
    mainEntity: { '@type': 'ItemList', itemListElement: itemList },
  }
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(pageDescription)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(pageDescription)}">
<meta property="og:image" content="${site}/og-image.png">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd(schema)}</script>
<script type="application/ld+json">${jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: site }, { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog` }, ...(isCategory ? [{ '@type': 'ListItem', position: 3, name: activeCategory.label, item: canonical }] : [])] })}</script>
<link rel="stylesheet" href="/blog/boxcerto-blog.css">
</head>
<body class="bc-blog" data-page="index" data-active-category="${active}">
${header({ active })}
<main>
  <section class="bc-container bc-masthead">
    <div>
      <h1>O blog da oficina<br><span>que vende mais e retrabalha menos.</span></h1>
    </div>
    <aside><strong>EDIÇÃO #28 · MAI 2026</strong><span>48 artigos · 6 categorias</span><span>atualizado há 3 dias</span></aside>
  </section>
  ${featuredHero(featured)}
  <section class="bc-container bc-section" id="posts">
    <div class="bc-section-head"><span>Recentes</span><h2>Continuar lendo</h2><small data-visible-count>${posts.length - 1} artigos</small></div>
    <div class="bc-post-grid" data-post-grid>${posts.filter((post) => post.slug !== featured.slug).map(postCard).join('\n')}</div>
    <div class="bc-empty-state" data-empty-state hidden><strong>Nada por aqui ainda.</strong><span>Tente outra categoria ou remova a busca.</span></div>
  </section>
  <section class="bc-container bc-guide-panel">
    <div class="bc-section-head"><span>Materiais gratuitos</span><h2>Comece pelo problema mais caro da oficina</h2><p>Modelos e planilhas para organizar OS, orçamento, mão de obra, caixa e estoque antes de migrar para uma rotina digital.</p></div>
    <div class="bc-guide-grid">${guideLinks.map(([title, href, label]) => `<a href="${href}"><span>${esc(label)}</span><strong>${esc(title)}</strong><small>Baixar ou abrir guia →</small></a>`).join('\n')}</div>
  </section>
  ${newsletter()}
</main>
${footer()}
<script src="/blog/boxcerto-blog.js" defer></script>
</body>
</html>
`
}

function defaultContent(post) {
  return {
    lead: post.excerpt,
    toc: [
      ['contexto', 'Onde a oficina perde dinheiro'],
      ['rotina', 'Como criar uma rotina simples'],
      ['checklist', 'Checklist prático'],
    ],
    blocks: [
      { kind: 'h2', id: 'contexto', text: 'Onde a oficina perde dinheiro' },
      { kind: 'p', text: 'O problema quase nunca aparece como uma grande falha. Ele nasce em pequenas perdas: orçamento sem retorno, peça usada sem cobrança, serviço sem status e cliente esperando resposta.' },
      { kind: 'p', text: 'Quando a oficina registra cada etapa com clareza, o dono deixa de depender de memória e passa a enxergar o que está parado, aprovado, recusado ou pronto para faturar.' },
      { kind: 'h2', id: 'rotina', text: 'Como criar uma rotina simples' },
      { kind: 'ul', items: ['Defina um responsável por registrar a entrada do veículo.', 'Separe diagnóstico, peças, mão de obra e prazo antes de enviar o valor.', 'Registre a aprovação do cliente antes de executar.', 'Revise serviços em andamento no começo e no fim do dia.'] },
      { kind: 'callout', title: 'Aplicação prática', text: 'Se a oficina ainda depende de papel, planilha e conversa solta, comece por uma OS simples e evolua para uma OS digital quando os serviços em andamento ficarem difíceis de acompanhar.' },
      { kind: 'h2', id: 'checklist', text: 'Checklist prático' },
      { kind: 'checklist', items: ['Cliente e veículo identificados', 'Problema descrito com clareza', 'Peças e mão de obra separadas', 'Prazo combinado', 'Aprovação registrada', 'Financeiro atualizado'] },
      { kind: 'cta-banner', headline: 'Quer levar essa rotina para o BoxCerto?', subhead: 'Crie OS, envie orçamento por link, registre aprovação e acompanhe estoque e financeiro em uma tela simples.', href: '/cadastro?origem=artigo-blog' },
    ],
    faq: [
      ['Preciso de sistema para aplicar isso?', 'Você pode começar com planilha, mas um sistema reduz retrabalho quando a oficina tem muitos serviços em andamento.'],
      ['Isso serve para oficina pequena?', 'Sim. Quanto menor a equipe, mais importante é tirar informação da cabeça do dono e deixar a rotina visível.'],
    ],
  }
}

function renderBlock(block) {
  if (block.kind === 'h2') return `<h2 id="${esc(block.id)}">${esc(block.text)}</h2>`
  if (block.kind === 'p') return `<p>${esc(block.text)}</p>`
  if (block.kind === 'ul') return `<ul class="bc-prose-list">${block.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
  if (block.kind === 'stat') return `<aside class="bc-stat"><strong>${esc(block.value)}</strong><span>${esc(block.label)}</span></aside>`
  if (block.kind === 'callout') return `<aside class="bc-callout">${block.title ? `<strong>${esc(block.title)}</strong>` : ''}<p>${esc(block.text)}</p></aside>`
  if (block.kind === 'msg-you') return `<div class="bc-msg-you"><p>${esc(block.text)}</p><small>14:32 ✓✓</small></div>`
  if (block.kind === 'msg-card') return `<div class="bc-msg-card"><span>Orçamento</span><h3>${esc(block.title)}</h3>${block.items.map((item) => `<p><span>${esc(item)}</span><i>···</i></p>`).join('')}<strong>${esc(block.price)}</strong><span class="bc-msg-action">✓ ${esc(block.cta)}</span></div>`
  if (block.kind === 'checklist') return `<div class="bc-checklist"><span>Checklist</span>${block.items.map((item, index) => `<label><input type="checkbox" data-checklist-item><span>${esc(item)}</span></label>`).join('')}</div>`
  if (block.kind === 'cta-banner') return `<aside class="bc-inline-cta"><span>Em ação</span><h3>${esc(block.headline || 'Transforme orçamento em aprovação registrada')}</h3><p>${esc(block.subhead || 'Com o BoxCerto, a oficina tira o orçamento do texto solto e coloca tudo em uma rotina clara.')}</p><a href="${esc(block.href || '/cadastro?origem=blog-inline-cta')}">Testar grátis 7 dias →</a></aside>`
  return ''
}

function postHtml(post) {
  const content = postContent[post.slug] || defaultContent(post)
  const category = slugCategory(post.category)
  const author = authors[post.author]
  const related = posts.filter((item) => item.slug !== post.slug && (item.category === post.category || item.author === post.author)).slice(0, 3)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Person', name: author.name },
    publisher: { '@type': 'Organization', name: 'BoxCerto', logo: { '@type': 'ImageObject', url: `${site}/logo.svg` } },
    datePublished: post.date,
    dateModified: today,
    mainEntityOfPage: `${site}/blog/${post.slug}`,
    url: `${site}/blog/${post.slug}`,
    keywords: post.tags.join(', '),
  }
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(post.title)} | Blog BoxCerto</title>
<meta name="description" content="${esc(post.excerpt)}">
<link rel="canonical" href="${site}/blog/${post.slug}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(post.excerpt)}">
<meta property="og:image" content="${site}/og-image.png">
<meta property="og:url" content="${site}/blog/${post.slug}">
<meta property="article:published_time" content="${post.date}">
<meta property="article:author" content="${esc(author.name)}">
${post.tags.map((tag) => `<meta property="article:tag" content="${esc(tag)}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd(articleSchema)}</script>
<script type="application/ld+json">${jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: site }, { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog` }, { '@type': 'ListItem', position: 3, name: post.title, item: `${site}/blog/${post.slug}` }] })}</script>
${content.faq ? `<script type="application/ld+json">${jsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: content.faq.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) })}</script>` : ''}
<link rel="stylesheet" href="/blog/boxcerto-blog.css">
</head>
<body class="bc-blog bc-post" data-page="post">
${header({ active: post.category, showRail: false })}
<div class="bc-reading-progress" aria-hidden="true"><span data-reading-progress></span></div>
<main>
  <div class="bc-container bc-breadcrumb"><a href="/blog">Blog</a><span>/</span><a href="/blog/categoria/${post.category}">${esc(category.label)}</a><span>/</span><strong>${esc(post.title)}</strong></div>
  <article class="bc-container bc-article" data-article>
    <header class="bc-article-hero">
      ${categoryPill(post)}
      <h1>${esc(post.title)}</h1>
      <p>${esc(content.lead)}</p>
      <div class="bc-article-meta">${authorChip(post)}<span></span><div class="bc-share"><small>compartilhar</small><button type="button" data-share="linkedin" aria-label="Compartilhar no LinkedIn">L</button><button type="button" data-share="x" aria-label="Compartilhar no X">X</button><button type="button" data-share="whatsapp" aria-label="Compartilhar no WhatsApp">W</button><button type="button" data-share="facebook" aria-label="Compartilhar no Facebook">F</button></div></div>
    </header>
    <div class="bc-article-visual">${visual(post.hero.kind, post.hero.caption)}</div>
    <div class="bc-article-layout">
      <aside class="bc-toc"><span>Neste artigo</span>${content.toc.map(([id, label]) => `<a href="#${id}" data-toc-link="${id}">${esc(label)}</a>`).join('')}</aside>
      <div class="bc-prose">${content.blocks.map(renderBlock).join('\n')}</div>
      <aside class="bc-sticky-cta"><span>Em ação</span><strong>Quer aplicar isso na oficina?</strong><p>Crie OS, envie orçamento por link e registre aprovações no BoxCerto.</p><a href="/cadastro?origem=sticky-post-${post.slug}">Testar grátis 7 dias</a><small>Sem complicação para começar.</small></aside>
    </div>
    ${content.faq ? `<section class="bc-faq"><h2>Dúvidas frequentes</h2>${content.faq.map(([question, answer]) => `<details><summary><span>${esc(question)}</span><b>+</b></summary><p>${esc(answer)}</p></details>`).join('')}</section>` : ''}
    <section class="bc-author-bio">${authorChip(post)}<p>${esc(author.bio)}</p></section>
  </article>
  <section class="bc-container bc-related"><div class="bc-section-head"><span>Relacionados</span><h2>Continue estudando</h2></div><div class="bc-post-grid">${related.map(postCard).join('\n')}</div></section>
  ${newsletter()}
</main>
${footer()}
<script src="/blog/boxcerto-blog.js" defer></script>
</body>
</html>
`
}

function newsletter() {
  return `<section class="bc-container bc-newsletter">
  <div><span>Newsletter · quinzenal</span><h2>Gestão de oficina sem enrolação<br><em>direto para o seu e-mail.</em></h2><p>Receba guias práticos sobre OS, WhatsApp, estoque, financeiro e atendimento.</p></div>
  <form data-newsletter-form><label><input type="email" required placeholder="seu@email.com" aria-label="Seu e-mail"><button type="submit">Inscrever</button></label><small>Junte-se a 6.421 donos e gerentes de oficina. Saia quando quiser.</small></form>
</section>`
}

function css() {
  return String.raw`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@10..48,600..800&family=DM+Sans:opsz,wght@9..40,400..700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --brand: #4F46E5;
  --brand-deep: #3F3FBD;
  --brand-soft: #EEF0FF;
  --brand-tint: #F5F6FF;
  --green: #22C55E;
  --green-deep: #16A34A;
  --green-soft: #DCFCE7;
  --bg: #FCFBF8;
  --bg-panel: #FFFFFF;
  --bg-sunken: #F4F2EC;
  --line: #E7E3D8;
  --line-strong: #D4CFC0;
  --ink: #14131A;
  --ink-2: #2C2A36;
  --ink-3: #565463;
  --ink-4: #8A8794;
  --ink-5: #B5B2BD;
  --font-display: "Bricolage Grotesque", "DM Sans", sans-serif;
  --font-body: "DM Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 18px;
  --r-xl: 26px;
  --shadow-sm: 0 1px 0 rgba(20, 19, 26, .05);
  --shadow-md: 0 18px 45px rgba(20, 19, 26, .08);
  --shadow-lg: 0 30px 80px rgba(20, 19, 26, .16);
}

[data-theme="dark"] {
  --bg: #0E0D14;
  --bg-panel: #16151E;
  --bg-sunken: #1B1A24;
  --line: #2A2834;
  --line-strong: #3A3848;
  --ink: #F2F1F5;
  --ink-2: #DAD8E0;
  --ink-3: #A4A1AE;
  --ink-4: #7B7886;
  --ink-5: #4E4B58;
  --brand-soft: #1F1F46;
  --brand-tint: #15152C;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; background: var(--bg); }
body.bc-blog { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--font-body); font-feature-settings: "ss01", "cv11"; line-height: 1.55; }
a { color: inherit; text-decoration: none; }
button, input { font: inherit; }
:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.bc-container { width: min(1240px, calc(100% - clamp(40px, 6vw, 80px))); margin: 0 auto; }

.bc-site-header { position: sticky; top: 0; z-index: 50; background: color-mix(in oklab, var(--bg) 86%, transparent); backdrop-filter: blur(14px) saturate(160%); border-bottom: 1px solid var(--line); }
.bc-topbar { height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.bc-logo { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-display); font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); white-space: nowrap; }
.bc-logo img { flex: 0 0 auto; width: 36px; height: 36px; border-radius: 10px; }
.bc-nav { display: flex; align-items: center; gap: 12px; }
.bc-nav a { padding: 8px 12px; border-radius: var(--r-sm); color: var(--ink-2); font-size: 15px; font-weight: 650; }
.bc-nav a[aria-current="page"] { color: var(--ink); }
.bc-actions { display: flex; align-items: center; gap: 10px; }
.bc-search { min-width: 228px; height: 46px; display: inline-flex; align-items: center; gap: 10px; padding: 0 12px 0 14px; background: var(--bg-sunken); border: 1px solid var(--line); border-radius: 999px; color: var(--ink-3); }
.bc-search svg, .bc-icon-button svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.bc-search input { width: 128px; border: 0; outline: 0; background: transparent; color: var(--ink); }
.bc-search span { margin-left: auto; padding: 2px 6px; font-family: var(--font-mono); font-size: 10px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: 6px; color: var(--ink-4); }
.bc-btn, .bc-icon-button { min-height: 46px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-weight: 800; border: 1px solid var(--line-strong); cursor: pointer; }
.bc-btn { padding: 0 18px; }
.bc-btn-primary { color: #fff; background: var(--brand); border-color: var(--brand); box-shadow: 0 16px 30px rgba(79, 70, 229, .24); }
.bc-btn-primary:hover { background: var(--brand-deep); }
.bc-btn-ghost { color: var(--ink-2); background: var(--bg-panel); }
.bc-icon-button { width: 46px; color: var(--ink-3); background: var(--bg-panel); }
.bc-menu-button { display: none; width: 46px; height: 46px; border: 1px solid var(--line); border-radius: 999px; background: var(--bg-panel); }
.bc-menu-button span { display: block; width: 16px; height: 2px; margin: 4px auto; background: var(--ink); border-radius: 2px; }
.bc-mobile-nav { display: none; }
.bc-category-rail { display: flex; align-items: center; gap: 10px; padding: 16px 0 20px; overflow-x: auto; scroll-snap-type: x mandatory; }
.bc-cat-pill, .bc-pill { display: inline-flex; align-items: center; gap: 8px; min-height: 34px; padding: 0 14px; border-radius: 999px; background: var(--bg-sunken); border: 1px solid var(--line); color: var(--ink-2); font-size: 14px; font-weight: 700; white-space: nowrap; }
.bc-cat-pill { scroll-snap-align: start; }
.bc-cat-pill span { font-family: var(--font-mono); font-size: 10px; opacity: .55; }
.bc-cat-pill.is-active { color: var(--bg); background: var(--ink); border-color: var(--ink); }
.bc-pill { color: var(--brand); background: var(--brand-soft); border-color: transparent; }

.bc-masthead { display: grid; grid-template-columns: 1fr 280px; gap: 48px; align-items: center; padding: 42px 0 36px; border-bottom: 1px solid var(--line); }
.bc-masthead h1 { margin: 0; font-family: var(--font-display); font-size: clamp(40px, 5vw, 64px); line-height: 1.04; letter-spacing: -0.02em; text-wrap: balance; }
.bc-masthead h1 span { color: var(--ink-4); }
.bc-masthead aside { display: grid; gap: 6px; justify-items: end; color: var(--ink-3); font-size: 15px; }
.bc-masthead strong, .bc-section-head span, .bc-newsletter span, .bc-toc span, .bc-sticky-cta span { font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }

.bc-featured-wrap { margin-top: 44px; }
.bc-featured { display: grid; grid-template-columns: 1.05fr 1fr; gap: 28px; padding: 14px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--r-xl); box-shadow: var(--shadow-md); transition: transform .25s ease, border-color .2s ease, box-shadow .2s ease; }
.bc-featured:hover { transform: translateY(-2px); border-color: var(--line-strong); box-shadow: var(--shadow-lg); }
.bc-featured-visual { position: relative; min-height: 440px; border-radius: 18px; overflow: hidden; background: var(--bg-sunken); }
.bc-featured-badge { position: absolute; top: 20px; left: 20px; display: inline-flex; align-items: center; gap: 7px; padding: 7px 13px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: 999px; color: var(--ink-2); font-size: 12px; font-weight: 800; }
.bc-featured-badge i { width: 7px; height: 7px; border-radius: 50%; background: var(--green); }
.bc-featured-copy { min-height: 440px; display: flex; flex-direction: column; justify-content: space-between; padding: 36px 34px 32px; }
.bc-featured-meta, .bc-card-meta { display: flex; align-items: center; gap: 10px; color: var(--ink-3); font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
.bc-featured h2 { margin: 30px 0 18px; font-family: var(--font-display); font-size: clamp(34px, 3.6vw, 46px); line-height: 1.05; letter-spacing: -0.02em; text-wrap: balance; }
.bc-featured p { margin: 0; color: var(--ink-3); font-size: 21px; line-height: 1.45; }
.bc-featured-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 32px; }
.bc-featured-footer > strong { display: inline-flex; align-items: center; gap: 8px; color: var(--brand); font-size: 14px; white-space: nowrap; }

.bc-section { margin-top: 64px; }
.bc-section-head { display: grid; grid-template-columns: 1fr auto; gap: 12px 24px; align-items: end; margin-bottom: 28px; }
.bc-section-head h2 { margin: 4px 0 0; font-family: var(--font-display); font-size: clamp(24px, 2.2vw, 32px); line-height: 1.15; letter-spacing: -0.02em; }
.bc-section-head p { max-width: 680px; margin: 0; color: var(--ink-3); font-size: 17px; }
.bc-section-head small { font-family: var(--font-mono); color: var(--ink-4); }
.bc-post-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; }
.bc-post-card a { height: 100%; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--r-lg); box-shadow: var(--shadow-sm); transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
.bc-post-card a:hover { transform: translateY(-3px); border-color: var(--line-strong); box-shadow: var(--shadow-md); }
.bc-card-visual { height: 210px; margin: 22px 22px 0; border-radius: 14px; overflow: hidden; background: var(--bg-sunken); }
.bc-card-body { flex: 1; display: flex; flex-direction: column; gap: 16px; padding: 22px; }
.bc-card-body h3 { margin: 0; font-family: var(--font-display); font-size: 22px; line-height: 1.12; letter-spacing: -0.02em; text-wrap: balance; }
.bc-card-body p { margin: 0; color: var(--ink-3); font-size: 16px; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.bc-card-body footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 12px; }
.bc-card-body footer > span { color: var(--ink); font-size: 24px; }
.bc-author { display: flex; align-items: center; gap: 10px; }
.bc-author > span { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: var(--brand); font-family: var(--font-display); font-size: 13px; font-weight: 800; }
.bc-author.compact > span { width: 34px; height: 34px; font-size: 12px; }
.bc-author div { display: flex; flex-direction: column; line-height: 1.25; }
.bc-author strong { color: var(--ink); font-size: 13px; }
.bc-author small { color: var(--ink-4); font-size: 12px; }

.bc-visual { position: relative; width: 100%; height: 100%; min-height: inherit; overflow: hidden; border-radius: inherit; background: var(--bg-sunken); }
.bc-stripes { position: absolute; inset: 0; background: repeating-linear-gradient(-22deg, var(--brand) 0 1px, transparent 1px 14px); opacity: .06; }
.bc-vis-caption { position: absolute; left: 20px; bottom: 18px; padding: 7px 12px; background: color-mix(in oklab, var(--bg-panel) 78%, transparent); border: 1px solid var(--line); border-radius: 9px; color: var(--ink-3); font-family: var(--font-mono); font-size: 12px; backdrop-filter: blur(8px); }
.bc-phone-card { position: absolute; left: 50%; top: 50%; width: 230px; min-height: 310px; transform: translate(-50%, -50%); display: flex; flex-direction: column; gap: 10px; padding: 22px 18px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: 26px; box-shadow: var(--shadow-lg); }
.bc-phone-card i { width: 64px; height: 10px; align-self: center; background: var(--line); border-radius: 999px; }
.bc-phone-card small { font-family: var(--font-mono); color: var(--ink-4); font-size: 10px; }
.bc-phone-card strong { font-family: var(--font-display); font-size: 18px; line-height: 1.1; }
.bc-phone-card p, .bc-phone-card div { display: flex; justify-content: space-between; margin: 0; color: var(--ink-3); font-size: 13px; }
.bc-phone-card div { margin-top: auto; padding-top: 12px; border-top: 1px dashed var(--line); color: var(--ink); font-weight: 800; }
.bc-phone-card b { font-family: var(--font-mono); }
.bc-phone-action { display: grid; place-items: center; border: 0; border-radius: 12px; min-height: 42px; color: #fff; background: var(--green); font-weight: 800; }
.is-phone { background: linear-gradient(140deg, var(--brand-soft), var(--bg-panel)); }
.is-calc pre { position: absolute; left: 9%; top: 17%; margin: 0; color: var(--ink-3); font-family: var(--font-mono); font-size: 15px; line-height: 1.7; }
.is-calc > strong { position: absolute; right: 11%; bottom: 21%; color: var(--brand); font-family: var(--font-display); font-size: 42px; }
.bc-doc-card, .bc-receipt { position: absolute; inset: 17% 20%; display: flex; flex-direction: column; gap: 9px; padding: 18px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: 10px; box-shadow: var(--shadow-md); }
.bc-doc-card small, .bc-receipt small { color: var(--ink-4); font-family: var(--font-mono); font-size: 10px; }
.bc-doc-card p { display: flex; justify-content: space-between; margin: 0; color: var(--ink-3); font-size: 12px; }
.bc-doc-card b { color: var(--ink-2); font-family: var(--font-mono); }
.bc-doc-card i { height: 5px; margin-top: auto; background: var(--bg-sunken); border-radius: 999px; }
.bc-doc-card em { display: block; width: 67%; height: 100%; background: var(--brand); border-radius: inherit; }
.bc-shelf { position: absolute; inset: 14%; display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px 12px; align-content: center; }
.bc-shelf span { display: grid; place-items: center; min-height: 34px; border-radius: 5px; color: #fff; background: var(--ink-5); font-family: var(--font-mono); font-size: 11px; opacity: .35; }
.bc-shelf [data-rank="A"] { background: var(--brand); opacity: .9; }
.bc-shelf [data-rank="B"] { background: var(--ink-3); opacity: .55; }
.bc-receipt { font-family: var(--font-mono); color: var(--ink-3); font-size: 11px; }
.bc-receipt p { margin: 0; }
.bc-receipt strong { margin-top: auto; color: var(--ink); }
.is-chart { padding: 42px 32px; }
.is-chart small { font-family: var(--font-mono); color: var(--ink-4); }
.is-chart > strong { display: block; margin-top: 6px; font-family: var(--font-display); font-size: 36px; }
.is-chart em { color: var(--green-deep); font-style: normal; font-size: 12px; font-weight: 800; }
.is-chart div:not(.bc-vis-caption) { position: absolute; left: 32px; right: 32px; bottom: 38px; height: 110px; display: flex; align-items: end; gap: 14px; }
.is-chart div span { flex: 1; min-height: 24px; border-radius: 4px; background: var(--ink-5); opacity: .45; }
.bc-loop { position: absolute; inset: 18%; display: grid; grid-template-columns: 1fr 1fr; gap: 70px 90px; align-content: center; }
.bc-loop span { display: grid; place-items: center; min-height: 48px; background: var(--bg-panel); border: 1px solid var(--line-strong); border-radius: 10px; color: var(--ink); font-weight: 800; font-size: 12px; }
.is-chat { padding: 48px; display: flex; flex-direction: column; gap: 12px; }
.is-chat p { max-width: 70%; margin: 0; padding: 12px 14px; border-radius: 14px 14px 14px 4px; background: var(--bg-sunken); color: var(--ink-2); font-size: 13px; z-index: 1; }
.is-chat p:nth-child(3) { align-self: flex-end; color: #fff; background: var(--green); border-radius: 14px 14px 4px 14px; }
.is-compare table { position: absolute; inset: 18%; width: 64%; height: 58%; margin: auto; background: var(--bg-panel); border: 1px solid var(--line); border-radius: 10px; box-shadow: var(--shadow-md); border-spacing: 0; overflow: hidden; }
.is-compare td { padding: 12px; border-bottom: 1px solid var(--line); color: var(--ink-2); font-size: 12px; }
.is-compare td:nth-child(2) { color: var(--brand); font-weight: 800; }

.bc-guide-panel { margin-top: 74px; padding: clamp(30px, 5vw, 54px); background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--r-xl); box-shadow: var(--shadow-sm); }
.bc-guide-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.bc-guide-grid a { display: grid; gap: 9px; padding: 18px; background: var(--bg-sunken); border: 1px solid var(--line); border-radius: var(--r-md); transition: transform .2s ease, border-color .2s ease; }
.bc-guide-grid a:hover { transform: translateY(-3px); border-color: var(--line-strong); }
.bc-guide-grid span { color: var(--brand); font-size: 13px; font-weight: 800; }
.bc-guide-grid strong { font-family: var(--font-display); font-size: 20px; line-height: 1.1; }
.bc-guide-grid small { color: var(--ink-4); }
.bc-empty-state { padding: 72px 24px; text-align: center; border: 1px dashed var(--line-strong); border-radius: var(--r-lg); color: var(--ink-3); }

.bc-newsletter { margin-top: 74px; margin-bottom: 70px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px; align-items: center; padding: clamp(36px, 5vw, 64px); overflow: hidden; position: relative; color: #fff; background: #14131A; border-radius: var(--r-xl); }
.bc-newsletter::after, .bc-inline-cta::after { content: ""; position: absolute; inset: -40% -20% auto auto; width: 560px; height: 320px; background: radial-gradient(circle, rgba(79,70,229,.42), transparent 65%); pointer-events: none; }
.bc-newsletter h2 { position: relative; margin: 10px 0 14px; font-family: var(--font-display); font-size: clamp(30px, 4vw, 48px); line-height: 1.04; letter-spacing: -0.02em; }
.bc-newsletter em { color: rgba(255,255,255,.58); font-style: normal; }
.bc-newsletter p { position: relative; max-width: 520px; margin: 0; color: rgba(255,255,255,.72); font-size: 17px; }
.bc-newsletter form { position: relative; z-index: 1; display: grid; gap: 12px; }
.bc-newsletter label { display: flex; gap: 8px; padding: 8px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); border-radius: 999px; }
.bc-newsletter input { flex: 1; min-width: 0; border: 0; outline: 0; padding: 0 10px; color: #fff; background: transparent; }
.bc-newsletter button { border: 0; border-radius: 999px; padding: 0 18px; color: #fff; background: var(--brand); font-weight: 800; }
.bc-newsletter small { color: rgba(255,255,255,.54); }

.bc-footer { padding: 64px 0 26px; border-top: 1px solid var(--line); background: var(--bg); }
.bc-footer-grid { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 46px; align-items: start; }
.bc-footer-grid p { max-width: 330px; margin: 16px 0 18px; color: var(--ink-3); font-size: 14px; line-height: 1.6; }
.bc-footer-grid > div:not(:first-child) { display: grid; gap: 9px; }
.bc-footer-grid strong { margin-bottom: 4px; color: var(--ink); font-family: var(--font-display); font-size: 15px; }
.bc-footer-grid a:not(.bc-logo):not(.bc-btn) { color: var(--ink-3); font-size: 14px; }
.bc-footer-grid a:not(.bc-logo):not(.bc-btn):hover { color: var(--brand); }
.bc-footer-bottom { display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-top: 42px; padding-top: 22px; border-top: 1px solid var(--line); color: var(--ink-4); font-size: 12px; }

.bc-reading-progress { position: fixed; top: 0; left: 0; right: 0; z-index: 80; height: 3px; pointer-events: none; }
.bc-reading-progress span { display: block; width: 0; height: 100%; background: var(--brand); transition: width .12s linear; }
.bc-breadcrumb { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; padding-top: 30px; color: var(--ink-4); font-size: 13px; }
.bc-breadcrumb strong { color: var(--ink-2); }
.bc-article { padding-top: 24px; }
.bc-article-hero { max-width: 890px; margin: 0 auto; text-align: center; padding-bottom: 42px; }
.bc-article-hero h1 { margin: 16px auto 18px; font-family: var(--font-display); font-size: clamp(34px, 4.4vw, 64px); line-height: 1.04; letter-spacing: -0.02em; text-wrap: balance; }
.bc-article-hero > p { max-width: 740px; margin: 0 auto; color: var(--ink-3); font-size: clamp(17px, 1.5vw, 21px); line-height: 1.55; }
.bc-article-meta { margin-top: 32px; display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
.bc-article-meta > span { width: 1px; height: 24px; background: var(--line-strong); }
.bc-share { display: flex; align-items: center; gap: 6px; }
.bc-share small { margin-right: 6px; color: var(--ink-4); font-family: var(--font-mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
.bc-share button { width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 50%; color: var(--ink-3); background: var(--bg-sunken); font-family: var(--font-mono); font-size: 12px; cursor: pointer; }
.bc-article-visual { max-width: 1080px; height: 460px; margin: 0 auto 56px; overflow: hidden; background: var(--bg-sunken); border: 1px solid var(--line); border-radius: var(--r-xl); }
.bc-article-layout { display: grid; grid-template-columns: 220px minmax(0, 680px) 220px; gap: 56px; align-items: start; justify-content: center; max-width: 1180px; margin: 0 auto; }
.bc-toc, .bc-sticky-cta { position: sticky; top: 96px; align-self: start; }
.bc-toc { display: grid; gap: 10px; }
.bc-toc a { display: block; padding-left: 12px; border-left: 2px solid var(--line); color: var(--ink-4); font-size: 13px; line-height: 1.4; }
.bc-toc a.is-active { color: var(--ink); border-left-color: var(--brand); font-weight: 700; }
.bc-sticky-cta { display: grid; gap: 12px; padding: 18px; background: var(--brand-tint); border: 1px solid var(--brand-soft); border-radius: var(--r-md); }
.bc-sticky-cta strong { font-family: var(--font-display); font-size: 20px; line-height: 1.1; }
.bc-sticky-cta p { margin: 0; color: var(--ink-3); font-size: 14px; }
.bc-sticky-cta a { display: grid; place-items: center; min-height: 42px; color: #fff; background: var(--brand); border-radius: 999px; font-weight: 800; }
.bc-sticky-cta small { color: var(--ink-4); font-size: 12px; }
.bc-prose h2 { margin: 56px 0 18px; color: var(--ink); font-family: var(--font-display); font-size: clamp(24px, 2.2vw, 32px); line-height: 1.18; letter-spacing: -0.02em; scroll-margin-top: 96px; }
.bc-prose h2:first-child { margin-top: 0; }
.bc-prose p { margin: 0 0 22px; color: var(--ink-2); font-size: 18px; line-height: 1.75; }
.bc-prose-list { list-style: none; padding: 0; margin: 0 0 28px; display: grid; gap: 12px; }
.bc-prose-list li { position: relative; padding-left: 28px; color: var(--ink-2); font-size: 17px; line-height: 1.6; }
.bc-prose-list li::before { content: ""; position: absolute; left: 0; top: 10px; width: 8px; height: 8px; background: var(--brand); border-radius: 2px; transform: rotate(45deg); }
.bc-stat { display: flex; gap: 22px; align-items: center; margin: 40px 0; padding: 22px 24px; border-left: 3px solid var(--brand); background: var(--brand-tint); border-radius: 0 var(--r-md) var(--r-md) 0; }
.bc-stat strong { color: var(--brand); font-family: var(--font-display); font-size: 60px; line-height: 1; }
.bc-stat span { max-width: 420px; color: var(--ink-2); font-size: 16px; }
.bc-callout { margin: 30px 0; padding: 22px 24px; background: var(--bg-sunken); border: 1px solid var(--line); border-radius: var(--r-md); }
.bc-callout strong { display: block; margin-bottom: 6px; color: var(--brand); font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
.bc-callout p { margin: 0; }
.bc-msg-you, .bc-msg-card { width: min(520px, 92%); margin: 26px 0 26px auto; box-shadow: var(--shadow-md); }
.bc-msg-you { padding: 14px 16px 8px; background: #DCF8C6; color: #1f2937; border-radius: 14px 14px 4px 14px; }
.bc-msg-you p { margin: 0; color: #1f2937; font-size: 16px; line-height: 1.55; }
.bc-msg-you small { display: block; margin-top: 6px; text-align: right; color: rgba(31,41,55,.58); font-family: var(--font-mono); font-size: 10px; }
.bc-msg-card { display: grid; gap: 10px; padding: 18px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--r-md); }
.bc-msg-card > span { color: var(--brand); font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
.bc-msg-card h3 { margin: 0 0 4px; font-family: var(--font-display); }
.bc-msg-card p { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 0; color: var(--ink-3); font-size: 14px; line-height: 1.3; }
.bc-msg-card i { color: var(--ink-5); font-style: normal; }
.bc-msg-card strong { margin-top: 6px; padding-top: 12px; border-top: 1px dashed var(--line); font-family: var(--font-mono); font-size: 18px; }
.bc-msg-action { display: grid; place-items: center; min-height: 44px; border-radius: 999px; color: #fff; background: var(--green); font-weight: 800; }
.bc-checklist { display: grid; gap: 0; margin: 30px 0; overflow: hidden; background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--r-md); }
.bc-checklist > span { padding: 16px 18px 8px; color: var(--brand); font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
.bc-checklist label { display: flex; gap: 12px; align-items: center; padding: 14px 18px; border-top: 1px solid var(--line); color: var(--ink-2); }
.bc-checklist input { accent-color: var(--green); }
.bc-checklist input:checked + span { color: var(--ink-4); text-decoration: line-through; }
.bc-inline-cta { position: relative; overflow: hidden; margin: 48px 0; padding: 28px 30px; color: #fff; background: #14131A; border-radius: var(--r-lg); }
.bc-inline-cta span { color: rgba(255,255,255,.62); font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
.bc-inline-cta h3 { position: relative; margin: 8px 0 8px; font-family: var(--font-display); font-size: 28px; line-height: 1.08; }
.bc-inline-cta p { position: relative; margin: 0 0 18px; color: rgba(255,255,255,.72); }
.bc-inline-cta a { position: relative; display: inline-flex; align-items: center; min-height: 42px; padding: 0 18px; color: #fff; background: var(--green); border-radius: 999px; font-weight: 800; }
.bc-faq, .bc-author-bio, .bc-related { max-width: 860px; margin: 70px auto 0; }
.bc-faq h2 { font-family: var(--font-display); font-size: 30px; }
.bc-faq details { border-top: 1px solid var(--line); }
.bc-faq summary { display: flex; justify-content: space-between; gap: 16px; padding: 18px 0; cursor: pointer; color: var(--ink); font-family: var(--font-display); font-weight: 700; font-size: 17px; list-style: none; }
.bc-faq summary::-webkit-details-marker { display: none; }
.bc-faq b { transition: transform .18s ease; }
.bc-faq details[open] b { transform: rotate(45deg); }
.bc-faq details p { margin: 0 0 18px; color: var(--ink-3); font-size: 16px; line-height: 1.65; }
.bc-author-bio { display: flex; gap: 18px; align-items: center; padding: 24px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--r-lg); }
.bc-author-bio p { margin: 0; color: var(--ink-3); }
.bc-related { max-width: 1240px; }

.bc-btn:active, .bc-newsletter button:active, .bc-sticky-cta a:active, .bc-inline-cta a:active { transform: translateY(1px); }
.is-hidden { display: none !important; }

@media (max-width: 1080px) {
  .bc-nav, .bc-search, .bc-btn-ghost { display: none; }
  .bc-menu-button { display: inline-block; }
  .bc-mobile-nav.is-open { display: grid; gap: 8px; padding: 0 24px 18px; }
  .bc-mobile-nav a { padding: 12px 14px; background: var(--bg-sunken); border: 1px solid var(--line); border-radius: var(--r-md); }
  .bc-featured, .bc-masthead, .bc-newsletter { grid-template-columns: 1fr; }
  .bc-masthead aside { justify-items: start; }
  .bc-post-grid, .bc-guide-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bc-article-layout { grid-template-columns: minmax(0, 720px); }
  .bc-toc, .bc-sticky-cta { position: static; }
  .bc-toc { order: -1; padding: 18px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--r-md); }
  .bc-footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 720px) {
  .bc-container { width: min(100% - 28px, 1240px); }
  .bc-logo span { display: none; }
  .bc-actions .bc-btn-primary { min-height: 42px; padding: 0 13px; font-size: 13px; }
  .bc-icon-button { width: 42px; min-height: 42px; }
  .bc-masthead { padding-top: 30px; }
  .bc-featured-visual { min-height: 330px; }
  .bc-featured-copy { min-height: 280px; }
  .bc-featured-visual .bc-phone-card { transform: translate(-50%, -50%) scale(.9); }
  .bc-featured-copy { padding: 24px 20px; }
  .bc-featured h2 { font-size: 32px; }
  .bc-featured p { font-size: 17px; }
  .bc-featured-footer { align-items: flex-start; flex-direction: column; }
  .bc-post-grid, .bc-guide-grid { grid-template-columns: 1fr; }
  .bc-card-visual { height: 230px; }
  .bc-section-head { grid-template-columns: 1fr; }
  .bc-newsletter label { border-radius: var(--r-lg); flex-direction: column; }
  .bc-newsletter input, .bc-newsletter button { min-height: 44px; }
  .bc-article-visual { height: 340px; }
  .bc-stat { align-items: flex-start; flex-direction: column; }
  .bc-share { width: 100%; justify-content: center; }
  .bc-article-meta > span { display: none; }
  .bc-footer-grid { grid-template-columns: 1fr; gap: 28px; }
  .bc-footer-bottom { flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
`
}

function blogJs() {
  return String.raw`(function () {
  var root = document.documentElement;
  var savedTheme = localStorage.getItem('boxcerto_blog_theme');
  if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;

  document.addEventListener('click', function (event) {
    var themeToggle = event.target.closest('[data-theme-toggle]');
    if (themeToggle) {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      localStorage.setItem('boxcerto_blog_theme', next);
    }
    var menuToggle = event.target.closest('[data-menu-toggle]');
    if (menuToggle) {
      var menu = document.querySelector('[data-mobile-nav]');
      if (menu) menu.classList.toggle('is-open');
    }
    var share = event.target.closest('[data-share]');
    if (share) {
      var url = encodeURIComponent(location.href);
      var title = encodeURIComponent(document.title);
      var target = {
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
        x: 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title,
        whatsapp: 'https://api.whatsapp.com/send?text=' + title + '%20' + url,
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url
      }[share.dataset.share];
      if (target) window.open(target, '_blank', 'noopener,noreferrer');
    }
    var localLink = event.target.closest('a[href]');
    var isLocalDev = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    if (isLocalDev && localLink && !localLink.closest('[data-category]') && !localLink.target) {
      var href = localLink.getAttribute('href') || '';
      var localTarget = null;
      if (href === '/blog') localTarget = '/blog/index.html';
      else if (/^\/blog\/categoria\/[^/.]+$/.test(href)) localTarget = href + '.html';
      else if (/^\/blog\/[^/.#?]+$/.test(href)) localTarget = href + '.html';
      else if (/^\/(planilha-os-oficina-mecanica-gratis|modelo-orcamento-oficina-mecanica-gratis|calculadora-mao-de-obra-oficina-mecanica|planilha-fluxo-caixa-oficina-mecanica-gratis|planilha-estoque-pecas-oficina-gratis)$/.test(href)) localTarget = href + '.html';
      if (localTarget) {
        event.preventDefault();
        location.href = localTarget;
      }
    }
  });

  var activeCategory = document.body.dataset.activeCategory || 'todos';
  var query = '';
  var cards = Array.from(document.querySelectorAll('[data-post-card]'));
  var count = document.querySelector('[data-visible-count]');
  var empty = document.querySelector('[data-empty-state]');

  function applyFilters() {
    var visible = 0;
    cards.forEach(function (card) {
      var matchesCategory = activeCategory === 'todos' || card.dataset.category === activeCategory;
      var haystack = card.dataset.title || '';
      var matchesQuery = !query || haystack.indexOf(query) !== -1;
      var show = matchesCategory && matchesQuery;
      card.classList.toggle('is-hidden', !show);
      if (show) visible += 1;
    });
    if (count) count.textContent = String(visible).padStart(2, '0') + ' artigos';
    if (empty) empty.hidden = visible !== 0;
    document.querySelectorAll('[data-category]').forEach(function (link) {
      link.classList.toggle('is-active', link.dataset.category === activeCategory);
    });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-category]');
    if (!link || !document.body.matches('[data-page="index"]')) return;
    event.preventDefault();
    activeCategory = link.dataset.category || 'todos';
    var url = activeCategory === 'todos' ? '/blog' : '/blog/categoria/' + activeCategory;
    history.pushState({ category: activeCategory }, '', url);
    applyFilters();
  });

  window.addEventListener('popstate', function () {
    var match = location.pathname.match(/\/blog\/categoria\/([^/]+)/);
    activeCategory = match ? match[1] : 'todos';
    applyFilters();
  });

  document.querySelectorAll('[data-blog-search]').forEach(function (input) {
    var form = input.closest('form');
    if (form) form.addEventListener('submit', function (event) { event.preventDefault(); });
    input.addEventListener('input', function () {
      query = input.value.trim().toLowerCase();
      applyFilters();
    });
  });
  applyFilters();

  var article = document.querySelector('[data-article]');
  var progress = document.querySelector('[data-reading-progress]');
  var tocLinks = Array.from(document.querySelectorAll('[data-toc-link]'));
  if (article && progress) {
    var updateProgress = function () {
      var rect = article.getBoundingClientRect();
      var total = article.offsetHeight - window.innerHeight;
      var scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      progress.style.width = (scrolled / Math.max(total, 1) * 100) + '%';
      var active = tocLinks[0] && tocLinks[0].dataset.tocLink;
      tocLinks.forEach(function (link) {
        var node = document.getElementById(link.dataset.tocLink);
        if (node && node.getBoundingClientRect().top < 140) active = link.dataset.tocLink;
      });
      tocLinks.forEach(function (link) {
        link.classList.toggle('is-active', link.dataset.tocLink === active);
      });
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  document.querySelectorAll('[data-newsletter-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[type="email"]');
      if (!input || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        input && input.focus();
        return;
      }
      localStorage.setItem('boxcerto_blog_newsletter', input.value.trim());
      var button = form.querySelector('button');
      if (button) button.textContent = '✓ Inscrito';
    });
  });
})();`
}

async function updateSitemap() {
  const file = path.join(publicDir, 'sitemap.xml')
  let xml = await readFile(file, 'utf8')
  const existing = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]))
  const extras = [
    ...posts.map((post) => [`blog/${post.slug}`, 'weekly', post.featured ? '0.9' : '0.78']),
    ...categories.filter((category) => category.slug !== 'todos').map((category) => [`blog/categoria/${category.slug}`, 'weekly', '0.72']),
  ]
  const blocks = extras
    .filter(([loc]) => !existing.has(`${site}/${loc}`))
    .map(([loc, changefreq, priority]) => `  <url>
    <loc>${site}/${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <lastmod>${today}</lastmod>
  </url>`)
    .join('\n\n')
  if (blocks) {
    xml = xml.replace('\n</urlset>', `\n\n${blocks}\n\n</urlset>`)
    await writeFile(file, xml, 'utf8')
  }
}

async function main() {
  await mkdir(categoryDir, { recursive: true })
  await writeFile(path.join(blogDir, 'boxcerto-blog.css'), css(), 'utf8')
  await writeFile(path.join(blogDir, 'boxcerto-blog.js'), blogJs(), 'utf8')
  await writeFile(path.join(blogDir, 'index.html'), indexHtml('todos'), 'utf8')
  for (const category of categories.filter((item) => item.slug !== 'todos')) {
    await writeFile(path.join(categoryDir, `${category.slug}.html`), indexHtml(category.slug), 'utf8')
  }
  for (const post of posts) {
    await writeFile(path.join(blogDir, `${post.slug}.html`), postHtml(post), 'utf8')
  }
  await updateSitemap()
  console.log(`Generated BoxCerto blog design with ${posts.length} editorial posts and ${categories.length - 1} category pages`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
