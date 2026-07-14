import { createAdminClient } from "@/lib/admin";
import type { HotmartWebhookPayload } from "@/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getHotmartDate(timestamp?: number) {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "hotmart-webhook",
  });
}

export async function POST(req: Request) {
  const expectedHottok = process.env.HOTMART_WEBHOOK_TOKEN;
  const receivedHottok = req.headers.get("x-hotmart-hottok");

  if (!expectedHottok) {
    console.error("[HOTMART_WEBHOOK_CONFIG_ERROR]", {
      message: "Missing HOTMART_WEBHOOK_TOKEN",
    });

    return NextResponse.json({ error: "Webhook token is not configured" }, { status: 500 });
  }

  if (receivedHottok !== expectedHottok) {
    console.warn("[HOTMART_WEBHOOK_UNAUTHORIZED]", {
      hasReceivedHottok: Boolean(receivedHottok),
    });

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mentorshipProductUcode = process.env.HOTMART_MENTORSHIP_PRODUCT_UCODE;

  if (!mentorshipProductUcode) {
    console.error("[HOTMART_WEBHOOK_CONFIG_ERROR]", {
      message: "Missing HOTMART_MENTORSHIP_PRODUCT_UCODE",
    });

    return NextResponse.json({ error: "Mentorship product is not configured" }, { status: 500 });
  }

  let payload: HotmartWebhookPayload;

  try {
    payload = (await req.json()) as HotmartWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const productId = payload.data?.product?.id ?? null;
  const productUcode = payload.data?.product?.ucode;
  const productName = payload.data?.product?.name ?? null;

  const buyerEmail = payload.data?.buyer?.email?.trim().toLowerCase();
  const buyerName = payload.data?.buyer?.name ?? null;
  const buyerDocument = payload.data?.buyer?.document ?? null;
  const buyerDocumentType = payload.data?.buyer?.document_type ?? null;
  const buyerPhone = payload.data?.buyer?.checkout_phone ?? null;
  const buyerPhoneCode = payload.data?.buyer?.checkout_phone_code ?? null;

  const transaction = payload.data?.purchase?.transaction;
  const purchaseStatus = payload.data?.purchase?.status;
  const paymentType = payload.data?.purchase?.payment?.type ?? null;
  const approvedAt = getHotmartDate(payload.data?.purchase?.approved_date);

  console.log("[HOTMART_WEBHOOK_RECEIVED]", {
    id: payload.id,
    event: payload.event,
    version: payload.version,
    productId,
    productUcode,
    productName,
    buyerEmail,
    buyerName,
    transaction,
    purchaseStatus,
    paymentType,
  });

  if (payload.event !== "PURCHASE_APPROVED") {
    console.log("[HOTMART_WEBHOOK_IGNORED]", {
      reason: "unsupported_event",
      event: payload.event,
    });

    return NextResponse.json(
      {
        ignored: true,
        reason: "unsupported_event",
      },
      { status: 200 }
    );
  }

  if (purchaseStatus !== "APPROVED") {
    console.log("[HOTMART_WEBHOOK_IGNORED]", {
      reason: "purchase_not_approved",
      purchaseStatus,
    });

    return NextResponse.json(
      {
        ignored: true,
        reason: "purchase_not_approved",
      },
      { status: 200 }
    );
  }

  if (productUcode !== mentorshipProductUcode) {
    console.log("[HOTMART_WEBHOOK_IGNORED]", {
      reason: "product_not_mapped",
      productUcode,
    });

    return NextResponse.json(
      {
        ignored: true,
        reason: "product_not_mapped",
      },
      { status: 200 }
    );
  }

  if (!transaction || !buyerEmail) {
    console.error("[HOTMART_WEBHOOK_INVALID_PAYLOAD]", {
      hasTransaction: Boolean(transaction),
      hasBuyerEmail: Boolean(buyerEmail),
    });

    return NextResponse.json({ error: "Missing required Hotmart payload fields" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: webhookEvent, error: webhookEventError } = await supabaseAdmin
    .from("hotmart_webhook_events")
    .upsert(
      {
        hotmart_event_id: payload.id,
        event: payload.event,
        version: payload.version,

        product_id: productId,
        product_ucode: productUcode,
        product_name: productName,

        transaction_id: transaction,

        buyer_email: buyerEmail,
        buyer_name: buyerName,
        buyer_document: buyerDocument,
        buyer_document_type: buyerDocumentType,
        buyer_phone: buyerPhone,
        buyer_phone_code: buyerPhoneCode,

        purchase_status: purchaseStatus,
        payment_type: paymentType,
        approved_at: approvedAt,

        payload: JSON.parse(JSON.stringify(payload)),
      },
      {
        onConflict: "hotmart_event_id",
      }
    )
    .select("id")
    .single();

  if (webhookEventError || !webhookEvent) {
    console.error("[HOTMART_WEBHOOK_STORE_ERROR]", {
      error: webhookEventError,
      hotmartEventId: payload.id,
      transaction,
    });

    return NextResponse.json({ error: "Could not store Hotmart webhook event" }, { status: 500 });
  }

  const { data: mentorshipAccess, error: mentorshipAccessError } = await supabaseAdmin
    .from("hotmart_mentorship_accesses")
    .upsert(
      {
        webhook_event_id: webhookEvent.id,

        transaction_id: transaction,
        product_ucode: productUcode,
        product_name: productName,

        buyer_email: buyerEmail,
        buyer_name: buyerName,
        buyer_document: buyerDocument,
        buyer_document_type: buyerDocumentType,
        buyer_phone: buyerPhone,
        buyer_phone_code: buyerPhoneCode,

        purchase_status: purchaseStatus,
        approved_at: approvedAt,
        payment_type: paymentType,

        acquisition_channel: "HOTMART_MENTORIA",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "transaction_id",
      }
    )
    .select("id, signup_token")
    .single();

  if (mentorshipAccessError || !mentorshipAccess) {
    console.error("[HOTMART_MENTORSHIP_ACCESS_STORE_ERROR]", {
      error: mentorshipAccessError,
      transaction,
      buyerEmail,
      webhookEventId: webhookEvent.id,
    });

    return NextResponse.json(
      { error: "Could not store Hotmart mentorship access" },
      { status: 500 }
    );
  }

  console.log("[HOTMART_WEBHOOK_ACCEPTED]", {
    webhookEventId: webhookEvent.id,
    mentorshipAccessId: mentorshipAccess.id,
    eventId: payload.id,
    transaction,
    productUcode,
    buyerEmail,
  });

  return NextResponse.json(
    {
      accepted: true,
      webhookEventId: webhookEvent.id,
      mentorshipAccessId: mentorshipAccess.id,
      event: payload.event,
      transaction,
      productUcode,
      buyerEmail,
    },
    { status: 200 }
  );
}
