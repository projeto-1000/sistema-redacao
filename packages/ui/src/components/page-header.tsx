import { ReactNode } from "react";
interface PageHeaderProps {
  title: string;
  subtitle: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, className = "", children }: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${className}`}
    >
      <div>
        <h2 className="mb-2 text-3xl font-extrabold tracking-tight">{title}</h2>
        <p className="text-slate-500">{subtitle}</p>
      </div>

      {children && (
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
