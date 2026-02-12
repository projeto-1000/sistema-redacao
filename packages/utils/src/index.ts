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