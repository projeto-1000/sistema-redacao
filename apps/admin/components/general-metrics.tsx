import { getDashboardMetrics } from "@/app/actions/get-dashboard-metrics";
import { TrendingUp, Users, CreditCard, TrendingDown, FileText } from "lucide-react";

export default async function GeneralMetrics() {
  const metrics = await getDashboardMetrics();

  const cardsData = [
    {
      title: "Alunos Ativos",
      value: metrics.students.total,
      suffix: null,
      trend: metrics.students.trend,
      isPositive: metrics.students.isPositive,
      icon: Users,
      decorationClass: "bg-blue-50",
      iconClass: "bg-blue-100 text-blue-600",
    },
    {
      title: "Planos Ativos",
      value: metrics.plans.total,
      suffix: null,
      trend: metrics.plans.trend,
      isPositive: metrics.plans.isPositive,
      icon: CreditCard,
      decorationClass: "bg-emerald-50",
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Redações Pendentes",
      value: metrics.essays.total,
      suffix: "na fila",
      trend: metrics.essays.trend,
      isPositive: metrics.essays.isPositive,
      icon: FileText,
      decorationClass: "bg-amber-50",
      iconClass: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {cardsData.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className="relative flex justify-between overflow-hidden rounded-4xl border border-slate-100 bg-white p-8 shadow-sm"
          >
            <div
              className={`absolute top-0 right-0 z-0 h-32 w-32 rounded-bl-[100px] opacity-50 ${card.decorationClass}`}
            />

            <div className="relative z-10 flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-500">{card.title}</span>

              <div className="flex items-baseline gap-2">
                <h2 className="text-5xl font-black tracking-tight">{card.value}</h2>
                {card.suffix && (
                  <span className="text-sm font-medium text-slate-400">{card.suffix}</span>
                )}
              </div>

              <div
                className={`mt-2 flex w-fit items-center gap-1 rounded-md px-2 py-1 ${card.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
              >
                {card.isPositive ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                <span className="text-xs font-bold">{card.trend}</span>
              </div>
            </div>

            <div
              className={`relative z-10 flex size-12 items-center justify-center rounded-full ${card.iconClass}`}
            >
              <Icon className="size-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
