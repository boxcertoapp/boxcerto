/**
 * Logo.jsx — BoxCerto brand component
 *
 * Uso:
 *   <Logo />                    → ícone + wordmark "BoxCerto"
 *   <Logo iconOnly />           → só o ícone
 *   <Logo onDark />             → wordmark branco (fundos escuros)
 *   <Logo size="sm|md|lg|xl" /> → tamanhos: 28 / 36 / 48 / 64px
 *   <Logo priority />           → fetchpriority="high" (LCP / acima do fold)
 */
export default function Logo({
  iconOnly = false,
  size = 'md',
  onDark = false,
  priority = false,
  className = '',
}) {
  const px       = { sm: 28, md: 36, lg: 48, xl: 64 }[size] ?? 36
  const fontSize = { sm: 16, md: 20, lg: 26, xl: 34 }[size] ?? 20
  const radius   = Math.round(px * 0.22)
  const gap      = Math.round(px * 0.28)

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap }}
    >
      <img
        src="/logo.svg"
        alt="BoxCerto"
        width={px}
        height={px}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : undefined}
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
