import { CircleAlert, ChevronDown, PackageOpen } from "lucide-react";
import { getPlans } from "@/app/actions/plans";
import type { Plans } from "@repo/types";
import PlansRow from "./plans-row";

interface PlanListProps {
  plans: Plans[];
  emptyMessage: string;
}

function PlanList({ plans, emptyMessage }: PlanListProps) {
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-3 rounded-full bg-slate-50 p-3">
          <PackageOpen className="size-7 text-slate-400" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-5 lg:grid">
        <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Plano
        </div>
        <div className="col-span-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Tipo
        </div>
        <div className="col-span-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Status
        </div>
        <div className="col-span-2 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase lg:text-left">
          Valor do Plano
        </div>
        <div className="col-span-2 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Ação
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {plans.map((plan) => (
          <PlansRow key={plan.id} plan={plan} />
        ))}
      </div>
    </>
  );
}

export async function PlansTable() {
  const { plans, error } = await getPlans();

  if (error) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-100 px-6 py-24 text-center duration-500">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />
        <h3 className="mb-1 text-lg font-bold text-red-600">Ocorreu um erro.</h3>
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          Não conseguimos carregar a lista de planos. Recarregue a página ou tente novamente em
          instantes.
        </p>
      </div>
    );
  }

  const activePlans = plans?.filter((plan) => plan.is_active) ?? [];
  const inactivePlans = plans?.filter((plan) => !plan.is_active) ?? [];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <h2 className="text-base font-black text-slate-800">Planos ativos</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">Disponíveis para novas compras.</p>
        </div>
        <PlanList plans={activePlans} emptyMessage="Nenhum plano ativo no momento." />
      </section>

      <details className="group overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 sm:px-8 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-base font-black text-slate-800">Planos inativos</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {inactivePlans.length}{" "}
              {inactivePlans.length === 1 ? "plano preservado" : "planos preservados"}
            </p>
          </div>
          <ChevronDown className="size-5 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-slate-100">
          <PlanList plans={inactivePlans} emptyMessage="Nenhum plano inativo." />
        </div>
      </details>
    </div>
  );
}
