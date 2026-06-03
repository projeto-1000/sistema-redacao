import { AlertTriangle, FileText } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { format, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";;
import { formatCurrency, formatDate } from "@repo/utils";
import { ExportCsvButton } from "@/components/export-csv-button";
import { exportTeacherPaymentsCsv, getTeacherPaymentHistory } from "@/app/actions/teacher-payments";
import { TablePagination } from "@repo/ui/components/table-pagination";

interface PaymentHistoryTableProps {
  teacherId: string
  page: number
}

export async function PaymentHistoryTable({ teacherId, page }: PaymentHistoryTableProps) {

  const { payments, totalPages, error } = await getTeacherPaymentHistory(teacherId, page)

  const formatPeriod = (isoDate: string) => {
    const start = parseISO(isoDate);
    const end = endOfMonth(start);
    const startStr = format(start, "dd MMM", { locale: ptBR });
    const endStr = format(end, "dd MMM", { locale: ptBR });
    return `${startStr} - ${endStr}`.replace(/\./g, '');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return { label: 'Pago', color: 'bg-emerald-50 text-emerald-600' };
      case 'pending': return { label: 'Pendente', color: 'bg-amber-50 text-amber-600' };
      default: return { label: 'Processando', color: 'bg-blue-50 text-blue-600' };
    }
  };

  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-4xl p-6 md:p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="size-8" />
        </div>
        <h3 className="text-xl font-black mb-2">
          Não foi possível carregar o histórico
        </h3>
        <p className="text-sm font-medium text-slate-500 max-w-md text-center mb-6">
          Ocorreu um erro ao buscar os pagamentos deste professor. Por favor, tente novamente em instantes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-black">Histórico de Pagamentos</h2>
        <ExportCsvButton
          action={exportTeacherPaymentsCsv}
          payload={{ teacherId }}
          fileName="Historico_Pagamentos"
        />

      </div>

      <div className="w-full">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4 border-b border-slate-100">
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Pagamento</div>
          <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Período de Referência</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd. Redações</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Total</div>
          <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Comprovante</div>
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
                <div key={row.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-5 lg:px-4 items-center hover:bg-slate-50/50 transition-colors group">

                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                    <span className="text-sm font-bold capitalize">{formatDate(row.processed_at, 'numeric')}</span>
                  </div>

                  <div className="col-span-1 lg:col-span-3 flex justify-between lg:block">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Período</span>
                    <span className="text-sm font-medium text-slate-500 capitalize">{formatPeriod(row.billing_month)}</span>
                  </div>

                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd. Redações</span>
                    <span className="text-sm font-bold">{row.essays_count}</span>
                  </div>

                  <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-end items-center">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</span>
                    <span className="text-sm font-black">{formatCurrency(row.total_amount)}</span>
                  </div>

                  <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
                    <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle.color}`}>
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="col-span-1 lg:col-span-2 flex justify-end mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0">
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
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2">-</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <TablePagination totalPages={totalPages} />
        )}
      </div>
    </div>
  );
}