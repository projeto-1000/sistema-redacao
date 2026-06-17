"use server";

import { GetStudentsFilters, StudentEssayItem, StudentsListItem } from "@/types";
import { createClient } from "@/lib/server";
import { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { CreditTransaction } from "@repo/types";
interface GetStudentsFiltersParams {
  filters?: GetStudentsFilters;
  page?: number;
  limit?: number;
}

interface GetStudentEssaysFiltersParams {
  studentId: string;
  filters?: GetStudentsFilters;
  page?: number;
  limit?: number;
}

export async function getStudents({
  filters,
  page = 1,
  limit = 10,
}: GetStudentsFiltersParams = {}): Promise<{
  students: StudentsListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase.from("profiles").select("*", { count: "exact" }).eq("role", "STUDENT");

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.from || filters?.to) {
    const startRange = filters.from ? new Date(filters.from) : new Date();
    const endRange = new Date(filters.to || (filters.from as string));

    endRange.setUTCHours(23, 59, 59, 999);

    query = query
      .gte("created_at", startRange.toISOString())
      .lte("created_at", endRange.toISOString());
  }

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar lista de alunos:", error);
    return { students: [], totalPages: 0, error };
  }

  return {
    students: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error,
  };
}

export async function getStudentById(studentId: string) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();

  if (profileError || !profile) {
    return {
      student: null,
      error: "Perfil não encontrado",
      hasSubscriptionError: false,
      hasCreditsError: false,
    };
  }

  const [subscriptionRes, creditsRes] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", studentId).maybeSingle(),
    supabase.from("student_credits").select("*").eq("user_id", studentId).maybeSingle(),
  ]);

  const hasSubscriptionError = !!subscriptionRes.error;
  const hasCreditsError = !!creditsRes.error;

  const subscription = subscriptionRes.data;
  const credits = creditsRes.data;

  if (hasSubscriptionError) {
    return {
      student: { ...profile, subscription: null, credits: null },
      error: null,
      hasSubscriptionError: true,
      hasCreditsError,
    };
  }

  if (!subscription) {
    return {
      student: { ...profile, subscription: null, credits: credits || null },
      error: null,
      hasSubscriptionError: false,
      hasCreditsError,
    };
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("name, credits_included, interval, interval_count, price")
    .eq("id", subscription.plan_id)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    return {
      student: { ...profile, subscription: null, credits: null },
      error: null,
      hasSubscriptionError: !!planError,
      hasCreditsError,
    };
  }

  return {
    student: {
      ...profile,
      subscription: {
        ...subscription,
        plan_name: plan.name,
        interval: plan.interval,
        interval_count: plan.interval_count,
        price: plan.price,
        credits_included: plan.credits_included,
      },
      credits: credits
        ? {
            ...credits,
            renew_date: subscription.current_period_end,
            total_credits: plan.credits_included,
          }
        : null,
    },
    error: null,
    hasSubscriptionError: false,
    hasCreditsError: hasCreditsError,
  };
}

export async function getStudentEssays({
  studentId,
  filters,
  page = 1,
  limit = 10,
}: GetStudentEssaysFiltersParams): Promise<{
  essays: StudentEssayItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("essays")
    .select(`id, title, thematic_axis, status, total_score, created_at`, { count: "exact" })
    .in("status", ["corrected", "correcting", "pending", "returned"])
    .eq("student_id", studentId);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.from || filters?.to) {
    const startRange = filters.from ? new Date(filters.from) : new Date();
    const endRange = new Date(filters.to || (filters.from as string));

    endRange.setUTCHours(23, 59, 59, 999);

    query = query
      .gte("created_at", startRange.toISOString())
      .lte("created_at", endRange.toISOString());
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) {
    console.error("Erro ao buscar redações do aluno:", error);
    return { essays: [], totalPages: 0, error };
  }

  return {
    essays: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: null,
  };
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

  revalidatePath("/alunos");
}

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
interface GetStudentCreditsHistoryParams {
  studentId: string;
  filters?: {
    type?: string;
    from?: string;
    to?: string;
  };
  page?: number;
  limit?: number;
}

export async function getStudentCreditsHistory({
  studentId,
  filters,
  page = 1,
  limit = 10,
}: GetStudentCreditsHistoryParams): Promise<{
  transactions: CreditTransaction[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("credit_transactions")
    .select("*", { count: "exact" })
    .eq("user_id", studentId);

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.from || filters?.to) {
    const startRange = filters.from ? new Date(filters.from) : new Date();
    const endRange = new Date(filters.to || (filters.from as string));

    endRange.setUTCHours(23, 59, 59, 999);

    query = query
      .gte("created_at", startRange.toISOString())
      .lte("created_at", endRange.toISOString());
  }

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar histórico de créditos:", error);
    return {
      transactions: [],
      totalPages: 0,
      error: error,
    };
  }

  return {
    transactions: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: null,
  };
}
