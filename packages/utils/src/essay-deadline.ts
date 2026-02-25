const DEADLINE_HOURS = 24;

export type DeadlineStatus = "urgent" | "warning" | "normal";

export interface DeadlineInfo {
  status: DeadlineStatus;
  label: string;
  text: string;
}

// 1. Função para buscar Feriados na Brasil API (com cache de 1 semana do Next.js)
export async function getHolidays(): Promise<string[]> {
  try {
    // 2. Pegamos o ano atual automaticamente
    const currentYear = new Date().getFullYear(); 
    
    // 3. Injetamos na URL
    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${currentYear}`, {
      // Revalida o cache a cada 7 dias (604800 segundos)
      next: { revalidate: 604800 } 
    } as RequestInit & { next?: { revalidate: number } });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.map((holiday: { date: string }) => holiday.date);
  } catch (error) {
    console.error("Erro ao buscar feriados da Brasil API:", error);
    return [];
  }
}

// Função auxiliar para evitar problemas de fuso horário UTC x GMT-3 ao comparar datas
function isHoliday(data: Date, holidays: string[]): boolean {
  const year = data.getFullYear();
  const month = String(data.getMonth() + 1).padStart(2, '0');
  const day = String(data.getDate()).padStart(2, '0');
  const dataString = `${year}-${month}-${day}`; // Ex: "2026-09-07"
  
  return holidays.includes(dataString);
}

// 2. A função principal que agora aceita a lista de feriados
export function getDeadlineInfo(date: string | Date, holidays: string[] = []): DeadlineInfo {
  const createdAt = new Date(date);
  
  // Dá o salto inicial de 24 horas
  let deadline = new Date(createdAt.getTime() + DEADLINE_HOURS * 60 * 60 * 1000);

  // A MÁGICA: Enquanto for Fim de Semana (0=Dom, 6=Sáb) OU Feriado, empurra +24h!
  while (deadline.getDay() === 0 || deadline.getDay() === 6 || isHoliday(deadline, holidays)) {
    deadline = new Date(deadline.getTime() + 24 * 60 * 60 * 1000);
  }

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // Atrasado
  if (diffHours < 0) {
    return { status: "urgent", label: "ATRASADA", text: "Vencido" };
  }
  
  // Alertas
  if (diffHours <= 6) {
    return { status: "urgent", label: "URGENTE", text: `${diffHours}h` };
  }
  if (diffHours <= 12) {
    return { status: "warning", label: "ATENÇÃO", text: `${diffHours}h` };
  }
  
  // Normal / Dias
  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24);
    return { status: "normal", label: "EM DIA", text: `${diffDays}d` };
  }

  return { status: "normal", label: "EM DIA", text: `${diffHours}h` };
}