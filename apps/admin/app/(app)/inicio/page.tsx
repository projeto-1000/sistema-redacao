import { getWeeklyVolumeData } from "@/app/actions/get-weekly-volume-data";
import EssayVolumeChart from "@/components/essay-volume-chart";
import GeneralMetrics from "@/components/general-metrics";
import PendingEssaysTable from "@/components/pending-essays-table";
import QuickServices from "@/components/quick-services";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Suspense } from "react";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const page = Number(resolvedParams?.page) || 1;
  const suspenseKey = JSON.stringify(resolvedParams);

  const weeklyData = await getWeeklyVolumeData(0);

  return (
    <div className="space-y-8 px-4 md:px-10 lg:px-12 py-4">
      <QuickServices />

      <GeneralMetrics />

      <EssayVolumeChart initialData={weeklyData} />

      <Suspense
        key={suspenseKey}
        fallback={<Skeleton className="rounded-3xl min-h-[250px] bg-slate-200 mt-6" />}
      >
        <PendingEssaysTable showHeader={true} page={page} />
      </Suspense>

    </div>
  )
}