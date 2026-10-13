import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import GradedEssaysGrid from "@/components/graded-essays-grid";
import { parseGradedEssaysFilters } from "@/utils/parse-filters";
import { PageHeader } from "@repo/ui/components/page-header";
import { GradedEssayFiltersBar } from "@/components/graded-essays-filters-bar";

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
    <div className="min-h-dvh space-y-4 px-2 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Redações Corrigidas"
        subtitle="Acompanhe seu histórico de correções já realizadas."
      />

      <GradedEssayFiltersBar />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="mt-6 min-h-[250px] rounded-3xl bg-slate-200" />}
      >
        <GradedEssaysGrid filters={filters} page={page} />
      </Suspense>
    </div>
  );
}
