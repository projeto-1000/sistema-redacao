import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildSubscriptionCancelledEmailParams {
  firstName: string;
  planName: string;
  accessUntil: string;
  subscriptionUrl: string;
}

export const subscriptionCancelledEmail = {
  subject: "Seu cancelamento foi confirmado",
  preheader:
    "Sua assinatura não será renovada. Você ainda pode usar o plano até o fim do ciclo atual.",
};

export function buildSubscriptionCancelledEmailHtml({
  firstName,
  planName,
  accessUntil,
  subscriptionUrl,
}: BuildSubscriptionCancelledEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePlanName = escapeHtml(planName);
  const safeAccessUntil = escapeHtml(accessUntil);

  return buildEmailLayout({
    eyebrow: "ASSINATURA CANCELADA",
    title: `${safeFirstName}, seu cancelamento foi confirmado`,
    preheader: subscriptionCancelledEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Recebemos o cancelamento do seu plano <strong>${safePlanName}</strong>.
      </p>

      <p style="margin: 0 0 16px 0;">
        A partir de agora, não serão feitas novas renovações automáticas dessa assinatura.
      </p>

      <p style="margin: 0;">
        Mas você ainda pode continuar usando o Projeto 1000 normalmente até o fim do seu ciclo atual.
      </p>
    `,

    action: {
      label: "Ver minha assinatura",
      url: subscriptionUrl,
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
              Até quando posso usar?
            </p>

            <p
              style="
                margin: 0 0 8px 0;
                color: #111827;
                font-size: 16px;
                font-weight: 700;
              "
            >
              Seu acesso continua até ${safeAccessUntil}
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              Até essa data, você continua com os benefícios e condições do seu plano atual.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque uma assinatura do Projeto 1000 foi cancelada na sua conta.",
  });
}

export function buildSubscriptionCancelledEmailText({
  firstName,
  planName,
  accessUntil,
  subscriptionUrl,
}: BuildSubscriptionCancelledEmailParams) {
  return `Olá, ${firstName}!

Seu cancelamento foi confirmado.

Recebemos o cancelamento do seu plano ${planName}. A partir de agora, não serão feitas novas renovações automáticas dessa assinatura.

Você ainda pode continuar usando o Projeto 1000 normalmente até ${accessUntil}.

Ver minha assinatura:
${subscriptionUrl}

Equipe Projeto 1000`;
}
