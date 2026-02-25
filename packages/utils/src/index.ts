import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper para garantir Date válido
function getDateObject(date: string | Date): Date {
  return typeof date === "string" ? new Date(date) : date;
}

type DateStyle = "short" | "long" | "full";

/**
 * Formata datas de forma unificada.
 * @param style - "short": "12 de Jan", "long": "12 de Janeiro", "full": "Quinta-feira, 12 de fevereiro"
 */

export function formatDate(
  date: string | Date | null | undefined,
  style: DateStyle = "short"
): string {
  if (!date) return "-";
  
  const dateObj = getDateObject(date);

  // 1. Regra do "Hoje" (Prioridade Máxima)
  if (isToday(dateObj) && style !== 'full') {
    return `Hoje às ${format(dateObj, "HH:mm")}`;
  }

  // 2. Formatação baseada no estilo
  if (style === "long") {
    return format(dateObj, "d 'de' MMMM, yyyy", { locale: ptBR });
  }

    if (style === "full") {
      const formatted = format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR });
      // Capitaliza apenas a primeira letra (ex: "quinta-feira" -> "Quinta-feira")
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    
  // Estilo "short" (com capitalização do mês: jan -> Jan)
  const formattedShort = format(dateObj, "d 'de' MMM, yyyy", { locale: ptBR });
  return formattedShort.replace(/ de ([a-z])/g, (match) => match.toUpperCase());
}

// --- OUTROS UTILITÁRIOS (Mantidos) ---

export function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] || "";
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatMonth(date: string | Date): string {
  const dateObj = getDateObject(date);
  return format(dateObj, "MMM", { locale: ptBR }).toUpperCase();
}

// --- Deadline correção --- //

const DEADLINE_HOURS = 24; // Atualizado para 24h conforme a nova regra

export type DeadlineStatus = "urgent" | "warning" | "normal";

export interface DeadlineInfo {
  status: DeadlineStatus;
  label: string;
  text: string;
}

export function getDeadlineInfo(createdAtString: string | Date): DeadlineInfo {
  const createdAt = new Date(createdAtString);
  
  // 1. Adiciona 24 horas corridas inicialmente
  let deadline = new Date(createdAt.getTime() + DEADLINE_HOURS * 60 * 60 * 1000);

  // 2. Regra de dias úteis: pula Sábado e Domingo
  if (deadline.getDay() === 6) { // Caiu no Sábado -> pula pra Segunda
    deadline = new Date(deadline.getTime() + 48 * 60 * 60 * 1000);
  } else if (deadline.getDay() === 0) { // Caiu no Domingo -> pula pra Segunda
    deadline = new Date(deadline.getTime() + 24 * 60 * 60 * 1000);
  }

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // Atrasado
  if (diffHours < 0) {
    return { status: "urgent", label: "ATRASADA", text: "Vencido" };
  }
  
  // Limites de alerta
  if (diffHours <= 6) {
    return { status: "urgent", label: "URGENTE", text: `${diffHours}h` };
  }
  if (diffHours <= 12) {
    return { status: "warning", label: "ATENÇÃO", text: `${diffHours}h` };
  }
  
  // Se faltam mais de 24h (por conta do salto do fim de semana)
  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24);
    return { status: "normal", label: "EM DIA", text: `${diffDays}d` };
  }

  // Normal em horas
  return { status: "normal", label: "EM DIA", text: `${diffHours}h` };
}