import type { Metadata } from "next";
import { PageHeader } from "@repo/ui/components/page-header";
import { PaymentDashboardNav, type TeacherPaymentsTab } from "@repo/ui/components/features/teacher-payments/payment-dashboard-nav";
import { PaymentOverview } from "@repo/ui/components/features/teacher-payments/payment-overview";
import { PaymentHistory } from "@repo/ui/components/features/teacher-payments/payment-history";
import { TablePagination } from "@repo/ui/components/table-pagination";
import { getTeacherPaymentDashboard } from "@/app/actions/payments";
import { PaymentMonthFilter } from "@/components/payment-month-filter";
import { TeacherPaymentAccountsManager } from "@/components/teacher-payment-accounts-manager";

export const metadata: Metadata = { title: "Gerenciar pagamentos" };

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}-01T12:00:00Z`),
  );
}

function parseTab(value?: string): TeacherPaymentsTab {
  return value === "accounts" || value === "history" ? value : "overview";
}

export default async function TeacherPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string; page?: string }>;
}) {
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonth();
  const activeTab = parseTab(params.tab);
  const page = Number(params.page) || 1;
  const data = await getTeacherPaymentDashboard(month, page);
  const monthLabel = formatMonth(month);
  const baseHref = `/pagamentos?month=${month}`;

  return (
    <div className="min-h-dvh space-y-6 px-4 py-4 md:px-10 lg:px-12">
      <PageHeader title="Gerenciar pagamentos" subtitle="Acompanhe seus ganhos, repasses e dados de recebimento." />
      <PaymentDashboardNav activeTab={activeTab} baseHref={baseHref} />
      {activeTab === "overview" && <PaymentMonthFilter />}

      {activeTab === "overview" && (
        <PaymentOverview
          metrics={data.metrics}
          monthLabel={monthLabel}
          account={data.accounts.find((account) => account.is_default) ?? data.accounts[0] ?? null}
          accountsHref={`${baseHref}&tab=accounts`}
          historyHref={`${baseHref}&tab=history`}
        />
      )}

      {activeTab === "accounts" && <TeacherPaymentAccountsManager accounts={data.accounts} />}

      {activeTab === "history" && (
        <div className="space-y-5">
          <PaymentHistory payments={data.payments} />
          {data.totalPages > 1 && <TablePagination totalPages={data.totalPages} />}
        </div>
      )}
    </div>
  );
}
