import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const site = 'https://www.boxcerto.com'
const today = '2026-05-27'

const moneyPages = [
  {
    slug: 'sistema-para-oficina-mecanica',
    eyebrow: 'Sistema para oficina mecânica',
    title: 'Sistema para oficina mecânica que tira sua rotina do improviso',
    description: 'Controle OS, orçamentos, aprovações, estoque e financeiro em uma tela simples para oficina independente.',
    meta: 'Conheça um sistema para oficina mecânica com OS digital, orçamento por WhatsApp, aprovação registrada, estoque e financeiro.',
    primaryCta: 'Testar o BoxCerto grátis',
    secondaryCta: 'Receber checklist grátis',
    resourceSlug: 'checklist-revisao-veicular-oficina-gratis',
    resourceLabel: 'Checklist de revisão',
    pain: 'O problema não é falta de movimento. É serviço sem status, orçamento perdido no WhatsApp, peça que saiu sem cobrança e financeiro no chute.',
    bullets: [
      'Abra uma OS digital com cliente, veículo, serviços e peças.',
      'Envie orçamento por link e registre a aprovação do cliente.',
      'Acompanhe status de cada carro sem depender da memória.',
      'Veja estoque e financeiro conversando com a rotina da oficina.',
    ],
    faq: [
      ['O BoxCerto serve para oficina pequena?', 'Sim. A proposta é organizar a rotina de oficinas independentes sem exigir processo complicado ou treinamento longo.'],
      ['Preciso instalar programa no computador?', 'Não. O BoxCerto funciona online e também pode ser usado como PWA no celular.'],
      ['Consigo testar antes de pagar?', 'Sim. Você pode testar grátis por 7 dias antes de decidir.'],
    ],
  },
  {
    slug: 'programa-para-oficina-mecanica',
    eyebrow: 'Programa para oficina mecânica',
    title: 'Programa para oficina mecânica simples de usar no dia a dia',
    description: 'Saia do papel, planilha e conversa perdida. O BoxCerto organiza atendimento, OS, orçamento e financeiro.',
    meta: 'Veja como escolher um programa para oficina mecânica e como o BoxCerto ajuda a controlar OS, orçamentos e financeiro.',
    primaryCta: 'Começar teste grátis',
    secondaryCta: 'Receber modelo de orçamento',
    resourceSlug: 'modelo-orcamento-oficina-mecanica-gratis',
    resourceLabel: 'Modelo de orçamento',
    pain: 'Programa bom para oficina não pode virar mais uma tarefa. Ele precisa reduzir retrabalho e deixar claro o que está aprovado, parado ou pronto para entregar.',
    bullets: [
      'Fluxo enxuto para cadastrar cliente, veículo e serviço.',
      'Orçamento com itens separados e envio por WhatsApp.',
      'Histórico por cliente e veículo para não perder informação.',
      'Painel financeiro para enxergar entrada, custo e margem.',
    ],
    faq: [
      ['Qual a diferença entre programa e planilha?', 'A planilha ajuda no começo, mas não registra aprovação, status e financeiro integrado como um sistema de oficina.'],
      ['Funciona no celular?', 'Sim. O BoxCerto foi pensado para funcionar bem no celular e no computador.'],
      ['Quanto custa?', 'O plano principal do BoxCerto custa R$97 por mês.'],
    ],
  },
  {
    slug: 'ordem-de-servico-oficina-mecanica',
    eyebrow: 'Ordem de serviço para oficina',
    title: 'Ordem de serviço para oficina mecânica com aprovação registrada',
    description: 'Crie OS digital, detalhe serviços e peças, envie orçamento por link e acompanhe cada status do veículo.',
    meta: 'Veja como uma ordem de serviço para oficina mecânica deve funcionar e como o BoxCerto substitui papel e planilha.',
    primaryCta: 'Criar minha primeira OS',
    secondaryCta: 'Receber checklist grátis',
    resourceSlug: 'checklist-revisao-veicular-oficina-gratis',
    resourceLabel: 'Checklist de revisão',
    pain: 'Sem OS organizada, o combinado fica espalhado entre papel, áudio, mensagem e memória. É aí que aparecem retrabalho, discussão e serviço esquecido.',
    bullets: [
      'Dados do cliente, veículo, placa, km e queixa em um lugar só.',
      'Itens de peça e mão de obra separados para o cliente entender.',
      'Aprovação registrada antes de executar o serviço.',
      'Status por veículo para saber o que está aguardando, aprovado ou em andamento.',
    ],
    faq: [
      ['Uma OS digital substitui o papel?', 'Sim, desde que registre dados, itens, valores, status e aprovação do cliente de forma clara.'],
      ['Posso enviar a OS pelo WhatsApp?', 'No BoxCerto, você pode enviar o orçamento por link e acompanhar a aprovação.'],
      ['A equipe consegue usar?', 'A tela foi pensada para uso simples, com poucos passos e linguagem de oficina.'],
    ],
  },
  {
    slug: 'orcamento-whatsapp-oficina',
    eyebrow: 'Orçamento pelo WhatsApp',
    title: 'Orçamento pelo WhatsApp para oficina sem perder cliente no meio da conversa',
    description: 'Transforme texto solto em orçamento claro, com itens, prazo, valor e aprovação registrada.',
    meta: 'Aprenda a enviar orçamento pelo WhatsApp para oficina e veja como o BoxCerto registra aprovação por link.',
    primaryCta: 'Enviar orçamento por link',
    secondaryCta: 'Receber mensagem pronta',
    resourceSlug: 'mensagem-cobrar-retorno-orcamento-whatsapp',
    resourceLabel: 'Mensagem de retorno',
    pain: 'Quando o orçamento vai solto no WhatsApp, o cliente compara só o preço, some da conversa e a oficina não sabe se cobra retorno ou libera a peça.',
    bullets: [
      'Monte proposta com peça, mão de obra, prazo e condição.',
      'Envie um link claro para o cliente aprovar.',
      'Registre aprovação antes de começar o serviço.',
      'Cobre retorno sem parecer insistente.',
    ],
    faq: [
      ['Orçamento por WhatsApp funciona?', 'Funciona melhor quando a mensagem é clara e a aprovação fica registrada, não perdida no histórico da conversa.'],
      ['O cliente precisa baixar app?', 'Não. Ele recebe um link e consegue aprovar pelo celular.'],
      ['Posso usar modelos prontos?', 'Sim. Criamos uma página com mensagem pronta para cobrar retorno de orçamento.'],
    ],
  },
  {
    slug: 'controle-estoque-oficina',
    eyebrow: 'Controle de estoque para oficina',
    title: 'Controle de estoque para oficina mecânica sem peça esquecida e prejuízo escondido',
    description: 'Controle entrada, saída, custo, venda e estoque mínimo de peças vinculadas à OS.',
    meta: 'Veja como controlar estoque de oficina mecânica e como o BoxCerto ajuda a evitar peça usada sem cobrança.',
    primaryCta: 'Organizar estoque da oficina',
    secondaryCta: 'Receber planilha de estoque',
    resourceSlug: 'planilha-estoque-pecas-oficina-gratis',
    resourceLabel: 'Planilha de estoque',
    pain: 'Peça parada empata dinheiro. Peça usada sem baixa vira prejuízo. E peça comprada para uma OS sem registro distorce o lucro do serviço.',
    bullets: [
      'Registre custo de compra e preço de venda.',
      'Vincule peça usada à OS correta.',
      'Acompanhe estoque mínimo dos itens de giro.',
      'Veja o impacto de peças no financeiro da oficina.',
    ],
    faq: [
      ['Preciso cadastrar todas as peças?', 'Comece pelas peças de maior giro e maior valor. Depois expanda o controle.'],
      ['O estoque conversa com a OS?', 'No BoxCerto, a ideia é conectar peça, serviço e financeiro em uma rotina simples.'],
      ['Planilha resolve?', 'Ajuda no começo, mas fica limitada quando a oficina tem mais OS em andamento.'],
    ],
  },
]

