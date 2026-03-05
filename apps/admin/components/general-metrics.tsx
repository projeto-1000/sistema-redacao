import { TrendingUp, Users, CreditCard, TrendingDown, FileText } from "lucide-react";

export default function GeneralMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card Alunos */}
      <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100 flex justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] z-0 opacity-50" />
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-500">Alunos Ativos</span>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">245</h2>
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md mt-2">
            <TrendingUp className="size-3" />
            <span className="text-xs font-bold">+5% este mês</span>
          </div>
        </div>
        <div className="relative z-10 size-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Users className="size-5" />
        </div>
      </div>

      {/* Card Planos */}
      <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] z-0 opacity-50" />
        <div className="relative z-10 flex justify-between w-full">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-500">Planos Ativos</span>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">156</h2>
          </div>
          <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CreditCard className="size-5" />
          </div>
        </div>
        <div className="relative z-10 mt-6 flex flex-col gap-2">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[78%] rounded-full" />
          </div>
          <span className="text-xs font-semibold text-slate-400">78% da meta mensal</span>
        </div>
      </div>

      {/* Card Redações Pendentes */}
      <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100 flex justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] z-0 opacity-50" />
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-500">Redações Pendentes</span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">32</h2>
            <span className="text-sm font-medium text-slate-400">na fila</span>
          </div>
          <div className="flex items-center gap-1 text-red-600 bg-red-50 w-fit px-2 py-1 rounded-md mt-2">
            <TrendingDown className="size-3" />
            <span className="text-xs font-bold">-2% Fila de espera</span>
          </div>
        </div>
        <div className="relative z-10 size-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <FileText className="size-5" />
        </div>
      </div>
    </div>
  )
}