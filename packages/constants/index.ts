export const USER_STATUS_MAP = {
  active: { label: "Ativo", colors: "bg-emerald-50 text-emerald-600" },
  inactive: { label: "Inativo", colors: "bg-slate-100 text-slate-500" },
  blocked: { label: "Bloqueado", colors: "bg-red-50 text-red-600" },
};

export const DELIVERY_STATUS_MAP = {
  corrected: { label: "Corrigida", colors: 'text-emerald-600 bg-emerald-50' },
  returned: { label: "Devolvida", colors: 'text-amber-600 bg-amber-50' },
  correcting: { label: "Em correção", colors: 'text-blue-600 bg-blue-50' },
}
