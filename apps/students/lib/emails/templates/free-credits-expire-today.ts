import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildFreeCreditsExpireTodayEmailParams {
  firstName: string;
  credits: number;
  essaysUrl: string;
}

export const freeCreditsExpireTodayEmail = {
  subject: "Seu crédito gratuito expira hoje ⏰",
  preheader: "Último dia para aproveitar seu crédito gratuito e enviar uma redação para correção.",
};

export function buildFreeCreditsExpireTodayEmailHtml({
  firstName,
  credits,
  essaysUrl,
}: BuildFreeCreditsExpireTodayEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const creditLabel = credits === 1 ? "crédito" : "créditos";

  return buildEmailLayout({
    eyebrow: "ÚLTIMO DIA",
    title: `${safeFirstName}, seu ${creditLabel} gratuito expira hoje`,
    preheader: freeCreditsExpireTodayEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        Passando para um último lembrete: você ainda tem
        <strong>${credits} ${creditLabel} gratuito${credits === 1 ? "" : "s"}</strong>
        disponível${credits === 1 ? "" : "is"} na sua conta.
      </p>

      <p style="margin:0;">
        Se ainda tem uma redação para colocar no papel, hoje é o último dia
        para usar ${credits === 1 ? "esse crédito" : "esses créditos"}.
      </p>
    `,

    action: {
      label: "Usar meu crédito agora",
      url: essaysUrl,
    },

    extraContentHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#fff8e6;border-radius:12px;border:1px solid #f7c325;">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0 0 6px;color:#9a6700;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;">
              Última chance
            </p>
            <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.6;">
              Depois de hoje, ${credits === 1 ? "esse crédito expira" : "esses créditos expiram"}
              e não ${credits === 1 ? "poderá" : "poderão"} mais ser utilizado${credits === 1 ? "" : "s"}.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque possui crédito gratuito que expira hoje no Projeto 1000.",
  });
}

export function buildFreeCreditsExpireTodayEmailText({
  firstName,
  credits,
  essaysUrl,
}: BuildFreeCreditsExpireTodayEmailParams) {
  return `Olá, ${firstName}!

Seu crédito gratuito expira hoje.

Você ainda tem ${credits} crédito(s) gratuito(s) disponível(is).

Depois de hoje, os créditos não utilizados expiram.

Usar meu crédito agora:
${essaysUrl}

Equipe Projeto 1000`;
}
