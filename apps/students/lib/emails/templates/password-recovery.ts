import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildPasswordRecoveryEmailParams {
  resetPasswordUrl: string;
  expiresInMinutes?: number;
}

export const passwordRecoveryEmail = {
  subject: "Redefinição de senha do Projeto 1000",
  preheader: "Use o link deste e-mail para criar uma nova senha para sua conta.",
};

export function buildPasswordRecoveryEmailHtml({
  resetPasswordUrl,
  expiresInMinutes = 60,
}: BuildPasswordRecoveryEmailParams) {
  const safeExpiresInMinutes = escapeHtml(String(expiresInMinutes));

  return buildEmailLayout({
    eyebrow: "RECUPERAÇÃO DE SENHA",
    title: "Crie uma nova senha",
    preheader: passwordRecoveryEmail.preheader,

    contentHtml: `
  <p style="margin: 0 0 16px 0;">
    Recebemos uma solicitação para redefinir a senha da sua conta no
    <strong>Projeto 1000</strong>.
  </p>

  <p style="margin: 0;">
    Para criar uma nova senha, clique no botão abaixo.
  </p>
`,

    action: {
      label: "Redefinir senha",
      url: resetPasswordUrl,
    },

    extraContentHtml: `
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
          Por segurança
        </p>

        <p
          style="
            margin: 0;
            color: #4b5563;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          Este link é válido por <strong>${safeExpiresInMinutes} minutos</strong>.
          Se você não solicitou a redefinição da senha, ignore este e-mail.
          Nenhuma alteração será feita na sua conta.
        </p>
      </td>
    </tr>
  </table>
`,

    footerText:
      "Você recebeu este e-mail porque foi solicitada uma redefinição de senha para sua conta no Projeto 1000.",
  });
}

export function buildPasswordRecoveryEmailText({
  resetPasswordUrl,
  expiresInMinutes = 60,
}: BuildPasswordRecoveryEmailParams) {
  return `
Recebemos uma solicitação para redefinir a senha da sua conta no Projeto 1000.

Se foi você, use o link abaixo para escolher uma nova senha e voltar para a plataforma:

${resetPasswordUrl}

Por segurança, este link fica disponível por ${expiresInMinutes} minutos.

Se você não pediu para trocar sua senha, pode ignorar este e-mail. Sua senha atual continua a mesma.

Equipe Projeto 1000`;
}
