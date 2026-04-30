import { exportStudentsCsvAction } from "@/app/actions/export-students-csv";
import { getStudentsCount } from "@/app/actions/students";
import { StudentsTable, } from "@/components/students-table";
import StudentsFilterBar from "@/components/students-filter-bar";
import { parseStudentsFilters } from "@/utils/parse-filters";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { ExportCsvButton } from "@/components/export-csv-button";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";


export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);
  const filters = parseStudentsFilters(resolvedParams);

  const totalCount = await getStudentsCount()

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-y-8">

      <PageHeader
        title=" Gerenciamento de Alunos"
        variant="secondary"
        subtitle={
          <>
            Base de dados central: <span className="font-bold text-secondary">{totalCount} alunos</span> cadastrados
          </>
        }
      >
        <ExportCsvButton
          action={exportStudentsCsvAction}
          payload={filters}
          fileName="alunos_admin"
          className="w-full sm:w-fit"
        />

        <Button asChild className="rounded-xl font-bold h-10 w-full sm:w-fit" variant="secondary">
          <Link href="/alunos/novo">
            <Plus className="size-4 mr-2" />
            Novo Aluno
          </Link>
        </Button>
      </PageHeader>

      <StudentsFilterBar />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
      >
        <StudentsTable filters={filters} page={page} />
      </Suspense>
    </div>
  );
}