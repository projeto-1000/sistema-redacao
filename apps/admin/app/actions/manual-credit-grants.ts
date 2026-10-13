"use server";

import { createClient } from "@/lib/server";
import type { ManualCreditGrantContext } from "@repo/types";
import { manualCreditGrantSchema, type ManualCreditGrantInput } from "@repo/validators";
import { getSubscriptionAccessEnd } from "@repo/utils";
import { revalidatePath } from "next/cache";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(client: SupabaseClient) {
  const [userResult, roleResult] = await Promise.all([
    client.auth.getUser(),
    client.rpc("get_my_role"),
  ]);

  const user = userResult.data.user;
  if (userResult.error || !user || roleResult.error || roleResult.data !== "ADMIN") {
    throw new Error("Sessão administrativa inválida.");
  }

  return user;
}

function isFutureDate(value: string | null) {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time > Date.now();
}

export async function getManualCreditGrantContext(
  studentId: string
): Promise<ManualCreditGrantContext> {
  const client = await createClient();
  await requireAdmin(client);

  const now = new Date().toISOString();
  const [profileResult, creditsResult, subscriptionResult, mentorshipResult, supportResult] =
    await Promise.all([
      client.from("profiles").select("id,full_name,role,status").eq("id", studentId).single(),
      client
        .from("student_credits")
        .select("plan_credits,extra_credits")
        .eq("user_id", studentId)
        .maybeSingle(),
      client
        .from("subscriptions")
        .select("id,plan_id,status,current_period_end,withdrawal_status")
        .eq("user_id", studentId)
        .maybeSingle(),
      client
        .from("mentorship_credit_allocations")
        .select("remaining_amount,expires_at")
        .eq("user_id", studentId)
        .in("status", ["active", "consumed"])
        .lte("available_at", now)
        .gt("expires_at", now)
        .order("expires_at", { ascending: true }),
      client
        .from("subscription_support_operations")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .neq("status", "completed"),
    ]);

  if (profileResult.error || !profileResult.data || profileResult.data.role !== "STUDENT") {
    throw new Error("Aluno não encontrado.");
  }

  if (
    creditsResult.error ||
    subscriptionResult.error ||
    mentorshipResult.error ||
    supportResult.error
  ) {
    throw new Error("Não foi possível consultar a disponibilidade dos créditos.");
  }

  const profile = profileResult.data;
  const blocked = profile.status === "blocked";
  const subscription = subscriptionResult.data;
  const mentorshipAllocations = mentorshipResult.data ?? [];
  const mentorshipExpiresAt = mentorshipAllocations[0]?.expires_at ?? null;
  const mentorshipBalance = mentorshipAllocations.reduce(
    (total, allocation) => total + allocation.remaining_amount,
    0
  );

  let planAvailable = false;
  let planExpiresAt: string | null = null;
  let planUnavailableReason = "O aluno não possui um ciclo vigente de plano pago.";

  if (subscription) {
    const planResult = await client
      .from("plans")
      .select("external_id,price")
      .eq("id", subscription.plan_id)
      .maybeSingle();

    if (planResult.error) {
      throw new Error("Não foi possível consultar o plano do aluno.");
    }

    const plan = planResult.data;
    const accessEnd = subscription.current_period_end
      ? getSubscriptionAccessEnd(subscription.current_period_end)
      : null;
    const hasSupportInProgress = (supportResult.count ?? 0) > 0;
    const isPaidPlan =
      Boolean(plan) &&
      (plan?.price ?? 0) > 0 &&
      !["internal_free_trial", "internal_mentoria_free"].includes(plan?.external_id ?? "");

    planAvailable =
      ["active", "trial"].includes(subscription.status) &&
      isPaidPlan &&
      isFutureDate(accessEnd) &&
      !subscription.withdrawal_status &&
      !hasSupportInProgress;

    if (planAvailable) {
      planExpiresAt = accessEnd;
      planUnavailableReason = "";
    } else if (subscription.withdrawal_status || hasSupportInProgress) {
      planUnavailableReason = "O plano possui um atendimento em andamento.";
    }
  }

  const blockedReason = "A conta do aluno está bloqueada.";

  return {
    studentId,
    studentName: profile.full_name?.trim() || "Aluno sem nome",
    blocked,
    balances: {
      mentorship: mentorshipBalance,
      plan: creditsResult.data?.plan_credits ?? 0,
      extra: creditsResult.data?.extra_credits ?? 0,
    },
    options: {
      mentorship: {
        available: !blocked && Boolean(mentorshipExpiresAt),
        expiresAt: mentorshipExpiresAt,
        unavailableReason: blocked
          ? blockedReason
          : mentorshipExpiresAt
            ? null
            : "O aluno não possui um ciclo vigente de mentoria.",
      },
      plan: {
        available: !blocked && planAvailable,
        expiresAt: planExpiresAt,
        unavailableReason: blocked ? blockedReason : planUnavailableReason || null,
      },
      extra: {
        available: !blocked,
        expiresAt: null,
        unavailableReason: blocked ? blockedReason : null,
      },
    },
  };
}

export async function grantManualCredits(input: ManualCreditGrantInput) {
  try {
    const client = await createClient();
    await requireAdmin(client);

    const parsed = manualCreditGrantSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos para adicionar os créditos.",
      };
    }

    const { data, error } = await client.rpc("grant_manual_credits", {
      p_operation_id: parsed.data.operationId,
      p_student_id: parsed.data.studentId,
      p_credit_type: parsed.data.creditType,
      p_amount: parsed.data.amount,
      p_reason: parsed.data.reason,
      p_internal_note: parsed.data.internalNote?.trim() || null,
    });

    if (error) {
      console.error("[MANUAL_CREDIT_GRANT_DB_ERROR]", {
        code: error.code,
        studentId: parsed.data.studentId,
        creditType: parsed.data.creditType,
      });
      return { success: false as const, error: error.message };
    }

    revalidatePath(`/alunos/${parsed.data.studentId}`);
    revalidatePath("/alunos");

    return { success: true as const, grant: data, error: null };
  } catch (error) {
    console.error("[MANUAL_CREDIT_GRANT_ERROR]", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Não foi possível conceder os créditos.",
    };
  }
}
