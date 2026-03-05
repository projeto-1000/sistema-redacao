import EssayQueue from "@/components/essay-queue";
import EssayVolumeChart from "@/components/essay-volume-chart";
import GeneralMetrics from "@/components/general-metrics";
import QuickServices from "@/components/quick-services";

export default function HomePage() {
  return (
    <div className="space-y-8 px-4 md:px-10 lg:px-12 py-4">
      <QuickServices />

      <GeneralMetrics />

      <EssayVolumeChart />

      <EssayQueue />
    </div>
  )
}