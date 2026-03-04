"use client";

import { useState, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { useGradingStore } from "@/stores/use-grading-store";

const HIGHLIGHT_STYLES = {
  c1: "bg-comp-1/10 border-b-2 border-comp-1",
  c2: "bg-comp-2/10 border-b-2 border-comp-2",
  c3: "bg-comp-3/20 border-b-2 border-comp-3",
  c4: "bg-comp-4/10 border-b-2 border-comp-4",
  c5: "bg-comp-5/10 border-b-2 border-comp-5",
};

const COMP_BUTTONS: { id: keyof typeof HIGHLIGHT_STYLES; bg: string }[] = [
  { id: "c1", bg: "bg-comp-1" },
  { id: "c2", bg: "bg-comp-2" },
  { id: "c3", bg: "bg-comp-3" },
  { id: "c4", bg: "bg-comp-4" },
  { id: "c5", bg: "bg-comp-5" },
];

interface PopoverState {
  top: number;
  left: number;
  arrowOffset: number;
  text: string;
  existingId?: string;
  compId?: keyof typeof HIGHLIGHT_STYLES;
  startIndex?: number;
  endIndex?: number;
}

interface HighlightData {
  id: string;
  text: string;
  compId: string;
  startIndex: number;
  endIndex: number;
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
  const highlights = useGradingStore((state) => state.highlights);
  const addHighlightStore = useGradingStore((state) => state.addHighlight);
  const removeHighlightStore = useGradingStore((state) => state.removeHighlight);
  const activeHighlightComp = useGradingStore((state) => state.activeHighlightComp);
  const setActiveHighlightComp = useGradingStore((state) => state.setActiveHighlightComp);

  const [popover, setPopover] = useState<PopoverState | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

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

  const getAbsoluteOffset = (range: Range) => {
    const root = textRef.current;
    if (!root) return { start: 0, end: 0 };

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(root);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    const start = preSelectionRange.toString().length;
    return {
      start,
      end: start + range.toString().length
    };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (!selection || selection.isCollapsed || !selectedText) {
        const isClickingHighlight = (e.target as HTMLElement).tagName === 'MARK';
        if (!isClickingHighlight) {
          setPopover((prev) => (prev?.existingId ? prev : null));
        }
        return;
      }

      const range = selection.getRangeAt(0);
      const { start, end } = getAbsoluteOffset(range);

      if (activeHighlightComp) {
        const compKey = activeHighlightComp.toLowerCase() as keyof typeof HIGHLIGHT_STYLES;

        addHighlightStore({
          id: crypto.randomUUID(),
          text: selectedText,
          compId: compKey,
          startIndex: start,
          endIndex: end
        });

        setActiveHighlightComp(null);
        selection.removeAllRanges();
        setPopover(null);
        return;
      }

      const rects = range.getClientRects();
      const rect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
      const containerRect = contentRef.current?.getBoundingClientRect();

      if (rect && containerRect && contentRef.current) {
        const { top, left, arrowOffset } = calculatePopoverPosition(rect, containerRect);
        setPopover({ text: selectedText, top, left, arrowOffset, startIndex: start, endIndex: end });
      }
    }, 50);
  };

  const handleMarkClick = (e: React.MouseEvent, highlight: HighlightData) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.target as HTMLElement;
    const rects = target.getClientRects();
    const rect = rects.length > 0 ? rects[0] : target.getBoundingClientRect();
    const containerRect = contentRef.current?.getBoundingClientRect();

    if (rect && containerRect && contentRef.current) {
      const { top, left, arrowOffset } = calculatePopoverPosition(rect, containerRect);
      setPopover({
        text: highlight.text,
        existingId: highlight.id,
        compId: highlight.compId as keyof typeof HIGHLIGHT_STYLES,
        startIndex: highlight.startIndex,
        endIndex: highlight.endIndex,
        top,
        left,
        arrowOffset,
      });
    }
  };

  const addHighlight = (compId: keyof typeof HIGHLIGHT_STYLES) => {
    if (!popover) return;

    if (popover.existingId) {
      removeHighlightStore(popover.existingId);
    }

    addHighlightStore({
      id: crypto.randomUUID(),
      text: popover.text,
      compId,
      startIndex: popover.startIndex!,
      endIndex: popover.endIndex!
    });

    window.getSelection()?.removeAllRanges();
    setPopover(null);
  };

  const removeHighlight = (id: string) => {
    removeHighlightStore(id);
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  };

  const renderContent = () => {
    const fullText = essay.text;
    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex);

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((hl) => {
      if (hl.startIndex > lastIndex) {
        elements.push(fullText.slice(lastIndex, hl.startIndex));
      }

      elements.push(
        <mark
          key={hl.id}
          className={`cursor-pointer transition-opacity hover:opacity-80 pb-0.5 rounded-sm ${HIGHLIGHT_STYLES[hl.compId as keyof typeof HIGHLIGHT_STYLES]}`}
          onClick={(e) => handleMarkClick(e, hl)}
        >
          {fullText.slice(hl.startIndex, hl.endIndex)}
        </mark>
      );
      lastIndex = hl.endIndex;
    });

    elements.push(fullText.slice(lastIndex));
    return elements;
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

            <div
              ref={textRef}
              className="text-slate-800 text-lg leading-relaxed text-justify wrap-break-word whitespace-pre-wrap selection:bg-slate-300"
            >
              {renderContent()}
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