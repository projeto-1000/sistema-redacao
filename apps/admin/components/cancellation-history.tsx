"use client";

import { useState } from "react";
import type { CancellationHistoryEntry } from "@/app/actions/subscription-withdrawals";
import { Input } from "@repo/ui/components/input";
import { subscriptionCancellationReasons } from "@repo/constants";
import { CheckCircle2, ChevronDown, Clock3, CircleAlert, Search } from "lucide-react";

const grid =
  "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)_1.5rem]";
const statuses: Record<string, { label: string; classes: string }> = {
  refund_processing: { label: "Reembolso em processamento", classes: "bg-blue-50 text-blue-700" },
  refunded: { label: "Reembolso confirmado", classes: "bg-emerald-50 text-emerald-700" },
  operational_issue: { label: "Falha operacional", classes: "bg-red-50 text-red-700" },
  under_review: { label: "Análise pendente anterior", classes: "bg-amber-50 text-amber-700" },
  rejected: { label: "Recusa anterior registrada", classes: "bg-slate-100 text-slate-700" },
  scheduled: { label: "Cancelamento agendado", classes: "bg-violet-50 text-violet-700" },
  canceled: { label: "Cancelamento concluído", classes: "bg-slate-100 text-slate-700" },
  provider_pending: { label: "Confirmação pendente", classes: "bg-amber-50 text-amber-700" },
  undone: { label: "Cancelamento desfeito", classes: "bg-slate-100 text-slate-700" },
};