const resources = [
  {
    slug: 'planilha-os-oficina-mecanica-gratis',
    label: 'Planilha de OS',
    title: 'Planilha de OS para oficina mecânica grátis',
    description: 'Receba um modelo pronto para organizar serviços, clientes, veículos, valores e status da sua oficina.',
    meta: 'Baixe uma planilha de OS para oficina mecânica e veja quando vale migrar para uma ordem de serviço digital.',
    cta: 'Receber modelo grátis',
    kind: 'lead_magnet_os',
    benefits: ['Controle serviços em aberto', 'Registre cliente e veículo', 'Evite orçamento perdido', 'Veja quando migrar para OS digital'],
    after: 'No BoxCerto, a planilha vira uma OS digital com orçamento por link, aprovação registrada, estoque e financeiro.',
  },
  {
    slug: 'modelo-orcamento-oficina-mecanica-gratis',
    label: 'Modelo de orçamento',
    title: 'Modelo de orçamento para oficina mecânica grátis',
    description: 'Receba um modelo pronto para enviar proposta clara, separar peças, mão de obra, prazo e aumentar a chance de aprovação.',
    meta: 'Receba um modelo de orçamento para oficina mecânica e veja como enviar propostas claras no WhatsApp com ajuda do BoxCerto.',
    cta: 'Receber modelo grátis',
    kind: 'lead_magnet_orcamento',
    benefits: ['Separe peça e mão de obra', 'Mostre prazo e validade', 'Evite texto solto no WhatsApp', 'Veja quando migrar para orçamento por link'],
    after: 'Depois do modelo, o BoxCerto ajuda a enviar orçamento por link, registrar aprovação e acompanhar o status da OS.',
  },
  {
    slug: 'planilha-estoque-pecas-oficina-gratis',
    label: 'Planilha de estoque',
    title: 'Planilha de estoque de peças para oficina grátis',
    description: 'Receba uma planilha para controlar entrada, saída, custo, venda e estoque mínimo de peças da oficina.',
    meta: 'Baixe uma planilha de estoque de peças para oficina e veja como evitar peça esquecida, sem cobrança ou parada na prateleira.',
    cta: 'Receber planilha grátis',
    kind: 'lead_magnet_estoque',
    benefits: ['Controle entrada e saída', 'Defina estoque mínimo', 'Acompanhe custo e venda', 'Identifique peça parada'],
    after: 'No BoxCerto, a peça deixa de ser uma linha solta e passa a conversar com OS, orçamento e financeiro.',
  },
  {
    slug: 'calculadora-mao-de-obra-oficina-mecanica',
    label: 'Calculadora de mão de obra',
    title: 'Calculadora de mão de obra para oficina mecânica',
    description: 'Receba uma calculadora simples para precificar serviços sem chutar valor nem perder margem.',
    meta: 'Receba uma calculadora de mão de obra para oficina mecânica e entenda como cobrar serviços com mais margem.',
    cta: 'Receber calculadora grátis',
    kind: 'lead_magnet_mao_de_obra',
    benefits: ['Calcule hora técnica', 'Inclua custo fixo', 'Compare serviços', 'Evite cobrar barato demais'],
    after: 'Com o BoxCerto, você acompanha serviço, peça e valor aprovado para entender melhor o dinheiro que sobra.',
  },
  {
    slug: 'planilha-fluxo-caixa-oficina-mecanica-gratis',
    label: 'Planilha de fluxo de caixa',
    title: 'Planilha de fluxo de caixa para oficina mecânica grátis',
    description: 'Receba uma planilha para controlar entradas, despesas, contas a pagar e o dinheiro que realmente sobra.',
    meta: 'Baixe uma planilha de fluxo de caixa para oficina mecânica e veja como organizar entradas, despesas e lucro.',
    cta: 'Receber planilha grátis',
    kind: 'lead_magnet_fluxo_caixa',
    benefits: ['Veja entrada e saída por dia', 'Separe faturamento de lucro', 'Controle contas a pagar', 'Entenda o dinheiro que sobra'],
    after: 'No BoxCerto, o financeiro deixa de ser chute e passa a acompanhar OS, orçamento, peças e recebimentos.',
  },
  {
    slug: 'checklist-revisao-veicular-oficina-gratis',
    label: 'Checklist de revisão',
    title: 'Checklist de revisão veicular para oficina grátis',
    description: 'Receba um checklist para padronizar revisões, registrar itens avaliados e vender manutenção preventiva com mais clareza.',
    meta: 'Baixe um checklist de revisão veicular para oficina e use o material para organizar atendimento, OS e orçamento.',
    cta: 'Receber checklist grátis',
    kind: 'lead_magnet_checklist_revisao',
    benefits: ['Padronize a revisão', 'Mostre itens avaliados', 'Facilite o orçamento', 'Venda preventiva com clareza'],
    after: 'No BoxCerto, o checklist pode virar rotina de OS, orçamento aprovado e histórico do veículo.',
  },
  {
    slug: 'mensagem-cobrar-retorno-orcamento-whatsapp',
    label: 'Mensagem de retorno',
    title: 'Mensagem pronta para cobrar retorno de orçamento no WhatsApp',
    description: 'Receba modelos de mensagem para cobrar retorno de orçamento sem parecer chato e sem perder a venda.',
    meta: 'Receba mensagem pronta para cobrar retorno de orçamento no WhatsApp e aumente aprovações na oficina.',
    cta: 'Receber mensagens prontas',
    kind: 'lead_magnet_whatsapp_retorno',
    benefits: ['Cobre retorno sem pressão', 'Reforce validade do orçamento', 'Libere peça parada', 'Traga o cliente de volta'],
    after: 'No BoxCerto, você envia o orçamento por link e acompanha quem aprovou, quem recusou e quem precisa de retorno.',
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

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c')
}

function nav(active = '') {
  return `<nav><div class="nav-inner">
  <a href="/" class="brand"><img src="/logo.svg" width="36" height="36" alt="">BoxCerto</a>
  <div class="money-nav-links"><a href="/lp">Produto</a><a href="/blog">Blog</a><a href="/cadastro?origem=${esc(active)}-nav" class="nav-cta">Teste 7 dias grátis</a></div>
</div></nav>`
}

function footer() {
  return `<footer><p>© 2026 BoxCerto · Sistema de gestão para oficinas mecânicas</p><div class="footer-links"><a href="/">Início</a><a href="/blog">Blog</a><a href="/cadastro">Testar grátis</a><a href="/termos">Termos</a><a href="/privacidade">Privacidade</a></div></footer>`
}

function proofWindow() {
  return `<div class="proof-window money-proof">
  <div class="proof-bar"><span></span><span></span><span></span></div>
  <div class="proof-row strong"><span>OS digital</span><b>Aguardando aprovação</b></div>
  <div class="proof-row"><span>Orçamento por link</span><b>Enviado no WhatsApp</b></div>
  <div class="proof-row"><span>Status do veículo</span><b>Em andamento</b></div>
  <div class="proof-row"><span>Estoque e financeiro</span><b>No painel</b></div>
</div>`
}

function leadForm({ origin, material, cta, compact = false }) {
  return `<section class="lead-form-card${compact ? ' money-form-card' : ''}" aria-labelledby="form-${esc(origin)}">
  <div data-form-state>
    <div class="section-kicker">${compact ? 'Material gratuito' : 'Receber material'}</div>
    <h2 id="form-${esc(origin)}">${compact ? 'Receba o material e veja o BoxCerto em ação' : 'Preencha para liberar o material gratuito'}</h2>
    <p>Seu contato vai para a equipe BoxCerto. Depois você pode testar grátis e transformar esse material em OS, orçamento e controle real.</p>
    <form class="lead-form" data-lead-form data-origin="${esc(origin)}" data-material="${esc(material)}" data-kind="organic">
      <label for="${esc(origin)}-nome">Nome</label>
      <input id="${esc(origin)}-nome" name="nome" type="text" autocomplete="name" required placeholder="Seu nome">
      <label for="${esc(origin)}-whatsapp">WhatsApp</label>
      <input id="${esc(origin)}-whatsapp" name="whatsapp" type="tel" autocomplete="tel" required placeholder="(00) 00000-0000">
      <label for="${esc(origin)}-email">E-mail</label>
      <input id="${esc(origin)}-email" name="email" type="email" autocomplete="email" required placeholder="voce@email.com">
      <button type="submit" class="btn-read">${esc(cta)}</button>
      <p class="lead-error" data-lead-error hidden>Não consegui enviar agora. Confira os dados e tente novamente.</p>
    </form>
    <small>Sem complicação: você recebe o material e pode testar o BoxCerto por 7 dias.</small>
  </div>
  <div class="lead-success" data-success-state hidden>
    <div class="success-mark" aria-hidden="true">✓</div>
    <h2>Pronto. Recebemos seu contato.</h2>
    <p>Enquanto o material chega, você já pode criar sua conta e testar a rotina digital do BoxCerto.</p>
    <a href="/cadastro?origem=${esc(origin)}-sucesso&utm_source=organico&utm_campaign=${esc(origin)}" class="btn-read">Testar o BoxCerto grátis</a>
    <a href="/blog" class="btn-link">Ver guias do blog</a>
  </div>
</section>`
}

function pageHead({ title, description, slug, type = 'website', schema }) {
  return `<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} | BoxCerto</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${site}/${slug}">
<meta property="og:type" content="${esc(type)}">
<meta property="og:title" content="${esc(title)} | BoxCerto">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${site}/og-image.png">
<meta property="og:url" content="${site}/${slug}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd(schema)}</script>
<script type="application/ld+json" data-schema="breadcrumb">${jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: site }, { '@type': 'ListItem', position: 2, name: title, item: `${site}/${slug}` }] })}</script>
<link rel="stylesheet" href="/blog/blog.css">
</head>`
}

function moneyPageHtml(page) {
  const relatedResources = resources
    .filter((resource) => resource.slug !== page.resourceSlug)
    .slice(0, 3)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: page.title,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '97', priceCurrency: 'BRL' },
    publisher: { '@type': 'Organization', name: 'BoxCerto', logo: { '@type': 'ImageObject', url: `${site}/logo.svg` } },
    url: `${site}/${page.slug}`,
    description: page.meta,
  }
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
  return `<!DOCTYPE html>
<html lang="pt-BR">
${pageHead({ title: page.title, description: page.meta, slug: page.slug, schema })}
<body class="lead-page money-page">
${nav(page.slug)}
<main>
  <header class="hero money-hero">
    <section class="hero-copy">
      <div class="eyebrow">${esc(page.eyebrow)}</div>
      <h1>${esc(page.title)}</h1>
      <p>${esc(page.description)}</p>
      <div class="hero-actions"><a href="/cadastro?origem=${esc(page.slug)}-hero&utm_source=organico" class="hero-primary">${esc(page.primaryCta)}</a><a href="/${esc(page.resourceSlug)}" class="hero-secondary">${esc(page.secondaryCta)}</a></div>
    </section>
    ${leadForm({ origin: page.slug, material: page.resourceLabel, cta: page.secondaryCta, compact: true })}
  </header>
  <section class="container money-section">
    <div class="money-split">
      <div>
        <div class="section-kicker">Dor real da oficina</div>
        <h2>Oficina cheia não significa oficina no controle.</h2>
        <p>${esc(page.pain)}</p>
      </div>
      ${proofWindow()}
    </div>
  </section>
  <section class="container money-section">
    <div class="section-heading compact-heading"><div class="section-kicker">Como o BoxCerto ajuda</div><h2>Uma rotina mais clara da entrada do carro até o dinheiro no caixa.</h2></div>
    <div class="commercial-grid money-feature-grid">
      ${page.bullets.map((item) => `<article><span>BoxCerto</span><strong>${esc(item)}</strong></article>`).join('\n      ')}
    </div>
  </section>
  <section class="container">
    <div class="money-before-after">
      <div><span>Antes</span><strong>Papel, planilha, áudio e memória.</strong><p>Orçamento some, status depende de pergunta e peça pode sair sem cobrança.</p></div>
      <div><span>Depois com BoxCerto</span><strong>OS digital, aprovação registrada e status visível.</strong><p>A equipe sabe o que está pendente e o dono enxerga o que foi aprovado.</p></div>
    </div>
  </section>
  <section class="container money-section">
    <div class="product-proof-block">
      <div>
        <span>Material grátis</span>
        <h2>Comece com ${esc(page.resourceLabel.toLowerCase())}. Depois transforme isso em rotina digital.</h2>
        <p>O material ajuda a organizar o primeiro passo. O BoxCerto entra quando a oficina quer parar de depender de arquivo solto e conversa perdida.</p>
        <a href="/${esc(page.resourceSlug)}" class="btn-read">${esc(page.secondaryCta)}</a>
      </div>
      ${proofWindow()}
    </div>
  </section>
  <section class="container money-section">
    <div class="section-heading compact-heading"><div class="section-kicker">Guias e materiais relacionados</div><h2>Continue pelo problema que mais tira dinheiro da oficina.</h2></div>
    <div class="related-grid">
      ${relatedResources.map((resource) => `<a href="/${resource.slug}" class="related-card"><span>${esc(resource.label)}</span><strong>${esc(resource.title)}</strong></a>`).join('\n      ')}
    </div>
  </section>
  <section class="container">
    <div class="bc-faq money-faq">
      <h2>Dúvidas frequentes</h2>
      ${page.faq.map(([q, a]) => `<details><summary>${esc(q)} <b>+</b></summary><p>${esc(a)}</p></details>`).join('\n      ')}
    </div>
    <script type="application/ld+json" data-schema="faq">${jsonLd(faqSchema)}</script>
  </section>
  <section class="container"><div class="cta-banner"><h2>Organize sua oficina antes que mais dinheiro escape.</h2><p>Crie OS, envie orçamento por link, registre aprovação e acompanhe estoque e financeiro em uma rotina simples.</p><div class="cta-actions"><a href="/cadastro?origem=${esc(page.slug)}-final&utm_source=organico" class="btn-cta-white">Começar teste grátis</a><a href="/blog" class="btn-cta-outline">Ver guias do blog</a></div></div></section>
</main>
${footer()}
<script src="/organic-leads.js" defer></script>
</body>
</html>`
}

