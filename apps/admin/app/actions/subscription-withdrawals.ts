"use server";

import { revalidatePath } from "next/cache";
import {
  cancelPagarmeSubscription,
  getPagarmeChargeInvoiceId,
  getPagarmeSubscription,
  isPagarmeChargeFullyRefunded,
  listPagarmeInvoiceCharges,
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
        failure_at,
        reviewed_at,
        reviewed_by,
        review_reason,
        refund_started_at,
        refund_completed_at,
        updated_at,
        profiles!subscription_withdrawal_requests_student_id_fkey(full_name, email),
        reviewer:profiles!subscription_withdrawal_requests_reviewed_by_fkey(full_name, email),
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

  if (!requestId) {
    throw new Error("O identificador do pedido de arrependimento não foi informado.");
  }

  const { adminId } = await requireAdmin();
  const supabaseAdmin = createAdminClient();

  const { data: request, error: requestError } = await supabaseAdmin
    .from("subscription_withdrawal_requests")
    .select(
      "id, student_id, subscription_id, provider_subscription_id, initial_payment_id, original_activated_at, processing_mode, status, reviewed_at"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    console.error("[SUBSCRIPTION_WITHDRAWAL_LOOKUP_ERROR]", requestError);
    throw new Error("Não foi possível consultar o pedido de arrependimento no Supabase.");
  }

  if (!request) {
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
    const { data: initialPayment, error: initialPaymentError } = await supabaseAdmin
      .from("student_payments")
      .select("metadata")
      .eq("id", request.initial_payment_id)
      .eq("user_id", request.student_id)
      .eq("subscription_id", request.subscription_id)
      .maybeSingle();

    if (initialPaymentError) {
      throw new Error("Não foi possível consultar os identificadores do pagamento inicial.");
    }

    const initialPaymentMetadata = initialPayment?.metadata as Record<string, unknown> | undefined;
    const paymentLocalSubscriptionCode = initialPaymentMetadata?.local_subscription_code;

    const providerSubscription = await getPagarmeSubscription({
      subscriptionId: request.provider_subscription_id,
    });
    const providerLocalSubscriptionCode =
      providerSubscription.metadata?.local_subscription_code ?? providerSubscription.code;
    const localSubscriptionCode = providerLocalSubscriptionCode ?? paymentLocalSubscriptionCode;

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
      {
        chargeId: string;
        invoiceId: string | null;
        paymentId: string | null;
        amount: number;
        alreadyRefunded: boolean;
        refundedAt: string | null;
        providerRefundId: string | null;
      }
    >();
    const discoveryDiagnostics = {
      invoices: invoiceHistory.invoices.length,
      paidInvoices: 0,
      positiveInvoices: 0,
      scannedCharges: 0,
      linkedCharges: 0,
      unfilteredFallbacks: 0,
      linkedChargeStatuses: {} as Record<string, number>,
      invoiceReferenceShapes: {
        nested: 0,
        flat: 0,
        string: 0,
        missing: 0,
      },
      rejectionReasons: {
        invoiceMismatch: 0,
        statusNotPaid: 0,
        invalidId: 0,
        invalidAmount: 0,
        invalidPaidAt: 0,
        beforeActivationWindow: 0,
      },
    };

    for (const invoice of invoiceHistory.invoices) {
      if (invoice.status === "paid") {
        discoveryDiagnostics.paidInvoices += 1;
      }

      if (!Number.isInteger(invoice.amount) || invoice.amount <= 0) {
        continue;
      }
      discoveryDiagnostics.positiveInvoices += 1;

      const invoiceCreatedAt = invoice.created_at
        ? new Date(invoice.created_at).getTime()
        : Number.NaN;
      const chargeSearchStart = new Date(
        Math.min(activatedAt, Number.isNaN(invoiceCreatedAt) ? activatedAt : invoiceCreatedAt) -
          5 * 60 * 1000
      ).toISOString();

      const chargeHistory = await listPagarmeInvoiceCharges({
        invoiceId: invoice.id,
        createdSince: chargeSearchStart,
        pageSize: 30,
        maxPages: 10,
      });

      if (!chargeHistory.historyComplete) {
        throw new Error(`O histórico de cobranças da fatura ${invoice.id} está incompleto.`);
      }

      discoveryDiagnostics.scannedCharges += chargeHistory.scannedCharges;
      discoveryDiagnostics.linkedCharges += chargeHistory.charges.length;
      discoveryDiagnostics.unfilteredFallbacks += Number(
        chargeHistory.queryMode === "unfiltered_fallback"
      );
      discoveryDiagnostics.invoiceReferenceShapes.nested +=
        chargeHistory.invoiceReferenceShapes.nested;
      discoveryDiagnostics.invoiceReferenceShapes.flat += chargeHistory.invoiceReferenceShapes.flat;
      discoveryDiagnostics.invoiceReferenceShapes.string +=
        chargeHistory.invoiceReferenceShapes.string;
      discoveryDiagnostics.invoiceReferenceShapes.missing +=
        chargeHistory.invoiceReferenceShapes.missing;

      const rejectionReasons = {
        invoiceMismatch: 0,
        statusNotPaid: 0,
        invalidId: 0,
        invalidAmount: 0,
        invalidPaidAt: 0,
        beforeActivationWindow: 0,
      };
      let eligibleChargeCount = 0;

      for (const charge of chargeHistory.candidates) {
        const paidAt = charge.paid_at ?? charge.updated_at ?? charge.created_at;
        const paidAtMs = paidAt ? new Date(paidAt).getTime() : Number.NaN;
        const chargeInvoiceId = getPagarmeChargeInvoiceId(charge);
        if (chargeInvoiceId === invoice.id) {
          discoveryDiagnostics.linkedChargeStatuses[charge.status] =
            (discoveryDiagnostics.linkedChargeStatuses[charge.status] ?? 0) + 1;
        }
        const chargeMetadata = charge.metadata;
        const metadataMatchesSubscription =
          typeof localSubscriptionCode === "string" &&
          localSubscriptionCode.length > 0 &&
          chargeMetadata?.user_id === request.student_id &&
          chargeMetadata?.local_subscription_code === localSubscriptionCode &&
          charge.amount === invoice.amount;
        const invoiceMismatch = chargeInvoiceId !== invoice.id && !metadataMatchesSubscription;
        const alreadyRefunded = isPagarmeChargeFullyRefunded(charge);
        const statusNotPaid = charge.status !== "paid" && !alreadyRefunded;
        const invalidId = !/^ch_[A-Za-z0-9]+$/.test(charge.id);
        const invalidAmount = !Number.isInteger(charge.amount) || charge.amount <= 0;
        const invalidPaidAt = Number.isNaN(paidAtMs);
        const beforeActivationWindow =
          !invalidPaidAt && !metadataMatchesSubscription && paidAtMs < activatedAt - 5 * 60 * 1000;

        rejectionReasons.invoiceMismatch += Number(invoiceMismatch);
        rejectionReasons.statusNotPaid += Number(statusNotPaid);
        rejectionReasons.invalidId += Number(invalidId);
        rejectionReasons.invalidAmount += Number(invalidAmount);
        rejectionReasons.invalidPaidAt += Number(invalidPaidAt);
        rejectionReasons.beforeActivationWindow += Number(beforeActivationWindow);

        discoveryDiagnostics.rejectionReasons.invoiceMismatch += Number(invoiceMismatch);
        discoveryDiagnostics.rejectionReasons.statusNotPaid += Number(statusNotPaid);
        discoveryDiagnostics.rejectionReasons.invalidId += Number(invalidId);
        discoveryDiagnostics.rejectionReasons.invalidAmount += Number(invalidAmount);
        discoveryDiagnostics.rejectionReasons.invalidPaidAt += Number(invalidPaidAt);
        discoveryDiagnostics.rejectionReasons.beforeActivationWindow +=
          Number(beforeActivationWindow);

        if (
          invoiceMismatch ||
          statusNotPaid ||
          invalidId ||
          invalidAmount ||
          invalidPaidAt ||
          beforeActivationWindow
        ) {
          continue;
        }

        eligibleChargeCount += 1;
        targets.set(charge.id, {
          chargeId: charge.id,
          invoiceId: chargeInvoiceId ?? invoice.id,
          paymentId: null,
          amount: charge.amount,
          alreadyRefunded,
          refundedAt: charge.refunded_at ?? charge.updated_at ?? null,
          providerRefundId: charge.last_transaction?.id ?? null,
        });
      }

      if (chargeHistory.candidates.length > 0 && eligibleChargeCount === 0) {
        console.warn("[PAGARME_INVOICE_CHARGE_VALIDATION_MISS]", {
          candidateCharges: chargeHistory.candidates.length,
          rejectionReasons,
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
          alreadyRefunded: false,
          refundedAt: null,
          providerRefundId: null,
        });
      }
    }

    if (targets.size === 0) {
      const shapes = discoveryDiagnostics.invoiceReferenceShapes;
      const rejected = discoveryDiagnostics.rejectionReasons;
      const linkedStatuses =
        Object.entries(discoveryDiagnostics.linkedChargeStatuses)
          .map(([status, count]) => `${status}:${count}`)
          .join(",") || "nenhum";
      console.warn("[PAGARME_WITHDRAWAL_REFUND_TARGET_MISS]", {
        invoices: discoveryDiagnostics.invoices,
        paidInvoices: discoveryDiagnostics.paidInvoices,
        positiveInvoices: discoveryDiagnostics.positiveInvoices,
        scannedCharges: discoveryDiagnostics.scannedCharges,
        linkedCharges: discoveryDiagnostics.linkedCharges,
        linkedStatuses,
        unfilteredFallbacks: discoveryDiagnostics.unfilteredFallbacks,
        invoiceReferenceShapes: shapes,
        rejectionReasons: rejected,
      });

      if ((discoveryDiagnostics.linkedChargeStatuses.canceled ?? 0) > 0) {
        throw new Error(
          "A cobrança foi cancelada no Pagar.me antes do pedido de reembolso, " +
            "mas o estorno financeiro não foi confirmado. É necessária análise operacional."
        );
      }

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

    // Preserve the paid charge until its refund has been requested. Asking Pagar.me
    // to cancel pending invoices first changes the invoice/charge state and makes
    // the original paid charge ineligible for the refund endpoint.
    await cancelPagarmeSubscription({
      subscriptionId: request.provider_subscription_id,
      cancelPendingInvoices: false,
      idempotencyKey: `withdrawal-cancel-${request.id}`,
    });

    await supabaseAdmin
      .from("subscription_withdrawal_requests")
      .update({ refund_started_at: new Date().toISOString() })
      .eq("id", request.id);

    for (const target of targets.values()) {
      if (target.alreadyRefunded) {
        const { data, error } = await supabaseAdmin.rpc(
          "process_subscription_withdrawal_refund_confirmation",
          {
            p_provider_charge_id: target.chargeId,
            p_refunded_at: target.refundedAt ?? new Date().toISOString(),
            p_provider_refund_id: target.providerRefundId,
          }
        );

        if (error) {
          throw error;
        }

        const result = data as { matched?: boolean } | null;

        if (!result?.matched) {
          throw new Error(
            "O estorno foi confirmado no Pagar.me, mas não foi possível vinculá-lo ao pedido local."
          );
        }

        continue;
      }

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
