"use client";

interface CorrectionSummaryFieldsProps {
  mainBottleneck: string;
  onMainBottleneckChange: (value: string) => void;

  nextEssayPriorities: string[];
  onNextEssayPrioritiesChange: (value: string[]) => void;

  rewriteTasks: string[];
  onRewriteTasksChange: (value: string[]) => void;
}

const textareaClassName =
  "w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-400/50";

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-400/50";

export function CorrectionSummaryFields({
  mainBottleneck,
  onMainBottleneckChange,
  nextEssayPriorities,
  onNextEssayPrioritiesChange,
  rewriteTasks,
  onRewriteTasksChange,
}: CorrectionSummaryFieldsProps) {
  const updatePriority = (index: number, value: string) => {
    const updatedPriorities = [...nextEssayPriorities];

    updatedPriorities[index] = value;

    onNextEssayPrioritiesChange(updatedPriorities);
  };

  const updateRewriteTask = (index: number, value: string) => {
    const updatedTasks = [...rewriteTasks];

    updatedTasks[index] = value;

    onRewriteTasksChange(updatedTasks);
  };

  const addRewriteTask = () => {
    if (rewriteTasks.length >= 3) {
      return;
    }

    onRewriteTasksChange([...rewriteTasks, ""]);
  };

  const removeRewriteTask = (index: number) => {
    if (rewriteTasks.length <= 1) {
      return;
    }

    onRewriteTasksChange(
      rewriteTasks.filter((_, taskIndex) => taskIndex !== index)
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 font-bold text-slate-900">
          Principal gargalo
        </h3>

        <p className="mb-4 text-sm text-slate-500">
          Descreva brevemente o principal problema identificado na redação.
        </p>

        <textarea
          value={mainBottleneck}
          onChange={(event) =>
            onMainBottleneckChange(event.target.value)
          }
          placeholder="Ex.: O principal problema está na falta de aprofundamento dos argumentos."
          className={`${textareaClassName} h-28`}
          maxLength={500}
        />

        <p className="mt-2 text-right text-xs text-slate-400">
          {mainBottleneck.length}/500
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 font-bold text-slate-900">
          Prioridades para a próxima redação
        </h3>

        <p className="mb-4 text-sm text-slate-500">
          Adicione três pontos que o aluno deve priorizar para melhorar.
        </p>

        <div className="flex flex-col gap-3">
          {nextEssayPriorities.map((priority, index) => (
            <div
              key={index}
              className="flex items-center gap-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                {index + 1}
              </span>

              <input
                type="text"
                value={priority}
                onChange={(event) =>
                  updatePriority(index, event.target.value)
                }
                placeholder={`Prioridade ${index + 1}`}
                className={inputClassName}
                maxLength={250}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 font-bold text-slate-900">
          Tarefas de reescrita desta redação
        </h3>

        <p className="mb-4 text-sm text-slate-500">
          Proponha de uma a três tarefas práticas para o aluno treinar.
        </p>

        <div className="flex flex-col gap-3">
          {rewriteTasks.map((task, index) => (
            <div
              key={index}
              className="flex items-center gap-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                {index + 1}
              </span>

              <input
                type="text"
                value={task}
                onChange={(event) =>
                  updateRewriteTask(index, event.target.value)
                }
                placeholder={`Tarefa de reescrita ${index + 1}`}
                className={inputClassName}
                maxLength={250}
              />

              {rewriteTasks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRewriteTask(index)}
                  className="shrink-0 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remover tarefa ${index + 1}`}
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>

        {rewriteTasks.length < 3 && (
          <button
            type="button"
            onClick={addRewriteTask}
            className="mt-4 text-sm font-semibold text-amber-700 transition-colors hover:text-amber-800"
          >
            + Adicionar tarefa
          </button>
        )}
      </section>
    </div>
  );
}