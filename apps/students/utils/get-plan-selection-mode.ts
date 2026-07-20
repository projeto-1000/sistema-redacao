import { type CurrentUserSubscriptionContext } from "@/app/actions/plans";
import { PlanSelectionMode } from "@/types";

export function getSelectionMode(
  context: CurrentUserSubscriptionContext | null
): PlanSelectionMode {
  if (!context) {
    return "new_subscription";
  }

  if (context.planKind === "mentorship") {
    return "new_subscription";
  }

  if (context.planKind === "free_trial") {
    return "new_subscription";
  }

  if (context.planKind === "paid") {
    if (context.status === "active" || context.status === "trial") {
      return "change_plan";
    }

    if (context.status === "canceled") {
      return "canceled_subscription";
    }

    if (context.status === "past_due" || context.status === "unpaid") {
      return "payment_issue";
    }
  }

  return "new_subscription";
}
