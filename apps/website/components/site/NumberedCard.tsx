import type { ReactNode } from "react";

type Props = {
  number: string;
  title: string;
  quote?: string;
  children: ReactNode;
};

export function NumberedCard({ number, title, quote, children }: Props) {
  return (
    <article className="group border-border bg-card hover:border-primary/30 relative flex h-full flex-col overflow-hidden rounded-2xl border p-8 pt-10 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)] sm:p-10 sm:pt-12">
      {/* número gigante decorativo — com respiro em relação à borda */}
      <span
        aria-hidden
        className="font-display text-primary/[0.07] group-hover:text-primary/[0.12] pointer-events-none absolute top-4 right-6 text-7xl leading-none font-extrabold transition-colors sm:top-6 sm:right-8 sm:text-8xl"
      >
        {number}
      </span>

      <span className="bg-pastel-blue font-display text-primary relative inline-flex h-11 w-11 items-center justify-center rounded-full text-base font-extrabold">
        {number}
      </span>

      <h3 className="font-display text-foreground relative mt-5 text-xl font-bold sm:text-2xl">
        {title}
      </h3>

      {quote && (
        <p className="border-accent text-foreground/90 relative mt-3 border-l-[3px] pl-4 text-base leading-snug font-semibold">
          {quote}
        </p>
      )}

      <div className="text-muted-foreground relative mt-4 text-base leading-relaxed">
        {children}
      </div>
    </article>
  );
}
