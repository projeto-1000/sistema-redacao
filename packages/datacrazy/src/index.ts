import "server-only";

const DATACRAZY_REQUEST_TIMEOUT_MS = 5_000;

export type DataCrazyEvent =
  | "user_signup"
  | "essay_status_updated"
  | "subscription_updated"
  | "payment_status_updated";

interface DataCrazyStudentPayloadBase {
  lead: {
    name: string;
    phone: string;
  };
}

export type DataCrazyStudentPayload =
  | (DataCrazyStudentPayloadBase & {
      event: "user_signup" | "subscription_updated";
      plan: string;
      tokens_expire_at?: string;
    })
  | (DataCrazyStudentPayloadBase & {
      event: "essay_status_updated";
      essay_status: string;
      last_essay_score?: number;
    })
  | (DataCrazyStudentPayloadBase & {
      event: "payment_status_updated";
      payment_status: string;
    });

export type DataCrazyDeliveryErrorCode =
  | "WEBHOOK_NOT_CONFIGURED"
  | "WEBHOOK_URL_INVALID"
  | "WEBHOOK_REQUEST_FAILED"
  | "WEBHOOK_RESPONSE_FAILED";

export type DataCrazyDeliveryResult =
  | { ok: true }
  | { ok: false; errorCode: DataCrazyDeliveryErrorCode };

export async function sendDataCrazyStudentPayload(
  payload: DataCrazyStudentPayload
): Promise<DataCrazyDeliveryResult> {
  const webhookUrl = getWebhookUrl();

  if (!webhookUrl.ok) {
    return webhookUrl;
  }

  let response: Response;

  try {
    response = await fetch(webhookUrl.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(DATACRAZY_REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, errorCode: "WEBHOOK_REQUEST_FAILED" };
  }

  if (!response.ok) {
    return { ok: false, errorCode: "WEBHOOK_RESPONSE_FAILED" };
  }

  return { ok: true };
}

function getWebhookUrl():
  | { ok: true; url: string }
  | { ok: false; errorCode: DataCrazyDeliveryErrorCode } {
  const configuredUrl = process.env.DATACRAZY_WEBHOOK_URL;

  if (!configuredUrl) {
    return { ok: false, errorCode: "WEBHOOK_NOT_CONFIGURED" };
  }

  try {
    const url = new URL(configuredUrl);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, errorCode: "WEBHOOK_URL_INVALID" };
    }

    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false, errorCode: "WEBHOOK_URL_INVALID" };
  }
}
