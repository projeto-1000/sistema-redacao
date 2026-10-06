import type { CancellationHistoryEntry } from "@/types/cancellation-history";
import { formatCancellationDate, getCancellationRefundLabel } from "@/utils/cancellation-history";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@repo/ui/components/accordion";
import { formatCurrency } from "@repo/utils";
import { CANCELLATION_TABLE_GRID } from "./cancellation-table-layout";
import { CancellationStatusBadge } from "./cancellation-status-badge";
import { CancellationRequestDetails } from "./cancellation-request-details";

export function CancellationRequestRow({ entry }: { entry: CancellationHistoryEntry }) {
  const snapshot = entry.snapshot;

  return (
    <AccordionItem value={entry.id} className="border-slate-100">
      <AccordionTrigger
        className={`grid grid-cols-2 items-start gap-4 rounded-none px-6 py-5 hover:bg-slate-50/50 hover:no-underline [&>svg]:self-center ${CANCELLATION_TABLE_GRID}`}
      >
        <span>
          <span className="block font-semibold text-slate-800">
            {snapshot.plan_name ?? "Plano não registrado"}
          </span>
          <span className="mt-1 block text-xs font-normal text-slate-500">
            {entry.kind === "ordinary" ? "Sem reembolso" : "Arrependimento em até 7 dias"}
          </span>
        </span>
        <span className="text-sm font-normal text-slate-700">
          <span className="block">
            {snapshot.credits_granted ?? "Não registrado"}
            {snapshot.credits_granted !== null ? " disponibilizados" : " (disponibilizados)"}
          </span>
          <span className="mt-1 block text-slate-500">
            {snapshot.credits_used ?? "Não registrado"}
            {snapshot.credits_used !== null ? " utilizados" : " (utilizados)"}
          </span>
        </span>
        <span className="text-sm">
          <span className="block font-semibold">
            {snapshot.amount === null ? "Valor não registrado" : formatCurrency(snapshot.amount)}
          </span>
          <span className="mt-1 block text-xs font-normal text-slate-500">
            {formatCancellationDate(snapshot.paid_at)}
          </span>
        </span>
        <span className="text-sm font-normal">
          <span className="mb-1 block text-xs text-slate-400 lg:hidden">Solicitação</span>
          {formatCancellationDate(entry.requested_at)}
        </span>
        <span className="text-sm font-normal">
          <span className="mb-1 block text-xs text-slate-400 lg:hidden">Reembolso</span>
          {getCancellationRefundLabel(entry)}
        </span>
        <span>
          <CancellationStatusBadge status={entry.status} />
          {entry.kind === "ordinary" && entry.effective_at && (
            <span className="mt-2 block text-xs font-normal text-slate-500">
              Acesso até {formatCancellationDate(entry.effective_at)}
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <CancellationRequestDetails entry={entry} />
      </AccordionContent>
    </AccordionItem>
  );
}
