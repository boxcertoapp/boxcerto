import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const blogDir = path.join(publicDir, 'blog')
const site = 'https://www.boxcerto.com'
const today = '2026-05-26'

const existingPosts = [
  ['Planilha de OS para oficina mecanica gratis', 'planilha-ordem-de-servico-mecanica-gratis', 'Ordem de servico'],
  ['Sistema para oficina mecanica', 'sistema-para-oficina-mecanica', 'Sistema'],
  ['Orcamento de oficina pelo WhatsApp', 'orcamento-oficina-whatsapp', 'WhatsApp'],
  ['Controle de estoque de pecas da oficina', 'controle-estoque-pecas-oficina', 'Estoque'],
  ['Software de ordem de servico para mecanica', 'software-ordem-de-servico-mecanica', 'OS digital'],
  ['Como calcular mao de obra na oficina mecanica', 'como-calcular-mao-de-obra-oficina-mecanica', 'Financeiro'],
  ['Fluxo de caixa para oficina mecanica', 'fluxo-de-caixa-oficina-mecanica', 'Financeiro'],
  ['Como organizar uma oficina mecanica pequena', 'como-organizar-oficina-mecanica-pequena', 'Organizacao'],
  ['Checklist de revisao veicular para oficina', 'checklist-revisao-veicular-oficina', 'Checklist'],
  ['Como evitar calote em oficina mecanica', 'como-evitar-calote-oficina-mecanica', 'Atendimento'],
  ['Como ser mecanico automotivo', 'como-ser-mecanico-automotivo', 'Carreira'],
  ['Como aumentar faturamento da oficina mecanica', 'como-aumentar-faturamento-oficina-mecanica', 'Crescimento'],
]

const leadMagnets = {
  os: {
    slug: 'planilha-os-oficina-mecanica-gratis',
    label: 'Planilha de OS grátis',
    cta: 'Baixar planilha de OS grátis',
    storage: 'boxcerto_lead_magnet_os',
    headline: 'Planilha de OS para Oficina Mecânica Grátis',
    description: 'Baixe uma planilha de OS para oficina mecânica e veja quando vale migrar para uma ordem de serviço digital.',
  },
  orcamento: {
    slug: 'modelo-orcamento-oficina-mecanica-gratis',
    label: 'Modelo de orçamento grátis',
    cta: 'Receber modelo de orçamento',
    storage: 'boxcerto_lead_magnet_orcamento',
    headline: 'Modelo de Orçamento para Oficina Mecânica Grátis',
    description: 'Receba um modelo de orçamento para oficina mecânica e envie propostas mais claras para clientes no WhatsApp.',
  },
  maoDeObra: {
    slug: 'calculadora-mao-de-obra-oficina-mecanica',
    label: 'Calculadora de mão de obra',
    cta: 'Receber calculadora grátis',
    storage: 'boxcerto_lead_magnet_mao_de_obra',
    headline: 'Calculadora de Mão de Obra para Oficina Mecânica',
    description: 'Calcule hora técnica, custo fixo e margem para parar de cobrar barato demais pelos serviços da oficina.',
  },
  fluxoCaixa: {
    slug: 'planilha-fluxo-caixa-oficina-mecanica-gratis',
    label: 'Planilha de fluxo de caixa',
    cta: 'Receber planilha de caixa',
    storage: 'boxcerto_lead_magnet_fluxo_caixa',
    headline: 'Planilha de Fluxo de Caixa para Oficina Mecânica Grátis',
    description: 'Organize entradas, despesas, contas a pagar e dinheiro que realmente sobra na oficina mecânica.',
  },
  estoque: {
    slug: 'planilha-estoque-pecas-oficina-gratis',
    label: 'Planilha de estoque de peças',
    cta: 'Receber planilha de estoque',
    storage: 'boxcerto_lead_magnet_estoque',
    headline: 'Planilha de Estoque de Peças para Oficina Grátis',
    description: 'Controle entradas, saídas, custo, preço de venda e estoque mínimo de peças da oficina.',
  },
}

