/**
 * Logo.jsx — BoxCerto brand component
 *
 * /logo.svg      → tem fundo branco embutido → usar com texto em fundos claros
 * /logo-icon.svg → sem fundo (transparente)  → usar iconOnly ou em fundos escuros
 *
 * Uso:
 *   <Logo />                    → ícone (sem fundo) + wordmark "BoxCerto" em escuro
 *   <Logo iconOnly />           → só o ícone, sem fundo (qualquer background)
 *   <Logo onDark />             → ícone + wordmark em branco (footer, hero)
 *   <Logo size="sm|md|lg|xl" /> → tamanhos: 28 / 36 / 48 / 64px
 */
export default function Logo({
  iconOnly = false,
  size = 'md',
  onDark = false,
  className = '',
}) {
  const px       = { sm: 28, md: 36, lg: 48, xl: 64 }[size] ?? 36
  const fontSize = { sm: 16, md: 20, lg: 26, xl: 34 }[size] ?? 20
  const gap      = Math.round(px * 0.28)

  // Sempre usa o ícone sem fundo — fica limpo em qualquer background
  const iconSrc = '/logo-icon.svg'

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap }}
    >
      <img
        src={iconSrc}
        alt="BoxCerto"
        width={px}
        height={px}
        loading="eager"
        decoding="async"
        style={{ flexShrink: 0, display: 'block' }}
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
