"use server";

import { revalidatePath } from "next/cache";
import {
  cancelPagarmeSubscription,
  listPagarmeSubscriptionInvoices,
  refundPagarmeCharge,
  updatePagarmeSubscriptionItem,
} from "@repo/payments";

import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";

const WITHDRAWALS_PATH = "/cancelamentos";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Sessão administrativa inválida.");
  }

  const { data: role, error: roleError } = await supabase.rpc("get_my_role");

  if (roleError || role !== "ADMIN") {
    throw new Error("Você não tem permissão para analisar cancelamentos.");
  }

  return { supabase, adminId: user.id };
}

export async function listSubscriptionWithdrawals() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("subscription_withdrawal_requests")
    .select(
      `
        id,
        student_id,
        subscription_id,
        provider_subscription_id,
        request_number,
        processing_mode,
        status,
        requested_at,
        original_activated_at,
        eligibility_deadline_at,
        blocked_plan_credits,
        cancellation_reason,
        cancellation_details,
        failure_stage,
        failure_message,
        reviewed_at,
        review_reason,
        profiles!subscription_withdrawal_requests_student_id_fkey(full_name, email),
        subscriptions!subscription_withdrawal_requests_subscription_id_fkey(
          plan_id,
          status,
          withdrawal_status,
          plans!subscriptions_plan_id_fkey(name, price)
        )
      `
    )
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("[LIST_SUBSCRIPTION_WITHDRAWALS_ERROR]", error);
    throw new Error("Não foi possível carregar os pedidos de cancelamento.");
  }

  return data ?? [];
}

async function markOperationalIssue(requestId: string, stage: string, error: unknown) {
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.rpc("mark_subscription_withdrawal_operational_issue", {
    p_request_id: requestId,
    p_stage: stage,
    p_message: error instanceof Error ? error.message : "Falha operacional não detalhada.",
  });
}

