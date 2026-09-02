import "server-only";

import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import type { CheckoutProfileForPagarme } from "@/types";
import { createPagarmeCustomer } from "@repo/payments";

export async function getOrCreatePagarmeCustomerId() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Você precisa estar logado para continuar o pagamento.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        email,
        full_name,
        document,
        phone_country_code,
        phone,
        pagarme_customer_id
      `
    )
    .eq("id", user.id)
    .single<CheckoutProfileForPagarme>();

  if (profileError || !profile) {
    throw new Error("Não foi possível encontrar o perfil do aluno.");
  }

  const existingCustomerId = profile.pagarme_customer_id?.trim();

  if (existingCustomerId) {
    if (!existingCustomerId.startsWith("cus_")) {
      throw new Error("O vínculo do aluno com a Pagar.me é inválido.");
    }

    return existingCustomerId;
  }

  if (!profile.full_name?.trim()) {
    throw new Error("Complete seu nome antes de continuar o pagamento.");
  }

  if (!profile.document?.trim()) {
    throw new Error("Complete seu CPF antes de continuar o pagamento.");
  }

  if (!profile.phone_country_code?.trim()) {
    throw new Error("Complete o código do país antes de continuar o pagamento.");
  }

  if (!profile.phone?.trim()) {
    throw new Error("Complete seu telefone antes de continuar o pagamento.");
  }

  const customer = await createPagarmeCustomer({
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    document: profile.document,
    phoneCountryCode: profile.phone_country_code,
    phone: profile.phone,
  });

  if (!customer?.id?.startsWith("cus_")) {
    throw new Error("A Pagar.me não retornou um cliente válido.");
  }

  const supabaseAdmin = createAdminClient();
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      pagarme_customer_id: customer.id,
    })
    .eq("id", user.id);

  if (updateError) {
    throw new Error("Não foi possível vincular o cliente da Pagar.me ao aluno.");
  }

  return customer.id;
}
