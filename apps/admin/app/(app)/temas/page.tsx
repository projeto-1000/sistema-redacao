import { Plus } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { PageHeader } from "@repo/ui/components/page-header";
import TopicsGrid from "@/components/features/topics/topics-grid";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import TopicFiltersBar from "@/components/features/topics/topics-filter-bar";
import { parseTopicsFilters } from "@/utils/parse-filters";

export default async function ThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const filters = parseTopicsFilters(resolvedParams)
  const page = Number(resolvedParams?.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);

  return (
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 py-4 space-y-8">

      <PageHeader
        title="Catálogo de Temas"
        subtitle="Gestão dos temas cadastrados na plataforma"
      >
        <Button asChild className="rounded-xl font-bold h-10 w-full sm:w-fit">
          <Link href="/temas/novo-tema">
            <Plus className="size-4 mr-2" />
            Adicionar Tema
          </Link>
        </Button>
      </PageHeader>

      <TopicFiltersBar />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
      >
        <TopicsGrid filters={filters} page={page} />
      </Suspense>
    </div>
  );
}