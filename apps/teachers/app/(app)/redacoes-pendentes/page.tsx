import { formatDate, getDeadlineStatus } from "@repo/utils";
import { PendingEssaysClient } from "./page-client";
import { getEssaysByStatus } from "@/app/actions/essays";
import { parsePendingEssaysFilters } from "@/utils/parse-filters";
import { PendingEssayFiltersBar } from "@/components/pending-essays-filters-bar";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import PendingEssaysGrid from "@/components/pending-essays-grid";

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
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4 space-y-4">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          Redações Pendentes
        </h2>
        <p className="text-[#8B8265]">
          Lista de redações enviadas e prontas para serem corrigidas.
        </p>
      </div>

      <PendingEssayFiltersBar />
      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
      >
        <PendingEssaysGrid filters={filters} page={page} />
      </Suspense>
    </div>
  );
}