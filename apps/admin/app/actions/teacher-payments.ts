"use server";

import { createClient } from "@/lib/server";
import { PaymentMetrics, PeriodEssay } from "@/types";
import { getTeacherEssays } from "./teachers";
import { endOfMonth, getDaysInMonth, parseISO, startOfMonth } from "date-fns";

/**
 * Calcula as métricas de faturamento DELEGANDO a contagem para o PostgreSQL.
 */
export async function getPaymentMetrics(
  teacherId: string,
  monthStr?: string
): Promise<PaymentMetrics> {
  const supabase = await createClient();

  // 1. Resolvemos as datas de forma limpa na camada correta
  const refDate = monthStr ? parseISO(`${monthStr}-01`) : new Date();
  const start = startOfMonth(refDate).toISOString();
  const end = endOfMonth(refDate).toISOString();
  // QUERY 1: Contagem Total (head: true para máxima performance)
  const totalQuery = supabase
    .from("essays_with_delivery")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", teacherId)
    .gte("correction_date", start)
    .lte("correction_date", end);

  // QUERY 2: Contagem de Atrasadas
  const delayedQuery = supabase
    .from("essays_with_delivery")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", teacherId)
    .eq("is_on_late", true)
    .gte("correction_date", start)
    .lte("correction_date", end);

  const [totalResult, delayedResult] = await Promise.all([totalQuery, delayedQuery]);

  if (totalResult.error || delayedResult.error) {
    console.error("Erro ao calcular métricas no banco:", totalResult.error || delayedResult.error);
    return {
      totalEssays: 0,
      onTime: 0,
      delayed: 0,
      valuePerCorrection: 0,
      dailyAverage: 0,
      totalAmount: 0,
      status: "pending",
    };
  }

  const totalEssays = totalResult.count || 0;
  const delayed = delayedResult.count || 0;
  const onTime = totalEssays - delayed;

  const valuePerCorrection = 10.0;
  const totalAmount = totalEssays * valuePerCorrection;

  const diffDays = getDaysInMonth(refDate);
  const dailyAverage = totalEssays > 0 ? Number((totalEssays / diffDays).toFixed(1)) : 0;

  return {
    totalEssays,
    onTime,
    delayed,
    valuePerCorrection,
    dailyAverage,
    totalAmount,
    status: "pending",
  };
}

/**
 * Busca as redações do período consumindo a view oficial do sistema
 * e adapta os dados para o formato esperado pelo Modal de Faturamento.
 */
export async function getEssaysByPeriod(
  teacherId: string,
  startDate?: string,
  endDate?: string
): Promise<PeriodEssay[]> {
  const { essays, error } = await getTeacherEssays({
    teacherId,
    page: 1,
    limit: 1000,
    filters: {
      from: startDate,
      to: endDate,
    },
  });

  if (error || !essays) {
    console.error("Erro ao buscar redações do período:", error);
    return [];
  }

  return essays.map((essay) => {
    const studentName = essay.student_name || "Aluno";
    const avatarUrl =
      essay.student_avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=eff6ff&color=1d4ed8`;

    // Usando due_date como fallback para submissão, já que created_at não vem na query atual
    const subDate = essay.due_date
      ? new Date(essay.due_date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
      : "--/--/----";

    const corDate = essay.correction_date
      ? new Date(essay.correction_date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
      : "--/--/----";

    return {
      id: essay.id,
      student: essay.student_name || "Aluno Excluído",
      avatar: avatarUrl,
      title: essay.title || "Redação sem título",
      subDate: subDate,
      corDate: corDate,
      score: essay.total_score || 0,
      status: essay.is_on_late ? "Atrasado" : "No Prazo",
    };
  });
}
