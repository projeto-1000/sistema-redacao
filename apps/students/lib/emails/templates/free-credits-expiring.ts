import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildFreeCreditsExpiringEmailParams {
  firstName: string;
  credits: number;
  expiresAt: string;
  essaysUrl: string;
}

export const freeCreditsExpiringEmail = {
  subject: "Seu crédito gratuito está quase expirando 👀",
  preheader:
    "Você ainda tem crédito disponível para enviar sua redação. Aproveite antes que ele expire.",
};

export function buildFreeCreditsExpiringEmailHtml({
  firstName,
  credits,
  expiresAt,
  essaysUrl,
}: BuildFreeCreditsExpiringEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeExpiresAt = escapeHtml(expiresAt);

  const creditLabel = credits === 1 ? "crédito gratuito" : "créditos gratuitos";

  return buildEmailLayout({
    eyebrow: "SEUS CRÉDITOS",
    title: `${safeFirstName}, ainda dá tempo de aproveitar!`,
    preheader: freeCreditsExpiringEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Você ainda tem <strong>${credits} ${creditLabel}</strong> disponível
        no Projeto 1000 — mas ele está chegando perto da data de expiração.
      </p>

      <p style="margin: 0 0 16px 0;">
        Esse crédito é sua chance de enviar uma redação, receber uma correção
        completa e entender exatamente o que já está funcionando no seu texto
        e o que precisa melhorar.
      </p>

      <p style="margin: 0;">
        Se você estava esperando um empurrãozinho para começar,
        pode considerar esse e-mail como ele. 😄
      </p>
    `,

    action: {
      label: "Escolher um tema e escrever",
      url: essaysUrl,
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
              Fique de olho na data
            </p>

            <p
              style="
                margin: 0 0 8px 0;
                color: #111827;
                font-size: 16px;
                font-weight: 700;
              "
            >
              ${credits} ${creditLabel} disponível
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              ${credits === 1 ? "Ele expira" : "Eles expiram"}
              em <strong>${safeExpiresAt}</strong>.
              Depois dessa data, ${credits === 1 ? "o crédito não poderá" : "os créditos não poderão"}
              mais ser usado${credits === 1 ? "" : "s"}.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque possui crédito gratuito próximo da data de expiração no Projeto 1000.",
  });
}

export function buildFreeCreditsExpiringEmailText({
  firstName,
  credits,
  expiresAt,
  essaysUrl,
}: BuildFreeCreditsExpiringEmailParams) {
  const creditLabel = credits === 1 ? "crédito gratuito" : "créditos gratuitos";

  return `Olá, ${firstName}!

Você ainda tem ${credits} ${creditLabel} disponível no Projeto 1000 — mas ele está chegando perto da data de expiração.

Esse crédito é sua chance de enviar uma redação, receber uma correção completa e entender exatamente o que já está funcionando no seu texto e o que precisa melhorar.

Se você estava esperando um empurrãozinho para começar, pode considerar esse e-mail como ele. 😄

${credits === 1 ? "Ele expira" : "Eles expiram"} em ${expiresAt}.

Escolher um tema e escrever:
${essaysUrl}

Equipe Projeto 1000`;
}
