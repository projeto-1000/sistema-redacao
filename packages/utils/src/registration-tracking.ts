export const META_PIXEL_ID = "1498795297218230";
export const REGISTRATION_EVENT_NAME = "CompleteRegistration";
export const ATTRIBUTION_STORAGE_KEY = "projeto1000.registration-attribution";
export const ATTRIBUTION_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "fbclid",
  "fbc",
  "fbp",
  "landing_url",
] as const;
export type RegistrationAttribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>>;

export function registrationEventId(userId: string) {
  return `registration:${userId}`;
}

// Never retain signup tokens or other query parameters in URLs sent to Meta.
export function trackingPageUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    return `${url.origin}${url.pathname}`.slice(0, 1000);
  } catch {
    return undefined;
  }
}

function text(value: unknown, max = 500): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, max) || undefined : undefined;
}

function cookieValue(cookies: string, name: string) {
  const value = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  try {
    return value ? decodeURIComponent(value) : undefined;
  } catch {
    return undefined;
  }
}

export function collectRegistrationAttribution({
  url,
  cookies,
  stored,
  now = Date.now(),
}: {
  url: string;
  cookies: string;
  stored?: string | null;
  now?: number;
}): RegistrationAttribution {
  const previous: RegistrationAttribution = {};
  try {
    const parsed: unknown = JSON.parse(stored ?? "null");
    if (
      parsed &&
      typeof parsed === "object" &&
      "savedAt" in parsed &&
      typeof parsed.savedAt === "number" &&
      now >= parsed.savedAt &&
      now - parsed.savedAt < ATTRIBUTION_MAX_AGE_MS &&
      "attribution" in parsed &&
      parsed.attribution &&
      typeof parsed.attribution === "object"
    ) {
      for (const key of ATTRIBUTION_KEYS) {
        if (key in parsed.attribution) {
          const value = text(
            Reflect.get(parsed.attribution, key),
            key === "landing_url" ? 1000 : key === "fbc" ? 600 : 500
          );
          if (value) previous[key] = value;
        }
      }
    }
  } catch {
    /* Storage can be unavailable or contain an outdated value. */
  }
  const current = new URL(url);
  const hasCampaign = [...current.searchParams.keys()].some(
    (key) => key.startsWith("utm_") || key === "fbclid"
  );
  const result: RegistrationAttribution = hasCampaign ? {} : { ...previous };
  for (const key of ATTRIBUTION_KEYS) {
    if (key.startsWith("utm_") || key === "fbclid") {
      const value = text(current.searchParams.get(key));
      if (value) result[key] = value;
    }
  }
  result.landing_url ??= trackingPageUrl(url);
  const fbc = text(cookieValue(cookies, "_fbc"), 600);
  const fbp = text(cookieValue(cookies, "_fbp"));
  if (fbp) result.fbp = fbp;
  if (result.fbclid) {
    result.fbc = fbc?.endsWith(`.${result.fbclid}`)
      ? fbc
      : (result.fbc ?? `fb.1.${now}.${result.fbclid}`);
  } else if (fbc) result.fbc = fbc;
  return result;
}

export function captureRegistrationAttribution(): RegistrationAttribution {
  if (typeof window === "undefined") return {};
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    /* Continue without storage. */
  }
  let cookies = "";
  try {
    cookies = document.cookie;
  } catch {
    /* Cookies may be blocked by the browser. */
  }
  const attribution = collectRegistrationAttribution({
    url: window.location.href,
    cookies,
    stored,
  });
  try {
    // Keep the original expiry when only navigating internally.
    const previous: unknown = JSON.parse(stored ?? "null");
    const savedAt =
      previous &&
      typeof previous === "object" &&
      "savedAt" in previous &&
      typeof previous.savedAt === "number" &&
      Date.now() - previous.savedAt < ATTRIBUTION_MAX_AGE_MS &&
      JSON.stringify(attribution) === JSON.stringify(Reflect.get(previous, "attribution"))
        ? previous.savedAt
        : Date.now();
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify({ savedAt, attribution }));
  } catch {
    /* Tracking must never prevent signup. */
  }
  return attribution;
}
