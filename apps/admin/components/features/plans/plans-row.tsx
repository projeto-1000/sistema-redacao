import { Plans } from "@repo/types"
import { Button } from "@repo/ui/components/button";
import { billingCycleMap, formatCurrency } from "@repo/utils";
import { Pencil } from "lucide-react";

interface PlansRowProps {
  plan: Plans
}


export default function PlansRow({ plan }: PlansRowProps) {
  const cycleInfo = billingCycleMap[plan.billing_cycle];

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-4 px-4 sm:px-8 py-5 items-center hover:bg-slate-50 transition-colors group"
    >

      <div className="lg:col-span-3 flex flex-col">
        <span className="text-sm font-bold text-slate-700">{plan.name}</span>
        <span className="text-sm text-slate-500">
          {plan.credits_included} redações{cycleInfo.suffix}
        </span>
      </div>


      <div className="lg:col-span-3 mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Tipo
        </span>
        <p className="text-sm font-medium leading-snug line-clamp-2" title={plan.billing_cycle}>
          {cycleInfo.label}
        </p>
      </div>

      <div className="lg:col-span-2 mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Status
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${plan.is_active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500"
              }`}
          >
            {plan.is_active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <div className="lg:col-span-2 flex items-baseline  lg:justify-start gap-1 mt-2 lg:mt-0">
        <span className="lg:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest block mr-1">
          Valor:
        </span>
        <span className="text-sm font-bold">
          {formatCurrency(plan.price)}
          <span className="text-xs font-normal text-slate-500 ml-0.5">
            {cycleInfo.suffix}
          </span>
        </span>
      </div>

      <div className="lg:col-span-2 flex lg:justify-end mt-2 lg:mt-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
          <Pencil className="size-4" />
          <span className="sr-only">Editar</span>
        </Button>
      </div>

    </div >
  )
}