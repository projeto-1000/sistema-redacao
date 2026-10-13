import { EssaysPeriodModal } from "./essays-period-modal";
import { PaymentActions } from "./payment-actions";
import { notFound } from "next/navigation";
import { getPaymentAccounts } from "@/app/actions/payment-accounts";
import { getEssaysByPeriod, getPaymentMetrics } from "@/app/actions/teacher-payments";
import { formatDecimalCurrency } from "@repo/utils";
interface PaymentSummaryProps {
  teacherId: string;
  month: string | undefined;
}

export async function PaymentSummary({ teacherId, month }: PaymentSummaryProps) {
  const [metrics, accounts] = await Promise.all([
    getPaymentMetrics(teacherId, month),
    getPaymentAccounts(teacherId),
  ]);

  const isPaid = metrics.status === "paid";
  const hasEssays = metrics.totalEssays > 0;

  const safeMonth = month || new Date().toISOString().slice(0, 7);

  function getMonthRange(m: string) {
    const parts = m.split("-");

    const year = Number(parts[0]);
    const monthIndex = Number(parts[1]);

    const fromDate = new Date(year, monthIndex - 1, 1);
    const toDate = new Date(year, monthIndex, 0);
    toDate.setHours(23, 59, 59, 999);

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    };
  }

  const range = getMonthRange(safeMonth);

  const { essays, totalPages } = await getEssaysByPeriod({
    teacherId,
    start: range.from,
    end: range.to,
  });

  if (!essays) {
    notFound();
  }

  const getUIState = () => {
    if (!hasEssays) return { text: "text-slate-300", bar: "bg-slate-100" };
    if (isPaid) return { text: "text-slate-900", bar: "bg-emerald-500" };

    return { text: "text-[#C47E3A]", bar: "bg-[#F4C042]" };
  };

  const uiState = getUIState();

  return (
    <div className="grid grid-cols-1 divide-y divide-slate-100 overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm md:grid-cols-2 md:divide-x md:divide-y-0">
      <div className="flex h-full flex-col justify-between p-6 md:p-8">
        <div>
          <h3 className="mb-4 text-[11px] font-black tracking-widest text-slate-500 uppercase">
            Redações no Período
          </h3>

          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-5xl font-black">{metrics.totalEssays}</span>
            <span className="text-sm font-medium text-slate-500">correções</span>
          </div>

          <div className="mb-6 flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500"></span> {metrics.onTime} no
              prazo
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-red-500">
              <span className="size-1.5 rounded-full bg-red-500"></span> {metrics.delayed} atrasadas
            </span>
          </div>

          <div className="mb-6 h-px w-full bg-slate-100" />

          <div className="mb-8 grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Valor por Correção
              </p>
              <p className="text-xl font-black">
                R$ {metrics.valuePerCorrection.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Média Diária
              </p>
              <p className="text-xl font-black">{metrics.dailyAverage}</p>
            </div>
          </div>
        </div>

        <EssaysPeriodModal teacherId={teacherId} essays={essays} totalPages={totalPages} />
      </div>

      <div className="flex h-full flex-col justify-center p-6 md:p-8">
        <div className="mb-8 flex items-start justify-between">
          <h3 className="mt-1 text-[11px] font-black tracking-widest text-slate-500 uppercase">
            Resumo de Faturamento
          </h3>
          {hasEssays && !isPaid && (
            <span className="rounded-full bg-[#fef3c7] px-3 py-1.5 text-[10px] font-black tracking-wider text-[#b45309] uppercase">
              Pendente
            </span>
          )}

          {!hasEssays && (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
              Sem Movimento
            </span>
          )}
        </div>

        <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500">
              {isPaid ? "Total Pago" : "Total a Pagar"}
            </span>
            {isPaid && (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black tracking-wider text-emerald-600 uppercase">
                Pago
              </span>
            )}
          </div>
          <span className={`text-4xl font-black ${uiState.text}`}>
            {formatDecimalCurrency(metrics.totalAmount)}
          </span>
        </div>

        <div className={`mb-8 h-2.5 w-full rounded-full ${uiState.bar}`} />

        {metrics.totalEssays > 0 && (
          <PaymentActions
            teacherId={teacherId}
            month={safeMonth}
            metrics={metrics}
            accounts={accounts}
          />
        )}
      </div>
    </div>
  );
}
