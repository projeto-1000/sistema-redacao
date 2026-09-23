import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  Landmark,
} from "lucide-react";
import type { TeacherPaymentAccount, TeacherPaymentMetrics } from "@repo/types";
import { formatDecimalCurrency, maskPaymentAccountNumber, maskPaymentPixKey } from "@repo/utils";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { CopyPaymentAccountButton } from "./copy-payment-account-button";

interface PaymentOverviewProps {
  metrics: TeacherPaymentMetrics;
  monthLabel: string;
  account: TeacherPaymentAccount | null;
  accountsHref: string;
  historyHref: string;
  adminAction?: React.ReactNode;
  essaysAction?: React.ReactNode;
  allowCopyAccount?: boolean;
}

export function PaymentOverview({
  metrics,
  monthLabel,
  account,
  accountsHref,
  historyHref,
  adminAction,
  essaysAction,
  allowCopyAccount = false,
}: PaymentOverviewProps) {
  const isPaid = metrics.status === "paid";
  const deliveryTotal = metrics.onTime + metrics.delayed;
  const onTimePercentage = deliveryTotal > 0 ? Math.round((metrics.onTime / deliveryTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Banknote className="size-5" />}
          iconClassName="bg-amber-50 text-amber-600"
          label={isPaid ? "Total pago" : "A receber"}
          value={formatDecimalCurrency(metrics.totalAmount)}
          badge={isPaid ? "Pago" : "Em aberto"}
          badgeClassName={isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}
        />
        <MetricCard
          icon={<FileCheck2 className="size-5" />}
          iconClassName="bg-blue-50 text-blue-600"
          label="Redações computadas"
          value={String(metrics.totalEssays)}
        />
        <MetricCard
          icon={<CheckCircle2 className="size-5" />}
          iconClassName="bg-emerald-50 text-emerald-600"
          label="Valor por correção"
          value={formatDecimalCurrency(metrics.valuePerCorrection)}
        />
        <MetricCard
          icon={<CalendarDays className="size-5" />}
          iconClassName="bg-blue-50 text-blue-600"
          label="Competência"
          value={monthLabel}
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <section className="flex h-full flex-col rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Resumo do período</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Somente redações finalizadas entram no cálculo.
              </p>
            </div>
            {essaysAction}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm font-medium text-slate-600">Entregues no prazo</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{metrics.onTime}</p>
            </div>
            <div className="rounded-2xl bg-red-50 p-5">
              <p className="text-sm font-medium text-slate-600">Entregues com atraso</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{metrics.delayed}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700">Pontualidade das correções</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Distribuição das entregas finalizadas no período
                </p>
              </div>
              <span className="shrink-0 text-lg font-black text-slate-900">{onTimePercentage}% no prazo</span>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-red-100">
              <span
                className="h-full rounded-full bg-emerald-400 transition-[width]"
                style={{ width: `${onTimePercentage}%` }}
              />
            </div>
          </div>

          {adminAction && <div className="mt-auto pt-6">{adminAction}</div>}
        </section>

        <section className="flex h-full flex-col rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Landmark className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">Conta principal</h2>
              <p className="text-sm font-medium text-slate-500">Usada para os próximos pagamentos</p>
            </div>
          </div>

          {account ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    {account.type === "pix" ? `PIX • ${account.pix_type?.toUpperCase()}` : account.bank_name}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-500">
                    {account.type === "pix"
                      ? maskPaymentPixKey(account.pix_key, account.pix_type)
                      : `Agência ${account.agency} • Conta ${maskPaymentAccountNumber(account.account_number)}`}
                  </p>
                </div>
                {allowCopyAccount && <CopyPaymentAccountButton account={account} />}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-800">
              <CircleAlert className="mt-0.5 size-5 shrink-0" />
              <p className="text-sm font-medium">Nenhuma conta de recebimento foi cadastrada.</p>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Button asChild variant="outline" className="h-12 w-full rounded-xl font-bold text-blue-600">
              <Link href={accountsHref}>Gerenciar contas</Link>
            </Button>
            <Button asChild variant="ghost" className="h-11 w-full rounded-xl font-bold text-slate-600">
              <Link href={historyHref}>Ver histórico completo</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  iconClassName,
  label,
  value,
  badge,
  badgeClassName,
}: {
  icon: React.ReactNode;
  iconClassName: string;
  label: string;
  value: string;
  badge?: string;
  badgeClassName?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-2xl font-black text-slate-900">{value}</p>
            {badge && (
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${badgeClassName}`}>
                {badge}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
