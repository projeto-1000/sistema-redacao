"use client";

import type {
  CorrectionCompetencyId,
  CorrectionHighlight,
  CorrectionPayload,
  CorrectionReviewHistoryRound,
} from "@repo/types";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  History,
  MessageSquareText,
  RotateCcw,
  Send,
} from "lucide-react";
import EssayContent from "./essay-content";
import EssayImprovementPlan from "./essay-improvement-plan";
import { EssayHighlightNavigationProvider } from "./essay-highlight-navigation";
import { EssayCompetencies, EssayScoreCard } from "./essay-sidebar";

type ReviewHistoryView = "original" | "published" | "changes";

interface CorrectionReviewHistoryProps {
  audience: "admin" | "teacher";
  essayText: string;
  publishedPayload: CorrectionPayload;
  rounds: CorrectionReviewHistoryRound[];
}

const COMPETENCY_LABELS: Record<CorrectionCompetencyId, string> = {
  c1: "C1: Linguagem",
  c2: "C2: Tema e Repertórios",
  c3: "C3: Argumentação",
  c4: "C4: Coesão",
  c5: "C5: Proposta de Intervenção",
};

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function getTotalScore(payload: CorrectionPayload) {
  return Object.values(payload.scores).reduce(
    (total, score) => total + score,
    0,
  );
}

function getBestScores(payload: CorrectionPayload) {
  return Object.entries(payload.scores)
    .filter(([, score]) => score === 200)
    .map(([competency]) => competency);
}

function CorrectionPayloadView({
  essayText,
  payload,
}: {
  essayText: string;
  payload: CorrectionPayload;
}) {
  return (
    <EssayHighlightNavigationProvider>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <EssayContent
            text={essayText}
            highlights={payload.highlights}
            generalComment={payload.general_comment}
            bestScores={getBestScores(payload)}
          />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <EssayScoreCard totalScore={getTotalScore(payload)} />
          <EssayCompetencies
            scores={payload.scores}
            comments={payload.comments}
            highlights={payload.highlights}
          />
          <EssayImprovementPlan
            mainBottleneck={payload.main_bottleneck}
            nextEssayPriorities={payload.next_essay_priorities}
            rewriteTasks={payload.rewrite_tasks}
          />
        </div>
      </div>
    </EssayHighlightNavigationProvider>
  );
}

interface HighlightChange {
  kind: "added" | "removed" | "changed";
  before?: CorrectionHighlight;
  after?: CorrectionHighlight;
}

interface ReviewTimelineEvent {
  id: string;
  type:
  | "submitted"
  | "returned_to_teacher"
  | "approved"
  | "approved_with_changes";
  createdAt: string;
  feedback: string | null;
  adminName: string | null;
}

function getReviewTimeline(
  rounds: CorrectionReviewHistoryRound[],
): ReviewTimelineEvent[] {
  return rounds
    .flatMap((round, index) => {
      const submissionEvent: ReviewTimelineEvent = {
        id: `${round.id}-${index > 0 ? "resubmitted" : "submitted"}`,
        type: "submitted",
        createdAt: round.submittedAt,
        feedback: null,
        adminName: null,
      };
      const events: ReviewTimelineEvent[] = [submissionEvent];

      if (round.action) {
        events.push({
          id: `${round.id}-${round.action.action}`,
          type: round.action.action,
          createdAt: round.action.createdAt,
          feedback: round.action.feedback,
          adminName: round.action.adminName,
        });
      }

      return events;
    })
    .sort(
      (firstEvent, secondEvent) =>
        new Date(firstEvent.createdAt).getTime() -
        new Date(secondEvent.createdAt).getTime(),
    );
}

function getHighlightChanges(
  originalHighlights: CorrectionHighlight[],
  publishedHighlights: CorrectionHighlight[],
): HighlightChange[] {
  const originalById = new Map(
    originalHighlights.map((highlight) => [highlight.id, highlight]),
  );
  const publishedById = new Map(
    publishedHighlights.map((highlight) => [highlight.id, highlight]),
  );
  const changes: HighlightChange[] = [];

  originalHighlights.forEach((before) => {
    const after = publishedById.get(before.id);

    if (!after) {
      changes.push({ kind: "removed", before });
      return;
    }

    if (
      before.text !== after.text ||
      before.compId !== after.compId ||
      before.comment !== after.comment ||
      before.startIndex !== after.startIndex ||
      before.endIndex !== after.endIndex
    ) {
      changes.push({ kind: "changed", before, after });
    }
  });

  publishedHighlights.forEach((after) => {
    if (!originalById.has(after.id)) {
      changes.push({ kind: "added", after });
    }
  });

  return changes;
}