const segments = [
  ['oficina mecânica pequena', 'oficina-mecanica-pequena', 'rotina enxuta, poucos funcionários e dono no atendimento'],
  ['auto elétrica', 'auto-eletrica', 'diagnósticos elétricos, bateria, alternador e módulos'],
  ['centro automotivo', 'centro-automotivo', 'volume alto de revisões, pneus, freios e suspensão'],
  ['oficina de motos', 'oficina-de-motos', 'serviços rápidos, peças pequenas e muito retorno pelo WhatsApp'],
  ['oficina diesel leve', 'oficina-diesel-leve', 'caminhonetes, utilitários e peças de maior valor'],
  ['oficina de suspensão e freios', 'oficina-suspensao-freios', 'serviços de segurança que exigem autorização clara'],
  ['oficina de ar-condicionado automotivo', 'oficina-ar-condicionado-automotivo', 'diagnóstico, gás, higienização e componentes específicos'],
  ['oficina de troca de óleo', 'oficina-troca-de-oleo', 'serviço recorrente, checklist e venda complementar'],
  ['oficina de estética automotiva', 'oficina-estetica-automotiva', 'pacotes, agendamento e aprovação antes da entrega'],
  ['funilaria e pintura', 'funilaria-e-pintura', 'orçamentos detalhados, fotos, prazos e etapas de serviço'],
  ['oficina de pneus e alinhamento', 'oficina-pneus-alinhamento', 'venda de produto, serviço rápido e controle de estoque'],
  ['oficina de câmbio automático', 'oficina-cambio-automatico', 'serviços técnicos caros que precisam de aprovação registrada'],
  ['oficina de injeção eletrônica', 'oficina-injecao-eletronica', 'diagnóstico técnico, sensores, limpeza e testes'],
  ['oficina de caminhonetes', 'oficina-caminhonetes', 'clientes exigentes, serviços preventivos e ticket maior'],
  ['oficina de importados', 'oficina-importados', 'peças caras, prazos maiores e orçamentos bem documentados'],
  ['oficina de híbridos e elétricos', 'oficina-hibridos-eletricos', 'procedimentos novos, segurança e histórico técnico'],
  ['retífica de motores', 'retifica-de-motores', 'etapas longas, itens de alto valor e acompanhamento do cliente'],
  ['oficina móvel', 'oficina-movel', 'atendimento fora da base, agenda, registro e cobrança organizada'],
]

