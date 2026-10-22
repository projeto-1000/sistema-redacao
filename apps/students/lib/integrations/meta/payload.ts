import { isIP } from "node:net";
import {
  META_PIXEL_ID,
  REGISTRATION_EVENT_NAME,
  trackingPageUrl,
} from "@repo/utils/registration-tracking";

export { META_PIXEL_ID };
export const META_API_VERSION = "v26.0";

export interface RegistrationEvent {
  user_id: string;
  event_id: string;
  event_time: string;
  email_hash: string | null;
  phone_hash: string | null;
  attribution: unknown;
  attempts: number;
  locked_until: string;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function string(value: unknown, limit: number): string | undefined {
  return typeof value === "string" && value.length <= limit ? value : undefined;
}

export function buildRegistrationPayload(event: RegistrationEvent) {
  const context = object(event.attribution);
  const userData: Record<string, string | string[]> = {};
  if (event.email_hash && /^[a-f0-9]{64}$/.test(event.email_hash)) userData.em = [event.email_hash];
  if (event.phone_hash && /^[a-f0-9]{64}$/.test(event.phone_hash)) userData.ph = [event.phone_hash];
  const fbc = string(context.fbc, 600);
  const fbp = string(context.fbp, 200);
  if (fbc && /^fb\.\d+\.\d{13}\.[A-Za-z0-9_-]+$/.test(fbc)) userData.fbc = fbc;
  if (fbp && /^fb\.\d+\.\d{13}\.\d+$/.test(fbp)) userData.fbp = fbp;
  const ip = string(context.client_ip_address, 45);
  const agent = string(context.client_user_agent, 1000);
  if (ip && isIP(ip)) userData.client_ip_address = ip;
  if (agent) userData.client_user_agent = agent;
  const customData: Record<string, string> = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "utm_id",
  ]) {
    const value = string(context[key], 500);
    if (value) customData[key] = value;
  }
  const sourceUrl = string(context.event_source_url, 1000);
  return {
    event_name: REGISTRATION_EVENT_NAME,
    event_time: Math.floor(new Date(event.event_time).getTime() / 1000),
    event_id: event.event_id,
    action_source: "website",
    ...(sourceUrl ? { event_source_url: trackingPageUrl(sourceUrl) } : {}),
    user_data: userData,
    ...(Object.keys(customData).length ? { custom_data: customData } : {}),
  };
}

export function registrationRetryAt(attempts: number, now = Date.now()) {
  return new Date(
    now + Math.min(6 * 60 * 60, 60 * 2 ** Math.min(attempts, 12)) * 1000
  ).toISOString();
}

// No response bodies or raw exception messages are logged: they can contain customer data.
export async function sendRegistrationEvent({
  event,
  accessToken,
  testEventCode,
  fetcher = fetch,
}: {
  event: RegistrationEvent;
  accessToken: string;
  testEventCode?: string;
  fetcher?: typeof fetch;
}) {
  try {
    const response = await fetcher(
      `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          data: [buildRegistrationPayload(event)],
          ...(testEventCode ? { test_event_code: testEventCode } : {}),
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!response.ok) return { success: false, code: `HTTP_${response.status}` } as const;
    const body: unknown = await response.json();
    return object(body).events_received === 1
      ? ({ success: true } as const)
      : ({ success: false, code: "NOT_ACKNOWLEDGED" } as const);
  } catch {
    return { success: false, code: "REQUEST_FAILED" } as const;
  }
}
