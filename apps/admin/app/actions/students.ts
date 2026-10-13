"use server";

import { GetStudentsFilters, StudentEssayItem, StudentsListItem } from "@/types";
import { createClient } from "@/lib/server";
import { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { CreditTransaction } from "@repo/types";
import { updateStudentProfileSchema, type UpdateStudentProfileInput } from "@repo/validators";
import { onlyDigits } from "@repo/utils";
import { updatePagarmeCustomer } from "@repo/payments";
import { sendStudentPasswordRecoveryEmail } from "@repo/email";
import { createAdminClient } from "@/lib/admin";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { randomUUID } from "node:crypto";
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
          cancel_at_period_end,
          cancellation_mode,
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
      filters.status === "cancellation_scheduled" ||
      filters.status === "past_due" ||
      filters.status === "canceled"
    ) {
      const subscriptionStatuses =
        filters.status === "plan_active" || filters.status === "cancellation_scheduled"
          ? ["active", "trial"]
          : filters.status === "past_due"
            ? ["past_due", "unpaid"]
            : ["canceled"];

      query = query
        .neq("status", "blocked")
        .in("subscriptions.status", subscriptionStatuses)
        .not("subscriptions", "is", null);
      if (filters.status === "cancellation_scheduled") {
        query = query
          .eq("subscriptions.cancel_at_period_end", true)
          .eq("subscriptions.cancellation_mode", "end_of_period");
      } else if (filters.status === "plan_active") {
        query = query.eq("subscriptions.cancel_at_period_end", false);
      }
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

  const [creditsRes, freeCreditsRes, mentorshipCreditsRes, activityRes] = await Promise.all([
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
      .from("free_credit_allocations")
      .select("user_id, expires_at")
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

  const relatedError =
    creditsRes.error || freeCreditsRes.error || mentorshipCreditsRes.error || activityRes.error;

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

  const freeCreditExpirationByUser = new Map(
    (freeCreditsRes.data ?? []).map((allocation) => [allocation.user_id, allocation.expires_at])
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
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancellation_mode: subscription.cancellation_mode,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
          }
        : null,

      credits: {
        plan: credits?.plan_credits ?? 0,
        extra: credits?.extra_credits ?? 0,
        free: credits?.free_credits ?? 0,
        freeExpiresAt: freeCreditExpirationByUser.get(profile.id) ?? null,
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

  const { data, error } = await supabase.rpc("set_student_status_by_admin", {
    p_operation_id: randomUUID(),
    p_student_id: studentId,
    p_status: newStatus,
  });

  if (error) {
    console.error("❌ ERRO DO SUPABASE:", error.message, error.details);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Aluno não encontrado.");
  }

  revalidatePath("/alunos");
  revalidatePath(`/alunos/${studentId}`);
}

export async function updateStudentProfile(
  studentId: string,
  input: UpdateStudentProfileInput
): Promise<{ success: boolean; error?: string }> {
  const parsed = updateStudentProfileSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Revise os dados informados antes de salvar." };
  }

  const supabase = await createClient();
  const { data: role, error: roleError } = await supabase.rpc("get_my_role");

  if (roleError || role !== "ADMIN") {
    return { success: false, error: "Apenas administradores podem editar alunos." };
  }

  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("id,full_name,phone,phone_country_code,pagarme_customer_id")
    .eq("id", studentId)
    .eq("role", "STUDENT")
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: "Aluno não encontrado." };
  }

  const fullName = parsed.data.full_name.trim();
  const phone = onlyDigits(parsed.data.phone);
  const operationId = randomUUID();
  const changed = student.full_name !== fullName || student.phone !== phone;

  if (!changed) return { success: true };

  if (student.pagarme_customer_id) {
    try {
      await updatePagarmeCustomer({
        customerId: student.pagarme_customer_id,
        name: fullName,
        phoneCountryCode: student.phone_country_code || "55",
        phone,
      });
    } catch (error) {
      console.error("Erro ao sincronizar aluno com a Pagar.me:", error);

      try {
        await recordAdminAuditEvent({
          operationId,
          action: "student.profile_update_failed",
          resourceType: "student_profile",
          resourceId: studentId,
          subjectId: studentId,
          status: "failure",
          summary: "Atualização do aluno não concluída por falha de sincronização",
          metadata: { provider: "pagarme" },
        });
      } catch (auditError) {
        console.error("Erro ao registrar falha administrativa:", auditError);
      }

      return {
        success: false,
        error: "A Pagar.me não confirmou a atualização. Nenhum dado local foi alterado.",
      };
    }
  }

  const { error: updateError } = await supabase.rpc("update_student_profile_by_admin", {
    p_operation_id: operationId,
    p_student_id: studentId,
    p_full_name: fullName,
    p_phone: phone,
  });

  if (updateError) {
    console.error("Erro ao atualizar aluno após sincronização:", updateError);

    if (student.pagarme_customer_id) {
      try {
        await recordAdminAuditEvent({
          operationId,
          action: "student.profile_update_operational_issue",
          resourceType: "student_profile",
          resourceId: studentId,
          subjectId: studentId,
          status: "operational_issue",
          summary: "Cadastro externo atualizado, mas atualização local não concluída",
          metadata: { provider: "pagarme", provider_synced: true },
        });
      } catch (auditError) {
        console.error("Erro ao registrar divergência cadastral:", auditError);
      }
    }

    return {
      success: false,
      error: student.pagarme_customer_id
        ? "A Pagar.me foi atualizada, mas o cadastro local não. Tente salvar novamente."
        : "Não foi possível atualizar o aluno.",
    };
  }

  revalidatePath("/alunos");
  revalidatePath(`/alunos/${studentId}`);
  revalidatePath("/atividades-administrativas");

  return { success: true };
}