const clusters = [
  {
    key: 'ordem-servico',
    name: 'Ordem de serviço',
    pillar: '/blog/planilha-ordem-de-servico-mecanica-gratis',
    lead: leadMagnets.os,
    intro: 'Sem OS organizada, a oficina perde histórico, autorização e clareza sobre o que foi combinado com o cliente.',
    actions: ['registrar cliente, veículo, placa e km', 'separar queixa, diagnóstico, peças e mão de obra', 'usar status simples para saber o que está parado', 'salvar aprovação antes de executar o serviço'],
    checklist: ['nome e WhatsApp do cliente', 'dados do veículo', 'descrição do problema', 'itens aprovados e recusados', 'valor de peças e mão de obra', 'prazo combinado'],
    templates: [
      ['ordem-de-servico-para-{slug}', 'Ordem de serviço para {name}: modelo, campos e controle'],
      ['como-organizar-os-em-{slug}', 'Como organizar OS em {name} sem perder serviço nem aprovação'],
    ],
  },
  {
    key: 'orcamento-whatsapp',
    name: 'Orçamento pelo WhatsApp',
    pillar: '/blog/orcamento-oficina-whatsapp',
    lead: leadMagnets.orcamento,
    intro: 'O WhatsApp ajuda a vender, mas também vira bagunça quando o orçamento fica solto em texto e sem retorno.',
    actions: ['montar uma proposta com itens separados', 'mandar link ou mensagem com prazo de validade', 'registrar se o cliente aprovou, recusou ou pediu ajuste', 'cobrar retorno com uma mensagem curta e profissional'],
    checklist: ['diagnóstico resumido', 'peças com valores', 'mão de obra separada', 'prazo de entrega', 'condição de pagamento', 'botão ou resposta clara para aprovar'],
    templates: [
      ['modelo-de-orcamento-para-{slug}', 'Modelo de orçamento para {name}: como enviar com clareza'],
      ['mensagem-de-orcamento-whatsapp-para-{slug}', 'Mensagem de orçamento no WhatsApp para {name}: pronta para adaptar'],
    ],
  },
  {
    key: 'estoque',
    name: 'Estoque e peças',
    pillar: '/blog/controle-estoque-pecas-oficina',
    lead: leadMagnets.estoque,
    intro: 'Peça sem controle vira prejuízo silencioso: sai da prateleira, entra na OS e ninguém sabe se foi cobrada com margem.',
    actions: ['cadastrar custo e preço de venda', 'dar baixa quando a peça entra na OS', 'definir estoque mínimo para itens de giro', 'conferir peças paradas todo fim de mês'],
    checklist: ['código ou descrição da peça', 'fornecedor', 'custo de compra', 'preço de venda', 'quantidade atual', 'estoque mínimo'],
    templates: [
      ['controle-de-estoque-para-{slug}', 'Controle de estoque para {name}: como evitar peça esquecida'],
      ['estoque-minimo-para-{slug}', 'Estoque mínimo para {name}: o que acompanhar para não travar serviço'],
    ],
  },
  {
    key: 'financeiro',
    name: 'Financeiro e lucro',
    pillar: '/blog/fluxo-de-caixa-oficina-mecanica',
    lead: leadMagnets.fluxoCaixa,
    intro: 'Oficina cheia não significa oficina lucrativa. Sem caixa separado, faturamento e lucro parecem a mesma coisa.',
    actions: ['separar entrada de serviço, peça e venda avulsa', 'registrar despesas fixas e variáveis', 'acompanhar contas a pagar por vencimento', 'olhar lucro por OS, não só dinheiro no caixa'],
    checklist: ['receita do dia', 'custo de peças', 'mão de obra', 'despesas fixas', 'retiradas do dono', 'saldo previsto'],
    templates: [
      ['fluxo-de-caixa-para-{slug}', 'Fluxo de caixa para {name}: como saber se sobra dinheiro de verdade'],
      ['calculo-de-mao-de-obra-para-{slug}', 'Cálculo de mão de obra para {name}: cobre sem perder margem'],
    ],
  },
  {
    key: 'organizacao',
    name: 'Organização da oficina',
    pillar: '/blog/como-organizar-oficina-mecanica-pequena',
    lead: leadMagnets.os,
    intro: 'A bagunça não aparece de uma vez. Ela nasce quando carro entra sem status, cliente fica sem retorno e serviço depende da memória.',
    actions: ['criar uma fila única de veículos', 'usar status visíveis para cada etapa', 'definir responsável por retorno ao cliente', 'revisar pendências no início e fim do dia'],
    checklist: ['entrada do veículo', 'responsável técnico', 'status atual', 'peças pendentes', 'orçamento enviado', 'previsão de entrega'],
    templates: [
      ['como-organizar-{slug}', 'Como organizar {name} sem depender de papel, planilha e memória'],
      ['controle-de-servicos-em-andamento-para-{slug}', 'Controle de serviços em andamento para {name}: status simples que funciona'],
    ],
  },
  {
    key: 'sistema',
    name: 'Sistema para oficina',
    pillar: '/blog/sistema-para-oficina-mecanica',
    lead: null,
    intro: 'Um sistema bom não deve complicar a oficina. Ele precisa reduzir retrabalho, proteger aprovação e mostrar onde o dinheiro está.',
    actions: ['testar a abertura de uma OS real', 'enviar um orçamento por link', 'conferir se estoque e financeiro conversam com a OS', 'avaliar se a equipe entende sem treinamento longo'],
    checklist: ['OS digital', 'orçamento por WhatsApp', 'aprovação registrada', 'controle de status', 'estoque integrado', 'financeiro simples'],
    templates: [
      ['sistema-para-{slug}', 'Sistema para {name}: o que precisa ter antes de contratar'],
      ['app-para-{slug}', 'App para {name}: como controlar OS, orçamento e financeiro no celular'],
    ],
  },
]

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function stripAccents(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function articlePages() {
  const pages = []
  const existingSlugs = new Set(existingPosts.map(([, slug]) => slug))
  for (const cluster of clusters) {
    for (const [segmentName, segmentSlug, segmentContext] of segments) {
      for (const [slugTpl, titleTpl] of cluster.templates) {
        let slug = slugTpl.replace('{slug}', segmentSlug)
        if (existingSlugs.has(slug)) slug = `${slug}-guia-pratico`
        const title = titleTpl.replace('{name}', segmentName)
        const meta = `${title}. Veja checklist, erros comuns e um caminho simples para organizar a rotina da oficina.`
        pages.push({
          slug,
          title,
          meta,
          cluster,
          segmentName,
          segmentContext,
          url: `/blog/${slug}`,
        })
      }
    }
  }
  return pages
}

function relatedFor(page, pages) {
  const same = pages.filter((item) => item.cluster.key === page.cluster.key && item.slug !== page.slug)
  const pillar = {
    title: `${page.cluster.name}: guia principal`,
    url: page.cluster.pillar,
    category: 'Pilar',
  }
  return [
    pillar,
    ...same.slice(0, 2).map((item) => ({ title: item.title, url: item.url, category: item.cluster.name })),
  ]
}

function leadCta(page) {
  if (!page.cluster.lead) {
    return {
      title: 'Quer testar em uma OS real?',
      text: 'Crie sua conta gratis e veja como o BoxCerto organiza OS, orcamento, aprovacao, estoque e financeiro sem planilha perdida.',
      href: '/cadastro?origem=artigo-guia-sistema&utm_source=blog&utm_campaign=guias-oficina',
      label: 'Testar o BoxCerto grátis',
      event: 'article_trial_cta_click',
    }
  }
  return {
    title: `Quer começar com ${page.cluster.lead.label.toLowerCase()}?`,
    text: `Use o material gratuito para organizar a rotina e veja quando vale migrar para uma OS digital com aprovacoes, status e financeiro no BoxCerto.`,
    href: `/${page.cluster.lead.slug}`,
    label: page.cluster.lead.cta,
    event: 'article_lead_magnet_click',
  }
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c')
}

function articleHtml(page, allPages) {
  const cta = leadCta(page)
  const related = relatedFor(page, allPages)
  const faq = [
    [`${page.title} vale para oficina pequena?`, `Sim. O guia foi pensado para ${page.segmentName}, especialmente quando a rotina ainda depende de papel, WhatsApp e memoria.`],
    [`Preciso usar planilha ou sistema?`, `A planilha ajuda no comeco, mas com mais servicos em andamento o sistema reduz perda de informacao, aprovacao esquecida e peca sem cobranca.`],
    [`Como o BoxCerto entra nessa rotina?`, `O BoxCerto centraliza OS, orcamento por link, aprovacao do cliente, status, estoque e financeiro em uma rotina simples para oficina independente.`],
  ]
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: page.title,
    description: page.meta,
    author: { '@type': 'Organization', name: 'BoxCerto' },
    publisher: { '@type': 'Organization', name: 'BoxCerto', logo: { '@type': 'ImageObject', url: `${site}/logo.svg` } },
    datePublished: today,
    dateModified: today,
    mainEntityOfPage: `${site}${page.url}`,
    url: `${site}${page.url}`,
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: site },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog` },
      { '@type': 'ListItem', position: 3, name: page.title, item: `${site}${page.url}` },
    ],
  }
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(page.title)} | BoxCerto</title>
<meta name="description" content="${esc(page.meta)}">
<link rel="canonical" href="${site}${page.url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.meta)}">
<meta property="og:image" content="${site}/og-image.png">
<meta property="og:url" content="${site}${page.url}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd(articleSchema)}</script>
<script type="application/ld+json" data-schema="breadcrumb">${jsonLd(breadcrumbSchema)}</script>
<script type="application/ld+json" data-schema="faq">${jsonLd(faqSchema)}</script>
<link rel="stylesheet" href="../blog/blog.css">
</head>
<body class="blog-article seo-article">
<nav>
  <div class="nav-inner">
    <a href="/" class="brand"><img src="../logo.svg" width="24" height="24" alt="BoxCerto">BoxCerto</a>
    <a href="/cadastro?origem=nav-artigo-guia" class="nav-cta" data-blog-event="article_trial_cta_click">Testar grátis 7 dias</a>
  </div>
</nav>
<header class="hero">
  <div class="hero-tag">${esc(page.cluster.name)}</div>
  <h1>${esc(page.title)}</h1>
  <p class="hero-sub">Guia prático para ${esc(page.segmentName)} organizar a rotina, evitar perda de informação e transformar controle em orçamento aprovado.</p>
</header>
<main class="container">
  <div class="breadcrumb"><a href="/">BoxCerto</a> &gt; <a href="/blog">Blog</a> &gt; <a href="/blog/guias-oficina-mecanica">Guias por assunto</a> &gt; ${esc(page.cluster.name)}</div>
  <article class="article">
    <p>${esc(page.cluster.intro)} Em ${esc(page.segmentName)}, isso fica ainda mais sensivel porque a rotina envolve ${esc(page.segmentContext)}.</p>
    <section class="article-inline-cta" aria-label="Material gratuito BoxCerto">
      <strong>${esc(cta.title)}</strong>
      <p>${esc(cta.text)}</p>
      <a href="${cta.href}" class="btn-read" data-blog-event="${cta.event}" data-blog-label="${esc(stripAccents(page.slug))}">${esc(cta.label)}</a>
    </section>
    <h2>Por que esse tema importa para ${esc(page.segmentName)}</h2>
    <p>O problema raramente aparece como uma grande falha. Ele aparece em detalhes pequenos: cliente sem retorno, peca que saiu e ninguem cobrou, orcamento aprovado sem registro, carro parado sem previsao ou dinheiro entrando sem mostrar se sobrou lucro.</p>
    <p>Quando a oficina cria uma rotina simples de controle, cada servico deixa rastro: quem pediu, o que foi diagnosticado, quanto custa, quem aprovou e em qual etapa esta.</p>
    <h2>Passo a passo para aplicar na oficina</h2>
    <ol>
      ${page.cluster.actions.map((item) => `<li><strong>${esc(item[0].toUpperCase() + item.slice(1))}.</strong> Transforme esse ponto em uma rotina visivel para a equipe e para o cliente.</li>`).join('\n      ')}
    </ol>
    <div class="box-destaque">
      <strong>Dica pratica:</strong> comece pelo ponto que mais faz dinheiro escapar hoje. Para muita oficina, e o orcamento enviado no WhatsApp sem aprovacao registrada.
    </div>
    <h2>Checklist rapido</h2>
    <ul>
      ${page.cluster.checklist.map((item) => `<li>${esc(item)}</li>`).join('\n      ')}
    </ul>
    <h2>Planilha, papel ou sistema?</h2>
    <table class="tabela">
      <thead><tr><th>Rotina</th><th>No improviso</th><th>Com controle</th></tr></thead>
      <tbody>
        <tr><td>Registro</td><td>Fica no papel ou na conversa</td><td>Fica ligado ao cliente e ao veiculo</td></tr>
        <tr><td>Aprovacao</td><td>Depende de memoria</td><td>Fica registrada com data e status</td></tr>
        <tr><td>Financeiro</td><td>So aparece no fim do mes</td><td>Acompanha custo, venda e margem por OS</td></tr>
      </tbody>
    </table>
    <section class="product-proof-block" aria-labelledby="produto-${esc(page.slug)}">
      <div>
        <span>Como fica no BoxCerto</span>
        <h2 id="produto-${esc(page.slug)}">Do guia para a rotina digital</h2>
        <p>Em vez de procurar informacao em papel, planilha e WhatsApp, a oficina acompanha OS, orcamento, status, estoque e financeiro em uma tela simples.</p>
        <a href="/cadastro?origem=produto-artigo-guia&utm_source=blog&utm_campaign=guias-oficina" class="btn-read" data-blog-event="article_trial_cta_click">Testar o BoxCerto grátis</a>
      </div>
      <div class="proof-window">
        <div class="proof-bar"><span></span><span></span><span></span></div>
        <div class="proof-row strong"><span>OS digital</span><b>Aguardando aprovacao</b></div>
        <div class="proof-row"><span>Orcamento por link</span><b>Enviado no WhatsApp</b></div>
        <div class="proof-row"><span>Status</span><b>Em andamento</b></div>
        <div class="proof-row"><span>Financeiro</span><b>Margem visivel</b></div>
      </div>
    </section>
    <h2>Erros comuns que atrapalham</h2>
    <ul>
      <li>Mandar valor solto no WhatsApp sem listar itens.</li>
      <li>Executar servico sem registrar autorizacao do cliente.</li>
      <li>Comprar peca para uma OS e nao vincular esse custo ao servico.</li>
      <li>Medir faturamento, mas nao medir lucro por servico entregue.</li>
    </ul>
    <h2>Perguntas frequentes</h2>
    ${faq.map(([question, answer]) => `<h3>${esc(question)}</h3><p>${esc(answer)}</p>`).join('\n    ')}
    <section class="blog-trial-cta" aria-label="Teste gratis do BoxCerto">
      <h2>Quer organizar isso sem papel, planilha e WhatsApp perdido?</h2>
      <p>Com o BoxCerto, voce cria OS, envia orcamento por link, acompanha aprovacoes, estoque e financeiro em uma rotina simples para oficina independente.</p>
      <a href="/cadastro?origem=cta-artigo-guia&utm_source=blog&utm_campaign=guias-oficina" class="btn-cta-white" data-blog-event="article_trial_cta_click">Testar grátis por 7 dias</a>
    </section>
  </article>
  <aside class="related" aria-labelledby="relacionados-${esc(page.slug)}">
    <h3 id="relacionados-${esc(page.slug)}">Guias relacionados</h3>
    <div class="related-grid">
      ${related.map((item) => `<a href="${item.url}" class="related-card" data-blog-event="article_internal_link_click"><span>${esc(item.category)}</span><strong>${esc(item.title)}</strong></a>`).join('\n      ')}
    </div>
  </aside>
</main>
<footer><p>© 2026 BoxCerto · Sistema de gestao para oficinas mecanicas</p><div class="footer-links"><a href="/">Inicio</a><a href="/blog">Blog</a><a href="/cadastro">Testar gratis</a><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a></div></footer>
<script>
(function () {
  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-blog-event]');
    if (!target || typeof gtag !== 'function') return;
    gtag('event', target.getAttribute('data-blog-event'), {
      event_label: target.getAttribute('data-blog-label') || target.textContent.trim(),
      page_path: window.location.pathname
    });
  });
})();
</script>
</body>
</html>
`
}

