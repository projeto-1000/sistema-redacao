"use server";

import { createClient } from "@/lib/server";
import { normalizeRegistrationDetails } from "@/lib/organic-signup";
import { registrationContext } from "@/lib/integrations/meta/context";
import { scheduleRegistrationDelivery } from "@/lib/integrations/meta/delivery";
import { registerSchema, type RegisterSchema } from "@repo/validators";
import type { RegistrationAttribution } from "@repo/utils/registration-tracking";

export async function registerStudent(
  values: RegisterSchema,
  attribution?: RegistrationAttribution
) {
  const parsed = registerSchema.parse(values);
  const details = normalizeRegistrationDetails(parsed);
  const supabase = await createClient();
  const { data: exists, error } = await supabase.rpc("check_document_exists", {
    doc_to_check: details.document,
  });
  if (error) throw new Error("Não foi possível verificar o CPF no momento.");
  if (exists) throw new Error("Este CPF já está cadastrado.");
  const context = await registrationContext(attribution, "/cadastro");
  const result = await supabase.auth.signUp({
    email: details.email,
    password: parsed.password,
    options: {
      data: {
        full_name: details.name,
        document: details.document,
        phone_country_code: details.phoneCountryCode,
        phone: details.phone,
        terms_accepted_at: new Date().toISOString(),
        acquisition_channel: "ORGANIC",
        registration_attribution: context,
      },
    },
  });
  if (result.error || !result.data.user || result.data.user.identities?.length === 0) {
    throw new Error("Não foi possível criar sua conta. Verifique os dados e tente novamente.");
  }
  return {
    eventId: scheduleRegistrationDelivery(result.data.user.id),
    redirectTo: result.data.session ? "/inicio" : "/login?signup=confirm-email",
  };
}
