import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTeacherById, getTeacherChartsData, getTeacherEssays } from "@/app/actions/teachers";
import { notFound } from "next/navigation";
import TeacherProfileHeader from "@/components/teacher-profile-header";
import TeacherStatsCards from "@/components/teacher-stats-cards";
import ScoreDistributionChart from "@/components/score-distribution-chart";
import AverageTimeCard from "@/components/average-time-card";
import TeacherEssayHistoryTable from "@/components/teacher-essay-history-table";

export default async function TeacherProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const teacherId = resolvedParams.id;

  const teacher = await getTeacherById(teacherId);
  const chartsData = await getTeacherChartsData(resolvedParams.id);

  const currentPage = Number(resolvedSearchParams.page) || 1;
  const perPage = 5

  const { essays, totalPages } = await getTeacherEssays(teacherId, currentPage, perPage)

  if (!teacher) {
    notFound();
  }

  const teacherData = {
    name: teacher.full_name,
    id: teacher.id,
    status: teacher.status,
    registrationDate: new Date(teacher.created_at).toLocaleDateString("pt-BR"),
    email: teacher.email,
    avatarUrl: teacher.avatar_url || null,
  }

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-y-8">

      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <Link href="/professores" className="hover:text-secondary transition-colors">
          Gestão de Professores
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-seconday">
          Histórico Detalhado
        </span>
      </div>

      <TeacherProfileHeader teacher={teacherData} />

      <TeacherStatsCards teacherId={teacherId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreDistributionChart data={chartsData || []} />

        <AverageTimeCard teacherId={teacherId} />
      </div>

      <TeacherEssayHistoryTable essays={essays} totalPages={totalPages} />

    </div>
  );
}