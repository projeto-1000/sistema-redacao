import { Info, TrendingUp, FileCheck, BadgeCheck } from "lucide-react";

interface StatCardProps {
  title: string;
  value?: number;
  maxValue?: number;
  helperText: string;
  variant: "yellow" | "blue";
  trendText?: string;
}

export function StatCard({
  title,
  value,
  maxValue = 1000,
  helperText,
  variant = "yellow",
  trendText
}: StatCardProps) {
  const isEmpty = !value || value === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col justify-between p-6 rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 min-h-40">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {title}
        </span>

        <div className="flex items-baseline gap-1 my-2">
          <span className="text-3xl font-bold text-slate-300">---</span>
          <span className="text-lg font-bold text-slate-300">/{maxValue}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
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
    }
  };

  const currentStyle = styles[variant];
  const BackgroundIcon = currentStyle.icon;

  return (
    <div className={`relative flex flex-col justify-between p-6 rounded-3xl shadow-lg min-h-40 overflow-hidden ${currentStyle.bg}`}>

      <BackgroundIcon
        className={`absolute right-3 top-1/2 -translate-y-1/2 opacity-10 size-24 pointer-events-none ${currentStyle.iconColor}`}
      />

      <span className={`relative z-10 text-xs font-bold uppercase tracking-widest ${currentStyle.subText}`}>
        {title}
      </span>

      <div className="relative z-10 flex items-baseline gap-1 my-3">
        <span className={`text-5xl font-extrabold ${currentStyle.mainText}`}>
          {value}
        </span>
        <span className={`text-xl font-medium ${currentStyle.subText}`}>
          / 1000
        </span>
      </div>

      {trendText && (
        <div className={`relative z-10 self-start px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 text-xs font-medium ${currentStyle.mainText} ${currentStyle.badgeBg}`}>
          {variant === "yellow" ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <BadgeCheck className="size-3.5" />
          )}
          {trendText}
        </div>
      )}
    </div>
  );
}