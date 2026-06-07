// ── Skeletons de carregamento ───────────────────────────────
// Placeholders com shimmer enquanto a lista carrega.
// Reduz a sensação de "pisca vazio → carrega".

export function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3 animate-pulse">
      <div className="w-12 h-9 bg-gray-200 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-2.5 bg-gray-100 rounded w-2/5" />
      </div>
      <div className="h-3 w-12 bg-gray-100 rounded shrink-0" />
    </div>
  )
}

export default function SkeletonList({ count = 5, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  )
}

// Bloco de cards (quadrados) — para os 4 cards rápidos da Oficina
export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-4 gap-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-2xl h-14 animate-pulse" />
      ))}
    </div>
  )
}
