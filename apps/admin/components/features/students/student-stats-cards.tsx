import { getStudentStats } from "@/app/actions/students";
import {
  Activity,
  CheckCircle2,
  Clock3,
  FileText,
  Medal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface StudentStatsCardsProps {
  studentId: string;
}

export async function StudentStatsCards({ studentId }: StudentStatsCardsProps) {
  const stats = await getStudentStats(studentId);

  const cards = [
    {
      title: "Total de Redações",
      icon: FileText,
      iconColor: "text-blue-600",
      value: stats.totalEssays,
      subtitle: stats.totalTrend,
      trend: stats.submittedThisMonth > 0 ? "positive" : "neutral",
    },
    {
      title: "Média Geral",
      icon: Medal,
      iconColor: "text-amber-500",
      value: stats.averageScore,
      subtitle: stats.averageTrend,
      trend:
        (stats.percentChange ?? 0) > 0
          ? "positive"
          : (stats.percentChange ?? 0) < 0
            ? "negative"
            : "neutral",
    },
    {
      title: "Última Nota",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      value: stats.lastScore,
      subtitle: stats.lastScoreTime,
      trend: "neutral",
    },
    {
      title: "Tempo médio de correção",
      icon: Clock3,
      iconColor: "text-violet-500",
      value: stats.averageCorrectionTime,
      subtitle: stats.averageCorrectionTimeDetail,
      trend: "neutral",
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <article
            key={card.title}
            className={`flex h-36 flex-col justify-between rounded-4xl border border-slate-200 bg-white p-5 shadow-sm ${
              index === cards.length - 1
                ? "xl:col-span-3 2xl:col-span-1"
                : "xl:col-span-2 2xl:col-span-1"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                {card.title}
              </h3>
              <Icon className={`size-5 shrink-0 ${card.iconColor}`} />
            </div>

            <p className="text-3xl leading-none font-black text-slate-900">{card.value}</p>

            <p
              className={`flex min-h-4 items-center gap-1 text-xs font-bold ${
                card.trend === "positive"
                  ? "text-emerald-500"
                  : card.trend === "negative"
                    ? "text-red-500"
                    : "text-slate-400"
              }`}
            >
              {card.trend === "positive" && <TrendingUp className="size-3.5 stroke-3" />}
              {card.trend === "negative" && <TrendingDown className="size-3.5 stroke-3" />}
              {card.subtitle}
            </p>
          </article>
        );
      })}

      <article className="flex h-36 flex-col rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-3 2xl:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Acesso e atividade
          </h3>
          <Activity className="size-5 shrink-0 text-blue-600" />
        </div>

        <div className="mt-3 grid flex-1 grid-cols-1 gap-2 md:grid-cols-2 md:items-center md:gap-0 md:divide-x md:divide-slate-200">
          <div className="min-w-0 md:pr-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                Último login
              </p>
              <p className="shrink-0 text-[10px] font-bold text-slate-400">
                {stats.lastLoginDetail}
              </p>
            </div>
            <p className="truncate text-sm font-black text-slate-900">{stats.lastLoginValue}</p>
          </div>

          <div className="min-w-0 border-t border-slate-200 pt-2 md:border-t-0 md:pt-0 md:pl-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                Última atividade
              </p>
              <p className="shrink-0 text-[10px] font-bold text-slate-400">
                {stats.lastActivityDetail}
              </p>
            </div>
            <p className="truncate text-sm font-black text-slate-900">
              {stats.lastActivityValue}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