function VersionValue({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 p-4 first:border-b first:border-slate-100 md:first:border-r md:first:border-b-0">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </div>
  );
}

function ChangeCard({
  title,
  before,
  after,
  badge = "Alterado",
}: {
  title: string;
  before: React.ReactNode;
  after: React.ReactNode;
  badge?: string;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h4 className="font-bold text-slate-800">{title}</h4>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
          {badge}
        </span>
      </div>
      <div className="grid md:grid-cols-2">
        <VersionValue label="Enviada pelo professor">{before}</VersionValue>
        <VersionValue label="Publicada para o aluno">{after}</VersionValue>
      </div>
    </article>
  );
}

function HighlightChangeCard({ change }: { change: HighlightChange }) {
  const highlight = change.after ?? change.before;

  if (!highlight) return null;

  const badge =
    change.kind === "added"
      ? "Adicionado"
      : change.kind === "removed"
        ? "Removido"
        : "Alterado";

  const emptyLabel =
    change.kind === "added"
      ? "Este trecho não estava destacado."
      : "O destaque não aparece na versão publicada.";

  const renderHighlight = (value?: CorrectionHighlight) =>
    value ? (
      <div className="space-y-3">
        <blockquote className="rounded-2xl bg-slate-50 p-3 font-semibold text-slate-700">
          “{value.text}”
        </blockquote>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
            {COMPETENCY_LABELS[value.compId]}
          </p>
          <p className="mt-1">{value.comment}</p>
        </div>
      </div>
    ) : (
      <span className="text-slate-500">{emptyLabel}</span>
    );

  return (
    <ChangeCard
      title={`Destaque em “${highlight.text}”`}
      before={renderHighlight(change.before)}
      after={renderHighlight(change.after)}
      badge={badge}
    />
  );
}

