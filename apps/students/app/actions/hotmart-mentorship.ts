"use server";

import { createAdminClient } from "@/lib/admin";
import { createClient } from "@/lib/server";
import { createPagarmeCustomer } from "@repo/payments";
import { registerSchema, type RegisterSchema } from "@repo/validators";
import { isValidMentorshipSignupToken } from "@/lib/hotmart/mentorship-signup";

interface CompleteHotmartMentorshipSignupInput {
  token: string;
  values: RegisterSchema;
}

export async function completeHotmartMentorshipSignup({
  token,
  values,
}: CompleteHotmartMentorshipSignupInput) {
  const sanitizedToken = token.trim();

  if (!isValidMentorshipSignupToken(sanitizedToken)) {
    throw new Error("Link de cadastro inválido.");
  }

  const parsedValues = registerSchema.parse(values);

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const { data: access, error: accessError } = await supabaseAdmin
    .from("hotmart_mentorship_accesses")
    .select(
      `
        id,
        transaction_id,
        buyer_email,
        buyer_name,
        purchase_status,
        claimed_at,
        claimed_user_id,
        acquisition_channel
      `
    )
    .eq("signup_token", sanitizedToken)
    .maybeSingle();

  if (accessError || !access) {
    throw new Error("Link de cadastro inválido ou expirado.");
  }

  if (access.claimed_at || access.claimed_user_id) {
    throw new Error("Este link de cadastro já foi utilizado.");
  }

  if (access.purchase_status !== "APPROVED") {
    throw new Error("Este acesso ainda não está liberado.");
  }

  const accessEmail = access.buyer_email.trim().toLowerCase();
  const submittedEmail = parsedValues.email.trim().toLowerCase();

  if (submittedEmail !== accessEmail) {
    throw new Error("O e-mail informado não corresponde ao e-mail da compra.");
  }

  const cleanDocument = parsedValues.document.replace(/\D/g, "");
  const cleanPhoneCountryCode = parsedValues.phoneCountryCode.replace(/\D/g, "") || "55";
  const cleanPhone = parsedValues.phone.replace(/\D/g, "");
  const termsAcceptedAt = parsedValues.terms ? new Date().toISOString() : null;

  const { error: documentError } = await supabaseAdmin.rpc("check_document_exists", {
    doc_to_check: cleanDocument,
  });

  if (documentError) {
    throw new Error("Este CPF já está cadastrado.");
  }

  const { data: plan, error: planError } = await supabaseAdmin
    .from("plans")
    .select("id, name")
    .eq("external_id", "internal_mentoria_free")
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    throw new Error("Plano Mentoria não encontrado.");
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: submittedEmail,
    password: parsedValues.password,
    options: {
      data: {
        full_name: parsedValues.name.trim(),
        document: cleanDocument,
        phone_country_code: cleanPhoneCountryCode,
        phone: cleanPhone,
        terms_accepted_at: termsAcceptedAt,
        acquisition_channel: "HOTMART_MENTORIA",
      },
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Não foi possível criar sua conta.");
  }

  const userId = authData.user.id;

  const pagarmeCustomer = await createPagarmeCustomer({
    id: userId,
    name: parsedValues.name.trim(),
    email: submittedEmail,
    document: cleanDocument,
    phoneCountryCode: cleanPhoneCountryCode,
    phone: cleanPhone,
  });

  if (!pagarmeCustomer?.id) {
    throw new Error("A Pagar.me não retornou um cliente válido.");
  }

  const { error: profileUpdateError } = await supabaseAdmin
    .from("profiles")
    .update({
      pagarme_customer_id: pagarmeCustomer.id,
      acquisition_channel: "HOTMART_MENTORIA",
    })
    .eq("id", userId);

  if (profileUpdateError) {
    throw new Error("Não foi possível atualizar o perfil do aluno.");
  }

  const now = new Date().toISOString();

  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan_id: plan.id,
        status: "active",
        current_period_start: now,
        cancel_at_period_end: false,
        external_id: `hotmart:${access.transaction_id}`,
        payment_method: null,
        payment_card_id: null,
        metadata: {
          provider: "hotmart",
          acquisition_channel: "HOTMART_MENTORIA",
          hotmart_transaction_id: access.transaction_id,
          hotmart_access_id: access.id,
        },
        updated_at: now,
      },
      {
        onConflict: "user_id",
      }
    )
    .select("id")
    .single();

  if (subscriptionError || !subscription) {
    throw new Error("Não foi possível ativar o Plano Mentoria.");
  }

  const { error: creditScheduleError } = await supabaseAdmin.rpc(
    "initialize_mentorship_credit_schedule",
    {
      p_access_id: access.id,
      p_subscription_id: subscription.id,
      p_user_id: userId,
      p_start_at: now,
    }
  );

  if (creditScheduleError) {
    console.error("[INITIALIZE_MENTORSHIP_CREDIT_SCHEDULE_ERROR]", creditScheduleError);

    throw new Error("Não foi possível configurar os créditos da mentoria.");
  }

  const { data: claimedAccess, error: claimError } = await supabaseAdmin
    .from("hotmart_mentorship_accesses")
    .update({
      claimed_at: now,
      claimed_user_id: userId,
      updated_at: now,
    })
    .eq("id", access.id)
    .is("claimed_at", null)
    .select("id")
    .single();

  if (claimError || !claimedAccess) {
    throw new Error("Não foi possível concluir o vínculo da mentoria.");
  }

  return {
    success: true,
    userId,
    subscriptionId: subscription.id,
  };
}
