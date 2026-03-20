import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in duration-500 ${className}`}>
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <Icon className="size-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">
        {title}
      </h3>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
}