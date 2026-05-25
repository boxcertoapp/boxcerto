/**
 * PWAInstallSheet — bottom sheet com instruções de instalação para iOS Safari.
 *
 * Mostra o ícone de compartilhar do Safari, 2 passos numerados e
 * um item simulando o "Adicionar à Tela de Início" do share sheet nativo.
 *
 * Uso:
 *   {showSheet && <PWAInstallSheet onClose={() => setShowSheet(false)} />}
 */
import { X } from 'lucide-react'

/** Ícone de compartilhar idêntico ao do Safari (seta saindo de uma caixa) */
function SafariShareIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="8 5 12 1 16 5" />
      <line x1="12" y1="1" x2="12" y2="15" />
      <path d="M20 15v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6" />
    </svg>
  )
}

export default function PWAInstallSheet({ onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Instruções para instalar o app"
        className="fixed bottom-0 left-0 right-0 z-[501] mx-auto max-w-md rounded-t-[28px] bg-white px-6 pt-5 shadow-2xl"
        style={{
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          animation: 'pwaSlideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Drag indicator */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
          <SafariShareIcon className="h-7 w-7 text-white" />
        </div>

        <h3 className="text-[18px] font-extrabold leading-snug text-slate-900">
          Adicione à tela inicial
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Abra o BoxCerto como um app, com 1 toque — sem precisar do Safari.
        </p>

        {/* Steps */}
        <div className="mt-6 space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-extrabold text-white">
              1
            </span>
            <div>
              <p className="text-sm font-semibold leading-snug text-slate-800">
                Toque no botão{' '}
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 align-middle text-xs font-bold text-slate-700">
                  <SafariShareIcon className="h-3.5 w-3.5" />
                  Compartilhar
                </span>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Na barra de ferramentas inferior do Safari
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="ml-[11px] h-4 border-l-2 border-dashed border-slate-200" />

          {/* Step 2 */}
          <div className="flex items-start gap-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-extrabold text-white">
              2
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-snug text-slate-800">
                Toque em{' '}
                <strong className="text-slate-900">"Adicionar à Tela de Início"</strong>
              </p>
              {/* Simula o item do share sheet nativo do iOS */}
              <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 shadow-sm">
                  <svg
                    className="h-4 w-4 text-slate-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-800">
                  Adicionar à Tela de Início
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-indigo-600 py-4 text-[15px] font-extrabold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 active:scale-[0.98]"
        >
          Entendi, vou instalar
        </button>

        <style>{`
          @keyframes pwaSlideUp {
            from { transform: translateY(100%) }
            to   { transform: translateY(0)    }
          }
        `}</style>
      </div>
    </>
  )
}
