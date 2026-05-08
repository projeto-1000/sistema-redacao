
import { StudentSubscription, SubscriptionStatus } from "@repo/types";
import { formatDate } from "@repo/utils";
import { CircleAlert } from "lucide-react";

const statusBadgeConfig: Record<SubscriptionStatus, { label: string; classes: string }> = {
  active: {
    label: "Ativo",
    classes: "bg-emerald-50 text-emerald-600"
  },
  trial: {
    label: "Teste",
    classes: "bg-blue-50 text-blue-600"
  },
  past_due: {
    label: "Atrasado",
    classes: "bg-amber-50 text-amber-600"
  },
  unpaid: {
    label: "Bloqueado",
    classes: "bg-red-50 text-red-600"
  },
  canceled: {
    label: "Cancelado",
    classes: "bg-slate-100 text-slate-500"
  },
};

interface StudentSubscriptionCardProps {
  subscription: StudentSubscription | null
}

export default function StudentSubscriptionCard({ subscription }: StudentSubscriptionCardProps) {

  if (!subscription) {
    return (
      <div className="bg-slate-100 flex flex-col items-center justify-center py-8 px-6">
        <div className="flex items-center mb-2 gap-2">
          <CircleAlert className="size-4 bg-white rounded-full text-red-500 shadow-sm" />
          <h3 className="font-bold text-red-600">
            Ocorreu um erro.
          </h3>
        </div>
        <p className="text-slate-600 text-sm max-w-sm md:max-w-md leading-relaxed text-center">
          Não conseguimos carregar os dados de assinatura do aluno.<br /> Por favor, recarregue a página ou tente novamente em instantes.
        </p>
      </div>
    )
  }

  const bagde = statusBadgeConfig[subscription.status as SubscriptionStatus]

  return (

    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">

      <div className="p-8 flex flex-col items-center justify-center text-center bg-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Dados da Assinatura</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${bagde.classes}`}>
            {bagde.label}
          </span>

          <span className="font-black text-lg capitalize">{subscription.tier}</span>
        </div>
        <p className="text-sm font-medium text-slate-500">
          Expira em: <span className="font-bold text-slate-900">{formatDate(subscription.current_period_end, 'numeric')}</span>
        </p>
      </div>

      <div className="p-8 flex flex-col items-center justify-center bg-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Redações Restantes
        </h3>
        <div className="size-20 rounded-full border-[6px] border-amber-200/40 flex items-center justify-center">
          <span className="text-3xl font-black text-amber-400">{subscription.remaining_essays}</span>
        </div>
      </div>


      <div className="p-8 flex flex-col items-center justify-center bg-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Créditos Adicionais
        </h3>
        <div className="size-20 rounded-full border-[6px] border-blue-100 flex items-center justify-center">
          <span className="text-3xl font-black text-blue-600">{subscription.extra_credits}</span>
        </div>
      </div>
    </div>
  )
}