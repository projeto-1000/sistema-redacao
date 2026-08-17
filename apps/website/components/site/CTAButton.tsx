import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "accent";

const styles: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_rgba(25,96,234,0.7)] hover:-translate-y-0.5 hover:bg-primary/90",
  accent:
    "bg-accent text-accent-foreground shadow-[0_12px_28px_-12px_rgba(245,195,39,0.8)] hover:-translate-y-0.5 hover:bg-accent/90",
  outline:
    "border border-border bg-background text-foreground hover:border-primary/50 hover:text-primary",
  ghost: "text-muted-foreground hover:text-primary",
};

export function CTAButton({
  children,
  href = "/cadastro",
  variant = "primary",
  className = "",
  dataCta,
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  dataCta?: string;
}) {
  return (
    <Link
      href={href}
      data-cta={dataCta}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
