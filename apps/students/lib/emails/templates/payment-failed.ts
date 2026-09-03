import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildPaymentFailedEmailParams {
  firstName: string;
  planName: string;
  amount: string;
  billingAttemptAt: string;
  paymentSettingsUrl: string;
}

export const paymentFailedEmail = {
  subject: "Não conseguimos concluir sua renovação",
  preheader:
    "Houve um problema com o pagamento do seu plano. Confira sua forma de pagamento para continuar usando o Projeto 1000.",
};

export function buildPaymentFailedEmailHtml({
  firstName,
  planName,
  amount,
  billingAttemptAt,
  paymentSettingsUrl,
}: BuildPaymentFailedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePlanName = escapeHtml(planName);
  const safeAmount = escapeHtml(amount);
  const safeBillingAttemptAt = escapeHtml(billingAttemptAt);

  return buildEmailLayout({
    eyebrow: "PAGAMENTO NÃO APROVADO",
    title: `${safeFirstName}, tivemos um problema com sua renovação`,
    preheader: paymentFailedEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Tentamos processar a renovação do seu plano
        <strong>${safePlanName}</strong>, mas o pagamento não foi aprovado.
      </p>

      <p style="margin: 0 0 16px 0;">
        Isso pode acontecer por vários motivos, como limite insuficiente,
        dados do cartão ou uma recusa temporária da operadora.
      </p>

      <p style="margin: 0;">
        Dá uma olhada na sua forma de pagamento para deixar tudo certo e
        continuar usando seus créditos normalmente.
      </p>
    `,

    action: {
      label: "Conferir forma de pagamento",
      url: paymentSettingsUrl,
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
                margin: 0 0 10px 0;
                color: #9a6700;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.8px;
                text-transform: uppercase;
              "
            >
              Tentativa de cobrança
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Plano: <strong>${safePlanName}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Valor: <strong>${safeAmount}</strong>
            </p>

            <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Tentativa realizada em: <strong>${safeBillingAttemptAt}</strong>
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque não foi possível aprovar um pagamento da sua assinatura do Projeto 1000.",
  });
}

export function buildPaymentFailedEmailText({
  firstName,
  planName,
  amount,
  billingAttemptAt,
  paymentSettingsUrl,
}: BuildPaymentFailedEmailParams) {
  return `Olá, ${firstName}!

Tentamos processar a renovação do seu plano ${planName}, mas o pagamento não foi aprovado.

Isso pode acontecer por vários motivos, como limite insuficiente, dados do cartão ou uma recusa temporária da operadora.

Confira sua forma de pagamento para deixar tudo certo e continuar usando seus créditos normalmente.

Plano: ${planName}
Valor: ${amount}
Tentativa realizada em: ${billingAttemptAt}

Conferir forma de pagamento:
${paymentSettingsUrl}

Equipe Projeto 1000`;
}
