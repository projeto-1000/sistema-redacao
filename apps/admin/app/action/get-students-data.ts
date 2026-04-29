"use server";

import { createClient } from "@/lib/server";
import { GetStudentsFilters, StudentsListItem } from "@/app/types";
import { revalidatePath } from "next/cache";

export async function getStudentsCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "STUDENT");

  if (error) {
    console.error("Erro ao contar alunos:", error);
    return 0;
  }

  return count || 0;
}

export async function getStudentsList(
  filters?: GetStudentsFilters,
  page: number = 1,
  limit: number = 10
): Promise<{ data: StudentsListItem[]; totalPages: number }> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("profiles")
    .select(`id, full_name, email, status, avatar_url`, { count: "exact" })
    .eq("role", "STUDENT");

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // if (filters?.plan && filters.plan !== "all") {
  //   query = query.eq("plan", filters.plan);
  // }

  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }

  if (filters?.to) {
    query = query.lte("created_at", filters.to);
  }

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar lista de alunos:", error);
    return { data: [], totalPages: 0 };
  }

  return {
    data: data as StudentsListItem[],
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

export async function getStudentById(studentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.from("profiles").select("*").eq("id", studentId).single();

  if (error || !data) {
    console.error("Erro ao buscar detalhes do aluno:", error);
    return null;
  }

  return data;
}

export async function updateStudentStatus(studentId: string, currentStatus: string) {
  const supabase = await createClient();
  const newStatus = currentStatus === "active" ? "blocked" : "active";

  const { data, error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", studentId)
    .select();

  if (error) {
    console.error("❌ ERRO DO SUPABASE:", error.message, error.details);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    console.error("❌ ERRO RLS: Nenhuma linha foi atualizada. Verifique as políticas do Supabase!");
    throw new Error("Bloqueado por RLS ou aluno não encontrado.");
  }

  console.log("✅ Atualizado com sucesso no banco:", data);
  revalidatePath("/alunos");
}

export async function getStudentStats(studentId: string) {
  const supabase = await createClient();

  const { data: essays, error } = await supabase
    .from("essays")
    .select("total_score, status, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  //TODO: melhorar aqui
  const defaultStats = {
    totalEssays: 0,
    averageScore: 0,
    lastScore: "--" as string | number,
    lastScoreTime: "Sem histórico",
    totalTrend: "0 este mês",
    averageTrend: "0% vs mês passado",
    submittedThisMonth: 0,
    percentChange: 0,
  };

  if (error || !essays || essays.length === 0) {
    return defaultStats;
  }

  const totalEssays = essays.length;
  const gradedEssays = essays.filter((e) => e.status === "done");

  let averageScore = 0;
  let lastScore: string | number = "--";
  let lastScoreTime = "Sem correções";

  if (gradedEssays.length > 0) {
    const totalScore = gradedEssays.reduce((acc, curr) => acc + (Number(curr.total_score) || 0), 0);
    averageScore = Math.round(totalScore / gradedEssays.length);

    const lastGraded = gradedEssays[0];
    lastScore = lastGraded?.total_score || "--";

    if (lastGraded?.created_at) {
      const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
      const diffInMs = new Date(lastGraded.created_at).getTime() - new Date().getTime();
      const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

      lastScoreTime = diffInDays === 0 ? "Hoje" : rtf.format(diffInDays, "day");
    }
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }

  const submittedThisMonth = essays.filter((e) => {
    if (!e.created_at) return false;
    const d = new Date(e.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const totalTrend = submittedThisMonth > 0 ? `+${submittedThisMonth} este mês` : "0 este mês";

  const getAverageForMonth = (month: number, year: number) => {
    const monthGraded = gradedEssays.filter((e) => {
      if (!e.created_at) return false;
      const d = new Date(e.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    if (monthGraded.length === 0) return 0;
    const sum = monthGraded.reduce((acc, curr) => acc + (Number(curr.total_score) || 0), 0);
    return sum / monthGraded.length;
  };

  const currentMonthAvg = getAverageForMonth(currentMonth, currentYear);
  const prevMonthAvg = getAverageForMonth(prevMonth, prevYear);

  let averageTrend = "Sem notas recentes";
  let percentChange;

  if (prevMonthAvg === 0 && currentMonthAvg > 0) {
    averageTrend = "Sem nota no mês anterior";
  } else if (prevMonthAvg > 0 && currentMonthAvg === 0) {
    averageTrend = "Nenhuma redação este mês";
  } else if (prevMonthAvg > 0 && currentMonthAvg > 0) {
    const diff = currentMonthAvg - prevMonthAvg;
    percentChange = Math.round((diff / prevMonthAvg) * 100);

    if (percentChange === 0) {
      averageTrend = "Média mantida";
    } else if (percentChange > 0) {
      averageTrend = `+${percentChange}% vs mês passado`;
    } else {
      averageTrend = `${percentChange}% vs mês passado`;
    }
  }

  return {
    totalEssays,
    averageScore,
    lastScore,
    lastScoreTime,
    submittedThisMonth,
    totalTrend,
    percentChange,
    averageTrend,
  };
}

export async function getStudentEssays(
  studentId: string,
  page: number = 1,
  limit: number = 5,
  statusFilter: "all" | "done" | "pending" = "all",
  dateFilter?: string
) {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("essays")
    .select(`id, title, thematic_axis, status, total_score, created_at`, { count: "exact" })
    .eq("student_id", studentId);

  if (statusFilter === "done") {
    query = query.eq("status", "done");
  } else if (statusFilter === "pending") {
    query = query.eq("status", "pending");
  }

  if (dateFilter) {
    const startOfDay = `${dateFilter}T00:00:00.000Z`;
    const endOfDay = `${dateFilter}T23:59:59.999Z`;
    query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) {
    console.error("Erro ao buscar redações do aluno:", error);
    return { data: [], totalPages: 0 };
  }

  const formattedData = data.map((essay) => ({
    id: essay.id,
    title: essay.title,
    theme: essay.thematic_axis,
    date: new Date(essay.created_at).toLocaleDateString("pt-BR"),
    status: essay.status === "done" ? "Corrigido" : "Pendente",
    score: essay.total_score > 0 ? essay.total_score : "--",
  }));

  return {
    data: formattedData,
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}
