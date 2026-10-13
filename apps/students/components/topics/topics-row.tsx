import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { Button } from "@repo/ui/components/button";
import { NotebookPen } from "lucide-react";
import { EssayTopic } from "@repo/types";
import Link from "next/link";
import { TopicDetailsDialog } from "@repo/ui/components/topic-details-dialog";
import { getTopicDetails } from "@/app/actions/get-topics";

interface TopicsRowProps {
  topic: EssayTopic;
}

export default function TopicsRow({ topic }: TopicsRowProps) {
  return (
    <div
      key={topic.id}
      className="group grid grid-cols-1 items-center gap-4 px-6 py-5 transition-colors hover:bg-slate-50 md:px-8 lg:grid-cols-12"
    >
      <div className="lg:col-span-5 xl:col-span-6">
        <h4 className="leading-snug font-bold wrap-break-word transition-colors group-hover:text-[#1E3A8A]">
          {topic.title}
        </h4>

        <div className="mt-2 text-xs text-slate-500">
          {topic.source_type}

          {topic.source_type !== "AUTORAL" && topic.source_year && (
            <>
              {" • "}
              {topic.source_year}
            </>
          )}
        </div>

        <div className="mt-3 lg:hidden">
          <ThemeBadge
            className="inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase"
            value={topic.axis}
          />
        </div>
      </div>

      <div className="hidden justify-center px-2 lg:col-span-3 lg:flex">
        <ThemeBadge
          className="flex h-auto min-h-7 w-full max-w-40 items-center justify-center rounded-full border px-2 py-1.5 text-center text-[10px] leading-tight font-bold tracking-wide whitespace-normal uppercase md:max-w-30 lg:max-w-40"
          value={topic.axis}
        />
      </div>

      <div className="mt-4 flex flex-row justify-between gap-2 md:justify-end lg:col-span-4 lg:mt-0 xl:col-span-3">
        <TopicDetailsDialog topic={topic} getTopicDetailsAction={getTopicDetails} />

        <Button
          asChild
          className="bg-primary min-h-10 w-1/2 shrink-0 rounded-2xl text-xs font-bold whitespace-nowrap shadow-sm md:w-fit"
        >
          <Link href={`/minhas-redacoes/nova-redacao?id=${topic.id}`}>
            Iniciar Redação
            <NotebookPen className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
