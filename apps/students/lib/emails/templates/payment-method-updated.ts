import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildPaymentMethodUpdatedEmailParams {
  cardBrand: string;
  lastFourDigits: string;
  updatedAt: string;
  paymentMethodsUrl: string;
}

export const paymentMethodUpdatedEmail = {
  subject: "Seu cartão padrão foi atualizado",
  preheader: "Confirmamos uma alteração na forma de pagamento da sua conta do Projeto 1000.",
};

export function buildPaymentMethodUpdatedEmailHtml({
  cardBrand,
  lastFourDigits,
  updatedAt,
  paymentMethodsUrl,
}: BuildPaymentMethodUpdatedEmailParams) {
  const safeCardBrand = escapeHtml(cardBrand);
  const safeLastFourDigits = escapeHtml(lastFourDigits);
  const safeUpdatedAt = escapeHtml(updatedAt);

  return buildEmailLayout({
    eyebrow: "FORMA DE PAGAMENTO",
    title: "Seu cartão padrão foi atualizado",
    preheader: paymentMethodUpdatedEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        A forma de pagamento padrão da sua conta no
        <strong>Projeto 1000</strong> foi atualizada com sucesso.
      </p>

      <p style="margin:0;">
        As próximas cobranças da sua assinatura passarão a utilizar esse cartão.
      </p>
    `,

    action: {
      label: "Ver meus cartões",
      url: paymentMethodsUrl,
    },

    extraContentHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0 0 8px;color:#4b5563;font-size:13px;">
              Cartão: <strong>${safeCardBrand} •••• ${safeLastFourDigits}</strong>
            </p>
            <p style="margin:0;color:#4b5563;font-size:13px;">
              Atualizado em: <strong>${safeUpdatedAt}</strong>
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque a forma de pagamento padrão da sua conta foi atualizada.",
  });
}

export function buildPaymentMethodUpdatedEmailText({
  cardBrand,
  lastFourDigits,
  updatedAt,
  paymentMethodsUrl,
}: BuildPaymentMethodUpdatedEmailParams) {
  return `Seu cartão padrão foi atualizado.

Cartão: ${cardBrand} •••• ${lastFourDigits}
Atualizado em: ${updatedAt}

As próximas cobranças da assinatura utilizarão esse cartão.

${paymentMethodsUrl}

Equipe Projeto 1000`;
}
