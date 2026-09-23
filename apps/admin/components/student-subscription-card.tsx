import {
  StudentCredits,
  StudentSubscription,
  SubscriptionStatus,
} from "@repo/types";
import { formatDate } from "@repo/utils";
import { CircleAlert } from "lucide-react";

const statusBadgeConfig: Record<
  SubscriptionStatus,
  { label: string; classes: string }
> = {
  active: {
    label: "Ativo",
    classes: "bg-emerald-50 text-emerald-600",
  },
  trial: {
    label: "Ativo",
    classes: "bg-emerald-50 text-emerald-600",
  },
  past_due: {
    label: "Inadimplente",
    classes: "bg-amber-50 text-amber-700",
  },
  unpaid: {
    label: "Inadimplente",
    classes: "bg-amber-50 text-amber-700",
  },
  canceled: {
    label: "Cancelado",
    classes: "bg-slate-200 text-slate-600",
  },
};

interface StudentSubscriptionCardProps {
  subscription: StudentSubscription | null;
  credits: StudentCredits | null;
  hasSubscriptionError: boolean;
  hasCreditsError: boolean;
}

function getPlanPeriodLabel(subscription: StudentSubscription) {
  if (subscription.interval === "lifetime") {
    return null;
  }

  if (
    subscription.interval === "month" &&
    subscription.interval_count === 3
  ) {
    return "Trimestral";
  }

  if (subscription.interval === "month") {
    return "Mensal";
  }

  if (subscription.interval === "day") {
    const count = subscription.interval_count ?? 1;

    return `${count} dia${count > 1 ? "s" : ""}`;
  }

  return null;
}

export default function StudentSubscriptionCard({
  subscription,
  credits,
  hasCreditsError,
  hasSubscriptionError,
}: StudentSubscriptionCardProps) {
  if (hasSubscriptionError || hasCreditsError) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 px-6 py-8">
        <div className="mb-2 flex items-center gap-2">
          <CircleAlert className="size-4 rounded-full bg-white text-red-500 shadow-sm" />

          <h3 className="font-bold text-red-600">
            Ocorreu um erro.
          </h3>
        </div>

        <p className="max-w-sm text-center text-sm leading-relaxed text-slate-600 md:max-w-md">
          Não conseguimos carregar os dados de assinatura do aluno.
          <br />
          Por favor, recarregue a página ou tente novamente em instantes.
        </p>
      </div>
    );
  }

  const totalCredits =
    (credits?.plan_credits ?? 0) +
    (credits?.extra_credits ?? 0) +
    (credits?.free_credits ?? 0) +
    (credits?.mentorship_credits ?? 0);

  const creditItems = [
    {
      label: "Plano",
      value: credits?.plan_credits ?? 0,
      expiresAt: subscription?.current_period_end ?? null,
      dotClass: "bg-blue-500",
      textClass: "text-blue-700",
    },
    {
      label: "Extra",
      value: credits?.extra_credits ?? 0,
      expiresAt: null,
      dotClass: "bg-violet-500",
      textClass: "text-violet-700",
    },
    {
      label: "Gratuito",
      value: credits?.free_credits ?? 0,
      expiresAt: credits?.free_credit_expires_at ?? null,
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-700",
    },
    {
      label: "Mentoria",
      value: credits?.mentorship_credits ?? 0,
      expiresAt: credits?.mentorship_credit_expires_at ?? null,
      dotClass: "bg-amber-500",
      textClass: "text-amber-700",
    },
  ];

  const activeCreditItems = creditItems.filter(
    (credit) => credit.value > 0
  );

  const planPeriodLabel = subscription
    ? getPlanPeriodLabel(subscription)
    : null;

  const badge = subscription
    ? statusBadgeConfig[
    subscription.status as SubscriptionStatus
    ]
    : null;

  const isLifetime =
    subscription?.interval === "lifetime";

  const periodStart = subscription?.current_period_start
    ? formatDate(
      subscription.current_period_start,
      "compact"
    )
    : null;

  const periodEnd = subscription?.current_period_end
    ? formatDate(
      subscription.current_period_end,
      "compact"
    )
    : null;

  const isCanceled =
    subscription?.status === "canceled" ||
    subscription?.cancel_at_period_end;

  const planDateLabel = (() => {
    if (!subscription) return null;

    if (isLifetime) {
      return "Sem vencimento";
    }

    if (!periodEnd) {
      return "Sem vigência";
    }

    if (isCanceled) {
      return `Expira em ${periodEnd}`;
    }

    return `Renova em ${periodEnd}`;
  })();

  return (
    <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-[0.9fr_1.6fr] md:divide-x md:divide-y-0">
      {/* PLANO E VIGÊNCIA */}
      <div className="bg-slate-100 p-8">
        <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-500">
          Plano e vigência
        </h3>

        {subscription ? (
          <div className="space-y-4">
            {badge && (
              <span
                className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badge.classes}`}
              >
                {badge.label}
              </span>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-black text-slate-800">
                  {subscription.plan_name === "Plano Gratuito"
                    ? "Gratuito"
                    : subscription.plan_name}
                </span>

                {planPeriodLabel && (
                  <>
                    <span
                      className="h-4 w-px bg-slate-300"
                      aria-hidden="true"
                    />

                    <span className="text-sm font-bold text-slate-600">
                      {planPeriodLabel}
                    </span>
                  </>
                )}
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                {planDateLabel}
              </p>

              {!isLifetime &&
                !isCanceled &&
                subscription.status === "active" && (
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Renovação automática ao fim do período
                  </p>
                )}

              {isCanceled && periodEnd && (
                <p className="mt-1 text-xs font-medium text-slate-400">
                  O acesso permanece disponível até o fim do ciclo
                </p>
              )}
            </div>

            {!isLifetime &&
              periodStart &&
              periodEnd && (
                <div className="rounded-xl border border-slate-200 bg-white/60 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-500">
                    Ciclo atual
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {periodStart} – {periodEnd}
                  </p>
                </div>
              )}
          </div>
        ) : (
          <div>
            <p className="font-bold text-slate-700">
              Sem plano ativo
            </p>

            <p className="mt-1 max-w-xs text-sm text-slate-500">
              Este aluno não possui uma assinatura ativa no momento.
            </p>
          </div>
        )}
      </div>

      {/* CRÉDITOS */}
      <div className="bg-slate-100 p-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Créditos disponíveis
            </h3>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-800">
                {totalCredits}
              </span>

              <span className="text-sm font-semibold text-slate-400">
                {totalCredits === 1
                  ? "crédito no total"
                  : "créditos no total"}
              </span>
            </div>
          </div>
        </div>

        {totalCredits > 0 && (
          <div className="mb-5 flex h-2 overflow-hidden rounded-full bg-slate-200">
            {activeCreditItems.map((credit) => (
              <div
                key={credit.label}
                className={credit.dotClass}
                style={{
                  width: `${(credit.value / totalCredits) * 100
                    }%`,
                }}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {creditItems.map((credit) => (
            <div
              key={credit.label}
              className="rounded-xl border border-slate-200 bg-white/60 p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${credit.dotClass}`}
                />

                <span
                  className={`text-lg font-black ${credit.textClass}`}
                >
                  {credit.value}
                </span>
              </div>

              <p
                className={`mt-1 text-xs font-bold ${credit.textClass}`}
              >
                {credit.label}
              </p>

              <p className="mt-2 text-[11px] font-medium leading-snug text-slate-500">
                {credit.label === "Extra"
                  ? "Sem validade"
                  : credit.expiresAt
                    ? `Válido até ${formatDate(
                      credit.expiresAt,
                      "compact"
                    )}`
                    : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}