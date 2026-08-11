"use client";

import { ChartNoAxesColumn, MessageSquareText, Quote, Star } from "lucide-react";
import { COMPETENCY_INFO } from "../../constants";
import { EssayCompetenciesProps } from "../../types";
import type { CorrectionHighlight } from "@repo/types";
import {
  scrollToEssayFeedbackElement,
  useEssayHighlightNavigation,
} from "./essay-highlight-navigation";

export function EssayScoreCard({ totalScore }: { totalScore: number }) {
  return (
    <div className="bg-[#0F172A] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Star className="size-20" />
      </div>
      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">
        Nota total
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-extrabold text-[#EBC84C]">{totalScore}</span>
        <span className="text-xl text-slate-400 font-medium">/ 1000</span>
      </div>
    </div>
  );
}

interface EssayCompetenciesWithHighlightsProps extends EssayCompetenciesProps {
  highlights?: CorrectionHighlight[];
}

export function EssayCompetencies({
  scores,
  comments,
  highlights = [],
}: EssayCompetenciesWithHighlightsProps) {
  const {
    activeHighlightId,
    isEnabled: isHighlightNavigationEnabled,
    setActiveHighlightId,
  } = useEssayHighlightNavigation();

  const handleSpecificCommentClick = (highlight: CorrectionHighlight) => {
    if (!isHighlightNavigationEnabled) return;

    setActiveHighlightId(highlight.id);
    scrollToEssayFeedbackElement(`essay-highlight-${highlight.id}`);
  };

  return (
    <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-200">
      <h3 className="font-bold mb-6 flex items-center gap-2">
        <ChartNoAxesColumn className="size-5 text-primary" />
        Desempenho por Competência
      </h3>

      <div className="space-y-6">
        {COMPETENCY_INFO.map((comp) => {
          const score = scores[comp.id as keyof typeof scores];
          const comment = comments[comp.id as keyof typeof comments];
          const specificComments = highlights.filter(
            (highlight) =>
              highlight.compId === comp.id && highlight.comment.trim().length > 0
          );
          const isActiveCompetency = specificComments.some(
            (highlight) => highlight.id === activeHighlightId
          );

          return (
            <div
              key={comp.id}
              className={`group rounded-2xl transition-colors ${
                isActiveCompetency ? "bg-indigo-50/60 p-3 -m-3" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-sm">{comp.title}</h4>
                  <p className="text-[12px] text-slate-500 mt-0.5">{comp.desc}</p>
                </div>
                <div className={`font-black text-sm px-2 py-1 rounded-md ${comp.bg} ${comp.text}`}>
                  {score}<span className="opacity-50 font-bold">/200</span>
                </div>
              </div>
              <div className={`mt-3 border-l-3 ${comp.border} pl-4 py-1`}>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Comentário geral
                </p>
                <div className="whitespace-pre-line text-sm italic text-slate-700">
                  {comment}
                </div>
              </div>

              {specificComments.length > 0 && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <MessageSquareText className="size-4 text-indigo-500" />
                    Apontamentos no texto
                  </div>

                  {specificComments.map((highlight) => {
                    const isActive = highlight.id === activeHighlightId;

                    return (
                      <button
                        key={highlight.id}
                        id={`essay-highlight-comment-${highlight.id}`}
                        type="button"
                        onClick={() => handleSpecificCommentClick(highlight)}
                        aria-pressed={isActive}
                        className={`scroll-mt-24 w-full rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
                          isActive
                            ? "border-indigo-400 bg-indigo-50/80 shadow-md ring-2 ring-indigo-200"
                            : "border-slate-200 bg-slate-50/80 shadow-sm hover:border-indigo-200 hover:bg-white hover:shadow-md"
                        }`}
                      >
                        <div className={`border-l-2 ${comp.border} pl-3`}>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <Quote className="size-3.5" />
                            Trecho destacado
                          </div>
                          <blockquote className="mt-1 line-clamp-3 text-sm font-semibold leading-relaxed text-slate-700">
                            “{highlight.text}”
                          </blockquote>
                        </div>

                        <div className="mt-3 border-t border-slate-200/80 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                            Comentário do professor
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                            {highlight.comment}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {comp.id !== "c5" && <div className="h-px w-full bg-slate-100 mt-6"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
