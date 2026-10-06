"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getSubscriptionSupportContext,
  submitSubscriptionSupport,
  verifySubscriptionSupport,
} from "@/app/actions/subscription-support";
import { courtesyDateToIso, parseRefundAmount } from "@/utils/subscription-support";
import type { SubscriptionSupportAction, SubscriptionSupportContext } from "@repo/types";
import { subscriptionSupportSchema } from "@repo/validators";
import { toast } from "sonner";

export function useSubscriptionSupport(studentId: string) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [context, setContext] = useState<SubscriptionSupportContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<SubscriptionSupportAction>("cancel_only");
  const [paymentId, setPaymentId] = useState("");
  const [partial, setPartial] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [reason, setReason] = useState("");
  const [courtesyCredits, setCourtesyCredits] = useState("0");
  const [courtesyUntil, setCourtesyUntil] = useState("");
  const [operationId, setOperationId] = useState("");
  const payment = context?.payments.find((item) => item.id === paymentId);
  const amount =
    action === "cancel_only" ? 0 : partial ? parseRefundAmount(partialAmount) : payment?.amount;
  const input = {
    operationId,
    studentId,
    paymentId,
    action,
    amount: amount ?? -1,
    reason,
    ...(action === "refund_courtesy"
      ? {
          courtesyCredits: Number(courtesyCredits),
          courtesyUntil: courtesyDateToIso(courtesyUntil, context?.periodEnd),
        }
      : {}),
  };
  const changeOpen = (next: boolean) => {
    if (pending) return;
    setOpen(next);
    if (!next) return;
    setStep(1);
    setContext(null);
    setError(null);
    setReason("");
    setAction("cancel_only");
    setPartial(false);
    setPartialAmount("");
    setOperationId(crypto.randomUUID());
    startTransition(async () => {
      try {
        const data = await getSubscriptionSupportContext(studentId);
        setContext(data);
        setPaymentId(data.payments[0]?.id ?? "");
        setCourtesyCredits(String(data.availableCredits));
        setCourtesyUntil("");
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Não foi possível carregar o atendimento."
        );
      }
    });
  };
  const review = () => {
    const parsed = subscriptionSupportSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados.");
      return;
    }
    if (
      !payment ||
      (amount ?? 0) > payment.amount ||
      (action === "refund_courtesy" &&
        (Number(courtesyCredits) > (context?.availableCredits ?? 0) ||
          Date.parse(input.courtesyUntil ?? "") > Date.parse(context?.periodEnd ?? "")))
    ) {
      setError(
        "Confira o valor e a cortesia: use apenas créditos existentes e validade dentro do período pago."
      );
      return;
    }
    setError(null);
    setStep(3);
  };
  const confirm = () =>
    startTransition(async () => {
      const result = await submitSubscriptionSupport(input);
      if (!result.success) {
        setError(result.message);
        // Reload audit state after uncertain outcomes, rather than allowing a second submit.
        try {
          setContext(await getSubscriptionSupportContext(studentId));
        } catch {
          /* Keep visible error. */
        }
        router.refresh();
        return;
      }
      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  const verify = () =>
    startTransition(async () => {
      if (!context?.pendingOperation) return;
      const result = await verifySubscriptionSupport(context.pendingOperation.id, studentId);
      if (result.success) toast.success(result.message);
      else setError(result.message);
      router.refresh();
      try {
        setContext(await getSubscriptionSupportContext(studentId));
      } catch {
        setOpen(false);
      }
    });
  return {
    open,
    changeOpen,
    step,
    setStep,
    context,
    error,
    pending,
    action,
    setAction,
    paymentId,
    setPaymentId,
    partial,
    setPartial,
    partialAmount,
    setPartialAmount,
    reason,
    setReason,
    courtesyCredits,
    setCourtesyCredits,
    courtesyUntil,
    setCourtesyUntil,
    payment,
    amount,
    review,
    confirm,
    verify,
  };
}
