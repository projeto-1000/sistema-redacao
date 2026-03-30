import { Plus } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { TeachersTable } from "@/components/teachers-table";
import { TeachersTableFilters } from "@/components/teachers-table-filter";

export default async function TeachersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const currentPage = Number(resolvedSearchParams.page) || 1;
  const searchQuery = (resolvedSearchParams.search as string) || "";
  const statusFilter = (resolvedSearchParams.status as string) || "";

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">
            Gestão de Professores
          </h2>
          <p className="text-slate-500">
            Gerencie o acesso e desempenho da sua equipe docente.
          </p>
        </div>

        <Button asChild variant='secondary' className="font-bold rounded-xl h-10 shadow-sm w-full sm:w-auto">
          <Link href='/'>
            <Plus className="size-4 mr-2" />
            Adicionar Novo Professor
          </Link>
        </Button>
      </div>

      <TeachersTableFilters />

      <TeachersTable
        currentPage={currentPage}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
      />
    </div>
  );
}