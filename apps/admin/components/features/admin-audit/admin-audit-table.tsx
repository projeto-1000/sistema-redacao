"use client";

import type { AdminAuditEventItem } from "@/app/actions/admin-audit";
import { TablePagination } from "@/components/table-pagination";
import { Badge } from "@repo/ui/components/badge";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@repo/ui/components/sheet";
import {
  Activity,
  Banknote,
  BookCheck,
  ChevronRight,
  Coins,
  LifeBuoy,
  UserCog,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

const ACTION_LABELS: Record<string, string> = {
  "student.profile_updated": "Perfil do aluno atualizado",
  "student.profile_update_failed": "Atualização do aluno não concluída",
  "student.profile_update_operational_issue": "Atualização do aluno requer atenção",
  "student.password_reset_requested": "Redefinição de senha enviada",
  "student.blocked": "Aluno bloqueado",
  "student.unblocked": "Aluno desbloqueado",
  "student.credit_granted": "Créditos concedidos ao aluno",
  "teacher.invitation_sent": "Convite de professor enviado",
  "teacher.invitation_resent": "Convite de professor reenviado",
  "teacher.payment_registered": "Pagamento de professor registrado",
  "correction_review.approved": "Correção aprovada",
  "correction_review.approved_with_changes": "Correção aprovada com alterações",
  "correction_review.returned_to_teacher": "Correção devolvida ao professor",
  "subscription_support.cancel_only": "Cancelamento programado",
  "subscription_support.cancel_refund": "Cancelamento com reembolso",
  "subscription_support.refund_courtesy": "Reembolso com cortesia",
  "subscription_support.refund_only": "Reembolso sem cancelamento",
  "subscription_support.status_changed": "Status do atendimento atualizado",
};

const FIELD_LABELS: Record<string, string> = {
  full_name: "Nome completo",
  phone: "Telefone",
  status: "Status do cadastro",
  scores: "Notas",
  comments: "Comentários",
  general_comment: "Comentário geral",
  main_bottleneck: "Principal dificuldade",
  next_essay_priorities: "Prioridades para a próxima redação",
  rewrite_tasks: "Tarefas de reescrita",
  highlights: "Destaques da correção",
};

const VALUE_LABELS: Record<string, string> = {
  active: "Ativo",
  blocked: "Bloqueado",
  pending: "Pendente",
  refund_processing: "Reembolso em processamento",
  completed: "Concluído",
  operational_issue: "Requer atenção",
  plan: "Plano",
  extra: "Extra",
  mentorship: "Mentoria",
  mentorship_bonus: "Bônus da mentoria",
  administrative_adjustment: "Ajuste administrativo",
  technical_issue_compensation: "Compensação por problema técnico",
  credit_replacement: "Reposição de créditos",
  courtesy: "Cortesia",
  promotional_campaign: "Campanha promocional",
  other: "Outro motivo",
  cancel_only: "Somente cancelamento",
  cancel_refund: "Cancelamento com reembolso",
  refund_courtesy: "Reembolso com cortesia",
  refund_only: "Somente reembolso",
  paid: "Pago",
  processing: "Em processamento",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  pagarme: "Pagar.me",
};

const RESOURCE_STYLES: Record<
  string,
  { icon: LucideIcon; iconClasses: string; containerClasses: string }
> = {
  student_profile: {
    icon: UserCog,
    iconClasses: "text-blue-600",
    containerClasses: "bg-blue-50",
  },
  teacher_invitation: {
    icon: UserPlus,
    iconClasses: "text-violet-600",
    containerClasses: "bg-violet-50",
  },
  teacher_payment: {
    icon: Banknote,
    iconClasses: "text-emerald-600",
    containerClasses: "bg-emerald-50",
  },
  correction_review: {
    icon: BookCheck,
    iconClasses: "text-amber-600",
    containerClasses: "bg-amber-50",
  },
  manual_credit_grant: {
    icon: Coins,
    iconClasses: "text-orange-600",
    containerClasses: "bg-orange-50",
  },
  subscription_support: {
    icon: LifeBuoy,
    iconClasses: "text-cyan-600",
    containerClasses: "bg-cyan-50",
  },
};

const DEFAULT_RESOURCE_STYLE = {
  icon: Activity,
  iconClasses: "text-slate-600",
  containerClasses: "bg-slate-100",
};

interface AuditDetail {
  label: string;
  value?: string;
  before?: string;
  after?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") return value.toLocaleString("pt-BR");
  if (typeof value === "string") return VALUE_LABELS[value] ?? value;
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).join("; ") || "Nenhum";
  }

  return JSON.stringify(value, null, 2);
}

