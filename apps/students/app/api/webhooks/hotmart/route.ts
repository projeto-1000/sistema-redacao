import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface HotmartWebhookPayload {
  id: string;
  creation_date: number;
  event: string;
  version: string;
  data?: {
    product?: {
      id?: number;
      ucode?: string;
      name?: string;
    };
    buyer?: {
      email?: string;
      name?: string;
      first_name?: string;
      last_name?: string;
      checkout_phone?: string;
      checkout_phone_code?: string;
      document?: string;
      document_type?: string;
    };
    purchase?: {
      transaction?: string;
      status?: string;
      approved_date?: number;
      payment?: {
        type?: string;
      };
    };
  };
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

  let payload: HotmartWebhookPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  console.log("[HOTMART_WEBHOOK_RECEIVED]", {
    id: payload.id,
    event: payload.event,
    version: payload.version,
    productId: payload.data?.product?.id,
    productUcode: payload.data?.product?.ucode,
    productName: payload.data?.product?.name,
    buyerEmail: payload.data?.buyer?.email,
    buyerName: payload.data?.buyer?.name,
    transaction: payload.data?.purchase?.transaction,
    purchaseStatus: payload.data?.purchase?.status,
    paymentType: payload.data?.purchase?.payment?.type,
  });

  return NextResponse.json(
    {
      received: true,
      event: payload.event,
      transaction: payload.data?.purchase?.transaction ?? null,
    },
    { status: 200 }
  );
}
