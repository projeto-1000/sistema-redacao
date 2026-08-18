"use server";

import { createClient } from "@supabase/supabase-js";
import { onlyDigits } from "@repo/utils";
import {
  registrationDetailsSchema,
  type RegistrationDetailsSchema,
} from "@repo/validators";

const UTM_VALUE_MAX_LENGTH = 200;

export async function upsertWebsiteLead(input: {
  registration: RegistrationDetailsSchema;
  utm: Record<string, string>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsedRegistration = registrationDetailsSchema.safeParse(
    input.registration,
  );

  if (!parsedRegistration.success) {
    return {
      ok: false,
      error: "Revise os dados informados e tente novamente.",
    };
  }

  const leadsUrl = process.env.LEADS_SUPABASE_URL;
  const leadsSecretKey = process.env.LEADS_SUPABASE_SECRET_KEY;

  if (!leadsUrl || !leadsSecretKey) {
    console.warn("[WEBSITE_LEAD_SKIPPED]", { code: "LEADS_CONFIG_MISSING" });
    return { ok: true };
  }

  const registration = parsedRegistration.data;
  const utm = Object.fromEntries(
    Object.entries(input.utm)
      .filter(
        ([key, value]) => key.startsWith("utm_") && typeof value === "string",
      )
      .map(([key, value]) => [key, value.slice(0, UTM_VALUE_MAX_LENGTH)]),
  );

  const leadsClient = createClient(leadsUrl, leadsSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await leadsClient.from("leads").upsert(
    {
      nome: registration.name.trim(),
      email: registration.email.trim().toLowerCase(),
      cpf: onlyDigits(registration.document),
      whatsapp: `${onlyDigits(registration.phoneCountryCode)}${onlyDigits(registration.phone)}`,
      origem: "site-cadastro",
      utm,
    },
    { onConflict: "email" },
  );

  // if (error) {
  //   console.error("[WEBSITE_LEAD_ERROR]", { code: "LEAD_UPSERT_FAILED" });
  //   return {
  //     ok: false,
  //     error: "Não foi possível salvar seus dados no momento. Tente novamente.",
  //   };
  // }

  if (!leadsUrl || !leadsSecretKey) {
  console.warn("[WEBSITE_LEAD_SKIPPED]", {
    code: "LEADS_CONFIG_MISSING",
  });

  return { ok: true };
}

  return { ok: true };
}
