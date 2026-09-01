import { getEssaysByStatus } from "@/app/actions/essays";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { DEADLINE_STATUS_STYLES } from "@repo/ui/components/features/constants";
import { getDeadlineStatus } from "@repo/utils";
import { ArrowRight, FileCheck, Hourglass } from "lucide-react";
import Link from "next/link";

export async function NextEssays() {
  const { essays } = await getEssaysByStatus({ status: ['pending', 'correcting'], limit: 3 });

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {essays.map((essay) => {
        const deadline = getDeadlineStatus(
          essay.due_date,
          essay.essay_remaining_business_seconds
        );
        const style = DEADLINE_STATUS_STYLES[deadline.status as keyof typeof DEADLINE_STATUS_STYLES];

        return (
          <div
            key={essay.id}
            className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start mb-4 gap-2">
              <div className="flex gap-2 min-w-0">

                <Avatar src={essay.avatar_url} name={essay.student_name} className="size-10 rounded-full" />

                <div className="flex flex-col items-start gap-1 overflow-hidden">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${style.badgeBg} ${style.badgeText} whitespace-nowrap`}>
                    {deadline.label}
                  </span>
                  <h4 className="font-bold text-sm leading-tight truncate w-full" title={essay.student_name}>
                    {essay.student_name}
                  </h4>
                </div>
              </div>

              <div className="text-right shrink-0">
                {deadline.status !== "expired" && (
                  <span className="text-[10px] font-medium text-slate-400 block mb-0.5">
                    {deadline.text === '1h' ? 'Resta' : 'Restam'}
                  </span>
                )}

                <span className={`text-2xl font-bold leading-none ${style.timeText}`}>
                  {deadline.text}
                </span>
              </div>
            </div>

            <div className="mb-6 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Tema da Redação
              </p>
              <p className="text-slate-700 font-medium text-sm leading-relaxed line-clamp-3">
                {essay.title}
              </p>
            </div>

            <Button asChild
              variant={essay.status === 'pending' ? 'dark' : 'secondary'}
              className="font-bold h-10 rounded-full text-sm">
              <Link href={`/corrigir-redacao/${essay.id}`}>
                {essay.status === 'pending' ? (
                  <>
                    Corrigir Agora <ArrowRight className="size-4" />
                  </>
                ) : (
                  <>
                    Terminar correção <Hourglass className="size-4" />
                  </>
                )}
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
