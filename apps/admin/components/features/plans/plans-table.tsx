import { CircleAlert, PackageOpen } from "lucide-react";
import { getPlans } from "@/app/actions/plans";
import PlansRow from "./plans-row";


export async function PlansTable() {
  const { plans, error } = await getPlans();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500">
        <CircleAlert className="size-14 bg-white rounded-full text-red-500 p-1 shadow-sm mb-4" />
        <h3 className="text-lg font-bold text-red-600 mb-1">
          Ocorreu um erro.
        </h3>
        <p className="text-slate-600 text-sm max-w-sm leading-relaxed">
          Não conseguimos carregar a lista de alunos. Por favor, recarregue a página ou tente novamente em instantes.
        </p>
      </div>
    )
  }

  return (
    plans && plans.length > 0 ? (
      <div className="rounded-4xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Plano
          </div>
          <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Tipo
          </div>
          <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Status
          </div>
          <div className="col-span-2 text-center lg:text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Valor do Plano
          </div>
          <div className="col-span-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Ação
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {plans.map((plan) => (
            <PlansRow key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500  bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <PackageOpen className="size-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-1">Nenhum plano cadastrado</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Você ainda não criou nenhum plano de assinatura. Clique em &quot;Adicionar Novo Plano&quot; para começar.
        </p>
      </div>
    )
  );
}