function leadPageHtml(lead) {
  const benefits = {
    [leadMagnets.orcamento.slug]: ['Envie proposta clara no WhatsApp', 'Separe peca, mao de obra e prazo', 'Reduza cliente que some depois do valor', 'Mostre quando vale usar orcamento por link'],
    [leadMagnets.maoDeObra.slug]: ['Calcule hora tecnica', 'Inclua custo fixo e margem', 'Evite cobrar barato demais', 'Compare servicos simples e complexos'],
    [leadMagnets.fluxoCaixa.slug]: ['Veja entrada e saida por dia', 'Separe faturamento de lucro', 'Controle contas a pagar', 'Entenda dinheiro que realmente sobra'],
    [leadMagnets.estoque.slug]: ['Registre entrada e saida de peca', 'Defina estoque minimo', 'Evite peca usada sem cobranca', 'Acompanhe custo e preco de venda'],
  }[lead.slug]
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(lead.headline)} | BoxCerto</title>
<meta name="description" content="${esc(lead.description)}">
<link rel="canonical" href="${site}/${lead.slug}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(lead.headline)} | BoxCerto">
<meta property="og:description" content="${esc(lead.description)}">
<meta property="og:image" content="${site}/og-image.png">
<meta property="og:url" content="${site}/${lead.slug}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd({ '@context': 'https://schema.org', '@type': 'WebPage', name: lead.headline, description: lead.description, url: `${site}/${lead.slug}`, publisher: { '@type': 'Organization', name: 'BoxCerto', logo: { '@type': 'ImageObject', url: `${site}/logo.svg` } } })}</script>
<script type="application/ld+json" data-schema="breadcrumb">${jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: site }, { '@type': 'ListItem', position: 2, name: lead.headline, item: `${site}/${lead.slug}` }] })}</script>
<link rel="stylesheet" href="blog/blog.css">
</head>
<body class="lead-page">
<nav><div class="nav-inner"><a href="/" class="brand"><img src="logo.svg" width="28" height="28" alt="BoxCerto">BoxCerto</a><a href="/cadastro?origem=${lead.slug}-nav" class="nav-cta" data-lead-event="lead_magnet_trial_click">Testar grátis 7 dias</a></div></nav>
<main class="lead-hero">
  <section class="lead-copy" aria-labelledby="lead-title">
    <div class="eyebrow">Material gratuito para oficina</div>
    <h1 id="lead-title">${esc(lead.headline)}</h1>
    <p>${esc(lead.description)}</p>
    <div class="lead-benefits" aria-label="Beneficios do material">
      ${benefits.map((item) => `<span>${esc(item)}</span>`).join('\n      ')}
    </div>
    <div class="lead-proof-mini"><strong>Depois do modelo:</strong><span>teste o BoxCerto grátis e transforme essa rotina em OS digital, orçamento por link, aprovação registrada e financeiro no painel.</span></div>
  </section>
  <section class="lead-form-card" aria-labelledby="form-title">
    <div id="lead-form-state">
      <div class="section-kicker">Receber material</div>
      <h2 id="form-title">Preencha para liberar o material gratuito</h2>
      <p>Use o modelo para organizar a rotina da oficina e, se fizer sentido, continue para testar o BoxCerto na prática.</p>
      <form id="lead-magnet-form" class="lead-form">
        <label for="lead-name">Nome</label>
        <input id="lead-name" name="nome" type="text" autocomplete="name" required placeholder="Seu nome">
        <label for="lead-whatsapp">WhatsApp</label>
        <input id="lead-whatsapp" name="whatsapp" type="tel" autocomplete="tel" required placeholder="(00) 00000-0000">
        <label for="lead-email">E-mail</label>
        <input id="lead-email" name="email" type="email" autocomplete="email" required placeholder="voce@email.com">
        <button type="submit" class="btn-read">${esc(lead.cta)}</button>
      </form>
      <small>Você também pode testar o BoxCerto grátis e transformar essa rotina em uma OS digital.</small>
    </div>
    <div id="lead-success-state" class="lead-success" hidden>
      <div class="success-mark" aria-hidden="true">✓</div>
      <h2>Pronto! Material liberado.</h2>
      <p>O próximo passo é testar o BoxCerto grátis e criar uma OS digital com orçamento por link, aprovação registrada e financeiro organizado.</p>
      <a href="/cadastro?origem=${lead.slug}-sucesso&utm_source=lead_magnet&utm_campaign=${lead.slug}" class="btn-read" data-lead-event="lead_magnet_trial_click">Testar o BoxCerto grátis</a>
      <a href="/blog/guias-oficina-mecanica" class="btn-link">Ver outros guias</a>
    </div>
  </section>
