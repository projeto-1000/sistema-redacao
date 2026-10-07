"use server";

import { createClient } from "@/lib/server";
import { processSupportOperation, resolveSupportCharge } from "@/services/subscription-support";
import { subscriptionSupportSchema } from "@repo/validators";
import { getConfirmedRefundTotal } from "@repo/payments";
import type {
  SubscriptionSupportContext,
  SubscriptionSupportInput,
  SubscriptionSupportOperation,
} from "@repo/types";
import { revalidatePath } from "next/cache";
import { getCycleInfo } from "@repo/utils";

async function requireAdmin() {
  const client = await createClient();
  const [
    {
      data: { user },
      error,
    },
    { data: role, error: roleError },
  ] = await Promise.all([client.auth.getUser(), client.rpc("get_my_role")]);
  if (error || !user || roleError || role !== "ADMIN")
    throw new Error("Sessão administrativa inválida.");
  return client;
}

export async function getSubscriptionSupportContext(
  studentId: string
): Promise<SubscriptionSupportContext> {
  const client = await requireAdmin();
  const [profile, subscription, credits, operations] = await Promise.all([
    client.from("profiles").select("full_name,email").eq("id", studentId).single(),
    client
      .from("subscriptions")
      .select(
        "id,plan_id,current_period_end,external_id,status,cancel_at_period_end,pending_plan_id,withdrawal_status"
      )
      .eq("user_id", studentId)
      .single(),
    client.from("student_credits").select("plan_credits").eq("user_id", studentId).single(),
    client
      .from("subscription_support_operations")
      .select("id,status,action")
      .eq("student_id", studentId)
      .neq("status", "completed")
      .maybeSingle(),
  ]);
  if (operations.error)
    throw new Error("A atualização do banco para atendimentos ainda não está disponível.");
  if (profile.error || subscription.error || credits.error)
    throw new Error("Não foi possível carregar os dados do atendimento.");
  const sub = subscription.data;
  const payments = await client
    .from("student_payments")
    .select("id,amount,paid_at,credits_amount,external_id,metadata")
    .eq("user_id", studentId)
    .eq("subscription_id", sub.id)
    .eq("kind", "subscription")
    .in("status", ["paid", "active"])
    .order("paid_at", { ascending: false })
    .limit(1);
  if (payments.error) throw new Error("Não foi possível carregar o plano e seus pagamentos.");
  const [plan, snapshot] = await Promise.all([
    client.from("plans").select("name,interval,interval_count").eq("id", sub.plan_id).single(),
    payments.data?.[0]
      ? client.rpc("preview_subscription_support_snapshot", {
          p_student_id: studentId,
          p_payment_id: payments.data[0].id,
        })
      : null,
  ]);
  if (plan.error) throw new Error("Não foi possível carregar o plano do aluno.");
  if (snapshot?.error) throw new Error("Não foi possível consultar os créditos da contratação.");
  if (
    !operations.data &&
    (sub.status !== "active" ||
      sub.cancel_at_period_end ||
      sub.pending_plan_id ||
      ["under_review", "refund_processing", "operational_issue"].includes(sub.withdrawal_status))
  ) {
    throw new Error("A assinatura possui outro processo em andamento ou não está ativa.");
  }
  return {
    studentId,
    name: profile.data.full_name,
    email: profile.data.email,
    planName: plan.data.name,
    planPeriodLabel: getCycleInfo(plan.data.interval, plan.data.interval_count ?? 1).label,
    periodEnd: sub.current_period_end,
    availableCredits: credits.data.plan_credits,
    grantedCredits: snapshot?.data?.credits_granted ?? null,
    usedCredits: snapshot?.data?.credits_used ?? null,
    payments: (payments.data ?? [])
      .filter(
        (payment) =>
          payment.paid_at &&
          (payment.metadata?.pagarme_subscription_id ?? payment.external_id) === sub.external_id
      )
      .map(({ id, amount, paid_at, credits_amount }) => ({ id, amount, paid_at, credits_amount })),
    pendingOperation: operations.data,
  };
}

