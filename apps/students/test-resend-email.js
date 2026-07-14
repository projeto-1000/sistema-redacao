/* global process */

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;
const testEmailTo = process.env.TEST_EMAIL_TO;

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY");
}

if (!resendFromEmail) {
  throw new Error("Missing RESEND_FROM_EMAIL");
}

if (!testEmailTo) {
  throw new Error("Missing TEST_EMAIL_TO");
}

const resend = new Resend(resendApiKey);

async function testResendEmail() {
  const { data, error } = await resend.emails.send({
    from: resendFromEmail,
    to: testEmailTo,
    subject: "Teste de e-mail Projeto 1000",
    text: "Se você recebeu este e-mail, a integração com Resend está funcionando.",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h1>Teste de e-mail Projeto 1000</h1>
        <p>Se você recebeu este e-mail, a integração com Resend está funcionando.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log("Email sent:", data);
}

testResendEmail();
