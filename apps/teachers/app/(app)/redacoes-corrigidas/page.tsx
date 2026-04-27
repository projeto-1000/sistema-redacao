import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { GradedEssayFiltersBar } from "@/components/graded-essays-filters-bar";
import GradedEssaysGrid from "@/components/graded-essays-grid";
import { parseGradedEssaysFilters } from "@/utils/parse-filters";

export default async function FinishedEssaysPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);
  const filters = parseGradedEssaysFilters(resolvedParams);

  // const initialData = await getGradedEssays();

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-y-4">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          Redações Corrigidas
        </h2>
        <p className="text-[#8B8265]">
          Acompanhe o histórico de correções já realizadas.
        </p>
      </div>

      <GradedEssayFiltersBar />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
      >
      </Suspense>

      <GradedEssaysGrid filters={filters} page={page} />
    </div>
  );
}