export async function submitSubscriptionSupport(input: SubscriptionSupportInput) {
  let prepared = false;
  try {
    const client = await requireAdmin();
    const parsed = subscriptionSupportSchema.parse(input);
    const existing = await client
      .from("subscription_support_operations")
      .select("*")
      .eq("id", parsed.operationId)
      .maybeSingle();
    if (existing.error) throw new Error("Não foi possível consultar os atendimentos.");
    // A replay only verifies; it never repeats an uncertain financial request.
    if (existing.data) {
      if (existing.data.student_id !== parsed.studentId) throw new Error("Atendimento inválido.");
      const result = await processSupportOperation(
        existing.data as SubscriptionSupportOperation,
        true
      );
      revalidatePath(`/alunos/${parsed.studentId}`);
      revalidatePath("/cancelamentos");
      return {
        success: true,
        message:
          result.status === "completed"
            ? "Atendimento concluído."
            : "Aguardando confirmação. Use Verificar confirmação.",
      };
    }
    const payment = await client
      .from("student_payments")
      .select("amount,paid_at,metadata,subscription_id,payment_method")
      .eq("id", parsed.paymentId)
      .eq("user_id", parsed.studentId)
      .eq("kind", "subscription")
      .single();
    const subscription = await client
      .from("subscriptions")
      .select("external_id")
      .eq("id", payment.data?.subscription_id ?? "")
      .eq("user_id", parsed.studentId)
      .single();
    if (payment.error || subscription.error || !payment.data.paid_at)
      throw new Error("Pagamento inválido.");
    if (parsed.amount > 0 && payment.data.payment_method !== "credit_card")
      throw new Error("Neste fluxo, reembolsos estão disponíveis apenas para cartão de crédito.");
    const charge = await resolveSupportCharge(
      payment.data,
      subscription.data.external_id,
      parsed.amount > 0
    );
    const confirmedBaseline = getConfirmedRefundTotal(charge);
    const untouchedCapture =
      charge.last_transaction?.status === "captured" &&
      charge.last_transaction.success === true &&
      !charge.refunded_at &&
      (charge.canceled_amount ?? 0) === 0 &&
      (charge.refunded_amount ?? 0) === 0;
    if (parsed.amount > 0 && confirmedBaseline === null && !untouchedCapture)
      throw new Error(
        "O saldo reembolsável ainda não está confirmado. Nenhuma alteração foi realizada."
      );
    const baseline = confirmedBaseline ?? 0;
    if (parsed.amount > charge.amount - baseline)
      throw new Error("O valor excede o saldo reembolsável da cobrança.");
    const { data, error } = await client.rpc("prepare_subscription_support_operation", {
      p_id: parsed.operationId,
      p_student_id: parsed.studentId,
      p_payment_id: parsed.paymentId,
      p_action: parsed.action,
      p_amount: parsed.amount,
      p_reason: parsed.reason,
      p_charge_id: charge.id,
      p_baseline_refunded: baseline,
      p_courtesy_credits: parsed.courtesyCredits ?? null,
      p_courtesy_until: parsed.courtesyUntil ?? null,
    });
    if (error) throw new Error(error.message);
    prepared = true;
    const result = await processSupportOperation(data as SubscriptionSupportOperation);
    revalidatePath(`/alunos/${parsed.studentId}`);
    revalidatePath("/cancelamentos");
    return {
      success: true,
      message:
        result.status === "completed"
          ? "Atendimento concluído e registrado no histórico."
          : "Solicitação enviada. Aguardando confirmação do reembolso.",
    };
  } catch (error) {
    console.error("[SUBSCRIPTION_SUPPORT_ERROR]", {
      prepared,
      name: error instanceof Error ? error.name : "unknown",
    });
    return {
      success: false,
      message: prepared
        ? "O atendimento foi registrado, mas a confirmação está pendente. Não faça outro reembolso; use Verificar confirmação."
        : error instanceof Error
          ? error.message
          : "Não foi possível realizar o atendimento.",
    };
  }
}

export async function verifySubscriptionSupport(operationId: string, studentId: string) {
  try {
    const client = await requireAdmin();
    const { data, error } = await client
      .from("subscription_support_operations")
      .select("*")
      .eq("id", operationId)
      .eq("student_id", studentId)
      .single();
    if (error) throw new Error("Atendimento não encontrado.");
    const result = await processSupportOperation(data as SubscriptionSupportOperation, true);
    revalidatePath(`/alunos/${studentId}`);
    revalidatePath("/cancelamentos");
    return {
      success: true,
      message:
        result.status === "completed"
          ? "Atendimento confirmado."
          : "A confirmação ainda está pendente. Nenhuma nova solicitação de reembolso foi enviada.",
    };
  } catch {
    return {
      success: false,
      message: "Não foi possível verificar a confirmação. Nenhum novo reembolso foi enviado.",
    };
  }
}
