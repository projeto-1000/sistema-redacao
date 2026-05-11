import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  emptyMessage?: string;
  emptyDescription?: string;
  hasData?: boolean;
  children?: React.ReactNode;
}

export function SectionCard({
  title,
  icon: Icon,
  emptyMessage = "Sem dados ainda",
  emptyDescription,
  hasData = false,
  children
}: SectionCardProps) {
  return (
    <div className="flex flex-col p-6 rounded-3xl border border-border bg-white shadow-sm min-h-[300px]">
      <div className="flex items-center gap-2 mb-6">
        <div className="size-2 rounded-full border-2 border-primary" />
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {hasData ? (
          children
        ) : (
          <div className="flex flex-col items-center max-w-[250px]">
            {Icon && (
              <div className="mb-4 text-slate-200">
                <Icon className="size-12" />
              </div>
            )}
            <p className="text-foreground font-bold mb-1">{emptyMessage}</p>
            {emptyDescription && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {emptyDescription}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}