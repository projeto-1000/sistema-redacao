import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildSubscriptionReactivatedEmailParams {
  firstName: string;
  planName: string;
  nextBillingAt: string;
  subscriptionUrl: string;
}

export const subscriptionReactivatedEmail = {
  subject: "Sua assinatura está ativa novamente 🎉",
  preheader: "Sua reativação foi concluída e o plano continua normalmente no Projeto 1000.",
};

export function buildSubscriptionReactivatedEmailHtml({
  firstName,
  planName,
  nextBillingAt,
  subscriptionUrl,
}: BuildSubscriptionReactivatedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePlanName = escapeHtml(planName);
  const safeNextBillingAt = escapeHtml(nextBillingAt);

  return buildEmailLayout({
    eyebrow: "ASSINATURA REATIVADA",
    title: `${safeFirstName}, está tudo ativo de novo!`,
    preheader: subscriptionReactivatedEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        Sua assinatura do plano <strong>${safePlanName}</strong> foi reativada com sucesso.
      </p>

      <p style="margin:0;">
        A renovação automática voltou a ficar ativa e você pode seguir usando o Projeto 1000 normalmente.
      </p>
    `,

    action: {
      label: "Acessar minha assinatura",
      url: subscriptionUrl,
    },

    extraContentHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.6;">
              Próxima cobrança prevista para <strong>${safeNextBillingAt}</strong>.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText: "Você recebeu este e-mail porque sua assinatura do Projeto 1000 foi reativada.",
  });
}

export function buildSubscriptionReactivatedEmailText({
  firstName,
  planName,
  nextBillingAt,
  subscriptionUrl,
}: BuildSubscriptionReactivatedEmailParams) {
  return `Olá, ${firstName}!

Sua assinatura do plano ${planName} foi reativada.

Próxima cobrança: ${nextBillingAt}

${subscriptionUrl}

Equipe Projeto 1000`;
}
