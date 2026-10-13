import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";
import { EssayGrid } from "@/components/essays/essay-grid";
import { EssayFiltersBar } from "@/components/essays/essay-filters-bar";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { parseEssaysFilters } from "@/utils/parse-filters";
import { PageHeader } from "@repo/ui/components/page-header";
import { NewEssayTopicPicker } from "@/components/topics/new-essay-topic-picker";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minhas Redações",
};

export default async function MyEssaysPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const filters = parseEssaysFilters(resolvedParams);
  const page = Number(resolvedParams?.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);

  return (
    <div className="min-h-dvh px-4 py-4 md:px-10 lg:px-12">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <PageHeader
          title="Minha redações"
          subtitle="Acompanhe seu progresso e evolução na escrita."
          className="w-full"
        >
          <NewEssayTopicPicker>
            <Button className="h-12 w-full rounded-3xl font-bold shadow-lg shadow-yellow-400/20 sm:w-auto">
              <Plus className="size-5" />
              Enviar nova redação
            </Button>
          </NewEssayTopicPicker>
        </PageHeader>
      </div>

      <EssayFiltersBar />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="mt-6 min-h-[250px] rounded-3xl bg-slate-200" />}
      >
        <EssayGrid filters={filters} page={page} />
      </Suspense>
    </div>
  );
}
