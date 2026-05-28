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
      <span className="flex items-center gap-1 text-[#22C55E] font-bold">
        <TrendingUp className="size-3.5" />
        +{value} {unit} <span className="text-slate-400 font-medium ml-1">vs. mês passado</span>
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="flex items-center gap-1 text-red-500 font-bold">
        <TrendingDown className="size-3.5" />
        {value} {unit} <span className="text-slate-400 font-medium ml-1">vs. mês passado</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-slate-400 font-bold">
      <Minus className="size-3.5" />
      {unchangedText} <span className="font-medium ml-1">vs. mês passado</span>
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
      footer: <TrendIndicator value={stats.scoreTrend} unit="pts" unchangedText="Manteve a pontuação" />,
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
      footer: <TrendIndicator value={stats.essaysTrend} unit="envios" unchangedText="Sem novos envios" />,
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
      footer: <TrendIndicator value={stats.rankingTrend} unit="posições" unchangedText="Manteve a posição" />,
      icon: Trophy,
      styles: {
        iconBg: "bg-[#FFF4ED]",
        iconColor: "text-[#F97316]",
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statCards.map((item, index) => {
        const hasValidValue = item.value && item.value !== 0 && item.value !== "-";

        return (
          <div
            key={index}
            className="p-6 rounded-4xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${item.styles.iconBg} ${item.styles.iconColor}`}>
                <item.icon className="size-5" />
              </div>
              <span className="font-bold text-[14px]">
                {item.label}
              </span>
            </div>

            <div>
              <h3
                className={`text-4xl font-extrabold flex items-baseline gap-2 ${hasValidValue ? 'text-slate-900' : 'text-slate-300'
                  } mb-1 tracking-tight`}
              >
                <span>{hasValidValue ? item.value : "—"}</span>

                {item.suffix && hasValidValue && (
                  <span className="text-sm font-medium text-slate-500 tracking-normal">
                    {item.suffix}
                  </span>
                )}
              </h3>
              <p className="text-xs mt-2">
                {item.footer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}