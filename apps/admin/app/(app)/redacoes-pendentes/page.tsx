import { getPendingCorrectionReviews } from "@/app/actions/correction-reviews";
import CorrectionReviewQueue from "@/components/correction-review-queue";
import { PendingEssayFiltersBar } from "@/components/pending-essays-filters-bar";
import PendingEssaysTable from "@/components/pending-essays-table";
import { parsePendingEssaysFilters } from "@/utils/parse-filters";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import Link from "next/link";
import { Suspense } from "react";

export default async function PendingEssaysPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const resolvedParams = await searchParams;

  const activeTab =
    resolvedParams.tab === "revisoes" ? "revisoes" : "pendentes";

  const page = Number(resolvedParams.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);

  const filters = parsePendingEssaysFilters(resolvedParams);

  const reviewResult = await getPendingCorrectionReviews({
    page: activeTab === "revisoes" ? page : 1,
  });

  return (
    <div className="min-h-dvh space-y-4 px-2 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Redações Pendentes"
        subtitle="Gerencie as redações disponíveis para correção e as correções aguardando revisão."
      />

      <div className="flex gap-2 border-b border-slate-200">
        <Link
          href="/redacoes-pendentes"
          className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === "pendentes"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          Redações pendentes
        </Link>

        <Link
          href="/redacoes-pendentes?tab=revisoes"
          className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === "revisoes"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          Aguardando revisão ({reviewResult.totalCount})
        </Link>
      </div>

      {activeTab === "pendentes" ? (
        <>
          <PendingEssayFiltersBar />

          <Suspense
            key={suspenseKey}
            fallback={
              <Skeleton className="mt-6 min-h-[250px] rounded-3xl bg-slate-200" />
            }
          >
            <PendingEssaysTable filters={filters} page={page} />
          </Suspense>
        </>
      ) : (
        <CorrectionReviewQueue result={reviewResult} />
      )}
    </div>
  );
}