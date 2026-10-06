import type { CancellationHistoryEntry } from "@/types/cancellation-history";
import { formatCancellationDate } from "@/utils/cancellation-history";
import { subscriptionCancellationReasons } from "@repo/constants";

export function CancellationRequestDetails({ entry }: { entry: CancellationHistoryEntry }) {
  const reason = subscriptionCancellationReasons.find((r) => r.value === entry.cancellation_reason);
  const events = [...entry.events].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return (
    <div className="grid gap-6 border-t border-slate-100 bg-slate-50/60 px-6 py-5 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-600">Motivo do cancelamento</h3>
        <p className="font-semibold text-slate-800">
          {reason?.label ?? entry.cancellation_reason ?? "Não informado"}
        </p>
        {entry.cancellation_details && (
          <p className="text-sm whitespace-pre-wrap text-slate-600">{entry.cancellation_details}</p>
        )}
        <p className="text-xs text-slate-500">
          {entry.snapshot.historical_reconstruction
            ? "Registro anterior à atualização: dados recuperados quando disponíveis; créditos históricos não estimados."
            : "Créditos registrados no momento da solicitação."}
        </p>
        <p className="text-xs break-all text-slate-400">ID da solicitação: {entry.id}</p>
      </div>
      <div>
        <h3 className="mb-4 text-sm font-semibold text-slate-600">Histórico da solicitação</h3>
        <ol className="space-y-4 border-l border-slate-200 pl-5">
          {entry.snapshot.paid_at && (
            <li className="text-sm">
              <p className="font-semibold">Pagamento aprovado</p>
              <p className="text-xs text-slate-500">
                {formatCancellationDate(entry.snapshot.paid_at)}
              </p>
            </li>
          )}
          {events.map((event, index) => (
            <li key={`${event.at}-${index}`} className="relative text-sm">
              <span className="absolute top-1 -left-[25px] size-2 rounded-full bg-blue-500" />
              <p className="font-semibold text-slate-700">{event.label}</p>
              <p className="mt-1 text-xs text-slate-500">{formatCancellationDate(event.at)}</p>
              {event.detail && (
                <p className="mt-1 text-sm whitespace-pre-wrap text-slate-600">{event.detail}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
