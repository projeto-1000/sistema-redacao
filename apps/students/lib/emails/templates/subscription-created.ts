import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildSubscriptionCreatedEmailParams {
  firstName: string;
  planName: string;
  billingLabel: string;
  amount: string;
  credits: number;
  nextBillingAt: string;
  dashboardUrl: string;
}

export const subscriptionCreatedEmail = {
  subject: "Seu plano já está ativo 🎉",
  preheader: "Sua assinatura do Projeto 1000 foi confirmada e seus créditos já estão disponíveis.",
};

export function buildSubscriptionCreatedEmailHtml({
  firstName,
  planName,
  billingLabel,
  amount,
  credits,
  nextBillingAt,
  dashboardUrl,
}: BuildSubscriptionCreatedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePlanName = escapeHtml(planName);
  const safeBillingLabel = escapeHtml(billingLabel);
  const safeAmount = escapeHtml(amount);
  const safeNextBillingAt = escapeHtml(nextBillingAt);

  const creditLabel = credits === 1 ? "crédito" : "créditos";

  return buildEmailLayout({
    eyebrow: "PLANO ATIVADO",
    title: `${safeFirstName}, seu plano já está valendo!`,
    preheader: subscriptionCreatedEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Deu tudo certo com sua assinatura do plano <strong>${safePlanName}</strong>.
      </p>

      <p style="margin: 0 0 16px 0;">
        Seus <strong>${credits} ${creditLabel}</strong> já estão disponíveis para você
        continuar treinando, enviando redações e acompanhando sua evolução.
      </p>

      <p style="margin: 0;">
        Agora é só escolher o próximo tema e colocar a escrita em prática.
      </p>
    `,

    action: {
      label: "Acessar minha conta",
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
              Resumo da assinatura
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Plano: <strong>${safePlanName}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Cobrança: <strong>${safeBillingLabel}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Valor: <strong>${safeAmount}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Créditos liberados: <strong>${credits}</strong>
            </p>

            <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Próxima cobrança: <strong>${safeNextBillingAt}</strong>
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque uma assinatura do Projeto 1000 foi ativada na sua conta.",
  });
}

export function buildSubscriptionCreatedEmailText({
  firstName,
  planName,
  billingLabel,
  amount,
  credits,
  nextBillingAt,
  dashboardUrl,
}: BuildSubscriptionCreatedEmailParams) {
  return `Olá, ${firstName}!

Seu plano ${planName} já está ativo!

Deu tudo certo com sua assinatura e seus ${credits} créditos já estão disponíveis para uso.

Resumo da assinatura:
Plano: ${planName}
Cobrança: ${billingLabel}
Valor: ${amount}
Créditos liberados: ${credits}
Próxima cobrança: ${nextBillingAt}

Acessar minha conta:
${dashboardUrl}

Equipe Projeto 1000`;
}