function CorrectionChanges({
  audience,
  original,
  published,
  rounds,
}: {
  audience: "admin" | "teacher";
  original: CorrectionPayload;
  published: CorrectionPayload;
  rounds: CorrectionReviewHistoryRound[];
}) {
  const competencyIds = Object.keys(
    original.scores,
  ) as CorrectionCompetencyId[];
  const scoreChanges = competencyIds.filter(
    (competency) =>
      original.scores[competency] !== published.scores[competency],
  );
  const commentChanges = competencyIds.filter(
    (competency) =>
      original.comments[competency] !== published.comments[competency],
  );
  const highlightChanges = getHighlightChanges(
    original.highlights,
    published.highlights,
  );
  const timeline = getReviewTimeline(rounds);

  const hasChanges =
    scoreChanges.length > 0 ||
    commentChanges.length > 0 ||
    original.general_comment !== published.general_comment ||
    original.main_bottleneck !== published.main_bottleneck ||
    JSON.stringify(original.next_essay_priorities) !==
    JSON.stringify(published.next_essay_priorities) ||
    JSON.stringify(original.rewrite_tasks) !==
    JSON.stringify(published.rewrite_tasks) ||
    highlightChanges.length > 0;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-5">
      <section className="space-y-4 lg:col-span-3">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Ajustes realizados na revisão
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {audience === "teacher"
              ? "Compare sua correção com a versão final disponibilizada ao aluno."
              : "Compare a correção enviada pelo professor com a versão final disponibilizada ao aluno."}
          </p>
        </div>

        {!hasChanges && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <p className="font-bold">Aprovada sem alterações</p>
            <p className="mt-1 text-sm">
              A correção do professor foi publicada como enviada.
            </p>
          </div>
        )}

        {scoreChanges.map((competency) => (
          <ChangeCard
            key={`score-${competency}`}
            title={`Nota — ${COMPETENCY_LABELS[competency]}`}
            before={`${original.scores[competency]} pontos`}
            after={`${published.scores[competency]} pontos`}
          />
        ))}

        {commentChanges.map((competency) => (
          <ChangeCard
            key={`comment-${competency}`}
            title={`Comentário — ${COMPETENCY_LABELS[competency]}`}
            before={original.comments[competency]}
            after={published.comments[competency]}
          />
        ))}

        {original.general_comment !== published.general_comment && (
          <ChangeCard
            title="Comentário geral"
            before={original.general_comment}
            after={published.general_comment}
          />
        )}

        {original.main_bottleneck !== published.main_bottleneck && (
          <ChangeCard
            title="Principal gargalo"
            before={original.main_bottleneck}
            after={published.main_bottleneck}
          />
        )}

        {JSON.stringify(original.next_essay_priorities) !==
          JSON.stringify(published.next_essay_priorities) && (
            <ChangeCard
              title="Prioridades para a próxima redação"
              before={original.next_essay_priorities.join("\n")}
              after={published.next_essay_priorities.join("\n")}
            />
          )}

        {JSON.stringify(original.rewrite_tasks) !==
          JSON.stringify(published.rewrite_tasks) && (
            <ChangeCard
              title="Tarefas de reescrita"
              before={original.rewrite_tasks.join("\n")}
              after={published.rewrite_tasks.join("\n")}
            />
          )}

        {highlightChanges.map((change, index) => (
          <HighlightChangeCard
            key={`${change.kind}-${change.after?.id ?? change.before?.id ?? index}`}
            change={change}
          />
        ))}
      </section>

      <aside className="space-y-4 lg:col-span-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <History className="size-5 text-indigo-600" />
            Histórico da revisão
          </h3>
          <div className="mt-6">
            {timeline.map((event, index) => {
              const isLastEvent = index === timeline.length - 1;
              const isReturned = event.type === "returned_to_teacher";
              const isSubmission = event.type === "submitted";
              const previousEvent = timeline[index - 1];
              const isResubmission =
                isSubmission && previousEvent?.type === "returned_to_teacher";

              const title = isSubmission
                ? isResubmission
                  ? "Nova correção enviada"
                  : "Correção enviada para revisão"
                : isReturned
                  ? "Correção devolvida para ajustes"
                  : event.type === "approved_with_changes"
                    ? "Aprovada com alterações"
                    : "Correção aprovada";

              return (
                <div
                  key={event.id}
                  className="relative flex gap-3 pb-6 last:pb-0"
                >
                  {!isLastEvent && (
                    <span className="absolute bottom-0 left-4 top-8 w-px bg-slate-200" />
                  )}

                  <span
                    className={`relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border ${isReturned
                      ? "border-slate-200 bg-slate-100 text-slate-500"
                      : "border-indigo-100 bg-indigo-50 text-indigo-600"
                      }`}
                  >
                    {isSubmission ? (
                      <Send className="size-3.5" />
                    ) : isReturned ? (
                      <RotateCcw className="size-4" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-bold text-slate-800">{title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Clock3 className="size-3" />
                      {formatReviewDate(event.createdAt)}
                    </p>

                    {audience === "admin" && event.adminName && (
                      <p className="mt-1 text-xs text-slate-500">
                        Por {event.adminName}
                      </p>
                    )}

                    {isReturned && event.feedback && (
                      <div className="mt-3 rounded-r-xl border-l-2 border-indigo-300 bg-slate-50 px-3 py-3">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <MessageSquareText className="size-3.5 text-indigo-500" />
                          Detalhes da devolução
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                          {event.feedback}
                        </p>
                      </div>
                    )}

                    {(event.type === "approved" ||
                      event.type === "approved_with_changes") && (
                        <p className="mt-1.5 text-xs text-slate-500">
                          Versão final publicada para o aluno.
                        </p>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function CorrectionReviewHistory({
  audience,
  essayText,
  publishedPayload,
  rounds,
}: CorrectionReviewHistoryProps) {
  const approvedRound = useMemo(
    () =>
      [...rounds]
        .reverse()
        .find(
          (round) =>
            round.status === "approved" ||
            round.status === "approved_with_changes",
        ),
    [rounds],
  );
  const [view, setView] = useState<ReviewHistoryView>("published");

  if (!approvedRound) {
    return (
      <CorrectionPayloadView essayText={essayText} payload={publishedPayload} />
    );
  }

  const originalLabel =
    audience === "teacher" ? "Minha correção" : "Versão do professor";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 font-bold text-slate-900">
            <History className="size-5 text-indigo-600" />
            Histórico desta correção
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Consulte cada versão e acompanhe as decisões da revisão.
          </p>
        </div>

        <div className="flex w-full overflow-x-auto rounded-2xl bg-slate-100 p-1 md:w-auto">
          <button
            type="button"
            onClick={() => setView("original")}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${view === "original"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {originalLabel}
          </button>
          <button
            type="button"
            onClick={() => setView("published")}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${view === "published"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Versão do aluno
          </button>
          <button
            type="button"
            onClick={() => setView("changes")}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${view === "changes"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Alterações
          </button>
        </div>
      </div>

      {view === "original" && (
        <CorrectionPayloadView
          essayText={essayText}
          payload={approvedRound.payload}
        />
      )}
      {view === "published" && (
        <CorrectionPayloadView
          essayText={essayText}
          payload={publishedPayload}
        />
      )}
      {view === "changes" && (
        <CorrectionChanges
          audience={audience}
          original={approvedRound.payload}
          published={publishedPayload}
          rounds={rounds}
        />
      )}
    </div>
  );
}
