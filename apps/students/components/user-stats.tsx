import { BarChart3, FileText, Award, Minus, TrendingDown, TrendingUp } from "lucide-react";
interface TrendIndicatorProps {
  value?: number;
  unit: string;
}

interface UserStatsProps {
  stats: {
    totalEssays: number;
    averageScore: number;
    bestScore: number;
    bestCompetence: string;
    scoreTrend?: number;
    essaysTrend?: number;
  };
}

const competenceLabels: Record<string, string> = {
  "C1": "Domínio da escrita formal",
  "C2": "Compreensão do tema",
  "C3": "Organização das ideias",
  "C4": "Coesão e conectivos",
  "C5": "Proposta de intervenção",
  "-": "Aguardando correções",
};


function TrendIndicator({ value, unit }: TrendIndicatorProps) {
  if (value === undefined || value === null || value === 0) {
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
      Manteve a média <span className="font-medium ml-1">vs. mês passado</span>
    </span>
  );
}

export function UserStats({ stats }: UserStatsProps) {
  const bestCompetenceLabel = competenceLabels[stats.bestCompetence] || "Sem dados";

  const statCards = [
    {
      label: "Média Geral",
      value: stats.averageScore,
      footer: <TrendIndicator value={stats.scoreTrend} unit="pts" />,
      icon: BarChart3,
      styles: {
        iconBg: "bg-[#FFF9E6]",
        iconColor: "text-[#EBC84C]",
      },
    },
    {
      label: "Redações Enviadas",
      value: stats.totalEssays,
      footer: <TrendIndicator value={stats.essaysTrend} unit="envios" />,
      icon: FileText,
      styles: {
        iconBg: "bg-[#EDF4FF]",
        iconColor: "text-[#3B82F6]",
      },
    },
    {
      label: "Melhor Competência",
      value: stats.bestCompetence,
      footer: (
        <span className="text-[#F97316]/80 font-medium">
          {bestCompetenceLabel}
        </span>
      ),
      icon: Award,
      styles: {
        iconBg: "bg-[#FFF4ED]",
        iconColor: "text-[#F97316]",
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statCards.map((item, index) => (
        <div
          key={index}
          className="p-6 rounded-4xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl ${item.styles.iconBg} ${item.styles.iconColor}`}>
              <item.icon className="size-5" />
            </div>
            <span className="font-bold text-14px">
              {item.label}
            </span>
          </div>

          <div>
            <h3
              className={`text-4xl font-extrabold ${item.value && item.value !== 0 && item.value !== "-"
                ? 'text-slate-900'
                : 'text-slate-300'
                } mb-1 tracking-tight`}
            >
              {item.value && item.value !== 0 && item.value !== "-" ? item.value : "—"}
            </h3>
            <p className="text-xs mt-2">
              {item.footer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}