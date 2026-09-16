import { PendingEssayFiltersBar } from "@/components/pending-essays-filters-bar";
import PendingEssaysTable from "@/components/pending-essays-table";
import CorrectionReviewQueue from "@/components/correction-review-queue";
import { getPendingCorrectionReviews } from "@/app/actions/correction-reviews";
import { parsePendingEssaysFilters } from "@/utils/parse-filters";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";
import Link from "next/link";

export default async function PendingEssaysPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const filters = parsePendingEssaysFilters(resolvedParams);
  const tabParam = Array.isArray(resolvedParams.tab)
    ? resolvedParams.tab[0]
    : resolvedParams.tab;
  const activeTab = tabParam === "revisoes" ? "revisoes" : "pendentes";

  const page = Number(resolvedParams?.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);
  const reviewQueueResult = await getPendingCorrectionReviews({ page });

  return (
    <div className="min-h-dvh px-2 md:px-10 lg:px-12 py-4 space-y-4">
      <PageHeader
        title="Redações Pendentes"
        subtitle="Acompanhe as filas de correção e de revisão administrativa."
      />

      <nav
        role="tablist"
        aria-label="Filas administrativas de redações"
        className="flex w-fit rounded-2xl border border-slate-200 bg-slate-100 p-1"
      >
        <Link
          href="/redacoes-pendentes"
          role="tab"
          aria-selected={activeTab === "pendentes"}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === "pendentes"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Redações pendentes
        </Link>
        <Link
          href="/redacoes-pendentes?tab=revisoes"
          role="tab"
          aria-selected={activeTab === "revisoes"}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === "revisoes"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Aguardando revisão ({reviewQueueResult.totalCount})
        </Link>
      </nav>

      {activeTab === "pendentes" ? (
        <>
          <PendingEssayFiltersBar />

          <Suspense
            key={suspenseKey}
            fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
          >
            <PendingEssaysTable filters={filters} page={page} />
          </Suspense>
        </>
      ) : (
        <CorrectionReviewQueue result={reviewQueueResult} />
      )}
    </div>
  )
}
