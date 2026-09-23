import { TeachersTable } from "@/components/teachers-table";
import { CreateTeacherDialog } from "@/components/create-teacher-dialog";
import { PageHeader } from "@repo/ui/components/page-header";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { parseTeachersFilters } from "@/utils/parse-filters";
import TeachersFilterBar from "@/components/teachers-filter-bar";
import { TeacherManagementTabs } from "@/components/teacher-management-tabs";
import { createTeacherInvitation } from "@/app/actions/create-teacher-invitation";

export default async function TeachersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);
  const filters = parseTeachersFilters(resolvedParams);

  return (
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 py-4 space-y-8">

      <PageHeader
        title="Gestão de Professores"
        subtitle="Gerencie o acesso e desempenho da sua equipe docente."
      >
        <CreateTeacherDialog onCreate={createTeacherInvitation} />
      </PageHeader>

      <TeacherManagementTabs active="teachers" />

      <TeachersFilterBar />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
      >

        <TeachersTable
          filters={filters}
          page={page}
        />
      </Suspense >
    </div>
  );
}
