import "server-only";

interface TeacherInvitationParams {
  teacherName: string;
  signupUrl: string;
}

const PROJECT_1000_LOGO_URL =
  "https://kpaxpgjghrhklfmfbhay.supabase.co/storage/v1/object/sign/logos/logo-blue.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82ZmZjMGZhZi02NWVhLTQ5ODktOTIxMy0yZTBlOWM1MTk1YTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvcy9sb2dvLWJsdWUucG5nIiwiaWF0IjoxNzc4MTgyOTc1LCJleHAiOjE5MzU4NjI5NzV9.N5DCVJv6FwrMDI8bSq6yuQY--gggJRvwkCxJf75DFx8";

export const teacherInvitationEmail = {
  subject: "Seu convite para o Projeto 1000 chegou",
  preheader:
    "Seu cadastro como professor já foi criado. Falta só definir sua senha para acessar a plataforma.",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildTeacherInvitationEmailHtml({
  teacherName,
  signupUrl,
}: TeacherInvitationParams) {
  const name = escapeHtml(teacherName);
  const url = escapeHtml(signupUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${teacherInvitationEmail.subject}</title>

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
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">
    ${teacherInvitationEmail.preheader}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #eaf3f9; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="width: 600px; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding: 24px 0 12px 0;">
              <img src="${PROJECT_1000_LOGO_URL}" alt="Projeto 1000" width="180" style="display: block; border: 0; max-width: 100%; height: auto; font-family: sans-serif; font-size: 18px; color: #111827; font-weight: bold;">
            </td>
          </tr>

          <tr>
            <td align="center" class="content-box" style="padding: 24px 40px 40px 40px;">
              <p style="margin: 0 0 10px 0; color: #0052d2; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                BEM-VINDO(A) AO PROJETO 1000
              </p>

              <h1 style="margin: 0 20px 16px 20px; color: #111827; font-size: 28px; font-weight: 800; line-height: 1.2;">
                ${name}, seu acesso está quase pronto
              </h1>

              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; line-height: 1.7;">
                Você foi convidado(a) para fazer parte do time de professores do Projeto 1000.
              </p>

              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; line-height: 1.7;">
                Seu cadastro já foi criado pela nossa equipe. Agora falta apenas definir sua senha para acessar a plataforma e começar a acompanhar as redações disponíveis para correção.
              </p>

              <p style="margin: 0 0 28px 0; color: #4b5563; font-size: 14px; line-height: 1.7;">
                Clique no botão abaixo para finalizar seu acesso.
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" bgcolor="#F7C325" style="border-radius: 8px;">
                    <a href="${url}" target="_blank" style="display: inline-block; border: 1px solid #f5a623; border-radius: 8px; background-color: #F7C325; padding: 14px 28px; color: #000000; font-size: 14px; font-weight: 700; text-decoration: none;">
                      Criar minha senha &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;">
                <tr>
                  <td align="left" style="padding: 22px 24px;">
                    <p style="margin: 0 0 6px 0; color: #1d4ed8; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;">
                      O que acontece depois?
                    </p>
                    <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
                      Assim que criar sua senha, você já poderá entrar na plataforma de professores e acessar seu ambiente de correção.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="content-box" style="padding: 0 40px 24px 40px;">
              <p style="margin: 0 0 10px 0; padding-top: 14px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 10px; font-weight: 600; text-transform: uppercase;">
                &copy; 2026 Projeto 1000 - Todos os direitos reservados.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 10px; line-height: 1.5;">
                Você recebeu este e-mail porque um administrador do Projeto 1000 criou seu cadastro como professor. Se você não reconhece este convite, pode ignorar esta mensagem.
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

export function buildTeacherInvitationEmailText({
  teacherName,
  signupUrl,
}: TeacherInvitationParams) {
  return `Olá, ${teacherName}!

Seu acesso ao Projeto 1000 está quase pronto.

Você foi convidado(a) para fazer parte do time de professores do Projeto 1000.

Seu cadastro já foi criado pela nossa equipe. Agora falta apenas definir sua senha para acessar a plataforma e começar a acompanhar as redações disponíveis para correção.

Crie sua senha aqui:
${signupUrl}

Assim que finalizar, você já poderá acessar seu ambiente de professor.

Equipe Projeto 1000`;
}

export async function sendTeacherInvitationEmail({
  to,
  teacherName,
  signupUrl,
}: TeacherInvitationParams & { to: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from)
    throw new Error("Teacher invitation email is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: teacherInvitationEmail.subject,
      html: buildTeacherInvitationEmailHtml({ teacherName, signupUrl }),
      text: buildTeacherInvitationEmailText({ teacherName, signupUrl }),
    }),
  });

  if (!response.ok)
    throw new Error(
      `Teacher invitation email failed with status ${response.status}.`,
    );
}
