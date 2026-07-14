const VERCEL_BYPASS_SECRET = process.env.VERCEL_BYPASS_SECRET;
const HOTMART_WEBHOOK_TOKEN = process.env.HOTMART_WEBHOOK_TOKEN;

if (!VERCEL_BYPASS_SECRET) {
  throw new Error("Missing VERCEL_BYPASS_SECRET");
}

if (!HOTMART_WEBHOOK_TOKEN) {
  throw new Error("Missing HOTMART_WEBHOOK_TOKEN");
}

// const HOTMART_WEBHOOK_URL = `https://students-dev.vercel.app/api/webhooks/hotmart?x-vercel-protection-bypass=${encodeURIComponent(
//   VERCEL_BYPASS_SECRET
// )}`;

const HOTMART_WEBHOOK_URL = "http://localhost:3001/api/webhooks/hotmart";

async function testHotmartWebhook() {
  const response = await fetch(HOTMART_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hotmart-hottok": HOTMART_WEBHOOK_TOKEN,
    },
    body: JSON.stringify({
      id: `evt_test_${Date.now()}`,
      creation_date: Date.now(),
      event: "PURCHASE_APPROVED",
      version: "2.0.0",
      data: {
        product: {
          id: 213344,
          ucode: "fb056612-bcc6-4217-9e6d-2a5d1110ac2f",
          name: "Mentoria ENEM Teste",
        },
        buyer: {
          email: "fernandaleitefelix@gmail.com",
          name: "Aluno Teste",
          first_name: "Aluno",
          last_name: "Teste",
          checkout_phone: "999999999",
          checkout_phone_code: "11",
          document: "12345678901",
          document_type: "CPF",
        },
        purchase: {
          transaction: `HP_TEST_${Date.now()}`,
          status: "APPROVED",
          approved_date: Date.now(),
          payment: {
            type: "CREDIT_CARD",
          },
        },
      },
    }),
  });

  const result = await response.text();

  console.log("Status:", response.status);
  console.log("Response:", result);
}

testHotmartWebhook();
