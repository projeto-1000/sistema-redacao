import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTeacherById, getTeacherChartsData } from "@/app/actions/teachers";
import { notFound } from "next/navigation";
import TeacherProfileHeader from "@/components/teacher-profile-header";
import TeacherStatsCards from "@/components/teacher-stats-cards";
import ScoreDistributionChart from "@/components/score-distribution-chart";
import AverageTimeCard from "@/components/average-time-card";
import TeacherEssayTable from "@/components/teacher-essay-table";
import { ModalWrapper } from "@repo/ui/components/modal-wrapper";
import { GradedEssayView } from "@/components/graded-essay-view";
import { parseTeacherEssaysFilters } from "@/utils/parse-filters";
import { Button } from "@repo/ui/components/button";

export default async function TeacherProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const filters = parseTeacherEssaysFilters(resolvedSearchParams);

  const teacherId = resolvedParams.id;

  const teacher = await getTeacherById(teacherId);

  if (!teacher) {
    notFound();
  }
  const teacherData = {
    teacherId: teacherId,
    teacherName: teacher.full_name,
  };

  const chartsData = await getTeacherChartsData(teacherId);

  const essayId = resolvedSearchParams?.essayId as string | undefined;

  return (
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 pb-8 space-y-8">
      <Button asChild variant='ghost' className="text-slate-500">
        <Link href="/alunos">
          <ArrowLeft className="size-4 mr-2" />
          Voltar para lista de professores
        </Link>
      </Button>

      <TeacherProfileHeader teacher={teacher} />

      <TeacherStatsCards teacherId={teacherId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreDistributionChart data={chartsData} />

        <AverageTimeCard teacherId={teacherId} />
      </div>

      <TeacherEssayTable filters={filters} teacherData={teacherData} page={page} />

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