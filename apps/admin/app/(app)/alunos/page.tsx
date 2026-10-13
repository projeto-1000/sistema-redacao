import { exportStudentsCsvAction } from "@/app/actions/export-students-csv";
import { getStudentPlanFilterOptions, getStudentsCount } from "@/app/actions/students";
import { StudentsTable } from "@/components/students-table";
import { StudentsNavigationProvider } from "@/components/students-navigation-provider";
import StudentsFilterBar from "@/components/students-filter-bar";
import { parseStudentsFilters } from "@/utils/parse-filters";
import { PageHeader } from "@repo/ui/components/page-header";
import { Plus } from "lucide-react";
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
  const filters = parseStudentsFilters(resolvedParams);
  const sortParam = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "created_at";

  const sort: "created_at" | "full_name" | "status" =
    sortParam === "full_name" || sortParam === "status" ? sortParam : "created_at";

  const order: "asc" | "desc" = resolvedParams.order === "asc" ? "asc" : "desc";

  const [totalCount, planFilterOptions] = await Promise.all([
    getStudentsCount(),
    getStudentPlanFilterOptions(),
  ]);

  return (
    <div className="min-h-dvh space-y-8 px-4 py-4 md:px-10 lg:px-12">
      <PageHeader
        title=" Gerenciamento de Alunos"
        subtitle={
          <>
            Base de dados central:{" "}
            <span className="text-primary font-bold">{totalCount} alunos</span> cadastrados
          </>
        }
      >
        <ExportCsvButton
          action={exportStudentsCsvAction}
          payload={filters}
          fileName="alunos_admin"
          className="w-full sm:w-fit"
          variant="outline"
        />

        <Button asChild className="h-10 w-full rounded-xl font-bold sm:w-fit">
          <Link href="/alunos/novo">
            <Plus className="mr-2 size-4" />
            Novo Aluno
          </Link>
        </Button>
      </PageHeader>

      <StudentsNavigationProvider>
        <StudentsFilterBar planOptions={planFilterOptions} />

        <StudentsTable filters={filters} page={page} sort={sort} order={order} />
      </StudentsNavigationProvider>
    </div>
  );
}
