import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

// ── Diálogo de confirmação reutilizável ─────────────────────
// Substitui confirm() nativo. Mesmo visual dos modais de estorno.
//   <ConfirmDialog open={...} title="..." message="..." danger
//     confirmLabel="Excluir" onConfirm={...} onCancel={...} />
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  danger = false,
  loading = false,
  icon: Icon = AlertTriangle,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-100' : 'bg-indigo-100'}`}>
            <Icon className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-indigo-600'}`} />
          </div>
          <h3 className="font-bold text-slate-900">{title}</h3>
        </div>
        {message && <p className="text-sm text-slate-500 mb-5 leading-relaxed">{message}</p>}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-60 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
