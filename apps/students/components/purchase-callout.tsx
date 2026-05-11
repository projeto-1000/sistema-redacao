import { History, Layers } from "lucide-react";

const features = [
  {
    icon: History,
    title: "Flexibilidade Total",
    description: "Use seus créditos apenas quando necessário, sem pressão de prazos mensais.",
  },
  {
    icon: Layers,
    title: "Consumo Inteligente",
    description: "O sistema utiliza automaticamente os créditos do seu plano primeiro, preservando seus avulsos.",
  },
];

export function PurchaseCallout() {
  return (
    <div className="w-full bg-slate-200/40 rounded-2xl p-8 md:p-10 flex flex-col gap-8 mx-auto border-2 border-dashed border-slate-500/20">
      <h3 className="text-xl font-extrabold text-slate-800">
        Por que comprar créditos avulsos?
      </h3>

      <div className="flex flex-col gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <div key={index} className="flex gap-5 items-start">
              <div className="bg-white size-10 md:size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white/50">
                <Icon className="size-5 text-primary" />
              </div>

              <div className="flex flex-col gap-1 mt-1">
                <h4 className="text-lg font-bold text-slate-800">
                  {feature.title}
                </h4>
                <p className="text-base font-medium text-slate-600 leading-relaxed max-w-2xl">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}