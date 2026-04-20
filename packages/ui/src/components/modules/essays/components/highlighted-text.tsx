'use client'

import React from "react";
import { HIGHLIGHT_STYLES } from "../constants";

export interface Highlight {
  id: string;
  compId: string;
  startIndex: number;
  endIndex: number;
  text?: string;
}

interface HighlightedTextProps {
  text: string;
  highlights: Highlight[];
  onHighlightClick?: (e: React.MouseEvent, highlight: Highlight) => void;
}

export function HighlightedText({ text, highlights, onHighlightClick }: HighlightedTextProps) {
  const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedHighlights.forEach((hl) => {
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
        onClick={(e) => onHighlightClick?.(e, hl)}
        className={`${HIGHLIGHT_STYLES[hl.compId as keyof typeof HIGHLIGHT_STYLES]} pb-0.5 rounded-sm ${onHighlightClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
          }`}
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
    <div className="p-8 md:p-10 text-slate-800 text-lg leading-relaxed text-justify whitespace-pre-wrap wrap-break-word">
      {elements}
    </div>
  );
}