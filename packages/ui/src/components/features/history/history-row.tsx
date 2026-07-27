import type {
  HistoryDisplayItem,
  HistoryValueTone,
} from "@repo/types";
import { formatDate } from "@repo/utils";

interface HistoryRowProps {
  item: HistoryDisplayItem;
}

const valueToneClassNames: Record<HistoryValueTone, string> = {
  positive: "font-bold text-emerald-600",
  negative: "font-semibold text-slate-500",
  neutral: "font-semibold text-slate-700",
  warning: "font-bold text-amber-600",
};

export function HistoryRow({ item }: HistoryRowProps) {
  const formattedDate = formatDate(item.createdAt, "numeric");

  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="font-bold text-slate-800">
          {item.title}
        </p>

        {item.description && (
          <p className="mt-1 text-sm font-medium text-slate-500">
            {item.description}
          </p>
        )}

        <p className="mt-1 text-[13px] font-medium capitalize text-slate-400">
          {formattedDate}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end text-right">
        <span className={valueToneClassNames[item.valueTone]}>
          {item.primaryValue}
        </span>

        {item.secondaryValue && (
          <span className="mt-1 text-xs font-medium text-slate-600/90">
            {item.secondaryValue}
          </span>
        )}
      </div>
    </div>
  );
}