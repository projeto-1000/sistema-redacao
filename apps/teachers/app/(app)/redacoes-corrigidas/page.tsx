import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { GradedEssayFiltersBar } from "@/components/graded-essays-filters-bar";
import GradedEssaysGrid from "@/components/graded-essays-grid";
import { parseGradedEssaysFilters } from "@/utils/parse-filters";
import { PageHeader } from "@repo/ui/components/page-header";

export default async function FinishedEssaysPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);
  const filters = parseGradedEssaysFilters(resolvedParams);

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-y-4">
      <PageHeader
        title="Redações Corrigidas"
        subtitle="Acompanhe seu histórico de correções já realizadas."
      />

      <GradedEssayFiltersBar />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
      >
        <GradedEssaysGrid filters={filters} page={page} />
      </Suspense>

    </div>
  );
}