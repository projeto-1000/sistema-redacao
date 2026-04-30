import { getTeacherStats } from "@/app/actions/teachers";
import { AlertCircle, BarChart2, Calendar } from "lucide-react";
import { Progress } from "@repo/ui/components/progress";

interface TeacherStatsCardsProps {
  teacherId: string;
}

export default async function TeacherStatsCards({ teacherId }: TeacherStatsCardsProps) {
  const stats = await getTeacherStats(teacherId);

  if (!stats) {
    return (
      <div className="border-dashed border-2 border-slate-200 rounded-4xl p-6 flex flex-col items-center justify-center text-center shadow-sm min-h-fit">
        <div className="size-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="text-xs font-black text-red-800 uppercase tracking-widest mb-2">
          Erro ao carregar estatísticas
        </h3>
        <p className="text-slate-700 text-sm max-w-sm">
          Não foi possível buscar o desempenho deste professor no momento. Tente recarregar a página.
        </p>
      </div>
    );
  }

  const currentMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());
  const monthOnTimePercentage = stats.monthStats.total > 0 ? (stats.monthStats.onTime / stats.monthStats.total) * 100 : 0;
  const totalOnTimePercentage = stats.totalStats.total > 0 ? (stats.totalStats.onTime / stats.totalStats.total) * 100 : 0;


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="size-5" />
          </div>
          <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider ${stats.monthStats.isPositiveTrend
            ? "bg-emerald-50 text-emerald-600"
            : "bg-red-50 text-red-600"
            }`}>
            {stats.monthStats.trendText}
          </span>
        </div>
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Mês Corrente ({currentMonth})</h3>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl font-black">{stats.monthStats.total.toLocaleString('pt-BR')}</span>
          <span className="text-sm font-bold text-slate-400">redações corrigidas</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
            <span className="text-emerald-500">{stats.monthStats.onTime.toLocaleString('pt-BR')} No Prazo</span>
            <span className="text-red-500">{stats.monthStats.late.toLocaleString('pt-BR')} Em Atraso</span>
          </div>
          <Progress
            value={stats.monthStats.total > 0 ? monthOnTimePercentage : 0}
            className={`h-2 ${stats.monthStats.total > 0 ? 'bg-red-500' : 'bg-slate-100'}`}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BarChart2 className="size-5" />
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
            Histórico Geral
          </span>
        </div>
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Acumulado</h3>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl font-black">{stats.totalStats.total.toLocaleString('pt-BR')}</span>
          <span className="text-sm font-bold text-slate-400">correções realizadas</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
            <span className="text-emerald-500">{stats.totalStats.onTime.toLocaleString('pt-BR')} No Prazo</span>
            <span className="text-red-500">{stats.totalStats.late.toLocaleString('pt-BR')} Em Atraso</span>
          </div>
          <Progress
            value={stats.totalStats.total > 0 ? totalOnTimePercentage : 0}
            className={`h-2 ${stats.totalStats.total > 0 ? 'bg-red-500' : 'bg-slate-100'}`}
          />
        </div>
      </div>

    </div>
  )
}