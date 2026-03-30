import { Plus } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { TeachersTable } from "@/components/teachers-table";
import { getTeachers } from "@/app/action/get-teachers-data";

export default async function TeachersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const filters = {
    search: typeof resolvedParams?.search === 'string' ? resolvedParams.search : undefined,
    status: typeof resolvedParams?.status === 'string' ? resolvedParams.status : undefined,
  }

  const page = Number(resolvedParams?.page) || 1;

  const perPage = 10

  const { data: teachers, totalPages } = await getTeachers(filters, page, perPage);


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

      <TeachersTable
        teachers={teachers}
        totalPages={totalPages}
      />
    </div>
  );
}