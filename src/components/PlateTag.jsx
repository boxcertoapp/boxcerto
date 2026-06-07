// ── Placa de veículo realista ───────────────────────────────
// Detecta o formato e renderiza:
//  • Mercosul (ABC1D23) → placa branca com faixa azul "BR" no topo
//  • Antiga   (ABC-1234) → placa cinza clássica
// Fallback: Mercosul (padrão atual de emplacamento).

function limpar(placa) {
  return (placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export function tipoPlaca(placa) {
  const c = limpar(placa)
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(c)) return 'mercosul'
  if (/^[A-Z]{3}[0-9]{4}$/.test(c)) return 'antiga'
  return 'mercosul'
}

function fmtAntiga(placa) {
  const c = limpar(placa)
  return c.length === 7 ? `${c.slice(0, 3)}-${c.slice(3)}` : (placa || '')
}

export default function PlateTag({ placa, sm = false }) {
  const tipo = tipoPlaca(placa)
  const numCls = `plate-mercosul font-extrabold tracking-widest text-slate-900 ${sm ? 'text-[11px]' : 'text-[13px]'}`

  // ── Placa cinza antiga ──
  if (tipo === 'antiga') {
    return (
      <div className={`inline-flex shrink-0 items-center rounded-md border border-slate-400/80 bg-gradient-to-b from-slate-200 to-slate-300 ${sm ? 'px-1.5 py-[3px]' : 'px-2 py-1'}`}>
        <span className={numCls}>{fmtAntiga(placa)}</span>
      </div>
    )
  }

  // ── Placa Mercosul ──
  return (
    <div className="inline-flex flex-col shrink-0 overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
      <div className={`flex items-center justify-between bg-[#1e3a8a] px-1 ${sm ? 'h-[7px]' : 'h-[9px]'}`}>
        <span className="font-bold leading-none text-white" style={{ fontSize: sm ? 4.5 : 5.5, letterSpacing: '.04em' }}>BR</span>
        <span className="rounded-[1px] bg-green-400" style={{ width: sm ? 4 : 5, height: sm ? 2.5 : 3 }} />
      </div>
      <div className={`text-center ${sm ? 'px-1.5 pb-[3px] pt-px' : 'px-2 pb-1 pt-0.5'}`}>
        <span className={numCls}>{limpar(placa)}</span>
      </div>
    </div>
  )
}