</main>
<section class="lead-after" aria-labelledby="lead-after-title">
  <div class="section-heading compact-heading"><div class="section-kicker">Do material para a rotina</div><h2 id="lead-after-title">Como isso fica no BoxCerto</h2><p>Em vez de espalhar informação em papel, planilha e conversa de WhatsApp, a oficina acompanha tudo em uma tela simples.</p></div>
  <div class="proof-window lead-proof-window"><div class="proof-bar"><span></span><span></span><span></span></div><div class="proof-row strong"><span>OS digital</span><b>Aguardando aprovação</b></div><div class="proof-row"><span>Orçamento por link</span><b>Enviado no WhatsApp</b></div><div class="proof-row"><span>Status da oficina</span><b>Em andamento</b></div><div class="proof-row"><span>Estoque e financeiro</span><b>No painel</b></div></div>
</section>
<footer><p>© 2026 BoxCerto · Sistema de gestao para oficinas mecanicas</p><div class="footer-links"><a href="/">Inicio</a><a href="/blog">Blog</a><a href="/cadastro">Testar gratis</a><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a></div></footer>
<script>
(function () {
  if (typeof gtag === 'function') gtag('event', 'lead_magnet_page_view', { page_path: window.location.pathname });
  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-lead-event]');
    if (!target || typeof gtag !== 'function') return;
    gtag('event', target.getAttribute('data-lead-event'), { event_label: target.textContent.trim(), page_path: window.location.pathname });
  });
  var form = document.getElementById('lead-magnet-form');
  var formState = document.getElementById('lead-form-state');
  var successState = document.getElementById('lead-success-state');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = { nome: form.elements.nome.value.trim(), whatsapp: form.elements.whatsapp.value.trim(), email: form.elements.email.value.trim(), origem: '${lead.slug}', criadoEm: new Date().toISOString() };
    var leads = JSON.parse(localStorage.getItem('${lead.storage}') || '[]');
    leads.push(data);
    localStorage.setItem('${lead.storage}', JSON.stringify(leads));
    if (typeof gtag === 'function') gtag('event', 'lead_magnet_form_submit', { event_label: '${lead.slug}', page_path: window.location.pathname });
    formState.hidden = true;
    successState.hidden = false;
  });
})();
</script>
</body>
</html>
`
}

function hubHtml(pages) {
  const groups = clusters.map((cluster) => ({
    cluster,
    pages: pages.filter((page) => page.cluster.key === cluster.key),
  }))
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Guias para oficina mecanica',
    description: 'Biblioteca de guias praticos para OS, orcamento, estoque, financeiro, organizacao e sistema para oficinas.',
    url: `${site}/blog/guias-oficina-mecanica`,
    publisher: { '@type': 'Organization', name: 'BoxCerto', logo: { '@type': 'ImageObject', url: `${site}/logo.svg` } },
  }
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Guias para Oficina Mecânica: OS, Orçamento, Estoque e Financeiro | BoxCerto</title>
<meta name="description" content="Biblioteca de guias práticos para donos de oficina mecânica organizarem OS, orçamento pelo WhatsApp, estoque, financeiro e atendimento.">
<link rel="canonical" href="${site}/blog/guias-oficina-mecanica">
<meta property="og:type" content="website">
<meta property="og:title" content="Guias para Oficina Mecânica | BoxCerto">
<meta property="og:description" content="Guias práticos para oficinas mecânicas venderem melhor e perderem menos dinheiro no improviso.">
<meta property="og:image" content="${site}/og-image.png">
<meta property="og:url" content="${site}/blog/guias-oficina-mecanica">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd(schema)}</script>
<script type="application/ld+json" data-schema="breadcrumb">${jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: site }, { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog` }, { '@type': 'ListItem', position: 3, name: 'Guias para oficina mecanica', item: `${site}/blog/guias-oficina-mecanica` }] })}</script>
<link rel="stylesheet" href="../blog/blog.css">
</head>
<body class="blog-home seo-hub-page">
<nav><div class="nav-inner"><a href="/" class="brand"><img src="../logo.svg" width="28" height="28" alt="BoxCerto">BoxCerto</a><a href="/cadastro?origem=hub-guias-oficina" class="nav-cta">Testar grátis 7 dias</a></div></nav>
<header class="hero seo-hub-hero">
  <div class="hero-copy">
    <div class="eyebrow">Guias práticos BoxCerto</div>
    <h1>Guias para oficina mecânica organizar OS, orçamento, estoque e financeiro</h1>
    <p>Modelos, planilhas e guias para resolver problemas reais da oficina: OS perdida, orçamento sem retorno, estoque bagunçado e financeiro no chute.</p>
    <div class="hero-actions"><a href="/planilha-os-oficina-mecanica-gratis" class="hero-primary">Baixar modelo de OS grátis</a><a href="/cadastro?origem=hub-guias-hero" class="hero-secondary">Testar o BoxCerto grátis</a></div>
  </div>
  <div class="seo-hub-stats" aria-label="Resumo dos guias"><strong>Guias por tema</strong><span>Ordem de serviço</span><span>Orçamento pelo WhatsApp</span><span>Estoque, financeiro e organização</span></div>
