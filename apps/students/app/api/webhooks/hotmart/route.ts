import { NextResponse } from "next/server";
import type { HotmartWebhookPayload } from "@/types";

export const dynamic = "force-dynamic";

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

  const productUcode = payload.data?.product?.ucode;
  const productName = payload.data?.product?.name;
  const buyerEmail = payload.data?.buyer?.email;
  const buyerName = payload.data?.buyer?.name;
  const transaction = payload.data?.purchase?.transaction;
  const purchaseStatus = payload.data?.purchase?.status;
  const paymentType = payload.data?.purchase?.payment?.type;

  console.log("[HOTMART_WEBHOOK_RECEIVED]", {
    id: payload.id,
    event: payload.event,
    version: payload.version,
    productId: payload.data?.product?.id,
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

  console.log("[HOTMART_WEBHOOK_ACCEPTED]", {
    eventId: payload.id,
    transaction,
    productUcode,
    buyerEmail,
  });

  return NextResponse.json(
    {
      accepted: true,
      event: payload.event,
      transaction,
      productUcode,
      buyerEmail,
    },
    { status: 200 }
  );
}
