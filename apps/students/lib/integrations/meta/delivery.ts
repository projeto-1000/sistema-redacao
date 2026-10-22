import "server-only";

import { createAdminClient } from "@/lib/admin";
import { after } from "next/server";
import { registrationEventId } from "@repo/utils/registration-tracking";
import { registrationRetryAt, sendRegistrationEvent, type RegistrationEvent } from "./payload";

export async function deliverRegistrationEvents(userId?: string) {
  if (process.env.META_CONVERSIONS_ENABLED !== "true")
    return { status: "disabled", sent: 0, failed: 0 };
  const accessToken = process.env.META_CONVERSIONS_ACCESS_TOKEN;
  const testEventCode = process.env.META_CONVERSIONS_TEST_EVENT_CODE;
  // Preview/local deliveries must use Meta's Test Events mode, explicitly configured.
  if (!accessToken || (process.env.VERCEL_ENV !== "production" && !testEventCode)) {
    console.error("[META_REGISTRATION_ERROR]", { code: "CONFIGURATION_REQUIRED" });
    return { status: "configuration_required", sent: 0, failed: 0 };
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_meta_registration_events", {
    p_user_id: userId ?? null,
    p_limit: userId ? 1 : 5,
  });
  if (error) throw new Error("META_QUEUE_CLAIM_FAILED");
  let sent = 0;
  let failed = 0;
  for (const event of (data ?? []) as RegistrationEvent[]) {
    const result = await sendRegistrationEvent({ event, accessToken, testEventCode });
    const { data: updated, error: updateError } = await admin
      .from("meta_registration_events")
      .update(
        result.success
          ? {
              sent_at: new Date().toISOString(),
              locked_until: null,
              last_error_code: null,
            }
          : {
              locked_until: null,
              last_error_code: result.code,
              next_attempt_at: registrationRetryAt(event.attempts),
            }
      )
      .eq("user_id", event.user_id)
      .eq("locked_until", event.locked_until)
      .is("sent_at", null)
      .select("user_id")
      .maybeSingle();
    if (updateError || !updated || !result.success) {
      failed += 1;
      console.error("[META_REGISTRATION_ERROR]", {
        code:
          updateError || !updated
            ? "QUEUE_UPDATE_FAILED"
            : result.success
              ? "DELIVERY_FAILED"
              : result.code,
      });
    } else sent += 1;
  }
  return { status: "processed", sent, failed };
}

export function scheduleRegistrationDelivery(userId: string) {
  after(async () => {
    try {
      await deliverRegistrationEvents(userId);
    } catch {
      console.error("[META_REGISTRATION_ERROR]", { code: "DELIVERY_FAILED" });
    }
  });
  return registrationEventId(userId);
}
