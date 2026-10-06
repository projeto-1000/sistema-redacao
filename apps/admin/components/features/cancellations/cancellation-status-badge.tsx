import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { CANCELLATION_STATUSES } from "@/constants/cancellation-history";

export function CancellationStatusBadge({ status }: { status: string }) {
  const config = CANCELLATION_STATUSES[status] ?? {
    label: "Status não reconhecido",
    classes: "bg-slate-100 text-slate-700",
  };
  const Icon =
    status === "refunded" || status === "canceled"
      ? CheckCircle2
      : status === "operational_issue"
        ? CircleAlert
        : Clock3;
  return (
    <Badge
      variant="secondary"
      className={`max-w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-normal ${config.classes}`}
    >
      <Icon aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
