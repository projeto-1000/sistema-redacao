import { TopicFiltersBar } from "@/components/topics/topic-filters-bar";
import { TopicsTable } from "@/components/topics/topics-table";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { NextSearchParams, parseTopicsFilters } from "@/utils/parse-filters";

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<NextSearchParams>;
}) {
  const resolvedParams = await searchParams;
  const filters = parseTopicsFilters(resolvedParams);
  const page = Number(resolvedParams?.page) || 1;

  const suspenseKey = JSON.stringify(resolvedParams);

  return (
    <div className="space-y-8 min-h-dvh px-2 md:px-10 lg:px-12 py-4">

      <div className="space-y-8">
        <TopicFiltersBar />

        <Suspense
          key={suspenseKey}
          fallback={<Skeleton className="rounded-4xl min-h-[400px] w-full bg-slate-200 mt-8" />}
        >
          <TopicsTable filters={filters} page={page} />
        </Suspense>
      </div>
    </div>
  );
}