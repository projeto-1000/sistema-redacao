import { PendingEssayFiltersBar } from "@/components/pending-essays-filters-bar";
import PendingEssaysTable from "@/components/pending-essays-table";
import { parsePendingEssaysFilters } from "@/utils/parse-filters";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";

export default async function PendingEssaysPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const filters = parsePendingEssaysFilters(resolvedParams);

  const page = Number(resolvedParams?.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);

  return (
    <div className="min-h-dvh px-2 md:px-10 lg:px-12 py-4 space-y-4">
      <PageHeader
        variant="admin"
        title="Redações Pendentes"
        subtitle="Lista de redações enviadas e prontas para serem corrigidas."
      />

      <PendingEssayFiltersBar />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
      >
        <PendingEssaysTable filters={filters} page={page} />
      </Suspense>
    </div>
  )
}