import type { DeadlineInfo } from "@repo/types";
import { getDeadlineStatus } from "@repo/utils";
import { Clock } from "lucide-react";

interface EssayDeadlineBadgeProps {
  dueDate: string;
  remainingBusinessSeconds: number;
}

export function EssayDeadlineBadge({
  dueDate,
  remainingBusinessSeconds,
}: EssayDeadlineBadgeProps) {
  const deadline = getDeadlineStatus(
    dueDate,
    remainingBusinessSeconds,
  ) as DeadlineInfo;
  let classes = "border-blue-500 bg-blue-100 text-blue-700";

  if (deadline.status === "urgent" || deadline.status === "expired") {
    classes = "border-red-500 bg-red-100 text-red-700";
  } else if (deadline.status === "warning") {
    classes = "border-amber-400 bg-amber-100 text-amber-700";
  }

  return (
    <div
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${classes}`}
      title={deadline.label}
    >
      <Clock className="size-3" />
      {deadline.text}
    </div>
  );
}
