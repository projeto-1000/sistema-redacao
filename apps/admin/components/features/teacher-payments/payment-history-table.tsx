import { AlertTriangle, FileText } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { format, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDecimalCurrency, formatDate } from "@repo/utils";
import { ExportCsvButton } from "@/components/export-csv-button";
import { exportTeacherPaymentsCsv, getTeacherPaymentHistory } from "@/app/actions/teacher-payments";
import { TablePagination } from "@repo/ui/components/table-pagination";

interface PaymentHistoryTableProps {
  teacherId: string;
  page: number;
}

export async function PaymentHistoryTable({ teacherId, page }: PaymentHistoryTableProps) {
  const { payments, totalPages, error } = await getTeacherPaymentHistory(teacherId, page);

  const formatPeriod = (isoDate: string) => {
    const start = parseISO(isoDate);
    const end = endOfMonth(start);
    const startStr = format(start, "dd MMM", { locale: ptBR });
    const endStr = format(end, "dd MMM", { locale: ptBR });
    return `${startStr} - ${endStr}`.replace(/\./g, "");
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return { label: "Pago", color: "bg-emerald-50 text-emerald-600" };
      case "pending":
        return { label: "Pendente", color: "bg-amber-50 text-amber-600" };
      default:
        return { label: "Processando", color: "bg-blue-50 text-blue-600" };
    }
  };

  if (error) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center rounded-4xl border border-red-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="size-8" />
        </div>
        <h3 className="mb-2 text-xl font-black">Não foi possível carregar o histórico</h3>
        <p className="mb-6 max-w-md text-center text-sm font-medium text-slate-500">
          Ocorreu um erro ao buscar os pagamentos deste professor. Por favor, tente novamente em
          instantes.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-black">Histórico de Pagamentos</h2>
        <ExportCsvButton
          action={exportTeacherPaymentsCsv}
          payload={{ teacherId }}
          fileName="Historico_Pagamentos"
        />
      </div>

      <div className="w-full">
        <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 px-4 py-4 lg:grid">
          <div className="col-span-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Data do Pagamento
          </div>
          <div className="col-span-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Período de Referência
          </div>
          <div className="col-span-2 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Qtd. Redações
          </div>
          <div className="col-span-2 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Valor Total
          </div>
          <div className="col-span-1 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Status
          </div>
          <div className="col-span-2 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Comprovante
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {payments.length === 0 ? (
            <div className="py-8 text-center text-sm font-medium text-slate-500">
              Nenhum pagamento registrado.
            </div>
          ) : (
            payments.map((row) => {
              const statusStyle = getStatusStyle(row.status);
              return (
                <div
                  key={row.id}
                  className="group grid grid-cols-1 items-center gap-4 py-5 transition-colors hover:bg-slate-50/50 lg:grid-cols-12 lg:px-4"
                >
                  <div className="col-span-1 flex justify-between lg:col-span-2 lg:block">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase lg:hidden">
                      Data
                    </span>
                    <span className="text-sm font-bold capitalize">
                      {formatDate(row.processed_at, "numeric")}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-between lg:col-span-3 lg:block">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase lg:hidden">
                      Período
                    </span>
                    <span className="text-sm font-medium text-slate-500 capitalize">
                      {formatPeriod(row.billing_month)}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center justify-between lg:col-span-2 lg:justify-center">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase lg:hidden">
                      Qtd. Redações
                    </span>
                    <span className="text-sm font-bold">{row.essays_count}</span>
                  </div>

                  <div className="col-span-1 flex items-center justify-between lg:col-span-2 lg:justify-end">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase lg:hidden">
                      Valor Total
                    </span>
                    <span className="text-sm font-black">
                      {formatDecimalCurrency(row.total_amount)}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center justify-between lg:col-span-1 lg:justify-center">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase lg:hidden">
                      Status
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${statusStyle.color}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="col-span-1 mt-2 flex justify-end border-t border-slate-100 pt-4 lg:col-span-2 lg:mt-0 lg:border-t-0 lg:pt-0">
                    {row.receipt_url ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:bg-blue-50"
                        title="Ver Comprovante"
                      >
                        <a href={row.receipt_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="size-5" />
                        </a>
                      </Button>
                    ) : (
                      <span className="py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                        -
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && <TablePagination totalPages={totalPages} />}
      </div>
    </div>
  );
}
