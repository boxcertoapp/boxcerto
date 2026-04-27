/**
 * Logo.jsx — BoxCerto brand component
 *
 * Usa o arquivo /logo.svg (cacheável, ~11KB) em vez de SVG inline.
 * O SVG tem fundo branco embutido — funciona perfeitamente em fundos claros.
 * Para fundos escuros, use a prop `onDark` para adicionar sombra/fundo.
 *
 * Uso:
 *   <Logo />                    → ícone + wordmark "BoxCerto" (padrão)
 *   <Logo iconOnly />           → só o ícone quadrado
 *   <Logo size="sm" />          → pequeno (28px)
 *   <Logo size="md" />          → médio (36px, padrão)
 *   <Logo size="lg" />          → grande (48px)
 *   <Logo onDark />             → wordmark branco para fundos escuros
 */
export default function Logo({
  iconOnly = false,
  size = 'md',
  onDark = false,
  className = '',
}) {
  const px = { sm: 28, md: 36, lg: 48, xl: 64 }[size] ?? 36
  const fontSize = { sm: 16, md: 20, lg: 26, xl: 34 }[size] ?? 20
  const radius = Math.round(px * 0.22)

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(px * 0.28) }}
    >
      <img
        src="/logo.svg"
        alt="BoxCerto"
        width={px}
        height={px}
        loading="eager"
        decoding="async"
        style={{ borderRadius: radius, flexShrink: 0, display: 'block' }}
      />
      {!iconOnly && (
        <span
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 800,
            fontSize,
            letterSpacing: '-0.5px',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          <span style={{ color: onDark ? '#FFFFFF' : '#0F172A' }}>Box</span>
          <span style={{ color: onDark ? '#A5B4FC' : '#3F46E5' }}>Certo</span>
        </span>
      )}
    </div>
  )
}
