import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildCreditsDepletedEmailParams {
  firstName: string;
  plansUrl: string;
  hasActiveSubscription: boolean;
  nextCreditsAt?: string;
}

export const creditsDepletedEmail = {
  subject: "Você usou todos os seus créditos",
  preheader:
    "Seu saldo chegou a zero. Veja quando recebe novos créditos ou confira as opções disponíveis.",
};

export function buildCreditsDepletedEmailHtml({
  firstName,
  plansUrl,
  hasActiveSubscription,
  nextCreditsAt,
}: BuildCreditsDepletedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeNextCreditsAt = nextCreditsAt ? escapeHtml(nextCreditsAt) : null;

  return buildEmailLayout({
    eyebrow: "SEUS CRÉDITOS",
    title: `${safeFirstName}, você usou todos os seus créditos`,
    preheader: creditsDepletedEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        Seu saldo disponível chegou a <strong>zero</strong>.
      </p>

      ${
        hasActiveSubscription
          ? `<p style="margin:0;">
              Seu plano continua ativo normalmente.
              ${
                safeNextCreditsAt
                  ? `Novos créditos serão liberados no próximo ciclo, em <strong>${safeNextCreditsAt}</strong>.`
                  : "Novos créditos serão liberados no próximo ciclo."
              }
            </p>`
          : `<p style="margin:0;">
              Para enviar novas redações, você pode escolher um plano e continuar sua evolução no Projeto 1000.
            </p>`
      }
    `,

    action: {
      label: hasActiveSubscription ? "Ver meu plano" : "Conhecer os planos",
      url: plansUrl,
    },

    footerText:
      "Você recebeu este e-mail porque o saldo de créditos disponível na sua conta chegou a zero.",
  });
}

export function buildCreditsDepletedEmailText({
  firstName,
  plansUrl,
  hasActiveSubscription,
  nextCreditsAt,
}: BuildCreditsDepletedEmailParams) {
  return `Olá, ${firstName}!

Você usou todos os seus créditos disponíveis.

${
  hasActiveSubscription
    ? `Seu plano continua ativo. ${
        nextCreditsAt
          ? `Novos créditos serão liberados em ${nextCreditsAt}.`
          : "Novos créditos serão liberados no próximo ciclo."
      }`
    : "Para enviar novas redações, escolha um plano."
}

${plansUrl}

Equipe Projeto 1000`;
}