function resourceHtml(resource) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: resource.title,
    description: resource.meta,
    url: `${site}/${resource.slug}`,
    publisher: { '@type': 'Organization', name: 'BoxCerto', logo: { '@type': 'ImageObject', url: `${site}/logo.svg` } },
  }
  return `<!DOCTYPE html>
<html lang="pt-BR">
${pageHead({ title: resource.title, description: resource.meta, slug: resource.slug, schema })}
<body class="lead-page organic-resource-page">
${nav(resource.slug)}
<main class="lead-hero">
  <section class="lead-copy" aria-labelledby="lead-title">
    <div class="eyebrow">Material gratuito para oficina</div>
    <h1 id="lead-title">${esc(resource.title)}</h1>
    <p>${esc(resource.description)}</p>
    <div class="lead-benefits" aria-label="Benefícios do material">
      ${resource.benefits.map((item) => `<span>${esc(item)}</span>`).join('\n      ')}
    </div>
    <div class="lead-proof-mini"><strong>Depois do material:</strong><span>${esc(resource.after)}</span></div>
  </section>
  ${leadForm({ origin: resource.slug, material: resource.label, cta: resource.cta })}
</main>
<section class="lead-after" aria-labelledby="lead-after-title">
  <div class="section-heading compact-heading"><div class="section-kicker">Do material para a rotina</div><h2 id="lead-after-title">Como isso fica no BoxCerto</h2><p>Em vez de espalhar informação em arquivo, papel e WhatsApp, a oficina acompanha tudo em uma tela simples.</p></div>
  ${proofWindow()}
</section>
<section class="container">
  <div class="cta-banner"><h2>O material organiza o começo. O BoxCerto organiza a oficina inteira.</h2><p>Teste grátis por 7 dias e veja como OS digital, orçamento por link, status, estoque e financeiro funcionam juntos.</p><div class="cta-actions"><a href="/cadastro?origem=${esc(resource.slug)}-final&utm_source=lead_magnet" class="btn-cta-white">Testar o BoxCerto grátis</a><a href="/blog" class="btn-cta-outline">Ver artigos do blog</a></div></div>
</section>
${footer()}
<script src="/organic-leads.js" defer></script>
</body>
</html>`
}

