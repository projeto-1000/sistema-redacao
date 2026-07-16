import "server-only";

import { createAdminClient } from "@/lib/admin";
import type { HotmartMentorshipSignupActionResult } from "@/types";

export function isValidMentorshipSignupToken(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildHotmartBrazilianPhone(phoneCode: string | null, phone: string | null) {
  const cleanPhoneCode = phoneCode?.replace(/\D/g, "") ?? "";
  const cleanPhone = phone?.replace(/\D/g, "") ?? "";

  if (!cleanPhoneCode && !cleanPhone) {
    return null;
  }

  return `${cleanPhoneCode}${cleanPhone}`;
}

export async function getHotmartMentorshipSignupData(
  token: string
): Promise<HotmartMentorshipSignupActionResult> {
  const sanitizedToken = token.trim();

  if (!isValidMentorshipSignupToken(sanitizedToken)) {
    return { status: "invalid_token" };
  }

  const supabaseAdmin = createAdminClient();

  const { data: access, error } = await supabaseAdmin
    .from("hotmart_mentorship_accesses")
    .select(
      `
        id,
        buyer_email,
        buyer_name,
        buyer_document,
        buyer_document_type,
        buyer_phone,
        buyer_phone_code,
        purchase_status,
        claimed_at,
        claimed_user_id,
        acquisition_channel
      `
    )
    .eq("signup_token", sanitizedToken)
    .maybeSingle();

  if (error || !access) {
    return { status: "invalid_token" };
  }

  if (access.claimed_at || access.claimed_user_id) {
    return { status: "already_claimed" };
  }

  if (access.purchase_status !== "APPROVED" || access.acquisition_channel !== "HOTMART_MENTORIA") {
    return { status: "invalid_token" };
  }

  return {
    status: "success",
    data: {
      accessId: access.id,
      buyerEmail: access.buyer_email.trim().toLowerCase(),
      buyerName: access.buyer_name,
      buyerDocument: access.buyer_document,
      buyerDocumentType: access.buyer_document_type,
      phoneCountryCode: "55",
      phone: buildHotmartBrazilianPhone(access.buyer_phone_code, access.buyer_phone),
      acquisitionChannel: "HOTMART_MENTORIA",
    },
  };
}
