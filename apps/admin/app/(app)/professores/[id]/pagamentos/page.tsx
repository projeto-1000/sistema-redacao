import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { notFound } from "next/navigation";
import { UserProfileHeader } from "@/components/user-profile-header";
import { PaymentFilters } from "@/components/features/teacher-payments/payment-filters";
import { PaymentSummary } from "@/components/features/teacher-payments/payment-summary";
import { getTeacherById } from "@/app/actions/teachers";
import { getPaymentAccounts } from "@/app/actions/payment-accounts";
import { ManageAccountsModal } from "@/components/features/teacher-payments/manage-accounts-modal";
import { PaymentHistoryTable } from "@/components/features/teacher-payments/payment-history-table";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { GradedEssayView } from "@/components/graded-essay-view";
import { ModalWrapper } from "@repo/ui/components/modal-wrapper";
interface TeacherPaymentsProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string, page?: string, essayId?: string }>;
}

export default async function TeacherPaymentsPage({ params, searchParams }: TeacherPaymentsProps) {
  const { id: teacherId } = await params;

  const { month, page, essayId } = await searchParams;
  const pageNumber = Number(page) || 1;

  const suspenseKey = JSON.stringify({ month, page });

  const [teacher, accounts] = await Promise.all([
    getTeacherById(teacherId),
    getPaymentAccounts(teacherId),
  ]);

  if (!teacher) {
    notFound();
  }

  return (
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 pb-8 space-y-6">
      <Button asChild variant='ghost' className="text-slate-500">
        <Link href={`/professores/${teacherId}`}>
          <ArrowLeft className="size-4 mr-2" />
          Voltar para detalhes do professor
        </Link>
      </Button>

      <UserProfileHeader
        user={teacher}
        disableAction={true}
        footer={
          <div className=" bg-slate-100 p-4">
            <ManageAccountsModal teacherId={teacherId} accounts={accounts} />
          </div>
        }
      />

      <PaymentFilters />

      <Suspense
        key={`summary-${suspenseKey}`}
        fallback={<Skeleton className="rounded-4xl bg-slate-200 min-h-[220px]" />}>
        <PaymentSummary
          teacherId={teacherId}
          month={month}
        />
      </Suspense>

      <Suspense
        key={`history-${suspenseKey}`}
        fallback={<Skeleton className="rounded-4xl bg-slate-200 min-h-[260px]" />}>
        <PaymentHistoryTable
          teacherId={teacherId}
          page={pageNumber}
        />
      </Suspense>

      {essayId && (
        <ModalWrapper param="essayId" title="Visualizar Redação">
          <GradedEssayView essayId={essayId} />
        </ModalWrapper>
      )}
    </div>
  );
}