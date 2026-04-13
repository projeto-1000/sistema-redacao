import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";
import { EssayGrid } from "@/components/essay-grid";
import { EssayFiltersBar } from "@/components/essay-filters-bar";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { parseEssaysFilters } from "@/utils/parse-filters";

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
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">
            Minhas Redações
          </h2>
          <p className="text-[#8B8265]">
            Acompanhe seu progresso e evolução na escrita.
          </p>
        </div>

        <Button asChild
          className="rounded-3xl h-12 w-full sm:w-auto  shadow-lg shadow-yellow-400/20 font-bold">
          <Link href="/temas">
            <Plus className="size-5" />
            Enviar nova redação
          </Link>
        </Button>
      </div>

      <EssayFiltersBar />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
      >
        <EssayGrid filters={filters} page={page} />
      </Suspense>
    </div>
  );
}