function getStudentsAppOrigin() {
  const configured = process.env.NEXT_PUBLIC_STUDENTS_APP_URL;
  if (!configured) return null;

  try {
    const url = new URL(configured);
    const isLocal = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !isLocal) return null;
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function sendStudentPasswordReset(studentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: role, error: roleError } = await supabase.rpc("get_my_role");

  if (roleError || role !== "ADMIN") {
    return { success: false, error: "Apenas administradores podem enviar esta solicitação." };
  }

  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("id,email,full_name")
    .eq("id", studentId)
    .eq("role", "STUDENT")
    .maybeSingle();

  if (studentError || !student) {
    return { success: false, error: "Aluno não encontrado." };
  }

  const cooldownStart = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count: recentResetCount, error: cooldownError } = await supabase
    .from("admin_audit_events")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", studentId)
    .eq("action", "student.password_reset_requested")
    .gte("created_at", cooldownStart);

  if (cooldownError) {
    return {
      success: false,
      error: "Não foi possível verificar os envios recentes. Tente novamente.",
    };
  }

  if ((recentResetCount ?? 0) > 0) {
    return {
      success: false,
      error: "Um e-mail de redefinição já foi enviado nos últimos 5 minutos.",
    };
  }

  const studentsOrigin = getStudentsAppOrigin();
  if (!studentsOrigin) {
    return { success: false, error: "A URL do aplicativo de alunos não está configurada." };
  }

  let tokenHash: string | undefined;

  try {
    const { data: recoveryLink, error: linkError } =
      await createAdminClient().auth.admin.generateLink({
        type: "recovery",
        email: student.email,
      });

    if (linkError) throw linkError;
    tokenHash = recoveryLink?.properties?.hashed_token;
  } catch (linkError) {
    console.error("Erro ao gerar link de reset do aluno:", linkError);
  }

  if (!tokenHash) {
    return { success: false, error: "Não foi possível enviar o e-mail de redefinição." };
  }

  const resetPasswordUrl = new URL("/api/auth/confirm", studentsOrigin);
  resetPasswordUrl.searchParams.set("token_hash", tokenHash);
  resetPasswordUrl.searchParams.set("type", "recovery");
  resetPasswordUrl.searchParams.set("next", "/nova-senha?flow=reset");

  try {
    await sendStudentPasswordRecoveryEmail({
      to: student.email,
      studentName: student.full_name,
      resetPasswordUrl: resetPasswordUrl.toString(),
    });
  } catch (emailError) {
    console.error("Erro ao enviar reset de senha do aluno:", emailError);
    return { success: false, error: "Não foi possível enviar o e-mail de redefinição." };
  }

  try {
    await recordAdminAuditEvent({
      action: "student.password_reset_requested",
      resourceType: "student_profile",
      resourceId: studentId,
      subjectId: studentId,
      summary: "E-mail de redefinição de senha enviado ao aluno",
    });
  } catch (error) {
    console.error("Reset enviado sem registro administrativo:", error);
    return {
      success: false,
      error: "O e-mail foi enviado, mas o registro administrativo falhou.",
    };
  }

  revalidatePath("/atividades-administrativas");
  return { success: true };
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
    .select("total_score, status, created_at, submission_date, correction_date")
    .eq("student_id", studentId)
    .in("status", ["corrected", "correcting", "pending", "returned"])
    .order("created_at", { ascending: false });

  const defaultStats = {
    totalEssays: 0,
    averageScore: 0,
    lastScore: "--" as string | number,
    lastScoreTime: "Sem histórico",
    totalTrend: "0 este mês",
    averageTrend: "0% vs mês passado",
    submittedThisMonth: 0,
    percentChange: 0,
    averageCorrectionTime: "--",
    averageCorrectionTimeDetail: "Sem correções",
    lastLoginValue: "Sem acesso",
    lastLoginDetail: "—",
    lastActivityValue: "Sem atividade",
    lastActivityDetail: "—",
  };

  let lastSignInAt: string | null = null;

  try {
    const { data } = await createAdminClient().auth.admin.getUserById(studentId);
    lastSignInAt = data.user?.last_sign_in_at ?? null;
  } catch (loginError) {
    console.error("Erro ao buscar último login do aluno:", loginError);
  }

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    const todayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const time = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    if (dateKey === todayKey) return `Hoje, ${time}`;

    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatRelative = (value: string) => {
    const diffMinutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
    const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
    if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
    return rtf.format(Math.round(diffHours / 24), "day");
  };

  const loginStats = lastSignInAt
    ? {
        lastLoginValue: formatDateTime(lastSignInAt),
        lastLoginDetail: formatRelative(lastSignInAt),
      }
    : {
        lastLoginValue: "Sem acesso",
        lastLoginDetail: "—",
      };

  if (error || !essays || essays.length === 0) {
    return { ...defaultStats, ...loginStats };
  }

  const totalEssays = essays.length;
  const gradedEssays = essays
    .filter((essay) => essay.status === "corrected")
    .sort(
      (first, second) =>
        new Date(second.correction_date ?? second.created_at).getTime() -
        new Date(first.correction_date ?? first.created_at).getTime()
    );

  let averageScore = 0;
  let lastScore: string | number = "--";
  let lastScoreTime = "Sem correções";

  if (gradedEssays.length > 0) {
    const totalScore = gradedEssays.reduce((acc, curr) => acc + (Number(curr.total_score) || 0), 0);
    averageScore = Math.round(totalScore / gradedEssays.length);

    const lastGraded = gradedEssays[0];
    lastScore = lastGraded?.total_score || "--";

    if (lastGraded?.correction_date) {
      const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
      const diffInMs = new Date(lastGraded.correction_date).getTime() - new Date().getTime();
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
    if (!e.submission_date) return false;
    const d = new Date(e.submission_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const totalTrend = submittedThisMonth > 0 ? `+${submittedThisMonth} este mês` : "0 este mês";

  const getAverageForMonth = (month: number, year: number) => {
    const monthGraded = gradedEssays.filter((e) => {
      if (!e.correction_date) return false;
      const d = new Date(e.correction_date);
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

  const correctionDurations = gradedEssays
    .filter((essay) => essay.submission_date && essay.correction_date)
    .slice(0, 5)
    .map(
      (essay) =>
        new Date(essay.correction_date as string).getTime() -
        new Date(essay.submission_date as string).getTime()
    )
    .filter((duration) => duration >= 0);

  let averageCorrectionTime = "--";
  let averageCorrectionTimeDetail = "Sem correções";

  if (correctionDurations.length > 0) {
    const averageMinutes = Math.round(
      correctionDurations.reduce((total, duration) => total + duration, 0) /
        correctionDurations.length /
        60000
    );
    const hours = Math.floor(averageMinutes / 60);
    const minutes = averageMinutes % 60;
    averageCorrectionTime = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    averageCorrectionTimeDetail = `últimas ${correctionDurations.length} correções`;
  }

  const latestSubmission = essays
    .filter((essay) => essay.submission_date)
    .sort(
      (first, second) =>
        new Date(second.submission_date as string).getTime() -
        new Date(first.submission_date as string).getTime()
    )[0]?.submission_date;
  const latestCorrection = essays
    .filter((essay) => essay.correction_date)
    .sort(
      (first, second) =>
        new Date(second.correction_date as string).getTime() -
        new Date(first.correction_date as string).getTime()
    )[0]?.correction_date;
  const correctionIsLatest =
    Boolean(latestCorrection) &&
    (!latestSubmission ||
      new Date(latestCorrection as string).getTime() > new Date(latestSubmission).getTime());
  const lastActivityAt = correctionIsLatest ? latestCorrection : latestSubmission;
  const activityStats = lastActivityAt
    ? {
        lastActivityValue: correctionIsLatest ? "Correção recebida" : "Redação enviada",
        lastActivityDetail: formatDateTime(lastActivityAt),
      }
    : {
        lastActivityValue: "Sem atividade",
        lastActivityDetail: "—",
      };

  return {
    totalEssays,
    averageScore,
    lastScore,
    lastScoreTime,
    submittedThisMonth,
    totalTrend,
    percentChange,
    averageTrend,
    averageCorrectionTime,
    averageCorrectionTimeDetail,
    ...loginStats,
    ...activityStats,
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