function organicLeadJs() {
  return `(function () {
  var SUPABASE_URL = 'https://vmejwxfvgufwcztcjjmy.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_4mL_ZQ2Lhoo8EqJONThvSw_SrUXHJkJ';

  function clean(value) {
    return (value || '').toString().trim();
  }

  function utmParams() {
    var params = new URLSearchParams(window.location.search);
    var data = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
      if (params.get(key)) data[key] = params.get(key);
    });
    return data;
  }

  async function saveLead(payload) {
    var response = await fetch(SUPABASE_URL + '/rest/v1/diagnostico_leads', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('lead_insert_failed_' + response.status);
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest('a, button');
    if (!target || typeof gtag !== 'function') return;
    var label = target.textContent.trim();
    if (target.closest('[data-lead-form]')) return;
    if (target.href && target.href.indexOf('/cadastro') !== -1) {
      gtag('event', 'organic_trial_click', { event_label: label, page_path: window.location.pathname });
    }
  });

  document.querySelectorAll('[data-lead-form]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      var error = form.querySelector('[data-lead-error]');
      var formState = form.closest('[data-form-state]');
      var card = form.closest('.lead-form-card');
      var successState = card && card.querySelector('[data-success-state]');
      var nome = clean(form.elements.nome && form.elements.nome.value);
      var whatsapp = clean(form.elements.whatsapp && form.elements.whatsapp.value);
      var email = clean(form.elements.email && form.elements.email.value);
      var oficina = clean(form.elements.oficina && form.elements.oficina.value);
      if (!nome || !whatsapp || !email) {
        if (error) {
          error.textContent = 'Preencha nome, WhatsApp e e-mail para liberar o material.';
          error.hidden = false;
        }
        return;
      }
      var oldText = button ? button.textContent : '';
      if (button) {
        button.disabled = true;
        button.textContent = 'Enviando...';
      }
      if (error) error.hidden = true;
      var origin = form.dataset.origin || window.location.pathname.replace(/^\\//, '') || 'organico';
      var material = form.dataset.material || document.title.replace(' | BoxCerto', '');
      var payload = {
        nome: nome,
        email: email,
        origem: origin,
        respostas: {
          tipo: form.dataset.kind || 'organic',
          material: material,
          whatsapp: whatsapp,
          email: email,
          oficina: oficina,
          pagina: document.title,
          path: window.location.pathname,
          url: window.location.href,
          utm: utmParams()
        }
      };
      try {
        await saveLead(payload);
        localStorage.setItem('boxcerto_last_organic_lead', JSON.stringify({ origem: origin, material: material, criadoEm: new Date().toISOString() }));
        if (typeof gtag === 'function') {
          gtag('event', 'organic_lead_submit', { event_label: origin, page_path: window.location.pathname });
        }
        if (formState) formState.hidden = true;
        if (successState) successState.hidden = false;
      } catch (err) {
        if (error) {
          error.textContent = 'Não consegui enviar agora. Tente novamente em alguns segundos.';
          error.hidden = false;
        }
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = oldText;
        }
      }
    });
  });
})();`
}

