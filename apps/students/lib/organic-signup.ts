import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { onlyDigits } from "@repo/utils";
import type { RegistrationDetailsSchema } from "@repo/validators";

const AUTH_USERS_PAGE_SIZE = 1_000;

export const SIGNUP_ATTEMPT_DURATION_MS = 30 * 60 * 1_000;

export function normalizeRegistrationDetails(values: RegistrationDetailsSchema) {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    document: onlyDigits(values.document),
    phoneCountryCode: onlyDigits(values.phoneCountryCode) || "55",
    phone: onlyDigits(values.phone),
  };
}

export function generateSignupToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSignupToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authUserExistsByEmail(supabaseAdmin: SupabaseClient, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });

    if (error) {
      throw new Error("Não foi possível verificar o e-mail no momento.");
    }

    if (data.users.some((user) => user.email?.trim().toLowerCase() === normalizedEmail)) {
      return true;
    }

    if (data.users.length < AUTH_USERS_PAGE_SIZE) {
      return false;
    }
  }
}
