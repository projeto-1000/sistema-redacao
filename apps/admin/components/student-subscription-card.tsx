import { StudentCredits, StudentSubscription, SubscriptionStatus } from "@repo/types";
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
  credits: StudentCredits | null
}

export default function StudentSubscriptionCard({ subscription, credits }: StudentSubscriptionCardProps) {

  if (!subscription || !credits) {
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

  const badge = statusBadgeConfig[subscription.status as SubscriptionStatus];

  const renderDateText = () => {
    if (!subscription.current_period_end || subscription.billing_cycle === 'lifetime') {
      return <>Acesso: <span className="font-bold">Vitalício</span></>;
    }

    const formattedDate = formatDate(subscription.current_period_end, 'numeric');

    if (!subscription.cancel_at_period_end && subscription.status !== 'canceled') {
      return <>Próxima renovação: <span className="font-bold">{formattedDate}</span></>;
    }

    return <>Expira em: <span className="font-bold">{formattedDate}</span></>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">

      {/* CARD 1: DADOS DA ASSINATURA */}
      <div className="p-8 flex flex-col items-center justify-center text-center bg-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Dados da Assinatura</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${badge.classes}`}>
            {badge.label}
          </span>
          <span className="font-black text-lg capitalize">{subscription.plan_name}</span>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {renderDateText()}
        </p>
      </div>

      {/* CARD 2: REDAÇÕES RESTANTES */}
      <div className="p-8 flex flex-col items-center justify-center bg-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Redações Restantes
        </h3>
        <div className="size-20 rounded-full border-[6px] border-amber-200/40 flex items-center justify-center">
          {/* Usamos flex items-baseline para alinhar a base do número grande com o texto pequeno */}
          <div className="flex items-baseline translate-x-1">
            <span className="text-3xl font-black text-amber-400">{credits.plan_credits}</span>
            <span className="text-sm font-bold text-amber-400/60 ml-0.5">/{credits.total_credits}</span>
          </div>
        </div>
      </div>

      {/* CARD 3: CRÉDITOS ADICIONAIS */}
      <div className="p-8 flex flex-col items-center justify-center bg-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Créditos Adicionais
        </h3>
        <div className="size-20 rounded-full border-[6px] border-blue-100 flex items-center justify-center">
          <span className="text-3xl font-black text-blue-600">{credits.extra_credits}</span>
        </div>
      </div>
    </div>
  )
}