async function updateSitemap() {
  const file = path.join(publicDir, 'sitemap.xml')
  let xml = await readFile(file, 'utf8')
  const existing = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]))
  const pages = [
    ...moneyPages.map((page) => [page.slug, 'monthly', '0.9']),
    ...resources.map((resource) => [resource.slug, 'monthly', '0.9']),
  ]
  const blocks = pages
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
  }
  for (const [loc, changefreq, priority] of pages) {
    const url = `${site}/${loc}`
    xml = xml.replace(
      new RegExp(`(<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>[\\s\\S]*?<changefreq>)(.*?)(</changefreq>[\\s\\S]*?<priority>)(.*?)(</priority>[\\s\\S]*?<lastmod>)(.*?)(</lastmod>)`),
      `$1${changefreq}$3${priority}$5${today}$7`
    )
  }
  await writeFile(file, xml, 'utf8')
}

async function main() {
  for (const page of moneyPages) {
    await writeFile(path.join(publicDir, `${page.slug}.html`), moneyPageHtml(page), 'utf8')
  }
  for (const resource of resources) {
    await writeFile(path.join(publicDir, `${resource.slug}.html`), resourceHtml(resource), 'utf8')
  }
  await writeFile(path.join(publicDir, 'organic-leads.js'), organicLeadJs(), 'utf8')
  await updateSitemap()
  console.log(`Generated ${moneyPages.length} commercial pages, ${resources.length} lead magnet pages, organic-leads.js, and sitemap entries`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
