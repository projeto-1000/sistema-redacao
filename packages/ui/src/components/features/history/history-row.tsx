import type {
  HistoryDisplayItem,
  HistoryValueTone,
} from "@repo/types";
import { ChevronDown } from "lucide-react";
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

        {item.details && (
          <details className="group mt-3 max-w-2xl rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-blue-700">
              {item.details.label}

              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <p className="text-sm font-bold text-slate-800">
                {item.details.title}
              </p>

              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {item.details.description}
              </p>

              {item.details.occurredAt && (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Decisão registrada em {formatDate(item.details.occurredAt, "numeric")}
                </p>
              )}

              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  {item.details.reasonLabel}
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {item.details.reason}
                </p>
              </div>
            </div>
          </details>
        )}
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
