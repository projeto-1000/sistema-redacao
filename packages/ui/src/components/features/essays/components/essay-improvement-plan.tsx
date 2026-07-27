import {
  ListChecks,
  PenLine,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";

interface EssayImprovementPlanProps {
  mainBottleneck: string | null;
  nextEssayPriorities: string[];
  rewriteTasks: string[];
}

interface ImprovementSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

function ImprovementSection({
  title,
  icon,
  children,
}: ImprovementSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          {icon}
        </div>

        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

export default function EssayImprovementPlan({
  mainBottleneck,
  nextEssayPriorities,
  rewriteTasks,
}: EssayImprovementPlanProps) {
  const normalizedMainBottleneck =
    mainBottleneck?.trim() ?? "";

  const normalizedPriorities =
    nextEssayPriorities
      .map((priority) => priority.trim())
      .filter(Boolean);

  const normalizedRewriteTasks =
    rewriteTasks
      .map((task) => task.trim())
      .filter(Boolean);

  const hasImprovementPlan =
    normalizedMainBottleneck.length > 0 ||
    normalizedPriorities.length > 0 ||
    normalizedRewriteTasks.length > 0;

  if (!hasImprovementPlan) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Orientações do corretor
        </span>

        <h2 className="mt-2 text-lg font-black text-slate-900">
          Plano de melhoria
        </h2>

        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Pontos para revisar e aplicar nas próximas redações.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {normalizedMainBottleneck && (
          <div className="pb-5">
            <ImprovementSection
              title="Principal gargalo"
              icon={<Target className="size-4" />}
            >
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {normalizedMainBottleneck}
                </p>
              </div>
            </ImprovementSection>
          </div>
        )}

        {normalizedPriorities.length > 0 && (
          <div className="py-5">
            <ImprovementSection
              title="Prioridades para a próxima redação"
              icon={<ListChecks className="size-4" />}
            >
              <ol className="space-y-2">
                {normalizedPriorities.map(
                  (priority, index) => (
                    <li
                      key={`${priority}-${index}`}
                      className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-amber-700 shadow-sm">
                        {index + 1}
                      </span>

                      <p className="min-w-0 break-words text-sm leading-relaxed text-slate-700">
                        {priority}
                      </p>
                    </li>
                  )
                )}
              </ol>
            </ImprovementSection>
          </div>
        )}

        {normalizedRewriteTasks.length > 0 && (
          <div className="pt-5">
            <ImprovementSection
              title="Tarefas de reescrita"
              icon={<PenLine className="size-4" />}
            >
              <ol className="space-y-2">
                {normalizedRewriteTasks.map(
                  (task, index) => (
                    <li
                      key={`${task}-${index}`}
                      className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-amber-700 shadow-sm">
                        {index + 1}
                      </span>

                      <p className="min-w-0 break-words text-sm leading-relaxed text-slate-700">
                        {task}
                      </p>
                    </li>
                  )
                )}
              </ol>
            </ImprovementSection>
          </div>
        )}
      </div>
    </div>
  );
}