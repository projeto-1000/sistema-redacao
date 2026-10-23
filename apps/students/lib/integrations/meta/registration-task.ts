import { registrationEventId } from "@repo/utils/registration-tracking";

type TrackingError = "SCHEDULING_FAILED" | "DELIVERY_FAILED";

// Every operation here is optional and runs after the account has been created.
export function scheduleRegistrationTask({
  userId,
  schedule,
  task,
  reportError,
}: {
  userId: string;
  schedule: (task: () => Promise<void>) => void;
  task: () => Promise<void>;
  reportError: (code: TrackingError) => void;
}) {
  const eventId = registrationEventId(userId);
  const report = (code: TrackingError) => {
    try {
      reportError(code);
    } catch {
      /* Logging cannot turn tracking into a signup error. */
    }
  };
  try {
    schedule(async () => {
      try {
        await task();
      } catch {
        report("DELIVERY_FAILED");
      }
    });
  } catch {
    report("SCHEDULING_FAILED");
  }
  return eventId;
}
