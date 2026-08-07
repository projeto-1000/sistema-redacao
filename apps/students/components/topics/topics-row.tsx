import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { Button } from "@repo/ui/components/button";
import { NotebookPen } from "lucide-react";
import { EssayTopic } from "@repo/types";
import Link from "next/link";
import { TopicDetailsDialog } from "@repo/ui/components/topic-details-dialog"
import { getTopicDetails } from "@/app/actions/get-topics";

interface TopicsRowProps {
  topic: EssayTopic
}

export default function TopicsRow({ topic }: TopicsRowProps) {
  return (
    <div
      key={topic.id}
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 md:px-8 py-5 items-center hover:bg-slate-50 transition-colors group"
    >
      <div className="lg:col-span-5 xl:col-span-6">
        <h4 className="font-bold leading-snug group-hover:text-[#1E3A8A] transition-colors wrap-break-word">
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

        <div className="lg:hidden mt-3">
          <ThemeBadge
            className="inline-flex px-3 py-1 text-[10px] font-bold uppercase rounded-full border"
            value={topic.axis}
          />
        </div>
      </div>

      <div className="hidden lg:flex lg:col-span-3 justify-center px-2">
        <ThemeBadge
          className="w-full max-w-40 md:max-w-30 lg:max-w-40 px-2 py-1.5 text-[10px] font-bold uppercase rounded-full border tracking-wide h-auto whitespace-normal text-center flex items-center justify-center min-h-7 leading-tight"
          value={topic.axis}
        />
      </div>

      <div className="lg:col-span-4 xl:col-span-3 flex flex-row gap-2 justify-between md:justify-end mt-4 lg:mt-0">
        <TopicDetailsDialog topic={topic} getTopicDetailsAction={getTopicDetails} />

        <Button
          asChild
          className="rounded-2xl text-xs font-bold bg-primary shadow-sm min-h-10 whitespace-nowrap  w-1/2 md:w-fit shrink-0"
        >
          <Link href={`/minhas-redacoes/nova-redacao?id=${topic.id}`}>
            Iniciar Redação
            <NotebookPen className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>

  )
}