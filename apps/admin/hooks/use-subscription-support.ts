"use client";

import { useRef, useState, useTransition } from "react";
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
import { getSubscriptionAccessEnd } from "@repo/utils";

export function useSubscriptionSupport(studentId: string) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [context, setContext] = useState<SubscriptionSupportContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const opening = useRef(0);
  const preview = useRef<{
    studentId: string;
    at: number;
    promise: Promise<SubscriptionSupportContext>;
    data?: SubscriptionSupportContext;
  } | null>(null);
  // Short-lived, per-panel preview only. Submission always validates fresh data on the server.
  const loadContext = () => {
    if (preview.current?.studentId === studentId && Date.now() - preview.current.at < 30_000)
      return preview.current.promise;
    const entry = { studentId, at: Date.now(), promise: getSubscriptionSupportContext(studentId) };
    preview.current = entry;
    void entry.promise.then(
      (data) => {
        if (preview.current === entry) preview.current.data = data;
      },
      () => {
        if (preview.current === entry) preview.current = null;
      }
    );
    return entry.promise;
  };
  const preload = () => {
    void loadContext().catch(() => undefined);
  };
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
  const canReview =
    subscriptionSupportSchema.safeParse(input).success &&
    Boolean(payment && (amount ?? 0) <= payment.amount) &&
    (action !== "refund_courtesy" ||
      (Number(courtesyCredits) <= (context?.availableCredits ?? 0) &&
        Date.parse(input.courtesyUntil ?? "") <=
          Date.parse(context ? getSubscriptionAccessEnd(context.periodEnd) : "")));
  const changeOpen = (next: boolean) => {
    if (pending) return;
    const request = ++opening.current;
    setOpen(next);
    if (!next) {
      setLoading(false);
      return;
    }
    setStep(1);
    setContext(
      preview.current?.studentId === studentId && Date.now() - preview.current.at < 30_000
        ? (preview.current.data ?? null)
        : null
    );
    setError(null);
    setReason("");
    setAction("cancel_only");
    setPartial(false);
    setPartialAmount("");
    setOperationId(crypto.randomUUID());
    setLoading(true);
    void (async () => {
      try {
        const data = await loadContext();
        if (opening.current !== request) return;
        setContext(data);
        setPaymentId(data.payments[0]?.id ?? "");
        setCourtesyCredits(String(data.availableCredits));
        setCourtesyUntil("");
      } catch (cause) {
        if (opening.current !== request) return;
        setError(
          cause instanceof Error ? cause.message : "Não foi possível carregar o atendimento."
        );
      } finally {
        if (opening.current === request) setLoading(false);
      }
    })();
  };
  const review = () => {
    const parsed = subscriptionSupportSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados.");
      return;
    }
    if (!canReview) {
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
      preview.current = null;
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
      preview.current = null;
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
    loading,
    preload,
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
    canReview,
    review,
    confirm,
    verify,
  };
}
