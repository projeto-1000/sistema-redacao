import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Download,
  ChevronLeft,
  ArrowLeft
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { notFound } from "next/navigation";
import { UserProfileHeader } from "@/components/user-profile-header";
import { PaymentFilters } from "@/components/features/teacher-payments/payment-filters";
import { PaymentSummary } from "@/components/features/teacher-payments/payment-summary";
import { getPaymentMetrics } from "@/app/actions/teacher-payments";
import { getTeacherById } from "@/app/actions/teachers";

// Mocks baseados no Figma
const paymentHistory = [
  { id: 1, date: "10 Out, 2023", period: "01 Set - 30 Set", qty: 245, total: "R$ 2.450,00", status: "Pago", statusColor: "bg-emerald-50 text-emerald-600", hasReceipt: true },
  { id: 2, date: "12 Set, 2023", period: "01 Ago - 31 Ago", qty: 198, total: "R$ 1.980,00", status: "Pago", statusColor: "bg-emerald-50 text-emerald-600", hasReceipt: true },
  { id: 3, date: "-", period: "01 Out - 09 Out", qty: 187, total: "R$ 1.870,00", status: "Pendente", statusColor: "bg-amber-50 text-amber-600", hasReceipt: false },
];
interface TeacherPaymentsProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}

export default async function TeacherPaymentsPage({ params, searchParams }: TeacherPaymentsProps) {
  const { id: teacherId } = await params;
  const { month } = await searchParams;

  const [teacher, metrics] = await Promise.all([
    getTeacherById(teacherId),
    getPaymentMetrics(teacherId, month),
  ]);

  if (!teacher) {
    notFound();
  }

  return (
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 pb-8 space-y-8">

      <Button asChild variant='ghost' className="text-slate-500">
        <Link href={``}>
          <ArrowLeft className="size-4 mr-2" />
          Voltar para lista de professores
        </Link>
      </Button>

      <UserProfileHeader
        user={teacher}
        disableAction={true}
      />

      <PaymentFilters />

      <PaymentSummary
        metrics={metrics}
        teacherId={teacherId}
      />


      {/* =========================================
            TABELA: HISTÓRICO DE PAGAMENTOS
        ========================================= */}
      <div className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm overflow-hidden">

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-900">Histórico de Pagamentos</h2>
          <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold px-4 h-10">
            <Download className="size-4 mr-2" /> Exportar CSV
          </Button>
        </div>

        <div className="w-full">
          {/* Header da Tabela */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4 border-b border-slate-100">
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Pagamento</div>
            <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Período de Referência</div>
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd. Redações</div>
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Total</div>
            <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</div>
            <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Comprovante</div>
          </div>

          {/* Corpo da Tabela */}
          <div className="divide-y divide-slate-100">
            {paymentHistory.map((row) => (
              <div key={row.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 py-5 lg:px-4 items-center hover:bg-slate-50/50 transition-colors group">

                {/* Data */}
                <div className="col-span-1 lg:col-span-2 flex justify-between lg:block">
                  <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                  <span className="text-sm font-bold text-slate-900">{row.date}</span>
                </div>

                {/* Período */}
                <div className="col-span-1 lg:col-span-3 flex justify-between lg:block">
                  <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Período</span>
                  <span className="text-sm font-medium text-slate-500">{row.period}</span>
                </div>

                {/* Qtd Redações */}
                <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-center items-center">
                  <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd. Redações</span>
                  <span className="text-sm font-bold text-slate-900">{row.qty}</span>
                </div>

                {/* Valor Total */}
                <div className="col-span-1 lg:col-span-2 flex justify-between lg:justify-end items-center">
                  <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</span>
                  <span className="text-sm font-black text-slate-900">{row.total}</span>
                </div>

                {/* Status */}
                <div className="col-span-1 lg:col-span-1 flex justify-between lg:justify-center items-center">
                  <span className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.statusColor}`}>
                    {row.status}
                  </span>
                </div>

                {/* Comprovante */}
                <div className="col-span-1 lg:col-span-2 flex justify-end mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                  {row.hasReceipt ? (
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" title="Ver Comprovante">
                      <FileText className="size-5" />
                    </Button>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2">Aguardando</span>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Paginação */}
          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Mostrando 3 de 24 pagamentos</span>
            <div className="flex items-center gap-1">
              <button className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                <ChevronLeft className="size-4" />
              </button>
              <button className="size-8 flex items-center justify-center rounded-full bg-slate-900 text-white font-bold shadow-sm">
                1
              </button>
              <button className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}