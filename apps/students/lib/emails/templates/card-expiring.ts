import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildCardExpiringEmailParams {
  firstName: string;
  cardBrand: string;
  lastFourDigits: string;
  expiration: string;
  paymentMethodsUrl: string;
}

export const cardExpiringEmail = {
  subject: "Seu cartão está perto de vencer",
  preheader: "Atualize sua forma de pagamento para evitar problemas nas próximas renovações.",
};

export function buildCardExpiringEmailHtml({
  firstName,
  cardBrand,
  lastFourDigits,
  expiration,
  paymentMethodsUrl,
}: BuildCardExpiringEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeCardBrand = escapeHtml(cardBrand);
  const safeLastFourDigits = escapeHtml(lastFourDigits);
  const safeExpiration = escapeHtml(expiration);

  return buildEmailLayout({
    eyebrow: "FORMA DE PAGAMENTO",
    title: `${safeFirstName}, seu cartão está perto de vencer`,
    preheader: cardExpiringEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        O cartão <strong>${safeCardBrand} •••• ${safeLastFourDigits}</strong>,
        usado nas renovações da sua assinatura, vence em breve.
      </p>

      <p style="margin:0;">
        Para evitar que uma próxima cobrança seja recusada, vale atualizar
        sua forma de pagamento antes da renovação.
      </p>
    `,

    action: {
      label: "Atualizar meu cartão",
      url: paymentMethodsUrl,
    },

    extraContentHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#fff8e6;border-radius:12px;border:1px solid #f7c325;">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.6;">
              Validade do cartão: <strong>${safeExpiration}</strong>.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque um cartão utilizado na sua assinatura está próximo do vencimento.",
  });
}

export function buildCardExpiringEmailText({
  firstName,
  cardBrand,
  lastFourDigits,
  expiration,
  paymentMethodsUrl,
}: BuildCardExpiringEmailParams) {
  return `Olá, ${firstName}!

Seu cartão ${cardBrand} •••• ${lastFourDigits} está perto de vencer.

Validade: ${expiration}

Atualize sua forma de pagamento para evitar problemas nas próximas renovações:

${paymentMethodsUrl}

Equipe Projeto 1000`;
}
