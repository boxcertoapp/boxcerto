/**
 * inject-meta.js
 * Pós-build: gera um HTML por rota com title/description/OG/JSON-LD
 * únicos + bloco <noscript> com conteúdo indexável pelo crawler.
 *
 * Uso: node scripts/inject-meta.js   (rodado após vite build)
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '../dist')

// ─── Meta data por rota ────────────────────────────────────────────────────
const ROUTES = [
  {
    slug: 'lp',
    title: 'Organize sua Oficina em 7 Dias | Teste Grátis BoxCerto',
    description:
      'Chega de OS perdida, cliente sem retorno e dinheiro na gaveta. BoxCerto organiza tudo: orçamento pelo WhatsApp, OS, estoque e financeiro. 7 dias grátis.',
    canonical: 'https://boxcerto.com/lp',
    ogTitle: 'Organize sua Oficina em 7 Dias — BoxCerto',
    ogDescription:
      'Controle OS, orçamento pelo WhatsApp e financeiro da sua oficina. Teste grátis 7 dias, sem cartão.',
    twitterTitle: 'Organize sua Oficina em 7 Dias — BoxCerto',
    twitterDescription: 'OS, orçamento pelo WhatsApp e financeiro. 7 dias grátis, sem cartão.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BoxCerto',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      description:
        'Organize sua oficina em 7 dias. OS, orçamentos pelo WhatsApp, estoque e financeiro.',
      url: 'https://boxcerto.com/lp',
    },
    noscript: `
      <h1>Organize sua Oficina em 7 Dias — BoxCerto</h1>
      <p>Chega de OS perdida, cliente sem retorno e dinheiro na gaveta. O BoxCerto organiza tudo para você.</p>
      <ul>
        <li>Orçamento por link no WhatsApp — cliente aprova em 1 clique</li>
        <li>Controle de Ordens de Serviço (OS) completo</li>
        <li>Estoque de peças atualizado automaticamente</li>
        <li>Financeiro da oficina em tempo real</li>
        <li>7 dias grátis, sem cartão de crédito</li>
      </ul>
      <p>Plano mensal: R$ 97/mês. Plano anual: R$ 79,90/mês (economia de R$ 205,20/ano).</p>
    `,
  },
  {
    slug: 'lp2',
    title: 'Volte para o Controle da sua Oficina | BoxCerto',
    description:
      'Sua oficina cresceu e o caos também? Retome o controle com OS, orçamento pelo WhatsApp, estoque e financeiro. Teste 7 dias grátis.',
    canonical: 'https://boxcerto.com/lp2',
    ogTitle: 'Volte para o Controle da sua Oficina — BoxCerto',
    ogDescription:
      'Retome o controle da sua oficina com OS, orçamentos, estoque e financeiro. 7 dias grátis, sem cartão.',
    twitterTitle: 'Volte para o Controle da sua Oficina — BoxCerto',
    twitterDescription: 'OS, orçamentos, estoque e financeiro. 7 dias grátis, sem cartão.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BoxCerto',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      description:
        'Retome o controle da sua oficina com OS, orçamentos, estoque e financeiro.',
      url: 'https://boxcerto.com/lp2',
    },
    noscript: `
      <h1>Volte para o Controle da sua Oficina — BoxCerto</h1>
      <p>Sua oficina cresceu e o caos também cresceu com ela. Retome o controle com o BoxCerto.</p>
      <ul>
        <li>Ordens de Serviço organizadas e sem papel</li>
        <li>Orçamento enviado pelo WhatsApp com aprovação em 1 clique</li>
        <li>Estoque de peças e produtos controlado</li>
        <li>Visão financeira completa da oficina</li>
        <li>7 dias grátis, sem cartão de crédito</li>
      </ul>
      <p>Plano mensal: R$ 97/mês. Plano anual: R$ 79,90/mês (economia de R$ 205,20/ano).</p>
    `,
  },
  {
    slug: 'lpsistema-para-oficina-pequena',
    title: 'Sistema para Oficina Pequena | BoxCerto',
    description:
      'Feito para oficinas pequenas: controle OS, orçamento pelo WhatsApp, estoque e financeiro. Simples, rápido e sem burocracia. Teste grátis 7 dias.',
    canonical: 'https://boxcerto.com/lpsistema-para-oficina-pequena',
    ogTitle: 'Sistema para Oficina Pequena — BoxCerto',
    ogDescription:
      'Simples de usar, feito para pequenas oficinas. OS, orçamento pelo WhatsApp, estoque e financeiro. 7 dias grátis.',
    twitterTitle: 'Sistema para Oficina Pequena — BoxCerto',
    twitterDescription: 'OS, orçamento pelo WhatsApp, estoque e financeiro. 7 dias grátis.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BoxCerto',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      description:
        'Sistema de gestão para oficinas pequenas. Simples, rápido e sem burocracia.',
      url: 'https://boxcerto.com/lpsistema-para-oficina-pequena',
    },
    noscript: `
      <h1>Sistema para Oficina Pequena — BoxCerto</h1>
      <p>Feito para oficinas pequenas que querem organização sem complicação.</p>
      <ul>
        <li>Crie e gerencie Ordens de Serviço em segundos</li>
        <li>Envie orçamento pelo WhatsApp, cliente aprova pelo celular</li>
        <li>Controle de estoque de peças e pneus</li>
        <li>Financeiro simples e claro</li>
        <li>Funciona no celular, sem instalação</li>
        <li>7 dias grátis, sem cartão de crédito</li>
      </ul>
      <p>Plano mensal: R$ 97/mês. Plano anual: R$ 79,90/mês (economia de R$ 205,20/ano).</p>
    `,
  },
  {
    slug: 'lpboxcerto-vs-planilha',
    title: 'BoxCerto vs Planilha: Qual o Melhor para sua Oficina?',
    description:
      'Planilha não avisa cliente, não gera link de aprovação e some quando você precisa. Veja por que oficinas trocam planilha pelo BoxCerto.',
    canonical: 'https://boxcerto.com/lpboxcerto-vs-planilha',
    ogTitle: 'BoxCerto vs Planilha — Qual o Melhor para sua Oficina?',
    ogDescription:
      'Compare planilha x BoxCerto e veja por que mecânicos estão migrando para o sistema.',
    twitterTitle: 'BoxCerto vs Planilha — Qual o Melhor?',
    twitterDescription: 'Compare e veja por que mecânicos trocam planilha pelo BoxCerto.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'BoxCerto vs Planilha: Qual o Melhor para sua Oficina?',
      description:
        'Comparação entre sistema de gestão BoxCerto e planilha para oficinas mecânicas.',
      url: 'https://boxcerto.com/lpboxcerto-vs-planilha',
    },
    noscript: `
      <h1>BoxCerto vs Planilha: Qual o Melhor para sua Oficina?</h1>
      <p>Planilha até funciona no começo, mas chega uma hora que ela te atrapalha mais do que ajuda.</p>
      <table>
        <tr><th>Recurso</th><th>Planilha</th><th>BoxCerto</th></tr>
        <tr><td>Orçamento pelo WhatsApp</td><td>Não</td><td>Sim</td></tr>
        <tr><td>Cliente aprova online</td><td>Não</td><td>Sim, em 1 clique</td></tr>
        <tr><td>Acesso pelo celular</td><td>Limitado</td><td>Sim, completo</td></tr>
        <tr><td>Controle de estoque</td><td>Manual</td><td>Automático</td></tr>
        <tr><td>Relatório financeiro</td><td>Manual</td><td>Tempo real</td></tr>
        <tr><td>Backup automático</td><td>Não</td><td>Sim, na nuvem</td></tr>
      </table>
      <p>Plano mensal: R$ 97/mês. Plano anual: R$ 79,90/mês. Teste 7 dias grátis, sem cartão.</p>
    `,
  },
  {
    slug: 'lporcamento-online-oficina',
    title: 'Orçamento Online para Oficina pelo WhatsApp | BoxCerto',
    description:
      'Envie orçamentos por link no WhatsApp, cliente aprova em 1 clique. Menos ligação, mais aprovação. Teste grátis 7 dias, sem cartão.',
    canonical: 'https://boxcerto.com/lporcamento-online-oficina',
    ogTitle: 'Orçamento Online para Oficina pelo WhatsApp — BoxCerto',
    ogDescription:
      'Orçamento por link, cliente aprova no celular. Menos ligação, mais aprovação. 7 dias grátis.',
    twitterTitle: 'Orçamento Online para Oficina pelo WhatsApp — BoxCerto',
    twitterDescription: 'Orçamento por link, cliente aprova no celular. 7 dias grátis.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BoxCerto — Orçamento Online para Oficina',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      description:
        'Envie orçamentos por link no WhatsApp. Cliente aprova em 1 clique, BoxCerto registra com data e hora.',
      url: 'https://boxcerto.com/lporcamento-online-oficina',
    },
    noscript: `
      <h1>Orçamento Online para Oficina pelo WhatsApp — BoxCerto</h1>
      <p>Chega de ligar pro cliente toda hora. Envie o orçamento por link, ele aprova pelo celular.</p>
      <ul>
        <li>Crie o orçamento em 2 minutos no BoxCerto</li>
        <li>Envie o link pelo WhatsApp com 1 clique</li>
        <li>Cliente vê peças, serviços e total no celular</li>
        <li>Aprova ou recusa com 1 toque</li>
        <li>BoxCerto registra data e hora da aprovação</li>
        <li>OS aberta automaticamente após aprovação</li>
      </ul>
      <p>Plano mensal: R$ 97/mês. Plano anual: R$ 79,90/mês (economia de R$ 205,20/ano). 7 dias grátis.</p>
    `,
  },
  {
    slug: 'lpdiagnostico',
    title: 'Diagnóstico Gratuito da sua Oficina | BoxCerto',
    description:
      'Responda 5 perguntas e descubra onde sua oficina está perdendo dinheiro. Diagnóstico grátis e personalizado para mecânicos.',
    canonical: 'https://boxcerto.com/lpdiagnostico',
    ogTitle: 'Diagnóstico Gratuito da sua Oficina — BoxCerto',
    ogDescription:
      'Descubra onde sua oficina perde dinheiro. 5 perguntas, resultado na hora. Grátis.',
    twitterTitle: 'Diagnóstico Gratuito da sua Oficina — BoxCerto',
    twitterDescription: 'Descubra onde sua oficina perde dinheiro. 5 perguntas, grátis.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Diagnóstico Gratuito da sua Oficina — BoxCerto',
      description:
        'Ferramenta gratuita de diagnóstico para oficinas mecânicas. Responda 5 perguntas e veja onde melhorar.',
      url: 'https://boxcerto.com/lpdiagnostico',
    },
    noscript: `
      <h1>Diagnóstico Gratuito da sua Oficina — BoxCerto</h1>
      <p>Responda 5 perguntas e descubra onde sua oficina está perdendo dinheiro.</p>
      <ul>
        <li>Você sabe quantas OS foram abertas esse mês?</li>
        <li>Quanto do seu estoque está parado?</li>
        <li>Você consegue ver o lucro real da oficina?</li>
        <li>Seus clientes aprovam orçamento pelo WhatsApp?</li>
        <li>Você perde OS por falta de organização?</li>
      </ul>
      <p>Faça o diagnóstico gratuito e veja o que o BoxCerto pode fazer pela sua oficina.</p>
    `,
  },
]

// ─── Helpers de substituição ───────────────────────────────────────────────
function replaceMeta(html, route) {
  let out = html

  // <title>
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)

  // meta description
  out = out.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${route.description}" />`
  )

  // canonical
  out = out.replace(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${route.canonical}" />`
  )

  // OG url
  out = out.replace(
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${route.canonical}" />`
  )

  // OG title
  out = out.replace(
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${route.ogTitle}" />`
  )

  // OG description
  out = out.replace(
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${route.ogDescription}" />`
  )

  // Twitter title
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${route.twitterTitle}" />`
  )

  // Twitter description
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${route.twitterDescription}" />`
  )

  // JSON-LD (substitui o primeiro bloco application/ld+json)
  out = out.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n    ${JSON.stringify(route.jsonLd, null, 2)}\n    </script>`
  )

  // Conteúdo indexável: injeta <noscript> logo antes de </body>
  const noscriptBlock = `
  <!-- Conteúdo indexável para crawlers sem JS -->
  <noscript>
    <div style="display:none">
      ${route.noscript.trim()}
    </div>
  </noscript>
`
  out = out.replace('</body>', noscriptBlock + '</body>')

  return out
}

// ─── Main ──────────────────────────────────────────────────────────────────
const indexHtml = readFileSync(`${DIST}/index.html`, 'utf-8')

for (const route of ROUTES) {
  const modified = replaceMeta(indexHtml, route)
  const outFile = `${DIST}/${route.slug}.html`
  writeFileSync(outFile, modified, 'utf-8')
  console.log(`✅  ${outFile}`)
}

console.log(`\n🎉  ${ROUTES.length} arquivos HTML gerados com meta únicos.`)
