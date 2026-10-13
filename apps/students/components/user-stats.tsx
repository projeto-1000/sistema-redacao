import { BarChart3, FileText, Trophy, Minus, TrendingDown, TrendingUp } from "lucide-react";

interface TrendIndicatorProps {
  value?: number;
  unit: string;
  unchangedText?: string;
}

function TrendIndicator({ value, unit, unchangedText = "Manteve a média" }: TrendIndicatorProps) {
  if (value === undefined || value === null) {
    return <span className="text-slate-400">Sem dados anteriores</span>;
  }

  if (value > 0) {
    return (
      <span className="flex items-center gap-1 font-bold text-[#22C55E]">
        <TrendingUp className="size-3.5" />+{value} {unit}{" "}
        <span className="ml-1 font-medium text-slate-400">vs. mês passado</span>
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="flex items-center gap-1 font-bold text-red-500">
        <TrendingDown className="size-3.5" />
        {value} {unit} <span className="ml-1 font-medium text-slate-400">vs. mês passado</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 font-bold text-slate-400">
      <Minus className="size-3.5" />
      {unchangedText} <span className="ml-1 font-medium">vs. mês passado</span>
    </span>
  );
}

interface UserStatsProps {
  stats: {
    totalEssays: number;
    averageScore: number;
    rankingPosition?: number;
    rankingTrend?: number;
    scoreTrend?: number;
    essaysTrend?: number;
  };
}

export function UserStats({ stats }: UserStatsProps) {
  const statCards = [
    {
      label: "Média Geral",
      value: stats.averageScore,
      suffix: null,
      footer: (
        <TrendIndicator value={stats.scoreTrend} unit="pts" unchangedText="Manteve a pontuação" />
      ),
      icon: BarChart3,
      styles: {
        iconBg: "bg-[#FFF9E6]",
        iconColor: "text-[#EBC84C]",
      },
    },
    {
      label: "Redações Enviadas",
      value: stats.totalEssays,
      suffix: "no total",
      footer: (
        <TrendIndicator value={stats.essaysTrend} unit="envios" unchangedText="Sem novos envios" />
      ),
      icon: FileText,
      styles: {
        iconBg: "bg-[#EDF4FF]",
        iconColor: "text-[#3B82F6]",
      },
    },
    {
      label: "Ranking Global",
      value: stats.rankingPosition ? `${stats.rankingPosition}º` : null,
      suffix: "lugar",
      footer: (
        <TrendIndicator
          value={stats.rankingTrend}
          unit="posições"
          unchangedText="Manteve a posição"
        />
      ),
      icon: Trophy,
      styles: {
        iconBg: "bg-[#FFF4ED]",
        iconColor: "text-[#F97316]",
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {statCards.map((item, index) => {
        const hasValidValue = item.value && item.value !== 0 && item.value !== "-";

        return (
          <div
            key={index}
            className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${item.styles.iconBg} ${item.styles.iconColor}`}>
                <item.icon className="size-5" />
              </div>
              <span className="text-[14px] font-bold">{item.label}</span>
            </div>

            <div>
              <h3
                className={`flex items-baseline gap-2 text-4xl font-extrabold ${
                  hasValidValue ? "text-slate-900" : "text-slate-300"
                } mb-1 tracking-tight`}
              >
                <span>{hasValidValue ? item.value : "—"}</span>

                {item.suffix && hasValidValue && (
                  <span className="text-sm font-medium tracking-normal text-slate-500">
                    {item.suffix}
                  </span>
                )}
              </h3>
              <p className="mt-2 text-xs">{item.footer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
