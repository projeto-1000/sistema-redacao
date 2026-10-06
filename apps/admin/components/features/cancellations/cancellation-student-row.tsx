import { CircleAlert } from "lucide-react";
import type { CancellationHistoryGroup } from "@/types/cancellation-history";
import { CANCELLATION_ATTENTION_THRESHOLD } from "@/constants/cancellation-history";
import { formatCancellationDate } from "@/utils/cancellation-history";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@repo/ui/components/accordion";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import { CancellationStatusBadge } from "./cancellation-status-badge";
import { CancellationRequestRow } from "./cancellation-request-row";
import { CANCELLATION_TABLE_COLUMNS, CANCELLATION_TABLE_GRID } from "./cancellation-table-layout";

export function CancellationStudentRow({ group }: { group: CancellationHistoryGroup }) {
  const needsAttention = group.requestCount >= CANCELLATION_ATTENTION_THRESHOLD;
  return (
    <AccordionItem
      value={group.studentId}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm last:border-b"
    >
      <AccordionTrigger className="items-center rounded-none  px-6 py-5 hover:no-underline [&>svg]:text-blue-600">
        <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-4">
          <span className="min-w-0">
            <span className="block text-lg font-bold text-slate-800">
              {group.identity.student_name ?? "Nome não registrado"}
            </span>
            <span className="mt-1 block text-sm font-normal break-all text-slate-500">
              {group.identity.student_email ?? "E-mail não registrado"}
            </span>
            <span className="mt-1 block text-xs font-normal break-all text-slate-500">
              ID: {group.studentId}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-4">
            <Badge
              variant="secondary"
              className={cn(
                "gap-1.5 px-3 py-1 text-sm",
                needsAttention
                  ? "bg-amber-100/70 font-semibold text-amber-800"
                  : "bg-blue-100/60 font-normal text-blue-700"
              )}
              title={
                needsAttention
                  ? "Atenção: três ou mais solicitações registradas. Sinalização informativa; não bloqueia cancelamentos ou reembolsos."
                  : undefined
              }
            >
              {needsAttention && (
                <>
                  <CircleAlert aria-hidden="true" />
                  <span className="sr-only">Atenção: solicitações recorrentes.</span>
                </>
              )}
              {group.requestCount} {group.requestCount === 1 ? "solicitação" : "solicitações"}
            </Badge>
            <span className="border-l border-slate-200 pl-4 text-sm">
              <span className="block font-normal text-slate-500">Última movimentação</span>
              <span className="block font-semibold text-slate-800">
                {formatCancellationDate(group.lastActivityAt)}
              </span>
            </span>
            <CancellationStatusBadge status={group.latestStatus} />
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <div
          className={`hidden gap-3 border-y border-slate-100 bg-slate-50 px-6 py-4 text-xs font-semibold text-slate-500 lg:grid ${CANCELLATION_TABLE_GRID}`}
        >
          {CANCELLATION_TABLE_COLUMNS.map((label) => (
            <span className="uppercase" key={label}>
              {label}
            </span>
          ))}
          <span className="sr-only">Detalhes</span>
        </div>
        <Accordion type="multiple">
          {group.requests.map((entry) => (
            <CancellationRequestRow key={entry.id} entry={entry} />
          ))}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  );
}
