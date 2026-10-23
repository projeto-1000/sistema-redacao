import "server-only";

import { headers } from "next/headers";
import { isIP } from "node:net";
import { parseRegistrationAttribution } from "@repo/validators";

export async function registrationContext(
  attribution: unknown,
  path: "/cadastro" | "/cadastro/senha"
) {
  try {
    const requestHeaders = await headers();
    // Vercel replaces this header at its edge. Never trust a browser-supplied IP field.
    const candidateIp =
      process.env.VERCEL === "1"
        ? requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
        : undefined;
    const host = requestHeaders.get("host");
    const protocol = host?.startsWith("localhost") ? "http" : "https";
    return {
      ...parseRegistrationAttribution(attribution),
      ...(candidateIp && isIP(candidateIp) ? { client_ip_address: candidateIp } : {}),
      client_user_agent: requestHeaders.get("user-agent")?.slice(0, 1000),
      ...(host ? { event_source_url: `${protocol}://${host}${path}` } : {}),
    };
  } catch {
    console.error("[META_REGISTRATION_ERROR]", { code: "CONTEXT_UNAVAILABLE" });
    return {};
  }
}
