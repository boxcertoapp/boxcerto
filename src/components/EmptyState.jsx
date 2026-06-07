// ── Estado vazio com charme ─────────────────────────────────
// Ícone num quadrado de cor suave + título acolhedor + subtítulo
// opcional + CTA opcional. Substitui o "ícone cinza triste".
export default function EmptyState({ icon: Icon, title, subtitle, action, tone = 'indigo' }) {
  const tones = {
    slate:  'bg-slate-100 text-slate-400',
    indigo: 'bg-indigo-50 text-indigo-500',
    green:  'bg-green-50 text-green-500',
    amber:  'bg-amber-50 text-amber-500',
    blue:   'bg-blue-50 text-blue-500',
    pink:   'bg-pink-50 text-pink-500',
  }
  return (
    <div className="text-center py-14 px-4">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${tones[tone] || tones.indigo}`}>
        {Icon && <Icon className="w-8 h-8" />}
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
      {subtitle && (
        <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">{subtitle}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 active:scale-95"
        >
          {action.icon && <action.icon className="w-4 h-4" />}{action.label}
        </button>
      )}
    </div>
  )
}