function getDiff(value: unknown) {
  if (!isRecord(value)) return null;
  const hasFromTo = "from" in value || "to" in value;
  const hasBeforeAfter = "before" in value || "after" in value;

  if (!hasFromTo && !hasBeforeAfter) return null;

  return {
    before: formatValue(hasFromTo ? value.from : value.before),
    after: formatValue(hasFromTo ? value.to : value.after),
  };
}

function getChangeDetails(changes: Record<string, unknown>) {
  const details: AuditDetail[] = [];

  const addDiff = (key: string, value: unknown, prefix?: string) => {
    const diff = getDiff(value);
    if (!diff) return;

    details.push({
      label: prefix ? `${prefix} — ${FIELD_LABELS[key] ?? key}` : (FIELD_LABELS[key] ?? key),
      ...diff,
    });
  };

  Object.entries(changes).forEach(([key, value]) => {
    if (key === "schema_version" || key === "fields") return;
    addDiff(key, value);
  });

  if (isRecord(changes.fields)) {
    Object.entries(changes.fields).forEach(([field, value]) => {
      if ((field === "scores" || field === "comments") && isRecord(value)) {
        Object.entries(value).forEach(([competency, competencyValue]) => {
          addDiff(field, competencyValue, competency.toUpperCase());
        });
        return;
      }

      addDiff(field, value);
    });
  }

  return details;
}

function getMetadataDetails(event: AdminAuditEventItem) {
  const metadata = event.metadata;
  const details: AuditDetail[] = [];
  const add = (label: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return;
    details.push({ label, value: formatValue(value) });
  };

  if (event.resource_type === "manual_credit_grant") {
    if (typeof metadata.amount === "number") {
      details.push({
        label: "Quantidade de créditos",
        value: `${metadata.amount.toLocaleString("pt-BR")} ${metadata.amount === 1 ? "crédito" : "créditos"}`,
      });
    }
    add("Tipo de crédito", metadata.credit_type);
    add("Motivo", metadata.reason);
    if (typeof metadata.expires_at === "string") {
      details.push({ label: "Validade", value: formatDate(metadata.expires_at) });
    }
  }

  if (event.resource_type === "subscription_support") {
    add("Tipo de atendimento", metadata.support_action);
    if (typeof metadata.amount === "number") {
      details.push({ label: "Valor", value: formatCurrency(metadata.amount / 100) });
    }
    add("Status da operação", metadata.operation_status);
    add("Cancelamento confirmado no provedor", metadata.provider_canceled);
    add("Reembolso confirmado", metadata.refund_confirmed);
  }

  if (event.resource_type === "teacher_payment") {
    if (typeof metadata.total_amount === "number") {
      details.push({ label: "Valor", value: formatCurrency(metadata.total_amount) });
    }
    if (typeof metadata.billing_month === "string") {
      const billingMonth = new Date(`${metadata.billing_month.slice(0, 7)}-01T12:00:00`);
      details.push({
        label: "Competência",
        value: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
          billingMonth
        ),
      });
    }
    add("Redações incluídas", metadata.essays_count);
    add("Status do pagamento", metadata.payment_status);
  }

  if (event.resource_type === "teacher_invitation") {
    add("Correções exigem revisão", metadata.correction_review_required);
  }

  if (event.resource_type === "correction_review") {
    add("Observação ao professor", metadata.feedback);
  }

  if (typeof metadata.provider === "string") add("Integração", metadata.provider);

  return details;
}

function getEventLink(event: AdminAuditEventItem) {
  if (event.resource_type === "student_profile" && event.resource_id) {
    return { href: `/alunos/${event.resource_id}`, label: "Ir para aluno" };
  }

  if (
    (event.resource_type === "manual_credit_grant" ||
      event.resource_type === "subscription_support") &&
    event.subject?.id
  ) {
    return { href: `/alunos/${event.subject.id}`, label: "Ir para aluno" };
  }

  if (event.resource_type === "teacher_invitation" && event.subject?.id) {
    return { href: `/professores/${event.subject.id}`, label: "Ir para professor" };
  }

  if (event.resource_type === "teacher_payment" && event.subject?.id) {
    return {
      href: `/professores/${event.subject.id}/pagamentos`,
      label: "Ver pagamentos",
    };
  }

  if (event.resource_type === "correction_review" && typeof event.metadata.essay_id === "string") {
    return {
      href: `/redacoes-corrigidas/${event.metadata.essay_id}`,
      label: "Ver correção",
    };
  }

  return null;
}

