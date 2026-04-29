import { ReactNode } from "react";
interface PageHeaderProps {
  title: string;
  subtitle: ReactNode;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  className?: string;
  children?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  variant = "default",
  className = "",
  children
}: PageHeaderProps) {

  const subtitleColor = variant === "secondary" ? "text-slate-500" : "text-[#8B8265]";

  return (
    <div className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${className}`}>

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          {title}
        </h2>
        <p className={subtitleColor}>
          {subtitle}
        </p>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end">
          {children}
        </div>
      )}
    </div>
  )
}