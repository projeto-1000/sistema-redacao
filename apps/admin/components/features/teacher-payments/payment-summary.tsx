import { EssaysPeriodModal } from "./essays-period-modal";
import { PaymentActions } from "./payment-actions";
import { notFound } from "next/navigation";
import { getPaymentAccounts } from "@/app/actions/payment-accounts";
import { getEssaysByPeriod, getPaymentMetrics } from "@/app/actions/teacher-payments";
import { formatCurrency } from "@repo/utils";
interface PaymentSummaryProps {
  teacherId: string;
  month: string | undefined;
}

export async function PaymentSummary({ teacherId, month }: PaymentSummaryProps) {

  const [metrics, accounts] = await Promise.all([
    getPaymentMetrics(teacherId, month),
    getPaymentAccounts(teacherId)
  ]);

  const isPaid = metrics.status === "paid";
  const hasEssays = metrics.totalEssays > 0;

  const safeMonth = month || new Date().toISOString().slice(0, 7);

  function getMonthRange(m: string) {
    const parts = m.split('-');

    const year = Number(parts[0]);
    const monthIndex = Number(parts[1]);

    const fromDate = new Date(year, monthIndex - 1, 1);
    const toDate = new Date(year, monthIndex, 0);
    toDate.setHours(23, 59, 59, 999);

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString()
    };
  }

  const range = getMonthRange(safeMonth);

  const { essays, totalPages } = await getEssaysByPeriod({
    teacherId,
    start: range.from, end: range.to
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
    <div className="bg-white border border-slate-200 rounded-4xl shadow-sm grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">

      <div className="p-6 md:p-8 flex flex-col justify-between h-full">
        <div>
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Redações no Período</h3>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-black">{metrics.totalEssays}</span>
            <span className="text-sm font-medium text-slate-500">correções</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold mb-6">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500"></span> {metrics.onTime} no prazo
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-500">
              <span className="size-1.5 rounded-full bg-red-500"></span> {metrics.delayed} atrasadas
            </span>
          </div>

          <div className="h-px w-full bg-slate-100 mb-6" />

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Valor por Correção</p>
              <p className="text-xl font-black">R$ {metrics.valuePerCorrection.toFixed(2).replace(".", ",")}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Média Diária</p>
              <p className="text-xl font-black">{metrics.dailyAverage}</p>
            </div>
          </div>
        </div>

        <EssaysPeriodModal teacherId={teacherId} essays={essays} totalPages={totalPages} />
      </div>

      <div className="p-6 md:p-8 flex flex-col justify-center h-full">
        <div className="flex items-start justify-between mb-8">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">Resumo de Faturamento</h3>
          {hasEssays && !isPaid && (
            <span className="bg-[#fef3c7] text-[#b45309] text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
              Pendente
            </span>
          )}

          {!hasEssays && (
            <span className="bg-slate-100 text-slate-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
              Sem Movimento
            </span>
          )}

        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500">
              {isPaid ? "Total Pago" : "Total a Pagar"}
            </span>
            {isPaid && (
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
                Pago
              </span>
            )}
          </div>
          <span className={`text-4xl font-black ${uiState.text}`}>
            {formatCurrency(metrics.totalAmount)}
          </span>
        </div>

        <div className={`h-2.5 w-full rounded-full mb-8 ${uiState.bar}`} />

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