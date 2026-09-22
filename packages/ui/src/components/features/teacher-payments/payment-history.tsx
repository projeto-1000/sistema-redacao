import { FileText } from "lucide-react";
import type { TeacherPaymentHistoryItem } from "@repo/types";
import { formatDecimalCurrency, formatDate } from "@repo/utils";
import { Button } from "@repo/ui/components/button";

interface PaymentHistoryProps {
  payments: TeacherPaymentHistoryItem[];
  headerAction?: React.ReactNode;
}

const statusStyles = {
  paid: { label: "Pago", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Pendente", className: "bg-amber-50 text-amber-700" },
  processing: { label: "Processando", className: "bg-blue-50 text-blue-700" },
  cancelled: { label: "Cancelado", className: "bg-slate-100 text-slate-600" },
  refunded: { label: "Estornado", className: "bg-red-50 text-red-700" },
};

export function PaymentHistory({ payments, headerAction }: PaymentHistoryProps) {
  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Histórico de pagamentos</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Consulte os repasses externos registrados pela equipe.
          </p>
        </div>
        {headerAction}
      </div>

      <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 px-4 py-4 lg:grid">
        <HeaderCell className="col-span-2">Data</HeaderCell>
        <HeaderCell className="col-span-3">Período</HeaderCell>
        <HeaderCell className="col-span-2 text-center">Redações</HeaderCell>
        <HeaderCell className="col-span-2 text-right">Valor</HeaderCell>
        <HeaderCell className="col-span-1 text-center">Status</HeaderCell>
        <HeaderCell className="col-span-2 text-right">Comprovante</HeaderCell>
      </div>

      <div className="divide-y divide-slate-100">
        {payments.length === 0 ? (
          <div className="py-14 text-center text-sm font-medium text-slate-500">
            Nenhum pagamento registrado.
          </div>
        ) : (
          payments.map((payment) => {
            const status = statusStyles[payment.status];
            const period = new Intl.DateTimeFormat("pt-BR", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(`${payment.billing_month}T12:00:00Z`));

            return (
              <div key={payment.id} className="grid grid-cols-1 gap-4 py-5 lg:grid-cols-12 lg:px-4">
                <DataCell label="Data" className="lg:col-span-2">
                  {payment.processed_at ? formatDate(payment.processed_at, "numeric") : "—"}
                </DataCell>
                <DataCell label="Período" className="capitalize lg:col-span-3">
                  {period}
                </DataCell>
                <DataCell label="Redações" className="lg:col-span-2 lg:text-center">
                  {payment.essays_count}
                </DataCell>
                <DataCell label="Valor" className="font-black lg:col-span-2 lg:text-right">
                  {formatDecimalCurrency(payment.total_amount)}
                </DataCell>
                <div className="flex items-center justify-between lg:col-span-1 lg:justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 lg:hidden">Status</span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between lg:col-span-2 lg:justify-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 lg:hidden">Comprovante</span>
                  {payment.receipt_url ? (
                    <Button asChild variant="ghost" className="rounded-xl font-bold text-blue-600 hover:bg-blue-50">
                      <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="size-4" /> Ver comprovante
                      </a>
                    </Button>
                  ) : (
                    <span className="text-sm font-medium text-slate-400">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function HeaderCell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`text-[10px] font-black uppercase tracking-widest text-slate-400 ${className}`}>{children}</div>;
}

function DataCell({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between text-sm font-bold text-slate-700 lg:block ${className}`}>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 lg:hidden">{label}</span>
      <span>{children}</span>
    </div>
  );
}
