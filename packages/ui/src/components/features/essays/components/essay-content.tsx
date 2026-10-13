"use client";

import { Award, Flag, MessageSquareText } from "lucide-react";
import { Highlight, HighlightedText } from "./highlighted-text";
import { COMPETENCY_INFO } from "../../constants";
import {
  scrollToEssayFeedbackElement,
  useEssayHighlightNavigation,
} from "./essay-highlight-navigation";
import { EssayTextStatistics } from "./essay-text-statistics";
interface EssayContentProps {
  text: string;
  highlights: Highlight[];
  generalComment: string;
  bestScores: string[];
  showEmptyBestScores?: boolean;
  showTextStatistics?: boolean;
}

type EssayTextContentProps = Pick<
  EssayContentProps,
  "text" | "highlights" | "bestScores" | "showEmptyBestScores" | "showTextStatistics"
>;

export function EssayTextContent({
  text,
  highlights,
  bestScores,
  showEmptyBestScores = false,
  showTextStatistics = false,
}: EssayTextContentProps) {
  const {
    activeHighlightId,
    isEnabled: isHighlightNavigationEnabled,
    setActiveHighlightId,
  } = useEssayHighlightNavigation();

  const handleHighlightClick = (
    _event: React.MouseEvent | React.KeyboardEvent,
    highlight: Highlight
  ) => {
    setActiveHighlightId(highlight.id);
    scrollToEssayFeedbackElement(`essay-highlight-comment-${highlight.id}`);
  };

  return (
    <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
      <div className="flex w-full flex-col gap-4 border-b border-slate-100 px-8 py-5">
        {bestScores.length > 0 || !showEmptyBestScores ? (
          <span className="flex text-[12px] font-bold tracking-widest text-slate-400 uppercase sm:whitespace-nowrap">
            <Award className="mr-1 size-4 text-amber-400" />
            Competências com Nota Máxima
          </span>
        ) : (
          <span className="flex items-center text-[12px] font-bold text-slate-500">
            <Flag className="mr-1.5 size-4 text-slate-400" />
            Nenhuma competência atingiu nota máxima nesta correção.
          </span>
        )}

        {bestScores.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {bestScores.map((scoreId) => {
              const info = COMPETENCY_INFO.find((comp) => comp.id === scoreId);
              if (!info) return null;

              const competencyName = info.title.split(":")[1]?.trim();

              return (
                <span
                  key={info.id}
                  className={`w-fit rounded-md border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${info.bg} ${info.text} ${info.border}`}
                >
                  {info.id}: {competencyName}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <HighlightedText
        text={text}
        highlights={highlights}
        activeHighlightId={activeHighlightId}
        onHighlightClick={isHighlightNavigationEnabled ? handleHighlightClick : undefined}
      />

      {showTextStatistics && <EssayTextStatistics text={text} />}
    </div>
  );
}

export function EssayGeneralComment({ generalComment }: { generalComment: string }) {
  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <MessageSquareText className="size-4" />
        </div>
        <h3 className="text-lg font-black">Comentário Geral do Corretor</h3>
      </div>
      <div className="space-y-4 leading-relaxed whitespace-pre-wrap text-slate-600">
        {generalComment}
      </div>
    </div>
  );
}

export default function EssayContent({
  text,
  highlights,
  generalComment,
  bestScores,
  showEmptyBestScores,
  showTextStatistics,
}: EssayContentProps) {
  return (
    <div className="space-y-8">
      <EssayTextContent
        text={text}
        highlights={highlights}
        bestScores={bestScores}
        showEmptyBestScores={showEmptyBestScores}
        showTextStatistics={showTextStatistics}
      />
      <EssayGeneralComment generalComment={generalComment} />
    </div>
  );
}
