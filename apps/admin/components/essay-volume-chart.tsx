export default function EssayVolumeChart() {
  return (
    <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Volume de Redações</h3>
          <p className="text-sm text-slate-500">Comparativo semanal de envios vs. correções finalizadas</p>
        </div>
        <div className="flex gap-4 text-sm font-semibold text-slate-600">
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-blue-600" /> Enviadas</div>
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-amber-400" /> Corrigidas</div>
        </div>
      </div>

      {/* Aqui entraria o Recharts ou Chart.js */}
      <div className="flex-1 flex items-end justify-between px-8 pb-4 border-b border-slate-100/50">
        {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map(day => (
          <span key={day} className="text-xs font-bold text-slate-400">{day}</span>
        ))}
      </div>
    </div>
  )
}