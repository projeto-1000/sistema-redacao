"use client";

import { useState, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { useGradingStore } from "@/stores/use-grading-store";

const HIGHLIGHT_STYLES = {
  c1: "bg-comp-1/10 border-b-2 border-comp-1 text-slate-900",
  c2: "bg-comp-2/10 border-b-2 border-comp-2 text-slate-900",
  c3: "bg-comp-3/20 border-b-2 border-comp-3 text-slate-900",
  c4: "bg-comp-4/10 border-b-2 border-comp-4 text-slate-900",
  c5: "bg-comp-5/10 border-b-2 border-comp-5 text-slate-900",
};

const COMP_BUTTONS: { id: keyof typeof HIGHLIGHT_STYLES; bg: string; text?: string }[] = [
  { id: "c1", bg: "bg-comp-1" },
  { id: "c2", bg: "bg-comp-2" },
  { id: "c3", bg: "bg-comp-3" },
  { id: "c4", bg: "bg-comp-4" },
  { id: "c5", bg: "bg-comp-5" },
];

interface Highlight {
  id: string;
  text: string;
  compId: keyof typeof HIGHLIGHT_STYLES;
}

interface PopoverState {
  top: number;
  left: number;
  arrowOffset: number;
  text: string;
  existingId?: string;
  compId?: keyof typeof HIGHLIGHT_STYLES;
}

interface EssayViewerProps {
  essay: {
    id: string;
    title: string;
    text: string;
  };
  activeTab: "text" | "proposal";
  onTabChange: (tab: "text" | "proposal") => void;
}

export function EssayViewer({ essay, activeTab, onTabChange }: EssayViewerProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [popover, setPopover] = useState<PopoverState | null>(null);

  const activeHighlightComp = useGradingStore((state) => state.activeHighlightComp);
  const setActiveHighlightComp = useGradingStore((state) => state.setActiveHighlightComp);

  const contentRef = useRef<HTMLDivElement>(null);

  const calculatePopoverPosition = (rect: DOMRect, containerRect: DOMRect) => {
    const rawLeft = rect.left - containerRect.left + (rect.width / 2);
    const containerWidth = containerRect.width;
    const halfPopoverWidth = 150;
    const clampedLeft = Math.max(halfPopoverWidth, Math.min(rawLeft, containerWidth - halfPopoverWidth));
    const arrowOffset = rawLeft - clampedLeft;

    return {
      top: rect.top - containerRect.top - 10,
      left: clampedLeft,
      arrowOffset,
    };
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (!selection || selection.isCollapsed || !selectedText) {
        setPopover((prev) => (prev?.existingId ? prev : null));
        return;
      }

      if (activeHighlightComp) {
        const compKey = activeHighlightComp.toLowerCase() as keyof typeof HIGHLIGHT_STYLES;

        setHighlights((prev) => [
          ...prev.filter((h) => !selectedText.includes(h.text)),
          { id: crypto.randomUUID(), text: selectedText, compId: compKey }
        ]);

        setActiveHighlightComp(null);
        selection.removeAllRanges();
        setPopover(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      const rect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
      const containerRect = contentRef.current?.getBoundingClientRect();

      if (rect && containerRect && contentRef.current) {
        const { top, left, arrowOffset } = calculatePopoverPosition(rect, containerRect);
        setPopover({ text: selectedText, top, left, arrowOffset });
      }
    }, 50);
  };

  const handleMarkClick = (e: React.MouseEvent, highlight: Highlight) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const rects = target.getClientRects();
    const rect = rects.length > 0 ? rects[0] : target.getBoundingClientRect();
    const containerRect = contentRef.current?.getBoundingClientRect();

    if (rect && containerRect && contentRef.current) {
      const { top, left, arrowOffset } = calculatePopoverPosition(rect, containerRect);
      setPopover({
        text: highlight.text,
        existingId: highlight.id,
        compId: highlight.compId,
        top,
        left,
        arrowOffset,
      });
    }
  };

  const addHighlight = (compId: keyof typeof HIGHLIGHT_STYLES) => {
    if (!popover) return;

    if (popover.existingId) {
      setHighlights((prev) =>
        prev.map((h) => (h.id === popover.existingId ? { ...h, compId } : h))
      );
    } else {
      setHighlights((prev) => [
        ...prev.filter((h) => !popover.text.includes(h.text)),
        { id: crypto.randomUUID(), text: popover.text, compId }
      ]);
    }

    window.getSelection()?.removeAllRanges();
    setPopover(null);
  };

  const removeHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  };

  const renderParagraph = (paragraphText: string) => {
    let result: React.ReactNode[] = [paragraphText];
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);

    sortedHighlights.forEach((highlight) => {
      const newResult: React.ReactNode[] = [];
      result.forEach((part) => {
        if (typeof part === "string" && part.includes(highlight.text)) {
          const splitText = part.split(highlight.text);
          splitText.forEach((fragment, index) => {
            newResult.push(fragment);
            if (index < splitText.length - 1) {
              newResult.push(
                <mark
                  key={`${highlight.id}-${index}`}
                  className={`cursor-pointer transition-opacity hover:opacity-80 pb-0.5 rounded-sm ${HIGHLIGHT_STYLES[highlight.compId]}`}
                  onClick={(e) => handleMarkClick(e, highlight)}
                >
                  {highlight.text}
                </mark>
              );
            }
          });
        } else {
          newResult.push(part);
        }
      });
      result = newResult;
    });
    return result;
  };

  return (
    <div className="lg:col-span-7 bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
      <div className="flex border-b border-slate-100 px-8 pt-6 gap-8">
        <button
          onClick={() => onTabChange("text")}
          className={`pb-4 font-bold text-sm transition-colors border-b-2 ${activeTab === "text" ? "border-primary" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Texto do Aluno
        </button>
        <button
          onClick={() => onTabChange("proposal")}
          className={`pb-4 font-bold text-sm transition-colors border-b-2 ${activeTab === "proposal" ? "border-primary" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Proposta de Redação
        </button>
      </div>

      <div className="p-8 md:p-10 overflow-y-auto min-h-[8vh]" onMouseUp={handleMouseUp}>
        {activeTab === "text" ? (
          <div className="max-w-prose mx-auto relative" ref={contentRef}>
            {popover && (
              <div
                onMouseUp={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute z-50 bg-slate-900 text-white px-3 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 transform -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in-95 duration-200"
                style={{ top: popover.top, left: popover.left }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mr-1">
                  {popover.existingId ? "Alterar" : "Vincular"}
                </span>

                {COMP_BUTTONS.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => addHighlight(btn.id)}
                    className={`size-7 rounded-full text-[10px] font-black hover:scale-110 transition-all ${btn.bg} text-white ${popover.compId === btn.id ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-80 hover:opacity-100"}`}
                  >
                    {btn.id.toUpperCase()}
                  </button>
                ))}

                <div className="w-px h-4 bg-slate-700 mx-1"></div>

                {popover.existingId && (
                  <button onClick={() => removeHighlight(popover.existingId!)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                )}

                <button onClick={() => { window.getSelection()?.removeAllRanges(); setPopover(null); }} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="size-4" />
                </button>

                <div
                  className="absolute -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 transition-all duration-200"
                  style={{ left: `calc(50% + ${popover.arrowOffset}px)` }}
                ></div>
              </div>
            )}

            <h2 className="text-2xl font-black mb-8 leading-tight text-slate-900">{essay.title}</h2>

            <div className="space-y-6 text-slate-800 text-lg leading-relaxed text-justify selection:bg-amber-200 selection:text-amber-900">
              {essay.text.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{renderParagraph(paragraph)}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <div className="p-4 bg-slate-50 rounded-full"><Trash2 className="size-8 opacity-20" /></div>
            <p className="font-medium">Proposta de redação não disponível.</p>
          </div>
        )}
      </div>
    </div>
  );
}