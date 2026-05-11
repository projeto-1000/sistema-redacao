import { Button } from "@repo/ui/components/button";
import { FileText, Banknote } from "lucide-react";
import { EssaysPeriodModal } from "./essays-period-modal";
import { PaymentMetrics } from "@/types";
import { getTeacherEssays } from "@/app/actions/teachers";
import { notFound } from "next/navigation";

interface PaymentSummaryProps {
  metrics: PaymentMetrics;
  teacherId: string;
}

export async function PaymentSummary({ metrics, teacherId }: PaymentSummaryProps) {
  const isPaid = metrics.status === "paid";

  const { essays, totalPages } = await getTeacherEssays({ teacherId })

  if (!essays) {
    notFound();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-4xl shadow-sm grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">
      {/* LADO ESQUERDO: Métricas */}
      <div className="p-6 md:p-8 flex flex-col justify-between h-full">
        <div>
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Redações no Período</h3>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-black text-slate-900">{metrics.totalEssays}</span>
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
              <p className="text-xl font-black text-slate-900">R$ {metrics.valuePerCorrection.toFixed(2).replace(".", ",")}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Média Diária</p>
              <p className="text-xl font-black text-slate-900">{metrics.dailyAverage}</p>
            </div>
          </div>
        </div>

        <EssaysPeriodModal teacherId={teacherId} essays={essays} totalPages={totalPages} />
      </div>

      {/* LADO DIREITO: Faturamento */}
      <div className="p-6 md:p-8 flex flex-col justify-center h-full">
        <div className="flex items-start justify-between mb-8">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">Resumo de Faturamento</h3>
          {!isPaid && (
            <span className="bg-[#fef3c7] text-[#b45309] text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-wider">
              Pendente
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
          <span className={`text-4xl font-black ${isPaid ? 'text-slate-900' : 'text-[#C47E3A]'}`}>
            R$ {metrics.totalAmount.toFixed(2).replace(".", ",")}
          </span>
        </div>

        <div className={`h-2.5 w-full rounded-full mb-8 ${isPaid ? 'bg-emerald-500' : 'bg-[#F4C042]'}`} />

        {isPaid ? (
          <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm">
            <FileText className="size-5 mr-2" /> Ver Comprovante de Pagamento
          </Button>
        ) : (
          <Button className="w-full h-14 rounded-2xlfont-black text-sm shadow-sm">
            <Banknote className="size-5 mr-2" /> Registrar Pagamento Manual
          </Button>
        )}
      </div>
    </div>
  );
}