"use client";

import { MessageSquareText } from "lucide-react";
import type { CorrectionHighlight } from "@repo/types";
import { ExpandableText } from "../../essays/components/expandable-text";

interface HighlightCommentsPanelProps {
  highlights: CorrectionHighlight[];
  activeHighlightId: string | null;
  onSelectHighlight: (id: string) => void;
}

export function HighlightCommentsPanel({
  highlights,
  activeHighlightId,
  onSelectHighlight,
}: HighlightCommentsPanelProps) {
  const sortedHighlights = [...highlights].sort(
    (a, b) => a.startIndex - b.startIndex
  );

  if (sortedHighlights.length === 0) return null;

  return (
    <section className="mt-5 border-t border-slate-100 pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <MessageSquareText className="size-4 text-indigo-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            Apontamentos no texto
          </h4>
        </div>

        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
          {highlights.length}
        </span>
      </div>

      <div className="space-y-2">
        {sortedHighlights.map((highlight) => {
          const isActive = highlight.id === activeHighlightId;

          return (
            <div
              key={highlight.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectHighlight(highlight.id)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;

                event.preventDefault();
                onSelectHighlight(highlight.id);
              }}
              aria-pressed={isActive}
              className={`w-full cursor-pointer rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
                isActive
                  ? "border-indigo-300 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-200"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <p className="mb-2 truncate text-xs font-semibold text-slate-700">
                “{highlight.text}”
              </p>

              {highlight.comment.trim() ? (
                <ExpandableText
                  text={highlight.comment}
                  className="text-xs leading-relaxed text-slate-600"
                />
              ) : (
                <p className="text-xs italic leading-relaxed text-amber-600">
                  Adicionar comentário específico
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
