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
  sort?: "created_at" | "full_name" | "status";
  order?: "asc" | "desc";
}

interface GetStudentEssaysFiltersParams {
  studentId: string;
  filters?: GetStudentsFilters;
  page?: number;
  limit?: number;
}

const FULL_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_UUID_PATTERN = /^[0-9a-f]{8}$/i;

function getUuidPrefixRange(prefix: string) {
  return {
    start: `${prefix}-0000-0000-0000-000000000000`,
    end: `${prefix}-ffff-ffff-ffff-ffffffffffff`,
  };
}

function getPlanFilterLabel(name: string) {
  return name.replace(/^Plano\s+/i, "");
}

export async function getStudentPlanFilterOptions(): Promise<{ label: string; value: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("plans").select("name").order("name");

  if (error) {
    console.error("Erro ao buscar opções de planos dos alunos:", error);
    return [];
  }

  const uniquePlanNames = [...new Set((data ?? []).map((plan) => plan.name))];

  return uniquePlanNames
    .map((name) => ({ label: getPlanFilterLabel(name), value: name }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export async function getStudents({
  filters,
  page = 1,
  limit = 10,
  sort = "created_at",
  order = "desc",
}: GetStudentsFiltersParams = {}): Promise<{
  students: StudentsListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        email,
        avatar_url,
        status,
        created_at,
        subscriptions!subscriptions_user_id_fkey (
          status,
          plan_id,
          current_period_start,
          current_period_end,
          plans!subscriptions_plan_id_fkey (
            name,
            interval,
            interval_count
          )
        )
      `,
      { count: "exact" }
    )
    .eq("role", "STUDENT");

  if (filters?.search) {
    const search = filters.search.trim();

    if (FULL_UUID_PATTERN.test(search)) {
      query = query.eq("id", search);
    } else if (SHORT_UUID_PATTERN.test(search)) {
      const { start, end } = getUuidPrefixRange(search.toLowerCase());
      query = query.gte("id", start).lte("id", end);
    } else {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
  }

  if (filters?.status && filters.status !== "all") {
    if (filters.status === "blocked") {
      query = query.eq("status", "blocked");
    } else if (filters.status === "no_plan") {
      query = query.neq("status", "blocked").is("subscriptions", null);
    } else if (
      filters.status === "plan_active" ||
      filters.status === "past_due" ||
      filters.status === "canceled"
    ) {
      const subscriptionStatuses =
        filters.status === "plan_active"
          ? ["active", "trial"]
          : filters.status === "past_due"
            ? ["past_due", "unpaid"]
            : ["canceled"];

      query = query
        .neq("status", "blocked")
        .in("subscriptions.status", subscriptionStatuses)
        .not("subscriptions", "is", null);
    }
  }

  if (filters?.plan && filters.plan !== "all") {
    if (filters.status === "no_plan") {
      return { students: [], totalPages: 0, error: null };
    }

    query = query
      .eq("subscriptions.plans.name", filters.plan)
      .not("subscriptions.plans", "is", null)
      .not("subscriptions", "is", null);
  }

  if (filters?.from || filters?.to) {
    const startRange = filters.from ? new Date(filters.from) : new Date();

    const endRange = new Date(filters.to || (filters.from as string));

    endRange.setUTCHours(23, 59, 59, 999);

    query = query
      .gte("created_at", startRange.toISOString())
      .lte("created_at", endRange.toISOString());
  }

  const allowedSortFields = ["created_at", "full_name", "status"] as const;

  const sortField = allowedSortFields.includes(sort as (typeof allowedSortFields)[number])
    ? sort
    : "created_at";

  const {
    data: profiles,
    count,
    error: profilesError,
  } = await query.order(sortField, { ascending: order === "asc" }).range(rangeStart, rangeEnd);

  if (profilesError) {
    console.error("Erro ao buscar lista de alunos:", profilesError);

    return {
      students: [],
      totalPages: 0,
      error: profilesError,
    };
  }

  if (!profiles?.length) {
    return {
      students: [],
      totalPages: count ? Math.ceil(count / limit) : 0,
      error: null,
    };
  }

  const studentIds = profiles.map((student) => student.id);
  const now = new Date().toISOString();

  const [creditsRes, mentorshipCreditsRes, activityRes] = await Promise.all([
    supabase
      .from("student_credits")
      .select(
        `
        user_id,
        plan_credits,
        extra_credits,
        free_credits
      `
      )
      .in("user_id", studentIds),

    supabase
      .from("mentorship_credit_allocations")
      .select(
        `
        user_id,
        remaining_amount
      `
      )
      .in("user_id", studentIds)
      .eq("status", "active")
      .lte("available_at", now)
      .gt("expires_at", now),

    supabase
      .from("profiles")
      .select(
        `
          id,
          latest_submission:essays!essays_student_id_fkey (
            status,
            submission_date
          ),
          latest_correction:essays!essays_student_id_fkey (
            correction_date
          )
        `
      )
      .in("id", studentIds)
      .in("latest_submission.status", ["pending", "correcting", "corrected", "returned"])
      .order("submission_date", { referencedTable: "latest_submission", ascending: false })
      .limit(1, { referencedTable: "latest_submission" })
      .not("latest_correction.correction_date", "is", null)
      .order("correction_date", { referencedTable: "latest_correction", ascending: false })
      .limit(1, { referencedTable: "latest_correction" }),
  ]);

  const relatedError = creditsRes.error || mentorshipCreditsRes.error || activityRes.error;

  if (relatedError) {
    console.error("Erro ao buscar dados complementares dos alunos:", relatedError);

    return {
      students: [],
      totalPages: count ? Math.ceil(count / limit) : 0,
      error: relatedError,
    };
  }

  const creditsByUser = new Map(
    (creditsRes.data ?? []).map((credits) => [credits.user_id, credits])
  );

  const mentorshipCreditsByUser = new Map<string, number>();

  for (const allocation of mentorshipCreditsRes.data ?? []) {
    const current = mentorshipCreditsByUser.get(allocation.user_id) ?? 0;

    mentorshipCreditsByUser.set(allocation.user_id, current + allocation.remaining_amount);
  }

  const activitiesByUser = new Map<string, StudentsListItem["last_activity"]>(
    (activityRes.data ?? []).map((profile) => {
      const latestSubmission = Array.isArray(profile.latest_submission)
        ? profile.latest_submission[0]
        : profile.latest_submission;
      const latestCorrection = Array.isArray(profile.latest_correction)
        ? profile.latest_correction[0]
        : profile.latest_correction;
      const submissionDate = latestSubmission?.submission_date ?? null;
      const correctionDate = latestCorrection?.correction_date ?? null;

      if (correctionDate && (!submissionDate || correctionDate > submissionDate)) {
        return [profile.id, { date: correctionDate, type: "correction" as const }] as const;
      }

      return [
        profile.id,
        submissionDate ? { date: submissionDate, type: "submission" as const } : null,
      ] as const;
    })
  );

  const students: StudentsListItem[] = profiles.map((profile) => {
    const subscription = Array.isArray(profile.subscriptions)
      ? profile.subscriptions[0]
      : profile.subscriptions;
    const credits = creditsByUser.get(profile.id);

    const plan = Array.isArray(subscription?.plans) ? subscription.plans[0] : subscription?.plans;

    return {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      status: profile.status,
      created_at: profile.created_at,

      plan: plan
        ? {
            name: plan.name,
            interval: plan.interval,
            interval_count: plan.interval_count,
          }
        : null,

      subscription: subscription
        ? {
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
          }
        : null,

      credits: {
        plan: credits?.plan_credits ?? 0,
        extra: credits?.extra_credits ?? 0,
        free: credits?.free_credits ?? 0,
        mentorship: mentorshipCreditsByUser.get(profile.id) ?? 0,
      },

      last_activity: activitiesByUser.get(profile.id) ?? null,
    };
  });

  return {
    students,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: null,
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

  const now = new Date().toISOString();

  const [subscriptionRes, creditsRes, freeCreditsRes, mentorshipCreditsRes] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", studentId).maybeSingle(),

    supabase.from("student_credits").select("*").eq("user_id", studentId).maybeSingle(),

    supabase
      .from("free_credit_allocations")
      .select("remaining_amount, expires_at")
      .eq("user_id", studentId)
      .eq("status", "active")
      .gt("remaining_amount", 0)
      .gt("expires_at", now)
      .order("expires_at", { ascending: true }),

    supabase
      .from("mentorship_credit_allocations")
      .select("remaining_amount, expires_at")
      .eq("user_id", studentId)
      .eq("status", "active")
      .lte("available_at", now)
      .gt("expires_at", now)
      .gt("remaining_amount", 0)
      .order("expires_at", { ascending: true }),
  ]);

  const hasSubscriptionError = !!subscriptionRes.error;
  const hasCreditsError =
    !!creditsRes.error || !!freeCreditsRes.error || !!mentorshipCreditsRes.error;

  const subscription = subscriptionRes.data;
  const credits = creditsRes.data;
  const freeCredits = (freeCreditsRes.data ?? []).reduce(
    (total, allocation) => total + allocation.remaining_amount,
    0
  );

  const freeCreditExpiresAt = freeCreditsRes.data?.[0]?.expires_at ?? null;

  const mentorshipCredits = (mentorshipCreditsRes.data ?? []).reduce(
    (total, allocation) => total + allocation.remaining_amount,
    0
  );

  const mentorshipCreditExpiresAt = mentorshipCreditsRes.data?.[0]?.expires_at ?? null;

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
      student: {
        ...profile,
        subscription: null,
        credits: credits
          ? {
              ...credits,
              mentorship_credits: mentorshipCredits,
              renew_date: null,
              total_credits: 0,
            }
          : null,
      },
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
            free_credits: freeCredits,
            free_credit_expires_at: freeCreditExpiresAt,
            mentorship_credits: mentorshipCredits,
            mentorship_credit_expires_at: mentorshipCreditExpiresAt,
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
