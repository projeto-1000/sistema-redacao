import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildStudentInvitationEmailParams {
  studentName: string;
  signupUrl: string;
}

export const studentInvitationEmail = {
  subject: "Seu acesso ao Projeto 1000 está liberado! 🚀",
  preheader: "Finalize seu cadastro, ganhe 1 crédito gratuito e envie sua primeira redação.",
};

export function buildStudentInvitationEmailHtml({
  studentName,
  signupUrl,
}: BuildStudentInvitationEmailParams) {
  const safeStudentName = escapeHtml(studentName);

  return buildEmailLayout({
    eyebrow: "BEM-VINDO(A) AO PROJETO 1000",
    title: `${safeStudentName}, sua jornada começa agora!`,
    preheader: studentInvitationEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Seu cadastro no Projeto 1000 já foi criado e falta só um passo para você começar.
      </p>

      <p style="margin: 0 0 16px 0;">
        Ao finalizar seu acesso, você recebe <strong>1 crédito gratuito</strong> para testar a plataforma e enviar sua primeira redação.
      </p>

      <p style="margin: 0;">
        É a sua chance de conhecer na prática como funciona a correção e entender exatamente onde você pode evoluir.
      </p>
    `,

    action: {
      label: "Finalizar meu cadastro",
      url: signupUrl,
    },

    extraContentHtml: `
      <table
        role="presentation"
        border="0"
        cellpadding="0"
        cellspacing="0"
        width="100%"
        style="margin-bottom: 20px;"
      >
        <tr>
          <td
            style="
              padding: 22px 24px;
              background-color: #fff8db;
              border: 1px solid #f7d96b;
              border-radius: 12px;
            "
          >
            <p
              style="
                margin: 0 0 6px 0;
                color: #9a6700;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.8px;
                text-transform: uppercase;
              "
            >
              Seu primeiro crédito é por nossa conta
            </p>

            <p
              style="
                margin: 0 0 8px 0;
                color: #111827;
                font-size: 18px;
                font-weight: 800;
              "
            >
              Você começa com 1 crédito gratuito
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              Use esse crédito para enviar sua primeira redação e experimentar a correção completa do Projeto 1000.
            </p>
          </td>
        </tr>
      </table>

      <table
        role="presentation"
        border="0"
        cellpadding="0"
        cellspacing="0"
        width="100%"
        style="
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
        "
      >
        <tr>
          <td style="padding: 22px 24px;">
            <p
              style="
                margin: 0 0 14px 0;
                color: #1d4ed8;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.8px;
                text-transform: uppercase;
              "
            >
              Como funciona
            </p>

            <table
              role="presentation"
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
            >
              <tr>
                <td valign="top" width="32" style="padding: 0 0 14px 0;">
                  <div
                    style="
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background-color: #dbeafe;
                      color: #1d4ed8;
                      font-size: 12px;
                      font-weight: 700;
                      line-height: 24px;
                      text-align: center;
                    "
                  >
                    1
                  </div>
                </td>

                <td
                  valign="top"
                  style="
                    padding: 0 0 14px 8px;
                    color: #4b5563;
                    font-size: 13px;
                    line-height: 1.6;
                  "
                >
                  <strong style="color: #111827;">
                    Finalize seu cadastro
                  </strong><br>
                  Crie sua senha e acesse sua conta.
                </td>
              </tr>

              <tr>
                <td valign="top" width="32" style="padding: 0 0 14px 0;">
                  <div
                    style="
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background-color: #dbeafe;
                      color: #1d4ed8;
                      font-size: 12px;
                      font-weight: 700;
                      line-height: 24px;
                      text-align: center;
                    "
                  >
                    2
                  </div>
                </td>

                <td
                  valign="top"
                  style="
                    padding: 0 0 14px 8px;
                    color: #4b5563;
                    font-size: 13px;
                    line-height: 1.6;
                  "
                >
                  <strong style="color: #111827;">
                    Escolha um tema
                  </strong><br>
                  Acesse as propostas disponíveis e escolha uma para começar.
                </td>
              </tr>

              <tr>
                <td valign="top" width="32">
                  <div
                    style="
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background-color: #dbeafe;
                      color: #1d4ed8;
                      font-size: 12px;
                      font-weight: 700;
                      line-height: 24px;
                      text-align: center;
                    "
                  >
                    3
                  </div>
                </td>

                <td
                  valign="top"
                  style="
                    padding: 0 0 0 8px;
                    color: #4b5563;
                    font-size: 13px;
                    line-height: 1.6;
                  "
                >
                  <strong style="color: #111827;">
                    Envie e acompanhe sua evolução
                  </strong><br>
                  Use seu crédito gratuito, envie a redação e depois acompanhe sua correção completa pela plataforma.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque seu cadastro foi criado por um administrador do Projeto 1000. Se você não reconhece este convite, pode ignorar esta mensagem.",
  });
}

export function buildStudentInvitationEmailText({
  studentName,
  signupUrl,
}: BuildStudentInvitationEmailParams) {
  return `Olá, ${studentName}!

Sua jornada no Projeto 1000 começa agora!

Seu cadastro já foi criado e falta só um passo para você começar.

Ao finalizar seu acesso, você recebe 1 crédito gratuito para testar a plataforma e enviar sua primeira redação.

Como funciona:

1. Finalize seu cadastro
Crie sua senha e acesse sua conta.

2. Escolha um tema
Acesse as propostas disponíveis e escolha uma para começar.

3. Envie e acompanhe sua evolução
Use seu crédito gratuito, envie sua redação e depois acompanhe sua correção completa pela plataforma.

Finalize seu cadastro:
${signupUrl}

Equipe Projeto 1000`;
}
