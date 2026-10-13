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
  children,
}: SectionCardProps) {
  return (
    <div className="border-border flex min-h-75 flex-col rounded-3xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <div className="border-primary size-2 rounded-full border-2" />
        <h3 className="text-foreground font-bold">{title}</h3>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {hasData ? (
          children
        ) : (
          <div className="flex max-w-62.5 flex-col items-center">
            {Icon && (
              <div className="mb-4 text-slate-200">
                <Icon className="size-12" />
              </div>
            )}
            <p className="text-foreground mb-1 font-bold">{emptyMessage}</p>
            {emptyDescription && (
              <p className="text-muted-foreground text-xs leading-relaxed">{emptyDescription}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
