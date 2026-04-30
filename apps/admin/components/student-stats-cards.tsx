import { getStudentStats } from "@/app/action/students";
import { FileText, Medal, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";

interface StudentStatsCardsProps {
  studentId: string;
}

export async function StudentStatsCards({ studentId }: StudentStatsCardsProps) {
  const stats = await getStudentStats(studentId);

  let avgTrendType = "neutral";

  if (stats.percentChange !== undefined) {
    if (stats.percentChange > 0) avgTrendType = "positive";
    else if (stats.percentChange < 0) avgTrendType = "negative";
  }

  const cards = [
    {
      title: "Total de Redações",
      icon: FileText,
      iconColor: "text-blue-600",
      value: stats.totalEssays,
      subtitle: stats.totalTrend,
      trendType: stats.submittedThisMonth > 0 ? "positive" : "neutral",
    },
    {
      title: "Média Geral",
      icon: Medal,
      iconColor: "text-amber-500",
      value: stats.averageScore,
      subtitle: stats.averageTrend,
      trendType: avgTrendType,
    },
    {
      title: "Última Nota",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      value: stats.lastScore,
      subtitle: stats.lastScoreTime,
      trendType: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div key={index} className="bg-white rounded-4xl shadow-sm border border-slate-200 p-6">

            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {card.title}
              </h3>
              <Icon className={`size-5 ${card.iconColor}`} />
            </div>

            <p className="text-4xl font-black">
              {card.value}
            </p>

            {card.trendType === "positive" && (
              <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                <TrendingUp className="size-3.5 stroke-3" /> {card.subtitle}
              </p>
            )}

            {card.trendType === "negative" && (
              <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1">
                <TrendingDown className="size-3.5 stroke-3" /> {card.subtitle}
              </p>
            )}

            {card.trendType === "neutral" && (
              <p className={`text-xs font-bold text-slate-400 mt-2 ${index === 2 ? 'capitalize' : 'normal-case'} `}>
                {card.subtitle}
              </p>
            )}

          </div>
        );
      })}

    </div>
  );
}