</header>
<main class="container seo-hub">
  <section class="lead-magnet-grid" aria-labelledby="materiais-gratis">
    <div class="section-heading compact-heading"><div class="section-kicker">Materiais gratuitos</div><h2 id="materiais-gratis">Baixe modelos para organizar sua oficina hoje.</h2><p>Escolha um material para começar pelo problema mais urgente: OS, orçamento, mão de obra, caixa ou estoque.</p></div>
    <div class="commercial-grid">
      ${Object.values(leadMagnets).map((lead) => `<a href="/${lead.slug}"><strong>${esc(lead.label)}</strong><span>${esc(lead.description)}</span></a>`).join('\n      ')}
    </div>
  </section>
  ${groups.map(({ cluster, pages: clusterPages }) => `<section class="seo-hub-section" id="${cluster.key}">
    <div class="section-heading compact-heading"><div class="section-kicker">${esc(cluster.name)}</div><h2>${esc(cluster.name)} para oficinas de diferentes especialidades</h2><p>${esc(cluster.intro)}</p></div>
    <div class="seo-topic-list">
      ${clusterPages.map((page) => `<a href="${page.url}">${esc(page.title)}</a>`).join('\n      ')}
    </div>
  </section>`).join('\n  ')}
  <section class="cta-banner"><h2>Leve essa organização para dentro da sua oficina.</h2><p>Com o BoxCerto, você cria OS, envia orçamento por link, acompanha aprovações, estoque e financeiro em uma rotina simples.</p><div class="cta-actions"><a href="/cadastro?origem=hub-guias-final" class="btn-cta-white">Começar teste grátis</a><a href="/blog" class="btn-cta-outline">Voltar ao blog</a></div></section>