export function AdminAuditTable({
  events,
  totalPages,
}: {
  events: AdminAuditEventItem[];
  totalPages: number;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id ?? null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0];

  if (!selectedEvent) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-medium text-slate-500">
        Nenhuma atividade encontrada para os filtros selecionados.
      </div>
    );
  }

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);

    if (!window.matchMedia("(min-width: 1280px)").matches) {
      setDetailsOpen(true);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.8fr)] xl:items-start">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(220px,1.35fr)_minmax(130px,0.75fr)_minmax(150px,0.9fr)_120px_100px_20px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase lg:grid">
            <span>Atividade</span>
            <span>Aluno</span>
            <span>Administrador</span>
            <span>Data e hora</span>
            <span>Status</span>
            <span />
          </div>

          <div className="divide-y divide-slate-100">
            {events.map((event) => {
              const status = STATUS_LABELS[event.status];
              const actionLabel = ACTION_LABELS[event.action] ?? event.summary;
              const resourceStyle = RESOURCE_STYLES[event.resource_type] ?? DEFAULT_RESOURCE_STYLE;
              const ResourceIcon = resourceStyle.icon;
              const isSelected = event.id === selectedEvent.id;

              return (
                <button
                  key={event.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectEvent(event.id)}
                  className={`grid w-full gap-3 border-l-4 px-5 py-4 text-left transition-colors lg:grid-cols-[minmax(220px,1.35fr)_minmax(130px,0.75fr)_minmax(150px,0.9fr)_120px_100px_20px] lg:items-center lg:gap-4 ${
                    isSelected
                      ? "border-l-blue-600 bg-blue-50/70"
                      : "border-l-transparent bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${resourceStyle.containerClasses}`}
                    >
                      <ResourceIcon className={`size-4 ${resourceStyle.iconClasses}`} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm leading-5 font-bold text-slate-900">
                        {actionLabel}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-slate-500">
                        {RESOURCE_LABELS[event.resource_type] ?? event.resource_type}
                      </span>
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="mb-1 block text-[10px] font-black tracking-wider text-slate-400 uppercase lg:hidden">
                      Aluno
                    </span>
                    <span className="block truncate text-sm font-semibold text-slate-700">
                      {event.subject?.full_name || "—"}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="mb-1 block text-[10px] font-black tracking-wider text-slate-400 uppercase lg:hidden">
                      Administrador
                    </span>
                    <span className="block truncate text-sm font-bold text-slate-800">
                      {event.actor?.full_name || "Não identificado"}
                    </span>
                  </span>
                  <span>
                    <span className="mb-1 block text-[10px] font-black tracking-wider text-slate-400 uppercase lg:hidden">
                      Data e hora
                    </span>
                    <span className="block text-xs font-bold text-slate-500">
                      {formatDateTime(event.created_at)}
                    </span>
                  </span>
                  <span>
                    <span className="mb-1 block text-[10px] font-black tracking-wider text-slate-400 uppercase lg:hidden">
                      Status
                    </span>
                    <Badge className={`w-fit border-none ${status.classes}`}>{status.label}</Badge>
                  </span>
                  <ChevronRight
                    className={`hidden size-4 lg:block ${isSelected ? "text-blue-600" : "text-slate-300"}`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <aside className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6 xl:block">
          <AuditDetailsContent event={selectedEvent} />
        </aside>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="gap-0 overflow-hidden p-0 sm:max-w-xl xl:hidden">
          <SheetTitle className="sr-only">Detalhes da atividade</SheetTitle>
          <SheetDescription className="sr-only">
            Informações completas da atividade administrativa selecionada.
          </SheetDescription>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AuditDetailsContent event={selectedEvent} sheet />
          </div>
        </SheetContent>
      </Sheet>

      {totalPages > 1 && <TablePagination totalPages={totalPages} />}
    </div>
  );
}

function AuditDetailsContent({
  event,
  sheet = false,
}: {
  event: AdminAuditEventItem;
  sheet?: boolean;
}) {
  const status = STATUS_LABELS[event.status];
  const actionLabel = ACTION_LABELS[event.action] ?? event.summary;
  const isCorrectionReview = event.resource_type === "correction_review";
  const changes = isCorrectionReview ? [] : getChangeDetails(event.changes);
  const metadata = isCorrectionReview ? [] : getMetadataDetails(event);
  const eventLink = getEventLink(event);
  const resourceStyle = RESOURCE_STYLES[event.resource_type] ?? DEFAULT_RESOURCE_STYLE;
  const ResourceIcon = resourceStyle.icon;

  return (
    <>
      <div className={`border-b border-slate-100 px-6 py-5 ${sheet ? "pr-14" : ""}`}>
        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Detalhes da atividade
        </p>
        <div className="mt-4 flex items-start gap-3">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${resourceStyle.containerClasses}`}
          >
            <ResourceIcon className={`size-5 ${resourceStyle.iconClasses}`} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base leading-6 font-black text-slate-900">{actionLabel}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {RESOURCE_LABELS[event.resource_type] ?? event.resource_type}
            </p>
          </div>
          <Badge className={`shrink-0 border-none ${status.classes}`}>{status.label}</Badge>
        </div>
        {eventLink && (
          <Link
            href={eventLink.href}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            {eventLink.label}
            <ChevronRight className="ml-1 size-4" />
          </Link>
        )}
      </div>

      <div className="space-y-6 px-6 py-5 text-sm">
        <dl className="divide-y divide-slate-100">
          <DetailRow
            label="Administrador"
            value={event.actor?.full_name || "Administrador não identificado"}
            supportingValue={event.actor?.email}
          />
          <DetailRow
            label="Aluno"
            value={event.subject?.full_name || "Não identificado"}
            supportingValue={event.subject?.email}
          />
          <DetailRow label="Data e hora" value={formatDateTime(event.created_at)} />
          <DetailRow
            label="Tipo"
            value={RESOURCE_LABELS[event.resource_type] ?? event.resource_type}
          />
          {event.resource_id && (
            <DetailRow label="Referência" value={event.resource_id} breakValue />
          )}
        </dl>

        {changes.length > 0 && (
          <section>
            <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Alterações
            </h3>
            <div className="mt-3 space-y-3">
              {changes.map((detail, index) => (
                <div
                  key={`${detail.label}-${index}`}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    {detail.label}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)] sm:items-start">
                    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Antes</p>
                      <p className="mt-1 text-xs font-medium break-words whitespace-pre-wrap text-slate-600">
                        {detail.before}
                      </p>
                    </div>
                    <ChevronRight className="mx-auto size-4 rotate-90 text-slate-300 sm:mt-5 sm:rotate-0" />
                    <div className="min-w-0 rounded-xl bg-blue-50 p-3">
                      <p className="text-[9px] font-black text-blue-500 uppercase">Depois</p>
                      <p className="mt-1 text-xs font-bold break-words whitespace-pre-wrap text-slate-800">
                        {detail.after}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {metadata.length > 0 && (
          <section>
            <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Resumo do registro
            </h3>
            <dl className="mt-2 divide-y divide-slate-100">
              {metadata.map((detail, index) => (
                <DetailRow
                  key={`${detail.label}-${index}`}
                  label={detail.label}
                  value={detail.value ?? "Não informado"}
                />
              ))}
            </dl>
          </section>
        )}

        {isCorrectionReview ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 font-medium text-slate-500">
            Os dados completos desta correção permanecem disponíveis no histórico da redação.
          </p>
        ) : changes.length === 0 && metadata.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-xs font-medium text-slate-500">
            Esta atividade não possui alterações adicionais para exibir.
          </p>
        ) : null}
      </div>
    </>
  );
}

function DetailRow({
  label,
  value,
  supportingValue,
  breakValue = false,
}: {
  label: string;
  value: string;
  supportingValue?: string | null;
  breakValue?: boolean;
}) {
  return (
    <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-bold text-slate-400">{label}</dt>
      <dd
        className={`text-sm font-bold text-slate-800 ${breakValue ? "break-all" : "break-words"}`}
      >
        {value}
        {supportingValue && (
          <span className="mt-0.5 block text-xs font-medium break-all text-slate-500">
            {supportingValue}
          </span>
        )}
      </dd>
    </div>
  );
}
