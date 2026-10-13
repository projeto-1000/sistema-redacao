export const CANCELLATION_ATTENTION_THRESHOLD = 3;

export const CANCELLATION_STATUSES: Record<string, { label: string; classes: string }> = {
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

export const CANCELLATION_STATUS_OPTIONS = [
  { label: "Todos", value: "all" },
  ...Object.entries(CANCELLATION_STATUSES).map(([value, config]) => ({
    value,
    label: config.label,
  })),
];
