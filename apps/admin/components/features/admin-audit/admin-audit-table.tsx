import type { AdminAuditEventItem } from "@/app/actions/admin-audit";
import { TablePagination } from "@/components/table-pagination";
import { Badge } from "@repo/ui/components/badge";
import { ChevronDown } from "lucide-react";

const RESOURCE_LABELS: Record<string, string> = {
  student_profile: "Aluno",
  teacher_invitation: "Convite de professor",
  teacher_payment: "Pagamento",
  correction_review: "Revisão de correção",
  manual_credit_grant: "Créditos",
  subscription_support: "Assinatura",
};

const STATUS_LABELS = {
  success: { label: "Concluído", classes: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Em andamento", classes: "bg-amber-100 text-amber-700" },
  failure: { label: "Falhou", classes: "bg-red-100 text-red-700" },
  operational_issue: { label: "Requer atenção", classes: "bg-orange-100 text-orange-700" },
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDetailLines(event: AdminAuditEventItem) {
  const lines: string[] = [];
  const changes = event.changes;
  const metadata = event.metadata;

  if (changes.full_name) lines.push("Nome completo alterado");
  if (changes.phone) lines.push("Telefone alterado");
  if (changes.status) lines.push("Status do cadastro alterado");
  if (typeof metadata.amount === "number")
    lines.push(`Quantidade/valor registrado: ${metadata.amount}`);
  if (typeof metadata.credit_type === "string")
    lines.push(`Tipo de crédito: ${metadata.credit_type}`);
  if (typeof metadata.billing_month === "string")
    lines.push(`Competência: ${metadata.billing_month}`);
  if (typeof metadata.operation_status === "string")
    lines.push(`Estado da operação: ${metadata.operation_status}`);
  if (typeof metadata.provider === "string") lines.push(`Integração: ${metadata.provider}`);

  return lines;
}

export function AdminAuditTable({
  events,
  totalPages,
}: {
  events: AdminAuditEventItem[];
  totalPages: number;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-medium text-slate-500">
        Nenhuma atividade encontrada para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[150px_1.2fr_1.6fr_1.2fr_140px_40px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase lg:grid">
          <span>Data</span>
          <span>Administrador</span>
          <span>Atividade</span>
          <span>Pessoa afetada</span>
          <span>Resultado</span>
          <span />
        </div>

        <div className="divide-y divide-slate-100">
          {events.map((event) => {
            const status = STATUS_LABELS[event.status];
            const details = getDetailLines(event);

            return (
              <details key={event.id} className="group">
                <summary className="grid cursor-pointer list-none gap-3 px-6 py-5 transition-colors hover:bg-slate-50 lg:grid-cols-[150px_1.2fr_1.6fr_1.2fr_140px_40px] lg:items-center lg:gap-4">
                  <span className="text-xs font-bold text-slate-500">
                    {formatDateTime(event.created_at)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-slate-900">
                      {event.actor?.full_name || "Administrador não identificado"}
                    </span>
                    {event.actor?.email && (
                      <span className="block truncate text-xs text-slate-500">
                        {event.actor.email}
                      </span>
                    )}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{event.summary}</span>
                    <span className="mt-1 block text-xs font-medium text-slate-500">
                      {RESOURCE_LABELS[event.resource_type] ?? event.resource_type}
                    </span>
                  </span>
                  <span className="min-w-0 text-sm font-semibold text-slate-700">
                    {event.subject?.full_name || "—"}
                  </span>
                  <Badge className={`w-fit border-none ${status.classes}`}>{status.label}</Badge>
                  <ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>

                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm text-slate-600">
                  <p>
                    <strong>Ação:</strong> {event.action}
                  </p>
                  {event.resource_id && (
                    <p className="mt-1 break-all">
                      <strong>Referência:</strong> {event.resource_id}
                    </p>
                  )}
                  {details.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5">
                      {details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && <TablePagination totalPages={totalPages} />}
    </div>
  );
}
