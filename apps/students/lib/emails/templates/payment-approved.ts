import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildPaymentApprovedEmailParams {
  firstName: string;
  planName: string;
  amount: string;
  creditsAdded: number;
  paidAt: string;
  nextBillingAt: string;
  dashboardUrl: string;
}

export const paymentApprovedEmail = {
  subject: "Pagamento aprovado! Seus créditos já chegaram 💙",
  preheader: "Sua renovação foi confirmada e os novos créditos já estão disponíveis na sua conta.",
};

export function buildPaymentApprovedEmailHtml({
  firstName,
  planName,
  amount,
  creditsAdded,
  paidAt,
  nextBillingAt,
  dashboardUrl,
}: BuildPaymentApprovedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePlanName = escapeHtml(planName);
  const safeAmount = escapeHtml(amount);
  const safePaidAt = escapeHtml(paidAt);
  const safeNextBillingAt = escapeHtml(nextBillingAt);

  const creditLabel = creditsAdded === 1 ? "crédito" : "créditos";

  return buildEmailLayout({
    eyebrow: "PAGAMENTO APROVADO",
    title: `${safeFirstName}, está tudo certo com seu plano`,
    preheader: paymentApprovedEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Seu pagamento do plano <strong>${safePlanName}</strong> foi aprovado
        e seu novo ciclo já começou.
      </p>

      <p style="margin: 0 0 16px 0;">
        Adicionamos <strong>${creditsAdded} ${creditLabel}</strong> à sua conta,
        então você já pode continuar treinando sem perder o ritmo.
      </p>

      <p style="margin: 0;">
        Bora para a próxima redação?
      </p>
    `,

    action: {
      label: "Usar meus créditos",
      url: dashboardUrl,
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
                margin: 0 0 12px 0;
                color: #1d4ed8;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.8px;
                text-transform: uppercase;
              "
            >
              Resumo do pagamento
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Plano: <strong>${safePlanName}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Valor: <strong>${safeAmount}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Pagamento confirmado em: <strong>${safePaidAt}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Créditos adicionados: <strong>${creditsAdded}</strong>
            </p>

            <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Próxima cobrança: <strong>${safeNextBillingAt}</strong>
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque um pagamento da sua assinatura do Projeto 1000 foi aprovado.",
  });
}

export function buildPaymentApprovedEmailText({
  firstName,
  planName,
  amount,
  creditsAdded,
  paidAt,
  nextBillingAt,
  dashboardUrl,
}: BuildPaymentApprovedEmailParams) {
  return `Olá, ${firstName}!

Seu pagamento do plano ${planName} foi aprovado e seu novo ciclo já começou.

Adicionamos ${creditsAdded} créditos à sua conta.

Resumo do pagamento:
Plano: ${planName}
Valor: ${amount}
Pagamento confirmado em: ${paidAt}
Créditos adicionados: ${creditsAdded}
Próxima cobrança: ${nextBillingAt}

Usar meus créditos:
${dashboardUrl}

Equipe Projeto 1000`;
}