export async function approveSubscriptionWithdrawal(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const { adminId } = await requireAdmin();
  const supabaseAdmin = createAdminClient();

  const { data: request, error: requestError } = await supabaseAdmin
    .from("subscription_withdrawal_requests")
    .select(
      "id, student_id, subscription_id, provider_subscription_id, original_activated_at, processing_mode, status, reviewed_at"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) {
    throw new Error("Pedido de arrependimento não encontrado.");
  }

  const requiresApproval = request.processing_mode === "manual" && request.reviewed_at === null;

  if (requiresApproval) {
    const { error: approvalError } = await supabaseAdmin.rpc("approve_subscription_withdrawal", {
      p_request_id: requestId,
      p_admin_id: adminId,
      p_reason: reason,
    });

    if (approvalError) {
      throw new Error("Não foi possível aprovar o pedido de arrependimento.");
    }
  } else if (request.status !== "operational_issue") {
    throw new Error("Este pedido não possui uma pendência operacional para tentar novamente.");
  }

  try {
    await cancelPagarmeSubscription({
      subscriptionId: request.provider_subscription_id,
      cancelPendingInvoices: true,
      idempotencyKey: `withdrawal-cancel-${request.id}`,
    });

    const invoiceHistory = await listPagarmeSubscriptionInvoices({
      subscriptionId: request.provider_subscription_id,
      pageSize: 100,
      maxPages: 10,
    });

    if (!invoiceHistory.historyComplete) {
      throw new Error("O histórico completo de faturas não pôde ser consultado.");
    }

    const activatedAt = new Date(request.original_activated_at).getTime();
    const targets = new Map<
      string,
      { chargeId: string; invoiceId: string | null; paymentId: string | null; amount: number }
    >();

    for (const invoice of invoiceHistory.invoices) {
      const chargeId = invoice.charge?.id;
      const paidAt = invoice.charge?.paid_at ?? invoice.updated_at ?? invoice.created_at;

      if (
        invoice.status === "paid" &&
        chargeId &&
        paidAt &&
        new Date(paidAt).getTime() >= activatedAt &&
        invoice.amount > 0
      ) {
        targets.set(chargeId, {
          chargeId,
          invoiceId: invoice.id,
          paymentId: null,
          amount: invoice.amount,
        });
      }
    }

    const { data: upgrades, error: upgradesError } = await supabaseAdmin
      .from("student_payments")
      .select("id, amount, metadata")
      .eq("user_id", request.student_id)
      .eq("subscription_id", request.subscription_id)
      .eq("kind", "plan_upgrade_prorata")
      .in("status", ["paid", "active"])
      .gte("paid_at", request.original_activated_at);

    if (upgradesError) {
      throw upgradesError;
    }

    for (const upgrade of upgrades ?? []) {
      const metadata = upgrade.metadata as Record<string, unknown>;
      const chargeId = metadata.pagarme_charge_id;

      if (typeof chargeId === "string" && chargeId.startsWith("ch_") && upgrade.amount > 0) {
        targets.set(chargeId, {
          chargeId,
          invoiceId: null,
          paymentId: upgrade.id,
          amount: upgrade.amount,
        });
      }
    }

    if (targets.size === 0) {
      throw new Error("Nenhuma cobrança paga elegível para reembolso foi encontrada.");
    }

    const rows = [...targets.values()].map((target) => ({
      request_id: request.id,
      student_payment_id: target.paymentId,
      provider_charge_id: target.chargeId,
      provider_invoice_id: target.invoiceId,
      amount: target.amount,
      status: "pending",
      idempotency_key: `withdrawal-refund-${request.id}-${target.chargeId}`,
      metadata: { provider_subscription_id: request.provider_subscription_id },
    }));

    const { error: rowsError } = await supabaseAdmin
      .from("subscription_withdrawal_refunds")
      .upsert(rows, { onConflict: "request_id,provider_charge_id", ignoreDuplicates: true });

    if (rowsError) {
      throw rowsError;
    }

    await supabaseAdmin
      .from("subscription_withdrawal_requests")
      .update({ refund_started_at: new Date().toISOString() })
      .eq("id", request.id);

    for (const target of targets.values()) {
      await refundPagarmeCharge({
        chargeId: target.chargeId,
        amount: target.amount,
        idempotencyKey: `withdrawal-refund-${request.id}-${target.chargeId}`,
      });

      const { error } = await supabaseAdmin
        .from("subscription_withdrawal_refunds")
        .update({ status: "processing", requested_at: new Date().toISOString() })
        .eq("request_id", request.id)
        .eq("provider_charge_id", target.chargeId)
        .neq("status", "refunded");

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    await markOperationalIssue(request.id, "admin_approved_refund", error);
  }

  revalidatePath(WITHDRAWALS_PATH);
}

export async function rejectSubscriptionWithdrawal(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!reason) {
    throw new Error("Informe o motivo da recusa.");
  }

  const { adminId } = await requireAdmin();
  const supabaseAdmin = createAdminClient();
  const { data: request, error: requestError } = await supabaseAdmin
    .from("subscription_withdrawal_requests")
    .select(
      "id, provider_subscription_id, provider_item_id, subscriptions!subscription_withdrawal_requests_subscription_id_fkey(plans(name, price))"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) {
    throw new Error("Não foi possível localizar o pedido de arrependimento.");
  }

  const relation = request.subscriptions as unknown as {
    plans: { name: string; price: number } | null;
  };
  const plan = relation.plans;

  if (!plan) {
    throw new Error("Plano da assinatura não encontrado.");
  }

  let providerItemReactivated = false;

  if (request.provider_item_id) {
    try {
      await updatePagarmeSubscriptionItem({
        subscriptionId: request.provider_subscription_id,
        itemId: request.provider_item_id,
        name: plan.name,
        description: plan.name,
        price: plan.price,
        quantity: 1,
        status: "active",
      });
      providerItemReactivated = true;
    } catch (error) {
      await markOperationalIssue(request.id, "provider_renewal_restore", error);
      throw new Error("Não foi possível reativar a renovação antes de recusar o pedido.");
    }
  }

  const { error } = await supabaseAdmin.rpc("reject_subscription_withdrawal", {
    p_request_id: request.id,
    p_admin_id: adminId,
    p_reason: reason,
  });

  if (error) {
    if (providerItemReactivated && request.provider_item_id) {
      try {
        await updatePagarmeSubscriptionItem({
          subscriptionId: request.provider_subscription_id,
          itemId: request.provider_item_id,
          name: plan.name,
          description: plan.name,
          price: plan.price,
          quantity: 1,
          status: "inactive",
        });
      } catch (rollbackError) {
        console.error("[WITHDRAWAL_REJECTION_PROVIDER_ROLLBACK_ERROR]", rollbackError);
      }
    }

    await markOperationalIssue(request.id, "rejection_local_finalize", error);
    throw new Error("A recusa não pôde ser concluída e permanece como pendência operacional.");
  }

  revalidatePath(WITHDRAWALS_PATH);
}
