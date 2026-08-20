"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

interface LineMetrics {
  lineCount: number;
  lineHeight: number;
}

interface LineNumberedTextProps {
  children: ReactNode;
  contentRef: RefObject<HTMLDivElement | null>;
  className?: string;
  contentClassName?: string;
}

function getComputedLineHeight(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(styles.lineHeight);

  if (Number.isFinite(lineHeight)) return lineHeight;

  const fontSize = Number.parseFloat(styles.fontSize);
  return Number.isFinite(fontSize) ? fontSize * 1.2 : 0;
}

export function LineNumberedText({
  children,
  contentRef,
  className = "",
  contentClassName = "",
}: LineNumberedTextProps) {
  const [metrics, setMetrics] = useState<LineMetrics>({
    lineCount: 1,
    lineHeight: 0,
  });
  const animationFrameRef = useRef<number | null>(null);

  const measureLines = useCallback(() => {
    const element = contentRef.current;
    if (!element) return;

    const lineHeight = getComputedLineHeight(element);
    if (!lineHeight) return;

    const renderedHeight = element.getBoundingClientRect().height;
    const lineCount = Math.max(1, Math.round(renderedHeight / lineHeight));

    setMetrics((currentMetrics) => {
      if (
        currentMetrics.lineCount === lineCount &&
        Math.abs(currentMetrics.lineHeight - lineHeight) < 0.01
      ) {
        return currentMetrics;
      }

      return { lineCount, lineHeight };
    });
  }, [contentRef]);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    let isDisposed = false;

    const scheduleMeasurement = () => {
      if (isDisposed) return;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(measureLines);
    };

    const resizeObserver = new ResizeObserver(scheduleMeasurement);
    resizeObserver.observe(element);
    scheduleMeasurement();

    void document.fonts?.ready.then(scheduleMeasurement);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [contentRef, measureLines]);

  return (
    <div className={`flex min-w-0 items-start ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none w-6 shrink-0 select-none pr-1.5 text-right text-[10px] font-medium tabular-nums text-slate-300 md:w-8 md:pr-2.5"
      >
        {Array.from({ length: metrics.lineCount }, (_, index) => (
          <span
            key={index}
            className="block"
            style={
              metrics.lineHeight
                ? {
                    height: `${metrics.lineHeight}px`,
                    lineHeight: `${metrics.lineHeight}px`,
                  }
                : undefined
            }
          >
            {index + 1}
          </span>
        ))}
      </div>

      <div
        ref={contentRef}
        className={`min-w-0 flex-1 ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
