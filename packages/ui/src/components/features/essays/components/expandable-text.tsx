"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

interface ExpandableTextProps {
  text: string;
  className?: string;
}

export function ExpandableText({
  text,
  className = "",
}: ExpandableTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const measureOverflow = useCallback(() => {
    const element = textRef.current;
    if (!element || isExpanded) return;

    setHasOverflow(element.scrollHeight > element.clientHeight + 1);
  }, [isExpanded]);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(element);
    measureOverflow();

    void document.fonts?.ready.then(measureOverflow);

    return () => resizeObserver.disconnect();
  }, [measureOverflow, text]);

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsExpanded((current) => !current);
  };

  return (
    <div className="min-w-0">
      <p
        ref={textRef}
        className={`${isExpanded ? "" : "line-clamp-3"} whitespace-pre-line break-words [overflow-wrap:anywhere] ${className}`}
      >
        {text}
      </p>

      {hasOverflow && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={handleToggle}
          onKeyDown={(event) => event.stopPropagation()}
          className="mt-1.5 text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          {isExpanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
}
