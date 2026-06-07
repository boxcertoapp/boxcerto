import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

// ── Helper global ───────────────────────────────────────────
// Substitui o alert() nativo por um toast bonito dentro do app:
//   import { showToast } from '../components/Toast'
//   showToast('Preencha os campos obrigatórios.')            // erro (padrão)
//   showToast('Tudo certo!', 'success')
//   showToast('Permita pop-ups', 'warning')
//   showToast('Dica rápida', 'info')
export function showToast(message, type = 'error', opts = {}) {
  if (!message) return
  window.dispatchEvent(new CustomEvent('boxcerto:toast', {
    detail: { message, type, duration: opts.duration, action: opts.action },
  }))
}

// Atalho para toast com botão "Desfazer"
export function showUndoToast(message, onUndo, opts = {}) {
  showToast(message, opts.type || 'info', {
    duration: opts.duration || 5000,
    action: { label: opts.label || 'Desfazer', onClick: onUndo },
  })
}

const TYPES = {
  error:   { Icon: AlertCircle,  color: '#ef4444', bg: '#fef2f2', ring: '#fecaca' },
  success: { Icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', ring: '#bbf7d0' },
  warning: { Icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', ring: '#fde68a' },
  info:    { Icon: Info,         color: '#4f46e5', bg: '#eef2ff', ring: '#c7d2fe' },
}

const CSS = `
@keyframes tstIn  { from { opacity:0; transform:translateY(-14px) scale(.96) } to { opacity:1; transform:translateY(0) scale(1) } }
@keyframes tstOut { from { opacity:1; transform:translateY(0) scale(1) } to { opacity:0; transform:translateY(-10px) scale(.97) } }
.tst-item        { animation: tstIn .26s cubic-bezier(.2,.8,.3,1) both; }
.tst-item.leaving{ animation: tstOut .25s ease forwards; }
@media (prefers-reduced-motion: reduce){ .tst-item,.tst-item.leaving{ animation:none !important } }
`

function ToastItem({ t, onClose }) {
  const cfg = TYPES[t.type] || TYPES.error
  const { Icon } = cfg
  return (
    <div
      className={`tst-item${t.leaving ? ' leaving' : ''} pointer-events-auto flex items-start gap-3 w-full bg-white rounded-2xl shadow-lg border border-gray-100 pl-3 pr-2 py-3`}
      style={{ boxShadow: '0 12px 32px -10px rgba(20,22,31,.25), 0 2px 6px -2px rgba(20,22,31,.1)' }}
      role="alert"
    >
      <span
        className="shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: cfg.bg, color: cfg.color, boxShadow: `inset 0 0 0 1px ${cfg.ring}` }}
      >
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <p className="flex-1 min-w-0 text-sm font-medium text-slate-800 leading-snug py-0.5">{t.message}</p>
      {t.action && (
        <button
          onClick={() => { t.action.onClick?.(); onClose() }}
          className="shrink-0 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-0.5"
        >
          {t.action.label}
        </button>
      )}
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="shrink-0 p-1 text-slate-300 hover:text-slate-500 transition-colors rounded-lg hover:bg-gray-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function Toaster() {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const timers = useRef({})

  const remove = (id) => {
    setToasts(list => list.map(t => t.id === id ? { ...t, leaving: true } : t))
    clearTimeout(timers.current['hide_' + id])
    timers.current['rm_' + id] = setTimeout(() => {
      setToasts(list => list.filter(t => t.id !== id))
    }, 260)
  }

  useEffect(() => {
    const onToast = (e) => {
      const { message, type = 'error', duration, action } = e.detail || {}
      const id = ++idRef.current
      const ttl = duration || (type === 'error' ? 4200 : 3200)
      setToasts(list => [...list.slice(-2), { id, message, type, action, leaving: false }]) // máx 3 na tela
      timers.current['hide_' + id] = setTimeout(() => remove(id), ttl)
    }
    window.addEventListener('boxcerto:toast', onToast)
    return () => {
      window.removeEventListener('boxcerto:toast', onToast)
      Object.values(timers.current).forEach(clearTimeout)
    }
  }, [])

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed inset-x-0 top-0 z-[110] flex flex-col items-center gap-2 px-4 pointer-events-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
      <style>{CSS}</style>
      <div className="w-full max-w-sm flex flex-col gap-2">
        {toasts.map(t => <ToastItem key={t.id} t={t} onClose={() => remove(t.id)} />)}
      </div>
    </div>,
    document.body
  )
}
