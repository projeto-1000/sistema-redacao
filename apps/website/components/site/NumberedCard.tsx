import type { ReactNode } from "react";

type Props = {
  number: string;
  title: string;
  quote?: string;
  children: ReactNode;
};

export function NumberedCard({ number, title, quote, children }: Props) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-8 pt-10 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-card)] sm:p-10 sm:pt-12">
      {/* número gigante decorativo — com respiro em relação à borda */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-4 font-display text-7xl font-extrabold leading-none text-primary/[0.07] transition-colors group-hover:text-primary/[0.12] sm:right-8 sm:top-6 sm:text-8xl"
      >
        {number}
      </span>

      <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-pastel-blue font-display text-base font-extrabold text-primary">
        {number}
      </span>

      <h3 className="relative mt-5 font-display text-xl font-bold text-foreground sm:text-2xl">
        {title}
      </h3>

      {quote && (
        <p className="relative mt-3 border-l-[3px] border-accent pl-4 text-base font-semibold leading-snug text-foreground/90">
          {quote}
        </p>
      )}

      <div className="relative mt-4 text-base leading-relaxed text-muted-foreground">
        {children}
      </div>
    </article>
  );
}
