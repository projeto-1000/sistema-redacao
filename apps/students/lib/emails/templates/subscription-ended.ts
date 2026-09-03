import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildSubscriptionEndedEmailParams {
  firstName: string;
  planName: string;
  plansUrl: string;
}

export const subscriptionEndedEmail = {
  subject: "Sua assinatura foi encerrada",
  preheader: "O período do seu plano chegou ao fim e sua assinatura já está encerrada.",
};

export function buildSubscriptionEndedEmailHtml({
  firstName,
  planName,
  plansUrl,
}: BuildSubscriptionEndedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePlanName = escapeHtml(planName);

  return buildEmailLayout({
    eyebrow: "ASSINATURA ENCERRADA",
    title: `${safeFirstName}, seu plano chegou ao fim`,
    preheader: subscriptionEndedEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        O período ativo do seu plano <strong>${safePlanName}</strong> terminou
        e sua assinatura está encerrada.
      </p>

      <p style="margin:0 0 16px;">
        Não haverá novas cobranças referentes a essa assinatura.
      </p>

      <p style="margin:0;">
        E, se quiser voltar depois, suas próximas redações continuam te esperando por aqui. 💙
      </p>
    `,

    action: {
      label: "Ver opções de plano",
      url: plansUrl,
    },

    footerText: "Você recebeu este e-mail porque sua assinatura do Projeto 1000 chegou ao fim.",
  });
}

export function buildSubscriptionEndedEmailText({
  firstName,
  planName,
  plansUrl,
}: BuildSubscriptionEndedEmailParams) {
  return `Olá, ${firstName}!

O período ativo do seu plano ${planName} terminou e sua assinatura está encerrada.

Não haverá novas cobranças referentes a essa assinatura.

Se quiser voltar:
${plansUrl}

Equipe Projeto 1000`;
}
