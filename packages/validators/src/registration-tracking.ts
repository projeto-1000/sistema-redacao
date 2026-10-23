import { trackingPageUrl } from "@repo/utils/registration-tracking";
import { z } from "zod";

export const registrationAttributionSchema = z.object({
  utm_source: z.string().max(500).optional(),
  utm_medium: z.string().max(500).optional(),
  utm_campaign: z.string().max(500).optional(),
  utm_content: z.string().max(500).optional(),
  utm_term: z.string().max(500).optional(),
  utm_id: z.string().max(500).optional(),
  fbclid: z.string().max(500).optional(),
  fbc: z
    .string()
    .regex(/^fb\.\d+\.\d{13}\.[A-Za-z0-9_-]+$/)
    .max(600)
    .optional(),
  fbp: z
    .string()
    .regex(/^fb\.\d+\.\d{13}\.\d+$/)
    .max(200)
    .optional(),
  landing_url: z.string().url().max(1000).optional(),
});

// Marketing metadata is optional; invalid tracking must not reject a valid signup.
export function parseRegistrationAttribution(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const parsed: Record<string, string> = {};
  for (const [key, schema] of Object.entries(registrationAttributionSchema.shape)) {
    const field = schema.safeParse(Reflect.get(value, key));
    if (field.success && field.data) {
      // PostgreSQL JSON rejects NUL and unpaired surrogates. Tracking must not invalidate Auth metadata.
      parsed[key] = new TextDecoder()
        .decode(new TextEncoder().encode(field.data))
        .replace(/\u0000/g, "");
    }
  }
  if (parsed.landing_url) {
    const safeUrl = trackingPageUrl(parsed.landing_url);
    if (safeUrl) parsed.landing_url = safeUrl;
    else delete parsed.landing_url;
  }
  // Bound serialized bytes as well as individual fields (including multibyte characters).
  return new TextEncoder().encode(JSON.stringify(parsed)).length <= 6000 ? parsed : {};
}
