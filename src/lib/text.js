// Escapa dados do usuário antes de interpolar em HTML (impressão/PDF).
// Previne XSS armazenado: um técnico não consegue injetar <script>/<img onerror>
// na descrição de um item que rode quando o dono gera o PDF na própria origem.
// Seguro em contexto de texto e de atributo (escapa " e ').
export const escapeHtml = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

// Partículas que ficam em minúsculas no meio do nome (português brasileiro)
const NAME_PARTICLES = new Set(['da', 'de', 'do', 'das', 'dos', 'e'])

/**
 * Capitaliza a primeira letra de cada palavra preservando partículas
 * em minúsculas. Útil para nomes próprios e nome da oficina.
 *
 *   "rogerio da silva"   → "Rogerio da Silva"
 *   "AUTO MECÂNICA"      → "Auto Mecânica"
 *   "joão e maria"       → "João e Maria"
 */
export function titleCaseName(input) {
  if (input == null) return ''
  const trimmed = String(input).trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''
  return trimmed
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((word, index) => {
      if (!word) return word
      if (index > 0 && NAME_PARTICLES.has(word)) return word
      return word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    })
    .join(' ')
}
