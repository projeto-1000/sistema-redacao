"use server";

import { createClient } from "@/lib/server";
import { AverageTimeRange, GetTeachersFilters, TeacherChartData, TeacherListItem } from "../types";
import { revalidatePath } from "next/cache";

export async function getTeachers(
  filters: GetTeachersFilters,
  page: number = 1,
  limit: number = 10
) {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("teacher_stats_view")
    .select(`id, full_name, email, status, avatar_url, total, currentMonth`, { count: "exact" });

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, count, error } = await query
    .order("full_name", { ascending: true })
    .range(rangeStart, rangeEnd);

  if (error) {
    console.error("Erro ao buscar professores:", error);
    return { data: [], totalPages: 0 };
  }

  return {
    data: data as TeacherListItem[],
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

export async function getTeacherById(teacherId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from("profiles").select("*").eq("id", teacherId).single();

  if (error || !data) {
    console.error("Erro ao buscar detalhes do aluno:", error);
    return null;
  }

  return data;
}

export async function getTeacherStats(teacherId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_teacher_performance_stats", {
    p_teacher_id: teacherId,
  });

  if (error || !data) {
    console.error("Erro ao buscar estatísticas do professor:", error);
    return null;
  }

  const {
    total,
    total_on_time,
    total_late,
    current_month_total,
    current_month_on_time,
    current_month_late,
    last_month_total,
  } = data;

  let trendText = "Sem dados anteriores";
  let isPositiveTrend = true;

  if (last_month_total > 0) {
    const diff = current_month_total - last_month_total;
    const percentage = Math.round((diff / last_month_total) * 100);

    isPositiveTrend = percentage >= 0;
    const sign = isPositiveTrend ? "+" : "";
    trendText = `${sign}${percentage}% vs anterior`;
  } else if (current_month_total > 0 && last_month_total === 0) {
    trendText = "+100% vs anterior";
    isPositiveTrend = true;
  }

  return {
    monthStats: {
      total: current_month_total,
      onTime: current_month_on_time,
      late: current_month_late,
      trendText,
      isPositiveTrend,
    },
    totalStats: {
      total: total,
      onTime: total_on_time,
      late: total_late,
    },
  };
}

export async function updateTeacherStatus(teacherId: string, currentStatus: string) {
  const supabase = await createClient();

  const newStatus = currentStatus === "active" ? "blocked" : "active";

  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", teacherId)
    .eq("role", "TEACHER");

  if (error) {
    console.error("Erro ao alterar status do professor:", error.message);
    return { error: error.message };
  }

  revalidatePath("/professores");

  return { success: true };
}

export async function getTeacherChartsData(teacherId: string): Promise<TeacherChartData[] | null> {
  const supabase = await createClient();

  const { data: scoreData, error: scoreError } = await supabase.rpc(
    "get_teacher_score_distribution",
    {
      p_teacher_id: teacherId,
    }
  );

  if (scoreError) {
    console.error("Erro ao buscar dados de distribuição de notas:", scoreError);
    return null;
  }

  return scoreData;
}

export async function getAverageTime(teacherId: string, range: AverageTimeRange) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_teacher_average_time", {
    p_teacher_id: teacherId,
    p_range: range,
  });

  if (error) {
    console.error("Erro ao buscar tempo médio de correção:", error);
    return 0; // Fallback seguro
  }

  return data as number;
}
