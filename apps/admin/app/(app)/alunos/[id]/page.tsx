import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStudentById, getStudentCreditsHistory } from "@/app/actions/students";
import { notFound } from "next/navigation";
import { StudentProfileHeader } from "@/components/features/students/student-profile-header";
import { StudentStatsCards } from "@/components/features/students/student-stats-cards";
import { StudentEssaysTable } from "@/components/features/students/student-essays-table";
import { Button } from "@repo/ui/components/button";
import { parseStudentEssaysFilters } from "@/utils/parse-filters";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ModalWrapper } from "@repo/ui/components/modal-wrapper";
import { GradedEssayView } from "@/components/graded-essay-view";
import StudentSubscriptionCard from "@/components/student-subscription-card";
import CreditTransactionsTable from "@repo/ui/components/features/credit-history/credits-transactions-table";

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const studentId = resolvedParams.id;
  const page = Number(resolvedSearchParams?.page) || 1;

  const suspenseKey = JSON.stringify(resolvedParams);

  const filters = parseStudentEssaysFilters(resolvedSearchParams);

  const { student, error, hasSubscriptionError, hasCreditsError } = await getStudentById(studentId);

  const creditTransactionsData = await getStudentCreditsHistory({ studentId })


  if (!student || error) {
    notFound();
  }
  const essayId = resolvedSearchParams?.essayId as string | undefined;

  const subscriptionCardContent = (
    <StudentSubscriptionCard
      subscription={student.subscription}
      credits={student.credits}
      hasSubscriptionError={hasSubscriptionError}
      hasCreditsError={hasCreditsError}
    />
  );

  return (
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 pb-8 space-y-8">

      <Button asChild variant='ghost' className="text-slate-500">
        <Link href="/alunos">
          <ArrowLeft className="size-4 mr-2" />
          Voltar para lista de alunos
        </Link>
      </Button>


      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-auto bg-slate-200 mt-6" />}
      >
        <StudentProfileHeader student={student} subscriptionCard={subscriptionCardContent} />
      </Suspense>

      <StudentStatsCards studentId={student.id} />

      <StudentEssaysTable
        studentId={studentId}
        filters={filters}
        page={page}
      />

      <CreditTransactionsTable data={creditTransactionsData} />

      {essayId && (
        <ModalWrapper
          key={essayId}
          param="essayId"
          title="Visualizar Redação"
        >
          <GradedEssayView essayId={essayId} />
        </ModalWrapper>
      )}
    </div>
  );
}