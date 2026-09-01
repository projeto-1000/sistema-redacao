import "server-only";

import { getFirstName } from "@repo/utils";
import { buildEssayCorrectionUrl } from "./correction-url";

interface SendEssayCorrectionAvailableEmailParams {
  to: string;
  studentName: string | null;
  essayId: string;
  essayTitle: string;
}

interface GetEssayCorrectionEmailContentParams {
  studentName: string | null | undefined;
  essayTitle: string;
  correctionUrl: string;
}

const PROJECT_1000_LOGO_URL =
  "https://kpaxpgjghrhklfmfbhay.supabase.co/storage/v1/object/sign/logos/logo-blue.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82ZmZjMGZhZi02NWVhLTQ5ODktOTIxMy0yZTBlOWM1MTk1YTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvcy9sb2dvLWJsdWUucG5nIiwiaWF0IjoxNzc4MTgyOTc1LCJleHAiOjE5MzU4NjI5NzV9.N5DCVJv6FwrMDI8bSq6yuQY--gggJRvwkCxJf75DFx8";

function getStudentsAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_STUDENTS_APP_URL;

  if (!appUrl) {
    throw new Error("Missing NEXT_PUBLIC_STUDENTS_APP_URL.");
  }

  return appUrl;
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  if (!from) {
    throw new Error("Missing RESEND_FROM_EMAIL.");
  }

  return { apiKey, from };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildEssayCorrectionAvailableEmailHtml({
  correctionUrl,
  essayTitle,
  firstName,
}: {
  correctionUrl: string;
  essayTitle: string;
  firstName: string;
}) {
  const safeCorrectionUrl = escapeHtml(correctionUrl);
  const safeEssayTitle = escapeHtml(essayTitle);
  const safeFirstName = escapeHtml(firstName);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Sua correção está pronta</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: "Lexend", "Trebuchet MS", Arial, sans-serif; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: "Lexend", "Trebuchet MS", Arial, sans-serif; background-color: #eaf3f9; }

    @media screen and (max-width: 600px) {
      .container { width: 90% !important; }
      .content-box { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>

<body style="background-color: #eaf3f9; margin: 0; padding: 0; font-family: &quot;Lexend&quot;, &quot;Trebuchet MS&quot;, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #eaf3f9; padding: 40px 0; font-family: &quot;Lexend&quot;, &quot;Trebuchet MS&quot;, Arial, sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding: 30px 0 10px 0;">
              <img src="${PROJECT_1000_LOGO_URL}" alt="Projeto 1000" width="180" style="display: block; border: 0; max-width: 100%; height: auto; font-family: &quot;Lexend&quot;, &quot;Trebuchet MS&quot;, Arial, sans-serif; font-size: 18px; color: #111827; font-weight: bold;">
            </td>
          </tr>

          <tr>
            <td align="left" style="padding: 24px 40px 40px 40px;" class="content-box">
              <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.6;">Olá, <strong>${safeFirstName}</strong>!</p>

              <p align="center" style="margin: 0 0 10px 0; color: #0052d2; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">FEEDBACK DA REDAÇÃO</p>

              <h1 align="center" style="margin: 0 0 14px 0; color: #111827; font-size: 28px; font-weight: 800; line-height: 1.2;">Sua correção está pronta!</h1>

              <p align="center" style="margin: 0 auto 24px auto; max-width: 460px; color: #4b5563; font-size: 15px; line-height: 1.7;">Chegou a hora de olhar para o seu texto com mais atenção e descobrir onde estão seus acertos e os principais pontos para evoluir.</p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; background-color: #f2f7fc; border: 1px solid #dbe8f5; border-radius: 10px;">
                <tr>
                  <td align="center" style="padding: 18px 20px;">
                    <p style="margin: 0 0 8px 0; color: #0052d2; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">TEMA DA REDAÇÃO</p>
                    <p style="margin: 0; color: #172033; font-size: 16px; font-weight: 700; line-height: 1.5;">&ldquo;${safeEssayTitle}&rdquo;</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 14px 0; color: #111827; font-size: 15px; font-weight: 700; line-height: 1.6;">Na sua correção, você vai encontrar:</p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr><td valign="top" width="30" style="padding: 3px 0 9px 0;"><span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: #e9f2ff; color: #0052d2; font-size: 12px; font-weight: 700; line-height: 20px; text-align: center;">&#10003;</span></td><td valign="top" style="padding: 2px 0 9px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Avaliação nas cinco competências</td></tr>
                <tr><td valign="top" width="30" style="padding: 3px 0 9px 0;"><span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: #e9f2ff; color: #0052d2; font-size: 12px; font-weight: 700; line-height: 20px; text-align: center;">&#10003;</span></td><td valign="top" style="padding: 2px 0 9px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Comentários do professor</td></tr>
                <tr><td valign="top" width="30" style="padding: 3px 0 9px 0;"><span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: #e9f2ff; color: #0052d2; font-size: 12px; font-weight: 700; line-height: 20px; text-align: center;">&#10003;</span></td><td valign="top" style="padding: 2px 0 9px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Apontamentos diretamente no texto</td></tr>
                <tr><td valign="top" width="30" style="padding: 3px 0 9px 0;"><span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: #e9f2ff; color: #0052d2; font-size: 12px; font-weight: 700; line-height: 20px; text-align: center;">&#10003;</span></td><td valign="top" style="padding: 2px 0 9px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Principal ponto de atenção</td></tr>
                <tr><td valign="top" width="30" style="padding: 3px 0 0 0;"><span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: #e9f2ff; color: #0052d2; font-size: 12px; font-weight: 700; line-height: 20px; text-align: center;">&#10003;</span></td><td valign="top" style="padding: 2px 0 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Plano de melhoria e próximos passos</td></tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 22px 0;">
                    <a href="${safeCorrectionUrl}" target="_blank" style="font-size: 14px; font-weight: 700; background-color: #F7C325; color: #000; text-decoration: none; border-radius: 8px; padding: 14px 30px; display: inline-block; border: 1px solid #f5a623;">Ver minha correção</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">Se o botão não funcionar, copie e cole este link no navegador:</p>
              <p style="margin: 8px 0 0 0; color: #2563eb; font-size: 12px; line-height: 1.6; word-break: break-all;"><a href="${safeCorrectionUrl}" target="_blank" style="color: #2563eb;">${safeCorrectionUrl}</a></p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 0 40px;">
              <p style="margin-bottom: 10px; color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase; border-top: 1px solid #e5e7eb; padding-top: 14px;">&copy; 2026 Projeto 1000 - Todos os direitos reservados.</p>
              <p style="margin-bottom: 20px; color: #9ca3af; font-size: 10px; line-height: 1.5;">Você recebeu este e-mail porque enviou uma redação para correção no Projeto 1000.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getEssayCorrectionEmailContent({
  studentName,
  essayTitle,
  correctionUrl,
}: GetEssayCorrectionEmailContentParams) {
  const firstName = getFirstName(studentName) || "Aluno(a)";

  return {
    subject: "Sua correção está pronta",
    text: `Olá, ${firstName}!

FEEDBACK DA REDAÇÃO

Sua correção está pronta!

Chegou a hora de olhar para o seu texto com mais atenção e descobrir onde estão seus acertos e os principais pontos para evoluir.

Tema da redação:

"${essayTitle}"

Na sua correção, você vai encontrar:

- Avaliação nas cinco competências
- Comentários do professor
- Apontamentos diretamente no texto
- Principal ponto de atenção
- Plano de melhoria e próximos passos

Ver minha correção:
${correctionUrl}

Equipe Projeto 1000`,
    html: buildEssayCorrectionAvailableEmailHtml({
      correctionUrl,
      essayTitle,
      firstName,
    }),
  };
}

export async function sendEssayCorrectionAvailableEmail({
  to,
  studentName,
  essayId,
  essayTitle,
}: SendEssayCorrectionAvailableEmailParams) {
  const { apiKey, from } = getResendConfig();
  const correctionUrl = buildEssayCorrectionUrl(getStudentsAppUrl(), essayId);
  const content = getEssayCorrectionEmailContent({
    studentName,
    essayTitle,
    correctionUrl,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      ...content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend request failed with status ${response.status}.`);
  }
}
