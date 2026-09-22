import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { notFound } from "next/navigation";
import { PageHeader } from "@repo/ui/components/page-header";
import { PaymentDashboardNav, type TeacherPaymentsTab } from "@repo/ui/components/features/teacher-payments/payment-dashboard-nav";
import { PaymentOverview } from "@repo/ui/components/features/teacher-payments/payment-overview";
import { PaymentAccountsList } from "@repo/ui/components/features/teacher-payments/payment-accounts-list";
import { PaymentHistory } from "@repo/ui/components/features/teacher-payments/payment-history";
import { getTeacherById } from "@/app/actions/teachers";
import { getPaymentAccounts } from "@/app/actions/payment-accounts";
import { getEssaysByPeriod, getPaymentMetrics, getTeacherPaymentHistory, exportTeacherPaymentsCsv } from "@/app/actions/teacher-payments";
import { ManageAccountsModal } from "@/components/features/teacher-payments/manage-accounts-modal";
import { PaymentFilters } from "@/components/features/teacher-payments/payment-filters";
import { PaymentActions } from "@/components/features/teacher-payments/payment-actions";
import { EssaysPeriodModal } from "@/components/features/teacher-payments/essays-period-modal";
import { ExportCsvButton } from "@/components/export-csv-button";
import { TablePagination } from "@repo/ui/components/table-pagination";
import { GradedEssayView } from "@/components/graded-essay-view";
import { ModalWrapper } from "@repo/ui/components/modal-wrapper";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TeacherPaymentsProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; page?: string; essayId?: string; tab?: string }>;
}

function parseTab(value?: string): TeacherPaymentsTab {
  return value === "accounts" || value === "history" ? value : "overview";
}

export default async function TeacherPaymentsPage({ params, searchParams }: TeacherPaymentsProps) {
  const { id: teacherId } = await params;
  const { month, page, essayId, tab } = await searchParams;
  const activeTab = parseTab(tab);
  const safeMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : format(new Date(), "yyyy-MM");
  const pageNumber = Number(page) || 1;
  const baseHref = `/professores/${teacherId}/pagamentos?month=${safeMonth}`;

  const [teacher, accounts] = await Promise.all([
    getTeacherById(teacherId),
    getPaymentAccounts(teacherId),
  ]);

  if (!teacher) notFound();

  const refDate = parseISO(`${safeMonth}-01`);
  const monthLabel = format(refDate, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-dvh space-y-6 px-4 pb-8 md:px-10 lg:px-12">
      <Button asChild variant="ghost" className="text-slate-500">
        <Link href={`/professores/${teacherId}`}><ArrowLeft className="size-4" /> Voltar para o professor</Link>
      </Button>

      <PageHeader
        title="Gerenciar pagamentos"
        subtitle={`Acompanhe ganhos, repasses e contas de ${teacher.full_name}.`}
      />

      <PaymentDashboardNav activeTab={activeTab} baseHref={baseHref} />
      {activeTab === "overview" && <PaymentFilters />}

      {activeTab === "overview" && (
        <AdminOverview
          teacherId={teacherId}
          month={safeMonth}
          monthLabel={monthLabel}
          baseHref={baseHref}
          accounts={accounts}
          from={startOfMonth(refDate).toISOString()}
          to={endOfMonth(refDate).toISOString()}
        />
      )}

      {activeTab === "accounts" && (
        <PaymentAccountsList
          accounts={accounts}
          createAction={<ManageAccountsModal teacherId={teacherId} accounts={accounts} />}
        />
      )}

      {activeTab === "history" && <AdminHistory teacherId={teacherId} page={pageNumber} />}

      {essayId && (
        <ModalWrapper param="essayId" title="Visualizar Redação">
          <GradedEssayView essayId={essayId} />
        </ModalWrapper>
      )}
    </div>
  );
}

async function AdminOverview({
  teacherId, month, monthLabel, baseHref, accounts, from, to,
}: {
  teacherId: string;
  month: string;
  monthLabel: string;
  baseHref: string;
  accounts: Awaited<ReturnType<typeof getPaymentAccounts>>;
  from: string;
  to: string;
}) {
  const [metrics, essayResult] = await Promise.all([
    getPaymentMetrics(teacherId, month),
    getEssaysByPeriod({ teacherId, start: from, end: to }),
  ]);

  return (
    <PaymentOverview
      metrics={metrics}
      monthLabel={monthLabel}
      account={accounts.find((account) => account.is_default) ?? accounts[0] ?? null}
      accountsHref={`${baseHref}&tab=accounts`}
      historyHref={`${baseHref}&tab=history`}
      essaysAction={<EssaysPeriodModal teacherId={teacherId} essays={essayResult.essays} totalPages={essayResult.totalPages} />}
      adminAction={metrics.totalEssays > 0 ? <PaymentActions teacherId={teacherId} month={month} metrics={metrics} accounts={accounts} /> : undefined}
    />
  );
}

async function AdminHistory({ teacherId, page }: { teacherId: string; page: number }) {
  const result = await getTeacherPaymentHistory(teacherId, page);

  if (result.error) {
    return <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center font-medium text-red-700">Não foi possível carregar o histórico.</div>;
  }

  return (
    <div className="space-y-5">
      <PaymentHistory
        payments={result.payments}
        headerAction={<ExportCsvButton action={exportTeacherPaymentsCsv} payload={{ teacherId }} fileName="Historico_Pagamentos" />}
      />
      {result.totalPages > 1 && <TablePagination totalPages={result.totalPages} />}
    </div>
  );
}
