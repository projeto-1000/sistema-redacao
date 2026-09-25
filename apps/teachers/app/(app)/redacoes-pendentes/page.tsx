import { getPendingTeacherCorrectionReviews } from "@/app/actions/essays";
import { parsePendingEssaysFilters } from "@/utils/parse-filters";
import { PendingEssayFiltersBar } from "@/components/pending-essays-filters-bar";
import PendingCorrectionReviewsGrid from "@/components/pending-correction-reviews-grid";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import PendingEssaysGrid from "@/components/pending-essays-grid";
import { PageHeader } from "@repo/ui/components/page-header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Redações Pendentes",
};

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
  const reviewQueueResult = await getPendingTeacherCorrectionReviews({ page });

  return (
    <div className="min-h-dvh px-2 md:px-10 lg:px-12 py-4 space-y-4">
      <PageHeader
        title="Redações Pendentes"
        subtitle="Acompanhe suas filas de correção e de revisão administrativa."
      />

      <nav
        role="tablist"
        aria-label="Filas de redações do professor"
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
            fallback={
              <Skeleton className="mt-6 min-h-[250px] rounded-3xl bg-slate-200" />
            }
          >
            <PendingEssaysGrid filters={filters} page={page} />
          </Suspense>
        </>
      ) : (
        <PendingCorrectionReviewsGrid result={reviewQueueResult} />
      )}
    </div>
  );
}
