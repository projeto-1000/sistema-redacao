import { Plus } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { TeachersTable } from "@/components/teachers-table";
import { PageHeader } from "@repo/ui/components/page-header";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { parseTeachersFilters } from "@/utils/parse-filters";
import TeachersFilterBar from "@/components/teachers-filter-bar";

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
        variant="secondary"
        title="Gestão de Professores"
        subtitle="Gerencie o acesso e desempenho da sua equipe docente."
      >
        <Button asChild variant='secondary' className="font-bold rounded-xl h-10 shadow-sm w-full sm:w-auto">
          <Link href='/'>
            <Plus className="size-4 mr-2" />
            Adicionar Novo Professor
          </Link>
        </Button>
      </PageHeader>

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