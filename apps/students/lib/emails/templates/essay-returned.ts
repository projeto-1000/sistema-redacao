import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildEssayReturnedEmailParams {
  firstName: string;
  essayTitle: string;
  reason: string;
  essayUrl: string;
  creditReturned: boolean;
}

export const essayReturnedEmail = {
  subject: "Precisamos que você ajuste sua redação antes da correção",
  preheader:
    "Não conseguimos seguir com a correção dessa vez. Veja o que precisa ser ajustado para enviar novamente.",
};

export function buildEssayReturnedEmailHtml({
  firstName,
  essayTitle,
  reason,
  essayUrl,
  creditReturned,
}: BuildEssayReturnedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeEssayTitle = escapeHtml(essayTitle);
  const safeReason = escapeHtml(reason);

  return buildEmailLayout({
    eyebrow: "AÇÃO NECESSÁRIA",
    title: `${safeFirstName}, sua redação voltou para você`,
    preheader: essayReturnedEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        A gente recebeu sua redação sobre <strong>${safeEssayTitle}</strong>,
        mas não conseguiu seguir com a correção dessa vez.
      </p>

      <p style="margin: 0;">
        Fica tranquilo: abaixo mostramos o motivo para você ajustar o que for necessário
        e enviar novamente.
      </p>
    `,

    action: {
      label: "Ver minha redação",
      url: essayUrl,
    },

    extraContentHtml: `
      <table
        role="presentation"
        border="0"
        cellpadding="0"
        cellspacing="0"
        width="100%"
        style="
          background-color: #fff8e6;
          border-radius: 12px;
          border: 1px solid #f7c325;
          margin-bottom: 16px;
        "
      >
        <tr>
          <td style="padding: 22px 24px;">
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
              O que aconteceu?
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              ${safeReason}
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
              Sobre seu crédito
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              ${
                creditReturned
                  ? "O crédito usado nesse envio foi devolvido para sua conta e já pode ser usado novamente."
                  : "O crédito usado nesse envio não foi devolvido. Consulte os detalhes na plataforma."
              }
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque uma redação enviada por você precisou ser devolvida antes da correção no Projeto 1000.",
  });
}

export function buildEssayReturnedEmailText({
  firstName,
  essayTitle,
  reason,
  essayUrl,
  creditReturned,
}: BuildEssayReturnedEmailParams) {
  return `Olá, ${firstName}!

Sua redação sobre "${essayTitle}" voltou para você.

Não conseguimos seguir com a correção dessa vez.

Motivo:
${reason}

${
  creditReturned
    ? "O crédito usado nesse envio foi devolvido para sua conta e já pode ser usado novamente."
    : "O crédito usado nesse envio não foi devolvido. Consulte os detalhes na plataforma."
}

Veja os detalhes e faça os ajustes necessários:
${essayUrl}

Equipe Projeto 1000`;
}
