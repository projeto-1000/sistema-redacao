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

  <title>Sua correção está pronta!</title>

  <style type="text/css">
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #eaf3f9;
    }

    @media screen and (max-width: 600px) {
      .container {
        width: 90% !important;
      }

      .content-box {
        padding-left: 24px !important;
        padding-right: 24px !important;
      }
    }
  </style>
</head>

<body style="background-color: #eaf3f9; margin: 0; padding: 0;">
  <div
    style="
      display: none;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      color: transparent;
      mso-hide: all;
    "
  >
    Sua redação já foi corrigida. Veja seu desempenho, seus pontos fortes e onde dá para evoluir.
  </div>

  <table
    role="presentation"
    border="0"
    cellpadding="0"
    cellspacing="0"
    width="100%"
    style="background-color: #eaf3f9; padding: 40px 0;"
  >
    <tr>
      <td align="center">
        <table
          role="presentation"
          border="0"
          cellpadding="0"
          cellspacing="0"
          width="600"
          class="container"
          style="
            width: 600px;
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          "
        >
          <tr>
            <td align="center" style="padding: 24px 0 12px 0;">
              <img
                src="${PROJECT_1000_LOGO_URL}"
                alt="Projeto 1000"
                width="180"
                style="
                  display: block;
                  border: 0;
                  max-width: 100%;
                  height: auto;
                  font-family: sans-serif;
                  font-size: 18px;
                  color: #111827;
                  font-weight: bold;
                "
              >
            </td>
          </tr>

          <tr>
            <td
              align="center"
              class="content-box"
              style="padding: 24px 40px 40px 40px;"
            >
              <p
                style="
                  margin: 0 0 10px 0;
                  color: #0052d2;
                  font-size: 12px;
                  font-weight: 700;
                  letter-spacing: 1px;
                  text-transform: uppercase;
                "
              >
                CORREÇÃO CONCLUÍDA
              </p>

              <h1
                style="
                  margin: 0 0 16px 0;
                  color: #111827;
                  font-size: 28px;
                  font-weight: 800;
                  line-height: 1.2;
                "
              >
                ${safeFirstName}, sua correção está pronta!
              </h1>

              <div
                style="
                  color: #4b5563;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                <p style="margin: 0 0 16px 0;">
                  Sua redação sobre <strong>${safeEssayTitle}</strong> já foi
                  corrigida, e a análise completa está te esperando.
                </p>

                <p style="margin: 0 0 16px 0;">
                  Tenha especial atenção ao principal gargalo identificado e
                  aos próximos passos previstos. Além disso, a correção traz
                  tarefas de reescrita, caso você queira praticar imediatamente.
                </p>

                <p style="margin: 0;">
                  Lembre-se: a nota é importante, mas o mais valioso é o caminho
                  para melhorar cada vez mais.
                </p>
              </div>

              <div style="height: 28px; line-height: 28px;">&nbsp;</div>

              <table
                role="presentation"
                border="0"
                cellpadding="0"
                cellspacing="0"
              >
                <tr>
                  <td
                    align="center"
                    style="border-radius: 8px;"
                    bgcolor="#F7C325"
                  >
                    <a
                      href="${safeCorrectionUrl}"
                      target="_blank"
                      style="
                        font-size: 14px;
                        font-weight: 700;
                        background-color: #F7C325;
                        color: #000000;
                        text-decoration: none;
                        border-radius: 8px;
                        padding: 14px 28px;
                        display: inline-block;
                        border: 1px solid #f5a623;
                      "
                    >
                      Ver minha correção &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              class="content-box"
              style="padding: 0 40px 40px 40px;"
            >
              <table
                role="presentation"
                border="0"
                cellpadding="0"
                cellspacing="0"
                width="100%"
                style="
                  background-color: #eff6ff;
                  border-radius: 12px;
                  border: 1px solid #bfdbfe;
                "
              >
                <tr>
                  <td style="padding: 22px 24px;">
                    <p
                      style="
                        margin: 0 0 6px 0;
                        color: #1d4ed8;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 0.8px;
                        text-transform: uppercase;
                      "
                    >
                      Seu resultado
                    </p>

                    <p
                      style="
                        margin: 0 0 8px 0;
                        color: #111827;
                        font-size: 22px;
                        font-weight: 800;
                      "
                    >
                      Quer ver seu resultado?
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #4b5563;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      Na plataforma, você encontra a análise completa das
                      competências, o seu principal gargalo, os próximos passos
                      e suas tarefas de reescrita.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              align="center"
              class="content-box"
              style="padding: 0 40px 24px 40px;"
            >
              <p
                style="
                  margin: 0 0 10px 0;
                  color: #6b7280;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
                  border-top: 1px solid #e5e7eb;
                  padding-top: 14px;
                "
              >
                &copy; 2026 Projeto 1000 - Todos os direitos reservados.
              </p>

              <p
                style="
                  margin: 0;
                  color: #9ca3af;
                  font-size: 10px;
                  line-height: 1.5;
                "
              >
                Você recebeu este e-mail porque uma redação enviada por você
                foi corrigida no Projeto 1000.
              </p>
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
    subject: "Sua correção chegou! ✨",

    text: `Olá, ${firstName}!

Sua correção está pronta!

Sua redação sobre "${essayTitle}" já foi corrigida, e a análise completa está te esperando.

Tenha especial atenção ao principal gargalo identificado e aos próximos passos previstos. Além disso, a correção traz tarefas de reescrita, caso você queira praticar imediatamente.

Lembre-se: a nota é importante, mas o mais valioso é o caminho para melhorar cada vez mais.

Na plataforma, você encontra a análise completa das competências, o seu principal gargalo, os próximos passos e suas tarefas de reescrita.

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

  const correctionUrl = buildEssayCorrectionUrl(
    getStudentsAppUrl(),
    essayId,
  );

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
    throw new Error(
      `Resend request failed with status ${response.status}.`,
    );
  }
}