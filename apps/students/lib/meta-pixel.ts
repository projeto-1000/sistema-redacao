export function trackCompleteRegistration() {
  if (typeof window === "undefined") return;

  const fbq = (
    window as Window & {
      fbq?: (...args: unknown[]) => void;
    }
  ).fbq;

  fbq?.("track", "CompleteRegistration");
}
