"use client";

import { useState, useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { useGradingStore } from "@/stores/use-grading-store";
import { HIGHLIGHT_STYLES } from "@repo/utils";

const COMP_BUTTONS = [
  { id: "c1", bg: "bg-comp-1" },
  { id: "c2", bg: "bg-comp-2" },
  { id: "c3", bg: "bg-comp-3" },
  { id: "c4", bg: "bg-comp-4" },
  { id: "c5", bg: "bg-comp-5" },
];

interface PopoverState {
  x: number;
  y: number;
  startIndex: number;
  endIndex: number;
  text: string;
  existingId?: string;
}
interface EssayViewerProps {
  essay: {
    id: string;
    title: string;
    content: string;
  };
}

export function EssayViewer({ essay }: EssayViewerProps) {
  const highlights = useGradingStore((state) => state.highlights);
  const activeHighlightComp = useGradingStore((state) => state.activeHighlightComp);
  const setActiveHighlightComp = useGradingStore((state) => state.setActiveHighlightComp);
  const setHighlights = useGradingStore((state) => state.setHighlights);

  const [popover, setPopover] = useState<PopoverState | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice(
      typeof window !== "undefined" &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    );
  }, []);

  const getAbsoluteRange = (selection: Selection) => {
    if (!textRef.current || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(textRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    const start = preSelectionRange.toString().length;
    const end = start + range.toString().length;

    return { start, end, range };
  };

  const handleAddHighlight = (compId: string, startIndex: number, endIndex: number, selectedText: string) => {
    const cleanHighlights = highlights.filter(h => {
      const isOverlapping = Math.max(startIndex, h.startIndex) < Math.min(endIndex, h.endIndex);
      return !isOverlapping;
    });

    const newHighlight = {
      id: crypto.randomUUID(),
      text: selectedText,
      compId: compId.toLowerCase(),
      startIndex,
      endIndex
    };

    setHighlights([...cleanHighlights, newHighlight]);

    window.getSelection()?.removeAllRanges();
    setPopover(null);
    setActiveHighlightComp(null);
  };

  const handleRemoveHighlight = (id: string) => {
    setHighlights(highlights.filter(h => h.id !== id));
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  };

  const handleSelectionEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.ignore-selection')) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (!selection || selection.isCollapsed || !selectedText) {
        if ((e.target as HTMLElement).tagName !== 'MARK') {
          setPopover(null);
        }
        return;
      }

      const absRange = getAbsoluteRange(selection);
      if (!absRange) return;

      if (activeHighlightComp) {
        handleAddHighlight(activeHighlightComp, absRange.start, absRange.end, selectedText);
        return;
      }

      const rect = absRange.range.getBoundingClientRect();

      setPopover({
        x: rect.left + (rect.width / 2),
        y: rect.top - 10,
        startIndex: absRange.start,
        endIndex: absRange.end,
        text: selectedText
      });
    }, 100);
  };

  const handleMarkClick = (e: React.MouseEvent, hl: any) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopover({
      x: rect.left + (rect.width / 2),
      y: rect.top - 10,
      startIndex: hl.startIndex,
      endIndex: hl.endIndex,
      text: hl.text,
      existingId: hl.id
    });
  };

  const renderContent = () => {
    const fullText = essay.content;
    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex);

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((hl) => {
      if (hl.startIndex > lastIndex) {
        elements.push(<span key={`text-${lastIndex}`}>{fullText.slice(lastIndex, hl.startIndex)}</span>);
      }

      elements.push(
        <mark
          key={hl.id}
          onClick={(e) => handleMarkClick(e, hl)}
          className={`cursor-pointer transition-colors hover:opacity-80 pb-0.5 rounded-sm ${HIGHLIGHT_STYLES[hl.compId as keyof typeof HIGHLIGHT_STYLES]}`}
        >
          {fullText.slice(hl.startIndex, hl.endIndex)}
        </mark>
      );

      lastIndex = hl.endIndex;
    });

    if (lastIndex < fullText.length) {
      elements.push(<span key={`text-end`}>{fullText.slice(lastIndex)}</span>);
    }

    return elements;
  };


  const renderPopoverContent = () => (
    <>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mr-1 hidden sm:block">
        {popover?.existingId ? "Opções" : "Vincular"}
      </span>

      {!popover?.existingId && COMP_BUTTONS.map((btn) => (
        <button
          key={btn.id}
          onClick={() => handleAddHighlight(btn.id, popover!.startIndex, popover!.endIndex, popover!.text)}
          className={`size-8 md:size-7 rounded-full text-[11px] md:text-[10px] font-black hover:scale-110 transition-transform ${btn.bg} text-white opacity-90 hover:opacity-100 shadow-md`}
        >
          {btn.id.toUpperCase()}
        </button>
      ))}

      {popover?.existingId && (
        <button
          onClick={() => handleRemoveHighlight(popover.existingId!)}
          className="px-3 py-1.5 text-sm font-bold text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2"
        >
          <Trash2 className="size-4 md:size-4" /> <span className="hidden sm:inline">Remover</span>
        </button>
      )}

      <div className="w-px h-5 md:h-4 bg-slate-700 mx-1 md:mx-2"></div>

      <button onClick={() => { window.getSelection()?.removeAllRanges(); setPopover(null); }} className="p-2 md:p-1.5 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors">
        <X className="size-5 md:size-4" />
      </button>
    </>
  );

  return (
    <div className="lg:col-span-7 bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit relative">
      <div className="px-6 py-4 md:px-8 md:py-6 border-b border-slate-100 uppercase tracking-widest text-[10px] font-bold text-slate-400">
        Texto do Aluno
      </div>

      <div
        className="p-6 md:p-10 overflow-y-auto min-h-[50vh]"
        onMouseUp={handleSelectionEnd}
        onTouchEnd={handleSelectionEnd}
      >
        <h2 className="text-xl md:text-2xl font-black mb-8 leading-tight">{essay.title}</h2>

        <div
          ref={textRef}
          className="text-slate-800 text-base md:text-lg leading-relaxed text-justify wrap-break-word whitespace-pre-wrap selection:bg-amber-200/50"
        >
          {renderContent()}
        </div>
      </div>

      {popover && (
        isTouchDevice ? (
          <div className="ignore-selection fixed z-9999 w-max bg-slate-900 text-white px-4 py-3 rounded-full shadow-2xl flex items-center justify-center gap-2 bottom-32 left-1/2 transform -translate-x-1/2 animate-in fade-in slide-in-from-bottom-6 duration-200 border border-slate-700/50">
            {renderPopoverContent()}
          </div>
        ) : (
          <div
            className="ignore-selection fixed z-9999 w-max bg-slate-900 text-white px-3 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 transform -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: popover.y, left: popover.x }}
          >
            {renderPopoverContent()}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
          </div>
        )
      )}
    </div>
  );
}