</main>
<footer><p>© 2026 BoxCerto · Sistema de gestao para oficinas mecanicas</p><div class="footer-links"><a href="/">Inicio</a><a href="/blog">Blog</a><a href="/cadastro">Testar gratis</a><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a></div></footer>
</body>
</html>
`
}

function sitemapXml(pages) {
  const base = [
    ['', 'weekly', '1.0', '2026-05-22'],
    ['cadastro', 'monthly', '0.9', '2026-05-22'],
    ['login', 'monthly', '0.5', '2026-05-22'],
    ['quizdiagnostico', 'monthly', '0.9', '2026-05-22'],
    ['lpquizdiagnostico', 'monthly', '0.8', '2026-05-22'],
    ['lp', 'monthly', '0.8', '2026-05-22'],
    ['lp2', 'monthly', '0.7', '2026-05-22'],
    ['lpsistema-para-oficina-pequena', 'monthly', '0.8', '2026-05-22'],
    ['lpboxcerto-vs-planilha', 'monthly', '0.8', '2026-05-22'],
    ['lporcamento-online-oficina', 'monthly', '0.8', '2026-05-22'],
    ['lpdiagnostico', 'monthly', '0.7', '2026-05-22'],
    ['blog', 'weekly', '0.8', today],
    ['blog/guias-oficina-mecanica', 'weekly', '0.85', today],
    ...Object.values(leadMagnets).map((lead) => [lead.slug, 'monthly', '0.9', today]),
    ...existingPosts.map(([, slug]) => [`blog/${slug}`, 'monthly', slug.includes('planilha') || slug.includes('sistema') ? '0.9' : '0.8', '2026-05-25']),
    ...pages.map((page) => [`blog/${page.slug}`, 'monthly', page.cluster.key === 'sistema' ? '0.72' : '0.7', today]),
    ['termos', 'yearly', '0.3', '2026-05-22'],
    ['privacidade', 'yearly', '0.3', '2026-05-22'],
  ]
  const urls = base.map(([loc, changefreq, priority, lastmod]) => `  <url>
    <loc>${site}/${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`).join('\n\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls}

</urlset>
`
}

