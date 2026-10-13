"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

type Step = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  quote?: string;
  body: string;
};

type Props = {
  steps: Step[];
};

export function ScrollTimeline({ steps }: Props) {
  const containerRef = useRef<HTMLOListElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (reduce) {
        setProgress(1);
        setActive(steps.length - 1);
        return;
      }

      const rect = el.getBoundingClientRect();
      const anchor = window.innerHeight * 0.55;
      const raw = (anchor - rect.top) / rect.height;
      const p = Math.max(0, Math.min(1, raw));
      setProgress(p);

      const items = el.querySelectorAll<HTMLLIElement>("[data-timeline-step]");
      let idx = -1;
      items.forEach((li, i) => {
        const r = li.getBoundingClientRect();
        if (r.top < anchor) idx = i;
      });
      setActive(idx);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    onScroll();
    if (!reduce) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [steps.length]);

  return (
    <ol
      ref={containerRef}
      className="relative space-y-14 pl-12 sm:space-y-16 sm:pl-20"
      aria-label="Etapas do fluxo"
    >
      {/* trilho base */}
      <span
        aria-hidden
        className="bg-border pointer-events-none absolute top-0 left-[13px] h-full w-[3px] rounded-full sm:left-[21px]"
      />
      {/* trilho preenchido */}
      <span
        aria-hidden
        className="bg-primary pointer-events-none absolute top-0 left-[13px] w-[3px] rounded-full sm:left-[21px]"
        style={{
          height: `${progress * 100}%`,
          transition: "height 120ms linear",
        }}
      />

      {steps.map((s, i) => {
        const Icon = s.icon;
        const reached = i <= active;
        return (
          <li key={s.title} data-timeline-step className="relative">
            {/* Marcador numerado — só o passo alcançado ganha destaque */}
            <span
              aria-hidden
              className={`font-display absolute top-6 -left-12 grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold transition-all duration-500 sm:-left-20 sm:h-11 sm:w-11 sm:text-sm ${
                reached
                  ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgba(25,96,234,0.8)]"
                  : "border-border bg-background text-muted-foreground border"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <div
              className={`bg-card rounded-2xl border p-6 shadow-[var(--shadow-soft)] transition-all duration-500 sm:p-8 ${
                reached ? "border-primary/30 -translate-y-0.5" : "border-border"
              }`}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-card-foreground text-xl font-bold sm:text-2xl">
                    {s.title}
                  </h2>
                  {s.quote && (
                    <p className="border-accent text-foreground/90 mt-3 border-l-[3px] pl-4 text-base leading-snug font-semibold">
                      {s.quote}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-4 text-base leading-relaxed">{s.body}</p>
                </div>
                <span
                  className={`icon-bubble transition-colors duration-500 ${
                    reached ? "bg-pastel-blue" : "bg-secondary"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${reached ? "text-primary" : "text-muted-foreground"}`}
                  />
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
