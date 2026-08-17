import { createAdminClient } from "@/lib/admin";
import {
  authUserExistsByEmail,
  generateSignupToken,
  hashSignupToken,
  normalizeRegistrationDetails,
  SIGNUP_ATTEMPT_DURATION_MS,
} from "@/lib/organic-signup";
import { registrationDetailsSchema } from "@repo/validators";
import { NextResponse } from "next/server";

function getCorsHeaders(request: Request): Headers | null {
  const origin = request.headers.get("origin");

  if (!origin) {
    return new Headers();
  }

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_ORGANIC_SIGNUP_ALLOWED_ORIGIN;

  if (origin !== requestOrigin && origin !== configuredOrigin) {
    return null;
  }

  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  });
}

export function OPTIONS(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  if (!corsHeaders) {
    return NextResponse.json({ error: "Origem não autorizada." }, { status: 403 });
  }

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Dados de cadastro inválidos." },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsedBody = registrationDetailsSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Dados de cadastro inválidos." },
        { status: 400, headers: corsHeaders }
      );
    }

    const details = normalizeRegistrationDetails(parsedBody.data);
    const supabaseAdmin = createAdminClient();
    const { data: documentExists, error: documentError } = await supabaseAdmin.rpc(
      "check_document_exists",
      {
        doc_to_check: details.document,
      }
    );

    if (documentError) {
      throw new Error("Não foi possível verificar o CPF no momento.");
    }

    if (documentExists === true) {
      return NextResponse.json(
        {
          code: "DOCUMENT_ALREADY_REGISTERED",
          error: "Este CPF já está cadastrado.",
        },
        { status: 409, headers: corsHeaders }
      );
    }

    if (await authUserExistsByEmail(supabaseAdmin, details.email)) {
      return NextResponse.json(
        {
          code: "EMAIL_ALREADY_REGISTERED",
          error: "Este e-mail já está cadastrado.",
        },
        { status: 409, headers: corsHeaders }
      );
    }

    const token = generateSignupToken();
    const { error: insertError } = await supabaseAdmin.from("signup_attempts").insert({
      token_hash: hashSignupToken(token),
      name: details.name,
      email: details.email,
      document: details.document,
      phone_country_code: details.phoneCountryCode,
      phone: details.phone,
      terms_accepted_at: new Date().toISOString(),
      acquisition_channel: "ORGANIC",
      expires_at: new Date(Date.now() + SIGNUP_ATTEMPT_DURATION_MS).toISOString(),
    });

    if (insertError) {
      throw new Error("Não foi possível iniciar o cadastro.");
    }

    const continuationUrl = new URL("/cadastro/senha", request.url);
    continuationUrl.searchParams.set("token", token);

    return NextResponse.json(
      { token, continuationUrl: continuationUrl.toString() },
      { status: 201, headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível iniciar o cadastro no momento." },
      { status: 500, headers: corsHeaders }
    );
  }
}
