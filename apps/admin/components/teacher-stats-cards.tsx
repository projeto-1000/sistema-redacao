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
      <div className="flex min-h-fit flex-col items-center justify-center rounded-4xl border-2 border-dashed border-slate-200 p-6 text-center shadow-sm">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="mb-2 text-xs font-black tracking-widest text-red-800 uppercase">
          Erro ao carregar estatísticas
        </h3>
        <p className="max-w-sm text-sm text-slate-700">
          Não foi possível buscar o desempenho deste professor no momento. Tente recarregar a
          página.
        </p>
      </div>
    );
  }

  const currentMonth = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());
  const monthOnTimePercentage =
    stats.monthStats.total > 0 ? (stats.monthStats.onTime / stats.monthStats.total) * 100 : 0;
  const totalOnTimePercentage =
    stats.totalStats.total > 0 ? (stats.totalStats.onTime / stats.totalStats.total) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Calendar className="size-5" />
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-black tracking-wider uppercase ${
              stats.monthStats.isPositiveTrend
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {stats.monthStats.trendText}
          </span>
        </div>
        <h3 className="mb-1 text-[11px] font-black tracking-widest text-slate-500 uppercase">
          Mês Corrente ({currentMonth})
        </h3>
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-4xl font-black">
            {stats.monthStats.total.toLocaleString("pt-BR")}
          </span>
          <span className="text-sm font-bold text-slate-400">redações corrigidas</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black tracking-wider uppercase">
            <span className="text-emerald-500">
              {stats.monthStats.onTime.toLocaleString("pt-BR")} No Prazo
            </span>
            <span className="text-red-500">
              {stats.monthStats.late.toLocaleString("pt-BR")} Em Atraso
            </span>
          </div>
          <Progress
            value={stats.monthStats.total > 0 ? monthOnTimePercentage : 0}
            className={`h-2 ${stats.monthStats.total > 0 ? "bg-red-500" : "bg-slate-100"}`}
          />
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <BarChart2 className="size-5" />
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black tracking-wider text-slate-600 uppercase">
            Histórico Geral
          </span>
        </div>
        <h3 className="mb-1 text-[11px] font-black tracking-widest text-slate-500 uppercase">
          Total Acumulado
        </h3>
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-4xl font-black">
            {stats.totalStats.total.toLocaleString("pt-BR")}
          </span>
          <span className="text-sm font-bold text-slate-400">correções realizadas</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black tracking-wider uppercase">
            <span className="text-emerald-500">
              {stats.totalStats.onTime.toLocaleString("pt-BR")} No Prazo
            </span>
            <span className="text-red-500">
              {stats.totalStats.late.toLocaleString("pt-BR")} Em Atraso
            </span>
          </div>
          <Progress
            value={stats.totalStats.total > 0 ? totalOnTimePercentage : 0}
            className={`h-2 ${stats.totalStats.total > 0 ? "bg-red-500" : "bg-slate-100"}`}
          />
        </div>
      </div>
    </div>
  );
}
