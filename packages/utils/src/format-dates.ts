import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

function getDateObject(date: string | Date): Date {
  return typeof date === "string" ? new Date(date) : date;
}

type DateStyle = "short" | "long" | "full" | "numeric";

/**
 * @param style - "short": "12 de Jan", "long": "12 de Janeiro", "full": "Quinta-feira, 12 de fevereiro", "numeric": "12/10/2023"
 */

export function formatDate(
  date: string | Date | null | undefined,
  style: DateStyle = "short"
): string {
  if (!date) return "-";

  const dateObj = getDateObject(date);

  if (isToday(dateObj) && style !== 'full' && style !== 'numeric') {
    return `Hoje às ${format(dateObj, "HH:mm")}`;
  }

  if (style === "numeric") {
    return dateObj.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  }

  if (style === "long") {
    return format(dateObj, "d 'de' MMMM", { locale: ptBR });
  }

  if (style === "full") {
    const formatted = format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  const formattedShort = format(dateObj, "d 'de' MMM, yyyy", { locale: ptBR });
return formattedShort.replace(/ de ([a-z])/g, (_, match) => ` de ${match.toUpperCase()}`);}

export function formatMonth(date: string | Date): string {
  const dateObj = getDateObject(date);
  return format(dateObj, "MMM", { locale: ptBR }).toUpperCase();
}