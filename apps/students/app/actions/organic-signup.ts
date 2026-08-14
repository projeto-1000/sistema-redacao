"use server";

import { createAdminClient } from "@/lib/admin";
import { authUserExistsByEmail, hashSignupToken } from "@/lib/organic-signup";
import { createClient } from "@/lib/server";
import { createPagarmeCustomer } from "@repo/payments";
import { passwordSetupSchema } from "@repo/validators";

interface CompleteOrganicSignupInput {
  token: string;
  password: string;
  confirmPassword: string;
}

type SignupAttemptErrorCode =
  | "DOCUMENT_CHECK_FAILED"
  | "EMAIL_CHECK_FAILED"
  | "AUTH_SIGNUP_FAILED"
  | "PAGARME_CUSTOMER_FAILED"
  | "COMPLETION_FAILED";

const PROCESSING_LOCK_DURATION_MS = 5 * 60 * 1_000;

async function recordSignupAttemptError({
  supabaseAdmin,
  attemptId,
  code,
  expectedProcessingAt,
  releaseLock = false,
}: {
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  attemptId: string;
  code: SignupAttemptErrorCode;
  expectedProcessingAt?: string | null;
  releaseLock?: boolean;
}) {
  let query = supabaseAdmin
    .from("signup_attempts")
    .update({
      last_error_code: code,
      last_error_at: new Date().toISOString(),
      ...(releaseLock ? { processing_at: null } : {}),
    })
    .eq("id", attemptId);

  if (expectedProcessingAt === null) {
    query = query.is("processing_at", null);
  } else if (expectedProcessingAt) {
    query = query.eq("processing_at", expectedProcessingAt);
  }

  await query;

  console.error("[ORGANIC_SIGNUP_ERROR]", {
    attempt_id: attemptId,
    error_code: code,
  });
}

export type CompleteOrganicSignupResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

