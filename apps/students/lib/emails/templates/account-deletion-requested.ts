import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildAccountDeletionRequestedEmailParams {
  requestedAt: string;
  supportUrl: string;
}

export const accountDeletionRequestedEmail = {
  subject: "Recebemos sua solicitação de exclusão de conta",
  preheader: "Sua solicitação foi registrada. Confira as informações sobre o processo de exclusão.",
};

export function buildAccountDeletionRequestedEmailHtml({
  requestedAt,
  supportUrl,
}: BuildAccountDeletionRequestedEmailParams) {
  const safeRequestedAt = escapeHtml(requestedAt);

  return buildEmailLayout({
    eyebrow: "EXCLUSÃO DA CONTA",
    title: "Recebemos sua solicitação",
    preheader: accountDeletionRequestedEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        Recebemos sua solicitação para excluir sua conta do
        <strong>Projeto 1000</strong>.
      </p>

      <p style="margin:0;">
        O pedido foi registrado e seguirá o processo de exclusão dos seus dados,
        respeitando as informações que precisamos manter quando houver obrigação legal.
      </p>
    `,

    action: {
      label: "Falar com o suporte",
      url: supportUrl,
    },

    extraContentHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0;color:#4b5563;font-size:13px;">
              Solicitação registrada em <strong>${safeRequestedAt}</strong>.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque foi solicitada a exclusão da sua conta no Projeto 1000.",
  });
}

export function buildAccountDeletionRequestedEmailText({
  requestedAt,
  supportUrl,
}: BuildAccountDeletionRequestedEmailParams) {
  return `Recebemos sua solicitação para excluir sua conta do Projeto 1000.

Solicitação registrada em: ${requestedAt}

Se precisar falar com a gente:
${supportUrl}

Equipe Projeto 1000`;
}