async function updateBlogIndex(pages) {
  const file = path.join(blogDir, 'index.html')
  let html = await readFile(file, 'utf8')
  const marker = '  <section class="commercial-links" aria-labelledby="paginas-comerciais">'
  const block = `  <section class="seo-library-callout" aria-labelledby="biblioteca-guias">
    <div>
      <div class="section-kicker">Guias por assunto</div>
      <h2 id="biblioteca-guias">Encontre o guia certo para a rotina da sua oficina.</h2>
      <p>Reunimos modelos, planilhas e conteúdos práticos para ordem de serviço, orçamento pelo WhatsApp, estoque, financeiro, organização e atendimento.</p>
      <div class="seo-library-metrics" aria-label="Temas dos guias">
        <span>OS e orçamento</span>
        <span>Estoque e peças</span>
        <span>Financeiro e lucro</span>
      </div>
    </div>
    <div class="lead-actions">
      <a href="/blog/guias-oficina-mecanica" class="btn-read" data-blog-event="blog_library_click" data-blog-label="library_hub">Ver todos os guias</a>
      <a href="/modelo-orcamento-oficina-mecanica-gratis" class="btn-link" data-blog-event="blog_library_click" data-blog-label="modelo_orcamento">Modelo de orçamento grátis</a>
    </div>
  </section>

`
  if (html.includes('class="seo-library-callout"')) {
    html = html.replace(/  <section class="seo-library-callout"[\s\S]*?\n  <\/section>\n\n/, block)
  } else {
    html = html.replace(marker, block + marker)
  }
  await writeFile(file, html, 'utf8')
}

async function main() {
  await mkdir(blogDir, { recursive: true })
  const pages = articlePages()
  for (const page of pages) {
    await writeFile(path.join(blogDir, `${page.slug}.html`), articleHtml(page, pages), 'utf8')
  }
  await writeFile(path.join(blogDir, 'guias-oficina-mecanica.html'), hubHtml(pages), 'utf8')
  for (const lead of Object.values(leadMagnets)) {
    if (lead.slug === leadMagnets.os.slug) continue
    await writeFile(path.join(publicDir, `${lead.slug}.html`), leadPageHtml(lead), 'utf8')
  }
  await updateBlogIndex(pages)
  await writeFile(path.join(publicDir, 'sitemap.xml'), sitemapXml(pages), 'utf8')
  console.log(`Generated ${pages.length} SEO guide pages, 1 hub page, 4 lead magnet pages, and sitemap.xml`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
