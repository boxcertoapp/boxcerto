import { useState, useEffect, useRef } from 'react'

// ── Helper global ───────────────────────────────────────────
// Dispara a animação de check de qualquer lugar do app:
//   import { showSaveCheck } from '../components/SaveCheck'
//   showSaveCheck('OS Aberta!')
export function showSaveCheck(label = 'Salvo!') {
  window.dispatchEvent(new CustomEvent('boxcerto:saved', { detail: { label } }))
}

const CSS = `
@keyframes scIn   { from { opacity:0; transform:scale(.82) } to { opacity:1; transform:scale(1) } }
@keyframes scOut  { from { opacity:1; transform:scale(1) } to { opacity:0; transform:scale(.92) } }
@keyframes scRing { from { stroke-dashoffset:226 } to { stroke-dashoffset:0 } }
@keyframes scTick { from { stroke-dashoffset:48 } to { stroke-dashoffset:0 } }
@keyframes scPop  { 0%{transform:scale(.6)} 60%{transform:scale(1.08)} 100%{transform:scale(1)} }
@keyframes scText { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
.sc-card  { animation: scIn .28s cubic-bezier(.2,.8,.3,1) both; }
.sc-card.sc-leaving { animation: scOut .3s ease forwards; }
.sc-badge { animation: scPop .45s cubic-bezier(.2,.8,.3,1) both; }
.sc-ring  { stroke-dasharray:226; stroke-dashoffset:226; animation: scRing .42s cubic-bezier(.4,0,.2,1) .05s forwards; }
.sc-tick  { stroke-dasharray:48; stroke-dashoffset:48; animation: scTick .3s cubic-bezier(.4,0,.2,1) .42s forwards; }
.sc-label { animation: scText .3s ease .5s both; }
@media (prefers-reduced-motion: reduce) {
  .sc-card,.sc-badge,.sc-ring,.sc-tick,.sc-label { animation: none !important; }
  .sc-ring,.sc-tick { stroke-dashoffset:0 !important; }
}
`

export default function SaveCheck() {
  const [state, setState] = useState(null) // { label, key, leaving }
  const timers = useRef([])

  useEffect(() => {
    const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = [] }
    const onSaved = (e) => {
      clearAll()
      const label = e.detail?.label || 'Salvo!'
      const key   = Date.now()
      setState({ label, key, leaving: false })
      timers.current.push(setTimeout(() => setState(s => s && { ...s, leaving: true }), 1350))
      timers.current.push(setTimeout(() => setState(null), 1650))
    }
    window.addEventListener('boxcerto:saved', onSaved)
    return () => { window.removeEventListener('boxcerto:saved', onSaved); clearAll() }
  }, [])

  if (!state) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-6">
      <style>{CSS}</style>
      <div
        key={state.key}
        className={`sc-card flex flex-col items-center gap-4 bg-white/95 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-2xl border border-gray-100`}
      >
        <div className="sc-badge w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
            <circle
              className="sc-ring"
              cx="44" cy="44" r="36"
              stroke="#22c55e" strokeWidth="5" strokeLinecap="round"
              transform="rotate(-90 44 44)"
            />
            <path
              className="sc-tick"
              d="M30 45 L40 55 L59 34"
              stroke="#16a34a" strokeWidth="6"
              strokeLinecap="round" strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <p className="sc-label text-lg font-extrabold text-slate-900 text-center">{state.label}</p>
      </div>
    </div>
  )
}
