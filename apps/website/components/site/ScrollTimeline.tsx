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
    if (reduce) {
      setProgress(1);
      setActive(steps.length - 1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
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

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
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
        className="pointer-events-none absolute left-[13px] top-0 h-full w-[3px] rounded-full bg-border sm:left-[21px]"
      />
      {/* trilho preenchido */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[13px] top-0 w-[3px] rounded-full bg-primary sm:left-[21px]"
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
              className={`absolute -left-12 top-6 grid h-8 w-8 place-items-center rounded-full font-display text-xs font-extrabold transition-all duration-500 sm:-left-20 sm:h-11 sm:w-11 sm:text-sm ${
                reached
                  ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgba(25,96,234,0.8)]"
                  : "border border-border bg-background text-muted-foreground"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <div
              className={`rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] transition-all duration-500 sm:p-8 ${
                reached ? "border-primary/30 -translate-y-0.5" : "border-border"
              }`}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold text-card-foreground sm:text-2xl">
                    {s.title}
                  </h2>
                  {s.quote && (
                    <p className="mt-3 border-l-[3px] border-accent pl-4 text-base font-semibold leading-snug text-foreground/90">
                      {s.quote}
                    </p>
                  )}
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
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
