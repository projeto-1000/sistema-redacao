export function getDeadlineStatus(dueDate: string) {
  const now = new Date();
  const target = new Date(dueDate);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) return { status: "expired", label: "ATRASADA", text: "Vencido" };
  if (diffHours <= 6) return { status: "urgent", label: "URGENTE", text: `${diffHours}h` };
  if (diffHours <= 12) return { status: "warning", label: "ATENÇÃO", text: `${diffHours}h` };
  
  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24);
    return { status: "normal", label: "EM DIA", text: `${diffDays}d` };
  }

  return { status: "normal", label: "EM DIA", text: `${diffHours}h` };
}