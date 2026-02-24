"use client";

import { useState, useRef } from "react";
import { X, Trash2 } from "lucide-react";

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

      if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
        setPopover((prev) => (prev?.existingId ? prev : null));
        return;
      }

      const text = selection.toString();
      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();
      const rect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
      const containerRect = contentRef.current?.getBoundingClientRect();

      if (rect && containerRect && contentRef.current) {
        const { top, left, arrowOffset } = calculatePopoverPosition(rect, containerRect);

        setPopover({
          text,
          top,
          left,
          arrowOffset,
        });
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
        { id: Math.random().toString(), text: popover.text, compId }
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
                  className={`cursor-pointer transition-opacity hover:opacity-80 pb-0.5 ${HIGHLIGHT_STYLES[highlight.compId]}`}
                  title="Clique para editar ou remover"
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
    <div className="lg:col-span-7 bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

      <div className="flex border-b border-slate-100 px-8 pt-6 gap-8">
        <button
          onClick={() => onTabChange("text")}
          className={`pb-4 font-bold text-sm transition-colors border-b-2 ${activeTab === "text"
            ? "border-primary"
            : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
        >
          Texto do Aluno
        </button>
        <button
          onClick={() => onTabChange("proposal")}
          className={`pb-4 font-bold text-sm transition-colors border-b-2 ${activeTab === "proposal"
            ? "border-primary"
            : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
        >
          Proposta de Redação
        </button>
      </div>

      <div className="p-8 md:p-10 overflow-y-auto h-full" onMouseUp={handleMouseUp}>
        {activeTab === "text" ? (
          <div className="max-w-prose mx-auto relative" ref={contentRef}>

            {popover && (
              <div
                onMouseUp={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute z-50 bg-[#0F172A] text-white px-3 py-2.5 rounded-xl shadow-xl flex items-center gap-2 transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-200"
                style={{ top: popover.top, left: popover.left }}
              >
                <span className="text-xs font-bold mr-1 opacity-80">
                  {popover.existingId ? "Alterar:" : "Avaliar:"}
                </span>

                {COMP_BUTTONS.map((btn) => {
                  const isActive = popover.compId === btn.id;
                  return (
                    <button
                      key={btn.id}
                      onClick={() => addHighlight(btn.id)}
                      className={`
                        size-6 rounded-full text-[10px] font-bold hover:scale-110 transition-all 
                        ${btn.bg} ${btn.text || "text-white"}
                        ${isActive ? "ring-2 ring-white ring-offset-2 ring-offset-[#0F172A] scale-110" : ""}
                      `}
                    >
                      {btn.id.toUpperCase()}
                    </button>
                  );
                })}

                <div className="w-px h-4 bg-slate-700 mx-1"></div>

                {popover.existingId && (
                  <button
                    onClick={() => removeHighlight(popover.existingId!)}
                    className="text-red-400 hover:text-red-300 transition-colors mr-1"
                    title="Remover marcação"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    window.getSelection()?.removeAllRanges();
                    setPopover(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Fechar"
                >
                  <X className="size-4" />
                </button>

                {/* NOVO: A seta agora usa a propriedade arrowOffset para deslizar independentemente do menu! */}
                <div
                  className="absolute -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-[#0F172A] rotate-45 transition-all duration-200"
                  style={{ left: `calc(50% + ${popover.arrowOffset}px)` }}
                ></div>
              </div>
            )}

            <h2 className="text-2xl font-black mb-8 leading-tight">{essay.title}</h2>

            <div className="space-y-6 text-slate-700 text-base leading-relaxed text-justify selection:bg-amber-200 selection:text-amber-900">
              {essay.text.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>
                  {renderParagraph(paragraph)}
                </p>
              ))}
            </div>

          </div>
        ) : (
          <div className="text-slate-500 text-center py-20 font-medium">
            Aqui apareceria a imagem ou texto da proposta original do tema.
          </div>
        )}
      </div>
    </div>
  );
}