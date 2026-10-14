import { TopicFiltersBar } from "@/components/topics/topic-filters-bar";
import { TopicsTable } from "@/components/topics/topics-table";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { NextSearchParams, parseTopicsFilters } from "@/utils/parse-filters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temas",
};

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
    <div className="min-h-dvh space-y-8 px-2 py-4 md:px-10 lg:px-12">
      <div className="space-y-8">
        <TopicFiltersBar />

        <Suspense
          key={suspenseKey}
          fallback={<Skeleton className="mt-8 min-h-100 w-full rounded-4xl bg-slate-200" />}
        >
          <TopicsTable filters={filters} page={page} />
        </Suspense>
      </div>
    </div>
  );
}
