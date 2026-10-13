import { getEssaysByStatus } from "@/app/actions/essays";
import { Avatar } from "@repo/ui/components/avatar";
import { EmptyState } from "@repo/ui/components/empty-state";
import { DEADLINE_STATUS_STYLES } from "@repo/ui/components/features/constants";
import { getDeadlineStatus } from "@repo/utils";
import { FileCheck } from "lucide-react";
import { StartEssayCorrectionButton } from "./start-essay-correction-button";

export async function NextEssays() {
  const { essays } = await getEssaysByStatus({ status: ["pending", "correcting"], limit: 3 });

  if (essays.length === 0) {
    return (
      <EmptyState
        icon={FileCheck}
        title="Fila de correções em dia"
        description="Todas as redações recebidas já foram avaliadas. Novos textos aparecerão aqui assim que forem enviados pelos alunos."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {essays.map((essay) => {
        const deadline = getDeadlineStatus(essay.due_date, essay.essay_remaining_business_seconds);
        const style =
          DEADLINE_STATUS_STYLES[deadline.status as keyof typeof DEADLINE_STATUS_STYLES];

        return (
          <div
            key={essay.id}
            className={`flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md`}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="flex min-w-0 gap-2">
                <Avatar
                  src={essay.avatar_url}
                  name={essay.student_name}
                  className="size-10 rounded-full"
                />

                <div className="flex flex-col items-start gap-1 overflow-hidden">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${style.badgeBg} ${style.badgeText} whitespace-nowrap`}
                  >
                    {deadline.label}
                  </span>
                  <h4
                    className="w-full truncate text-sm leading-tight font-bold"
                    title={essay.student_name}
                  >
                    {essay.student_name}
                  </h4>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {deadline.status !== "expired" && (
                  <span className="mb-0.5 block text-[10px] font-medium text-slate-400">
                    {deadline.text === "1h" ? "Resta" : "Restam"}
                  </span>
                )}

                <span className={`text-2xl leading-none font-bold ${style.timeText}`}>
                  {deadline.text}
                </span>
              </div>
            </div>

            <div className="mb-6 flex-1">
              <p className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Tema da Redação
              </p>
              <p className="line-clamp-3 text-sm leading-relaxed font-medium text-slate-700">
                {essay.title}
              </p>
            </div>

            <StartEssayCorrectionButton
              essayId={essay.id}
              isPending={essay.status === "pending"}
              reviewStatus={essay.correction_review_status}
            />
          </div>
        );
      })}
    </div>
  );
}