export async function completeOrganicSignup(
  input: CompleteOrganicSignupInput
): Promise<CompleteOrganicSignupResult> {
  const parsedPassword = passwordSetupSchema.safeParse({
    password: input.password,
    confirmPassword: input.confirmPassword,
  });

  if (!parsedPassword.success) {
    return {
      success: false,
      error: parsedPassword.error.issues[0]?.message ?? "Senha inválida.",
    };
  }

  const token = typeof input.token === "string" ? input.token.trim() : "";

  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return { success: false, error: "Link de cadastro inválido." };
  }

  let supabaseAdmin: ReturnType<typeof createAdminClient>;

  try {
    supabaseAdmin = createAdminClient();
  } catch {
    return { success: false, error: "Não foi possível validar o cadastro." };
  }
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from("signup_attempts")
    .select(
      "id, name, email, document, phone_country_code, phone, terms_accepted_at, acquisition_channel, expires_at, processing_at, completed_at"
    )
    .eq("token_hash", hashSignupToken(token))
    .maybeSingle();

  if (attemptError) {
    return { success: false, error: "Não foi possível validar o cadastro." };
  }

  if (!attempt) {
    return { success: false, error: "Link de cadastro inválido." };
  }

  if (attempt.acquisition_channel !== "ORGANIC") {
    return { success: false, error: "Link de cadastro inválido." };
  }

  if (attempt.completed_at) {
    return { success: false, error: "Este link de cadastro já foi utilizado." };
  }

  const processingLockCutoffMs = Date.now() - PROCESSING_LOCK_DURATION_MS;

  if (attempt.processing_at && new Date(attempt.processing_at).getTime() > processingLockCutoffMs) {
    return {
      success: false,
      error: "Este cadastro já está sendo finalizado.",
    };
  }

  if (new Date(attempt.expires_at).getTime() <= Date.now()) {
    return { success: false, error: "Este link de cadastro expirou." };
  }

  const { data: documentExists, error: documentError } = await supabaseAdmin.rpc(
    "check_document_exists",
    {
      doc_to_check: attempt.document,
    }
  );

  if (documentError) {
    await recordSignupAttemptError({
      supabaseAdmin,
      attemptId: attempt.id,
      code: "DOCUMENT_CHECK_FAILED",
      expectedProcessingAt: attempt.processing_at,
    });

    return { success: false, error: "Não foi possível verificar o CPF no momento." };
  }

  if (documentExists === true) {
    return { success: false, error: "Este CPF já está cadastrado." };
  }

  try {
    if (await authUserExistsByEmail(supabaseAdmin, attempt.email)) {
      return { success: false, error: "Este e-mail já está cadastrado." };
    }
  } catch {
    await recordSignupAttemptError({
      supabaseAdmin,
      attemptId: attempt.id,
      code: "EMAIL_CHECK_FAILED",
      expectedProcessingAt: attempt.processing_at,
    });

    return { success: false, error: "Não foi possível verificar o e-mail no momento." };
  }

  const processingAt = new Date().toISOString();
  const processingLockCutoff = new Date(processingLockCutoffMs).toISOString();
  const { data: claimedAttempt, error: claimError } = await supabaseAdmin
    .from("signup_attempts")
    .update({
      processing_at: processingAt,
      last_error_code: null,
      last_error_at: null,
    })
    .eq("id", attempt.id)
    .or(`processing_at.is.null,processing_at.lte.${processingLockCutoff}`)
    .is("completed_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("[ORGANIC_SIGNUP_CLAIM_ERROR]", {
      code: claimError.code,
      message: claimError.message,
      details: claimError.details,
      hint: claimError.hint,
    });
    return { success: false, error: "Não foi possível finalizar o cadastro." };
  }

  if (!claimedAttempt) {
    return {
      success: false,
      error: "Este cadastro já está sendo finalizado.",
    };
  }

  let authUserId: string;
  let hasSession = false;

  try {
    const supabase = await createClient();
    const result = await supabase.auth.signUp({
      email: attempt.email,
      password: parsedPassword.data.password,
      options: {
        data: {
          full_name: attempt.name,
          document: attempt.document,
          phone_country_code: attempt.phone_country_code,
          phone: attempt.phone,
          terms_accepted_at: attempt.terms_accepted_at,
          acquisition_channel: "ORGANIC",
        },
      },
    });

    if (result.error || !result.data.user) {
      throw new Error("AUTH_SIGNUP_FAILED");
    }

    authUserId = result.data.user.id;
    hasSession = Boolean(result.data.session);
  } catch {
    await recordSignupAttemptError({
      supabaseAdmin,
      attemptId: attempt.id,
      code: "AUTH_SIGNUP_FAILED",
      expectedProcessingAt: processingAt,
      releaseLock: true,
    });

    return {
      success: false,
      error: "Não foi possível criar sua conta. Verifique os dados e tente novamente.",
    };
  }

  try {
    const pagarmeCustomer = await createPagarmeCustomer({
      id: authUserId,
      name: attempt.name,
      email: attempt.email,
      document: attempt.document,
      phoneCountryCode: attempt.phone_country_code,
      phone: attempt.phone,
    });

    if (pagarmeCustomer?.id) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({
          pagarme_customer_id: pagarmeCustomer.id,
          phone_country_code: attempt.phone_country_code,
          phone: attempt.phone,
        })
        .eq("id", authUserId);

      if (profileUpdateError) {
        await recordSignupAttemptError({
          supabaseAdmin,
          attemptId: attempt.id,
          code: "PAGARME_CUSTOMER_FAILED",
          expectedProcessingAt: processingAt,
        });
      }
    } else {
      throw new Error("PAGARME_CUSTOMER_FAILED");
    }
  } catch {
    await recordSignupAttemptError({
      supabaseAdmin,
      attemptId: attempt.id,
      code: "PAGARME_CUSTOMER_FAILED",
      expectedProcessingAt: processingAt,
    });
  }

  const { data: completedAttempt, error: completionError } = await supabaseAdmin
    .from("signup_attempts")
    .update({ completed_at: new Date().toISOString(), processing_at: null })
    .eq("id", attempt.id)
    .eq("processing_at", processingAt)
    .is("completed_at", null)
    .select("id")
    .maybeSingle();

  if (completionError || !completedAttempt) {
    await recordSignupAttemptError({
      supabaseAdmin,
      attemptId: attempt.id,
      code: "COMPLETION_FAILED",
      expectedProcessingAt: processingAt,
    });

    return {
      success: false,
      error:
        "Sua conta foi criada, mas não foi possível concluir o fluxo. Faça login para continuar.",
    };
  }

  return {
    success: true,
    redirectTo: hasSession ? "/inicio" : "/login?signup=confirm-email",
  };
}
