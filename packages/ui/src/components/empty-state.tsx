import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-24 text-center duration-500 ${className}`}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
          <Icon className="size-8 text-slate-300" />
        </div>
      )}
      <h3 className="mb-1 text-lg font-bold text-slate-800">{title}</h3>
      <p className="max-w-xs text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
