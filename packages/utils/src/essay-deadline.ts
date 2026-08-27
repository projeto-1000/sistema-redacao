export function getDeadlineStatus(dueDate: string, remainingBusinessSeconds: number) {
  const now = new Date();
  const target = new Date(dueDate);
  const diffHours = Math.max(0, Math.ceil(remainingBusinessSeconds / (60 * 60)));

  if (target.getTime() <= now.getTime() || remainingBusinessSeconds < 0) {
    return { status: "expired", label: "ATRASADA", text: "Vencido" };
  }
  if (diffHours <= 6) return { status: "urgent", label: "URGENTE", text: `${diffHours}h` };
  if (diffHours <= 12) return { status: "warning", label: "ATENÇÃO", text: `${diffHours}h` };

  return { status: "normal", label: "EM DIA", text: `${diffHours}h` };
}
