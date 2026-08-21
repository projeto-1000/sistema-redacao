"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquareText, Trash2, X } from "lucide-react";
import { HIGHLIGHT_STYLES } from "../../constants";
import type { CorrectionHighlight } from "@repo/types";
import { Button } from "@repo/ui/components/button";

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
  placement: "above" | "below";
  startIndex: number;
  endIndex: number;
  text: string;
  compId?: CorrectionHighlight["compId"];
  comment: string;
  existingId?: string;
}
export type Highlight = CorrectionHighlight;
interface EssayViewerProps {
  essay: {
    id: string;
    title: string;
    content: string;
  };
  highlights: Highlight[];
  activeHighlightComp: string | null;
  activeHighlightId: string | null;
  onHighlightsChange: (newHighlights: Highlight[]) => void;
  onActiveHighlightChange: (compId: string | null) => void;
  onActiveHighlightIdChange: (id: string | null) => void;
}

export function EssayViewer({
  essay,
  highlights,
  activeHighlightComp,
  activeHighlightId,
  onHighlightsChange,
  onActiveHighlightChange,
  onActiveHighlightIdChange,
}: EssayViewerProps) {

  const [popover, setPopover] = useState<PopoverState | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const highlightRefs = useRef(new Map<string, HTMLElement>());

  const activeHighlight = popover?.existingId
    ? highlights.find((highlight) => highlight.id === popover.existingId)
    : null;

  const getPopoverPosition = (rect: DOMRect) => {
    const halfWidth = 180;
    const x = Math.min(
      Math.max(rect.left + rect.width / 2, halfWidth),
      window.innerWidth - halfWidth
    );
    const placement = rect.top > 260 ? "above" : "below";

    return {
      x,
      y: placement === "above" ? rect.top - 10 : rect.bottom + 10,
      placement,
    } as const;
  };

  const openHighlightEditor = (highlight: Highlight, element: HTMLElement) => {
    const position = getPopoverPosition(element.getBoundingClientRect());

    setPopover({
      ...position,
      startIndex: highlight.startIndex,
      endIndex: highlight.endIndex,
      text: highlight.text,
      compId: highlight.compId,
      comment: highlight.comment,
      existingId: highlight.id,
    });
  };

  useEffect(() => {
    if (!activeHighlightId) {
      if (popover?.existingId) setPopover(null);
      return;
    }

    const highlight = highlights.find(({ id }) => id === activeHighlightId);
    const element = highlightRefs.current.get(activeHighlightId);
    if (!highlight || !element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });

    const timer = window.setTimeout(() => {
      openHighlightEditor(highlight, element);
    }, 300);

    return () => window.clearTimeout(timer);
    // Only a new active id should trigger scrolling and repositioning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHighlightId]);

  useEffect(() => {
    if (!popover?.compId) return;

    const frame = window.requestAnimationFrame(() => {
      commentInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [popover?.compId]);

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

  const handleSelectCompetency = (compId: string) => {
    setPopover((currentPopover) =>
      currentPopover
        ? {
            ...currentPopover,
            compId: compId.toLowerCase() as CorrectionHighlight["compId"],
            comment: "",
          }
        : null
    );
    onActiveHighlightChange(null);
  };

  const handleSaveHighlightComment = () => {
    if (!popover?.compId) return;

    const comment = popover.comment.trim();
    if (!comment) return;

    if (popover.existingId) {
      onHighlightsChange(
        highlights.map((highlight) =>
          highlight.id === popover.existingId
            ? { ...highlight, comment }
            : highlight
        )
      );
    } else {
      const cleanHighlights = highlights.filter((highlight) => {
        const isOverlapping =
          Math.max(popover.startIndex, highlight.startIndex) <
          Math.min(popover.endIndex, highlight.endIndex);

        return !isOverlapping;
      });

      const newHighlight: Highlight = {
        id: crypto.randomUUID(),
        text: essay.content.slice(popover.startIndex, popover.endIndex),
        compId: popover.compId,
        comment,
        startIndex: popover.startIndex,
        endIndex: popover.endIndex,
      };

      onHighlightsChange([...cleanHighlights, newHighlight]);
    }

    window.getSelection()?.removeAllRanges();
    setPopover(null);
    onActiveHighlightChange(null);
    onActiveHighlightIdChange(null);
  };

  const handleRemoveHighlight = (id: string) => {
    onHighlightsChange(highlights.filter(h => h.id !== id));
    window.getSelection()?.removeAllRanges();
    setPopover(null);
    onActiveHighlightIdChange(null);
  };

  const handleSelectionEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.ignore-selection')) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (!selection || selection.isCollapsed || !selectedText) {
        if ((e.target as HTMLElement).tagName !== 'MARK') {
          setPopover(null);
          onActiveHighlightIdChange(null);
        }
        return;
      }

      const absRange = getAbsoluteRange(selection);
      if (!absRange) return;

      const rect = absRange.range.getBoundingClientRect();

      if (activeHighlightComp) {
        setPopover({
          ...getPopoverPosition(rect),
          startIndex: absRange.start,
          endIndex: absRange.end,
          text: essay.content.slice(absRange.start, absRange.end),
          compId:
            activeHighlightComp.toLowerCase() as CorrectionHighlight["compId"],
          comment: "",
        });
        onActiveHighlightChange(null);
        onActiveHighlightIdChange(null);
        return;
      }

      onActiveHighlightIdChange(null);
      setPopover({
        ...getPopoverPosition(rect),
        startIndex: absRange.start,
        endIndex: absRange.end,
        text: essay.content.slice(absRange.start, absRange.end),
        comment: "",
      });
    }, 100);
  };

  const handleMarkClick = (e: React.MouseEvent, hl: Highlight) => {
    e.stopPropagation();
    const element = e.currentTarget as HTMLElement;
    onActiveHighlightIdChange(hl.id);
    openHighlightEditor(hl, element);
  };

  const handleMarkKeyDown = (e: React.KeyboardEvent, hl: Highlight) => {
    if (e.key !== "Enter" && e.key !== " ") return;

    e.preventDefault();
    const element = e.currentTarget as HTMLElement;
    onActiveHighlightIdChange(hl.id);
    openHighlightEditor(hl, element);
  };

  const handleClosePopover = () => {
    window.getSelection()?.removeAllRanges();
    setPopover(null);
    onActiveHighlightIdChange(null);
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
          ref={(element) => {
            if (element) highlightRefs.current.set(hl.id, element);
            else highlightRefs.current.delete(hl.id);
          }}
          data-highlight-id={hl.id}
          role="button"
          tabIndex={0}
          onClick={(e) => handleMarkClick(e, hl)}
          onKeyDown={(e) => handleMarkKeyDown(e, hl)}
          aria-pressed={activeHighlightId === hl.id}
          className={`cursor-pointer rounded-sm pb-0.5 transition-all hover:opacity-80 ${HIGHLIGHT_STYLES[hl.compId as keyof typeof HIGHLIGHT_STYLES]} ${
            activeHighlightId === hl.id
              ? "ring-2 ring-slate-700/70 ring-offset-2"
              : ""
          }`}
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

  const renderPopoverContent = () => {
    if (popover?.compId) {
      const isCommentValid = popover.comment.trim().length > 0;

      return (
        <div className="w-[min(22rem,calc(100vw-2rem))] text-slate-900">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <MessageSquareText className="size-4 text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Comentário específico · {popover.compId.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                “{popover.text}”
              </p>
            </div>

            <button
              type="button"
              onClick={handleClosePopover}
              aria-label="Fechar comentário específico"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>
          </div>

          <label
            htmlFor={`highlight-comment-${popover.existingId ?? "new"}`}
            className="sr-only"
          >
            Comentário específico do trecho
          </label>
          <textarea
            ref={commentInputRef}
            id={`highlight-comment-${popover.existingId ?? "new"}`}
            value={popover.comment}
            onChange={(event) => {
              const comment = event.target.value;
              setPopover((currentPopover) =>
                currentPopover
                  ? { ...currentPopover, comment }
                  : currentPopover
              );
            }}
            maxLength={2000}
            rows={4}
            placeholder="Explique o problema ou a orientação para este trecho..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] text-slate-400">
              {popover.comment.length}/2000
            </span>

            <div className="flex items-center gap-2">
              {activeHighlight && (
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(activeHighlight.id)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" />
                  Remover apontamento
                </button>
              )}

              <Button
                type="button"
                size="sm"
                disabled={!isCommentValid}
                onClick={handleSaveHighlightComment}
                className="rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Salvar comentário
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mr-1 hidden sm:block">
        Vincular
      </span>

      {COMP_BUTTONS.map((btn) => (
        <button
          type="button"
          key={btn.id}
          onClick={() => handleSelectCompetency(btn.id)}
          className={`size-8 md:size-7 rounded-full text-[11px] md:text-[10px] font-black hover:scale-110 transition-transform ${btn.bg} text-white opacity-90 hover:opacity-100 shadow-md`}
        >
          {btn.id.toUpperCase()}
        </button>
      ))}

      <div className="w-px h-5 md:h-4 bg-slate-700 mx-1 md:mx-2"></div>

      <button type="button" onClick={handleClosePopover} className="p-2 md:p-1.5 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors">
        <X className="size-5 md:size-4" />
      </button>
      </>
    );
  };

  return (
    <div className="lg:col-span-7 bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit relative">
      <div className="px-6 py-4 md:px-8 md:py-6 border-b border-slate-100 uppercase tracking-widest text-[10px] font-bold text-slate-400">
        Texto do Aluno
      </div>

      <div
        className="p-4 md:p-10 overflow-y-auto min-h-[50vh]"
        onMouseUp={handleSelectionEnd}
        onTouchEnd={handleSelectionEnd}
      >
        <h2 className="text-lg md:text-2xl font-black mb-8 leading-tight text-center">
          {essay.title}
        </h2>

        <div
          ref={textRef}
          className="text-justify text-base leading-relaxed text-slate-800 whitespace-pre-wrap wrap-break-word selection:bg-amber-200/50 md:text-lg"
        >
          {renderContent()}
        </div>
      </div>

      {popover && (
        <>
          <div className={`md:hidden ignore-selection fixed bottom-40 z-9999 shadow-2xl flex items-center justify-center left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-6 duration-200 ${popover.compId ? "rounded-2xl border border-slate-200 bg-white p-4" : "w-max rounded-full border border-slate-700/50 bg-slate-900 px-4 py-3 text-white"}`}>
            {renderPopoverContent()}
          </div>

          <div
            className={`hidden md:flex ignore-selection fixed z-9999 w-max rounded-2xl shadow-2xl items-center gap-2 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-200 ${popover.compId ? "border border-slate-200 bg-white p-4" : "bg-slate-900 px-3 py-2.5 text-white"} ${popover.placement === "above" ? "-translate-y-full" : ""}`}
            style={{ top: popover.y, left: popover.x }}
          >
            {renderPopoverContent()}
            <div className={`absolute left-1/2 size-3 -translate-x-1/2 rotate-45 ${popover.compId ? "border-slate-200 bg-white" : "bg-slate-900"} ${popover.placement === "above" ? "-bottom-1.5 border-b border-r" : "-top-1.5 border-l border-t"}`}></div>
          </div>
        </>
      )}
    </div>
  );
}
