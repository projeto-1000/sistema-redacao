
const queueData = [
  { id: 1, initials: "AL", name: "Ana Luíza Silva", class: "Turma A - Extensivo", theme: "Inteligência Artificial no Brasil e seus impactos no mercado de t...", time: "2 horas", timeColor: "text-red-500 bg-red-50", iconBg: "bg-blue-50 text-blue-600" },
  { id: 2, initials: "BS", name: "Bruno Soares", class: "Turma B - Medicina", theme: "Educação Financeira nas Escolas públicas como ferramenta de ...", time: "5 horas", timeColor: "text-amber-500 bg-amber-50", iconBg: "bg-amber-50 text-amber-600" },
  { id: 3, initials: "MC", name: "Maria Costa", class: "Turma C - Intensivo", theme: "O desafio do saneamento básico no Brasil do século XXI", time: "1 dia", timeColor: "text-emerald-500 bg-emerald-50", iconBg: "bg-purple-50 text-purple-600" },
  { id: 4, initials: "JP", name: "João Paulo", class: "Turma A - Extensivo", theme: "Caminhos para combater a intolerância religiosa no Brasil", time: "1 dia", timeColor: "text-emerald-500 bg-emerald-50", iconBg: "bg-orange-50 text-orange-600" },
];

export default function EssayQueue() {
  return (
    <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">Fila de Correção</h3>
        <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
          Ver fila completa
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-4 font-bold">Nome do Aluno</th>
              <th className="pb-4 font-bold">Tema</th>
              <th className="pb-4 font-bold text-right pr-8">Tempo Restante</th>
              <th className="pb-4 font-bold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {queueData.map((row) => (
              <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm ${row.iconBg}`}>
                      {row.initials}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.class}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <p className="text-sm font-medium text-slate-600 truncate max-w-[400px]">
                    {row.theme}
                  </p>
                </td>
                <td className="py-4 text-right pr-8">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${row.timeColor}`}>
                    {row.time}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Corrigir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}