function date(value: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "Não registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function Status({ value }: { value: string }) {
  const config = statuses[value] ?? {
    label: "Status não reconhecido",
    classes: "bg-slate-100 text-slate-700",
  };
  const Icon =
    value === "refunded" || value === "canceled"
      ? CheckCircle2
      : value === "operational_issue"
        ? CircleAlert
        : Clock3;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${config.classes}`}
    >
      <Icon className="size-4 shrink-0" />
      {config.label}
    </span>
  );
}

export function CancellationHistory({ entries }: { entries: CancellationHistoryEntry[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const groups = new Map<string, CancellationHistoryEntry[]>();
  for (const entry of entries) {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    const searchable =
      `${entry.student_id} ${entry.snapshot.student_name ?? ""} ${entry.snapshot.student_email ?? ""}`.toLocaleLowerCase(
        "pt-BR"
      );
    if (!searchable.includes(query) || (status && entry.status !== status)) continue;
    const group = groups.get(entry.student_id) ?? [];
    group.push(entry);
    groups.set(entry.student_id, group);
  }
  const sorted = [...groups.entries()].sort(
    (a, b) =>
      Math.max(...b[1].map((e) => Date.parse(e.last_activity_at))) -
      Math.max(...a[1].map((e) => Date.parse(e.last_activity_at)))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 size-4 text-slate-400" />
          <Input
            aria-label="Buscar por nome, e-mail ou ID"
            placeholder="Buscar por nome, e-mail ou ID"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar por status"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {Object.entries(statuses).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </div>
      {sorted.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Nenhuma solicitação encontrada.
        </div>
      )}
      {sorted.map(([studentId, filteredRequests]) => {
        const allRequests = entries.filter((e) => e.student_id === studentId);
        const identity = allRequests[0]!.snapshot;
        const latestEntry = allRequests.reduce((latest, entry) =>
          Date.parse(entry.last_activity_at) > Date.parse(latest.last_activity_at) ? entry : latest
        );
        const lastActivity = allRequests.reduce(
          (latest, e) =>
            Date.parse(e.last_activity_at) > Date.parse(latest) ? e.last_activity_at : latest,
          allRequests[0]!.last_activity_at
        );
        return (
          <details
            key={studentId}
            className="group/student overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 bg-blue-50/40 px-6 py-5 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-800">
                  {identity.student_name ?? "Nome não registrado"}
                </h2>
                <p className="mt-1 text-sm break-all text-slate-500">
                  {identity.student_email ?? "E-mail não registrado"}
                </p>
                <p className="mt-1 text-xs break-all text-slate-500">ID: {studentId}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="rounded-full bg-blue-100/60 px-3 py-1 text-sm text-blue-700">
                  {allRequests.length} {allRequests.length === 1 ? "solicitação" : "solicitações"}
                </span>
                <div className="border-l border-slate-200 pl-4 text-sm">
                  <p className="text-slate-500">Última movimentação</p>
                  <p className="font-semibold text-slate-800">{date(lastActivity)}</p>
                </div>
                <Status value={latestEntry.status} />
                <ChevronDown className="size-5 text-blue-600 transition-transform group-open/student:rotate-180" />
              </div>
            </summary>
            <div
              className={`hidden gap-3 border-y border-slate-100 bg-slate-50 px-6 py-4 text-xs font-semibold text-slate-500 lg:grid ${grid}`}
            >
              {["Plano", "Créditos", "Pagamento", "Solicitação", "Reembolso", "Status"].map(
                (label) => (
                  <span key={label}>{label}</span>
                )
              )}
              <span className="sr-only">Detalhes</span>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredRequests.map((entry) => {
                const snapshot = entry.snapshot;
                const reason = subscriptionCancellationReasons.find(
                  (r) => r.value === entry.cancellation_reason
                );
                const events = [...entry.events].sort(
                  (a, b) => Date.parse(a.at) - Date.parse(b.at)
                );
                return (
                  <details key={entry.id} className="group/request">
                    <summary
                      className={`grid cursor-pointer list-none grid-cols-2 items-start gap-4 px-6 py-5 hover:bg-slate-50/50 [&::-webkit-details-marker]:hidden ${grid}`}
                    >
                      <div>
                        <span className="block font-semibold text-slate-800">
                          {snapshot.plan_name ?? "Plano não registrado"}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {entry.kind === "ordinary"
                            ? "Sem reembolso"
                            : "Arrependimento em até 7 dias"}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700">
                        <span className="block">
                          {snapshot.credits_granted ?? "Não registrado"}
                          {snapshot.credits_granted !== null
                            ? " disponibilizados"
                            : " (disponibilizados)"}
                        </span>
                        <span className="mt-1 block text-slate-500">
                          {snapshot.credits_used ?? "Não registrado"}
                          {snapshot.credits_used !== null ? " utilizados" : " (utilizados)"}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="block font-semibold">
                          {snapshot.amount === null
                            ? "Valor não registrado"
                            : new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(snapshot.amount / 100)}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {date(snapshot.paid_at)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="mb-1 block text-xs text-slate-400 lg:hidden">
                          Solicitação
                        </span>
                        {date(entry.requested_at)}
                      </div>
                      <div className="text-sm">
                        <span className="mb-1 block text-xs text-slate-400 lg:hidden">
                          Reembolso
                        </span>
                        {entry.kind === "ordinary"
                          ? "Não se aplica"
                          : entry.refund_completed_at
                            ? date(entry.refund_completed_at)
                            : entry.status === "rejected"
                              ? "Não realizado"
                              : "Não confirmado"}
                      </div>
                      <div>
                        <Status value={entry.status} />
                        {entry.kind === "ordinary" && entry.effective_at && (
                          <p className="mt-2 text-xs text-slate-500">
                            Acesso até {date(entry.effective_at)}
                          </p>
                        )}
                      </div>
                      <ChevronDown className="size-4 self-center text-slate-500 transition-transform group-open/request:rotate-180" />
                    </summary>
                    <div className="grid gap-6 border-t border-slate-100 bg-slate-50/60 px-6 py-5 lg:grid-cols-2">
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-600">
                          Motivo do cancelamento
                        </h3>
                        <p className="font-semibold text-slate-800">
                          {reason?.label ?? entry.cancellation_reason ?? "Não informado"}
                        </p>
                        {entry.cancellation_details && (
                          <p className="text-sm whitespace-pre-wrap text-slate-600">
                            {entry.cancellation_details}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          {snapshot.historical_reconstruction
                            ? "Registro anterior à atualização: dados recuperados quando disponíveis; créditos históricos não estimados."
                            : "Créditos registrados no momento da solicitação."}
                        </p>
                        <p className="text-xs break-all text-slate-400">
                          ID da solicitação: {entry.id}
                        </p>
                      </div>
                      <div>
                        <h3 className="mb-4 text-sm font-semibold text-slate-600">
                          Histórico da solicitação
                        </h3>
                        <ol className="space-y-4 border-l border-slate-200 pl-5">
                          {snapshot.paid_at && (
                            <li className="text-sm">
                              <p className="font-semibold">Pagamento aprovado</p>
                              <p className="text-xs text-slate-500">{date(snapshot.paid_at)}</p>
                            </li>
                          )}
                          {events.map((event, index) => (
                            <li key={`${event.at}-${index}`} className="relative text-sm">
                              <span className="absolute top-1 -left-[25px] size-2 rounded-full bg-blue-500" />
                              <p className="font-semibold text-slate-700">{event.label}</p>
                              <p className="mt-1 text-xs text-slate-500">{date(event.at)}</p>
                              {event.detail && (
                                <p className="mt-1 text-sm whitespace-pre-wrap text-slate-600">
                                  {event.detail}
                                </p>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
