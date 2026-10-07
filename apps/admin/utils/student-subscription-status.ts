type SubscriptionState = {
  status: string;
  cancel_at_period_end?: boolean;
  cancellation_mode?: string | null;
};

export function isStudentCancellationScheduled(subscription: SubscriptionState | null) {
  return Boolean(
    subscription &&
    subscription.status !== "canceled" &&
    subscription.cancel_at_period_end &&
    subscription.cancellation_mode === "end_of_period"
  );
}

export const SCHEDULED_CANCELLATION_BADGE = {
  label: "Cancelamento agendado",
  classes: "bg-amber-50 text-amber-700",
};
