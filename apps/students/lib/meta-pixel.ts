import { REGISTRATION_EVENT_NAME } from "@repo/utils/registration-tracking";

export function trackCompleteRegistration(eventId: string) {
  if (typeof window === "undefined") return;
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
  try {
    fbq?.("track", REGISTRATION_EVENT_NAME, {}, { eventID: eventId });
  } catch {
    // A blocked or broken pixel must not prevent access to a newly created account.
  }
}
