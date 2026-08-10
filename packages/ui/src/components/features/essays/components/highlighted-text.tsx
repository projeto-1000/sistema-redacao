'use client'

import React, { useRef } from "react";
import { HIGHLIGHT_STYLES } from "../../constants";
import type { CorrectionHighlight } from "@repo/types";
import { LineNumberedText } from "./line-numbered-text";

export type Highlight = CorrectionHighlight;

const ACTIVE_HIGHLIGHT_STYLES = {
  c1: "bg-comp-1/30 border-b-[3px] border-comp-1 text-slate-950",
  c2: "bg-comp-2/30 border-b-[3px] border-comp-2 text-slate-950",
  c3: "bg-comp-3/35 border-b-[3px] border-comp-3 text-slate-950",
  c4: "bg-comp-4/30 border-b-[3px] border-comp-4 text-slate-950",
  c5: "bg-comp-5/30 border-b-[3px] border-comp-5 text-slate-950",
};

interface HighlightedTextProps {
  text: string;
  highlights: Highlight[];
  activeHighlightId?: string | null;
  onHighlightClick?: (
    event: React.MouseEvent | React.KeyboardEvent,
    highlight: Highlight
  ) => void;
}

export function HighlightedText({
  text,
  highlights,
  activeHighlightId,
  onHighlightClick,
}: HighlightedTextProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  if (!text) {
    return <p className="text-slate-500 italic">Texto da redação indisponível.</p>;
  }

  sortedHighlights.forEach((hl) => {
    const isInteractive = Boolean(onHighlightClick && hl.comment.trim());
    const isActive = activeHighlightId === hl.id;
    const highlightStyle = isActive
      ? ACTIVE_HIGHLIGHT_STYLES[hl.compId]
      : HIGHLIGHT_STYLES[hl.compId];

    if (hl.startIndex > lastIndex) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, hl.startIndex)}
        </span>
      );
    }

    elements.push(
      <mark
        key={hl.id}
        id={`essay-highlight-${hl.id}`}
        data-highlight-id={hl.id}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-pressed={isInteractive ? activeHighlightId === hl.id : undefined}
        onClick={(event) => {
          if (isInteractive) onHighlightClick?.(event, hl);
        }}
        onKeyDown={(event) => {
          if (!isInteractive || (event.key !== "Enter" && event.key !== " ")) return;

          event.preventDefault();
          onHighlightClick?.(event, hl);
        }}
        className={`${highlightStyle} box-decoration-clone scroll-mt-28 rounded-sm pb-0.5 transition-colors ${isInteractive ? "cursor-pointer hover:brightness-95 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_rgba(99,102,241,0.55)]" : ""} ${isActive ? "shadow-[inset_0_0_0_1px_rgba(15,23,42,0.24)]" : ""}`}
      >
        {text.slice(hl.startIndex, hl.endIndex)}
      </mark>
    );

    lastIndex = hl.endIndex;
  });

  if (lastIndex < text.length) {
    elements.push(<span key={`text-end`}>{text.slice(lastIndex)}</span>);
  }

  return (
    <LineNumberedText
      contentRef={textRef}
      className="p-5 md:p-10"
      contentClassName="text-justify text-lg leading-relaxed text-slate-800 whitespace-pre-wrap wrap-break-word"
    >
      {elements}
    </LineNumberedText>
  );
}
