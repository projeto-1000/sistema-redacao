import { Info, TrendingUp, FileCheck, BadgeCheck } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | null;
  helperText: string;
  variant: "yellow" | "blue";
}

export function StatCard({ title, value, helperText, variant = "yellow" }: StatCardProps) {
  const isEmpty = value === null || value === undefined;

  if (isEmpty) {
    return (
      <div className="flex min-h-40 flex-col justify-between rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-6">
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">{title}</span>

        <div className="my-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-300">---</span>
          <span className="text-lg font-bold text-slate-300">/1000</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Info className="size-3.5" />
          {helperText}
        </div>
      </div>
    );
  }

  const styles = {
    yellow: {
      bg: "bg-primary",
      mainText: "text-primary-foreground",
      subText: "text-primary-foreground/70",
      icon: TrendingUp,
      iconColor: "text-primary-foreground",
      badgeBg: "bg-primary-foreground/10",
    },
    blue: {
      bg: "bg-secondary",
      mainText: "text-secondary-foreground",
      subText: "text-secondary-foreground/70",
      icon: FileCheck,
      iconColor: "text-secondary-foreground",
      badgeBg: "bg-secondary-foreground/20",
    },
  };

  const currentStyle = styles[variant];
  const BackgroundIcon = currentStyle.icon;

  return (
    <div
      className={`relative flex min-h-40 flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-lg ${currentStyle.bg}`}
    >
      <BackgroundIcon
        className={`pointer-events-none absolute top-1/2 right-3 size-24 -translate-y-1/2 opacity-10 ${currentStyle.iconColor}`}
      />

      <span
        className={`relative z-10 text-xs font-bold tracking-widest uppercase ${currentStyle.subText}`}
      >
        {title}
      </span>

      <div className="relative z-10 my-3 flex items-baseline gap-1">
        <span className={`text-5xl font-extrabold ${currentStyle.mainText}`}>{value}</span>
        <span className={`text-xl font-medium ${currentStyle.subText}`}>/ 1000</span>
      </div>
    </div>
  );
}
